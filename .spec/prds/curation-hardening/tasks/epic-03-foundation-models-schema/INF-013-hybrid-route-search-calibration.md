================================================================================
TASK: INF-013 - Hybrid Route Search Calibration
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
PRIORITY: P1
EFFORT: M
ESTIMATE: 120 minutes
AGENT: convex-implementer
ITERATION: 1

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** The current semantic search implementation (INF-006) has two limitations: (1) `findRoutesByIdentifier` is a full table scan that doesn't scale past 5k routes, and (2) there's no hybrid search that combines vector similarity with text fallback for queries like "dragon" that should match "Tail of the Dragon" but might not semantically align. Additionally, the waypoint-ready data shape needs a mutation to store community waypoint mentions.

**Why it matters:** Hybrid search is critical for UX — users expect text search to "just work" for route names, not just semantic similarity. The full table scan on `findRoutesByIdentifier` will become a performance bottleneck as the catalog grows. Community waypoint mentions need a dedicated mutation for the Waypoints PRD integration.

**Current state:** `convex/semanticSearch.ts` has `findRoutesByIdentifier` using `ctx.db.query("curated_routes").collect()` (full scan). No `findCandidateRoutesHybrid` entry point exists. No `addCommunityWaypointMention` mutation exists. Secondary indexes for name/highway lookup are missing.

**Desired state:** Convex schema gains `by_name_lower` and `by_highway_number` secondary indexes on `curated_routes`. `findRoutesByIdentifier` is refactored to use indexed queries. A new `findCandidateRoutesHybrid` function combines vector search with text fallback. A new `addCommunityWaypointMention` mutation stores waypoint references with route linkage.

**Architectural note:** This is part of the "hybrid search calibration" plan approved in `validated-whistling-journal.md`. The hybrid strategy runs vector search first, then supplements with text-based exact/prefix matches on name/highway/identifiers, deduping by routeId before returning. This ensures semantic relevance while preserving text search expectations.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Add by_name_lower and by_highway_number secondary indexes to curated_routes
MUST: Refactor findRoutesByIdentifier to use indexed queries (no full scan)
MUST: Create findCandidateRoutesHybrid entry point combining vector + text search
MUST: Create addCommunityWaypointMention mutation for waypoint storage
MUST: Deduplicate results in hybrid search (same route from both methods)
MUST: Maintain backward compatibility with existing findRoutesByIdentifier signature
NEVER: Remove or rename existing INF-006 functions
NEVER: Modify geospatialIndex.ts (viewport queries stay separate)
NEVER: Change vector search behavior in findCandidateRoutesByEmbedding
STRICTLY: Hybrid search returns union of vector + text results, deduped
STRICTLY: Secondary indexes are added via schema.ts modifications

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Add secondary indexes, refactor identifier search to use them, implement hybrid vector+text search, and provide a mutation for storing community waypoint mentions.

**Success state:** `findRoutesByIdentifier` uses indexed queries and scales past 5k routes. `findCandidateRoutesHybrid` returns semantic + text matches. `addCommunityWaypointMention` stores waypoint references with route linkage. Convex type check passes.

### Convex Schema Changes

**1. Secondary indexes for curated_routes**
```typescript
// In convex/schema.ts
curated_routes: defineTable({
  // ... existing fields ...
})
  .index("by_name_lower", ["nameLower"])  // NEW for fast name lookup
  .index("by_highway_number", ["highwayNumber"])  // NEW for highway lookup
  // ... existing indexes preserved ...
```

**Note:** The `nameLower` field should be added to the validator if it doesn't exist:
```typescript
// In convex/models/curated-routes.ts
const curatedRouteValidator = defineSchema({
  // ... existing fields ...
  nameLower: v.optional(v.string()),  // NEW: case-folded name for indexed search
});
```

### Function Changes

**2. Refactored findRoutesByIdentifier (indexed)**
```typescript
// In convex/semanticSearch.ts
export const findRoutesByIdentifier = query({
  args: {
    identifier: v.string(),
    stateFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const lowered = args.identifier.toLowerCase();

    // Strategy 1: Exact name match (indexed)
    const nameMatches = await ctx.db
      .query("curated_routes")
      .withIndex("by_name_lower")
      .filter((q) =>
        q.eq(q.field("nameLower"), lowered) &&
        (!args.stateFilter || q.eq(q.field("state"), args.stateFilter))
      )
      .take(limit);

    if (nameMatches.length >= limit) {
      return nameMatches.map(toRouteRef);
    }

    // Strategy 2: Highway number match (indexed)
    const highwayMatches = await ctx.db
      .query("curated_routes")
      .withIndex("by_highway_number")
      .filter((q) =>
        q.eq(q.field("highwayNumber"), lowered) &&
        (!args.stateFilter || q.eq(q.field("state"), args.stateFilter))
      )
      .take(limit - nameMatches.length);

    // Strategy 3: candidateIdentifiers array-contains (fallback, not indexed)
    const remaining = limit - nameMatches.length - highwayMatches.length;
    const identifierMatches = remaining > 0
      ? await ctx.db
          .query("curated_routes")
          .filter((q) =>
            q.eq(q.field("state"), args.stateFilter ?? null) &&
            q.contains(q.field("candidateIdentifiers"), lowered)
          )
          .take(remaining * 5)  // Over-fetch then filter
      : [];

    const combined = [...nameMatches, ...highwayMatches, ...identifierMatches]
      .slice(0, limit)
      .map(toRouteRef);

    return combined;
  },
});
```

**3. New findCandidateRoutesHybrid entry point**
```typescript
// In convex/semanticSearch.ts
export const findCandidateRoutesHybrid = query({
  args: {
    embedding: v.array(v.number()),  // 1536-dim
    textQuery: v.optional(v.string()),  // Fallback text query
    stateFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Phase 1: Vector search (primary)
    const vectorResults = await ctx.vectorSearch("curated_routes", "by_embedding", {
      vector: args.embedding,
      limit: limit * 2,  // Over-fetch for dedupe
      filter: args.stateFilter
        ? (q) => q.eq("state", args.stateFilter)
        : undefined,
    });

    const routeIds = new Set(vectorResults.map((r) => r._id.toString()));

    // Phase 2: Text fallback (if provided)
    let textResults: Doc<"curated_routes">[] = [];
    if (args.textQuery) {
      textResults = await findRoutesByIdentifier(ctx, {
        identifier: args.textQuery,
        stateFilter: args.stateFilter,
        limit: limit * 2,
      });
    }

    // Phase 3: Merge and dedupe
    const merged = new Map<string, HybridRouteRef>();

    // Add vector results (with similarity scores)
    for (const vr of vectorResults) {
      const doc = await ctx.db.get(vr._id);
      if (doc) {
        merged.set(doc._id.toString(), {
          routeId: doc._id,
          name: doc.name,
          state: doc.state,
          matchType: "vector" as const,
          cosineSimilarity: vr._score,
        });
      }
    }

    // Add text results (boosted score for overlap)
    for (const tr of textResults) {
      const existing = merged.get(tr.routeId.toString());
      if (existing) {
        // Already in vector results — boost the score
        existing.matchType = "hybrid" as const;
        existing.cosineSimilarity = Math.min(1.0, existing.cosineSimilarity + 0.1);
      } else {
        // Only in text results — add with baseline score
        merged.set(tr.routeId.toString(), {
          routeId: tr.routeId,
          name: tr.name,
          state: tr.state,
          matchType: "text" as const,
          cosineSimilarity: 0.5,  // Baseline for text-only matches
        });
      }
    }

    // Sort by combined score and limit
    return Array.from(merged.values())
      .sort((a, b) => b.cosineSimilarity - a.cosineSimilarity)
      .slice(0, limit);
  },
});
```

**4. New addCommunityWaypointMention mutation**
```typescript
// In convex/semanticSearch.ts
export const addCommunityWaypointMention = mutation({
  args: {
    waypointId: v.string(),
    postId: v.string(),
    routeId: v.id("curated_routes"),
    waypointName: v.string(),
    waypointType: v.string(),
    context: v.string(),
    mentionedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // This will be used once the community_waypoint_mentions table exists
    // For now, we can either (a) add it to route_posts_raw payload or
    // (b) prepare for the table creation in a future schema migration
    //
    // Implementation option A: Store in route_posts_raw.payload
    const post = await ctx.db
      .query("route_posts_raw")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .first();

    if (!post) {
      throw new Error(`Post not found: ${args.postId}`);
    }

    const payload = post.payload as any;
    if (!payload.waypoint_mentions) {
      payload.waypoint_mentions = [];
    }
    payload.waypoint_mentions.push({
      waypoint_id: args.waypointId,
      waypoint_name: args.waypointName,
      waypoint_type: args.waypointType,
      context: args.context,
      route_id: args.routeId.toString(),
      mentioned_at: args.mentionedAt,
    });

    await ctx.db.patch(post._id, { payload });
    return { ok: true as const };
  },
});
```

### Type Definitions

```typescript
// In convex/semanticSearch.ts
type HybridRouteRef = {
  routeId: Id<"curated_routes">;
  name: string | null;
  state: string;
  matchType: "vector" | "text" | "hybrid";
  cosineSimilarity: number;
};

function toRouteRef(doc: Doc<"curated_routes">): {
  routeId: Id<"curated_routes">;
  name: string | null;
  state: string;
  matchType: "name" | "highway" | "identifier";
} {
  // Implementation for findRoutesByIdelper return type
  // ...
}
```

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Convex schema has by_name_lower and by_highway_number indexes
  GIVEN: The curated_routes table definition in convex/schema.ts
  WHEN: I inspect the indexes
  THEN: by_name_lower and by_highway_number indexes are defined

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/schema.inf013.test.ts
  TEST_FUNCTION: test_curated_routes_has_secondary_indexes

AC-2: findRoutesByIdentifier uses indexed queries
  GIVEN: The refactored findRoutesByIdentifier function
  WHEN: I inspect the query logic
  THEN: It uses .withIndex("by_name_lower") or .withIndex("by_highway_number") instead of .collect()

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/semanticSearch.test.ts
  TEST_FUNCTION: test_find_routes_by_identifier_uses_indexes

AC-3: findCandidateRoutesHybrid combines vector and text search
  GIVEN: A query with both embedding and textQuery
  WHEN: I call findCandidateRoutesHybrid
  THEN: Results include both vector matches (with similarity scores) and text matches, deduped by routeId

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/semanticSearch.test.ts
  TEST_FUNCTION: test_hybrid_search_combines_vector_and_text

AC-4: Hybrid search deduplicates overlapping results
  GIVEN: A route that appears in both vector and text results
  WHEN: I call findCandidateRoutesHybrid
  THEN: The route appears once with matchType="hybrid" and boosted cosineSimilarity

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/semanticSearch.test.ts
  TEST_FUNCTION: test_hybrid_search_dedupes_overlaps

AC-5: addCommunityWaypointMention mutation exists
  GIVEN: Need to store waypoint mentions from community posts
  WHEN: I call addCommunityWaypointMention with valid args
  THEN: The waypoint mention is stored and the mutation returns { ok: true }

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/semanticSearch.test.ts
  TEST_FUNCTION: test_add_community_waypoint_mention

AC-6: nameLower field added to curated_routes validator
  GIVEN: Need a case-folded name for indexed search
  WHEN: I inspect curatedRouteValidator
  THEN: It includes nameLower: v.optional(v.string())

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/schema.inf013.test.ts
  TEST_FUNCTION: test_curated_routes_has_name_lower_field

AC-7: Hybrid search sorts by combined relevance
  GIVEN: Mixed results (some vector-only, some text-only, some hybrid)
  WHEN: I call findCandidateRoutesHybrid
  THEN: Results are sorted by cosineSimilarity descending (hybrid boosted > vector > text)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/semanticSearch.test.ts
  TEST_FUNCTION: test_hybrid_search_sorts_by_relevance

AC-8: findRoutesByIdentifier backward compatible signature
  GIVEN: Existing code calling findRoutesByIdentifier(identifier, stateFilter?, limit?)
  WHEN: I call the refactored function
  THEN: It returns the same shape as before (routeId, name, state, matchType)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/semanticSearch.test.ts
  TEST_FUNCTION: test_find_routes_by_identifier_backward_compatible

Quality Criteria:
- [ ] Secondary indexes added for name and highway lookup
- [ ] No full table scans on findRoutesByIdentifier
- [ ] Hybrid search combines vector + text intelligently
- [ ] Deduplication prevents duplicate routes in results
- [ ] addCommunityWaypointMention stores waypoint references

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | by_name_lower index exists | AC-1 | `grep -q 'by_name_lower' convex/schema.ts && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 2 | by_highway_number index exists | AC-1 | `grep -q 'by_highway_number' convex/schema.ts && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 3 | nameLower field in validator | AC-6 | `grep -q 'nameLower' convex/models/curated-routes.ts && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 4 | findRoutesByIdentifier uses withIndex | AC-2 | `grep -A 20 'findRoutesByIdentifier' convex/semanticSearch.ts | grep -q 'withIndex' && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 5 | findCandidateRoutesHybrid exported | AC-3 | `grep -q 'export const findCandidateRoutesHybrid' convex/semanticSearch.ts && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 6 | addCommunityWaypointMention exported | AC-5 | `grep -q 'export const addCommunityWaypointMention' convex/semanticSearch.ts && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 7 | No .collect() on curated_routes in identifier search | AC-2 | `grep -A 30 'findRoutesByIdentifier' convex/semanticSearch.ts | grep -q '\.collect()' && echo FALSE || echo TRUE` | [ ] TRUE  [ ] FALSE |
| 8 | npx convex dev --once passes | All | Exit code 0 | [ ] TRUE  [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. convex/schema.ts (post INF-003)
   - Lines: curated_routes table definition
   - Focus: Existing indexes, where to add new ones

2. convex/semanticSearch.ts (post INF-006)
   - Lines: findRoutesByIdentifier, findCandidateRoutesByEmbedding
   - Focus: Current implementation, what needs refactoring

3. convex/models/curated-routes.ts
   - Lines: curatedRouteValidator
   - Focus: Where to add nameLower field

4. validated-whistling-journal.md (if available)
   - Lines: Hybrid search calibration section
   - Focus: Full context on the approved plan

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- convex/schema.ts (MODIFY - add secondary indexes)
- convex/models/curated-routes.ts (MODIFY - add nameLower field)
- convex/semanticSearch.ts (MODIFY - refactor findRoutesByIdentifier, add findCandidateRoutesHybrid, add addCommunityWaypointMention)
- convex/__tests__/schema.inf013.test.ts (CREATE)
- convex/__tests__/semanticSearch.test.ts (MODIFY - add tests for new functions)

WRITE-PROHIBITED:
- convex/geospatialIndex.ts - do NOT modify (viewport queries stay separate)
- convex/_generated/* - never modify generated code
- Any other Convex files outside semanticSearch.ts and schema.ts

MUST:
- [ ] Use .withIndex() for name and highway lookups
- [ ] Preserve backward compatibility of findRoutesByIdentifier
- [ ] Deduplicate results in hybrid search
- [ ] Boost cosineSimilarity for hybrid matches (vector + text overlap)

MUST NOT:
- [ ] Use .collect() on the full curated_routes table
- [ ] Remove or rename existing INF-006 functions
- [ ] Change the signature of findCandidateRoutesByEmbedding

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```typescript
// convex/schema.ts
curated_routes: defineTable({
  // ... existing fields ...
  nameLower: v.optional(v.string()),
})
  .index("by_name_lower", ["nameLower"])
  .index("by_highway_number", ["highwayNumber"])
  // ... existing indexes ...
```

```typescript
// convex/semanticSearch.ts
export const findCandidateRoutesHybrid = query({
  args: {
    embedding: v.array(v.number()),
    textQuery: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Phase 1: Vector search
    const vectorResults = await ctx.vectorSearch("curated_routes", "by_embedding", {
      vector: args.embedding,
      limit: (args.limit ?? 10) * 2,
      filter: args.stateFilter ? (q) => q.eq("state", args.stateFilter) : undefined,
    });

    // Phase 2: Text fallback (if provided)
    const textResults = args.textQuery
      ? await findRoutesByIdentifier(ctx, {
          identifier: args.textQuery,
          stateFilter: args.stateFilter,
          limit: (args.limit ?? 10) * 2,
        })
      : [];

    // Phase 3: Merge, dedupe, sort, limit
    const merged = new Map<string, HybridRouteRef>();

    for (const vr of vectorResults) {
      const doc = await ctx.db.get(vr._id);
      if (doc) {
        merged.set(doc._id.toString(), {
          routeId: doc._id,
          name: doc.name,
          state: doc.state,
          matchType: "vector" as const,
          cosineSimilarity: vr._score,
        });
      }
    }

    for (const tr of textResults) {
      const existing = merged.get(tr.routeId.toString());
      if (existing) {
        existing.matchType = "hybrid" as const;
        existing.cosineSimilarity = Math.min(1.0, existing.cosineSimilarity + 0.1);
      } else {
        merged.set(tr.routeId.toString(), {
          routeId: tr.routeId,
          name: tr.name,
          state: tr.state,
          matchType: "text" as const,
          cosineSimilarity: 0.5,
        });
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.cosineSimilarity - a.cosineSimilarity)
      .slice(0, args.limit ?? 10);
  },
});
```

Anti-pattern: Do NOT use `.filter()` on a full table query — always use `.withIndex()` first, then `.filter()` only to reduce the indexed result set.

Anti-pattern: Do NOT return duplicate routes from hybrid search — always dedupe by routeId before limiting.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: convex-implementer

## IMPLEMENTATION STEPS:

1. Read convex/schema.ts to understand current curated_routes indexes
2. Add nameLower field to curatedRouteValidator (if not present)
3. Add by_name_lower and by_highway_number secondary indexes
4. Run `npx convex dev --once` to regenerate _generated types
5. Read convex/semanticSearch.ts to understand current findRoutesByIdentifier
6. Refactor findRoutesByIdentifier to use indexed queries
7. Implement findCandidateRoutesHybrid with vector + text merging
8. Implement addCommunityWaypointMention mutation
9. Create tests for schema changes
10. Create tests for hybrid search behavior
11. Create tests for waypoint mention mutation
12. Verify backward compatibility of findRoutesByIdentifier
13. Run npx convex dev --once to ensure type safety

## VERIFICATION CHECKLIST:
- [ ] by_name_lower index added
- [ ] by_highway_number index added
- [ ] nameLower field added to validator
- [ ] findRoutesByIdentifier refactored to use indexes
- [ ] findCandidateRoutesHybrid implemented
- [ ] addCommunityWaypointMention implemented
- [ ] Hybrid search deduplicates results
- [ ] Hybrid search boosts overlapping matches
- [ ] findRoutesByIdentifier backward compatible
- [ ] All tests pass
- [ ] Convex type check passes

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER IMPLEMENTATION:
  RUN: `grep -E '(by_name_lower|by_highway_number)' convex/schema.ts | wc -l`
  EXPECT: 2

  RUN: `grep -q 'nameLower' convex/models/curated-routes.ts && echo OK || echo FAIL`
  EXPECT: OK

  RUN: `grep -q 'export const findCandidateRoutesHybrid' convex/semanticSearch.ts && echo OK || echo FAIL`
  EXPECT: OK

  RUN: `grep -q 'export const addCommunityWaypointMention' convex/semanticSearch.ts && echo OK || echo FAIL`
  EXPECT: OK

  RUN: `grep -A 30 'findRoutesByIdentifier' convex/semanticSearch.ts | grep -q '\.withIndex' && echo OK || echo FAIL`
  EXPECT: OK

  RUN: `npx convex dev --once`
  EXPECT: Exit 0

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** convex-implementer
**Rationale:** Convex schema modifications, query refactoring, and new function implementation — core convex-implementer territory.

**Review Agent:** convex-reviewer
**Rationale:** Verify indexed queries, hybrid search logic, deduplication, and backward compatibility.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Secondary indexes added
  Command: `grep -E '(by_name_lower|by_highway_number)' convex/schema.ts | wc -l`
  Expected: 2

Gate 2: nameLower field exists
  Command: `grep -q 'nameLower' convex/models/curated-routes.ts && echo OK`
  Expected: OK

Gate 3: New functions exported
  Command: `grep -cE 'export const (findCandidateRoutesHybrid|addCommunityWaypointMention)' convex/semanticSearch.ts`
  Expected: 2

Gate 4: Indexed queries used
  Command: `grep -A 30 'findRoutesByIdentifier' convex/semanticSearch.ts | grep -c '\.withIndex'`
  Expected: >= 1

Gate 5: Tests pass
  Command: `npx convex test --coverage`
  Expected: Exit 0

Gate 6: Type Check
  Command: `npx tsc --noEmit`
  Expected: Exit 0

--------------------------------------------------------------------------------
REVIEW CRITERIA
--------------------------------------------------------------------------------

Code Quality:
- [ ] All new queries use .withIndex() before .filter()
- [ ] Hybrid search properly deduplicates by routeId
- [ ] Overlapping matches get boosted scores
- [ ] TypeScript types are accurate (HybridRouteRef, etc.)

Domain-Specific:
- [ ] Hybrid search returns vector matches with high similarity
- [ ] Text fallback provides baseline 0.5 score for pure text matches
- [ ] addCommunityWaypointMention validates postId exists before writing
- [ ] Results are sorted by combined relevance

Security:
- [ ] No credential exposure
- [ ] Mutation validates input before writing
- [ ] Query limits are enforced (no unbounded takes)

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- INF-003 (Convex schema with vectorIndex exists)
- INF-006 (semanticSearch.ts exists with base functions)
- INF-012 (postEmbedding field exists for dedup in future)

Blocks:
- Sprint 6 (dedup can use hybrid search for better recall)
- Sprint 9 (ingestion can use addCommunityWaypointMention)
- Sprint 10 (reconciliation can use hybrid search for matching)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- **Performance impact:** Adding secondary indexes is a schema migration. Convex will handle this automatically on next deploy, but it may take time to backfill indexes on large tables.
- **Hybrid search tuning:** The +0.1 boost for overlapping matches is a starting point. This should be calibrated with real query logs in production (future work).
- **Text fallback baseline:** 0.5 cosine similarity for pure text matches is arbitrary — it ensures text results rank below high-quality vector matches but above low-quality ones. Tune based on UX feedback.
- **Waypoint mention storage:** The current implementation stores in route_posts_raw.payload. A future schema migration may add a dedicated `community_waypoint_mentions` table, but this approach works for MVP.
- **nameLower population:** Existing routes won't have nameLower populated initially. The migration should backfill this field (can be a Convex action or a one-off script).
- **Boy Scout rule:** If you find other queries in semanticSearch.ts that could benefit from indexing, note them in comments but don't refactor them in this task (stay focused on AC).

================================================================================
