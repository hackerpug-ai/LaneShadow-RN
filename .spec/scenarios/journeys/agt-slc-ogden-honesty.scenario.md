---
service: convex
feature: journey
covers_ucs: [UC-AGT-01, UC-AGT-02, UC-AGT-03, UC-AGT-04, UC-AGT-05, UC-SURF-02, UC-SURF-04]
priority: P0
type: happy_path
tier: visible
scope: shared
---

# Journey: the founder's failed session, replayed honest

The exact conversation that nearly killed the project — captured 2026-07-10 from live
`session_messages` — becomes the headline arc the rebuilt agent must pass, replayed via
`pnpm agent:eval` (model seam fixtured; tools, queries, and gates real against the dev
deployment) plus one live smoke pass.

The rider (session location ≈ SLC) runs the original four turns. "Slc to park city" still
compiles a real route through the preserved deterministic pipeline — the control that proves
the rebuild broke nothing. "What do you think the best ride is in slc" and "OK what's
scenic" now resolve a center from the session location and call `searchCuratedRoutes` with
it — the reply presents rider-ready routes with real distances (the audit found 7 plottable
within 30 mi of SLC once the catalog levers land), or, pre-levers, honestly names the thin
radius and the nearest real option instead of "I didn't find any." "I want something that
twists along side the mountain up in ogden" geocodes Ogden (~41.22, -111.97), searches
nearest-first within the radius, and — because ≤30 mi of Ogden genuinely holds nothing
rider-ready pre-levers — answers with the honest thin-coverage statement, the nearest real
alternative with its distance, and an offer to plan a custom twisty route via the routing
pipeline. Capitol Reef (~170 mi) can appear in no reply as "near Ogden" under any framing.

**Verify (fixtured replay + live smoke + Maestro):**
- `pnpm agent:eval` on `fixtures/slc-ogden-2026-07-10.transcript.json` → PASS: every
  discovery turn's captured `searchCuratedRoutes` args carry a center (SLC session coords /
  geocoded Ogden); graders green on asked-when-ambiguous, distance-stated,
  no-false-proximity; the routing turn produced a compiled route.
- Negative baseline: the same transcript graded against the RECORDED v1 replies → FAIL
  (ungrounded national/state-best + false "near Ogden" prose), proving the graders have
  teeth.
- `pnpm agent:eval --smoke` (founder-triggered, cost-capped) → the live orchestrator model
  reproduces the grounded behavior on the dev deployment; per-turn traces visible in
  LangSmith.
- Maestro chat flow (cold boot, live dev): the Ogden turn renders distances on every
  suggestion and the thin-coverage copy with the custom-route offer.
