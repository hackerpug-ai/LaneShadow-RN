---
service: mobile
feature: UC-SURF-06
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-SURF-06 edge: a saved route is retired and un-retired while Rachel has it open

Rachel is looking at the detail view of a saved route at the exact moment the founder retires
it (all levers failed, confirmed). Convex reactivity delivers the change under her open
screen: the view must degrade honestly in place — the line disappearing or an absence state
appearing is acceptable; a crash, a blank screen, or a redirect that loses her scroll
position is not. She backgrounds the app; the founder un-retires the route an hour later
(a manual geometry fix landed); she foregrounds and pulls the detail again — full restoration
with the fixed line, no stale retired treatment cached anywhere. Second framing: she saved
the route, the route got retired, and only THEN does she open it for the first time — the
first paint after retirement must already be the honest state, proving the reachability
guarantee isn't an artifact of a warm client cache but a real read-path contract
(`getCuratedRouteDetail` resolving retired rows for saved-route holders).
