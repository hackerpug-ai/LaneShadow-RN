---
service: mobile
feature: journey
covers_ucs: [UC-REC-02, UC-REC-03, UC-VER-01, UC-SURF-01, UC-SURF-03, UC-SURF-05, UC-SURF-06]
priority: P0
type: happy_path
tier: visible
scope: shared
---

# Journey: the rider previews roads that finally plot

The rider-facing payoff arc, driven end-to-end on the iOS simulator against the live dev
deployment.

Von Hoak Loop (Florida) — reconstructed from its turn-by-turn description to 23.1 mi over 10
anchors, `provenance='ai_reconstructed'` — and a road-name route recovered by lever 3 with
`provenance='name_routed'` both pass the gate and flip rider-ready. Returning Rider Rachel
scrolls the carousel, finds Von Hoak Loop, and taps it: the real 23-mile loop plots on the
map (Durant Rd → Turkey Creek Rd → Keysville Rd, not a dot, not a straight line). On the
detail view she reads the calm provenance caption "Route line reconstructed from the ride
description" — informational, not a warning. She saves the route. Later, even if that route
were quarantined or retired by a future pass, her saved copy still opens its detail honestly.

**Verify (Maestro on iOS sim, live dev deployment; JS-only changes Metro-served):**
- Seed/confirm the two recovered rows (`ai_reconstructed` + `name_routed`) are
  `riderReady=true` on dev.
- Maestro flow: cold boot → dismiss dev-client menu → discovery → carousel page to Von Hoak
  Loop → tap → assert plotted polyline (≥2-pt line geometry rendered, no centroid marker) →
  open detail → assert `curated-detail-provenance` text equals the ai_reconstructed copy.
- Detail of the `name_routed` route shows "Route line generated from the road name"; a
  `scraped_promoted` control shows NO caption node.
- Save Von Hoak Loop → backend flips it non-rider-ready (test mutation) → reopen from Saved
  Routes → detail still resolves (honest state), while discovery/browse omit it.
