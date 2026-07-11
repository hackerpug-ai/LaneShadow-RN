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

> **`geometryStatus` lives in THREE code sites (v3.1.0):** the shared validator
> (`shared/models/curated-routes.ts`), the `listCuratedRoutes` return validator
> (`convex/curatedRoutes.ts`), and `GEOMETRY_STATUS` in `convex/curatedGeometry.ts` (the
> `patchRouteGeometry` arg validator). Adding `review`/`retired` must touch all three, and the
> new `persistGeometryVerified`/`setReviewVerdict`/`retireRoute` mutations need their own
> extended arg validators — `patchRouteGeometry`'s current union cannot write the new values.

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

- **Geospatial `riderReady` filterKey (v3.1.0, risk #22):** the discovery/browse **bbox +
  nearest** modes run through the geospatial component (`convex/geospatialIndex.ts`), whose
  filterKeys are `{state, primaryArchetype}` only — a Convex compound index cannot gate them,
  and `searchCuratedRoutes` wraps **nearest**. To serve rider-ready-only there, add `riderReady`
  as a geospatial filterKey (changes the index type param → **re-insert ~5,654 points**, NOT
  additive) OR post-filter in memory with a raised over-fetch + a documented sparse-region
  failure mode. This is why `listCuratedRoutes`'s "all modes gated" claim was corrected in
  04-api-design.

Existing indexes (`by_composite_score`, `by_routeId`, `by_state`, `by_name_lower`,
`by_highway_number`, vector `by_embedding`) unchanged.

## Deploy ordering

Push schema + new indexes **before** the first backfill writes `riderReady`; the composite
index backfills via the `recomputeRiderReadyBatch` sweep, not at push time. Additive-optional
fields are data-safe (Convex re-validates on push; enrichment precedent). **Geospatial re-index
is NOT additive (v3.1.0):** if `riderReady` becomes a geospatial filterKey, the ~5,654-point
re-insert (`geospatial.insert` per row) is a distinct migration step sequenced **after**
`recomputeRiderReadyBatch` populates the flag and before the SURF gate goes live on the geography
modes — not a schema push.

## Agent layer (AGT, v3.0.1) — no new tables; concrete field deltas

**`session_messages`** (`sessionMessageValidator`) — provenance stamping so every reply is
traceable to the prompt + model + trace that produced it:

```ts
promptVersion: v.optional(v.string()),  // "orchestrator@v1" — stamped on assistant/system rows
model: v.optional(v.string()),          // resolved model id from the tier map
tier: v.optional(v.string()),           // "orchestrator"
traceId: v.optional(v.string()),        // OTEL/LangSmith trace id — one-click "why did it say that"
```

**`planning_sessions`** (`planningSessionValidator`) — the working-memory block, co-located
because a planning session IS the in-session memory thread (1:1; avoids a join; matches the
scoped in-session lifetime). Read/written by deterministic Convex mutations (no `@mastra/memory`
adapter — v3.1.0, risk #16) and injected as the dynamic prompt block, never by agent decision:

```ts
agentMemory: v.optional(v.object({
  constraints: v.array(v.string()),     // persistent, e.g. ["no highways","nothing too technical"]
  resolvedCenter: v.optional(v.object({ lat: v.number(), lng: v.number(), label: v.string() })),
  updatedAt: v.number(),
})),
```

**`performance`** (the existing `recordAgentRun` path) — extend with `promptVersion` + `tier`
(it already stores model/agent/tokens/cost) so cost/latency dashboards group by prompt
version.

**`favorite_roads` insufficiency (v3.1.0, L4):** the `getUserFavorites` tool output promises
`rating/rideCount/lastRidden/lat/lng`, but `favorite_roads` stores only `{name, geometry,
bounds}` today. Source the missing fields from `saved_routes.curatedRouteRef` → curated scores
(derived), or add a `favorite_roads` schema delta; fields absent in both are returned
optional/omitted, never fabricated.

**`agentMemory` is written by deterministic mutations, NOT a Mastra storage adapter (v3.1.0):**
`@mastra/memory` is dropped (01-architecture-posture, risk #16) — `agentMemory` is read/written
by plain Convex mutations and injected as the dynamic prompt block, so there is no adapter
interface to track and no double-load.

**Eval artifacts stay repo files** (`scripts/agent-evals/fixtures/*.transcript.json`,
`agent-evals/report.json`) — no database rows. The sanctioned `agent_memory` table remains
only as an install-time escape if Mastra's storage interface demands per-key KV semantics
the single `agentMemory` object can't satisfy (risk #16) — not pre-committed.
