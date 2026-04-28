================================================================================
TASK: FID-S01-T12 - Android Implementation Fixes (Shadow, Token, TimeRange, Tap Target)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew :app:testDebugUnitTest

PROGRESS: AC-1..AC-4 not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence, ≤30 words — observable success)
--------------------------------------------------------------------------------

Android sessions drawer uses real shadow, correct surface.card token, proper timeRange parameter, and minimumInteractiveComponentSize for tap targets.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER leave "simplified" or "in production" comments — ship real implementations
- MUST use `Modifier.minimumInteractiveComponentSize()` or `Modifier.minimumInteractiveComponentSize(48.dp)` for tap targets — NOT padding workarounds
- MUST use `surface.card` semantic token, NOT `card.default`
- STRICTLY preserve existing layout — only fix the specific issues below

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] trailingShadow() implements real directional shadow, no "simplified" comments (AC-1)
- [ ] LSSessionsDrawer uses surface.card token (not card.default) (AC-2)
- [ ] LSRouteSheet accepts timeRange: Pair<String,String> parameter (AC-3)
- [ ] LSTopBar hamburger uses minimumInteractiveComponentSize for 48dp tap target (AC-4)
- [ ] Android build passes: `./gradlew :app:compileDebugKotlin` exits 0

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Real directional shadow implementation
  GIVEN: LSSessionsDrawer renders on screen
  WHEN:  The trailing shadow draws
  THEN:  Shadow uses proper Compose shadow API (Modifier.shadow or graphicsLayer with shadow) producing directional 2px offset, 16px blur — no "simplified" rectangle drawing

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: test_drawerShadowTier

AC-2: surface.card semantic token
  GIVEN: LSSessionsDrawer renders its background
  WHEN:  Background color is resolved
  THEN:  Uses `theme.colors.surface.card` semantic token, NOT `theme.colors.card.default`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: test_drawerSolidBackground

AC-3: LSRouteSheet timeRange parameter
  GIVEN: LSRouteSheet composable is called
  WHEN:  Weather timeline renders the time range header
  THEN:  timeRange is accepted as `Pair<String, String>` parameter (from/to) derived from external data, not inline `weatherTimeline.firstOrNull()?.hour`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt
  TEST_FUNCTION: test_routeSheetWeatherTimeline_usesDynamicTimeRange

AC-4: minimumInteractiveComponentSize for tap target
  GIVEN: LSTopBar hamburger button is rendered
  WHEN:  User taps within 48dp×48dp area
  THEN:  Tap is registered via `Modifier.minimumInteractiveComponentSize()` (not padding workaround)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: test_hamburger48dpTapTarget

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY — shadow, token)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt (MODIFY — timeRange param)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt (MODIFY — tap target)
- android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt (MODIFY — update assertions)
- android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt (MODIFY — update assertions)

writeProhibited:
- ios/**
- server/**
- react-native/**

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- LSSessionsDrawer.kt: Replace trailingShadow() stub with real Compose shadow; fix surface.card token
- LSRouteSheet.kt: Add `timeRange: Pair<String, String>` parameter, use it instead of inline derivation
- LSTopBar.kt: Replace `.padding(4.dp)` with `Modifier.minimumInteractiveComponentSize()`
- Updated test assertions

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

## AC-1: Real shadow

Current state (LSSessionsDrawer.kt:63-75):
```kotlin
// Simplified shadow - just draw a colored rect on the right edge
```
This is an explicit stub with a comment admitting it.

Fix: Use `Modifier.shadow(elevation = X.dp, shape = ..., clip = false)` or `graphicsLayer { shadowElevation = ... }`.
For a directional (one-sided) shadow, use `Modifier.drawWithContent { drawContent(); drawRect(shadowColor, offset = Offset(2f, 0f), ...) }` with proper blur.
Alternatively, use a thin `Box` with gradient background for a directional shadow effect.
The key: NO "simplified" comments, NO "in production" comments. Ship real code.

### RED: Test asserts source does NOT contain "simplified" or "in production"
### GREEN: Implement real shadow
### REFACTOR: Clean up

## AC-2: surface.card token

Current state (LSSessionsDrawer.kt:135):
```kotlin
.background(theme.colors.card.default)
```

Fix: Replace with `theme.colors.surface.card`. Check that this token exists in the theme.
If `surface.card` doesn't exist, create it or find the correct semantic equivalent.

### RED: Test asserts source contains "surface.card", NOT "card.default"
### GREEN: Replace token
### REFACTOR: Clean up

## AC-3: timeRange parameter

Current state (LSRouteSheet.kt:145-146):
```kotlin
from = weatherTimeline.firstOrNull()?.hour ?: "",
to = weatherTimeline.lastOrNull()?.hour ?: "",
```

Fix: Add `timeRange: Pair<String, String>` parameter to LSRouteSheet composable.
Use `timeRange.first` and `timeRange.second` for from/to in the weather timeline header.
Keep weatherTimeline as a separate parameter for the per-hour entries.

### RED: Test asserts LSRouteSheet signature contains `timeRange: Pair<String, String>`
### GREEN: Add parameter, wire it up
### REFACTOR: Clean up

## AC-4: minimumInteractiveComponentSize

Current state (LSTopBar.kt:169-172):
```kotlin
// AC-4: Ensure tap target is ≥48dp by adding padding to the 40dp visual
// 48dp - 40dp = 8dp, so 4dp padding on each side
.padding(4.dp) // Increase tap target to 48dp (40 + 4 + 4)
```

Fix: Replace padding workaround with `Modifier.minimumInteractiveComponentSize()`.
This is the idiomatic Compose way to ensure Material 3 minimum touch targets.
Keep visual size at current chip size — minimumInteractiveComponentSize only expands the interaction area.

### RED: Test asserts source contains "minimumInteractiveComponentSize", NOT "padding(4.dp)" for tap target
### GREEN: Replace padding with proper modifier
### REFACTOR: Remove workaround comments

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt [MODIFY]
   - Lines: 63-90 (shadow stub), 115-140 (token + background)
   - Focus: trailingShadow() stub, card.default → surface.card

2. android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt [MODIFY]
   - Lines: 60-80 (function signature), 144-146 (inline time derivation)
   - Focus: Add timeRange: Pair<String,String> parameter

3. android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt [MODIFY]
   - Lines: 159-175 (hamburger chip + tap target)
   - Focus: Replace .padding(4.dp) with minimumInteractiveComponentSize

4. android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt [MODIFY]
   - Lines: all
   - Focus: Update assertions for new token and shadow

5. android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt [MODIFY]
   - Lines: test_routeSheetWeatherTimeline_usesDynamicTimeRange
   - Focus: Update for new timeRange parameter

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: No shadow stub
  Command: grep -c 'simplified\|in production' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt
  Expected: 0 matches

Gate 2: surface.card token
  Command: grep 'surface.card\|card.default' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt
  Expected: Contains surface.card, NOT card.default

Gate 3: timeRange parameter
  Command: grep 'timeRange.*Pair' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt
  Expected: At least 1 match

Gate 4: minimumInteractiveComponentSize
  Command: grep 'minimumInteractiveComponentSize' android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt
  Expected: At least 1 match

Gate 5: Build passes
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T06, FID-S01-T07, FID-S01-T08 (original implementations)
Blocks:     FID-S01-T09 (verification)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSSessionsDrawer renders WHEN trailing shadow draws THEN uses proper Compose shadow API with no simplified stub comments", "verify": "! grep -q 'simplified' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSSessionsDrawer renders background WHEN color resolved THEN uses surface.card semantic token not card.default", "verify": "grep 'surface.card' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSRouteSheet composable called WHEN time range header renders THEN timeRange accepted as Pair<String,String> parameter", "verify": "grep 'timeRange.*Pair' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSTopBar hamburger rendered WHEN user taps within 48dp area THEN tap registered via minimumInteractiveComponentSize", "verify": "grep 'minimumInteractiveComponentSize' android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSSessionsDrawer.kt has zero occurrences of simplified or in production comments", "maps_to_ac": "AC-1", "verify": "! grep -q 'simplified\\|in production' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSSessionsDrawer.kt uses surface.card token in background modifier", "maps_to_ac": "AC-2", "verify": "grep 'surface.card' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSRouteSheet.kt function signature contains timeRange Pair parameter", "maps_to_ac": "AC-3", "verify": "grep 'timeRange.*Pair' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSTopBar.kt uses minimumInteractiveComponentSize instead of padding workaround", "maps_to_ac": "AC-4", "verify": "grep 'minimumInteractiveComponentSize' android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt" },
    { "id": "TC-5", "type": "test_criterion", "description": "Android project compiles after all changes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:compileDebugKotlin" }
  ]
}
-->
