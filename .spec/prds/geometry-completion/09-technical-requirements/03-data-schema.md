---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Data Schema

**Decision: status-field pattern, NO new review-queue table.** (1) It mirrors the enrichment
sibling exactly — that PRD uses a status union + `by_status` index and explicitly rejected a
queue table; (2) a review item is a *derived query over route state*, not an entity with an
independent lifecycle — a fourth geometry table would add dual-write consistency burden for
no new information; (3) the authoritative queue key must exist even when **no candidate line
was produced** (e.g. lever-2 geocoding yielded <2 anchors), so the queue must live on the
**route doc** (`geometryStatus='review'`).

## Deltas to `curated_routes` (additive optional on `curatedRouteValidator`, `shared/models/curated-routes.ts`)

```ts
// Geometry pipeline lifecycle — extends the existing geometryStatus union
geometryStatus: v.optional(v.union(
  v.literal('generated'),   // validated line present, gate PASS — riderReady-eligible
  v.literal('unresolved'),  // legacy: no line
  v.literal('failed'),      // legacy: hard error
  v.literal('review'),      // candidate failed gate/repair (≤2 attempts) → queue
  v.literal('retired'),     // all levers failed / not_a_ride + founder decision → excluded
)),
geometryProvenance: v.optional(v.union(
  v.literal('scraped_promoted'),  // lever 1
  v.literal('ai_reconstructed'),  // lever 2
  v.literal('name_routed'),       // lever 3
)),
riderReady: v.optional(v.boolean()),            // deterministic SURF gate flag (INDEXED)
rideWorthiness: v.optional(v.object({           // classifier output (signal-as-data)
  verdict: v.union(v.literal('ride'), v.literal('marginal'), v.literal('not_a_ride')),
  reason: v.string(),
  model: v.string(),                            // cross-provider, e.g. "openai:gpt-4o-mini"
  classifiedAt: v.number(),
})),
retiredAt: v.optional(v.number()),              // reversible — unset to un-retire
retirementReason: v.optional(v.string()),
duplicateOf: v.optional(v.string()),            // canonical routeId; shadows excluded everywhere
quarantine: v.optional(v.object({               // HYG: length/test-row quarantine
  reason: v.union(v.literal('zero_length'), v.literal('length_outlier'), v.literal('test_row')),
  flaggedAt: v.number(),
})),
scoreScaleNormalizedAt: v.optional(v.number()), // HYG idempotency marker (÷100 applied at rest)
couchVerdict: v.optional(v.object({             // VER couch-sample per-route verdict
  verdict: v.union(v.literal('true'), v.literal('off'), v.literal('wrong')),
  notes: v.optional(v.string()),
  recordedAt: v.number(),
})),
```

## Deltas to `curated_route_geometry` (verification block on `curatedRouteGeometryValidator`)

```ts
provenance: v.optional(v.union(
  v.literal('scraped_promoted'), v.literal('ai_reconstructed'), v.literal('name_routed'),
)),
verification: v.optional(v.object({
  routedMiles: v.number(),                      // decoded line length (haversine sum)
  claimedMiles: v.union(v.number(), v.null()),  // route.lengthMiles (null if quarantined)
  ratio: v.union(v.number(), v.null()),         // routed / claimed
  verdict: v.union(v.literal('pass'), v.literal('review')),
  degenerate: v.boolean(),
  attempts: v.number(),                         // ≤2 for lever 2
  anchorCount: v.number(),
  verifiedAt: v.number(),
})),
anchors: v.optional(v.array(v.object({          // audit + review + repair replay
  query: v.string(), lat: v.number(), lng: v.number(), formatted: v.optional(v.string()),
}))),
```

## Index needs

- `curated_routes.by_riderReady_and_composite_score` (`['riderReady','compositeScore']`) —
  gated browse. `listCuratedRoutes` best-mode becomes an index walk that stops at `limit`
  docs and never scans non-ready rows (each row carries a ~7.4 KB `searchEmbedding`; the
  16 MB-read constraint is documented in `curatedRoutes.ts`).
- `curated_routes.by_geometry_status` (`['geometryStatus']`) — REVIEW + retired queues
  (authoritative). `eq('geometryStatus','review')` matches set values; the absent-optional
  gotcha only bites `eq(absent)`.
- Side table: verification stays a nested object; the queue needs no side-table index because
  the route doc mirrors the verdict. If numeric-audit sweeps want one later, hoist
  `verificationVerdict` top-level and add `by_verification_verdict` — deferred.

Existing indexes (`by_composite_score`, `by_routeId`, `by_state`, `by_name_lower`,
`by_highway_number`, vector `by_embedding`) unchanged.

## Deploy ordering

Push schema + new indexes **before** the first backfill writes `riderReady`; the composite
index backfills via the `recomputeRiderReadyBatch` sweep, not at push time. Additive-optional
fields are data-safe (Convex re-validates on push; enrichment precedent).
