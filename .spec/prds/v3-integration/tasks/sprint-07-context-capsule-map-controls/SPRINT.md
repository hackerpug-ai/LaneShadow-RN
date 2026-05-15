# Sprint 07: Context Capsule, Map Controls + Autocomplete Carry-Forward

**Sequence:** 7
**Timeline:** Phase 3 · Week 1 (post-Sprint-06)
**Status:** Done (design/snapshot review tasks deleted from scope on 2026-05-07)

---

## Overview

On 2026-05-06 the design system shipped four coupled changes (the *map-view redesign*):

1. A new `mol-context-capsule` molecule that replaces the legacy floating greeting headline + standalone advisory card with a single state-driven glass container exposing five state variants (`--idle`, `--planning`, `--route`, `--warning`, `--saved`).
2. A new `org-map-controls` organism — a right-edge **vertically-centered** vertical workbar (zoom +/-, recenter, layers, save, mode-toggle) — codifying the React Native production controls into the design system. The workbar is anchored along the midline of the map canvas (NOT under the topbar) so it reads as map chrome, mirrors the production placement, and keeps every chip within comfortable thumb-reach on a one-handed phone hold.
3. A new "Container Principle" rule: every textual UI element overlapping the map must sit in a token-driven glass container. No "floating" typography directly on the map.
4. A Mapbox-styled SVG vocabulary (water polygons, parks, streets, neighborhood labels) painted on every view's design reference, replacing the prior topo-curves-only mock.

Sprint 06 production was implemented against the **prior** design contract (legacy `view-idle-screen__greeting` headline + advisory card, no right-side map controls), so as of 2026-05-06 the captures no longer matched the design references. Sprint 07 closes the implementation gap by shipping the new components on iOS + Android, retrofitting the idle state, fixing the iOS layer/map-token regressions found during gate work, and carrying forward autocomplete evidence. The original strict design/snapshot review tasks were deleted by the user on 2026-05-07 and are intentionally not part of this sprint closure.

The Sprint 06 map host (`LSMapView` / `LSMapHost`) is reused as-is; this sprint only adds new components and updates the idle-state overlay surface. Re-implementing the map host is a planning anti-pattern.

Autocomplete was moved into Sprint 07 on 2026-05-07. Backend, iOS, and Android automated evidence is archived under `gate-evidence/autocomplete/`; physical-device/manual observations are recorded honestly as PASS or BLOCKED and are not fabricated.

---

## Human Testing Gate

**Gate:** A signed-in rider on iOS + Android opens the app cold and arrives at the idle state of the map view, where (a) the new `LSContextCapsule` glass container sits centered below the topbar showing the `--idle` state with greeting headline + meta row, (b) the new `LSMapControls` workbar sits at the **vertical middle of the right edge** of the map canvas with zoom cluster + recenter + layers + chat-mode toggle chips, (c) the legacy floating greeting headline and standalone advisory card are gone, and (d) the carried-forward autocomplete flow shows at most 3 place recommendations and does not enter planning/routing until Send. Design/snapshot review gates were deleted from this sprint scope.

### Test Steps

1. Sign in via real Clerk auth on iOS Simulator + Android Emulator. Confirm cold-start lands on the idle state of the map view with the new `LSContextCapsule` centered below the topbar — NOT the legacy `t-opinion-xl` floating Newsreader headline.
2. Confirm the capsule shows "Where are we riding *today*, {firstName}?" in `t-opinion-md` Newsreader (italic em on the time-of-day scope-word, copper signal color) with a meta dot row below in `t-label-sm` showing `{Day} · {Temp} · {Condition}` (e.g., "Friday · 68°F · Clear").
3. Confirm the new `LSMapControls` workbar is at the **vertical middle of the right edge** at `top: 50%; right: var(--space-4); transform: translateY(-50%)` (or platform-equivalent: SwiftUI `Modifier.frame(maxHeight: .infinity, alignment: .center)`, Compose `Modifier.align(Alignment.CenterEnd)`) showing (top to bottom of the workbar): zoom +/- cluster (single rounded glass card with internal divider), recenter chip (crosshairs-gps glyph), layers chip (stacked-diamonds glyph), and chat-mode toggle chip (message glyph). Each chip is 40×40pt with `var(--space-2)` gaps. The workbar's vertical center is within ±20pt of the map canvas vertical center.
4. Toggle dark mode. Confirm the capsule re-resolves to dark glass, the scope-word swaps "today" → "tonight" via `Greeting.scope`, and the map controls re-resolve to dark glass with no shape changes.
5. Trigger the weather-advisory variant (V03 — `WeatherSummary.severity ≥ advisory`). Confirm the capsule applies the `--warning` modifier with `--status-warning` meta-row tint and copy "Not the *prettiest* day for it." with the meta row showing rain (e.g., "Friday · 52°F · Rain · 0.4″") — confirm the legacy standalone advisory card is no longer present.
6. Tap a suggestion chip. Confirm the chat input transitions to `is-active` and the capsule remains in `--idle` state (it does NOT switch to `--planning` until the planning loop actually starts in Sprint 08).
7. Type `Big Sur` in the redesigned idle input on iOS and Android. Confirm at most 3 Mapbox place recommendations, selection fills the input, and the app does not enter planning/routing until explicit Send. Archive automated/manual status under `gate-evidence/autocomplete/`.
8. For Mapbox rendering, iOS XCUITest `testIdleMapTilesRenderNonUniformPixelGrid` must pass and attach screenshot evidence under `gate-evidence/CAPS-S07-T15/`.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| CAPS-S07-T01 | iOS LSContextCapsule molecule (new SwiftUI component, 5 state variants, glass surface, sandbox stories) | swift-implementer | 240 min |
| CAPS-S07-T02 | Android LSContextCapsule molecule (Compose parity, sandbox stories) | kotlin-implementer | 240 min |
| CAPS-S07-T03 | iOS LSMapControls organism (vertical workbar, zoom/recenter/layers/save/mode-toggle, sandbox stories) | swift-implementer | 180 min |
| CAPS-S07-T04 | Android LSMapControls organism (Compose parity, sandbox stories) | kotlin-implementer | 180 min |
| CAPS-S07-T05 | iOS IdleScreen retrofit (replace legacy greeting + advisory with LSContextCapsule + LSMapControls) | swift-implementer | 180 min |
| CAPS-S07-T06 | Android IdleScreen retrofit (Compose parity) | kotlin-implementer | 180 min |
| CAPS-S07-T10 | Carried-forward Mapbox Search Box autocomplete backend contract | convex-implementer | 0 min (done) |
| CAPS-S07-T11 | Carried-forward iOS idle autocomplete | swift-implementer | 60 min |
| CAPS-S07-T12 | Carried-forward Android idle autocomplete | kotlin-implementer | 60 min |
| CAPS-S07-T13 | Autocomplete gate — backend/iOS/Android/manual-status evidence | qa-engineer | 120 min |
| CAPS-S07-T14 | iOS LSMapLayer overlay-slot positioning fix | swift-implementer | 60 min |
| CAPS-S07-T15 | iOS Mapbox tile rendering fix | swift-implementer | 45 min |
| CAPS-S07-T16 | Android LSMapLayer parity audit | kotlin-implementer | 30 min |

---

## Source Coverage

- UC-FID-01 (idle-screen subset — re-validation against the 2026-05-06 redesigned design references)
- New design-system components: `mol-context-capsule`, `org-map-controls` (no UC ID assigned — infrastructure for UC-FID-01 + UC-MAP-01 + UC-CHAT-01)
- Container Principle rule (documented in `views/README.md` §"Container Principle")

### Per-Task Design Files

| Task | Design Reference |
|------|------------------|
| CAPS-S07-T01, T02 | `.spec/design/system/molecules/context-capsule/context-capsule.html` + `README.md` |
| CAPS-S07-T03, T04 | `.spec/design/system/organisms/map-controls/map-controls.html` + `README.md` |
| CAPS-S07-T05, T06 | `.spec/design/system/views/mapapp/idle/idle-screen.html` (updated 2026-05-06) + `README.md` |
| CAPS-S07-T10-T13 | `.spec/design/system/views/mapapp/idle/idle-screen.html` + `gate-evidence/autocomplete/**` |
| CAPS-S07-T14-T16 | `LSMapLayer` platform primitives + `gate-evidence/CAPS-S07-T15/**` + `gate-evidence/CAPS-S07-T16/**` |

---

## Blocks

- **Blocks:** Sprint 08 (Sprints 08–11 reuse `LSContextCapsule` + `LSMapControls` from this sprint; no per-state sprint should re-implement them)
- **Dependent on:** Sprint 06 (the persistent `LSMapView` / `LSMapHost` is the integration target)

---

## Notes

- **Component reuse contract:** Sprints 08–11 plan against the components delivered here. Re-implementing them per sprint is a planning anti-pattern.
- **Design/snapshot scope:** CAPS-S07-T07, T08, and T09 were deleted by the user on 2026-05-07 and are intentionally omitted from Sprint 7 closure.
- **Autocomplete carry-forward:** CAPS-S07-T10 through CAPS-S07-T13 were moved from Sprint 06 to Sprint 07 on 2026-05-07. Automated backend/iOS/Android evidence is archived; manual physical-device status remains explicitly recorded where blocked.
- **Sprint 06 gate interaction:** The in-progress Sprint 06 gate task (`IDLE-S06-T11`) was originally written against the prior design references. Sprint 7 implementation evidence supersedes that pre-redesign idle-screen state; any remaining release gate should consume the post-redesign evidence in this sprint directory.
- **Token additions (already shipped 2026-05-06):** `--map-water-tint`, `--map-park-tint`, `--map-highway`, `--map-label` are in `tokens.css` + both theme JSONs. iOS `LaneShadowTheme.semantic.map.*` and Android `LaneShadowTheme.semantic.map.*` accessors must be added in tasks T01–T04 if not already present.
- **Anti-pattern to avoid:** Adding a `--planning` capsule to wire `LSPhaseIndicator` data — that wiring lives in Sprint 08. This sprint only ships the **component** with sandbox-driven previews of all 5 states; live-data wiring per state is each downstream sprint's responsibility.

---

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-05-06T11:35:00-07:00

- [CAPS-S07-T01-ios-context-capsule-molecule.md](./CAPS-S07-T01-ios-context-capsule-molecule.md)
- [CAPS-S07-T02-android-context-capsule-molecule.md](./CAPS-S07-T02-android-context-capsule-molecule.md)
- [CAPS-S07-T03-ios-map-controls-organism.md](./CAPS-S07-T03-ios-map-controls-organism.md)
- [CAPS-S07-T04-android-map-controls-organism.md](./CAPS-S07-T04-android-map-controls-organism.md)
- [CAPS-S07-T05-ios-idle-screen-retrofit.md](./CAPS-S07-T05-ios-idle-screen-retrofit.md)
- [CAPS-S07-T06-android-idle-screen-retrofit.md](./CAPS-S07-T06-android-idle-screen-retrofit.md)
- [CAPS-S07-T10-mapbox-searchbox-autocomplete-actions.md](./CAPS-S07-T10-mapbox-searchbox-autocomplete-actions.md)
- [CAPS-S07-T11-ios-idle-input-place-autocomplete.md](./CAPS-S07-T11-ios-idle-input-place-autocomplete.md)
- [CAPS-S07-T12-android-idle-input-place-autocomplete.md](./CAPS-S07-T12-android-idle-input-place-autocomplete.md)
- [CAPS-S07-T13-autocomplete-gate-after-strict-design-review.md](./CAPS-S07-T13-autocomplete-gate-after-strict-design-review.md)
- [CAPS-S07-T14-ios-mapLayer-overlay-slot-positioning-fix.md](./CAPS-S07-T14-ios-mapLayer-overlay-slot-positioning-fix.md)
- [CAPS-S07-T15-ios-mapbox-tile-rendering-fix.md](./CAPS-S07-T15-ios-mapbox-tile-rendering-fix.md)
- [CAPS-S07-T16-android-mapLayer-parity-audit.md](./CAPS-S07-T16-android-mapLayer-parity-audit.md)
