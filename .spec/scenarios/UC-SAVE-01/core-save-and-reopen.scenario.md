---
service: mobile-app
feature: UC-SAVE-01
priority: P0
type: happy_path
tier: visible
scope: journey
---

# UC-SAVE-01 core (JOURNEY): save curated route via curatedRouteRef → reopen from Saved

From the lean detail screen, tapping Save writes a `saved_routes` row via `curatedRouteRef`
(fires `recordRouteFeedback('save')`, persists name + curatedRouteId only — no synthesized
PlanInput/RouteSnapshot/legs). The saved route then appears in the existing Saved screen
list and reopens to its detail without a legs/PlanInput error.

This is a **journey flow** because it spans: `useSaveCuratedRoute` mutation (SAVE-001) →
`recordRouteFeedback('save')` signal → Saved list tolerance (SavedRouteCard handles a
curatedRouteRef row) → reopen path. Replayed after Sprint 02 lands.

**Verify (e2e, real device + live Convex):**
- Tap Save on a curated route detail → row appears in Saved.
- Reopen the saved curated route → its detail opens (no legs/PlanInput crash).
- The Saved list renders without crashing for a curatedRouteRef row alongside legacy rows.
