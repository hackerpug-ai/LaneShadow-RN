================================================================================
TASK: FID-S02-T02 - Android Motion Recipes Wiring
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test
  lint: cd android && ./gradlew detekt
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-6 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Six Android motion recipes (sketch loop 1400ms, breathing head dot, drawer spring, RouteResults polyline `Animatable.animateTo`, record dot pulse, suggestion chip enter) animate from `theme.motion` tokens — replacing hardcoded durations and the manual coroutine frame loop.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- NEVER hardcode durations / easings — every animation reads from `theme.motion.{recipe}` (the Compose theme exposes recipe specs as `AnimationSpec`s)
- MUST replace the manual `repeat(steps) { delay(120); state = it }` coroutine in RouteResults with `Animatable.animateTo()` driven by an `AnimationSpec.tween` reading the recipe duration
- MUST replace `tween` drawer slide with `spring(dampingRatio = 0.85f, stiffness = StiffnessMedium)`
- MUST add a leading head-dot composable to LSPhaseIndicator on Android (currently missing entirely) and bind the breathing animation
- NEVER block the Compose recomposition thread — animations must be `LaunchedEffect` / `Animatable`-driven, not `delay()`-loops in `@Composable` bodies
- NEVER introduce new motion tokens — use the existing `theme.motion` keys; if a key is missing, flag it and stop

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] PlanningScreen sketch polyline animates at 1400ms linear, repeating forever (AC-1 PRIMARY)
- [ ] LSPhaseIndicator leading head dot composable exists and breathes 1400ms ease-in-out (AC-2)
- [ ] LSSessionsDrawer drawer slide uses `spring(0.85, StiffnessMedium)` (AC-3)
- [ ] RouteResultsScreen polyline draw-on uses `Animatable.animateTo()` not the manual coroutine loop (AC-4)
- [ ] LSTopBar record dot pulses 1.0 ⇄ 0.45 over 1400ms ease-in-out (AC-5)
- [ ] LSInlineErrorCallout / RouteResults refining primer chips animate in via `chatOverlayEnter` (AC-6)
- [ ] `./gradlew :app:compileDebugKotlin` + `./gradlew test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Sketch polyline loop runs at 1400ms linear [PRIMARY]
  GIVEN: PlanningScreen S02 (drawing) story renders the sketch polyline
  WHEN:  The polyline draw-on cycles
  THEN:  Animation uses `infiniteRepeatable(animation = tween(theme.motion.sketchPolylineLoop.durationMillis, easing = LinearEasing), repeatMode = RepeatMode.Restart)`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt
  TEST_FUNCTION: testSketchPolylineLoop1400Linear

AC-2: Leading head dot composable exists and breathes
  GIVEN: PlanningScreen S02 renders the LSPhaseIndicator
  WHEN:  The drawing phase is active
  THEN:  A leading head-dot composable is rendered alongside the polyline and its alpha oscillates 1.0 ⇄ 0.55 via `infiniteRepeatable(tween(theme.motion.breathingHeadDot.durationMillis, easing = EaseInOut), repeatMode = RepeatMode.Reverse)`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt
  TEST_FUNCTION: testBreathingHeadDot1400Compose

AC-3: SessionsDrawer slide uses spring
  GIVEN: SessionsScreen story opens the drawer
  WHEN:  The drawer slides in
  THEN:  Slide animation uses `spring(dampingRatio = 0.85f, stiffness = Spring.StiffnessMedium)` (not `tween`)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt
  TEST_FUNCTION: testDrawerSlideSpring

AC-4: RouteResults polyline draw uses Animatable.animateTo
  GIVEN: RouteResultsScreen S01 story renders three polylines
  WHEN:  Polylines draw on with 120ms stagger
  THEN:  Each polyline progress is driven by an `Animatable<Float>` `.animateTo(targetValue = 1f, animationSpec = tween(theme.motion.polylineDrawOn.durationMillis))` — NOT a manual `repeat(steps) { delay(120) }` loop

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt
  TEST_FUNCTION: testPolylineDrawAnimatable

AC-5: Record-highlight dot pulse
  GIVEN: LSTopBar record-highlight story is rendered
  WHEN:  The record dot is visible
  THEN:  Alpha oscillates 1.0 ⇄ 0.45 via `infiniteRepeatable(tween(theme.motion.recordDotPulse.durationMillis, easing = EaseInOut), repeatMode = RepeatMode.Reverse)` — NOT the stub-comment "would be added in production"

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt
  TEST_FUNCTION: testRecordDotPulse1400

AC-6: Suggestion chip enter (chatOverlayEnter)
  GIVEN: LSInlineErrorCallout (with suggestions) or RouteResults refining primer chips appear
  WHEN:  The chip row first composes
  THEN:  Each chip enters via `AnimatedVisibility` with `slideInVertically(initialOffsetY = { 8.dp.toPx().toInt() }) + fadeIn()`, both reading `theme.motion.chatOverlayEnter`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt
  TEST_FUNCTION: testChatOverlayEnterChips

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/screens/PlanningScreen.kt (MODIFY)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSPhaseIndicator.kt (MODIFY — add head dot composable + animation)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY — drawer slide spring)
- android/app/src/main/java/com/laneshadow/ui/screens/RouteResultsScreen.kt (MODIFY — Animatable polyline)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt (MODIFY — record dot pulse)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt (MODIFY — chip enter)
- android/app/src/main/java/com/laneshadow/theme/LSMotion.kt (MODIFY — read-only helpers, only if needed)
- android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt (NEW)

writeProhibited:
- ios/** — paired iOS task (FID-S02-T01)
- server/**, react-native/**
- tokens/** — must NOT add new motion keys
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- PlanningScreen.kt (MODIFY): Replace 600ms sketch tween with 1400ms linear infinite loop
- LSPhaseIndicator.kt (MODIFY): Add head-dot composable + 1400ms ease-in-out reverse breathing
- LSSessionsDrawer.kt (MODIFY): Replace `tween` slide with `spring(0.85f, StiffnessMedium)`
- RouteResultsScreen.kt (MODIFY): Replace manual `repeat() { delay(120) }` with `Animatable.animateTo()` per polyline
- LSTopBar.kt (MODIFY): Implement record dot pulse animation (was stubbed)
- LSInlineErrorCallout.kt (MODIFY): Wrap suggestion chips in `AnimatedVisibility` with slide+fade
- MotionTests.kt (NEW): Per-AC verification tests

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/theme/LSMotion.kt [PRIMARY PATTERN]
   - Lines: all
   - Focus: `theme.motion.{recipe}` shape — duration / easing / repeat-mode

2. tokens/semantic/motion.json
   - Sections: sketchPolylineLoop, breathingHeadDot, polylineDrawOn, recordDotPulse, chatOverlayEnter
   - Focus: Source-of-truth recipe values

3. android/app/src/main/java/com/laneshadow/ui/screens/RouteResultsScreen.kt
   - Focus: Current `repeat(steps) { delay(120); state = it }` coroutine that must be replaced with `Animatable.animateTo`

4. android/app/src/main/java/com/laneshadow/ui/organisms/LSPhaseIndicator.kt
   - Focus: Phase indicator current composition; identify where to host the head-dot composable

5. .spec/prds/v3-integration/remediations/01-views-idle-planning.md (Gap F-01, F-02) and 04-organisms-chrome.md (Gap A-04, B-05)
   - Focus: Detailed before/after of the motion gaps

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence in TDD_STATE history per AC
Gate 2: One test per AC in MotionTests.kt
Gate 3: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 4: All tests pass — `./gradlew test`
Gate 5: Compile passes — `./gradlew :app:compileDebugKotlin`
Gate 6: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS motion (FID-S02-T01)
- New screen variants (FID-S02-T04 for Idle/Planning, T06 for RouteResults/Details)
- LSBestBadge spring entrance (iOS only — FID-S02-T01; Android badge already animates correctly)
- Adding new motion tokens (must go through token-additions task with design approval)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:**
- PlanningScreen sketch polyline runs at ~600ms with `LinearEasing` — too fast.
- LSPhaseIndicator on Android has NO head-dot composable; the breathing motion does not exist on Android.
- LSSessionsDrawer slides in via a `tween` with decelerated cubic-bezier — flat feel vs designed spring.
- RouteResultsScreen draws polylines using `coroutineScope { repeat(steps) { delay(120); progress = it } }` — stutters under composition load and is not driven by animation specs.
- LSTopBar record dot is a static composable with a stub comment "would be added in production".
- LSInlineErrorCallout suggestion chips appear instantly with no enter animation.

**Gap:** All six animations must be driven from `theme.motion` recipe specs and use idiomatic Compose animation APIs (`Animatable`, `infiniteRepeatable`, `AnimatedVisibility`, `spring`).

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per AC; tests assert recipe-token binding, not literal numbers
- RED evidence per AC
- Polyline draw uses `Animatable.animateTo` — manual `repeat(steps) { delay(120) }` is removed entirely
- Drawer slide uses `spring(0.85f, StiffnessMedium)` (not `tween`)
- SCOPE respected (`git diff --name-only ⊆ writeAllowed`)

Should verify (≤5):
- Animations cancel cleanly when the host composable leaves composition (no leaked `Job`s)
- `infiniteRepeatable` is launched from a `LaunchedEffect`, not from the composable body
- `accessibilityScale` / reduced-motion preference honored (if available via Material 3)
- LSTopBar record-dot pulse doesn't accumulate phase across recompositions
- `Animatable<Float>` polyline driver compiles cleanly with no `@OptIn` leakage to public API

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T06 (Sessions drawer container fix — drawer must be solid before spring slide is meaningful)
Blocks:     FID-S02-T06 (RouteResults polyline progress must already be Animatable-driven before alt/refining variants land), FID-S02-T10 (snapshot baselines)
Parallel:   FID-S02-T01 (iOS motion), FID-S02-T03..T08 (Android variant work)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN PlanningScreen S02 sketch polyline WHEN draw cycles THEN infiniteRepeatable(tween(theme.motion.sketchPolylineLoop.durationMillis, LinearEasing), Restart)", "verify": "./gradlew test" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN PlanningScreen S02 LSPhaseIndicator WHEN drawing phase active THEN leading head-dot composable rendered and alpha oscillates 1.0/0.55 via infiniteRepeatable(tween(theme.motion.breathingHeadDot.durationMillis, EaseInOut), Reverse)", "verify": "./gradlew test" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN SessionsScreen story opens drawer WHEN drawer slides in THEN spring(dampingRatio=0.85f, stiffness=Spring.StiffnessMedium) used not tween", "verify": "./gradlew test" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN RouteResultsScreen S01 with three polylines WHEN draw with 120ms stagger THEN each polyline progress driven by Animatable.animateTo with tween from theme.motion.polylineDrawOn not manual repeat-delay loop", "verify": "./gradlew test" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSTopBar record-highlight story WHEN record dot visible THEN alpha oscillates 1.0/0.45 via infiniteRepeatable(tween(theme.motion.recordDotPulse.durationMillis, EaseInOut), Reverse) not stub comment", "verify": "./gradlew test" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSInlineErrorCallout suggestions or RouteResults refining primer chips WHEN row first composes THEN each chip enters via AnimatedVisibility(slideInVertically + fadeIn) reading theme.motion.chatOverlayEnter", "verify": "./gradlew test" },
    { "id": "TC-1", "type": "test_criterion", "description": "Sketch polyline animation spec equals tween(theme.motion.sketchPolylineLoop.durationMillis, LinearEasing) wrapped in infiniteRepeatable Restart", "maps_to_ac": "AC-1", "verify": "./gradlew test --tests '*.MotionTests.testSketchPolylineLoop1400Linear'" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSPhaseIndicator includes head-dot composable and its breathing animation reads breathingHeadDot duration with Reverse repeat", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.MotionTests.testBreathingHeadDot1400Compose'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Drawer slide animationSpec is spring(dampingRatio=0.85f, stiffness=StiffnessMedium)", "maps_to_ac": "AC-3", "verify": "./gradlew test --tests '*.MotionTests.testDrawerSlideSpring'" },
    { "id": "TC-4", "type": "test_criterion", "description": "RouteResults polyline progress driven by Animatable.animateTo and no delay() loop remains in screen file", "maps_to_ac": "AC-4", "verify": "./gradlew test --tests '*.MotionTests.testPolylineDrawAnimatable'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Record dot animation spec equals tween(theme.motion.recordDotPulse.durationMillis, EaseInOut) Reverse", "maps_to_ac": "AC-5", "verify": "./gradlew test --tests '*.MotionTests.testRecordDotPulse1400'" },
    { "id": "TC-6", "type": "test_criterion", "description": "Suggestion chip composition uses AnimatedVisibility with slideInVertically + fadeIn enter transitions", "maps_to_ac": "AC-6", "verify": "./gradlew test --tests '*.MotionTests.testChatOverlayEnterChips'" }
  ]
}
-->
