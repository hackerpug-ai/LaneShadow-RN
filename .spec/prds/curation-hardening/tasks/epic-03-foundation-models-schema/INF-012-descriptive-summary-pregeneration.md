================================================================================
TASK: INF-012 - Descriptive Summary Pre-generation
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
PRIORITY: P1
EFFORT: M
ESTIMATE: 150 minutes
AGENT: python-implement
ITERATION: 1

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** Sprint 9/10 community ingestion will produce high-quality waypoint mentions from rider posts, but the curated_routes table currently lacks a `descriptiveSummary` field to aggregate and display these community insights. Additionally, `route_posts_raw` needs a `postEmbedding` field for semantic deduplication, and PostExtraction needs a v3 update to include `waypoint_mentions` for the waypoint-ready data shape.

**Why it matters:** This enables three critical capabilities: (1) UI can display community-curated summaries on route cards, (2) the pipeline can detect duplicate/similar posts via embedding similarity before expensive LLM processing, and (3) waypoint mentions are properly structured for the Waypoints PRD (`.spec/prds/waypoints/09-technical-requirements.md` requires `candidate_route_ids` linkage).

**Current state:** `curated_routes` has no `descriptiveSummary` field. `route_posts_raw` has no `postEmbedding` field. PostExtraction is at v2 with no `waypoint_mentions`. The Waypoints PRD references `candidate_route_ids` but the extraction schema doesn't produce it.

**Desired state:** Convex schema gains `descriptiveSummary: v.optional(v.string())` on `curatedRouteValidator` and `postEmbedding: v.optional(v.array(v.number()))` on `routePostRawValidator`. PostExtraction bumps to v3 with a `waypoint_mentions` field containing structured waypoint references. Python pipeline gains pre-generation logic to populate `descriptiveSummary` from aggregated community posts.

**Architectural note:** This is part of the "waypoint-ready data shape" plan approved in `validated-whistling-journal.md`. The pre-generation uses Claude Haiku to summarize a route's top community posts into a concise 2-3 sentence descriptive summary, stored directly on the route for fast UI reads.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Add descriptiveSummary field to curated_routes Convex validator
MUST: Add postEmbedding field to route_posts_raw Convex validator (1536-dim vector)
MUST: Bump PostExtraction schema to version 3
MUST: Add waypoint_mentions field to PostExtraction v3
MUST: Create Python pre-generation module for descriptive summaries
MUST: Use Claude Haiku for summary generation (cost-effective)
MUST: Store post embeddings for deduplication (same model as route embeddings)
NEVER: Modify existing curated_routes fields (additive only)
NEVER: Change PostExtraction v2 fields (backward compatible)
NEVER: Use Claude Opus for pre-generation (overkill and expensive)
STRICTLY: descriptiveSummary is optional on curated_routes (backfill safe)
STRICTLY: postEmbedding uses same dimensions as route embeddings (1536)
STRICTLY: waypoint_mentions follows Waypoints PRD structure

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Extend the Convex schema and PostExtraction model to support waypoint-ready data shapes, enabling community-curated summaries and semantic deduplication of posts.

**Success state:** Convex schema has `descriptiveSummary` and `postEmbedding` fields. PostExtraction v3 includes `waypoint_mentions`. Python pipeline can pre-generate summaries for routes lacking them. Embeddings are stored for all incoming posts.

### Convex Schema Changes

**1. curated_routes validator extension**
```typescript
// In convex/models/curated-routes.ts
const curatedRouteValidator = defineSchema({
  // ... existing fields ...
  descriptiveSummary: v.optional(v.string()), // NEW: community-curated summary
});
```

**2. route_posts_raw validator extension**
```typescript
// In convex/models/curated-routes.ts
const routePostRawValidator = defineSchema({
  // ... existing fields ...
  postEmbedding: v.optional(v.array(v.number())), // NEW: 1536-dim embedding for dedup
});
```

### PostExtraction v3 Changes

**3. PostExtraction v3 with waypoint_mentions**
```python
# In scripts/curation/pipeline/extraction/schema.py
EXTRACTION_SCHEMA_VERSION: int = 3

class WaypointMention(BaseModel):
    """A structured reference to a waypoint mentioned in a community post."""
    waypoint_name: str = Field(..., description="Name of the waypoint as mentioned")
    waypoint_type: Literal["town", "landmark", "natural_feature", "vista", "other"] = Field(...)
    context: str = Field(..., description="Surrounding text describing why this waypoint matters")
    candidate_route_ids: list[str] = Field(
        default_factory=list,
        description="Route IDs this waypoint likely belongs to (populated by matching layer)"
    )

class PostExtraction(BaseModel):
    # ... existing v2 fields ...
    waypoint_mentions: list[WaypointMention] = Field(
        default_factory=list,
        description="Structured waypoint mentions for Waypoints PRD integration"
    )
    extraction_schema_version: int = Field(default=3)
```

### Python Pre-generation Module

**4. Summary pre-generation**
```python
# In scripts/curation/pipeline/generate/summaries.py (NEW FILE)
async def generate_route_summary(
    route: Route,
    top_posts: list[RoutePostRaw],
    client: anthropic.AsyncAnthropic,
) -> str:
    """
    Generate a 2-3 sentence descriptive summary from a route's top community posts.
    Uses Claude Haiku for cost efficiency. Returns empty string if insufficient post quality.
    """

async def backfill_route_summaries(
    routes: list[Route],
    posts_by_route: dict[str, list[RoutePostRaw]],
    client: anthropic.AsyncAnthropic,
    batch_size: int = 10,
) -> dict[str, str]:
    """
    Batch-generate summaries for routes missing descriptiveSummary.
    Returns dict mapping route_id -> generated summary.
    """
```

### Post Embedding Storage

**5. Post embedding generation**
```python
# Extend scripts/curation/pipeline/embed/batch_embed_routes.py or create new module
def generate_post_embedding(post_text: str, client: openai.OpenAI) -> list[float]:
    """
    Generate 1536-dim embedding for a post using text-embedding-3-small.
    Used for deduplication before expensive LLM extraction.
    """
```

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Convex curated_routes has descriptiveSummary field
  GIVEN: The curatedRouteValidator in convex/models/curated-routes.ts
  WHEN: I inspect the validator definition
  THEN: It includes descriptiveSummary: v.optional(v.string())

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/schema.inf012.test.ts
  TEST_FUNCTION: test_curated_routes_has_descriptive_summary

AC-2: Convex route_posts_raw has postEmbedding field
  GIVEN: The routePostRawValidator in convex/models/curated-routes.ts
  WHEN: I inspect the validator definition
  THEN: It includes postEmbedding: v.optional(v.array(v.number()))

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/schema.inf012.test.ts
  TEST_FUNCTION: test_route_posts_raw_has_post_embedding

AC-3: PostExtraction bumped to v3 with waypoint_mentions
  GIVEN: The PostExtraction model in scripts/curation/pipeline/extraction/schema.py
  WHEN: I check EXTRACTION_SCHEMA_VERSION and inspect fields
  THEN: EXTRACTION_SCHEMA_VERSION == 3 and waypoint_mentions field exists as list[WaypointMention]

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/test_inf012_extraction_schema.py
  TEST_FUNCTION: test_post_extraction_v3_waypoint_mentions

AC-4: WaypointMention model has required fields
  GIVEN: The WaypointMention Pydantic model
  WHEN: I inspect its fields
  THEN: It has waypoint_name, waypoint_type (Literal), context, candidate_route_ids

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/test_inf012_extraction_schema.py
  TEST_FUNCTION: test_waypoint_mention_model_structure

AC-5: Python summary generation module exists
  GIVEN: Need to pre-generate descriptive summaries for routes
  WHEN: I import the generation module
  THEN: scripts.curation.pipeline.generate.summaries exists with generate_route_summary function

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/test_inf012_summaries.py
  TEST_FUNCTION: test_generate_route_summary_exists

AC-6: Summary generation uses Claude Haiku
  GIVEN: The generate_route_summary function
  WHEN: I inspect the client usage
  THEN: It uses claude-haiku-4-5-20251001 (not Opus)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/test_inf012_summaries.py
  TEST_FUNCTION: test_summary_generation_uses_haiku

AC-7: Post embedding generation exists
  GIVEN: Need to store embeddings for deduplication
  WHEN: I call generate_post_embedding with sample text
  THEN: It returns a 1536-dimensional list of floats

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/test_inf012_summaries.py
  TEST_FUNCTION: test_post_embedding_1536_dimensions

AC-8: PostExtraction v3 is backward compatible with v2
  GIVEN: Existing v2 PostExtraction JSON
  WHEN: I parse it with PostExtraction.model_validate_json
  THEN: Parsing succeeds with waypoint_mentions defaulting to empty list

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/test_inf012_extraction_schema.py
  TEST_FUNCTION: test_v3_backward_compatible_with_v2

Quality Criteria:
- [ ] Convex schema changes are additive only (no breaking changes)
- [ ] PostExtraction v3 preserves all v2 fields
- [ ] Embeddings use same model as routes (text-embedding-3-small, 1536-dim)
- [ ] Summary generation is cost-effective (Haiku, not Opus)

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | descriptiveSummary field in curated_routes | AC-1 | `grep -q 'descriptiveSummary' convex/models/curated-routes.ts && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 2 | postEmbedding field in route_posts_raw | AC-2 | `grep -q 'postEmbedding' convex/models/curated-routes.ts && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 3 | EXTRACTION_SCHEMA_VERSION == 3 | AC-3 | `python -c 'from scripts.curation.pipeline.extraction.schema import EXTRACTION_SCHEMA_VERSION; assert EXTRACTION_SCHEMA_VERSION == 3' && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 4 | WaypointMention class exists | AC-4 | `python -c 'from scripts.curation.pipeline.extraction.schema import WaypointMention; print("TRUE")' 2>&1 | grep -q TRUE` | [ ] TRUE  [ ] FALSE |
| 5 | waypoint_mentions field in PostExtraction | AC-3 | `python -c 'from scripts.curation.pipeline.extraction.schema import PostExtraction; assert "waypoint_mentions" in PostExtraction.model_fields' && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 6 | Summary generation module exists | AC-5 | `test -f scripts/curation/pipeline/generate/summaries.py && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |
| 7 | npx convex dev --once passes | All | Exit code 0 | [ ] TRUE  [ ] FALSE |
| 8 | Pydantic v2 patterns used | AC-3 | `grep -q 'Field(' scripts/curation/pipeline/extraction/schema.py && echo TRUE || echo FALSE` | [ ] TRUE  [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. convex/models/curated-routes.ts
   - Lines: curatedRouteValidator, routePostRawValidator
   - Focus: Existing field structure, where to add new fields

2. scripts/curation/pipeline/extraction/schema.py (post INF-005)
   - Lines: PostExtraction v2, EXTRACTION_SCHEMA_VERSION
   - Focus: How to bump to v3, where to add WaypointMention

3. .spec/prds/waypoints/09-technical-requirements.md
   - Lines: Search for "candidate_route_ids"
   - Focus: Understand the waypoint linkage requirement

4. validated-whistling-journal.md (if available)
   - Lines: Waypoint-ready data shape section
   - Focus: Full context on the approved plan

5. Anthropic docs — Claude Haiku API (fetch via context7)
   - Focus: How to use Haiku for cost-effective summarization

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- convex/models/curated-routes.ts (MODIFY - add descriptiveSummary, postEmbedding)
- convex/schema.ts (MODIFY - run npx convex dev to regenerate _generated)
- scripts/curation/pipeline/extraction/schema.py (MODIFY - bump to v3, add WaypointMention)
- scripts/curation/pipeline/generate/summaries.py (CREATE)
- scripts/curation/pipeline/generate/__init__.py (CREATE)
- scripts/curation/tests/test_inf012_extraction_schema.py (CREATE)
- scripts/curation/tests/test_inf012_summaries.py (CREATE)
- convex/__tests__/schema.inf012.test.ts (CREATE)

WRITE-PROHIBITED:
- convex/semanticSearch.ts - do NOT modify (INF-006 territory)
- scripts/curation/pipeline/models.py - do NOT modify (INF-002 territory)
- scripts/curation/pipeline/embed/batch_embed_routes.py - do NOT modify (INF-004 territory)

MUST:
- [ ] Use Claude Haiku for summary generation (claude-haiku-4-5-20251001)
- [ ] Use text-embedding-3-small for post embeddings (1536-dim)
- [ ] Make all new fields optional (backfill-safe)
- [ ] Preserve PostExtraction v2 fields (backward compatible)

MUST NOT:
- [ ] Use Claude Opus for pre-generation (too expensive)
- [ ] Make required fields that break existing data
- [ ] Remove or rename existing PostExtraction v2 fields

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```typescript
// convex/models/curated-routes.ts
export const curatedRouteValidator = defineSchema({
  // ... existing fields ...
  descriptiveSummary: v.optional(v.string()),
});

export const routePostRawValidator = defineSchema({
  // ... existing fields ...
  postEmbedding: v.optional(v.array(v.number())),
});
```

```python
# scripts/curation/pipeline/extraction/schema.py
EXTRACTION_SCHEMA_VERSION: int = 3

class WaypointMention(BaseModel):
    """Structured waypoint reference for Waypoints PRD integration."""
    waypoint_name: str = Field(...)
    waypoint_type: Literal["town", "landmark", "natural_feature", "vista", "other"] = Field(...)
    context: str = Field(..., description="Why this waypoint matters in the post")
    candidate_route_ids: list[str] = Field(default_factory=list)

class PostExtraction(BaseModel):
    # ... v2 fields preserved ...
    waypoint_mentions: list[WaypointMention] = Field(default_factory=list)
    extraction_schema_version: int = Field(default=3)
```

```python
# scripts/curation/pipeline/generate/summaries.py
"""Pre-generate descriptive summaries for curated routes from community posts."""

DEFAULT_SUMMARY_MODEL = "claude-haiku-4-5-20251001"

async def generate_route_summary(
    route: Route,
    top_posts: list[RoutePostRaw],
    client: anthropic.AsyncAnthropic,
) -> str:
    """Generate 2-3 sentence summary from top community posts."""
    if not top_posts:
        return ""
    post_texts = "\n\n".join(p.get("text", "") for p in top_posts[:5])
    prompt = f"""Summarize what riders say about this route in 2-3 sentences.

Route: {route.name}
State: {route.state}

Community posts:
{post_texts}

Focus on: road quality, scenery, traffic, notable features, and rider sentiment."""
    resp = await client.messages.create(
        model=DEFAULT_SUMMARY_MODEL,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text.strip()
```

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: python-implementer

## IMPLEMENTATION STEPS:

1. Read convex/models/curated-routes.ts to understand existing validators
2. Add descriptiveSummary and postEmbedding fields to validators
3. Run `npx convex dev --once` to regenerate _generated types
4. Read scripts/curation/pipeline/extraction/schema.py to understand PostExtraction v2
5. Bump EXTRACTION_SCHEMA_VERSION to 3
6. Add WaypointMention model with required fields
7. Add waypoint_mentions field to PostExtraction
8. Create scripts/curation/pipeline/generate/summaries.py
9. Implement generate_route_summary and backfill_route_summaries
10. Create tests for schema changes (Convex and Python)
11. Create tests for summary generation logic
12. Verify backward compatibility with v2 PostExtraction
13. Verify npx convex dev --once passes

## VERIFICATION CHECKLIST:
- [ ] descriptiveSummary field added to curated_routes
- [ ] postEmbedding field added to route_posts_raw
- [ ] EXTRACTION_SCHEMA_VERSION == 3
- [ ] WaypointMention model exists with correct fields
- [ ] waypoint_mentions field added to PostExtraction
- [ ] Summary generation module exists
- [ ] Uses Claude Haiku (not Opus)
- [ ] PostExtraction v3 backward compatible with v2
- [ ] All tests pass
- [ ] Convex type check passes

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER IMPLEMENTATION:
  RUN: `grep -q 'descriptiveSummary' convex/models/curated-routes.ts && echo OK || echo FAIL`
  EXPECT: OK

  RUN: `grep -q 'postEmbedding' convex/models/curated-routes.ts && echo OK || echo FAIL`
  EXPECT: OK

  RUN: `python -c 'from scripts.curation.pipeline.extraction.schema import EXTRACTION_SCHEMA_VERSION, WaypointMention, PostExtraction; assert EXTRACTION_SCHEMA_VERSION == 3; assert "waypoint_mentions" in PostExtraction.model_fields; print("OK")'`
  EXPECT: OK

  RUN: `pytest scripts/curation/tests/test_inf012_extraction_schema.py scripts/curation/tests/test_inf012_summaries.py -v`
  EXPECT: All tests pass, exit 0

  RUN: `npx convex dev --once`
  EXPECT: Exit 0

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implementer
**Rationale:** Python schema changes + summary generation + tests — core python-implementer territory with minor Convex schema edits.

**Review Agent:** python-review
**Rationale:** Verify Pydantic v3 patterns, backward compatibility, and summary generation logic.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Convex schema updated
  Command: `grep -E '(descriptiveSummary|postEmbedding)' convex/models/curated-routes.ts | wc -l`
  Expected: 2

Gate 2: PostExtraction v3
  Command: `python -c 'from scripts.curation.pipeline.extraction.schema import EXTRACTION_SCHEMA_VERSION; assert EXTRACTION_SCHEMA_VERSION == 3; print("OK")'`
  Expected: OK

Gate 3: WaypointMention exists
  Command: `python -c 'from scripts.curation.pipeline.extraction.schema import WaypointMention; required = {"waypoint_name","waypoint_type","context","candidate_route_ids"}; assert required.issubset(WaypointMention.model_fields.keys()); print("OK")'`
  Expected: OK

Gate 4: Summary module exists
  Command: `test -f scripts/curation/pipeline/generate/summaries.py && echo OK`
  Expected: OK

Gate 5: Tests pass
  Command: `pytest scripts/curation/tests/test_inf012_*.py -v`
  Expected: Exit 0

Gate 6: Type Check
  Command: `npx tsc --noEmit`
  Expected: Exit 0

--------------------------------------------------------------------------------
REVIEW CRITERIA
--------------------------------------------------------------------------------

Code Quality:
- [ ] All new fields are optional (backfill-safe)
- [ ] PostExtraction v3 preserves v2 fields exactly
- [ ] Pydantic v2 patterns used (Field, Literal, etc.)
- [ ] Summary generation is async and uses Haiku

Domain-Specific:
- [ ] waypoint_mentions follows Waypoints PRD structure
- [ ] candidate_route_ids is list[str] for multi-route waypoints
- [ ] Embeddings use same dimensions as routes (1536)

Security:
- [ ] No credential exposure
- [ ] Summary prompts don't inject untrusted content
- [ ] Input validation on waypoint_type enum

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- INF-003 (Convex schema with vectorIndex exists)
- INF-005 (PostExtraction v2 exists as base)
- INF-006 (semanticSearch.ts exists for embedding queries)

Blocks:
- INF-013 (hybrid search uses postEmbedding for dedup)
- Sprint 9 (ingestion uses waypoint_mentions for Waypoints PRD)
- Sprint 10 (reconciliation uses descriptiveSummary for display)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- **Cost model for summary pre-generation:** Haiku costs ~$0.0003 per summary (200 input + 100 output tokens). For 5k routes, that's ~$1.50 total — trivial.
- **Backfill strategy:** Generate summaries only for routes that have 3+ community posts with positive sentiment. Skip routes with insufficient data.
- **Deduplication with postEmbedding:** Before running expensive LLM extraction, compute embedding and check against recent posts (cosine similarity > 0.95 = duplicate). This saves significant cost on reposted content.
- **Waypoint PRD alignment:** The `candidate_route_ids` field is populated by the matching layer (INF-013), not the extraction layer. Extraction just identifies the waypoint; matching figures out which routes it belongs to.
- **Boy Scout rule:** If you find existing Convex validators have inconsistent optional field patterns, follow the existing pattern rather than introducing a new convention.

================================================================================
