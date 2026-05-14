# Sprint 09: Map View — Route Results State

**Sequence:** 9
**Timeline:** Phase 3 · Week 3 (post-Sprint-08)
**Status:** Planned (planning expanded 2026-05-14)

---

## Overview

Sprint 09 ships the **route-results state of the canonical map view** — *not* a standalone screen. The Sprint 06 map host (`LSMap` / `LSMapLayer`) is reused; what changes is:

1. **Polyline configuration on the map** — the planning state's looping sketch polyline (Sprint 08) is replaced by three real polylines decoded from `db.routePlans.getPlanById({routePlanId}).options[]` and color-coded by variant: best (copper `var(--route-best)`, solid 3.5px), alt1 (sage `var(--route-alt1)`, dashed 2.5px / dash `6 4`), alt2 (slate `var(--route-alt2)`, dashed 2.5px / dash `3 4`). The selected polyline renders solid-bold; unselected polylines render dashed.
2. **Top-overlay surface composition** — the `LSContextCapsule` (Sprint 07) swaps to a **results** state (compass chip + "THE NAVIGATOR" label + opinion-md prose), with three `mol-route-attachment-card` molecules attached as a horizontal card row directly below the capsule's prose. The card row is the canonical `LSNavigatorMessage` pinned-message composition.
3. **Chat input unlock + refine** — `LSChatInput` unlocks (chat-input is no longer `is-thinking`), placeholder swaps to "Refine your ride…", and the active session ID is **reused** for any refine prompt. Submitting the refine input transitions the same map host back to its planning state (Sprint 08 composition); when the new plan completes, return to results with the replacement polylines.
4. **Alt-selection promotion** — tap on an alt route card promotes that polyline from dashed → solid-bold, demotes the previously-selected polyline back to dashed, and re-tints the message-card stripe + compass chip to the new variant's color (copper / sage / slate).
5. **Dismiss + recall** — dismissing the pinned `LSNavigatorMessage` hides it; a copper "Recall" chrome chip parks where the message lived; tapping Recall re-pins the message with identical content.

State entry from the planning state (Sprint 08) is a **configuration change on the persistent map plus an overlay-state swap**, not a navigation to a new screen. Implementers MUST NOT re-implement the map host, capsule, route-attachment-card, or chat-input components; bind to existing surfaces and only feed them new state.

The backend substrate (`db.routePlans.getPlanById` subscription, `agent.sendMessage` refine via same session ID) shipped in Sprint 04. Sprint 09 adds at most a small read-model layer on top — confirming the iOS + Android view-models can derive a deterministic `{best, alt1, alt2}` triple from `plan.options[]` and that refining re-uses `sessionId` without creating a fresh `planningSessions` row.

---

## Human Testing Gate

**Gate:** From the planning state of the map view, a rider on iOS Simulator + Android Emulator can complete a real plan and the **same map host** transitions to its **route-results state** — three real polylines (best copper solid, alt1 sage dashed, alt2 slate dashed) sourced from `db.routePlans.getPlanById`, pinned `LSNavigatorMessage` with three attached `mol-route-attachment-card` molecules, working alt-selection promotion, working chat-refine (reuses same `sessionId`), working dismiss → copper Recall chip → tap-to-re-pin — that matches the `route-results-screen` design references via `pnpm design:review --screens route-results-screen` with **zero `high`-severity issues** across every reachable variant, AND a real-iPhone XCUITest run confirms polyline rendering, alt-selection promotion timing, message-pin motion, and recall-chip slide-in match the design reference on hardware.

### Test Steps

1. From the planning state on iOS Simulator + Android Emulator, complete a real plan end-to-end (suggestion chip → planning loop → results) and confirm the **same map host** stays mounted (no remount of `LSMap` / `LSMapHost`). The 1400ms sketch polyline (Sprint 08) terminates and is replaced by three real polylines decoded from `plan.options[]`.
2. Confirm the three polylines render with the correct strokes: best is copper `var(--route-best)` solid 3.5px; alt1 is sage `var(--route-alt1)` dashed 2.5px / dash `6 4`; alt2 is slate `var(--route-alt2)` dashed 2.5px / dash `3 4`. Start dot (filled 14px) + end dot (outer 18px + inner 6px) render at the polyline endpoints.
3. Confirm the `LSContextCapsule` flips to results state: compass chip on the left, "THE NAVIGATOR" label in caps-md, the Navigator's reasoning in `t-opinion-md` Newsreader-italic prose. Three `mol-route-attachment-card` molecules attach as a horizontal row directly below the capsule prose, each card showing real distance / time / scenic-score from `plan.options[i].metrics` and a per-card weather badge when `route_enrichments.status == "completed"`.
4. Tap an alt route card (e.g., alt1 sage). Confirm `selectedRouteId` updates to that option's id, the alt1 polyline promotes from dashed → solid-bold, the previously-selected polyline demotes to dashed, the alt1 card border re-tints to sage, and the compass chip in the capsule re-tints to sage. The Best badge stays anchored to the actual "best" route option (not the selected option).
5. Type a refine prompt into `LSChatInput` ("make it shorter, avoid Hwy 1") and send. Confirm the same `sessionId` is reused (no fresh `planningSessions` row in the Convex DB); the screen transitions back to the planning state (Sprint 08) with the rider's refine message rendered as an optimistic message; when the agent re-completes, the screen returns to results with the replacement polylines and a refreshed Navigator message.
6. Dismiss the `LSNavigatorMessage` (tap dismiss chevron). Confirm the message slides out, the three polylines remain on the map, and a copper "Recall" chrome chip parks at the bottom of the canvas in the message's prior position. Tap Recall; confirm the message slides back in with identical content.
7. Run `pnpm design:review --screens route-results-screen` against this build on iOS Simulator. Confirm `report.json` has **zero `high`-severity issues** across all route-results-screen variants (S01 default-best-pre-selected, S02 alt1-tapped-sage-promoted, S03 default-dark, S04 refining, V01 two-candidates, V02 weather-divergent, V03 message-dismissed).
8. Real-iPhone XCUITest capture confirms motion timing on hardware: polyline draw uses the V2 `routeDrawOn` motion recipe, alt-selection promotion completes inside the spec'd duration, message-pin slide-up matches the design reference, recall-chip slide-in is bottom-anchored. Record xcresult artifacts as gate evidence under `gate-evidence/`.
9. Toggle dark mode on results. Confirm the capsule, cards, controls, and chat input all re-resolve to dark-glass surfaces with no shape changes; best polyline grows a copper outer glow on dark ink (per S03 variant); alt1/alt2 strokes remain visible against the dark substrate.

---

## Design Review Gate

Sprint 09 MUST expand the design-review pipeline (Sprint 05 / 06 / 07 / 08) to cover `route-results-screen`. Required deliverables:

1. **Reference assets** — `.spec/design/system/refs/route-results-screen/*.png` already exists (7 variants captured from the design HTML: `default--best-pre-selected.light.png`, `alt1-tapped--sage-promoted.light.png`, `default--dark.dark.png`, `refining.light.png`, `two-candidates.light.png`, `weather-divergent.light.png`, `message-dismissed.light.png`). RR-S09-DR-T01 reconciles ROADMAP variant labels with these canonical filenames and confirms `pnpm design:references --screens route-results-screen` is idempotent against the current HTML.
2. **XCUITest capture tests** — iOS `LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` adds `test_routeResultsScreen_*` methods for every `(route-results-screen, state, theme)` tuple covering all 7 variants. Android instrumented test parity in RR-S09-AND-T05.
3. **Pipeline pass** — `pnpm design:review --screens route-results-screen` must produce a report with **zero `high`-severity issues** before the human testing gate can pass.
4. **Coverage expansion** — after Sprint 09, `pnpm design:review --screens auth-screen,idle-screen,planning-screen,route-results-screen` must work end-to-end with all four views appearing in `report.json` and `report.html`.

The planner has explicit tasks for items 1–3 in the Sprint 09 task table below. These are gate blockers. See `RULES.md` §"Design Review Pipeline — View Snapshot Testing" for the full planner contract.

---

## Scope

This sprint integrates **only the route-results state of the map view** — three-polyline configuration on the persistent Sprint 06 map host, capsule-state swap to results, attached `mol-route-attachment-card` row, alt-selection promotion, chat-refine that reuses the active `sessionId`, dismiss → Recall chip → re-pin. When a card is tapped to enter the route-details state, the screen may transition to a **temporary placeholder state** (e.g., terminal "Details coming soon" message in capsule); full `RouteDetails` bottom-sheet wiring lands in **Sprint 10**. SaveFavoriteSheet entry, Sessions, and Settings remain out of scope.

Re-implementing the map host, the `LSContextCapsule`, `mol-route-attachment-card`, `LSNavigatorMessage`, or `LSChatInput` is a planning anti-pattern — bind to the existing components.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| RR-S09-DR-T01 | Reconcile route-results variant naming between ROADMAP gate (S01–V03) and design-system canonical filenames (`default--best-pre-selected`/`alt1-tapped--sage-promoted`/`default--dark`/`refining`/`two-candidates`/`weather-divergent`/`message-dismissed`); verify `pnpm design:references --screens route-results-screen` is idempotent; finalize the canonical 7-variant matrix that downstream capture tests must hit | frontend-designer | 120 min |
| RR-S09-CVX-T01 | Convex route-results contract — verify `db.routePlans.getPlanById` exposes a stable triple `{best, alt1, alt2}` orderable from `plan.options[]`; verify chat-refine via `agent.sendMessage` reuses the active `sessionId` (no fresh `planningSessions` row); add a `selectOption` mutation OR document client-side `selectedRouteId` storage if no server persistence is required; verify `routePlans.getPlanById` returns the same plan on results-state remount (no full re-fetch) | convex-implementer | 180 min |
| RR-S09-IOS-T01 | iOS `RouteResultsViewModel` — bind `routePlans.getPlanById(routePlanId)` subscription via the existing ConvexClient wiring; derive `routeOptions: PlannedRouteOptions` with `{best, alt1, alt2}` mapping; expose `selectedRouteId: String?`, `polylines: [PolylineData]` with per-variant color/dash tokens, `cards: [RouteAttachmentCardModel]`, `selectAlt(id:)` intent, `refine(prompt:)` intent that reuses `sessionId`, `dismissMessage()` / `recallMessage()` intents, and `isMessageDismissed: Bool` flag | swift-implementer | 240 min |
| RR-S09-IOS-T02 | iOS route-results state composition on the persistent map host — replace `RouteResultsScreen.swift` mock-provider path with the live `RouteResultsViewModel`; render `LSContextCapsule(state: .results(headline:))` above + horizontal `mol-route-attachment-card` row below in the `LSMapLayer.topOverlays` slot; reuse Sprint 06 `LSMap`/`LSMapLayer`; configure Sprint 07 `LSMapControls` for results state per design; preserve identity of `LSMap` across planning→results transition | swift-implementer | 300 min |
| RR-S09-IOS-T03 | iOS three-polyline rendering + alt-selection promotion — implement `LSMap` polyline configuration that renders all three `PolylineData` entries with correct color/dash tokens (best copper solid 3.5, alt1 sage dashed 2.5/`6 4`, alt2 slate dashed 2.5/`3 4`); promotion: tap card → `viewModel.selectAlt(id:)` → polyline stroke flips to solid-bold, previous selection demotes to dashed, card stripe + compass chip re-tint to the new variant's token; honors `prefersReducedMotion` (skips the stroke-width tween in that case) | swift-implementer | 240 min |
| RR-S09-IOS-T04 | iOS chat-refine + dismiss/recall wiring — unlock `LSChatInput` (`isThinking = false`, placeholder = "Refine your ride…"); submit handler calls `viewModel.refine(prompt:)` which reuses the active `sessionId` and transitions the map host back to its planning state; dismiss chevron on `LSNavigatorMessage` calls `viewModel.dismissMessage()`; copper Recall chrome chip renders bottom-anchored when `isMessageDismissed == true`; tap Recall → `viewModel.recallMessage()` re-pins | swift-implementer | 240 min |
| RR-S09-IOS-T05 | iOS `DesignReviewCaptureTests` — add `test_routeResultsScreen_*` methods for every `(route-results-screen, state, theme)` tuple aligned to the canonical 7-variant set finalized in RR-S09-DR-T01 (S01 default-best-pre-selected light, S02 alt1-tapped-sage-promoted light, S03 default-dark dark, S04 refining light, V01 two-candidates light, V02 weather-divergent light, V03 message-dismissed light); each test captures one PNG at the canonical accessibility-identifier-targeted location | swift-implementer | 180 min |
| RR-S09-AND-T01 | Android `RouteResultsViewModel` parity — bind `routePlans.getPlanById` flow via existing Convex repository; derive `routeOptions: PlannedRouteOptions`, expose `selectedRouteId: String?`, `polylines: List<PolylineData>` with per-variant color/dash tokens, `cards: List<RouteAttachmentCardModel>`, `selectAlt(id:)` intent, `refine(prompt:)` intent that reuses `sessionId`, `dismissMessage()` / `recallMessage()` intents, `isMessageDismissed: Boolean` flag; match the iOS view-model's published surface exactly | kotlin-implementer | 240 min |
| RR-S09-AND-T02 | Android route-results Compose composition on the persistent map host — render `LSContextCapsule(state = ContextCapsuleState.Results)` above + horizontal `LSRouteAttachmentCard` row below in the `LSMapHost.topOverlays` slot; reuse Sprint 06 `LSMapHost`; configure Sprint 07 `LSMapControls` for results state; preserve identity of `LSMapHost` across planning→results transition (no remount of the Mapbox view) | kotlin-implementer | 300 min |
| RR-S09-AND-T03 | Android three-polyline rendering + alt-selection parity — render all three polylines via Mapbox Android polyline source/layer pairs with correct color/dash tokens; promotion behavior matches iOS: tap card → state flip → polyline stroke style swap → card stripe / compass chip re-tint; honors accessibility reduced-motion preference | kotlin-implementer | 240 min |
| RR-S09-AND-T04 | Android chat-refine + dismiss/recall parity — unlock `LSChatInput`, placeholder swap; submit reuses `sessionId` and transitions back to planning state; dismiss → ViewModel `dismissMessage()`; copper Recall chip Composable renders bottom-anchored when `isMessageDismissed == true`; tap recalls; matches iOS interaction model exactly | kotlin-implementer | 240 min |
| RR-S09-AND-T05 | Android instrumented design-review capture refresh for `route-results-screen` variants — add `RouteResultsCaptureTests` (Espresso / dropshots in `androidTest/`) for every `(route-results-screen, state, theme)` tuple aligned to the canonical 7-variant set; PNGs land under `android/app/src/androidTest/.../route-results-screen/` for parity with iOS captures | kotlin-implementer | 180 min |
| RR-S09-E2E-IOS-T01 | iOS XCUITest live route-results E2E — extend `LaneShadowUITests/E2E/` with a planning→results→alt-select→refine→dismiss→recall happy-path scenario hitting the live Convex deployment via `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD`; assert: 3 polylines appear, alt-card tap promotes selection, refine submit reuses same `sessionId` (validated via Convex DB query), dismiss removes message and shows Recall chip, Recall re-pins message; record `.xcresult` + attached screenshots under `ios/build/E2E/` per `docs/REAL_DEVICE_E2E.md` | swift-implementer | 180 min |
| RR-S09-T11 | Sprint 09 gate — `pnpm design:review --screens route-results-screen` zero high + real-iPhone XCUITest evidence (planning→results→alt-select→refine→dismiss→recall) + Android emulator walk evidence (alt-select + refine + dismiss/recall, with explicit MANUAL/BLOCKED markers for any Android-specific real-device gaps per `RULES.md` §"Real Device E2E Testing") + project `design-review` skill pass | qa-engineer | 180 min |

---

## Source Coverage

- **UC-CHAT-03** (route results with real route_plans and multi-polyline map) — 3 polylines from `plan.options[]`, attached `mol-route-attachment-card` row, alt-card tap → `selectedRouteId` update, refine via `LSChatInput` reuses `sessionId`, weather badge from `route_enrichments`
- **UC-ROUTE-05** (V3-integration roadmap reference — multi-option display) — see roadmap entry; UC-ROUTE-05 itself is the existing "alt-selection + chat-refine on RouteResults" coverage threaded through this sprint
- **UC-FID-01** (route-results-screen subset — all 7 variants per the canonical reference set)
- `.spec/prds/v3-integration/architecture/ios-architecture.md` § RouteResultsScreen
- `.spec/prds/v3-integration/architecture/android-architecture.md` § RouteResultsViewModel
- **Reused components:** `LSContextCapsule` (Sprint 07), `LSMapControls` (Sprint 07), `LSMapView`/`LSMapHost` (Sprint 06), `LSChatInput` (existing), `LSNavigatorMessage` (existing), `mol-route-attachment-card` (existing per design-system molecules), `LSMap` polyline source/layer pattern (Sprint 06)

### Per-Task Design Files

| Task | Design Reference |
|------|------------------|
| RR-S09-DR-T01 | `.spec/design/system/views/route-results-screen/README.md` (canonical 7-variant matrix) + `.spec/design/system/refs/route-results-screen/*.png` (current reference assets) + `scripts/design-review/prompts/visual-eval.md` |
| RR-S09-CVX-T01 | `.spec/prds/v3-integration/05-uc-chat.md` (UC-CHAT-03 AC list) + `.spec/prds/v3-integration/architecture/ios-architecture.md` §5.3 RouteResultsScreen (state.routes shape) + `server/convex/db/routePlans.ts` (getPlanByIdHandler) |
| RR-S09-IOS-T01, T02, AND-T01, AND-T02 | `.spec/design/system/views/route-results-screen/route-results-screen.html` + `.spec/design/system/views/route-results-screen/README.md` + `.spec/design/system/molecules/context-capsule/README.md` + `.spec/design/system/molecules/route-attachment-card/README.md` (or equivalent path) |
| RR-S09-IOS-T03, AND-T03 | `.spec/design/system/views/route-results-screen/route-results-screen.html` § polyline strokes (best 3.5px copper, alt1/alt2 2.5px sage/slate with `6 4`/`3 4` dashes) + design-system motion recipes (V2 `routeDrawOn` + alt-selection promotion motion) |
| RR-S09-IOS-T04, AND-T04 | `.spec/design/system/molecules/chat-input/` (refine placeholder + unlocked state) + `.spec/design/system/views/route-results-screen/route-results-screen.html` §S04 Refining variant + §V03 Message Dismissed (Recall chip placement) |
| RR-S09-IOS-T05, AND-T05 | `.spec/design/system/refs/route-results-screen/*.png` (canonical reference set) + `LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (extended per task) |
| RR-S09-E2E-IOS-T01 | `docs/REAL_DEVICE_E2E.md` + `.spec/prds/v3-integration/architecture/ios-architecture.md` §RouteResultsScreen (state transitions) |
| RR-S09-T11 | All of the above + `gate-evidence/` directory for xcresult artifacts, design:review reports, alt-select + refine + dismiss/recall walk evidence |

---

## Blocks

- **Blocks:** Sprint 10 (Sprint 10 reuses the same map host + capsule + controls and additionally consumes the post-results route-details bottom-sheet wiring; Sprint 10 cannot start until results-state proves the per-state-overlay pattern continues to work and the BEST card tap entry point is wired)
- **Dependent on:** Sprint 08 (the planning state must complete and transition cleanly into the results state on the same map host; Sprint 07's `LSContextCapsule` and `LSMapControls` are also required and have already shipped)

---

## Notes

- **Component reuse contract (CRITICAL):** Sprint 09 binds to existing components — `LSContextCapsule` (Sprint 07), `LSMapControls` (Sprint 07), `LSMapView`/`LSMapHost` (Sprint 06), `LSNavigatorMessage` (existing organism), `mol-route-attachment-card` (existing molecule), `LSChatInput` (existing). Re-implementing any of these is a planning anti-pattern. If a component change is required, it MUST be flagged for the owning sprint's component owner, not patched in Sprint 09.
- **Existing scaffolding (CRITICAL READ for planners and implementers):** The iOS `RouteResultsScreen.swift` template exists at `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` (259 lines) and currently consumes `RouteResultsMockProvider` for variant fixtures. Android has `RouteResultsViewModel.kt`, `RouteResultsUiState.kt`, and `RouteResultsRoute.kt` at `android/app/src/main/java/com/laneshadow/ui/routeresults/`. Sprint 09 **replaces the mock-provider data path with the live Convex `routePlans.getPlanById` subscription** and adds the missing intents — it does NOT re-implement the screen scaffolding from scratch.
- **`getPlanById` is the canonical subscription:** `server/convex/db/routePlans.ts` already exports `getPlanByIdHandler` + `getPlanById` query + `cancelPlan` mutation. RR-S09-CVX-T01 verifies the surface, adds any missing read-model layer (e.g., a stable `{best, alt1, alt2}` order), and confirms refine via `agent.sendMessage` reuses the active `sessionId` without minting a new `planningSessions` row.
- **Selection persistence policy:** Per the design and ROADMAP gate, `selectedRouteId` is a **client-side** view-model property — the user's pick of which route to highlight is not a server-side commitment. The actual ride selection happens on `RouteDetailsScreen` Sprint 10 via Save / Ride this. RR-S09-CVX-T01 will document this explicitly (no Convex `selectOption` mutation unless the design pivots).
- **Alt-selection promotion is a stroke style swap, not a polyline re-render:** Per `route-results-screen.html`, the promotion changes stroke-width + dash array on the existing Mapbox layer source pairs. It does NOT trigger `LSMap` to remount or to remove/re-add layers. The reduced-motion handling collapses the tween to an instantaneous swap.
- **Refine reuses session, returns to planning:** Per UC-CHAT-03 state machine (`ROUTE_RESULTS → PLANNING on refine via chat input (reuses session)`), the refine submit transitions the map host BACK to the planning state with a new `sessionMessages` entry. When the agent completes, the map host re-enters results with replacement polylines. Confirm via Convex DB query that no fresh `planningSessions` row is created — same `sessionId`.
- **Dismiss/Recall is client-only:** Hiding and re-pinning the Navigator message is local UI state — no Convex mutation. The Recall chip MUST honor the exact bottom-anchored position spec'd in the V03 variant (`route-results-screen.html` § Message Dismissed).
- **Variant reconciliation owner:** RR-S09-DR-T01 owns the reconciliation between ROADMAP gate variant names (S01 default light, S02 alt-selected, S03 dark, S04 refining-scrim, V01 fewer-than-3, V02 single-candidate, V03 recall-chip) and the canonical filenames in `.spec/design/system/refs/route-results-screen/` (`default--best-pre-selected`, `alt1-tapped--sage-promoted`, `default--dark`, `refining`, `two-candidates`, `weather-divergent`, `message-dismissed`). The canonical filenames win; the ROADMAP gate text becomes secondary metadata. Capture tests (RR-S09-IOS-T05, AND-T05) MUST align to the canonical filename set.
- **Weather divergent variant (V02):** This variant requires the per-card `LSWeatherBadge` molecule to render with real data from `db.routeEnrichments.list`. RR-S09-CVX-T01 verifies the subscription surface; the iOS/Android composition tasks include the badge rendering in the card model.
- **Anti-pattern to avoid:** Adding a new "RouteResultsScreen" navigation destination. The route-results state is a **configuration of the persistent map view**, not a new screen. iOS NavigationStack and Android Navigation Compose stacks DO NOT push a new destination on planning→results transition.
- **Backend is mostly verification:** Most backend infrastructure shipped in Sprint 04 (`routePlans.getPlanById`, `agent.sendMessage`, `agent.planRide`, `sessionMessages`). RR-S09-CVX-T01 is verification + read-model layering + documenting the `selectedRouteId` policy, not net-new backend.
- **Estimate sum:** ~3,060 minutes (≈51 hours of focused work across convex-implementer / swift-implementer / kotlin-implementer / frontend-designer / qa-engineer).
- **Parallel dispatch policy:** Per project memory, /kb-run-sprint MUST cap parallel Task() dispatch at 2. iOS + Android twin tasks at the same wave count (T01-T01, T02-T02, etc.) are the canonical parallel pair; CVX, DR, E2E, and gate tasks run sequentially against the prior wave's commits.

---

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-05-14

- [RR-S09-DR-T01-reconcile-route-results-variant-naming.md](./RR-S09-DR-T01-reconcile-route-results-variant-naming.md)
- [RR-S09-CVX-T01-convex-route-results-contract.md](./RR-S09-CVX-T01-convex-route-results-contract.md)
- [RR-S09-IOS-T01-ios-route-results-view-model.md](./RR-S09-IOS-T01-ios-route-results-view-model.md)
- [RR-S09-IOS-T02-ios-route-results-state-composition.md](./RR-S09-IOS-T02-ios-route-results-state-composition.md)
- [RR-S09-IOS-T03-ios-three-polyline-rendering-and-alt-selection.md](./RR-S09-IOS-T03-ios-three-polyline-rendering-and-alt-selection.md)
- [RR-S09-IOS-T04-ios-chat-refine-and-dismiss-recall.md](./RR-S09-IOS-T04-ios-chat-refine-and-dismiss-recall.md)
- [RR-S09-IOS-T05-ios-design-review-capture-tests.md](./RR-S09-IOS-T05-ios-design-review-capture-tests.md)
- [RR-S09-AND-T01-android-route-results-view-model.md](./RR-S09-AND-T01-android-route-results-view-model.md)
- [RR-S09-AND-T02-android-route-results-state-composition.md](./RR-S09-AND-T02-android-route-results-state-composition.md)
- [RR-S09-AND-T03-android-three-polyline-rendering-and-alt-selection.md](./RR-S09-AND-T03-android-three-polyline-rendering-and-alt-selection.md)
- [RR-S09-AND-T04-android-chat-refine-and-dismiss-recall.md](./RR-S09-AND-T04-android-chat-refine-and-dismiss-recall.md)
- [RR-S09-AND-T05-android-instrumented-design-review-capture.md](./RR-S09-AND-T05-android-instrumented-design-review-capture.md)
- [RR-S09-E2E-IOS-T01-ios-route-results-live-e2e.md](./RR-S09-E2E-IOS-T01-ios-route-results-live-e2e.md)
- [RR-S09-T11-sprint-gate.md](./RR-S09-T11-sprint-gate.md)
