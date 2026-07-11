---
service: convex
feature: UC-VER-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-VER-02 core: the bounded repair round improves Old Hwy 40 and still holds it

Run the real lever-2 reconstruction against the real dev deployment, real geometry-tier LLM,
and real Google APIs on the PoC's known REVIEW case: "Old Hwy 40 Cisco Grove to Donner Lake"
(claimed 16 mi). The first attempt routes to roughly 91.7 mi (ratio ≈ 5.7) and fails the
gate. The engine then makes exactly one repair attempt whose LLM input contains the
first attempt's geocode log and the routed-vs-claimed lengths; in the PoC this pulled the
route to 25.9 mi (ratio ≈ 1.62) — better, but still outside 0.6–1.6. The engine keeps the
better attempt by ratio distance, records `verification.attempts=2`, and lands the route at
`geometryStatus='review'` with the candidate line stored for founder eyes. At no point does
either failing attempt become `generated`, and `riderReady` never flips true.

**Verify (real dev deployment + real LLM + real Google, PoC fixture route):**
- `npx convex run curatedGeometryReconstruct:reconstructForRoute
  '{"routeId":"motorcycleroads:old-hwy-40-cisco-grove-to-donner-lake"}'` → final
  `geometryStatus='review'`.
- Side-table `verification.attempts` = 2; `anchors[]` persisted; stored candidate is the
  ratio-closer attempt.
- Both attempts' routed lengths retrievable by the operator (perRoute report or verification
  numbers) — expect ~91.7 then ~25.9 against claimed 16.
- `curated_routes.riderReady` for this routeId is absent/false; the route appears in
  `listGeometryReviewQueue` with a ratio-failure reason.
- A third LLM call for this route in the same run does not exist (attempt budget hard cap).
