---
service: mobile-app
feature: UC-DTL-01
priority: P0
type: happy_path
tier: visible
scope: journey
---

# UC-DTL-01 core (JOURNEY): lean detail renders fully populated for a known route

A rider taps a discovery pin or list row and the curated-route detail screen opens showing
all six sections (header, summary, score bars, map, conditions, actions) populated from
lean curated-route fields. The route name renders at the top, primaryArchetype as a Badge,
lengthMiles via StatRow, summary block, five labeled score bars + composite headline,
polyline-or-centroid map, weather pills, Save + Ride It action row.

This is a **journey flow** because it spans: tap wiring on the plan view (DTL-001) →
`getCuratedRouteDetail` query (DATA-006) → detail screen render (DESIGN-002). Replayed
after the Sprint 02 tasks land.

**Verify (e2e, real device + live Convex):**
- Tap a curated route on the plan view → detail opens with all six sections.
- The route name, archetype badge, length, summary, score bars, composite, map, weather,
  and Save/Ride It row all render without crashing.
