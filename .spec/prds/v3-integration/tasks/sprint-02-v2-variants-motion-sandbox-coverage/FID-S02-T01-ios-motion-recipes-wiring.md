================================================================================
TASK: FID-S02-T01 - iOS Motion Recipes Wiring
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint: swiftformat --lint {files}
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-5 not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence, ≤30 words — observable success)
--------------------------------------------------------------------------------

Five iOS motion recipes (sketchPolylineLoop, breathingHeadDot, bestBadgeEnter, recordDotPulse, chatOverlayEnter) animate at the designed durations and easings driven by `theme.motion` tokens.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER hardcode durations or easings — every animation reads from `theme.motion.{recipe}` (e.g. `theme.motion.sketchPolylineLoop.duration`)
- MUST replace the current 600ms cubic-bezier sketch loop with a 1400ms linear loop on iOS
- MUST replace the 400ms head-dot breathing with a 1400ms ease-in-out reverse animation that is in-phase with the sketch loop
- STRICTLY use SwiftUI native `.animation(_:value:)` / `.repeatForever(autoreverses:)` — no Combine timers or manual `Task.sleep` loops
- NEVER introduce new motion tokens — use the `theme.motion` keys already declared in `tokens/semantic/motion.json`; if a key is missing, flag it and stop

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] PlanningScreen sketch polyline animates at 1400ms linear, repeating forever (AC-1 PRIMARY)
- [ ] PlanningScreen leading head dot breathes 1.0→0.55→1.0 over 1400ms ease-in-out (AC-2)
- [ ] LSBestBadge enters with `bestBadgeEnter` 200ms scale 0.8→1.0 + opacity 0→1 spring (AC-3)
- [ ] LSTopBar record-highlight dot pulses infinitely between 1.0 and 0.45 opacity over 1400ms (AC-4)
- [ ] ErrorScreen / RouteResults suggestion chips enter with `chatOverlayEnter` (slide-up 8pt + fade 0→1) (AC-5)
- [ ] `xcodebuild build` passes + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified (git diff --name-only)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: Sketch polyline loop runs at 1400ms linear [PRIMARY]
  GIVEN: PlanningScreen S02 (drawing) story renders the sketch polyline
  WHEN:  The polyline draw-on animation cycles
  THEN:  Animation duration reads `theme.motion.sketchPolylineLoop.duration` (= 1400ms) with `.linear` easing and `.repeatForever(autoreverses: false)`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MotionTests.swift
  TEST_FUNCTION: testSketchPolylineLoop1400Linear

AC-2: Breathing head dot synced with sketch loop
  GIVEN: PlanningScreen S02 renders the leading head dot
  WHEN:  The dot breathing animation runs
  THEN:  Opacity oscillates 1.0 ⇄ 0.55 over `theme.motion.breathingHeadDot.duration` (= 1400ms) with `.easeInOut` and `.repeatForever(autoreverses: true)`, in-phase with the sketch loop

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MotionTests.swift
  TEST_FUNCTION: testBreathingHeadDot1400EaseInOut

AC-3: bestBadgeEnter spring on RouteSheet
  GIVEN: LSRouteSheet appears in the sandbox with the LSBestBadge present
  WHEN:  The sheet completes its present transition
  THEN:  LSBestBadge animates `scaleEffect` 0.8→1.0 and `opacity` 0→1 using `.interpolatingSpring(...)` over 200ms read from `theme.motion.bestBadgeEnter`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MotionTests.swift
  TEST_FUNCTION: testBestBadgeEnterSpring

AC-4: Record-highlight dot pulse
  GIVEN: LSTopBar is in record-highlight state in the sandbox
  WHEN:  The record dot is visible
  THEN:  Dot opacity pulses between 1.0 and 0.45 over `theme.motion.recordDotPulse.duration` (= 1400ms) `.easeInOut` `.repeatForever(autoreverses: true)`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MotionTests.swift
  TEST_FUNCTION: testRecordDotPulse1400

AC-5: Suggestion chips enter with chatOverlayEnter
  GIVEN: LSInlineErrorCallout (with suggestions) or RouteResults refining primer chips appear
  WHEN:  The chip row first renders
  THEN:  Each chip slides up 8pt and fades from opacity 0 → 1 over `theme.motion.chatOverlayEnter.duration` with `.easeOut`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MotionTests.swift
  TEST_FUNCTION: testChatOverlayEnterChips

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Screens/PlanningScreen.swift (MODIFY)
- ios/LaneShadow/Views/Organisms/LSPhaseIndicator.swift (MODIFY — head-dot breathing)
- ios/LaneShadow/Views/Organisms/LSRouteSheet.swift (MODIFY — bestBadgeEnter)
- ios/LaneShadow/Views/Atoms/LSBestBadge.swift (MODIFY — entrance animation hook)
- ios/LaneShadow/Views/Organisms/LSTopBar.swift (MODIFY — record-dot pulse)
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift (MODIFY — chip enter)
- ios/LaneShadow/Views/Screens/RouteResultsScreen.swift (MODIFY — refining chip enter)
- ios/LaneShadowTests/Sandbox/MotionTests.swift (NEW)

writeProhibited:
- android/** — separate paired task (FID-S02-T02)
- server/**, react-native/**
- tokens/** — must NOT add new motion keys; if a token is missing, stop and flag
- Any file not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Read `theme.motion.{recipe}` for duration and easing
- Use SwiftUI `.animation()` + `.repeatForever()` modifiers
- Verify in sandbox that animations run for visible time after first frame

⚠️ Ask First:
- If a `theme.motion.{recipe}` key does not exist (do NOT add it without flagging)
- If a screen needs additional animation state to host the recipe
- Any change to LSBestBadge initialization signature (downstream callers may rely on it)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Screens/PlanningScreen.swift (MODIFY): Replace 600ms sketch animation with token-driven 1400ms linear loop
- ios/LaneShadow/Views/Organisms/LSPhaseIndicator.swift (MODIFY): Head-dot opacity breathing using `theme.motion.breathingHeadDot`
- ios/LaneShadow/Views/Atoms/LSBestBadge.swift (MODIFY): `.transition` hook for `bestBadgeEnter` spring
- ios/LaneShadow/Views/Organisms/LSRouteSheet.swift (MODIFY): Trigger `bestBadgeEnter` after sheet settles
- ios/LaneShadow/Views/Organisms/LSTopBar.swift (MODIFY): Record dot pulse animation
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift (MODIFY): Suggestion chip enter slide+fade
- ios/LaneShadow/Views/Screens/RouteResultsScreen.swift (MODIFY): Refining-state primer chip enter
- ios/LaneShadowTests/Sandbox/MotionTests.swift (NEW): Verify each animation reads from `theme.motion`

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   AC definition; current animation usage in target file; `theme.motion` token definitions
  WRITE:  ONE test in MotionTests.swift that asserts the rendered View binds the recipe's duration / easing / repeat-mode (introspect via test-only `.matchedAnimation(recipeKey:)` modifier or by snapshotting an Animatable property over deterministic time)
  RUN:    xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Test FAILS (current code uses wrong duration/easing or no animation)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  Always: Show actual test failure output.
  Never:  Modify implementation in RED phase.

### GREEN PHASE
  READ:   Failing test, AC definition, theme motion definitions
  WRITE:  Minimal animation wiring: `.animation(.linear(duration: theme.motion.sketchPolylineLoop.duration).repeatForever(autoreverses: false), value: drawProgress)` etc.
  RUN:    xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  Always: Drive every animation parameter from a token.
  Never:  Add new behavior outside the AC.

### REFACTOR PHASE
  READ:   Implementation just written
  WRITE:  Pull repeated `.animation(…)` calls into a small `Animation+Motion.swift` extension if 3+ sites duplicate the pattern
  RUN:    xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Tests still pass; no behavior change

## AFTER ALL ACs COMPLETE:
  Run full iOS build: xcodebuild build
  Run native compliance: scripts/tokens/enforce-native-compliance.sh
  Open the PlanningScreen / RouteSheet / TopBar / Error stories in sandbox and visually confirm motion timing

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. ios/LaneShadow/Theme/LSMotion.swift [PRIMARY PATTERN]
   - Lines: all
   - Focus: How `theme.motion.{recipe}` is exposed; the `.duration` / `.easing` / `.repeatMode` API surface

2. tokens/semantic/motion.json
   - Sections: sketchPolylineLoop, breathingHeadDot, bestBadgeEnter, recordDotPulse, chatOverlayEnter
   - Focus: Source-of-truth recipe values

3. ios/LaneShadow/Views/Screens/PlanningScreen.swift
   - Focus: Current 600ms cubic-bezier sketch animation that must be replaced

4. .spec/design/system/views/mapapp/planning/planning-screen.html
   - Focus: Designed animation timings + sketch polyline + breathing head dot reference behavior

5. .spec/prds/v3-integration/remediations/01-views-idle-planning.md
   - Sections: Gap F-01 (sketch loop), Gap F-02 (breathing head dot)
   - Focus: Detailed explanation of current vs designed behavior

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first — fail fast)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: Each AC's TDD_STATE shows red→green progression.

Gate 2: One test per AC
  Verify: MotionTests.swift contains one test per AC-1..AC-5.

Gate 3: Native compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0 (no hardcoded durations or easings outside the test file).

Gate 4: All tests pass
  Command: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  Expected: Exit 0.

Gate 5: Build passes
  Command: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build
  Expected: Exit 0.

Gate 6: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android motion recipes (FID-S02-T02)
- Drawer slide animation (covered in FID-S02-T02 paired Android side; iOS already has slide via SessionsDrawer container fix in T05/T08 of Sprint 01)
- Polyline `Animatable.animateTo` rework (FID-S02-T05/T06 — RouteResults route polylines)
- Adding new motion token keys (must be done in a token-additions task with design approval)

--------------------------------------------------------------------------------
CONTEXT (read if unclear)
--------------------------------------------------------------------------------

**Current state:** PlanningScreen iOS uses `Animation.timingCurve(0.4, 0, 0.2, 1, duration: 0.6)` for the sketch polyline (>2× too fast, wrong easing). LSPhaseIndicator's head dot uses 400ms ease-in-out (>3× too fast). LSBestBadge has no entrance animation (`bestBadgeEnter` recipe exists in tokens but is never bound). LSTopBar's record dot is a static `Circle`. LSInlineErrorCallout suggestion chips appear instantly without slide+fade.

**Gap:** All five recipes are declared in `tokens/semantic/motion.json` but the iOS view layer is either using hardcoded substitutes or not animating at all. This produces a "rushed and stiff" feel against the designed deliberate cadence.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5, evidence-gate-backed):
- One test per AC; tests bind to the recipe's duration/easing token, not literal numbers
- RED evidence present in TDD_STATE history for each AC
- All five animations driven from `theme.motion.{recipe}`; no hardcoded durations or easings outside MotionTests.swift
- SCOPE respected (git diff --name-only ⊆ writeAllowed)
- Pattern consistent with READING LIST `LSMotion.swift` exposure

Should verify (≤5, judgment):
- Animations don't accumulate state on view recomposition (head dot stays in-phase across re-renders)
- `.repeatForever` doesn't leak when the host view disappears (use `.id()` or `@State` lifecycle correctly)
- `bestBadgeEnter` only fires once per sheet present, not on every recomposition
- Reduced-motion accessibility setting is honored (animations fall back to instant if `accessibilityReduceMotion` is true)
- No regression on other LSTopBar / RouteSheet stories

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T04 (LSRouteSheet bottom-sheet shell — bestBadgeEnter needs a real sheet present transition)
Blocks:     FID-S02-T10 (snapshot baselines must capture motion-driven stories at deterministic frames)
Parallel:   FID-S02-T02 (Android motion), FID-S02-T03..T08 (iOS variant work)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN PlanningScreen S02 sketch polyline rendered WHEN draw animation cycles THEN duration reads theme.motion.sketchPolylineLoop (1400ms) linear repeatForever(autoreverses:false)", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN PlanningScreen leading head dot WHEN breathing animation runs THEN opacity oscillates 1.0/0.55 over theme.motion.breathingHeadDot (1400ms) easeInOut repeatForever(autoreverses:true) in-phase with sketch", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSRouteSheet appears with LSBestBadge WHEN sheet completes present transition THEN LSBestBadge scaleEffect 0.8→1.0 + opacity 0→1 via interpolatingSpring 200ms from theme.motion.bestBadgeEnter", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSTopBar in record-highlight WHEN record dot visible THEN opacity pulses 1.0/0.45 over theme.motion.recordDotPulse (1400ms) easeInOut repeatForever(autoreverses:true)", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSInlineErrorCallout suggestion chips or RouteResults refining primer chips appear WHEN chip row first renders THEN each chip slides up 8pt and fades 0→1 over theme.motion.chatOverlayEnter easeOut", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "Sketch polyline animation duration equals theme.motion.sketchPolylineLoop.duration with linear easing and repeatForever(autoreverses:false)", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/MotionTests/testSketchPolylineLoop1400Linear" },
    { "id": "TC-2", "type": "test_criterion", "description": "Breathing head dot duration equals theme.motion.breathingHeadDot.duration with easeInOut and autoreverses:true", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/MotionTests/testBreathingHeadDot1400EaseInOut" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSBestBadge entrance reads theme.motion.bestBadgeEnter and uses interpolatingSpring", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/MotionTests/testBestBadgeEnterSpring" },
    { "id": "TC-4", "type": "test_criterion", "description": "Record-highlight dot pulse uses theme.motion.recordDotPulse duration and oscillates between 1.0 and 0.45 opacity", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/MotionTests/testRecordDotPulse1400" },
    { "id": "TC-5", "type": "test_criterion", "description": "Suggestion chip enter uses theme.motion.chatOverlayEnter with 8pt slide-up + fade-in 0→1 easeOut", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/MotionTests/testChatOverlayEnterChips" }
  ]
}
-->
