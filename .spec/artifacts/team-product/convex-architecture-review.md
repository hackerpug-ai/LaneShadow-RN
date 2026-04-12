# Convex Backend Architecture Review
## Curation Pipeline Hardening Initiative

**Reviewer:** convex-reviewer (Convex Architecture Expert)
**Date:** 2026-04-12
**Review Scope:** Schema extensions, query performance, calibration gate, data quality reporting
**PRD Version:** 1.0.0

---

## Executive Summary

**VERDICT:** NEEDS_FIXES — Critical architectural concerns require resolution before implementation.

The PRD proposes significant Convex schema extensions and new data pipeline components. While the high-level architecture is sound, several critical issues must be addressed:

1. **Schema Extension Strategy (CRITICAL)**: Proposed nullable field additions violate Convex's backward compatibility guarantees
2. **Missing New Entity Definitions (CRITICAL)**: RouteMention and AggregatedMention lack Convex-native patterns
3. **Query Performance Concerns (HIGH)**: Geospatial dedup queries lack proper indexing strategy
4. **Calibration Gate Storage (MEDIUM)**: Ground truth dataset storage location undefined
5. **CI Integration Gap (MEDIUM)**: Data quality report CI gating mechanism unclear

---

## 1. Schema Extensions Review

### 1.1 Route Model Additions

**Proposed Additions:**
```typescript
// Existing curated_routes table (lean tier)
description: Optional[str]           // NEW
rating: Optional[float]              // NEW
designation: Optional[str]           // NEW
source_url: Optional[str]            // NEW
source_refs: list[str]               // NEW
highway_number: Optional[str]        // NEW
elevation_gain_m: Optional[float]    // NEW
surface: Optional[str]               // NEW
aadt: Optional[int]                  // NEW
mention_frequency: Optional[float]   // NEW
```

**Analysis:**

**ISSUE #1: Non-Breaking Claim is Incorrect**

The PRD states (AD-009): "Convex nullable columns, not new table. Non-breaking for existing mobile app."

This is **INCORRECT** for Convex. In Convex:

1. **Schema changes require deployment** - Adding fields to `defineTable()` requires a Convex deployment
2. **Mobile apps see new schema immediately** - There's no versioning buffer between backend schema change and client visibility
3. **Type generation is automatic** - `npx convex dev` regenerates `dataModel.d.ts`, which TypeScript apps consume
4. **Optional fields are safe BUT** - Only if client code handles `undefined` gracefully

**Current Schema Location:** `models/curated-routes.ts`

```typescript
export const CURATED_ROUTE_FIELDS = {
  // ... existing fields
  // NO: description, rating, designation, etc.
}
```

**Recommended Fix:**

1. **Add fields to validator** (`models/curated-routes.ts`):
```typescript
export const CURATED_ROUTE_FIELDS = {
  // ... existing fields
  description: v.optional(v.string()),
  rating: v.optional(v.number()),
  designation: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  sourceRefs: v.optional(v.array(v.string())),
  highwayNumber: v.optional(v.string()),
  elevationGainM: v.optional(v.number()),
  surface: v.optional(v.string()),
  aadt: v.optional(v.number()),
  mentionFrequency: v.optional(v.number()),
}
```

2. **Update TypeScript types** (`models/curated-routes.ts`):
```typescript
export type CuratedRoute = {
  // ... existing fields
  description?: string | null;
  rating?: number | null;
  designation?: string | null;
  sourceUrl?: string | null;
  sourceRefs?: string[] | null;
  highwayNumber?: string | null;
  elevationGainM?: number | null;
  surface?: string | null;
  aadt?: number | null;
  mentionFrequency?: number | null;
}
```

3. **Client compatibility** - Ensure React Native code handles undefined:
```typescript
// Safe access pattern
const routeDescription = route.description ?? "No description available";
```

**SEVERITY:** CRITICAL - Mobile apps will crash if they don't handle undefined values

---

### 1.2 EnrichedRoute Score Vector Extensions

**Proposed Additions:**
```typescript
// Existing curated_route_enrichments table (rich tier)
mention_frequency_score: float       // NEW
designation_score: float             // NEW
elevation_drama_score: float         // NEW
road_quality_score: float            // NEW
low_traffic_score: float             // NEW
source_count: int                    // NEW
quality_tier: str                    // NEW — premium|standard|minimal
```

**Analysis:**

**Current Schema Location:** `models/curated-route-enrichments.ts`

The existing rich tier already has:
```typescript
surfaceMaterial: v.string()
totalElevationGainM: v.number()
// But NOT the new score fields
```

**Issue #2: Score Vector Naming Inconsistency**

The PRD uses `snake_case` (mention_frequency_score) but Convex conventions and existing code use `camelCase`:

```typescript
// EXISTING pattern (correct)
compositeScore: v.number()
curvatureScore: v.number()
scenicScore: v.number()

// PROPOSED pattern (incorrect)
mention_frequency_score: float
```

**Recommended Fix:**

```typescript
// models/curated-route-enrichments.ts
export const CURATED_ROUTE_ENRICHMENT_FIELDS = {
  // ... existing fields
  mentionFrequencyScore: v.optional(v.number()),
  designationScore: v.optional(v.number()),
  elevationDramaScore: v.optional(v.number()),
  roadQualityScore: v.optional(v.number()),
  lowTrafficScore: v.optional(v.number()),
  sourceCount: v.optional(v.number()),
  qualityTier: v.optional(v.union(
    v.literal("premium"),
    v.literal("standard"),
    v.literal("minimal")
  )),
}
```

**SEVERITY:** MEDIUM - Convention violation that creates inconsistency

---

### 1.3 New Entities: RouteMention and AggregatedMention

**Proposed Entities:**

```python
# RouteMention (Python dataclass - pipeline side)
road_name: str
highway_number: Optional[str]
state: Optional[str]
sentiment_score: float               # -1.0 to 1.0
attributes: dict[str, float]         # twisty, scenic, traffic, etc.
source: str
source_authority: float
post_url: str
post_score: int
mention_date: str

# AggregatedMention (Python dataclass - pipeline side)
road_name: str
state: str
total_mentions: int
weighted_sentiment: float
authority_score: float
source_breakdown: dict[str, int]
top_attributes: list[str]
```

**CRITICAL ISSUE #3: Missing Convex Table Definitions**

These entities are defined as Python dataclasses for the pipeline, but there's **no corresponding Convex table schema**. The PRD says "Convex push" adds new score fields to curated_routes, but doesn't specify where RouteMention and AggregatedMention live.

**Architecture Gap:**

1. **RouteMention** - Raw individual mentions from forums/reddit
   - Where do these get stored in Convex?
   - Are they persisted at all, or just processed in-flight?
   - If persisted: need a new table `route_mentions`

2. **AggregatedMention** - Rolled-up metrics per route
   - Should these be fields on `curated_routes`?
   - Or a separate `route_mention_aggregates` table?
   - Current PRD has `mention_frequency` on curated_routes but where's the rest?

**Recommended Schema Addition:**

```typescript
// convex/schema.ts - NEW TABLE
route_mentions: defineTable({
  roadName: v.string(),
  highwayNumber: v.optional(v.string()),
  state: v.optional(v.string()),
  sentimentScore: v.number(),
  attributes: v.record(v.number()), // {twisty: 0.8, scenic: 0.9, ...}
  source: v.string(), // 'advrider', 'reddit', etc.
  sourceAuthority: v.number(),
  postUrl: v.string(),
  postScore: v.number(),
  mentionDate: v.number(), // timestamp
  processedAt: v.number(), // timestamp
  routeId: v.optional(v.id("curated_routes")), // nullable - linked after dedup
})
  .index("by_routeId", ["routeId"])
  .index("by_source_and_date", ["source", "mentionDate"])
  .index("by_roadName_and_state", ["roadName", "state"]);
```

**Why This Matters:**

- **Audit trail** - Need to trace back why a route has high mention_frequency
- **Recalculation** - If authority weights change, need raw mentions to recompute
- **Debugging** - When NLP extraction goes wrong, need source data to diagnose
- **Regulatory** - If scraping violates ToS, may need to delete source data

**SEVERITY:** CRITICAL - Data model incomplete

---

## 2. Query Performance Assessment

### 2.1 Geospatial Dedup Queries

**Proposed Dedup Logic:**

```python
# Stage 3: Geospatial proximity dedup
# Two routes are duplicates if:
# - Centroid distance < 5km
# - AND length difference < 20%

from rtree import index
idx = index.Index()
# ... build spatial index
# Query: find all routes within 5km centroid
candidates = idx.intersection(bbox)
```

**Performance Analysis:**

**R-tree in Python Pipeline:**

✅ **GOOD:** R-tree is O(log n) for spatial queries
✅ **GOOD:** Pre-filtering by bbox reduces pairwise comparisons
✅ **GOOD:** rtree library wraps libspatialindex (C++, fast)

**BUT:** This is all in the Python pipeline, NOT in Convex.

**Convex Side of the Problem:**

When the pipeline pushes to Convex, there's NO native spatial query capability:

```typescript
// Convex CANNOT do this:
const nearby = await ctx.db
  .query("curated_routes")
  .withIndex("by_geolocation", q => 
    q.geoNear(lat, lng, { radius: 5000 }) // ❌ DOESN'T EXIST
  )
  .collect();
```

**Convex's Limitations:**

1. **No geospatial indexes** - Convex doesn't support R-tree or similar
2. **No geo queries** - No `geoNear`, `geoWithin`, etc.
3. **S2 cell tokens** - The existing `osm_nodes` table uses `s2Token`, but this is for point data, not route dedup

**Recommended Workaround:**

```typescript
// Option 1: Pre-compute geohash prefixes in pipeline
// In Python:
import geohash2
route.geohash6 = geohash2.encode(route.centroid_lat, route.centroid_lng, precision=6)

// In Convex:
geohash6: v.string(), // e.g., "9q8yv6" covers ~1.2km x 0.6km

// Query nearby:
const nearby = await ctx.db
  .query("curated_routes")
  .withIndex("by_geohash", q => 
    q.gte("geohash6", prefix).lt("geohash6", prefix + 1)
  )
  .collect();
// Then filter by exact distance in JS
```

**OR Option 2: External geospatial DB**

- Use PostGIS for dedup in pipeline
- Convex only stores deduped results
- Tradeoff: Additional infrastructure

**SEVERITY:** HIGH - Geospatial queries will be slow or require workaround

---

### 2.2 Coverage Validation Aggregations

**Proposed Query:**

```python
# Coverage validation report
routes_per_state = count_by_state(routes)
routes_per_archetype = count_by_archetype(routes)
score_distributions = histogram(scores)
```

**Convex Implementation:**

```typescript
// Convex queries for coverage
const routesByState = await ctx.db
  .query("curated_routes")
  .collect()
  .then(routes => 
    routes.reduce((acc, r) => {
      acc[r.state] = (acc[r.state] || 0) + 1;
      return acc;
    }, {})
  );
```

**Performance Concern:**

- **Full table scan** - No index optimization for aggregation
- **Client-side aggregation** - All 20k+ routes loaded into memory
- **No GROUP BY equivalent** - Convex doesn't have SQL-style aggregation

**Mitigation:**

1. **Cache aggressively** - Compute once, store result, invalidate on updates
2. **Incremental updates** - Maintain counters that update on insert/delete
3. **Separate analytics table** - Pre-computed aggregations

```typescript
// Pre-computed coverage stats
coverage_stats: defineTable({
  state: v.string(),
  archetype: v.string(),
  routeCount: v.number(),
  avgCompositeScore: v.number(),
  lastUpdated: v.number(),
})
  .index("by_state", ["state"])
  .index("by_archetype", ["archetype"]);
```

**SEVERITY:** MEDIUM - Acceptable for 20k routes, but won't scale to 200k

---

## 3. Calibration Gate Assessment

### 3.1 Ground Truth Dataset Storage

**Proposed:**
- 50-100 routes from Rider Magazine + FHWA All-American Roads
- 80% agreement threshold enforcement
- Per-archetype calibration

**Missing: Where does this live?**

**Options:**

**Option A: Convex Table**
```typescript
ground_truth_routes: defineTable({
  routeId: v.id("curated_routes"),
  source: v.string(), // 'rider_mag', 'fhwa', 'known_iconic'
  attributes: v.object({
    curviness: v.optional(v.number()),
    scenery: v.optional(v.number()),
    technical: v.optional(v.number()),
    traffic: v.optional(v.number()),
    // ... all score dimensions
  }),
  archetype: v.string(),
  addedAt: v.number(),
});
```

**Option B: JSON File in Repo**
```json
// .pipeline/ground_truth.json
{
  "routes": [
    {
      "routeId": "tail-of-the-dragon",
      "source": "rider_mag",
      "groundTruth": {
        "curviness": 0.95,
        "technical": 0.9,
        "scenery": 0.7
      }
    }
  ]
}
```

**Recommendation: Option B (JSON file)**

- Ground truth is static/slow-changing
- Should be version controlled
- Easy to review in PRs
- Pipeline reads from file, compares against Haiku extraction

**Calibration Gate in Pipeline:**

```python
# pipeline/extraction/calibration.py
def validate_calibration(extracted_routes, ground_truth_path):
    ground_truth = json.load(open(ground_truth_path))
    
    for gt_route in ground_truth['routes']:
        extracted = find_route(extracted_routes, gt_route['routeId'])
        
        # Per-attribute agreement
        attr_agreement = []
        for attr in ['curviness', 'scenery', 'technical']:
            gt_val = gt_route['groundTruth'][attr]
            ext_val = extracted.scores[attr]
            agreement = 1 - abs(gt_val - ext_val)
            attr_agreement.append(agreement)
        
        avg_agreement = mean(attr_agreement)
        if avg_agreement < 0.8:
            raise CalibrationError(
                f"{gt_route['routeId']}: {avg_agreement:.2%} < 80%"
            )
```

**SEVERITY:** MEDIUM - Design decision needed, not blocking

---

### 3.2 Per-Archetype Calibration

**Proposed:** Separate calibration for twisties vs. adventure vs. coastal

**Implementation:**

```python
# Group ground truth by archetype
by_archetype = group_by(ground_truth, 'archetype')

# Calibrate each archetype separately
for archetype, routes in by_archetype.items():
    archetype_agreement = compute_agreement(routes)
    if archetype_agreement < 0.8:
        raise CalibrationError(
            f"{archetype}: {archetype_agreement:.2%} < 80%"
        )
```

**No Convex-specific concerns here** - This is all pipeline-side computation.

---

## 4. Data Quality Reporting

### 4.1 Post-Pipeline Quality Report

**Proposed Output:**
- JSON + markdown report
- Coverage metrics (routes per state/archetype)
- Score distributions
- Quality floor rejections
- Calibration accuracy

**Storage in Convex:**

```typescript
// Optional: Store report history in Convex
pipeline_reports: defineTable({
  runId: v.string(),
  runTimestamp: v.number(),
  reportJson: v.string(), // serialized JSON
  reportMarkdown: v.string(),
  metrics: v.object({
    totalRoutes: v.number(),
    routesByState: v.record(v.number()),
    routesByArchetype: v.record(v.number()),
    qualityFloorRejections: v.number(),
    calibrationAccuracy: v.number(),
  }),
})
  .index("by_runTimestamp", ["runTimestamp"]);
```

**Alternative:** Store reports in object storage (S3), Convex only stores metadata

**Recommendation:** Don't store full reports in Convex
- Reports can be large (markdown + JSON)
- Better as CI artifacts
- Convex stores only summary metrics

**SEVERITY:** LOW - Implementation detail

---

### 4.2 CI Gating Integration

**Proposed:** CI exit code gating based on data quality

**Missing from PRD:** How does this work with Convex?

**Gap:** The pipeline is Python (runs in CI/CD), but Convex deployment is separate.

**Proposed Flow:**

```yaml
# .github/workflows/pipeline.yml
- name: Run curation pipeline
  run: |
    python pipeline/orchestrator.py
    # Generates: .pipeline/quality_report.json

- name: Check quality gates
  run: |
    python pipeline/quality/check_gates.py .pipeline/quality_report.json
    # Exits 1 if gates fail

- name: Deploy to Convex
  if: success()  # Only runs if gates pass
  run: |
    npx convex deploy
```

**Issue:** Quality gates check Python pipeline output, but what about the data actually in Convex?

**Better Approach:**

```python
# After Convex push, verify
def verify_convex_data(convex_client, expected_metrics):
    actual = convex_client.query(functions.countRoutes)
    if actual != expected_metrics['totalRoutes']:
        raise ConvexSyncError(
            f"Expected {expected_metrics['totalRoutes']}, got {actual}"
        )
```

**SEVERITY:** MEDIUM - Needs clarification in PRD

---

## 5. Additional Concerns

### 5.1 Enum Convention Violation

**PRD:** Uses `premium|standard|minimal` as quality tier strings

**Convex Best Practice:** Use `const ... as const` pattern, NOT TypeScript enums

```typescript
// CORRECT
export const QUALITY_TIER = {
  PREMIUM: "premium",
  STANDARD: "standard",
  MINIMAL: "minimal",
} as const;

export type QualityTier = (typeof QUALITY_TIER)[keyof typeof QUALITY_TIER];

// In validator:
qualityTier: v.optional(v.union(
  v.literal("premium"),
  v.literal("standard"),
  v.literal("minimal")
))
```

**SEVERITY:** LOW - Convention issue

---

### 5.2 Index Strategy for New Queries

**Missing:** PRD doesn't specify indexes needed for new query patterns

**Recommended Indexes:**

```typescript
// For mention_frequency filtering
.defineTable(curatedRouteValidator)
  .index("by_mentionFrequency", ["mentionFrequency"]) // NEW

// For quality tier filtering
  .index("by_qualityTier", ["qualityTier"]) // NEW

// For designation filtering
  .index("by_designation", ["designation"]) // NEW

// Composite index for common filters
  .index("by_state_and_archetype_and_tier", ["state", "primaryArchetype", "qualityTier"]) // NEW
```

**SEVERITY:** MEDIUM - Performance optimization

---

## 6. Recommended Actions

### Before Implementation:

1. **CRITICAL:** Define RouteMention storage strategy (new table vs. in-memory only)
2. **CRITICAL:** Fix schema extension strategy (nullable fields require client compatibility)
3. **HIGH:** Design geospatial query workaround (geohash or external DB)
4. **MEDIUM:** Specify ground truth storage location
5. **MEDIUM:** Clarify CI gating flow (pipeline → Convex deployment)

### During Implementation:

6. Add all new fields to validators with `v.optional()`
7. Use camelCase naming (not snake_case)
8. Add indexes for new query patterns
9. Update TypeScript types
10. Ensure React Native clients handle undefined values

### After Implementation:

11. Performance test geospatial dedup with 20k+ routes
12. Verify calibration gate actually fails when it should
13. Load test coverage report queries
14. Monitor Convex deployment size (new fields increase document size)

---

## 7. Questions for User

1. **RouteMention Storage:** Should raw forum mentions be persisted in Convex (audit trail) or discarded after aggregation (minimal storage)?

2. **Geospatial Queries:** Accept geohash-based approximation (±1km) or invest in PostGIS for true geospatial dedup?

3. **Ground Truth Location:** Prefer JSON file in repo (version controlled) or Convex table (queryable)?

4. **Client Compatibility:** Can React Native app handle undefined values for all new fields, or need a feature flag?

5. **Report Storage:** Store quality reports in Convex (queryable history) or CI artifacts (cheaper)?

---

## Appendix: Convex Schema Diff

### Current Schema:

```typescript
// models/curated-routes.ts (existing)
export const CURATED_ROUTE_FIELDS = {
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  source: v.union(...),
  primaryArchetype: v.union(...),
  // ... 20+ fields
  // NO: description, rating, designation, etc.
}
```

### Proposed Schema (Corrected):

```typescript
// models/curated-routes.ts (with additions)
export const CURATED_ROUTE_FIELDS = {
  // ... existing 20+ fields
  
  // NEW FIELDS (all optional for backward compatibility)
  description: v.optional(v.string()),
  rating: v.optional(v.number()),
  designation: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  sourceRefs: v.optional(v.array(v.string())),
  highwayNumber: v.optional(v.string()),
  elevationGainM: v.optional(v.number()),
  surface: v.optional(v.string()),
  aadt: v.optional(v.number()),
  mentionFrequency: v.optional(v.number()),
}

// NEW TABLE
// convex/schema.ts
route_mentions: defineTable({
  roadName: v.string(),
  highwayNumber: v.optional(v.string()),
  state: v.optional(v.string()),
  sentimentScore: v.number(),
  attributes: v.record(v.number()),
  source: v.string(),
  sourceAuthority: v.number(),
  postUrl: v.string(),
  postScore: v.number(),
  mentionDate: v.number(),
  processedAt: v.number(),
  routeId: v.optional(v.id("curated_routes")),
})
  .index("by_routeId", ["routeId"])
  .index("by_source_and_date", ["source", "mentionDate"])
  .index("by_roadName_and_state", ["roadName", "state"]);
```

---

**END OF REVIEW**
