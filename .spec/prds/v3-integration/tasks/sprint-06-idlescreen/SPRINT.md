---
sprint: 6
title: IdleScreen
sequence: 6
timeline: Phase 3 · Week 6
status: Planned
---

# Sprint 06: IdleScreen

**Sequence:** 6
**Timeline:** Phase 3 · Week 6
**Status:** Planned (JIT-expanded 2026-05-04 from `.spec/prds/v3-integration/ROADMAP.md`)

**Design Reference:** [`.spec/design/system/views/idle-screen/README.md`](../../../../design/system/views/idle-screen/README.md) · [`idle-screen.html`](../../../../design/system/views/idle-screen/idle-screen.html)

---

## Overview

Sprint 06 delivers a **production-grade IdleScreen** on iOS + Android by binding real Convex / Clerk / Mapbox / CoreLocation / FusedLocationProvider data into the existing sandbox-clean IdleScreen template. This is the first of five **view-at-a-time integration sprints** (06–10) per the 2026-05-04 ROADMAP reshape — each ships exactly one map view against real data with the Sprint 05 design-review pipeline serving as the per-screen quality gate.

Today the iOS template uses `LSPaperMap` as a paper-substrate placeholder, hardcodes "Good morning, {name}", and ships static suggestion chips with no real CoreLocation or weather data. Android mirrors that gap. Sprint 06 closes this by:

1. **Replacing the paper placeholder with a real Mapbox warm-paper tile layer** (iOS LSMap, Android MapboxMap) and overlaying copper favorite-pin dots driven by a new Convex `listFavoriteLocations` query.
2. **Wiring Greeting.scope** — the headline rewrites between "today" (light) and "tonight" (dark) based on time-of-day + theme, with the rider's first name interpolated from Clerk → Convex `currentUser`.
3. **Composing the meta row** ("FRIDAY · 68°F · CLEAR") from a deterministic local DAY token + a new Convex `getCurrentWeather` proxy action.
4. **Resolving the location pill** ("Near {city}, {state}") via a new Convex `getReverseGeocode` Mapbox proxy action that keeps the Mapbox token server-side; toggling MANUAL/AUTO/NEEDED states from the platform location service.
5. **Wiring suggestion-chip → is-active** chat-input transitions, swapping the filter button for a copper send button when the field has value.
6. **Capturing IdleScreen variants** (S01 default light, S02 typing, S03 default dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory) through `DesignReviewCaptureTests` so the Sprint 05 pipeline can grade fidelity at sprint close.

The sprint is the first concrete consumer of the Sprint 05 design-review pipeline and the first sprint where multi-platform parity matters again post-snapshot-tests-removal — both platforms must exit the sprint passing `pnpm design:review --screens idle-screen` with zero `high`-severity issues across all 7 variants.

**Scope locks** (per ROADMAP §Sprint 06): suggestion-chip → planning transition may stub to a placeholder; saved-routes browsing list, Settings, Sessions drawer, Offline Regions, and Error recovery are explicitly out of scope (deferred to post-Sprint-10 plans). The hamburger menu may open a placeholder sheet.

---

## Human Testing Gate

**Gate:** A signed-in rider on iOS + Android can open the app cold and arrive on a real IdleScreen — full-screen Mapbox warm-paper map, real Newsreader greeting interpolating their first name and current day/temperature, real LSChatInput with location pill + suggestion chips + filter button, real LSTopBar — that matches the `idle-screen` design references via `pnpm design:review --screens idle-screen` with **zero `high`-severity issues** across every reachable variant.

---

## Human Test Deliverable

**Test Steps:**

1. Sign in via real Clerk auth on iOS Simulator + Android Emulator and confirm cold-start lands on IdleScreen with the greeting headline reading "Where are we riding *today*, {firstName}?" in Newsreader opinion-xl italic
2. Confirm the meta row renders the rider's local day + temperature + condition (e.g., "FRIDAY · 68°F · CLEAR") in copper signal color and the underlying canvas shows a real Mapbox warm-paper tile layer (not a `LinearGradient` or `LSPaperMap` placeholder)
3. Confirm saved-favorite locations appear as copper pin dots and the location pill resolves "Near {city}, {state}" from real CoreLocation / FusedLocationProvider data; toggle MANUAL mode and confirm the tag pill flips to MANUAL with copper tint
4. Tap a suggestion chip and confirm the chat input bar shifts to `is-active`, the filter button swaps to a copper send button, and the placeholder text fills with the chip's primer phrase (the actual planning loop is out-of-scope this sprint — a placeholder transition is acceptable)
5. Toggle dark mode; confirm the greeting rewrites to "tonight" via `Greeting.scope`, all tokens re-resolve on warm-dark ink substrate, and pin dots / glass chips re-tint correctly
6. Run `pnpm design:review --screens idle-screen` against this build on iOS Simulator; confirm zero `high`-severity issues across all variants (S01 default light, S02 typing/send, S03 default dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory)
7. Walk through the variant set on a real iPhone via `xcodebuild test … DesignReviewCaptureTests` and confirm motion (greeting fade, suggestion-chip primed scale, filter-sheet open) matches the design reference; record xcresult artifacts as gate evidence

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| IDLE-S06-CVX-T01 | Convex Mapbox reverse-geocode action proxy + `listFavoriteLocations` query | convex-implementer | 180 min |
| IDLE-S06-CVX-T02 | Convex weather proxy action `getCurrentWeather(lat,lng)` → `{tempF, condition, severity}` | convex-implementer | 150 min |
| IDLE-S06-IOS-T01 | iOS IdleViewModel evolution — favorites + weather subscriptions, Greeting.scope (today/tonight), meta-row composition | swift-implementer | 240 min |
| IDLE-S06-IOS-T02 | iOS replace `LSPaperMap` with real `LSMap` Mapbox warm-paper on IdleScreen + copper favorite pin overlays | swift-implementer | 240 min |
| IDLE-S06-IOS-T03 | iOS LocationService + reverse-geocode pill + MANUAL/AUTO/NEEDED toggle + LSChatInput is-active state on chip tap | swift-implementer | 300 min |
| IDLE-S06-IOS-T04 | iOS DesignReviewCaptureTests for IdleScreen 7 variants + real-iPhone XCUITest motion evidence | swift-implementer | 240 min |
| IDLE-S06-AND-T01 | Android IdleViewModel parity — favorites + weather flows, Greeting.scope, meta row | kotlin-implementer | 240 min |
| IDLE-S06-AND-T02 | Android Mapbox warm-paper map + copper favorite pin overlays | kotlin-implementer | 240 min |
| IDLE-S06-AND-T03 | Android FusedLocationProvider + reverse-geocode pill + MANUAL/AUTO toggle + LSChatInput is-active state | kotlin-implementer | 300 min |
| IDLE-S06-AND-T04 | Android instrumented test verifying IdleScreen real-data wiring on emulator | kotlin-implementer | 180 min |
| IDLE-S06-T11 | Sprint 6 Gate — `pnpm design:review --screens idle-screen` zero `high` across all 7 variants; iPhone XCUITest evidence; sign-off | qa-engineer | 180 min |

---

## Source Coverage

- **UC-CHAT-01** — suggestion-chip + chat-input affordances on IdleScreen surface only (LSChatInput is-active state, send button swap, location pill)
- **UC-MAP-01** — map render + favorite pins (IdleScreen surface only)
- **UC-FID-01** — idle-screen subset, all 7 variants in `.spec/design/system/views/idle-screen/`: S01 default light, S02 typing/send, S03 default dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory
- **Architecture refs:**
  - [`architecture/ios-architecture.md`](../../architecture/ios-architecture.md) §5.1 IdleScreen
  - [`architecture/android-architecture.md`](../../architecture/android-architecture.md) §IdleScreen wiring
- **Design system refs:**
  - [`.spec/design/system/views/idle-screen/README.md`](../../../../design/system/views/idle-screen/README.md) — Composes table, Token Recipe, Variants
  - [`.spec/design/system/views/idle-screen/idle-screen.html`](../../../../design/system/views/idle-screen/idle-screen.html) — pixel-accurate visual reference

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| IDLE-S06-IOS-T01 | [`.spec/design/system/views/idle-screen/README.md`](../../../../design/system/views/idle-screen/README.md) (Variants table — S01/S03 Greeting.scope today/tonight rule, V03 weather-advisory severity-tinted meta) |
| IDLE-S06-IOS-T02 | [`.spec/design/system/views/idle-screen/idle-screen.html`](../../../../design/system/views/idle-screen/idle-screen.html) (warm-paper substrate + copper pin dot recipe) |
| IDLE-S06-IOS-T03 | [`.spec/design/system/views/idle-screen/README.md`](../../../../design/system/views/idle-screen/README.md) (mol-chat-input + mol-lcb__mode-chip — MANUAL copper tint) |
| IDLE-S06-IOS-T04 | [`.spec/design/system/views/idle-screen/idle-screen.html`](../../../../design/system/views/idle-screen/idle-screen.html) (all 7 variants — capture target) |
| IDLE-S06-AND-T01 | [`.spec/design/system/views/idle-screen/README.md`](../../../../design/system/views/idle-screen/README.md) |
| IDLE-S06-AND-T02 | [`.spec/design/system/views/idle-screen/idle-screen.html`](../../../../design/system/views/idle-screen/idle-screen.html) |
| IDLE-S06-AND-T03 | [`.spec/design/system/views/idle-screen/README.md`](../../../../design/system/views/idle-screen/README.md) |

---

## Blocks

- **Blocks:** Sprint 07 (PlanningScreen — depends on IdleScreen suggestion-chip → planning transition contract landing here)
- **Dependent on:** Sprint 05 (Design Review Pipeline — gates this and every subsequent view sprint)

---

## Dependency Graph

```
IDLE-S06-CVX-T01 (geocode + favorites) ─┐
IDLE-S06-CVX-T02 (weather)              ├─→ IDLE-S06-IOS-T01 ─→ IDLE-S06-IOS-T02 ─→ IDLE-S06-IOS-T03 ─→ IDLE-S06-IOS-T04 ─┐
                                         │                                                                                    ├─→ IDLE-S06-T11 (Gate)
                                         └─→ IDLE-S06-AND-T01 ─→ IDLE-S06-AND-T02 ─→ IDLE-S06-AND-T03 ─→ IDLE-S06-AND-T04 ─┘
```

iOS and Android paths are parallel after Convex foundation lands. Per `RULES.md` Multi-Agent Dispatch, each platform uses its own worktree; orchestrator merges to main after each task completes.

---

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-05-04T14:30:00-07:00

- [IDLE-S06-CVX-T01-mapbox-reverse-geocode-and-favorites-query.md](./IDLE-S06-CVX-T01-mapbox-reverse-geocode-and-favorites-query.md)
- [IDLE-S06-CVX-T02-weather-proxy-action.md](./IDLE-S06-CVX-T02-weather-proxy-action.md)
- [IDLE-S06-IOS-T01-idle-viewmodel-evolution.md](./IDLE-S06-IOS-T01-idle-viewmodel-evolution.md)
- [IDLE-S06-IOS-T02-real-mapbox-warm-paper-and-favorite-pins.md](./IDLE-S06-IOS-T02-real-mapbox-warm-paper-and-favorite-pins.md)
- [IDLE-S06-IOS-T03-location-service-and-chat-input-active.md](./IDLE-S06-IOS-T03-location-service-and-chat-input-active.md)
- [IDLE-S06-IOS-T04-design-review-capture-tests-7-variants.md](./IDLE-S06-IOS-T04-design-review-capture-tests-7-variants.md)
- [IDLE-S06-AND-T01-idle-viewmodel-parity.md](./IDLE-S06-AND-T01-idle-viewmodel-parity.md)
- [IDLE-S06-AND-T02-mapbox-warm-paper-and-favorite-pins.md](./IDLE-S06-AND-T02-mapbox-warm-paper-and-favorite-pins.md)
- [IDLE-S06-AND-T03-location-service-and-chat-input-active.md](./IDLE-S06-AND-T03-location-service-and-chat-input-active.md)
- [IDLE-S06-AND-T04-instrumented-test-real-data-wiring.md](./IDLE-S06-AND-T04-instrumented-test-real-data-wiring.md)
- [IDLE-S06-T11-sprint-gate.md](./IDLE-S06-T11-sprint-gate.md)
