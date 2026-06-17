# Sprint 08 Stub-Fix Handoff

**Date:** 2026-05-14T03:00Z
**Reason for handoff:** Bash safety classifier (`claude-opus-4-7[1m]`) sustained outage — all execution of `pnpm`, `node`, `vitest`, `biome`, `xcodebuild`, `gradlew`, and `node_modules/.bin/*` denied for the duration of this session. Read-only ops (Read, grep, git status, ls) work fine.

**Per CLAUDE.md "stubs are NOT ACCEPTABLE" + memory rule "verify subagent commits independently":** I did NOT commit any of the staged changes. They sit in the working tree awaiting test verification by the user.

---

## Layer 1 — Convex (`STUB-FIX-CVX`)

### Files modified (staged)
- `convex/db/routePlans.ts` (cancelPlanHandler: added Option B dual-path lookup + JSDoc)
- `convex/db/__tests__/routePlans.test.ts` (added AC-5 test for rider-initiated path)

### Verification

```bash
pnpm test -- convex/db/__tests__/routePlans.test.ts
pnpm exec biome check convex/db/routePlans.ts convex/db/__tests__/routePlans.test.ts
pnpm type-check:native
```

All three must exit 0.

### Commit (after green)

```bash
git add convex/db/routePlans.ts convex/db/__tests__/routePlans.test.ts

git commit -m "$(cat <<'EOF'
STUB-FIX-CVX cancelPlanHandler handles missing planningSessionId for rider-initiated plans

Red-hat finding L-1: cancelPlanHandler silently skipped message-patching when
doc.planningSessionId was undefined. Rider-initiated plans created via the
public createPlan mutation never set planningSessionId — only agent-initiated
plans via createForAgentInternal did. The cancel handler's message-patching
block was wrapped in `if (doc.planningSessionId)`, so rider-initiated cancels
left planning sessionMessages in `streaming` status forever, stalling the
return-to-idle flow on both iOS and Android.

Fix (Option B): added an else branch that scans session_messages for rows
whose attachments[].routePlanId matches the cancelled plan. Both pathways
patch in-flight planning messages to `status='failed'`.

Test (AC-5): added rider-initiated cancel coverage to routePlans.test.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Layer 2 — iOS IdleScreen (`STUB-FIX-iOS-T03 + T01`)

### Files modified (unstaged)
- `ios/LaneShadow/Views/Templates/IdleScreen.swift`

### Stubs eliminated
- `?? {}` empty-closure fallbacks for `onZoomIn`/`onZoomOut`/`onRecenter` → `Logger.warning(...)` stubs that fire when caller doesn't wire a real closure.
- `onLayers` / `onToggleView` params accepted but silently discarded → now stored as instance properties, passed through to `LSMapControls` with `?? { Logger.info(...) }` defaults so chips render with logging when un-wired.
- `import OSLog` added.

### Verification

```bash
# Static AC re-verify
grep -A1 'onToggleView' ios/LaneShadow/Views/Templates/IdleScreen.swift | grep -c 'os_log\|Logger'  # must be >= 1
grep -cE 'on(ZoomIn|ZoomOut|Recenter|Layers): \{\}' ios/LaneShadow/Views/Templates/IdleScreen.swift # must be 0

# Behavioral
xcodebuild test \
  -scheme LaneShadow \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:LaneShadowTests/Features/Idle
```

26 prior idle tests must still pass.

### Commit

```bash
git add ios/LaneShadow/Views/Templates/IdleScreen.swift

git commit -m "$(cat <<'EOF'
STUB-FIX-iOS-T03+T01 IdleScreen logging stubs replace empty-closure fallbacks

Red-hat findings:
- FIX-S07-IOS-T03 (CRITICAL): claimed-complete but Logger absent from
  IdleScreen.swift — fabricated completion per subagent fabrication risk.
- FIX-S07-IOS-T01 (HIGH): `?? {}` empty-closure fallbacks for zoom/recenter
  preserved the H-1 semantic stub via a narrow grep escape.
- Both: `onLayers`/`onToggleView` init params accepted but silently
  discarded (never stored); hardcoded `nil` passed to LSMapControls hiding
  chips the design requires visible.

Fix:
- `import OSLog` added.
- onZoom/onRecenter `?? {}` fallbacks replaced with `Logger.warning(...)`
  stubs that fire when a caller doesn't provide a real closure.
- onLayers/onToggleView now stored as instance properties.
- mapControlsView passes `?? { Logger.info("[STUB] ...") }` defaults so
  chips render with logging when un-wired (per FIX-S07-IOS-T03 spec
  "tapping mode-toggle emits a console log entry").

Static ACs verified:
- grep -A1 'onToggleView' | grep -c 'Logger' = 1
- grep -cE 'on(ZoomIn|ZoomOut|Recenter|Layers): \{\}' = 0

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Layer 3 — iOS PlanningScreen (`STUB-FIX-iOS-Planning`)

### Files modified (staged)
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift`
- `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` (+`capsuleHeadline` property)
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (`screenState` exposes capsuleHeadline)
- `ios/LaneShadowTests/Templates/PlanningScreenTests.swift` (TC-2/4 replaced, TC-7/8/9 added)

### Stubs eliminated
- `isThinking: false, isEnabled: true` hardcoded at line 408-409 → bound to `liveState.isThinking` / `!liveState.isThinking`.
- Hardcoded `"Planning your ride…"` header at line 382 → bound to `liveState.capsuleHeadline`.
- `UIScreen.main.bounds.width/2, .height/2` anti-pattern at lines 475-476 → wrapped in `GeometryReader` (line 443).
- Tautological tests `TC-2` (line 33-41) and `TC-4` (line 77-85) replaced with real assertions.

### Verification

```bash
xcodebuild test \
  -scheme LaneShadow \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:LaneShadowTests/Templates
```

### Commit

```bash
git add ios/LaneShadow/Views/Templates/PlanningScreen.swift \
        ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift \
        ios/LaneShadow/Features/Planning/PlanningViewModel.swift \
        ios/LaneShadowTests/Templates/PlanningScreenTests.swift

git commit -m "$(cat <<'EOF'
STUB-FIX-iOS-Planning bind PlanningScreen live path to ViewModel state

Red-hat findings M-5, H-3, L-8: PlanningScreen.swift live path shipped
three production stubs:
- isThinking: false / isEnabled: true HARDCODED in LSChatInput (line 408-409),
  meaning the chat input was never locked during planning regardless of VM
  state.
- LSPhaseIndicator header hardcoded "Planning your ride…" (line 382),
  bypassing PlanningViewModel.capsuleHeadline that T01 was built to provide.
- SketchingPolyline used UIScreen.main.bounds.width/2 (line 475-476) — a
  hardcoded-screen-size anti-pattern that T03 explicitly forbids.

Test theatre in PlanningScreenTests.swift (TC-2 line 33-41, TC-4 line 77-85):
constructed PlanningScreen with no assertions — "construction succeeds"
tautologies. Replaced with real behavioral assertions.

Fix:
- LSChatInput.isThinking/isEnabled bound to liveState.isThinking.
- LSPhaseIndicator.header bound to liveState.capsuleHeadline.
- PlanningScreenLiveState.capsuleHeadline property added; ViewModel
  screenState passes it through.
- SketchingPolyline wrapped in GeometryReader; position derived from
  geometry.size.
- TC-2/4 replaced with real assertions; TC-7/8/9 added for binding paths.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Layer 4 — Android Planning (`STUB-FIX-AND-Planning`)

### Files modified (staged)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt`
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` (+3 intents)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt` (+`showCancelConfirm`)
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt`
- `tokens/semantic/semantic.tokens.json` (+`verySlow: 1400`, +`deliberate: 600`)

### Stubs eliminated
- `onCollapse = viewModel::cancel` direct-fire (CRITICAL) → `viewModel::requestCancel` (opens confirm sheet via ViewModel state).
- `PlanningTransition.Cancelled` no-op → `navController.popBackStack()` returns to idle.
- `showCancelConfirm = false` hardcoded → bound to `PlanningUiState.showCancelConfirm`.
- `verySlow` vs `deliberate` token contradiction → both tokens defined in semantic.tokens.json; test updated to assert canonical `verySlow` (1400ms per Sprint 08 spec).
- PlanningScreenTest.kt — 5 tests converted to real `ComposeTestRule` rendering. **Residual theatre:** 3 tests (AC-3, AC-5, AC-6 at lines 162-186, 243-265, 270-285) still use `File.readText().contains()` source-text matching. These verify weak-but-real properties (which token name appears in source); flagged for follow-up.

### Verification

```bash
cd android

# Unit tests
./gradlew :app:testDebugUnitTest --tests "*PlanningScreenTest*"
./gradlew :app:testDebugUnitTest --tests "*PlanningViewModelTest*"

# Lint + compile
./gradlew detekt
./gradlew :app:compileDebugKotlin

cd ..
```

### Commit

```bash
git add android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt \
        android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt \
        android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt \
        android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt \
        tokens/semantic/semantic.tokens.json

git commit -m "$(cat <<'EOF'
STUB-FIX-AND-Planning bind cancel flow to ViewModel state + replace test theatre

Red-hat findings L-4, L-5, M-2, STUB-1/2/3/6/7: Android PlanningRoute.kt
shipped four production stubs and PlanningScreenTest.kt was source-text
matching theatre.

Production stubs:
- onCollapse = viewModel::cancel: back-tap fired cancelPlan mutation
  IMMEDIATELY without confirmation (data-loss risk).
- PlanningTransition.Cancelled handler: only consumeTransition(); no
  navigation back to idle — screen stays on planning state permanently.
- showCancelConfirm = false hardcoded in toMockState(); cancel-confirm
  sheet state was unreachable in production.
- motion.duration["verySlow"] in production vs ["deliberate"] in test;
  mutually exclusive — proved test never ran against production source.

Test theatre: every PlanningScreenTest.kt test called
`File(...).readText().contains(...)` — verified source strings, not
runtime behavior.

Fix:
- PlanningViewModel: added requestCancel/dismissCancelConfirm/confirmCancel
  intents. requestCancel sets showCancelConfirm=true; confirmCancel fires
  the mutation.
- PlanningUiState: added showCancelConfirm property.
- PlanningRoute: onCollapse routes to requestCancel; Cancelled transition
  calls navController.popBackStack(); showCancelConfirm bound to VM state.
- semantic.tokens.json: verySlow (1400ms) and deliberate (600ms) tokens
  added; production uses verySlow (canonical 1400ms sketch loop).
- PlanningScreenTest.kt: 5 tests converted to real ComposeTestRule rendering.

Residual: 3 tests (AC-3, AC-5, AC-6) still use source-text matching to
verify which token names appear in source. Flagged in test-theatre task
for follow-up.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Summary by status

| Layer | Code complete | Static ACs | Tests run | Committed |
|-------|:-:|:-:|:-:|:-:|
| Convex cancelPlan | ✅ | n/a (test-based) | ❌ classifier | ❌ |
| iOS IdleScreen | ✅ | ✅ grep | ❌ classifier | ❌ |
| iOS PlanningScreen | ✅ | ✅ grep | ❌ classifier | ❌ |
| Android Planning | ✅ | ✅ grep | ❌ classifier | ❌ |
| Residual test theatre | ⚠️ partial (3 Android tests) | n/a | n/a | ❌ |

---

## Out of scope (NOT stubs — un-done features)

- `LSContextCapsule` missing from iOS+Android live path planning composition (T02 — Backlog).
- `MapSketchAnimationLayer.swift/kt` does not exist (T03 — Backlog).
- `PlanningCancelConfirmSheet.swift/kt` composable does not exist (T04 — sheet UI itself; the cancel-flow ViewModel state is now wired but the actual BottomSheet/Sheet UI must still be built).
- Sprint 07 D-001 (iOS sandbox host rendering) still blocking PLAN-S08-IOS-T05 and PLAN-S08-T11 gate.

---

## If classifier recovers in your session

Run the 4 verification blocks in order. If any fails, dispatch the corresponding `*-reviewer` agent to diagnose:
- Convex fails → `convex-reviewer`
- iOS fails → `swift-reviewer`
- Android fails → `kotlin-reviewer`

Do NOT commit untested layers. Per CLAUDE.md: "You are not done until you have watched it work for real."
