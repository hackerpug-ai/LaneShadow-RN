---
service: convex
feature: UC-REC-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-REC-03 core: an A-to-B named route re-routes deterministically with no LLM

~1,076 broken routes have parseable structure in the name itself (`A – B`, `from X to Y`,
highway refs like `Route 680--Alameda County`). The operator runs lever 3 on the real dev
deployment against one real endpoint-named row. The deterministic parser (the existing
`parseRouteEndpoints()` — no LLM anywhere in this lever) extracts the endpoints; Google
Geocoding resolves each region-biased with nearest-to-centroid selection; Google Routes
produces the connecting line; the same shared gate admits or rejects; on PASS the persist
writes `provenance='name_routed'` plus the verification block.

**Verify (real dev deployment + REAL Google APIs, zero LLM calls):**
- `npx convex run curatedGeometryReroute:rerouteForRoute '{"routeId": "<a-to-b row>"}'` →
  result `generated` or `review`, never a stored-but-unverified line.
- On PASS: side-table row with `provenance='name_routed'`, `verification.verdict='pass'`,
  ratio ∈ [0.6, 1.6], both endpoint anchors ≤150 mi from centroid.
- Zero calls to any LLM provider during the run (no LLM tier resolved; cost delta is
  geocode + routes only, ≈$0.02).
- `backfillReroute '{"sample": 10}'` report: processed = generated + review + failed, with
  a resumable `continueCursor`.
