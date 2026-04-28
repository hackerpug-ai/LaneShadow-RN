================================================================================
TASK: FID-S01-T11 - iOS Implementation Fixes (Hamburger, Map Token, Hardcoded Sizes)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'

PROGRESS: AC-1..AC-3 not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence, ≤30 words — observable success)
--------------------------------------------------------------------------------

Hamburger tap target ≥44pt, LSPaperMap uses correct map.paper token, and pin/dot sizes use theme tokens instead of hardcoded CGFloats.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER hardcode pixel values when theme tokens exist
- MUST use `.contentShape(Rectangle())` combined with a ≥44pt frame for hamburger tap target (iOS HIG minimum)
- MUST keep visual chip at current size — only expand the invisible tap target
- STRICTLY preserve existing layout and spacing — only change the tap target area and token references

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Hamburger tap target ≥44pt (visual stays at current size, contentShape expands hit area) (AC-1)
- [ ] LSPaperMap uses map.paper token (or closest semantic equivalent, not surface.default) (AC-2)
- [ ] LSFavoritePinDot and LSScenicDotStrip use theme tokens instead of hardcoded CGFloat sizes (AC-3)
- [ ] iOS build passes + existing tests still pass

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Hamburger tap target ≥44pt
  GIVEN: LSTopBar hamburger button is rendered on screen
  WHEN:  User taps within 44pt×44pt area around the hamburger icon
  THEN:  Tap is registered (contentShape covers ≥44pt×44pt) while visual chip remains at current ~40pt size

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift
  TEST_FUNCTION: testHamburger44ptTapTarget

AC-2: LSPaperMap uses correct map token
  GIVEN: LSPaperMap renders the paper substrate background
  WHEN:  The background color is resolved
  THEN:  Uses `theme.colors.map.paper` (or equivalent semantic map token), NOT `theme.colors.surface.default`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: (add source assertion for map.paper token)

AC-3: Theme tokens replace hardcoded sizes
  GIVEN: LSFavoritePinDot and LSScenicDotStrip render their dot elements
  WHEN:  Dot size is resolved
  THEN:  Size comes from a theme token (e.g., `theme.iconSize.sm` or `theme.space.lg`) instead of hardcoded `CGFloat = 16` / `CGFloat = 8`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MapSlotTests.swift
  TEST_FUNCTION: (add source assertions verifying no hardcoded CGFloat sizes)

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSTopBar.swift (MODIFY — expand tap target)
- ios/LaneShadow/Views/Molecules/LSPaperMap.swift (MODIFY — fix token)
- ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift (MODIFY — theme token)
- ios/LaneShadow/Views/Molecules/LSScenicDotStrip.swift (MODIFY — theme token)
- ios/LaneShadowTests/Sandbox/SessionsDrawerTests.swift (MODIFY — update assertions)
- ios/LaneShadowTests/Sandbox/MapSlotTests.swift (MODIFY — add assertions)

writeProhibited:
- ios/LaneShadow/Views/Screens/** (no screen changes)
- android/**
- server/**

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- LSTopBar.swift: Expand hamburger tap target to ≥44pt via frame + contentShape (visual stays same)
- LSPaperMap.swift: Replace `surface.default` with `map.paper` semantic token
- LSFavoritePinDot.swift: Replace `CGFloat = 16` with theme token
- LSScenicDotStrip.swift: Replace `CGFloat = 8` with theme token
- Updated test assertions to verify the fixes

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

## AC-1: Hamburger tap target

Current state (LSTopBar.swift:119-121):
```swift
private var chipSize: CGFloat {
    theme.space.xl + theme.space.md + theme.space.xs // 24 + 12 + 4 = 40
}
```

Fix: Keep chipSize at 40pt for visual. Add a separate `tapTargetSize: CGFloat` that is ≥44pt.
Apply `.frame(width: tapTargetSize, height: tapTargetSize)` BEFORE `.contentShape(Rectangle())`.
The visual chip stays at 40pt inside the 44pt tap area.

### RED: Write test asserting tapTarget ≥44pt in source
### GREEN: Add tapTargetSize computed property, apply to hamburger button
### REFACTOR: Clean up if needed

## AC-2: Map paper token

Current state (LSPaperMap.swift:54-55):
```swift
// Use surface.default as paper substrate (closest to map.paper token)
theme.colors.surface.default
```

Fix: Check if `theme.colors.map.paper` exists. If not, check for `theme.colors.map?.paper` or equivalent.
If no map.paper token exists in the theme, ADD it to the theme's color definitions and use it.
The comment explicitly acknowledges the wrong token — fix it.

### RED: Write test asserting source does NOT contain "surface.default" in LSPaperMap
### GREEN: Replace with correct token
### REFACTOR: Remove the workaround comment

## AC-3: Hardcoded sizes

Current state:
- LSFavoritePinDot.swift:11: `private let pinSize: CGFloat = 16`
- LSScenicDotStrip.swift: ~line 20: hardcoded `8` for dot size

Fix: Replace with theme tokens. Check `theme.iconSize` or `theme.space` for appropriate values.

### RED: Write tests asserting no hardcoded CGFloat in these files
### GREEN: Replace with theme tokens
### REFACTOR: Clean up

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Organisms/LSTopBar.swift [MODIFY]
   - Lines: 60-125
   - Focus: chipSize computation, hamburger button layout, contentShape usage

2. ios/LaneShadow/Views/Molecules/LSPaperMap.swift [MODIFY]
   - Lines: 53-56
   - Focus: paperSubstrate computed property — wrong token

3. ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift [MODIFY]
   - Lines: all (small file ~41 lines)
   - Focus: Hardcoded pinSize = 16

4. ios/LaneShadow/Views/Molecules/LSScenicDotStrip.swift [MODIFY]
   - Lines: all (small file ~62 lines)
   - Focus: Hardcoded dot size

5. ios/LaneShadow/Theme/LSTheme.swift [REFERENCE]
   - Lines: all
   - Focus: Available size tokens (iconSize, space, etc.) and color tokens (map.paper)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Tap target ≥44pt
  Command: grep '44\|tapTarget\|contentShape' ios/LaneShadow/Views/Organisms/LSTopBar.swift
  Expected: Contains tapTargetSize ≥44pt or equivalent

Gate 2: Map paper token
  Command: grep 'surface.default' ios/LaneShadow/Views/Molecules/LSPaperMap.swift
  Expected: Zero matches (was the wrong token)

Gate 3: No hardcoded CGFloat sizes
  Command: grep -c 'CGFloat = ' ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift ios/LaneShadow/Views/Molecules/LSScenicDotStrip.swift
  Expected: 0 matches

Gate 4: Build + tests pass
  Command: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T02, FID-S01-T04, FID-S01-T05 (original implementations)
Blocks:     FID-S01-T09 (verification)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSTopBar hamburger rendered WHEN user taps within 44pt×44pt area THEN tap is registered while visual chip stays at ~40pt", "verify": "grep '44\\|tapTarget' ios/LaneShadow/Views/Organisms/LSTopBar.swift" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSPaperMap renders paper substrate WHEN background color resolved THEN uses map.paper semantic token not surface.default", "verify": "! grep -q 'surface.default' ios/LaneShadow/Views/Molecules/LSPaperMap.swift" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSFavoritePinDot and LSScenicDotStrip render WHEN dot size resolved THEN size from theme token not hardcoded CGFloat", "verify": "! grep -q 'CGFloat = ' ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift ios/LaneShadow/Views/Molecules/LSScenicDotStrip.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSTopBar.swift defines tapTargetSize ≥44pt separate from chipSize", "maps_to_ac": "AC-1", "verify": "grep 'tapTargetSize\\|44' ios/LaneShadow/Views/Organisms/LSTopBar.swift" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSPaperMap.swift uses map.paper or equivalent map-specific token", "maps_to_ac": "AC-2", "verify": "grep 'map' ios/LaneShadow/Views/Molecules/LSPaperMap.swift" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSFavoritePinDot.swift has no hardcoded CGFloat literal for pin size", "maps_to_ac": "AC-3", "verify": "! grep -q 'CGFloat = 16' ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift" },
    { "id": "TC-4", "type": "test_criterion", "description": "iOS build and tests pass after changes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" }
  ]
}
-->
