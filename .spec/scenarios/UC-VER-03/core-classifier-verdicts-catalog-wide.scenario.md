---
service: convex
feature: UC-VER-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-VER-03 core: cross-provider classifier records verdicts that gate freeways out

Run the real ride-worthiness classifier (low tier, different provider than the geometry
tier) against the real dev deployment on a sample that includes "Route 680--Alameda County"
(a commuter-freeway FHWA inventory row that lever 3 can give perfectly valid geometry) and a
known twisty (e.g. "Twist of Tepusquet Loop"). Every sampled route ends with a persisted
`rideWorthiness` object — verdict in {ride, marginal, not_a_ride}, a non-empty reason, the
model string, and a timestamp — stored on the route doc as queryable evidence. The freeway
row, even with `geometryStatus='generated'` and a passing verification block, computes
`riderReady=false` because its verdict is `not_a_ride`; the twisty computes `riderReady=true`
when its other conditions hold. A `marginal` verdict alone neither blocks rider-ready nor
makes the route retirement-eligible.

**Verify (real dev deployment + real low-tier LLM):**
- `npx convex run curatedGeometryClassify:backfillClassify '{"sample":10}'` → every sampled
  route doc gains `rideWorthiness.{verdict,reason,model,classifiedAt}`.
- The classifier model string's provider differs from the geometry tier's provider (grep the
  tier map + inspect the stored model value).
- Route 680--Alameda County: `rideWorthiness.verdict='not_a_ride'` →
  `npx convex run curatedGeometry:recomputeRiderReady` leaves `riderReady=false` despite
  valid geometry; it appears in no `listCuratedRoutes` result.
- A seeded `marginal` route with passing geometry: `riderReady=true`; not in any
  retirement-candidate list.
- Verdicts are readable per routeId (api-contract): verdict + reason + model + classifiedAt.
