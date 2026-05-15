================================================================================
TASK: FID-S01-T02 - iOS Map Slot Replacement (LinearGradient → Paper Substrate)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint: swiftformat --lint {files}
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-5 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

IdleScreen, PlanningScreen, and ErrorScreen show a paper-substrate map with contour SVGs and favorite pin overlays instead of a two-color LinearGradient placeholder.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- NEVER use `LinearGradient` as a map placeholder — this IS the map distortion
- MUST use `theme.colors.map.paper` substrate color + SVG contour overlays
- MUST render contour lines at `map.contour` (0.9pt) and `map.contourFaint` (0.7pt) stroke widths
- STRICTLY keep sandbox-only: use static paper + SVGs, NOT live Mapbox (that's integration sprint)
- MUST place favorite pin dots at absolute positions using `signal.default` fill + `surface.card` border

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] IdleScreen map slot renders paper substrate + contour SVGs + favorite pins (AC-1 PRIMARY)
- [ ] PlanningScreen map slot renders paper substrate + contour SVGs (AC-2)
- [ ] ErrorScreen map slot renders paper substrate with broken-segment polyline overlay (AC-3)
- [ ] Paper substrate resolves correctly in dark mode (map.paper → ink-900) (AC-4)
- [ ] Favorite pin dots render at correct size with correct styling (AC-5)
- [ ] `cd ios && xcodebuild build` passes + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: IdleScreen map slot paper substrate + contours + pins [PRIMARY]
  GIVEN: IdleScreen is displayed in sandbox on iOS Simulator
  WHEN:  The map slot area renders
  THEN:  Background is `theme.colors.map.paper` (warm copper tint) with SVG contour grid lines at 0.9pt/0.7pt and copper pin dots at absolute positions

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: testIdleScreenPaperSubstrateWithContours

AC-2: PlanningScreen map slot paper substrate
  GIVEN: PlanningScreen is displayed in sandbox on iOS Simulator
  WHEN:  The map slot area renders
  THEN:  Background is `theme.colors.map.paper` with contour lines (no LinearGradient)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: testPlanningScreenPaperSubstrate

AC-3: ErrorScreen map slot with broken polyline overlay
  GIVEN: ErrorScreen is displayed in sandbox on iOS Simulator
  WHEN:  The map slot area renders
  THEN:  Background is `theme.colors.map.paper` with a dashed `status.error` broken-segment polyline overlay + origin/destination pins

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: testErrorScreenBrokenPolylineOverlay

AC-4: Dark mode map substrate
  GIVEN: Device is in dark mode
  WHEN:  Any screen's map slot renders
  THEN:  `theme.colors.map.paper` resolves to dark ink-900 substrate with inverted contours

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: testDarkModeMapSubstrate

AC-5: Favorite pin overlay rendering
  GIVEN: IdleScreen with favorite locations in mock data
  WHEN:  Map slot renders
  THEN:  Copper-filled circle pins (16pt) with `stroke.lg` card-colored border appear at correct positions

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: testFavoritePinOverlay

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Screens/IdleScreen.swift (MODIFY)
- ios/LaneShadow/Views/Screens/PlanningScreen.swift (MODIFY)
- ios/LaneShadow/Views/Screens/ErrorScreen.swift (MODIFY)
- ios/LaneShadow/Views/Organisms/LSMapLayer.swift (MODIFY)
- ios/LaneShadow/Views/Molecules/LSPaperMap.swift (NEW — paper substrate + contour component)
- ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift (NEW — pin overlay)
- ios/LaneShadowTests/Sandbox/MapSlotTests.swift (NEW)

writeProhibited:
- android/** — iOS-specific
- server/** — no backend changes
- react-native/** — read-only reference

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use theme color tokens for all map colors
- Create reusable LSPaperMap component for shared substrate + contour rendering
- Verify in sandbox after each screen change

⚠️ Ask First:
- Creating new molecule components beyond LSPaperMap and LSFavoritePinDot
- Changing any map-layer organism API surface

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Molecules/LSPaperMap.swift (NEW): Reusable paper substrate + contour SVG component
- ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift (NEW): Pin overlay component
- ios/LaneShadow/Views/Screens/IdleScreen.swift (MODIFY): Replace LinearGradient with LSPaperMap + pins
- ios/LaneShadow/Views/Screens/PlanningScreen.swift (MODIFY): Replace LinearGradient with LSPaperMap
- ios/LaneShadow/Views/Screens/ErrorScreen.swift (MODIFY): Replace LinearGradient with LSPaperMap + broken polyline

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR for each AC. Create LSPaperMap molecule first (used by all screens), then wire into each screen. Test in sandbox after each screen change.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/organisms/map-layer/map-layer.html [PRIMARY PATTERN]
   - Focus: Paper substrate color, contour line specs, pin dot styling

2. ios/LaneShadow/Views/Screens/IdleScreen.swift
   - Focus: Current LinearGradient placeholder implementation

3. .spec/design/system/views/mapapp/idle/idle-screen.html
   - Sections: map slot, favorite pins
   - Focus: Visual reference for paper map with pins

4. ios/LaneShadow/Views/Organisms/LSMapLayer.swift
   - Focus: Existing map organism API — understand what this task does NOT touch

5. .spec/prds/v3-integration/remediations/01-views-idle-planning.md
   - Sections: Gap B-01 (map slot), Gap C-01 (weather overlays on planning)
   - Focus: Detailed gap descriptions

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE shows each test red before green
Gate 2: Each AC has a test in MapSlotTests.swift
Gate 3: xcodebuild test passes
Gate 4: xcodebuild build exits 0
Gate 5: scripts/tokens/enforce-native-compliance.sh exits 0
Gate 6: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Live Mapbox integration (integration sprint)
- PlanningScreen sketch polyline animation timing (Sprint 02)
- ErrorScreen weather/variant states (Sprint 02)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** IdleScreen, PlanningScreen, ErrorScreen use `LinearGradient(colors: [surface.default, background.default])` with `Text("Map Layer")` overlay.
**Gap:** Design specifies warm copper-tinted paper canvas with SVG contour grid lines and absolute-positioned favorite pin dots.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass:
- One test per AC; tests verify paper substrate + contour rendering
- RED evidence present in TDD_STATE history
- LSPaperMap is a reusable molecule, not duplicated per screen
- Theme tokens used for all colors (no hardcoded values)
- SCOPE respected

Should verify:
- Dark mode paper substrate resolves to ink-900
- Contour SVGs render at correct 0.9pt/0.7pt stroke widths
- Pin dots are 16pt with correct border styling

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None
Blocks:     FID-S01-T09
Parallel:   FID-S01-T01, FID-S01-T03, FID-S01-T04, FID-S01-T05, FID-S01-T06, FID-S01-T07

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN IdleScreen displayed WHEN map slot renders THEN background is map.paper with contour SVGs and favorite pin dots", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN PlanningScreen displayed WHEN map slot renders THEN background is map.paper with contour lines, no LinearGradient", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN ErrorScreen displayed WHEN map slot renders THEN background is map.paper with dashed status.error broken polyline + pins", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN dark mode WHEN map slot renders THEN map.paper resolves to dark ink-900 with inverted contours", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN IdleScreen with favorites WHEN map renders THEN 16pt copper pins with stroke.lg border at correct positions", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "IdleScreen map background color matches theme.colors.map.paper token", "maps_to_ac": "AC-1", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/MapSlotTests/testIdleScreenPaperSubstrateWithContours" },
    { "id": "TC-2", "type": "test_criterion", "description": "PlanningScreen contains no LinearGradient in map slot", "maps_to_ac": "AC-2", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/MapSlotTests/testPlanningScreenPaperSubstrate" },
    { "id": "TC-3", "type": "test_criterion", "description": "ErrorScreen map has dashed polyline overlay in status.error color", "maps_to_ac": "AC-3", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/MapSlotTests/testErrorScreenBrokenPolylineOverlay" },
    { "id": "TC-4", "type": "test_criterion", "description": "Dark mode map.paper resolves to ink-900 substrate", "maps_to_ac": "AC-4", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/MapSlotTests/testDarkModeMapSubstrate" },
    { "id": "TC-5", "type": "test_criterion", "description": "Favorite pins are 16pt with signal.default fill and surface.card border", "maps_to_ac": "AC-5", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/MapSlotTests/testFavoritePinOverlay" }
  ]
}
-->
