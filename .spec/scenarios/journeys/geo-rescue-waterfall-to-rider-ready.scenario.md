---
service: convex
feature: journey
covers_ucs: [UC-HYG-02, UC-REC-04, UC-REC-02, UC-VER-01, UC-VER-05, UC-SURF-01, UC-SURF-02]
priority: P0
type: happy_path
tier: visible
scope: shared
---

# Journey: from broken dot to rider-ready suggestion

The full arc of the geometry-completion promise, run against the real dev deployment with
real LLM + Google APIs on a bounded sample.

Hygiene first collapses the four "Cherohala Skyway" rows to one canonical row (shadows carry
`duplicateOf`). The operator then runs the rescue waterfall sample: Twist of Tepusquet Loop —
a centroid-only route whose summary holds turn-by-turn directions — reconstructs through the
lever-2 pipeline (LLM anchors → region-biased geocoding → via-waypoint routing) and the
deterministic gate PASSes it at ratio ≈ 1.00 with `provenance='ai_reconstructed'`. The
founder couch-samples the reconstructed set and records a passing verdict, which unlocks the
full batch. The `riderReady` recompute flips the route true, and the discovery agent tool —
whose centroid fallback no longer exists — starts serving it. A surface where 7 of the top 10
national suggestions used to be junk now returns only routes that plot real roads.

**Verify (real dev deployment, real LLM + Google, Maestro for the final hop):**
- `npx convex run curatedGeometryHygiene:dedupeGroups` → "Cherohala Skyway" resolves to one
  canonical row; shadows excluded from `listCuratedRoutes`.
- `pnpm tsx scripts/reconstruct-curated-geometry.ts --lever=2 --sample=5` (sample includes
  Tepusquet) → persisted `generated` row, `provenance='ai_reconstructed'`,
  `verification.ratio` ∈ [0.6, 1.6], anchors[] recorded.
- `scripts/geometry-couch-sample.ts` + `recordCouchVerdict` (pass) → `couchGateStatus` = pass.
- `recomputeRiderReady` → route's `riderReady=true`; agent tool result includes it; Maestro
  cold-boot discovery flow plots its real line (no centroid dot anywhere in the run).
