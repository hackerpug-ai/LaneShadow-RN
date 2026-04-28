================================================================================
TASK: FID-S01-T05 - iOS Sessions Drawer Container Fix + Token Corrections
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-5 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS SessionsDrawer uses solid surface.card background (not glass), active stripe at stroke.lg, active row in signal.whisper, hamburger at 44pt tap target, and correct drawer shadow tier.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace `LSGlassPanel.chrome` wrapper with solid `surface.card` background + `--elev-overlay` shadow + 1pt right-edge separator
- MUST set active-row left stripe to `theme.strokeWidth.lg` (2pt) — NOT 3pt hardcoded
- MUST use `theme.colors.signal.whisper` for active-row background — NOT raw alpha on signal.default
- MUST set hamburger button tap target ≥44pt via `.contentShape(Rectangle())` while keeping visual at 40pt
- NEVER use glass-panel backdrop blur for sessions drawer — this IS the container distortion

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] SessionsDrawer background is solid surface.card (not glass-panel translucent) (AC-1 PRIMARY)
- [ ] Active-row left stripe is stroke.lg (2pt, not 3pt) (AC-2)
- [ ] Active-row background uses signal.whisper semantic token (AC-3)
- [ ] Hamburger tap target ≥44pt with visual chip at 40pt (AC-4)
- [ ] Drawer shadow uses correct elevation tier (AC-5)
- [ ] xcodebuild build passes + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Solid container background [PRIMARY]
  GIVEN: SessionsDrawer is displayed in sandbox on iOS Simulator
  WHEN:  The drawer container renders
  THEN:  Background is opaque `surface.card` with no map content visible behind drawer text

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift
  TEST_FUNCTION: testDrawerSolidBackground

AC-2: Active stripe stroke.lg
  GIVEN: SessionsDrawer with an active session row
  WHEN:  The left stripe renders
  THEN:  Stripe width is exactly `theme.strokeWidth.lg` (2pt), not 3pt hardcoded

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift
  TEST_FUNCTION: testActiveStripeStrokeLg

AC-3: Active row signal.whisper background
  GIVEN: SessionsDrawer with an active session row
  WHEN:  The row background renders in light and dark mode
  THEN:  Background uses `theme.colors.signal.whisper` (auto-resolves to copper-100 light / rgba copper dark)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift
  TEST_FUNCTION: testActiveRowSignalWhisper

AC-4: Hamburger 44pt tap target
  GIVEN: SessionsScreen with hamburger button visible
  WHEN:  The hamburger chip renders at 40pt visual size
  THEN:  Tap target area is ≥44pt via `.contentShape(Rectangle())`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift
  TEST_FUNCTION: testHamburger44ptTapTarget

AC-5: Drawer shadow tier
  GIVEN: SessionsDrawer is displayed in sandbox
  WHEN:  The drawer trailing edge renders
  THEN:  Shadow is `2px 0 16px rgba(34,24,16,0.14)` on light theme and `2px 0 16px rgba(0,0,0,0.60)` on dark theme

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift
  TEST_FUNCTION: testDrawerShadowTier

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift (MODIFY)
- ios/LaneShadow/Views/Molecules/AppHeader.swift (MODIFY — hamburger tap target)
- ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift (NEW)

writeProhibited:
- android/**, server/**, react-native/**, any file not listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift (MODIFY): Solid background, 2pt stripe, signal.whisper, shadow
- ios/LaneShadow/Views/Molecules/AppHeader.swift (MODIFY): Hamburger 44pt tap target via contentShape

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/organisms/sessions-drawer/sessions-drawer.html [PRIMARY PATTERN]
   - Focus: Solid container, active stripe, signal.whisper, shadow spec

2. ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift
   - Focus: Current LSGlassPanel.chrome wrapper, hardcoded 3pt stripe, raw alpha background

3. .spec/prds/v3-integration/remediations/03-views-sessions-error.md
   - Sections: Gap C-01 through C-07, Gap D1-06

4. ios/LaneShadow/Views/Molecules/AppHeader.swift
   - Focus: Hamburger button implementation and tap target

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED evidence in TDD_STATE
Gate 2: One test per AC
Gate 3: xcodebuild test exits 0
Gate 4: xcodebuild build exits 0
Gate 5: native-compliance exits 0
Gate 6: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- SessionsDrawer date grouping (Sprint 02)
- SessionsDrawer sections parameter (Sprint 02)
- Third meta-row line variant dots (Sprint 02)
- Session row content-sizing (Sprint 02)
- Android drawer fix (FID-S01-T06)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** iOS LSSessionsDrawer wraps content in LSGlassPanel.chrome — translucent glass that lets map content bleed through. Active stripe is 3pt hardcoded, active row uses raw alpha on signal.default, hamburger has no explicit tap target, shadow uses wrong elevation tier.
**Gap:** Design specifies solid opaque container, 2pt stripe, semantic signal.whisper, 44pt tap target, directional shadow.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None
Blocks:     FID-S01-T09
Parallel:   All other Sprint 01 tasks

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN SessionsDrawer displayed WHEN container renders THEN background is opaque surface.card with no map content visible behind text", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN active session row WHEN left stripe renders THEN width is exactly theme.strokeWidth.lg (2pt) not 3pt", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN active session row in light/dark WHEN background renders THEN uses theme.colors.signal.whisper token", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN hamburger button WHEN chip renders at 40pt visual THEN tap target is ≥44pt via contentShape", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN SessionsDrawer WHEN trailing edge renders THEN directional shadow matches spec in light and dark", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "Drawer background color equals theme.colors.surface.card token", "maps_to_ac": "AC-1", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/SessionsDrawerTests/testDrawerSolidBackground" },
    { "id": "TC-2", "type": "test_criterion", "description": "Active stripe width equals theme.strokeWidth.lg (2pt)", "maps_to_ac": "AC-2", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/SessionsDrawerTests/testActiveStripeStrokeLg" },
    { "id": "TC-3", "type": "test_criterion", "description": "Active row background color resolves to signal.whisper in both themes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/SessionsDrawerTests/testActiveRowSignalWhisper" },
    { "id": "TC-4", "type": "test_criterion", "description": "Hamburger tap target area ≥44pt", "maps_to_ac": "AC-4", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/SessionsDrawerTests/testHamburger44ptTapTarget" },
    { "id": "TC-5", "type": "test_criterion", "description": "Drawer shadow matches 2px 0 16px spec", "maps_to_ac": "AC-5", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/SessionsDrawerTests/testDrawerShadowTier" }
  ]
}
-->
