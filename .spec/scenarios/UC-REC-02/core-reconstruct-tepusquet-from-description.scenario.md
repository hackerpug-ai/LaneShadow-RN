---
service: convex
feature: UC-REC-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-REC-02 core: Twist of Tepusquet Loop reconstructs from its prose at ratio 1.00 on real APIs

The PoC (2026-07-10) proved this exact route: its description names the chain Betteravia Rd →
Foxen Canyon Rd → Santa Maria Mesa Rd → Tepusquet Canyon Rd → Hwy 166 → US-101 around Santa
Maria, CA. The operator runs the productionized lever 2 against the real dev deployment with
the real geometry-tier LLM and real Google Geocoding + Routes. The LLM emits ordered
intersection anchors via the forced `emit_anchors` tool call; each anchor geocodes
region-biased and must sit ≤150 mi from the route centroid; Google Routes routes through them
as via-waypoints; the deterministic gate admits the line (PoC baseline: 41.1 routed vs 41
claimed, ratio 1.00, 7 anchors, ~12s); the persist writes provenance `ai_reconstructed`, the
verification block, and the anchors array.

**Verify (real dev deployment + REAL LLM + REAL Google APIs, ~$0.07):**
- `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId": "motorcycleroads:twist-of-tepusquet-loop"}'`
  → result `generated` in ≤2 attempts.
- Side-table row: `provenance='ai_reconstructed'`, `verification.verdict='pass'`,
  `verification.ratio` ∈ [0.9, 1.1] (PoC baseline 1.00), `verification.anchorCount` ≥ 5,
  `anchors[]` persisted with lat/lng each ≤150 mi from the centroid.
- Route doc flips to `geometryStatus='generated'`; after `recomputeRiderReady` the route is
  eligible (subject to the other flag inputs).
- The decoded line has >4 points and ≥1 point per mile (not degenerate).
