---
service: convex
feature: journey
covers_ucs: [UC-REC-02, UC-VER-02, UC-VER-01, UC-VER-04, UC-SURF-04]
priority: P0
type: error_handling
tier: visible
scope: shared
---

# Journey: a route the gate won't trust stays honestly absent

The fail-closed arc — the exact inversion of the root-cause failure that shipped wrong
geometry as truth.

Old Hwy 40 (Cisco Grove → Donner Lake, claimed 16 mi) goes through lever-2 reconstruction on
real APIs. The first attempt routes 91.7 mi — the deterministic gate rejects it (ratio 5.73).
The bounded repair round feeds the geocode log and lengths back to the LLM; the second
attempt lands 25.9 mi — better, but ratio 1.62 still fails the band. With the 2-attempt
budget spent, the route lands in the REVIEW queue with both attempts recorded, its
`riderReady` stays false, and no line is ever stored as servable. A rider searching that
stretch of the Sierra gets the honest thin-region treatment — never a wrong squiggle
presented as truth. The founder later opens the queue, sees the failure reason and both
measured lengths, and dispositions it (retry / accept / retire), with the decision recorded.

**Verify (real dev deployment, real LLM + Google):**
- `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId":"motorcycleroads:old-hwy-40-cisco-grove-to-donner-lake"}'`
  → final `geometryStatus='review'`; `verification.attempts=2`; both lengths recorded;
  verdict `review`.
- `listCuratedRoutes` + agent tool for that region → route absent from every suggestion
  surface; honest absence copy served instead of a dot.
- `listGeometryReviewQueue` → the route appears with its failure reason;
  `rejectReviewItem`/`approveReviewItem` records the founder's disposition.
