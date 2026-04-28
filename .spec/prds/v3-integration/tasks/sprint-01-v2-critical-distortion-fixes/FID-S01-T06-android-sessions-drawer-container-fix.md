================================================================================
TASK: FID-S01-T06 - Android Sessions Drawer Container Fix + Token Corrections
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-5 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android LSSessionsDrawer uses solid surface.card background (not glass), active stripe at stroke.lg, active row in signal.whisper, hamburger at 48dp tap target, and correct drawer shadow tier.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace `LSGlassPanel.Chrome` wrapper with solid `surface.card` background + directional shadow + 1dp right-edge separator
- MUST set active-row left stripe to `GeneratedTokens.sizing.stroke.lg` (2dp) — NOT `theme.space.xs` or hardcoded 3dp
- MUST use `theme.colors.signal.whisper` for active-row background — NOT raw alpha on `Signal.default`
- MUST set hamburger button tap target ≥48dp via `Modifier.minimumTouchTargetSize()` while keeping visual at 40dp
- NEVER use glass-panel backdrop blur for sessions drawer — this IS the container distortion

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] SessionsDrawer background is solid surface.card (not glass-panel translucent) (AC-1 PRIMARY)
- [ ] Active-row left stripe is stroke.lg (2dp, not theme.space.xs) (AC-2)
- [ ] Active-row background uses signal.whisper semantic token (AC-3)
- [ ] Hamburger tap target ≥48dp with visual chip at 40dp (AC-4)
- [ ] Drawer shadow uses correct directional tier 2px 0 16px (AC-5)
- [ ] ./gradlew :app:compileDebugKotlin passes + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Solid container background [PRIMARY]
  GIVEN: LSSessionsDrawer is displayed in sandbox on Android Emulator
  WHEN:  The drawer container renders
  THEN:  Background is opaque `surface.card` with no map content visible behind drawer text

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: testDrawerSolidBackground

AC-2: Active stripe stroke.lg
  GIVEN: LSSessionsDrawer with an active session row
  WHEN:  The left stripe renders
  THEN:  Stripe width is exactly `GeneratedTokens.sizing.stroke.lg` (2dp), not `theme.space.xs`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: testActiveStripeStrokeLg

AC-3: Active row signal.whisper background
  GIVEN: LSSessionsDrawer with an active session row
  WHEN:  The row background renders in light and dark mode
  THEN:  Background uses `theme.colors.signal.whisper` (auto-resolves to copper-100 light / rgba copper dark)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: testActiveRowSignalWhisper

AC-4: Hamburger 48dp tap target
  GIVEN: SessionsScreen with hamburger button visible
  WHEN:  The hamburger chip renders at 40dp visual size
  THEN:  Tap target area is ≥48dp via `Modifier.minimumTouchTargetSize()`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: testHamburger48dpTapTarget

AC-5: Drawer shadow tier
  GIVEN: LSSessionsDrawer is displayed in sandbox
  WHEN:  The drawer trailing edge renders
  THEN:  Shadow is `2px 0 16px rgba(34,24,16,0.14)` on light theme and `2px 0 16px rgba(0,0,0,0.60)` on dark theme

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt
  TEST_FUNCTION: testDrawerShadowTier

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY)
- android/app/src/main/java/com/laneshadow/ui/molecules/AppHeader.kt (MODIFY — hamburger tap target)
- android/app/src/test/java/com/laneshadow/sandbox/SessionsDrawerTests.kt (NEW)

writeProhibited:
- ios/**, server/**, react-native/**, any file not listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY): Solid background, 2dp stripe, signal.whisper, directional shadow
- android/app/src/main/java/com/laneshadow/ui/molecules/AppHeader.kt (MODIFY): Hamburger 48dp tap target via minimumTouchTargetSize

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/organisms/sessions-drawer/sessions-drawer.html [PRIMARY PATTERN]
   - Focus: Solid container, active stripe, signal.whisper, shadow spec

2. android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt
   - Focus: Current LSGlassPanel.Chrome wrapper, theme.space.xs stripe, raw alpha background, no shadow

3. .spec/prds/v3-integration/remediations/03-views-sessions-error.md
   - Sections: Gap C1-03, C1-04, D1-06

4. android/app/src/main/java/com/laneshadow/ui/molecules/AppHeader.kt
   - Focus: Hamburger button implementation and tap target

5. android/app/src/main/java/com/laneshadow/theme/GeneratedTokens.kt
   - Focus: Token definitions for stroke.lg, signal.whisper, surface.card

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED evidence in TDD_STATE
Gate 2: One test per AC
Gate 3: ./gradlew test exits 0
Gate 4: ./gradlew :app:compileDebugKotlin exits 0
Gate 5: native-compliance exits 0
Gate 6: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- SessionsDrawer date grouping (Sprint 02)
- SessionsDrawer sections parameter (Sprint 02)
- Third meta-row line variant dots (Sprint 02)
- Session row content-sizing (Sprint 02)
- iOS drawer fix (FID-S01-T05)
- "Rides" header typography fix (included in T01)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Android LSSessionsDrawer wraps content in LSGlassPanel.Chrome — translucent glass that lets map content bleed through. Active stripe uses `theme.space.xs` (wrong token), active row uses raw alpha on Signal.default, hamburger hardcodes 40.dp with no minimumTouchTargetSize, no shadow applied at all.
**Gap:** Design specifies solid opaque container, 2dp stripe via stroke.lg, semantic signal.whisper, 48dp tap target, directional shadow.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T07 (Android build blockers — Session data class declaration)
Blocks:     FID-S01-T09
Parallel:   FID-S01-T01..T05, FID-S01-T08

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSSessionsDrawer displayed WHEN container renders THEN background is opaque surface.card with no map content visible behind text", "verify": "./gradlew test" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN active session row WHEN left stripe renders THEN width is exactly GeneratedTokens.sizing.stroke.lg (2dp) not theme.space.xs", "verify": "./gradlew test" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN active session row in light/dark WHEN background renders THEN uses theme.colors.signal.whisper token", "verify": "./gradlew test" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN hamburger button WHEN chip renders at 40dp visual THEN tap target is ≥48dp via minimumTouchTargetSize", "verify": "./gradlew test" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSSessionsDrawer WHEN trailing edge renders THEN directional shadow matches spec in light and dark", "verify": "./gradlew test" },
    { "id": "TC-1", "type": "test_criterion", "description": "Drawer background color equals theme.colors.surface.card token", "maps_to_ac": "AC-1", "verify": "./gradlew test --tests '*.SessionsDrawerTests.testDrawerSolidBackground'" },
    { "id": "TC-2", "type": "test_criterion", "description": "Active stripe width equals GeneratedTokens.sizing.stroke.lg (2dp)", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.SessionsDrawerTests.testActiveStripeStrokeLg'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Active row background color resolves to signal.whisper in both themes", "maps_to_ac": "AC-3", "verify": "./gradlew test --tests '*.SessionsDrawerTests.testActiveRowSignalWhisper'" },
    { "id": "TC-4", "type": "test_criterion", "description": "Hamburger tap target area ≥48dp", "maps_to_ac": "AC-4", "verify": "./gradlew test --tests '*.SessionsDrawerTests.testHamburger48dpTapTarget'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Drawer shadow matches 2px 0 16px spec", "maps_to_ac": "AC-5", "verify": "./gradlew test --tests '*.SessionsDrawerTests.testDrawerShadowTier'" }
  ]
}
-->
