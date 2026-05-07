# Sprint 07: Strict Design Review — Context Capsule, Map Controls + Autocomplete Carry-Forward

**Sequence:** 7
**Timeline:** Phase 3 · Week 1 (post-Sprint-06)
**Status:** Planned (strict design-review sprint; autocomplete carry-forward added 2026-05-07)

---

## Overview

On 2026-05-06 the design system shipped four coupled changes (the *map-view redesign*):

1. A new `mol-context-capsule` molecule that replaces the legacy floating greeting headline + standalone advisory card with a single state-driven glass container exposing five state variants (`--idle`, `--planning`, `--route`, `--warning`, `--saved`).
2. A new `org-map-controls` organism — a right-edge **vertically-centered** vertical workbar (zoom +/-, recenter, layers, save, mode-toggle) — codifying the React Native production controls into the design system. The workbar is anchored along the midline of the map canvas (NOT under the topbar) so it reads as map chrome, mirrors the production placement, and keeps every chip within comfortable thumb-reach on a one-handed phone hold.
3. A new "Container Principle" rule: every textual UI element overlapping the map must sit in a token-driven glass container. No "floating" typography directly on the map.
4. A Mapbox-styled SVG vocabulary (water polygons, parks, streets, neighborhood labels) painted on every view's design reference, replacing the prior topo-curves-only mock.

Sprint 06 production was implemented against the **prior** design contract (legacy `view-idle-screen__greeting` headline + advisory card, no right-side map controls), so as of 2026-05-06 the captures no longer match the design references. **Sprint 07 closes that gap through a strict design-review process**: ship the new components on iOS + Android, retrofit the idle state, run the project `design-review` skill against the design references and implementation scope, fix every P0/P1 plan item, and re-run `pnpm design:review --screens idle-screen` until zero `high` issues remain.

The Sprint 06 map host (`LSMapView` / `LSMapHost`) is reused as-is; this sprint only adds new components and updates the idle-state overlay surface. Re-implementing the map host is a planning anti-pattern.

Autocomplete was moved into Sprint 07 on 2026-05-07. The backend, iOS, and Android implementation commits already exist, but product signoff is blocked until after the strict design-review fixes land because the idle input cannot be trusted while the screen structure and capture references are still changing.

---

## Human Testing Gate

**Gate:** A signed-in rider on iOS + Android opens the app cold and arrives at the idle state of the map view, where (a) the new `LSContextCapsule` glass container sits centered below the topbar showing the `--idle` state with greeting headline + meta row, (b) the new `LSMapControls` workbar sits at the **vertical middle of the right edge** of the map canvas with zoom cluster + recenter + layers + chat-mode toggle chips, (c) the legacy floating greeting headline and standalone advisory card are gone, (d) the project `design-review` skill produces a strict file-level plan with no unresolved P0/P1 findings, (e) `pnpm design:review --screens idle-screen` produces **zero `high`-severity issues**, and (f) only after those design gates pass, the carried-forward autocomplete flow is walked on both platforms.

### Test Steps

1. Sign in via real Clerk auth on iOS Simulator + Android Emulator. Confirm cold-start lands on the idle state of the map view with the new `LSContextCapsule` centered below the topbar — NOT the legacy `t-opinion-xl` floating Newsreader headline.
2. Confirm the capsule shows "Where are we riding *today*, {firstName}?" in `t-opinion-md` Newsreader (italic em on the time-of-day scope-word, copper signal color) with a meta dot row below in `t-label-sm` showing `{Day} · {Temp} · {Condition}` (e.g., "Friday · 68°F · Clear").
3. Confirm the new `LSMapControls` workbar is at the **vertical middle of the right edge** at `top: 50%; right: var(--space-4); transform: translateY(-50%)` (or platform-equivalent: SwiftUI `Modifier.frame(maxHeight: .infinity, alignment: .center)`, Compose `Modifier.align(Alignment.CenterEnd)`) showing (top to bottom of the workbar): zoom +/- cluster (single rounded glass card with internal divider), recenter chip (crosshairs-gps glyph), layers chip (stacked-diamonds glyph), and chat-mode toggle chip (message glyph). Each chip is 40×40pt with `var(--space-2)` gaps. The workbar's vertical center is within ±20pt of the map canvas vertical center.
4. Toggle dark mode. Confirm the capsule re-resolves to dark glass, the scope-word swaps "today" → "tonight" via `Greeting.scope`, and the map controls re-resolve to dark glass with no shape changes.
5. Trigger the weather-advisory variant (V03 — `WeatherSummary.severity ≥ advisory`). Confirm the capsule applies the `--warning` modifier with `--status-warning` meta-row tint and copy "Not the *prettiest* day for it." with the meta row showing rain (e.g., "Friday · 52°F · Rain · 0.4″") — confirm the legacy standalone advisory card is no longer present.
6. Tap a suggestion chip. Confirm the chat input transitions to `is-active` and the capsule remains in `--idle` state (it does NOT switch to `--planning` until the planning loop actually starts in Sprint 08).
7. Run the project `design-review` skill against `.spec/design/system/views/idle-screen/idle-screen.html` and the iOS/Android idle implementation scope. Archive its file-level adjustment plan at `gate-evidence/design-review-skill-report.md`; every P0/P1 item must be fixed or explicitly documented in `gate-evidence/decisions.md`.
8. Run `pnpm design:review --screens idle-screen` against this build on iOS Simulator. Confirm `report.json` has zero `high`-severity issues across all 7 idle variants — capture the report as gate evidence.
9. Real-iPhone XCUITest capture confirms capsule + controls match the design references on hardware (visual + theme switch); record xcresult artifacts as gate evidence.
10. (Component reusability spot-check) Open the iOS sandbox catalog and confirm `LSContextCapsule` renders in the `--planning`, `--route`, `--warning`, and `--saved` variants per the molecule preview HTML; same on Android. (These variants are not yet wired to live data — they're sandbox-only previews proving the component contract before Sprints 08–10 consume them.)
11. After steps 7–10 pass, type `Big Sur` in the redesigned idle input on iOS and Android. Confirm at most 3 Mapbox place recommendations, selection fills the input, and the app does not enter planning/routing until explicit Send. Archive the walkthrough under `gate-evidence/autocomplete/`.

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
| CAPS-S07-T07 | iOS DesignReviewCaptureTests refresh against retrofitted idle-screen | swift-implementer | 120 min |
| CAPS-S07-T08 | Android instrumented design-review capture refresh | kotlin-implementer | 120 min |
| CAPS-S07-T09 | Strict Sprint 07 design-review gate — project `design-review` skill plan + zero high-severity `pnpm design:review` | qa-engineer | 150 min |
| CAPS-S07-T10 | Carried-forward Mapbox Search Box autocomplete backend contract | convex-implementer | 0 min (done) |
| CAPS-S07-T11 | Carried-forward iOS idle autocomplete, re-walked after strict design review | swift-implementer | 60 min |
| CAPS-S07-T12 | Carried-forward Android idle autocomplete, re-walked after strict design review | kotlin-implementer | 60 min |
| CAPS-S07-T13 | Autocomplete gate after strict design review — backend/iOS/Android/manual evidence | qa-engineer | 120 min |

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
| CAPS-S07-T05, T06 | `.spec/design/system/views/idle-screen/idle-screen.html` (updated 2026-05-06) + `README.md` |
| CAPS-S07-T07, T08 | `.spec/design/system/refs/idle-screen/*.png` (regenerated 2026-05-06) |
| CAPS-S07-T09 | `/Users/justinrich/.agents/skills/design-review/SKILL.md` + `scripts/design-review/prompts/visual-eval.md` (updated 2026-05-06) |
| CAPS-S07-T10-T13 | `.spec/design/system/views/idle-screen/idle-screen.html` + `gate-evidence/autocomplete/**` |

---

## Blocks

- **Blocks:** Sprint 08 (Sprints 08–11 reuse `LSContextCapsule` + `LSMapControls` from this sprint; no per-state sprint should re-implement them)
- **Dependent on:** Sprint 06 (the persistent `LSMapView` / `LSMapHost` is the integration target)

---

## Notes

- **Component reuse contract:** Sprints 08–11 plan against the components delivered here. Re-implementing them per sprint is a planning anti-pattern.
- **Strict design-review contract:** CAPS-S07-T09 owns the design review skill report plus `pnpm design:review --screens idle-screen`. High-severity pipeline issues and P0/P1 skill findings are both blockers.
- **Autocomplete carry-forward:** CAPS-S07-T10 through CAPS-S07-T13 were moved from Sprint 06 to Sprint 07 on 2026-05-07. Autocomplete cannot receive final evidence until CAPS-S07-T09 passes, because the idle input is part of the redesigned surface.
- **Sprint 06 gate interaction:** The in-progress Sprint 06 gate task (`IDLE-S06-T11`) was originally written against the prior design references. After Sprint 07 lands, Sprint 06's gate evidence is rolled forward into Sprint 07's gate task (CAPS-S07-T09). Either path closes IDLE-S06-T11 against the post-redesign idle-screen.
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
- [CAPS-S07-T07-ios-design-review-capture-tests-refresh.md](./CAPS-S07-T07-ios-design-review-capture-tests-refresh.md)
- [CAPS-S07-T08-android-design-review-capture-refresh.md](./CAPS-S07-T08-android-design-review-capture-refresh.md)
- [CAPS-S07-T09-sprint-gate.md](./CAPS-S07-T09-sprint-gate.md)
- [CAPS-S07-T10-mapbox-searchbox-autocomplete-actions.md](./CAPS-S07-T10-mapbox-searchbox-autocomplete-actions.md)
- [CAPS-S07-T11-ios-idle-input-place-autocomplete.md](./CAPS-S07-T11-ios-idle-input-place-autocomplete.md)
- [CAPS-S07-T12-android-idle-input-place-autocomplete.md](./CAPS-S07-T12-android-idle-input-place-autocomplete.md)
- [CAPS-S07-T13-autocomplete-gate-after-strict-design-review.md](./CAPS-S07-T13-autocomplete-gate-after-strict-design-review.md)
