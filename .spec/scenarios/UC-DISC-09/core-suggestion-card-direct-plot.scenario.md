---
service: mobile-app
feature: UC-DISC-09
priority: P0
type: happy_path
tier: visible
scope: journey
---

# UC-DISC-09 core (JOURNEY): suggestion cards over input → direct plot on tap

When no route is on the map, curated-route suggestion cards appear over the chat input
showing a real road name + mileage from the live catalog. Tapping a card plots that exact
curated route on the map **immediately, with no chat round-trip** (the agent is bypassed).
Cards disappear once a route is shown.

This is a **journey flow** because it spans: `useCuratedDiscovery` hook → suggestion card
render → `handleSelectCuratedRoute` direct-plot wiring → map render. No single task owns
the integrated path; the gate replays it after DISC-016/017 + the hook land.

**Verify (e2e, real device + live Convex):**
- With no route on the map, suggestion cards display real curated road names + mileage.
- Tapping a card plots that exact route on the map within ~1s with no chat message sent.
- Once a route is plotted, the suggestion cards disappear.
