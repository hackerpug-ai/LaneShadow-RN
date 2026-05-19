# Sprint 08: Map View — Planning State

**Sequence:** 8
**Timeline:** Phase 3 · Week 2 (post-Sprint-07)
**Status:** Planned (planning expanded 2026-05-07; remediation tasks added 2026-05-08)

---

## Overview

Sprint 08 ships the **planning state of the canonical map view** — *not* a standalone screen. The Sprint 06 map host (`LSMapView` / `LSMapHost`) is reused as-is; what changes is:

1. **Polyline configuration on the map** — the empty/favorites-only layer from idle is replaced by a copper sketch-loop polyline that draws and loops continuously, representing the Navigator's pen moving across the paper.
2. **Top-overlay surface composition** — the `LSContextCapsule` (Sprint 07) swaps from `--idle` to `--planning` state, showing a single italic phase line ("Sketching…/Asking…/Refining…/…") with a copper pulse spinner. The existing `LSPhaseIndicator` molecule (Sprint 04 component, present in production on iOS + Android) renders **directly below the capsule** as a 5-step pipeline strip (parsing → searching → drafting → enriching → finalizing) driven by real Convex `sessionMessages` status updates. **Capsule + LSPhaseIndicator both visible in the planning state** — capsule owns the italic headline / spinner, indicator owns explicit pipeline visibility.
3. **Chat input lock** — `LSChatInput` flips to `is-thinking`: filled prompt visible, typing disabled, leading button dimmed, send button replaced by a copper spinner. The only exit is the back button → cancel-confirm sheet → `db.routePlans.cancelPlan` mutation → return to the idle state on the *same map host*.
4. **Map controls (Sprint 07)** — `LSMapControls` workbar reconfigures for the planning state per design (recenter remains; save/layers may dim or hide per `org-map-controls` planning-state spec — to be confirmed in design enrichment).

State entry from idle is a **configuration change on the persistent map plus an overlay-state swap**, not a navigation to a new screen. Implementers MUST NOT re-implement the map host or the capsule/controls components; bind to the existing `LSMapView` / `LSMapHost` (Sprint 06), `LSContextCapsule` (Sprint 07), and `LSMapControls` (Sprint 07) and only feed them new state.

The backend substrate (`db.routePlans.cancelPlan`, `db.sessionMessages` with `kind='planning'` and `status` lifecycle) shipped in Sprint 04 / Sprint 06 remediation. Sprint 08 adds at most a small phase contract layer on top — verifying or extending the surface so the iOS + Android view-models can derive the current pipeline phase deterministically from `sessionMessages` data.

---

## Human Testing Gate

**Gate:** From the idle state of the map view, a rider on iOS Simulator + Android Emulator can tap a suggestion chip (or send a typed prompt) and the **same map host** transitions to its **planning state** — copper sketch-polyline overlay animating at the 1400ms linear loop with breathing head dot, `LSContextCapsule` in `--planning` state showing the current italic phase line + copper spinner, `LSPhaseIndicator` rendered below the capsule pulsing through the five pipeline steps driven by real Convex `sessionMessages` status updates, locked `LSChatInput` with copper spinner, working back-to-cancel-confirm-to-idle flow that fires `db.routePlans.cancelPlan` — that matches the `planning-screen` design references via `pnpm design:review --screens planning-screen` with **zero `high`-severity issues** across every reachable variant, AND a real-iPhone XCUITest run confirms motion timing on hardware.

### Test Steps

1. From the map view's idle state on iOS Simulator + Android Emulator, tap a suggestion chip ("Plan a scenic 2-hour ride") and confirm the **same map host** stays mounted (no remount of `LSMapView` / `LSMapHost`) while the state transitions to planning. The optimistic rider message is immediately visible (temp ID) and reconciled to the server `_id` within ~500ms.
2. Confirm the `LSContextCapsule` (Sprint 07) flips from `--idle` to `--planning` state, showing a single italic phase line in `t-opinion-md` Newsreader (e.g., "Sketching…/Refining…/Scoring…") with a copper pulse spinner trailing the line. No meta row in this state.
3. Confirm the `LSPhaseIndicator` molecule renders **directly below** the capsule (separate top-overlay molecule), with the 5 steps (parsing → searching → drafting → enriching → finalizing) pulsing through phases driven by real Convex `sessionMessages` status updates. The active step has a pulsing copper ring; prior steps render as done (line-through + green check); future steps render as muted hollow rings.
4. Confirm the copper sketch polyline overlay animates continuously at 1400ms linear loop (path-draw or stroke-dashoffset), with the leading head dot breathing synchronously at 1400ms ease-in-out. Reduced-motion preference (`prefers-reduced-motion`) MUST collapse the animation to a static stroke + static dot.
5. Confirm `LSChatInput` is locked: rider's prompt text visible (`has-value`), typing disabled, leading icon dimmed (`is-thinking` modifier), send button replaced by a copper spinner. The back chip is the only exit affordance.
6. Confirm `LSMapControls` (Sprint 07 workbar) reconfigures per planning-state spec — recenter remains active; chat-mode toggle remains; save/layers behave per design (TBD in design enrichment task PLAN-S08-DR-T01). The workbar stays at the right-edge midline.
7. Tap back; confirm the cancel-confirm sheet opens (V02 variant); confirm "Cancel ride" → `db.routePlans.cancelPlan` mutation fires + the map view returns to its idle state (same map host, capsule swaps back to `--idle`, indicator unmounts, chat-input unlocks, session preserved as `archived` if applicable).
8. Run `pnpm design:review --screens planning-screen` against this build on iOS Simulator. Confirm `report.json` has **zero `high`-severity issues** across all planning-screen variants (per the regenerated post-Sprint-07 reference set).
9. Real-iPhone XCUITest capture confirms motion timing on hardware: sketch loop is 1400ms ± frame, head-dot breathing is 1400ms ease-in-out, phase-step pulse cadence matches sessionMessages updates, cancel-confirm slide-up timing matches design. Record xcresult artifacts as gate evidence under `gate-evidence/`.
10. Toggle dark mode mid-planning. Confirm capsule, indicator, controls, and chat input all re-resolve to dark-glass surfaces with no shape changes; sketch polyline remains copper (`var(--route-best)`) on warm-dark substrate.

---

## Design Review Gate

Sprint 08 MUST expand the design-review pipeline (Sprint 05 / Sprint 06 / Sprint 07) to cover `planning-screen`. Required deliverables:

1. **Reference assets** — `.spec/design/system/refs/planning-screen/*.png` must be **regenerated post-Sprint-07** (the current reference set predates the Container Principle / capsule retrofit and references the legacy floating phase indicator). Run `pnpm design:references` after `planning-screen.html` is updated to use `mol-context-capsule --planning` + `mol-phase-indicator` per the chosen layout. Variant naming must reconcile against the ROADMAP gate (gate references S01 active light, S02 cancel-confirm, S03 dark, V01 slow-apology, V02 cancel-confirm-with-prior-chat, V03 single-candidate-warning; current design-system README references S01 Scouting / S02 Drawing / S03 Weather / S04 Scoring / V01 Slow / V02 Cancel-Prompt / V03 Single-Candidate). PLAN-S08-DR-T01 owns this reconciliation.
2. **XCUITest capture tests** — iOS `LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` adds `test_planningScreen_*` methods for every `(planning-screen, state, theme)` tuple. Android instrumented test parity in PLAN-S08-AND-T05.
3. **Pipeline pass** — `pnpm design:review --screens planning-screen` must produce a report with **zero `high`-severity issues** before the human testing gate can pass.
4. **Coverage expansion** — after Sprint 08, `pnpm design:review --screens auth-screen,idle-screen,planning-screen` must work end-to-end with all three views appearing in `report.json` and `report.html`.

The planner has explicit tasks for items 1–3 in the Sprint 08 task table below. These are gate blockers. See `RULES.md` §"Design Review Pipeline — View Snapshot Testing" for the full planner contract.

---

## Scope

This sprint integrates **only the planning state of the map view** — capsule-state swap to `--planning`, LSPhaseIndicator binding, sketch-polyline configuration on the existing Sprint 06 map host, locked chat input, cancel-confirm flow, and the Sprint 07 capsule + controls in their planning-state configurations. When planning completes, the map view may transition to a **temporary placeholder state** (e.g., terminal "Routes ready" message in capsule); full route-results-state wiring lands in Sprint 09. The route-details state, sessions state, and Settings remain out of scope.

Re-implementing the map host, the LSContextCapsule, or the LSMapControls is a planning anti-pattern — bind to the existing components.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| PLAN-S08-REM-IOS-T01 | Remediation - iOS idle header topbar container alignment: menu, preserved status/capsule container, and New chip render in one invisible top container aligned at the top of `LSMapLayer` | swift-implementer | 180 min |
| PLAN-S08-REM-IOS-T02 | Remediation - iOS `LSMapControls` zoom cluster is vertical and bottom-most in the right-edge workbar | swift-implementer | 120 min |
| PLAN-S08-REM-IOS-T03 | Remediation - iOS quick search chips sit above `LSChatInput` with stable token spacing and no overlap | swift-implementer | 90 min |
| PLAN-S08-REM-AND-T01 | Remediation - Android `LSMapControls` zoom-bottom parity with iOS right-edge workbar ordering | kotlin-implementer | 90 min |
| PLAN-S08-CVX-T01 | Convex planning phase contract — verify/extend `sessionMessages` so iOS + Android can derive current pipeline phase (parsing/searching/drafting/enriching/finalizing) deterministically; verify `db.routePlans.cancelPlan` end-to-end for return-to-idle | convex-implementer | 180 min |
| PLAN-S08-IOS-T01 | iOS PlanningViewModel — bind `sessionMessages` query, derive current phase + step states, expose capsule italic copy, expose LSPhaseIndicator step model, expose cancel intent | swift-implementer | 240 min |
| PLAN-S08-IOS-T02 | iOS planning state on the persistent map host — render `LSContextCapsule(--planning)` above + `LSPhaseIndicator` below in the top-overlay slot; reuse Sprint 06 `LSMapView`/`LSMapHost`; configure Sprint 07 `LSMapControls` for planning state | swift-implementer | 300 min |
| PLAN-S08-IOS-T03 | iOS copper sketch-polyline overlay layer on `LSMap` — 1400ms linear loop (path-draw / stroke-dashoffset / Mapbox annotation animation) + 1400ms ease-in-out breathing head dot; respects `prefersReducedMotion` | swift-implementer | 240 min |
| PLAN-S08-IOS-T04 | iOS `LSChatInput` locked-state binding (`is-thinking`) + cancel-confirm sheet wiring `db.routePlans.cancelPlan` + return-to-idle map-state restoration | swift-implementer | 180 min |
| PLAN-S08-IOS-T05 | iOS `DesignReviewCaptureTests` — `test_planningScreen_*` methods covering every `(planning-screen, state, theme)` tuple aligned to regenerated reference set | swift-implementer | 180 min |
| PLAN-S08-AND-T01 | Android `PlanningViewModel` parity — `sessionMessages` flow binding, phase derivation, capsule + indicator state model, cancel intent | kotlin-implementer | 240 min |
| PLAN-S08-AND-T02 | Android planning state Compose composition — `LSContextCapsule(--planning)` + `LSPhaseIndicator` in top-overlay slot; reuse Sprint 06 `LSMapHost`; configure Sprint 07 `LSMapControls` for planning state | kotlin-implementer | 300 min |
| PLAN-S08-AND-T03 | Android sketch-polyline animation overlay (Mapbox layer + Compose animation, 1400ms linear loop + breathing head dot); respects accessibility reduced-motion | kotlin-implementer | 240 min |
| PLAN-S08-AND-T04 | Android locked chat input + cancel-confirm BottomSheet wiring `db.routePlans.cancelPlan` + return-to-idle restoration | kotlin-implementer | 180 min |
| PLAN-S08-AND-T05 | Android instrumented design-review capture refresh for `planning-screen` variants | kotlin-implementer | 180 min |
| PLAN-S08-DR-T01 | Regenerate `.spec/design/system/refs/planning-screen/*.png` post-Sprint-07 retrofit; reconcile variant naming between ROADMAP gate and design-system README; update `planning-screen.html` to use `mol-context-capsule --planning` + `mol-phase-indicator` per the agreed layout | frontend-designer | 150 min |
| PLAN-S08-T11 | Sprint 08 gate — `pnpm design:review --screens planning-screen` zero high + real-iPhone XCUITest evidence + cancel-confirm walk on both platforms + project `design-review` skill pass | qa-engineer | 180 min |
| FIX-S07-IOS-T01 | **REMEDIAl** iOS IdleScreen: wire map controls callbacks to LSMapHost camera (empty closures → real wiring) — red-hat H-1 | swift-implementer | 60 min |
| FIX-S07-AND-T01 | **REMEDIAl** Android LSMapControls: fix saved-route token from accent.default → signal.default — red-hat H-2 | kotlin-implementer | 30 min |
| FIX-S07-IOS-T02 | **REMEDIAl** iOS: strengthen map controls vertical-centering + zoom-delta test verification (test-theatre → real assertions) — red-hat H-3, H-4 | swift-implementer | 60 min |
| FIX-S07-IOS-T03 | **REMEDIAl** iOS: add logging to mode-toggle stub per SPRINT.md spec — red-hat H-5 | swift-implementer | 15 min |
| FIX-S08-CVX-T01 | **REMEDIAl** Convex: explicit intermediate phase writes on tool events + fix `fetchWeather`→`getRouteWeather` mapping — red-hat 2026-05-19 F1/F2/F3/F4 (primary bug) | convex-implementer | 90 min |
| FIX-S08-CVX-T02 | **REMEDIAl** Convex: skip planning-row creation for conversational replies (lazy init) — red-hat 2026-05-19 F11 | convex-implementer | 60 min |
| FIX-S08-CVX-T03 | **REMEDIAl** Convex: add warn-log to empty failed-variant loop in planRideOrchestrator — red-hat 2026-05-19 F13 | convex-implementer | 15 min |
| FIX-S08-IOS-T01 | **REMEDIAl** iOS: simplify `PlanningPhase.derive` to trust `message.phase`; remove dead thinkingSteps path; remove unreachable `fetchWeather` mapping — red-hat 2026-05-19 F1/F4 | swift-implementer | 60 min |
| FIX-S08-IOS-T02 | **REMEDIAl** iOS: wire `currentLocation` through `sendPlanningMessage` (stop discarding) — red-hat 2026-05-19 F7 | swift-implementer | 30 min |
| FIX-S08-IOS-T03 | **REMEDIAl** iOS: fix `observe()` session-ID race in PlanningViewModel — red-hat 2026-05-19 F8 | swift-implementer | 60 min |
| FIX-S08-IOS-T04 | **REMEDIAl** iOS: wire candidate polylines from `routePlan.routeOptions` to LSMap during planning (S04 visual) — red-hat 2026-05-19 F9 | swift-implementer | 120 min |
| FIX-S08-IOS-T05 | **REMEDIAl** iOS: fix V03 single-candidate semantic + advisory block — red-hat 2026-05-19 F12 | swift-implementer | 120 min |
| FIX-S08-IOS-T06 | **REMEDIAl** iOS: collapse `screenState` to single source of truth (delete dead computed) — red-hat 2026-05-19 F10 | swift-implementer | 30 min |
| IMPL-S08-IOS-T01 | **NEW** iOS: S03 weather icon overlay during `.enriching` phase — red-hat 2026-05-19 F5 (S03 missing) | swift-implementer | 120 min |
| IMPL-S08-IOS-T02 | **NEW** iOS: V01 slow planning stall timer (4s threshold) + apology copy — red-hat 2026-05-19 F5 (V01 missing) | swift-implementer | 90 min |

---

## Source Coverage

- UC-CHAT-01 (planning loop initiation from IdleScreen — extending Sprint 04 wiring with the new capsule/indicator layout)
- UC-CHAT-02 (phase progression streaming — sessionMessages → indicator step states)
- UC-CHAT-04 (cancel + cancel-confirm flow — routePlans.cancelPlan + return-to-idle on the same map host)
- UC-FID-01 (planning-screen subset — all variants per regenerated post-Sprint-07 reference set)
- `architecture/ios-architecture.md` § PlanningScreen, `architecture/android-architecture.md` § PlanningViewModel
- Reused components: `LSContextCapsule` (Sprint 07), `LSMapControls` (Sprint 07), `LSMapView`/`LSMapHost` (Sprint 06), `LSPhaseIndicator` (Sprint 04 component on iOS + Android), `LSChatInput` (existing)

### Per-Task Design Files

| Task | Design Reference |
|------|------------------|
| PLAN-S08-REM-IOS-T01 | User remediation note 2026-05-08 (CURRENT iPhone 16 screenshot vs TARGET header): header items must be one invisible top container; preserve the production status/capsule container styling |
| PLAN-S08-REM-IOS-T02, PLAN-S08-REM-AND-T01 | User remediation note 2026-05-08 (CURRENT vs TARGET controls): zoom controls vertical and bottom-most in the right-edge control stack |
| PLAN-S08-REM-IOS-T03 | User remediation note 2026-05-08 (CURRENT vs TARGET chat input): quick search chips must sit above input without overlap |
| PLAN-S08-CVX-T01 | `.spec/prds/v3-integration/use-cases/UC-CHAT-02-phase-progression.md`, `.spec/prds/v3-integration/use-cases/UC-CHAT-04-cancel.md` (or PRD-equivalents) |
| PLAN-S08-IOS-T01, T02, AND-T01, AND-T02 | `.spec/design/system/views/mapapp/planning/planning-screen.html` (post-PLAN-S08-DR-T01 update) + `.spec/design/system/views/mapapp/planning/README.md` + `.spec/design/system/molecules/context-capsule/context-capsule.html` + `.spec/design/system/molecules/phase-indicator/phase-indicator.html` |
| PLAN-S08-IOS-T03, AND-T03 | `.spec/design/system/views/mapapp/planning/planning-screen.html` § sketch-polyline animation, design-system motion recipes (1400ms linear + 1400ms ease-in-out) |
| PLAN-S08-IOS-T04, AND-T04 | `.spec/design/system/molecules/chat-input/` (locked/`is-thinking` state) + `planning-screen.html` cancel-confirm variant |
| PLAN-S08-IOS-T05, AND-T05 | `.spec/design/system/refs/planning-screen/*.png` (regenerated by PLAN-S08-DR-T01) + `LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (extended per task) |
| PLAN-S08-DR-T01 | `.spec/design/system/views/mapapp/planning/README.md` + `.spec/design/system/molecules/context-capsule/README.md` + `.spec/design/system/molecules/phase-indicator/README.md` + `scripts/design-review/prompts/visual-eval.md` |
| PLAN-S08-T11 | All of the above + `gate-evidence/` directory for xcresult artifacts, design:review reports, cancel walk evidence |

---

## Blocks

- **Blocks:** Sprint 09 (Sprint 09 reuses the same map host + capsule + controls and additionally consumes the post-planning route-results polyline configuration; Sprint 09 cannot start until planning state proves the per-state-overlay pattern works)
- **Dependent on:** Sprint 07 (both `LSContextCapsule` and `LSMapControls` MUST ship from Sprint 07 before Sprint 08 implementers can bind to them; Sprint 06 `LSMapView`/`LSMapHost` is also a dependency but is already present in production)

---

## Notes

- **Component reuse contract (CRITICAL):** Sprint 08 binds to existing components — `LSContextCapsule` (Sprint 07), `LSMapControls` (Sprint 07), `LSMapView`/`LSMapHost` (Sprint 06), `LSPhaseIndicator` (Sprint 04), `LSChatInput` (existing). Re-implementing any of these is a planning anti-pattern. If a component change is required, it MUST be flagged for the owning sprint's component owner, not patched in Sprint 08.
- **Remediation prefix (2026-05-08):** `PLAN-S08-REM-*` tasks execute before the planning-state composition tasks because Sprint 08 inherits the idle header, right-edge controls, and bottom chat input primitives. These tasks address user-design-review findings only; they do not resurrect deleted snapshot/design-review tasks.
- **Phase-overlay layout decision (2026-05-07):** Per user decision, the planning-state top overlay renders the capsule above and the LSPhaseIndicator below as separate molecules in the `org-map-layer__top-overlay` slot. The capsule shows the italic phase line + spinner; the indicator shows the explicit 5-step pipeline. The ROADMAP framing "replaces LSPhaseIndicator-as-top-overlay" refers to the *primary* top-overlay role (capsule), not retirement of the indicator. PLAN-S08-DR-T01 must update `planning-screen.html` to reflect this composed layout.
- **Sprint 07 component dependency:** Sprint 08 assumes the Sprint 07 component surfaces are available for execution planning. Do not re-add deleted Sprint 07 snapshot/design-review tasks as blockers; if a primitive still needs correction, track it through the `PLAN-S08-REM-*` remediation tasks above.
- **Backend is light:** Most backend infrastructure shipped in Sprint 04 (`sessionMessages`, `routePlans`, `cancelPlan`, `planningSessions`). PLAN-S08-CVX-T01 is verification + small contract additions, not net-new backend.
- **Reference set is stale:** The current `.spec/design/system/refs/planning-screen/*.png` set predates the Container Principle. PLAN-S08-DR-T01 regenerates the references AFTER updating `planning-screen.html` to use the post-Sprint-07 capsule + indicator layout. Capture tests (PLAN-S08-IOS-T05, AND-T05) must align to the *regenerated* references, not the current set.
- **Variant naming reconciliation:** ROADMAP gate text uses different variant labels than the design-system README (e.g., "S02 cancel-confirm" in gate vs. "S02 Drawing Light" in README). PLAN-S08-DR-T01 owns the reconciliation; the canonical naming after this sprint becomes the design-system README naming, and the ROADMAP gate is updated for consistency.
- **Anti-pattern to avoid:** Adding a new sketch-polyline molecule to the design system. The polyline is a configuration of `LSMap` (a layer/source pair), not a separate component. Implementers should add a `MapSketchAnimationLayer` (iOS) / equivalent Compose state to `LSMapHost`, not a sibling component.
- **Reduced-motion handling:** The sketch loop and breathing head-dot MUST honor platform reduced-motion preferences (iOS `UIAccessibility.isReduceMotionEnabled`, Android system animation scale = 0). Animation collapses to a static stroke + static dot in that case.
- **Estimate sum:** ~3,270 minutes (≈54.5 hours of focused work across convex-implementer / swift-implementer / kotlin-implementer / frontend-designer / qa-engineer).

## Sprint 07 Remedial Tasks (Red-Hat Review 2026-05-08)

On 2026-05-08, a red-hat adversarial review of Sprint 07 (`.spec/reviews/red-hat-sprint-07-2026-05-08T16-22Z.md`) identified critical issues that must be resolved before Sprint 08 planning-state tasks execute. Four remedial tasks added:

| Finding | Severity | Task | Agent |
|---------|----------|------|-------|
| H-1: iOS IdleScreen empty callback closures | CRITICAL | FIX-S07-IOS-T01 (wire callbacks) | swift-implementer |
| H-2: Android wrong token for saved route | CRITICAL | FIX-S07-AND-T01 (signal.default fix) | kotlin-implementer |
| H-3/H-4: Test theatre on positioning + zoom | HIGH | FIX-S07-IOS-T02 (strengthen tests) | swift-implementer |
| H-5: Mode-toggle missing logging | HIGH | FIX-S07-IOS-T03 (add log stub) | swift-implementer |

**Execution order:** FIX tasks MUST complete before PLAN-S08-IOS-T02 and PLAN-S08-AND-T02.

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-05-07

- [PLAN-S08-AND-T01-android-planning-view-model.md](./PLAN-S08-AND-T01-android-planning-view-model.md)
- [PLAN-S08-AND-T02-android-planning-state-overlay-composition.md](./PLAN-S08-AND-T02-android-planning-state-overlay-composition.md)
- [PLAN-S08-AND-T03-android-sketch-polyline-overlay.md](./PLAN-S08-AND-T03-android-sketch-polyline-overlay.md)
- [PLAN-S08-AND-T04-android-locked-chat-input-and-cancel-confirm.md](./PLAN-S08-AND-T04-android-locked-chat-input-and-cancel-confirm.md)
- [PLAN-S08-AND-T05-android-instrumented-design-review-capture.md](./PLAN-S08-AND-T05-android-instrumented-design-review-capture.md)
- [PLAN-S08-CVX-T01-convex-planning-phase-contract.md](./PLAN-S08-CVX-T01-convex-planning-phase-contract.md)
- [PLAN-S08-DR-T01-regenerate-planning-screen-references.md](./PLAN-S08-DR-T01-regenerate-planning-screen-references.md)
- [PLAN-S08-IOS-T01-ios-planning-view-model.md](./PLAN-S08-IOS-T01-ios-planning-view-model.md)
- [PLAN-S08-IOS-T02-ios-planning-state-overlay-composition.md](./PLAN-S08-IOS-T02-ios-planning-state-overlay-composition.md)
- [PLAN-S08-IOS-T03-ios-sketch-polyline-overlay.md](./PLAN-S08-IOS-T03-ios-sketch-polyline-overlay.md)
- [PLAN-S08-IOS-T04-ios-locked-chat-input-and-cancel-confirm.md](./PLAN-S08-IOS-T04-ios-locked-chat-input-and-cancel-confirm.md)
- [PLAN-S08-IOS-T05-ios-design-review-capture-tests.md](./PLAN-S08-IOS-T05-ios-design-review-capture-tests.md)
- [PLAN-S08-T11-sprint-gate.md](./PLAN-S08-T11-sprint-gate.md)

Remedial tasks added 2026-05-08 (from red-hat review):

- [FIX-S07-IOS-T01-ios-idle-screen-callback-wiring.md](./FIX-S07-IOS-T01-ios-idle-screen-callback-wiring.md)
- [FIX-S07-AND-T01-android-saved-route-signal-token-fix.md](./FIX-S07-AND-T01-android-saved-route-signal-token-fix.md)
- [FIX-S07-IOS-T02-ios-map-controls-position-test.md](./FIX-S07-IOS-T02-ios-map-controls-position-test.md)
- [FIX-S07-IOS-T03-ios-mode-toggle-logging-stub.md](./FIX-S07-IOS-T03-ios-mode-toggle-logging-stub.md)

Remedial tasks added 2026-05-19 (from red-hat review `.spec/reviews/red-hat-20260519T024631Z-planning-state.md`):

- [FIX-S08-CVX-T01-explicit-intermediate-phase-writes.md](./FIX-S08-CVX-T01-explicit-intermediate-phase-writes.md) — Convex: backend writes intermediate phase values + `getRouteWeather` mapping (primary bug fix)
- [FIX-S08-CVX-T02-lazy-planning-row-creation.md](./FIX-S08-CVX-T02-lazy-planning-row-creation.md) — Convex: skip planning row for conversational replies
- [FIX-S08-CVX-T03-failed-variant-warn-log.md](./FIX-S08-CVX-T03-failed-variant-warn-log.md) — Convex: warn-log failed variants
- [FIX-S08-IOS-T01-simplify-planning-phase-derivation.md](./FIX-S08-IOS-T01-simplify-planning-phase-derivation.md) — iOS: simplify `PlanningPhase.derive`; trust `message.phase`
- [FIX-S08-IOS-T02-current-location-wiring.md](./FIX-S08-IOS-T02-current-location-wiring.md) — iOS: wire `currentLocation` through `sendPlanningMessage`
- [FIX-S08-IOS-T03-observe-session-id-race.md](./FIX-S08-IOS-T03-observe-session-id-race.md) — iOS: fix `observe()` session-ID race
- [FIX-S08-IOS-T04-candidate-polylines-during-planning.md](./FIX-S08-IOS-T04-candidate-polylines-during-planning.md) — iOS: candidate polylines from routePlan (S04 visual)
- [FIX-S08-IOS-T05-v03-single-candidate-fix.md](./FIX-S08-IOS-T05-v03-single-candidate-fix.md) — iOS: V03 single-candidate semantic + advisory
- [FIX-S08-IOS-T06-delete-dead-screenstate.md](./FIX-S08-IOS-T06-delete-dead-screenstate.md) — iOS: collapse `screenState` to single source
- [IMPL-S08-IOS-T01-s03-weather-overlay.md](./IMPL-S08-IOS-T01-s03-weather-overlay.md) — iOS: S03 weather icon overlay (new variant impl)
- [IMPL-S08-IOS-T02-v01-slow-planning-stall-timer.md](./IMPL-S08-IOS-T02-v01-slow-planning-stall-timer.md) — iOS: V01 slow planning stall timer (new variant impl)

### Sprint 08 Remedial Execution Order (2026-05-19)

1. **FIX-S08-CVX-T01** (backend explicit phase writes) — primary fix, unblocks everything iOS-side
2. **FIX-S08-IOS-T01** (iOS phase derivation simplification) — depends on T01
3. **FIX-S08-IOS-T02, FIX-S08-IOS-T03** (currentLocation, observe race) — independent, can run in parallel
4. **FIX-S08-IOS-T04** (polylines / S04 visual) — depends on IOS-T01
5. **FIX-S08-IOS-T05** (V03 single-candidate fix) — depends on IOS-T01
6. **FIX-S08-IOS-T06** (collapse screenState) — depends on IOS-T04 + IOS-T05
7. **FIX-S08-CVX-T02, FIX-S08-CVX-T03** — independent backend cleanups
8. **IMPL-S08-IOS-T01** (S03 weather) — depends on CVX-T01 + IOS-T01; verify backend data exposure first (AC-6)
9. **IMPL-S08-IOS-T02** (V01 slow planning) — depends on IOS-T01

**Android parity tasks NOT included** — file after iOS lands and proves the approach end-to-end.
