---
service: mobile-app
feature: UC-WHY-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-WHY-02 edge: three different internal non-ready states render byte-identical rider copy

Three routes are staged on the real dev deployment in distinct internal states: route A has
no enrichment record at all (not yet generated); route B is marked `abstained` on the route
doc (no content row exists); route C holds a `qa_failed` row with its rejected text sitting
in the table. On device, all three detail screens must render the exact same absence
presentation — identical copy, identical layout, no hint of which state is which — while
the operator's coverage report still distinguishes the three precisely. The rider never
learns the difference; telemetry does.

**Verify (e2e real device Maestro + integration on live Convex):**
- Text-assert the absence section on A, B, and C → identical "No write-up yet" copy and
  identical testIDs on all three.
- Route C's rejected `whyText` appears nowhere in the rendered screen.
- The coverage report (operator CLI) counts A, B, and C in three different buckets.
