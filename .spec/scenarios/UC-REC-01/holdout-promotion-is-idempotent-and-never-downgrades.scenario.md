---
service: convex
feature: UC-REC-01
priority: P2
type: edge_case
tier: holdout
scope: task-local
---

# UC-REC-01 holdout: re-running lever 1 over an already-recovered catalog changes nothing

Run the full lever-1 backfill twice back-to-back over the same pool. The second run must skip
every route the first run promoted (their `geometryStatus='generated'` excludes them from the
eligibility scan) — verified by the second report showing processed ≈ 0 and by spot-checking
that a promoted route's `verification.verifiedAt` timestamp is unchanged from the first run
(proof it was skipped, not re-written). Separately, a route that lever 2 already recovered
with `ai_reconstructed` provenance is never touched by a later lever-1 run even though it
still carries an in-row `routePolyline` — a lower lever must never overwrite a higher lever's
accepted geometry or its provenance. First PASS wins, permanently, unless an operator
explicitly clears the geometry.
