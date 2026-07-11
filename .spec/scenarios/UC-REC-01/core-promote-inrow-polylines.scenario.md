---
service: convex
feature: UC-REC-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-REC-01 core: a real BBR rider-drawn polyline is promoted to the side table at $0

~1,752 broken routes carry a real scraped polyline in the legacy in-row `routePolyline` field
that the side-table read path ignores. The operator runs lever 1 on the real dev deployment
against one known BestBikingRoads row (any BBR row marked `unresolved` whose in-row polyline
decodes cleanly). The promoter decodes the legacy line, measures its haversine length,
gate-checks ratio ∈ [0.6, 1.6] against the claimed miles plus the degenerate check, and on
PASS writes the side-table geometry row with `provenance='scraped_promoted'` and a full
verification block, flipping the route to `geometryStatus='generated'`. No LLM call, no
Google call — the pass costs $0 and runs in the default runtime.

**Verify (real dev deployment, no external APIs used):**
- `npx convex run curatedGeometryPromote:promoteForRoute '{"routeId": "<bbr-row>"}'` →
  result `generated`.
- Side-table row exists for that routeId: `provenance='scraped_promoted'`,
  `verification.verdict='pass'`, `verification.ratio` ∈ [0.6, 1.6],
  `verification.routedMiles` > 0, decodable ≥2-pt line.
- The legacy in-row `routePolyline` field on the route doc is byte-identical to before
  (read-only input, never mutated).
- `backfillPromote '{"sample": 25}'` → report where promoted + rejected = processed, and
  zero external network calls occurred (no key env vars read).
