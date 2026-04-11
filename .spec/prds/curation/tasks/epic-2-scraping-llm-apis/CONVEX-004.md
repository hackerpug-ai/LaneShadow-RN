# CONVEX-004: Public Query Endpoints for Lean Sync and Enrichment Fetch

**Task ID:** CONVEX-004
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** convex-implementer
**Review:** convex-reviewer
**Priority:** P0
**Effort:** M
**Estimate:** 180 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** CONVEX-002 (Curation tables + indexes in Convex schema)
- **PRD References:** S9-API Design — Public endpoints

---

## BACKGROUND

The mobile client needs three public-facing GET endpoints to sync curated route data: a lean sync endpoint for bulk/delta sync of route cards, an on-demand enrichment fetch endpoint for lazy-loading rich detail, and a staleness check endpoint to efficiently determine which cached enrichments need refreshing. All endpoints require Clerk authentication and use the indexes created in CONVEX-002.

**PRD References:**
- S9-API Design — Public (Client Access)
- S9-TRD Section: Lean Sync Service, Enrichment Fetch Service
- S10-TRD AD-8 (Lean/Rich tier split), AD-9 (Shared ID linking)

**Key Constraints:**
- Lean endpoint returns ONLY lean fields — never includes enrichment data
- Enrichment endpoint handles missing enrichments gracefully (returns null)
- Staleness check uses enrichmentVersion for efficient comparison
- All endpoints require Clerk auth (userId from auth, not query params)
- Use indexes, not filter(), for queries

---

## ACCEPTANCE CRITERIA

### AC-001: Full Lean Sync Returns All Routes
**GIVEN** the Convex database contains curated routes
**WHEN** an authenticated client calls GET /api/routes/lean without a `since` parameter
**THEN** all lean-tier routes are returned with pagination
**AND** each route contains only lean fields (no fullDescription, no photos, no history)
**AND** response includes `lastUpdated` timestamp
**AND** pagination uses `paginationOptsValidator` from `convex/server`

**Verify:** Seed 20 routes, call lean sync, verify all 20 returned with lean-only fields and valid pagination.

### AC-002: Delta Sync Filters by contentVersion
**GIVEN** the client has previously synced routes up to a known contentVersion timestamp
**WHEN** an authenticated client calls GET /api/routes/lean with `since` parameter
**THEN** only routes with `contentVersion` > `since` are returned
**AND** the response includes only changed routes (not the full catalog)

**Verify:** Seed routes, bump contentVersion on 3 routes, call delta sync with `since` parameter, verify only 3 routes returned.

### AC-003: Enrichment Fetch Handles Missing Data
**GIVEN** a client requests enrichment for one or more routeIds (comma-separated, max 50)
**WHEN** some requested routeIds have no enrichment generated yet
**THEN** the response includes the routeIds as keys with null values for missing enrichments
**AND** available enrichments are returned as full objects
**AND** the response is a Record<string, CuratedRouteEnrichment | null>

**Verify:** Request enrichment for 5 routeIds where 2 have no enrichment, verify response has 3 objects and 2 nulls.

### AC-004: Staleness Check Works
**GIVEN** the client has cached enrichments with known enrichmentVersion values
**WHEN** the client sends a POST /api/routes/missing-enrichments with (routeId, version) pairs
**THEN** the response returns only routeIds whose server enrichmentVersion exceeds the cached version
**AND** routes with matching versions are excluded from the response

**Verify:** Seed routes with enrichmentVersion values, request staleness check, verify only stale IDs returned.

### AC-005: Authentication Required
**GIVEN** an unauthenticated request to any public endpoint
**WHEN** the request lacks valid Clerk auth
**THEN** the response is 401 Unauthorized
**AND** no route data is returned

**Verify:** Call each endpoint without auth, verify 401 response.

---

## TEST CRITERIA

- [ ] GET /api/routes/lean returns all routes without `since` parameter
- [ ] GET /api/routes/lean with `since` returns only routes with contentVersion > since
- [ ] Lean response contains no enrichment fields (fullDescription, photos, etc.)
- [ ] GET /api/routes/enrichment returns enrichments for valid routeIds
- [ ] GET /api/routes/enrichment returns null for missing routeIds
- [ ] GET /api/routes/enrichment rejects requests with >50 routeIds
- [ ] POST /api/routes/missing-enrichments correctly identifies stale routes
- [ ] All endpoints return 401 for unauthenticated requests
- [ ] Pagination works correctly on lean sync endpoint
- [ ] Uses indexes (not filter()) for all queries
- [ ] Convex typecheck passes: `npx convex typecheck`
- [ ] Tests pass: relevant test suite

---

## READING LIST

- `.spec/prds/curation/convex-api-design.md` — Section 6 (Client-Facing Queries), Section 5 (HTTP Routes)
- `.spec/prds/curation/09-technical-requirements.md` — API Design (Public), Lean Sync Service, Enrichment Fetch Service
- `convex/_generated/ai/guidelines.md` — Convex API patterns and best practices
- Convex pagination: https://docs.convex.dev/api/#pagination

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `convex/http.ts` (MODIFY — add 3 new route registrations)
- `convex/db/curation.ts` (MODIFY — add lean sync, enrichment fetch, staleness check queries)

**NEVER MODIFY:**
- `convex/schema.ts` — schema is owned by CONVEX-002
- `models/` — validators are owned by CONVEX-001
- Existing admin endpoints (CONVEX-003 artifacts)

**CONVEX PATTERNS:**
- `paginationOptsValidator` from `convex/server`, NOT `convex/values`
- `order('desc')` sorts by `_creationTime`, NOT by custom fields — post-sort in handler
- No `filter()` in index scans — use `withIndex()` + in-memory filter
- Every registered function needs explicit `returns:` validator

---

## CODE PATTERN

**Lean Sync Query:**
```typescript
// convex/db/curation.ts
export const leanSync = query({
  args: {
    state: v.optional(v.string()),
    since: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(routeCardValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
    lastUpdated: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHORIZED");

    let query = ctx.db.query("curated_routes");

    if (args.state) {
      query = query.withIndex("by_state", q => q.eq("state", args.state!));
    } else {
      query = query.withIndex("by_score"); // full scan, ordered by creation
    }

    const result = await query.paginate(args.paginationOpts);

    let page = result.page;
    if (args.since) {
      // Delta sync: filter to routes with contentVersion > since
      page = page.filter(r => r.contentVersion > args.since!);
    }

    return {
      page: page.map(toRouteCard),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      lastUpdated: Math.max(...page.map(r => r.contentVersion), 0),
    };
  },
});
```

**Enrichment Fetch HTTP Handler:**
```typescript
// In convex/http.ts route handler
const enrichmentHandler = async (ctx: RouteContext, request: Request) => {
  const identity = await ctx.ctx.auth.getUserIdentity();
  if (!identity) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids");
  if (!idsParam) return Response.json({ error: "MISSING_IDS" }, { status: 400 });

  const ids = idsParam.split(",").slice(0, 50); // max 50

  const results: Record<string, any> = {};
  for (const routeId of ids) {
    const doc = await ctx.ctx.db
      .query("curated_route_enrichments")
      .withIndex("by_routeId", q => q.eq("routeId", routeId))
      .unique();
    results[routeId] = doc ?? null;
  }

  return Response.json({ enrichments: results });
};
```

**Staleness Check:**
```typescript
// POST /api/routes/missing-enrichments
const missingEnrichmentsHandler = async (ctx: RouteContext, request: Request) => {
  const identity = await ctx.ctx.auth.getUserIdentity();
  if (!identity) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json() as { pairs: Array<{ routeId: string; version: number }> };
  const stale: string[] = [];

  for (const { routeId, version } of body.pairs) {
    const lean = await ctx.ctx.db
      .query("curated_routes")
      .withIndex("by_routeId", q => q.eq("routeId", routeId))
      .unique();

    if (lean && (lean.enrichmentVersion ?? 0) > version) {
      stale.push(routeId);
    }
  }

  return Response.json({ stale });
};
```

---

## AGENT INSTRUCTIONS

1. Read `convex/_generated/ai/guidelines.md` for Convex API patterns
2. Read `convex/http.ts` to understand existing route registration pattern
3. Read `convex/db/curation.ts` to understand existing curation queries (from CONVEX-002/003)
4. Read `models/curated-routes.ts` for validators (routeCardValidator, curatedRouteValidator)
5. Add lean sync query to `convex/db/curation.ts` — full and delta sync with pagination
6. Add enrichment fetch logic — query by routeId, return null for missing
7. Add staleness check logic — compare enrichmentVersion values
8. Register 3 HTTP routes in `convex/http.ts` — lean sync (GET), enrichment fetch (GET), missing-enrichments (POST)
9. All endpoints require Clerk auth — verify identity, return 401 if missing
10. Use indexes, NEVER use filter() on table scans
11. NEVER return enrichment data from the lean endpoint
12. Run `npx convex typecheck` to verify

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify CONVEX-002 is complete (schema + indexes deployed)
2. **Post-completion verification:**
   ```bash
   # Verify Convex typecheck
   npx convex typecheck

   # Verify route registrations in http.ts
   grep -n "routes/lean\|routes/enrichment\|routes/missing-enrichments" convex/http.ts

   # Verify no filter() usage in curation queries
   grep -n "\.filter(" convex/db/curation.ts
   ```
3. **Evidence gate:** typecheck passes, 3 routes registered, no filter() usage, auth enforced

---

## AGENT ASSIGNMENT

**Primary:** convex-implementer
**Review:** convex-reviewer
**Rationale:** Convex query and HTTP action implementation. Requires understanding of Convex indexes, pagination, and auth patterns.

---

## EVIDENCE GATES

- [ ] 3 HTTP routes registered in convex/http.ts
- [ ] Lean sync returns only lean fields (no enrichment data)
- [ ] Delta sync correctly filters by contentVersion
- [ ] Enrichment fetch returns null for missing routeIds
- [ ] Enrichment fetch enforces max 50 routeIds
- [ ] Staleness check correctly compares enrichmentVersion
- [ ] All endpoints return 401 without Clerk auth
- [ ] `npx convex typecheck` passes
- [ ] No filter() usage — all queries use withIndex()

---

## REVIEW CRITERIA

- Lean response uses `toRouteCard` projection (never returns full document)
- Pagination uses `paginationOptsValidator` from `convex/server`
- Delta sync is efficient (index scan + contentVersion filter, not full table scan)
- Missing enrichments are null (not omitted) — client can distinguish "not found" from "not enriched"
- Staleness check is batch-friendly (accepts array of pairs, returns array of stale IDs)
- HTTP route handlers delegate to query/mutation functions (no business logic in handlers)
- Auth check is the first operation in every handler

---

## NOTES

- **Lean sync is the hot path** — it runs every time the app launches. It must be fast and return minimal data (~50 tokens per route).
- **Delta sync** uses `contentVersion` (monotonically increasing integer) rather than timestamps for reliable change detection.
- **Enrichment fetch is lazy** — only called when a user taps a route detail or the app pre-warms visible cards.
- **Staleness check** is a cheap way for the app to batch-check without fetching full payloads. The POST method with JSON body is used despite read-only semantics (as specified in the TRD).
- **The `toRouteCard` helper** strips enrichment fields from the full document. This projection must be consistent with the `routeCardValidator`.
- **Max 50 routeIds** on enrichment fetch prevents abuse while covering the "pre-warm visible list" use case.
