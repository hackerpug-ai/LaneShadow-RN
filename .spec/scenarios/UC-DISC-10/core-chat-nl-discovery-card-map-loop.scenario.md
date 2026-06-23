---
service: mobile-app
feature: UC-DISC-10
priority: P0
type: happy_path
tier: visible
scope: journey
---

# UC-DISC-10 core (JOURNEY): chat NL discovery via the card→map loop

Typing a natural-language request ("twisties near Asheville", "scenic roads in North
Carolina") routes through the agent's `discoverCuratedRoutes` tool (DATA-008 determinism
seam) and returns curated routes as chat route-cards with the latest plotted on the map.
Pressing an earlier curated-route card re-renders it on the map and returns the rider to
map view.

This is a **journey flow** because it spans: chat input → agent ReAct loop → curated-
discovery tool → `listCuratedRoutes` → chat card render → map plot. The gate replays this
after DISC-020 + DATA-008/008b land.

**Verify (e2e, real device + live Convex + real agent):**
- "twisties near Asheville" returns curated route cards with non-zero composite scores.
- The latest curated route plots on the map.
- Tapping an earlier card re-renders it on the map and returns to map view.
- Composite scores render as %/bars on the 0–1 scale (never 0%, never a raw 0–100).
