# Red-Hat Review Report — Planning State Card

**Report Date**: 2026-05-19T02:46:31Z
**Target**: `mapapp/planning` — iOS planning state card (UC-SCR-02)
**Spec**: `/Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/planning`
**User Bug Report**: *"I see the card, but the state doesn't change. We should have a concrete planning state that drives the designed UI."*
**Reviewed By**: `frontend-designer`, `convex-reviewer`

---

## Executive Summary

**Both reviewers agree: the bug is real, and the root cause is a contract mismatch between the iOS phase derivation and the Convex backend.** The iOS `PlanningPhase.deriveFromThinkingSteps` path is structurally dead because backend writes `thinkingSteps` to a different row (`kind="thinking_card"`) than the one iOS inspects (`kind="planning"`). The fallback to `message.phase` does not save the user either, because the backend only ever writes `PARSING` (at creation) or `FINALIZING` (at completion) — the intermediate `SEARCHING`/`DRAFTING`/`ENRICHING` values are never persisted to that field. The remaining derivation path (`deriveFromPlanningContent` reading `content` JSON events) is the only one that works, and it only fires when the orchestrator delegates to a sub-agent.

Net effect: the user sees `.parsing` for the entire planning run, or `.parsing → .finalizing` with no intermediate steps. The 5-phase indicator UI is wired but receives no signal to advance.

Compounding the stuck-state bug, four of the seven spec variants have **no live implementation at all**:
- **S03 Weather**: no weather icon overlay slot in `liveContent`.
- **S04 Scoring**: `polylines: []` hardcoded — candidate routes never render during planning.
- **V01 Slow Planning**: no stall timer, no `isSlowPlanning` field — the apology copy never appears.
- **V03 Single Candidate**: `showWarningChrome` is wired to `errorMessage != nil`, a semantic collision with error state, not to a single-candidate result.

---

## HIGH Confidence Findings (Both Agents Agree)

- [ ] **F1: `thinkingSteps` derivation path is permanently dead.** Backend writes `thinkingSteps` exclusively to `thinking_card` rows (`server/convex/actions/agent/sendMessage.ts:210-215`, `server/convex/db/sessionMessages.ts:617-625`). iOS reads them only from `planning` rows after `guard message.kind == "planning"` (`PlanningPhase.swift:70, 78`). The two never intersect. | **Severity: Critical** | Agents: frontend-designer, convex-reviewer

- [ ] **F2: `message.phase` only ever holds `PARSING` or `FINALIZING`.** The intermediate values `SEARCHING`, `DRAFTING`, `ENRICHING` are never written directly to the field. Only `createPendingAssistantMessage` (PARSING) and `finalizeAssistantMessage` (FINALIZING) write `phase`. The `derivePlanningPhase()` recomputation inside `updatePlanningContent` happens only when content events fire. (`server/convex/db/sessionMessages.ts:217, 246, 401-407`) | **Severity: Critical** | Agents: frontend-designer, convex-reviewer

- [ ] **F3: Phase is stuck at `.parsing` until a sub-agent tool fires; otherwise jumps directly to `.finalizing`.** If the LLM takes 10–15 seconds to call `routing_agent`, or replies conversationally with no tools, the indicator shows `.parsing` for the entire duration, then snaps to `.finalizing`. **This matches the user's reported bug exactly.** (`PlanningPhase.swift:60-67, 86-95`; `sendMessage.ts:455-456, 609`) | **Severity: Critical** | Agents: frontend-designer, convex-reviewer

- [ ] **F4: Tool name `"fetchWeather"` is in iOS's enriching set but no backend tool emits it.** Weather is internal (`getRouteWeather`, `weatherProvider`) and never surfaces a `fetchWeather` name to the planning event system. The enrichment agent's tool events are absorbed by sub-agent delegation, not by leaf-tool emission. (`PlanningPhase.swift:168`; `server/convex/actions/agent/tools/*`) | **Severity: High** | Agents: frontend-designer, convex-reviewer

- [ ] **F5: Spec variants S03 Weather, S04 Scoring, V01 Slow Planning, V03 Single Candidate have no live implementation.** Live `PlanningScreenLiveState` is missing `weatherConditions`, `polylines`, `isSlowPlanning`, `isSingleCandidate`, and `advisoryText`. `livePhaseIndicatorView` has no rendering branches for any of them. (`PlanningScreenLiveState.swift:1-11`; `PlanningScreen+LiveContent.swift:9-52`; `PlanningScreen.swift:139`) | **Severity: High** | Agents: frontend-designer, convex-reviewer

- [ ] **F6: Sandbox stories never exercise the live composition path.** All 7 PlanningScreenStory variants use `PlanningScreen(provider:activePhase:)`, which reads from `PlanningScreenState` (sandbox domain). Real users hit the `liveState:` init reading from `PlanningScreenLiveState`. The two have different fields. No sandbox story tests the `mol-context-capsule --planning` + phase-indicator composition that real users see. (`PlanningScreenStory.swift`; `PlanningScreen+LiveContent.swift:15-22` vs `PlanningScreen.swift:91-129`) | **Severity: High** | Agents: frontend-designer, convex-reviewer

---

## MEDIUM Confidence Findings (Single Agent — High Impact)

- [ ] **F7: `currentLocation` silently dropped in `sendPlanningMessage`.** `ConvexClient+LaneShadow.swift:893-903` captures `currentLocation` and discards it with `_ = currentLocation`. The routing agent prompt then says "Rider's current location: unknown — ask where they are starting from", forcing extra clarification turns. | **Severity: High** | Agent: convex-reviewer

- [ ] **F8: `observe()` single-call session-ID race.** `PlanningViewModel.swift:64-69` early-returns if `resolvedSessionId` is nil. The container calls `observe()` exactly once on `.task`. If the session ID resolves later (common in the submit-then-show flow), the Convex subscription is never started and no phase updates arrive. | **Severity: High** | Agent: frontend-designer

- [ ] **F9: `polylines: []` hardcoded in `PlanningScreen` map view.** Even if phase advances to `.drafting`/`.enriching`/`.finalizing`, the map will show no candidate polylines because the array is hardcoded empty at `PlanningScreen.swift:139`. Spec S04 mandates `--route-best`/`--route-alt1`/`--route-alt2` strokes. | **Severity: High** | Agent: frontend-designer

- [ ] **F10: `screenState` computed property on `PlanningViewModel` is dead code.** `PlanningViewModel.swift:44-54` defines `screenState` but the container builds `PlanningScreenLiveState` manually from individual viewModel properties at `PlanningScreenContainer.swift:13-21`. Two paths diverge over time. | **Severity: Medium** | Agent: frontend-designer

- [ ] **F11: Planning row created unconditionally for every agent invocation, including conversational responses.** `planningEmitter.init()` at `sendMessage.ts:455-456` creates a `kind=planning` row even when the agent gives a direct text reply with no tool calls. iOS sees `.parsing → .finalizing` flicker on greetings. | **Severity: Medium** | Agent: convex-reviewer

- [ ] **F12: `V03 Single Candidate` semantically collides with error state.** `showWarningChrome: liveState.errorMessage != nil` (`PlanningScreen+LiveContent.swift:89`) fires on errors, not on `routeOptions.options.count == 1`. The spec's "over-constraint advisory block" copy has no field in `PlanningScreenLiveState` and no rendering branch. | **Severity: High** | Agent: frontend-designer

- [ ] **F13: Empty failed-variant loop swallows routing failures silently.** `server/convex/actions/agent/lib/planRideOrchestrator.ts:78-80` — `for (const _f of failed) { }` with empty body. Debugging `NO_ROUTES_GENERATED` in production is blind. | **Severity: Medium** | Agent: convex-reviewer

---

## LOW Confidence Findings

- [ ] **F14: Annotations JSONs are skeletal.** All 7 `*.annotations.json` files contain a single placeholder component entry with browser-computed defaults. No token contract exists for `pnpm design:review` to enforce. | Agent: frontend-designer
- [ ] **F15: `PlanningScreenLiveState` has no `Equatable` conformance**, blocking efficient SwiftUI diffing/animation. | Agent: frontend-designer
- [ ] **F16: Two divergent cancel-confirm implementations** — sandbox uses `PlanningScreen+CancelConfirm.swift` (dead button actions), live uses `PlanningCancelConfirmSheet.swift` (wired). | Agent: frontend-designer
- [ ] **F17: `SessionMessagesDocument` generated Swift type missing `phase` field** (`ConvexTypes.generated.swift:404-416`). Consistency gap with hand-written `LaneShadowSessionMessage`. | Agent: convex-reviewer
- [ ] **F18: `PlanningPhaseData.status` field is set in mock data but ignored** by `convertedPhases` int-comparison path (`PlanningScreen.swift:224-240`). Misleading for contributors. | Agent: frontend-designer

---

## Spec-to-Implementation Verdict Table

| # | Variant | State Exists? | UI Renders? | Live Progression? | Verdict |
|---|---------|---------------|-------------|-------------------|---------|
| S01 | Scouting (phase 1 active) | `.parsing` case | Renders by default | Stuck (never advances; hardcoded fallback) | ❌ **FAIL** |
| S02 | Drawing (phase 2 active) | `.searching` case | Would render if updated | Only fires via content events; not via thinkingSteps | ⚠️ **PARTIAL** |
| S03 | Weather (phase 3 + icons) | `.enriching` case | No weather icon overlay in live path | Phase may advance; weather icons never render | ❌ **FAIL** |
| S04 | Scoring (3 polylines) | No discrete `scoring` case | `polylines: []` hardcoded | Map shows no candidate routes | ❌ **FAIL** |
| V01 | Slow Planning (>4s stall) | No `isSlowPlanning` field | No live branch | No stall timer anywhere | ❌ **FAIL** |
| V02 | Cancel Prompt | `cancelConfirmationVisible` | Scrim + sheet wired | Back gesture triggers | ✅ **PASS** |
| V03 | Single Candidate (warning) | No `isSingleCandidate` field | `showWarningChrome` reads error flag, wrong semantics | Never fires correctly | ❌ **FAIL** |

---

## Root Cause (Consensus)

The phase indicator is stuck because the **signal lives in two different Convex rows and iOS only inspects one**:

```
[Convex backend]
  planning row (kind="planning")
    ├─ phase: only "parsing" → "finalizing" (intermediates never written)
    ├─ content: events JSON (only populated on sub-agent tool calls)
    └─ thinkingSteps: NEVER WRITTEN

  thinking_card row (kind="thinking_card")
    └─ thinkingSteps: [{type, toolName}, ...]  ← THE ACTUAL SIGNAL LIVES HERE

[iOS PlanningPhase.derive]
  guard message.kind == "planning"   ← filters out thinking_card rows
  → deriveFromThinkingSteps(message.thinkingSteps)  ← always nil on planning row
  → deriveFromPlanningContent(message.content)      ← only fires on sub-agent calls
  → message.phase                                   ← always "parsing" or "finalizing"
  → default: .parsing
```

---

## Recommended Fix Order

1. **Fix the derivation contract** (unblocks the user-visible bug):
   - **Option A** (backend): mirror `thinkingSteps` writes onto the `planning` row in `sendMessage.ts` so iOS sees them on the row it already reads. Update `appendThinkingStepHandler` to patch both `thinking_card` and the parent `planning` row.
   - **Option B** (iOS): change `PlanningPhase.latest` to scan ALL messages (not just `kind="planning"`) and derive phase from `thinking_card` rows' `thinkingSteps` as well. Reconcile with the active planning row's `phase` fallback.
   - **Option C** (backend): write intermediate phase values (`SEARCHING`, `DRAFTING`, `ENRICHING`) directly to the planning row's `phase` field as tool events fire, so iOS's `message.phase` fallback works without needing thinkingSteps at all. *Simplest fix.*
2. **Remove the unreachable `"fetchWeather"` mapping** from iOS `PlanningPhase.enrichingToolNames`. Pick a real backend tool name that actually fires.
3. **Fix `currentLocation` drop** in `ConvexClient+LaneShadow.swift:893-903`.
4. **Fix `observe()` session-ID race** — re-trigger subscription when `resolvedSessionId` changes, not just on first mount.
5. **Decide scope on missing variants** (S03/S04/V01/V03). These are net-new implementation work, not bug fixes. If they're in scope for the current sprint, file tasks. If not, mark them ICEBOX in the spec README so the spec stops promising what the implementation doesn't deliver.
6. **Add a live-state sandbox story** that exercises `PlanningScreenLiveState` so design review covers what real users see.
7. **Delete the dead `screenState` computed property** or rewire the container to use it as the single source of truth.

---

## Agent Reports (Summary)

- **frontend-designer**: 14 findings — 7 HIGH, 5 MEDIUM, 2 LOW. Focus: spec-to-impl mapping, missing variant rendering, sandbox vs live path divergence.
- **convex-reviewer**: 10 findings — 7 HIGH, 2 MEDIUM, 1 LOW. Focus: backend capability verdict, thinkingSteps row mismatch, `currentLocation` drop, planning-row unconditional creation.

---

## Metadata

- **Agents**: `frontend-designer`, `convex-reviewer` (user-specified, overrides RULES.md default specialist resolution; `frontend-designer` is documented as "Standalone visual exploration" — used here at user direction)
- **Confidence Framework**: HIGH (both agents agree), MEDIUM (single agent, high impact), LOW (single agent, lower impact)
- **Duration**: ~7 min (parallel dispatch)
- **Next Steps**: Choose fix option (A/B/C above), then file remediation tasks. Recommend **Option C** (write intermediate phase values directly) — minimal surface area, no iOS changes required, unblocks the user-visible bug in one mutation patch.
