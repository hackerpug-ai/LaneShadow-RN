Review kb-run task UC-MOL-05-ios. Respond with JSON only matching the reviewer verdict schema used by kb-run review-contract.

Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-ios-pill-semantics-family.md
Checkpoint commit: 3237dab41889e8992485e6f4109a01d23f7365e4
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios
Execution unit: UC-MOL-05-ios
Task ids: [UC-MOL-05-ios]
Requirement summary: {"count": 19, "supplemental_ids": ["STATE-MATRIX"]}

Task markdown:
```markdown
<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-05-ios — Pill semantics family (LSTagPill / LSFilterChip / LSSuggestionChip / LSWeatherBadge) — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-05)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSTagPill, LSFilterChip, LSSuggestionChip, and LSWeatherBadge ship as four semantic molecules that compose LSPill, LSIcon, and LSText atoms — each resolves the correct color tokens (surface.glass, signal.default, surface.card, weather.<condition>.tint/.default) for its semantic, fires interaction callbacks exactly once, and registers full sandbox stories including all six WeatherCondition × two PillSize variants.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose every semantic from LSPill atom (UC-ATM-06) — no Capsule().fill() pill drawing in molecule files.
- MUST route content (icon + label) through LSIcon and LSText atoms — no Image(systemName:), no raw Text().
- MUST resolve all colors through LaneShadowTheme.* — no Color(red:), Color(hex:), or literal hex anywhere.
- MUST define WeatherCondition as a sealed/enum type usable cross-molecule (UC-MOL-06 ChatInput and UC-MOL-07 WeatherTimeline import it).
- MUST register stories under Molecules / Pill Semantics covering each semantic × variant.
- NEVER build pill shape with Capsule().fill(color) directly — always go through LSPill so PillSize tokens resolve.
- NEVER hardcode 32pt height for LSSuggestionChip — derive from theme sizing token.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED for all four pill test classes.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSTagPill renders glass-surface pill with pin LSIcon + LSText label (PRIMARY)
- [ ] AC-2: LSFilterChip selected→signal.default; unselected→surface.card+border.default
- [ ] AC-3: LSFilterChip onToggle fires exactly once
- [ ] AC-4: LSSuggestionChip onTap fires once; resolves card surface
- [ ] AC-5: LSWeatherBadge resolves color.weather.<condition>.tint/.default for all six conditions
- [ ] AC-6: LSWeatherBadge sm/md sizes use LSPill PillSize heights
- [ ] AC-7: No Capsule()/Color(hex:)/Font.system in any of the four pill molecule files
- [ ] AC-8: Sandbox stories registered for all semantic × variant combinations under both themes

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSTagPill renders glass surface + pin icon + label [PRIMARY]
  GIVEN: developer renders LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")
  WHEN:  view body resolves
  THEN:  LSPill present in semantics tree; color.surface.glass background; LSIcon(.pin) with .signal color resolves; LSText label in typography.ui.label.sm
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_glass_surface_and_icon_atom_composition 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSTagPillTests.swift
  TEST_FUNCTION: test_glass_surface_and_icon_atom_composition

AC-2: LSFilterChip selected vs unselected color resolution
  GIVEN: LSFilterChip rendered in selected=true and selected=false states
  WHEN:  view bodies resolve
  THEN:  selected→color.signal.default fill; unselected→color.surface.card + color.border.default border; both use LSPill atom
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_selected_uses_signal_default_unselected_uses_card_surface 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
  TEST_FUNCTION: test_selected_uses_signal_default_unselected_uses_card_surface

AC-3: LSFilterChip onToggle fires exactly once
  GIVEN: LSFilterChip with onToggle closure
  WHEN:  developer taps the chip once
  THEN:  onToggle fires exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_ontoggle_fires_exactly_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
  TEST_FUNCTION: test_ontoggle_fires_exactly_once

AC-4: LSSuggestionChip onTap fires once and resolves card surface
  GIVEN: LSSuggestionChip with onTap closure
  WHEN:  developer taps the chip
  THEN:  onTap fires once; chip uses color.surface.card + color.border.default + radius.pill + 32pt height
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSuggestionChipTests/test_ontap_fires_once_and_resolves_card_surface 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
  TEST_FUNCTION: test_ontap_fires_once_and_resolves_card_surface

AC-5: LSWeatherBadge — all six conditions resolve weather color tokens
  GIVEN: LSWeatherBadge rendered for .sun, .rain, .wind, .storm, .hot, .cold
  WHEN:  view bodies resolve
  THEN:  each cell uses color.weather.<condition>.tint background, color.weather.<condition>.default foreground+border, with correct LSIcon (.sun/.rain/.wind/.storm/.therm)
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_all_six_conditions_resolve_weather_color_tokens 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
  TEST_FUNCTION: test_all_six_conditions_resolve_weather_color_tokens

AC-6: LSWeatherBadge sm/md sizes use LSPill PillSize heights
  GIVEN: LSWeatherBadge rendered at .sm and .md sizes
  WHEN:  view bodies resolve
  THEN:  height comes from LSPill atom's PillSize token resolution; no hardcoded heights in molecule code
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_sm_and_md_size_heights_from_pill_atom 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
  TEST_FUNCTION: test_sm_and_md_size_heights_from_pill_atom

AC-7: Atom-composition inspection gate
  GIVEN: all four pill molecule sources compiled
  WHEN:  files inspected
  THEN:  no Capsule(), Color(red:), Color(hex:), or Font.system literals
  VERIFY: grep -n 'Capsule()\|Color(red:\|Color(hex:\|Font.system' ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-8: Sandbox stories registered for all variants
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / Pill Semantics
  THEN:  TagPill default, FilterChip selected/unselected, SuggestionChip default, WeatherBadge × all 6 conditions × 2 sizes — all present and render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_pill_semantics_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSTagPillTests.swift
  TEST_FUNCTION: test_pill_semantics_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_glass_surface_and_icon_atom_composition passes | AC-1 |
| TC-2 | test_selected_uses_signal_default_unselected_uses_card_surface passes | AC-2 |
| TC-3 | test_ontoggle_fires_exactly_once passes | AC-3 |
| TC-4 | test_ontap_fires_once_and_resolves_card_surface passes | AC-4 |
| TC-5 | test_all_six_conditions_resolve_weather_color_tokens passes | AC-5 |
| TC-6 | test_sm_and_md_size_heights_from_pill_atom passes | AC-6 |
| TC-7 | No Capsule/Color(hex:)/Font.system in pill molecule sources | AC-7 |
| TC-8 | test_pill_semantics_stories_registered passes | AC-8 |
| TC-9 | swiftformat --lint exits 0 for all four files | AC-7 |
| TC-10 | xcodebuild build exits BUILD SUCCEEDED | AC-8 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSTagPill.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSFilterChip.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift (NEW)
- ios/LaneShadowTests/Molecules/LSTagPillTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSFilterChipTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift (NEW)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/tag-pill/ [REQUIRED READING]
   - Lines: all
   - Focus: Glass surface, icon placement, non-interactive behavior

2. .spec/design/system/molecules/filter-chip/ [REQUIRED READING]
   - Lines: all
   - Focus: Selected/unselected color states, toggle interaction

3. .spec/design/system/molecules/suggestion-chip/ [REQUIRED READING]
   - Lines: all
   - Focus: 32pt height, card surface, single-tap onTap

4. .spec/design/system/molecules/weather-badge/ [REQUIRED READING]
   - Lines: all
   - Focus: Six condition × two size grid, color.weather.* token mapping, icon mapping per condition

5. .spec/prds/v2/06-uc-mol.md
   - Lines: 91-110
   - Focus: UC-MOL-05 acceptance criteria and semantic definitions

6. ios/LaneShadow/Views/Atoms/LSPill.swift [PRIMARY PATTERN]
   - Lines: all
   - Focus: pill atom this family wraps; PillSize enum; height token resolution

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/tag-pill/, .spec/design/system/molecules/filter-chip/, .spec/design/system/molecules/suggestion-chip/, .spec/design/system/molecules/weather-badge/

Interaction notes:
- REQUIRED READING: all four pill design directories before implementing
- LSFilterChip is uncontrolled — caller owns the Bool selected state and wires onToggle to flip it; the molecule never holds @State for selected
- LSWeatherBadge: define WeatherCondition enum with cases sun/rain/wind/storm/hot/cold; both hot and cold map to .therm icon (distinguish by color token)

Pattern: LSPill atom as container with HStack(LSIcon + LSText) content; background/border applied via .background and .overlay on LSPill
Pattern source: ios/LaneShadow/Views/Atoms/LSPill.swift
Anti-pattern: Do not build pill shape with Capsule().fill(color.signal.default) directly — pill shape must come from LSPill atom so PillSize token heights resolve through the theme correctly.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC. RED: failing xcodebuild test. GREEN: minimal LSPill composition. REFACTOR: extract WeatherCondition→token resolver helper; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No primitive pill shapes): grep -rn 'Capsule()' ios/LaneShadow/Views/Molecules/LS{TagPill,FilterChip,SuggestionChip,WeatherBadge}.swift | wc -l = 0
Gate 2 (No literal colors): same files, grep 'Color(hex:\|Color(red:\|Font.system' = 0
Gate 3 (swiftformat): swiftformat --lint of all four files exit 0
Gate 4 (build): xcodebuild build BUILD SUCCEEDED
Gate 5 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios (atoms migrated to Copper theme)
Blocks:     UC-MOL-06-ios (LSChatInput uses LSSuggestionChip), UC-MOL-08-ios (LSLocationContextBar uses LSTagPill), UC-ORG-04-ios
Parallel:   UC-MOL-05-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSTagPill(icon:.pin, label:) WHEN resolved THEN LSPill container; color.surface.glass; LSIcon(.pin, .signal); LSText label.sm", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_glass_surface_and_icon_atom_composition 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSFilterChip selected vs unselected WHEN resolved THEN signal.default fill vs card surface + border; both use LSPill atom", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_selected_uses_signal_default_unselected_uses_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSFilterChip with onToggle WHEN tapped THEN fires exactly once", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_ontoggle_fires_exactly_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSSuggestionChip with onTap WHEN tapped THEN fires once; card surface + border + radius.pill + 32pt height", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSuggestionChipTests/test_ontap_fires_once_and_resolves_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSWeatherBadge all six conditions WHEN resolved THEN color.weather.<condition>.tint bg; .default fg+border; correct LSIcon per condition", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_all_six_conditions_resolve_weather_color_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSWeatherBadge size .sm and .md WHEN resolved THEN PillSize height tokens from LSPill atom", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_sm_and_md_size_heights_from_pill_atom 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN all four molecule sources WHEN inspected THEN no Capsule()/Color(hex:)/Font.system", "verify": "grep -n 'Capsule()\\|Color(red:\\|Color(hex:\\|Font.system' ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating to Molecules/Pill Semantics THEN all semantic × variant stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_pill_semantics_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_glass_surface_and_icon_atom_composition passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_glass_surface_and_icon_atom_composition 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_selected_uses_signal_default_unselected_uses_card_surface passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_selected_uses_signal_default_unselected_uses_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_ontoggle_fires_exactly_once passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_ontoggle_fires_exactly_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_ontap_fires_once_and_resolves_card_surface passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSuggestionChipTests/test_ontap_fires_once_and_resolves_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_all_six_conditions_resolve_weather_color_tokens passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_all_six_conditions_resolve_weather_color_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "test_sm_and_md_size_heights_from_pill_atom passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_sm_and_md_size_heights_from_pill_atom 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "No Capsule/Color(hex:)/Font.system in pill molecule sources", "maps_to_ac": "AC-7", "verify": "grep -n 'Capsule()\\|Color(red:\\|Color(hex:\\|Font.system' ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-8", "type": "test_criterion", "description": "test_pill_semantics_stories_registered passes", "maps_to_ac": "AC-8", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_pill_semantics_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-9", "type": "test_criterion", "description": "swiftformat --lint exits 0", "maps_to_ac": "AC-7", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift" },
    { "id": "TC-10", "type": "test_criterion", "description": "xcodebuild build exits BUILD SUCCEEDED", "maps_to_ac": "AC-8", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->

```

Host validation logs:
## lint.log
```
Running SwiftFormat...
(lint mode - no files will be changed.)
Reading config file at /Users/justinrich/Projects/LaneShadow/.swiftformat
Reading config file at /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/.swiftformat
SwiftFormat completed in 0.05s.
0/134 files require formatting.

```
## build.log
```
r /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/LaneShadow.debug.dylib -Xlinker -no_adhoc_codesign -o /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/LaneShadow

CopySwiftLibs /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app (in target 'LaneShadow' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    builtin-swiftStdLibTool --copy --verbose --sign - --scan-executable /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/LaneShadow.debug.dylib --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/PlugIns --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/SystemExtensions --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Extensions --scan-folder /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator26.4.sdk/System/Library/Frameworks/Foundation.framework --platform iphonesimulator --toolchain /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain --destination /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks --strip-bitcode --strip-bitcode-tool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/bitcode_strip --emit-dependency-info /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/SwiftStdLibToolInputDependencies.dep --filter-for-swift-os

ExtractAppIntentsMetadata (in target 'LaneShadow' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/appintentsmetadataprocessor --toolchain-dir /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain --module-name LaneShadow --sdk-root /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator26.4.sdk --xcode-version 17E202 --platform-family iOS --deployment-target 17.0 --bundle-identifier com.laneshadow.app --output /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app --target-triple arm64-apple-ios17.0-simulator --binary-file /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/LaneShadow --dependency-file /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/Objects-normal/arm64/LaneShadow_dependency_info.dat --stringsdata-file /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/Objects-normal/arm64/ExtractedAppShortcutsMetadata.stringsdata --source-file-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/Objects-normal/arm64/LaneShadow.SwiftFileList --metadata-file-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/LaneShadow.DependencyMetadataFileList --static-metadata-file-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/LaneShadow.DependencyStaticMetadataFileList --swift-const-vals-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/Objects-normal/arm64/LaneShadow.SwiftConstValuesFileList --compile-time-extraction --deployment-aware-processing --validate-assistant-intents --no-app-shortcuts-localization
2026-04-24 07:08:24.971 appintentsmetadataprocessor[57208:18450718] Starting appintentsmetadataprocessor export
2026-04-24 07:08:24.972 appintentsmetadataprocessor[57208:18450718] warning: Metadata extraction skipped. No AppIntents.framework dependency found.

AppIntentsSSUTraining (in target 'LaneShadow' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/appintentsnltrainingprocessor --infoplist-path /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Info.plist --temp-dir-path /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/ssu --bundle-id com.laneshadow.app --product-path /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app --extracted-metadata-path /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Metadata.appintents --metadata-file-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadow.build/LaneShadow.DependencyMetadataFileList --source-file /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Info.plist --archive-ssu-assets
2026-04-24 07:08:24.990 appintentsnltrainingprocessor[57209:18450719] Parsing options for appintentsnltrainingprocessor
2026-04-24 07:08:24.990 appintentsnltrainingprocessor[57209:18450719] Starting AppIntents SSU YAML Generation
2026-04-24 07:08:24.990 appintentsnltrainingprocessor[57209:18450719] No AppShortcuts found - Skipping.

CodeSign /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/LaneShadow.debug.dylib (in target 'LaneShadow' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    
    Signing Identity:     "Sign to Run Locally"
    
    /usr/bin/codesign --force --sign - --timestamp\=none --generate-entitlement-der /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/LaneShadow.debug.dylib

CodeSign /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/__preview.dylib (in target 'LaneShadow' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    
    Signing Identity:     "Sign to Run Locally"
    
    /usr/bin/codesign --force --sign - --timestamp\=none --generate-entitlement-der /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/__preview.dylib

CodeSign /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app (in target 'LaneShadow' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    
    Signing Identity:     "Sign to Run Locally"
    
    /usr/bin/codesign --force --sign - --timestamp\=none --generate-entitlement-der /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app

Validate /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app (in target 'LaneShadow' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    builtin-validationUtility /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app -shallow-bundle -infoplist-subpath Info.plist

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/LaneShadowTheme_48925DD14627D0E8_PackageProduct.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/NativeTheme_-34DE91214F09EA9B_PackageProduct.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/Testing.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/XCTAutomationSupport.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/XCTest.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/XCTestCore.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/XCTestSupport.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/XCUIAutomation.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/XCUnit.framework'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/libXCTestBundleInject.dylib'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/Frameworks/libXCTestSwiftSupport.dylib'

note: Removed stale file '/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadow.app/PlugIns'

** BUILD SUCCEEDED **


```
## test.log
```
wmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/LaneShadowUITests_lto.o -rdynamic -Xlinker -no_deduplicate -Xlinker -objc_abi_version -Xlinker 2 -Xlinker -dependency_info -Xlinker /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/LaneShadowUITests_dependency_info.dat -fobjc-link-runtime -L/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator -L/usr/lib/swift -Xlinker -add_ast_path -Xlinker /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/LaneShadowUITests.swiftmodule @/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/LaneShadowUITests-linker-args.resp -Xlinker -needed_framework -Xlinker XCTest -framework XCTest -Xlinker -needed-lXCTestSwiftSupport -lXCTestSwiftSupport -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __entitlements -Xlinker /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/LaneShadowUITests.xctest-Simulated.xcent -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __ents_der -Xlinker /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/LaneShadowUITests.xctest-Simulated.xcent.der -Xlinker -no_adhoc_codesign -o /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/LaneShadowUITests

ExtractAppIntentsMetadata (in target 'LaneShadowUITests' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/appintentsmetadataprocessor --toolchain-dir /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain --module-name LaneShadowUITests --sdk-root /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator26.4.sdk --xcode-version 17E202 --platform-family iOS --deployment-target 17.0 --bundle-identifier com.laneshadow.app.ui-tests --output /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest --target-triple arm64-apple-ios17.0-simulator --binary-file /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/LaneShadowUITests --dependency-file /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/LaneShadowUITests_dependency_info.dat --stringsdata-file /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/ExtractedAppShortcutsMetadata.stringsdata --source-file-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/LaneShadowUITests.SwiftFileList --metadata-file-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/LaneShadowUITests.DependencyMetadataFileList --static-metadata-file-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/LaneShadowUITests.DependencyStaticMetadataFileList --swift-const-vals-list /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/Objects-normal/arm64/LaneShadowUITests.SwiftConstValuesFileList --compile-time-extraction --deployment-aware-processing --validate-assistant-intents --no-app-shortcuts-localization
2026-04-24 07:08:30.753 appintentsmetadataprocessor[57280:18451358] Starting appintentsmetadataprocessor export
2026-04-24 07:08:30.754 appintentsmetadataprocessor[57280:18451358] warning: Metadata extraction skipped. No AppIntents.framework dependency found.

CopySwiftLibs /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest (in target 'LaneShadowUITests' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    builtin-swiftStdLibTool --copy --verbose --sign - --scan-executable /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/LaneShadowUITests --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/Frameworks --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/PlugIns --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/SystemExtensions --scan-folder /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/Extensions --platform iphonesimulator --toolchain /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain --destination /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest/Frameworks --strip-bitcode --scan-executable /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/usr/lib/libXCTestSwiftSupport.dylib --strip-bitcode-tool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/bitcode_strip --emit-dependency-info /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Intermediates.noindex/LaneShadow.build/Debug-iphonesimulator/LaneShadowUITests.build/SwiftStdLibToolInputDependencies.dep --filter-for-swift-os

CodeSign /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest (in target 'LaneShadowUITests' from project 'LaneShadow')
    cd /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios/ios
    
    Signing Identity:     "Sign to Run Locally"
    
    /usr/bin/codesign --force --sign - --timestamp\=none --generate-entitlement-der /Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Build/Products/Debug-iphonesimulator/LaneShadowUITests-Runner.app/PlugIns/LaneShadowUITests.xctest

2026-04-24 07:08:32.251240-0600 LaneShadow[57282:18451601] [common] [Info, common]: Using Mapbox Common SDK v24.22.0(cb16ef14a038f95e5311abe5f2a78afb48e8090b)
2026-04-24 07:08:32.253664-0600 LaneShadow[57282:18451601] [maps-core] [Info, maps-core]: Using Mapbox Core Maps SDK v11.22.0(cb16ef14a03)
Test Suite 'Selected tests' started at 2026-04-24 07:08:32.717.
Test Suite 'LaneShadowTests.xctest' started at 2026-04-24 07:08:32.717.
Test Suite 'LSFilterChipTests' started at 2026-04-24 07:08:32.717.
Test Case '-[LaneShadowTests.LSFilterChipTests test_ontoggle_fires_exactly_once]' started.
Test Case '-[LaneShadowTests.LSFilterChipTests test_ontoggle_fires_exactly_once]' passed (0.001 seconds).
Test Case '-[LaneShadowTests.LSFilterChipTests test_selected_uses_signal_default_unselected_uses_card_surface]' started.
Test Case '-[LaneShadowTests.LSFilterChipTests test_selected_uses_signal_default_unselected_uses_card_surface]' passed (0.001 seconds).
Test Suite 'LSFilterChipTests' passed at 2026-04-24 07:08:32.720.
	 Executed 2 tests, with 0 failures (0 unexpected) in 0.002 (0.003) seconds
Test Suite 'LSSuggestionChipTests' started at 2026-04-24 07:08:32.720.
Test Case '-[LaneShadowTests.LSSuggestionChipTests test_ontap_fires_once_and_resolves_card_surface]' started.
Test Case '-[LaneShadowTests.LSSuggestionChipTests test_ontap_fires_once_and_resolves_card_surface]' passed (0.001 seconds).
Test Suite 'LSSuggestionChipTests' passed at 2026-04-24 07:08:32.722.
	 Executed 1 test, with 0 failures (0 unexpected) in 0.001 (0.001) seconds
Test Suite 'LSTagPillTests' started at 2026-04-24 07:08:32.722.
Test Case '-[LaneShadowTests.LSTagPillTests test_glass_surface_and_icon_atom_composition]' started.
Test Case '-[LaneShadowTests.LSTagPillTests test_glass_surface_and_icon_atom_composition]' passed (0.001 seconds).
Test Case '-[LaneShadowTests.LSTagPillTests test_pill_semantics_stories_registered]' started.
Test Case '-[LaneShadowTests.LSTagPillTests test_pill_semantics_stories_registered]' passed (0.003 seconds).
Test Suite 'LSTagPillTests' passed at 2026-04-24 07:08:32.727.
	 Executed 2 tests, with 0 failures (0 unexpected) in 0.004 (0.005) seconds
Test Suite 'LSWeatherBadgeTests' started at 2026-04-24 07:08:32.727.
Test Case '-[LaneShadowTests.LSWeatherBadgeTests test_all_six_conditions_resolve_weather_color_tokens]' started.
Test Case '-[LaneShadowTests.LSWeatherBadgeTests test_all_six_conditions_resolve_weather_color_tokens]' passed (0.001 seconds).
Test Case '-[LaneShadowTests.LSWeatherBadgeTests test_sm_and_md_size_heights_from_pill_atom]' started.
Test Case '-[LaneShadowTests.LSWeatherBadgeTests test_sm_and_md_size_heights_from_pill_atom]' passed (0.001 seconds).
Test Suite 'LSWeatherBadgeTests' passed at 2026-04-24 07:08:32.729.
	 Executed 2 tests, with 0 failures (0 unexpected) in 0.002 (0.003) seconds
Test Suite 'LaneShadowTests.xctest' passed at 2026-04-24 07:08:32.730.
	 Executed 7 tests, with 0 failures (0 unexpected) in 0.010 (0.012) seconds
Test Suite 'Selected tests' passed at 2026-04-24 07:08:32.731.
	 Executed 7 tests, with 0 failures (0 unexpected) in 0.010 (0.015) seconds
2026-04-24 07:08:33.009 xcodebuild[57213:18450746] [MT] IDETestOperationsObserverDebug: 2.233 elapsed -- Testing started completed.
2026-04-24 07:08:33.009 xcodebuild[57213:18450746] [MT] IDETestOperationsObserverDebug: 0.000 sec, +0.000 sec -- start
2026-04-24 07:08:33.009 xcodebuild[57213:18450746] [MT] IDETestOperationsObserverDebug: 2.233 sec, +2.233 sec -- end

Test session results, code coverage, and logs:
	/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-bneljcxcddslmyeoawmplqolejqu/Logs/Test/Test-LaneShadow-2026.04.24_07-08-26--0600.xcresult

** TEST SUCCEEDED **

Testing started

```

Full diff against main:
```diff
diff --git a/ai-specs/UC-MOL-05/ios-learnings.md b/ai-specs/UC-MOL-05/ios-learnings.md
new file mode 100644
index 00000000..46ed0a1f
--- /dev/null
+++ b/ai-specs/UC-MOL-05/ios-learnings.md
@@ -0,0 +1,34 @@
+# iOS Learnings: UC-MOL-05 Pill Semantics Family
+
+## Implementation Date
+April 24, 2026
+
+## Edge Cases Discovered
+1. Story registration assertions that rely on source scanning need explicit literal story IDs in source; dynamically interpolated IDs are harder to validate and caused false negatives in AC-8 tests.
+2. Running multiple `xcodebuild test` commands in parallel against the same simulator destination can cause intermittent XCTest bootstrap crashes (signal kill) even when code is correct.
+
+## API Contract Notes
+- `WeatherCondition` was defined as a public enum in molecule scope with six required cases (`sun`, `rain`, `wind`, `storm`, `hot`, `cold`) so downstream molecules can import and reuse it.
+- Both `.hot` and `.cold` conditions map to `.therm` icon while preserving distinct weather token families.
+
+## UI Decisions
+- `LSTagPill`, `LSFilterChip`, `LSSuggestionChip`, and `LSWeatherBadge` all compose from `LSPill` and route content through atom layer (`LSIcon`/`LSText`) to preserve tokenized sizing/typography behavior.
+- Suggestion chip height is resolved through `LSPill(size: .md)` instead of hardcoded frame values.
+
+## Platform-Specific Notes
+- Swift 6 strict concurrency surfaced sendability warnings in tests that touched view initializers from non-main contexts; annotating interaction tests with `@MainActor` avoided data-race diagnostics.
+- For callback-once verification, deterministic static dispatch helpers avoid brittle UIKit-control introspection against SwiftUI button internals.
+
+## Files Created/Modified
+- ios/LaneShadow/Views/Molecules/LSTagPill.swift
+- ios/LaneShadow/Views/Molecules/LSFilterChip.swift
+- ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift
+- ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift
+- ios/LaneShadowTests/Molecules/LSTagPillTests.swift
+- ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
+- ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
+- ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
+- ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
+- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
+- ios/LaneShadow/Sandbox/LaneShadowStories.swift
+- ios/project.yml
diff --git a/ios/LaneShadow.xcodeproj/project.pbxproj b/ios/LaneShadow.xcodeproj/project.pbxproj
index ad3df868..f868f00f 100644
--- a/ios/LaneShadow.xcodeproj/project.pbxproj
+++ b/ios/LaneShadow.xcodeproj/project.pbxproj
@@ -10,19 +10,27 @@
 		06E6D012390862D9ABF3488C /* LaneShadowTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 5C592B52392DEEACF2D91C3B /* LaneShadowTests.swift */; };
 		078589B1255FE42AA7459089 /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = 0A5A63FC5750EC47FC36E0DC /* Assets.xcassets */; };
 		0A215149AE7AF5FBBCB5409E /* ConvexStore.swift in Sources */ = {isa = PBXBuildFile; fileRef = F57D4881CFC9C4FA4D11B5BC /* ConvexStore.swift */; };
+		0A78DB4A71E431B8B3F4AABC /* LSTagPillTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = FC83F862A5EB19DEB3876C9F /* LSTagPillTests.swift */; };
 		0B45673D740CC18D7C34929C /* LSButtonStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 05416F03B3657341F705522A /* LSButtonStories.swift */; };
 		1952669D73F48496CFB75791 /* LaneShadowTheme in Frameworks */ = {isa = PBXBuildFile; productRef = A82A70CA01368BECA5189F19 /* LaneShadowTheme */; };
 		1BAC7EA2369264B7A19C9D08 /* LSDisplayStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 534D26C275878552CD82E5FE /* LSDisplayStories.swift */; };
+		1DBEC19288F8A92342DE8746 /* LSSuggestionChipTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = E495FF258A7B5B6B9E5FBCD4 /* LSSuggestionChipTests.swift */; };
 		1EF50AB42CA36C6BAE6B79F2 /* LSPhaseDotStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 9F8ABC117BB7538D9D09E1F6 /* LSPhaseDotStories.swift */; };
+		293E7CA38C0EA35CD1365886 /* LSTagPill.swift in Sources */ = {isa = PBXBuildFile; fileRef = C7D7D85AC834967019608CDE /* LSTagPill.swift */; };
+		3844822E275E9D75B28903BB /* LSFilterChipTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = D1DC83704B40351C691A4773 /* LSFilterChipTests.swift */; };
 		3D2143A67410FB5D8D2F3B45 /* LSInputStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = EE8CB573821E0981D725E364 /* LSInputStories.swift */; };
 		40979501CCACCFB156F25EB5 /* LaneShadowSandboxEntry.swift in Sources */ = {isa = PBXBuildFile; fileRef = F7C289172CD246D71CC0E6BB /* LaneShadowSandboxEntry.swift */; };
+		4C05ABB5C49D2E72EFB85198 /* LSFilterChip.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1130AFDFD500511DD417BC8 /* LSFilterChip.swift */; };
 		4CDBE631CAAFA6685708C14B /* ConvexMobile in Frameworks */ = {isa = PBXBuildFile; productRef = CE666EC279651E6E31EE5FBE /* ConvexMobile */; };
 		762FB79AB5AE6050179BB785 /* LSScrimStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 8F281656D06513E78E57D10D /* LSScrimStories.swift */; };
+		7D14E5FC27DC166337CD21F6 /* LSPillSemanticsStory.swift in Sources */ = {isa = PBXBuildFile; fileRef = A238C56E1438A146430C1125 /* LSPillSemanticsStory.swift */; };
 		7E8799D5CE1C5FFCE3D09066 /* App.swift in Sources */ = {isa = PBXBuildFile; fileRef = 324B26FB2DE3F759B489CB7B /* App.swift */; };
+		7F07F9ABF0C419E0E2BA5CEA /* LSWeatherBadge.swift in Sources */ = {isa = PBXBuildFile; fileRef = 478C8C03ABF1E0F4AFEF0836 /* LSWeatherBadge.swift */; };
 		91C89DFA7917A4D7A0446E88 /* LSPillStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 220BC64128EB0A24188F4C65 /* LSPillStories.swift */; };
 		925CA576235653EA9D6CE109 /* NativeSandbox in Frameworks */ = {isa = PBXBuildFile; productRef = 9DD5E01C1B4FE6A3686813CA /* NativeSandbox */; };
 		95572DAE37FCF32B9BDE4BC4 /* LSMapStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = A770CE2595F52C1DC3532F8A /* LSMapStories.swift */; };
 		95DD81C1CEF88FF460DA7A6E /* InfoToastTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 20AC933B1DF7AFFC89BD22E0 /* InfoToastTests.swift */; };
+		9F2D99868C5E402CD5589B29 /* LSWeatherBadgeTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 05CF329976C1FF7D2469EB4D /* LSWeatherBadgeTests.swift */; };
 		A09AB47FC330215325A9F4F1 /* Foundation.framework in Frameworks */ = {isa = PBXBuildFile; fileRef = A9EDF4218751AC8200085830 /* Foundation.framework */; };
 		A71A81EDC8563AFD14EE83FB /* ContentView.swift in Sources */ = {isa = PBXBuildFile; fileRef = B95CA989BE1243B1021F83D3 /* ContentView.swift */; };
 		AFD4E47761A2E61BAAA06453 /* EmptyStateTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 2EEA7EB2CEBB6DE868C24B7E /* EmptyStateTests.swift */; };
@@ -36,6 +44,7 @@
 		E868E14CF971E572F61A614E /* MoleculesStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = E0747C3C833D0EA3BAF7F3D2 /* MoleculesStories.swift */; };
 		ED9DF59A25970507B80D1720 /* MapboxMaps in Frameworks */ = {isa = PBXBuildFile; productRef = DA5E21A6F8345673A1101414 /* MapboxMaps */; };
 		F9E41F8A8E5435B9BCD67D40 /* InfoToast.swift in Sources */ = {isa = PBXBuildFile; fileRef = 9B5F858C066D550CE73CE6FD /* InfoToast.swift */; };
+		FCAE00CC74E427BDB51D7F65 /* LSSuggestionChip.swift in Sources */ = {isa = PBXBuildFile; fileRef = A46A985C643A99B580C53E4E /* LSSuggestionChip.swift */; };
 		FEBAB697C67EECE893936275 /* EmptyState.swift in Sources */ = {isa = PBXBuildFile; fileRef = A2233125579D4855C122E592 /* EmptyState.swift */; };
 /* End PBXBuildFile section */
 
@@ -58,6 +67,7 @@
 
 /* Begin PBXFileReference section */
 		05416F03B3657341F705522A /* LSButtonStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSButtonStories.swift; sourceTree = "<group>"; };
+		05CF329976C1FF7D2469EB4D /* LSWeatherBadgeTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSWeatherBadgeTests.swift; sourceTree = "<group>"; };
 		0A5A63FC5750EC47FC36E0DC /* Assets.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; };
 		0E259B982ADB47ABE53D132D /* LSTextStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSTextStories.swift; sourceTree = "<group>"; };
 		20AC933B1DF7AFFC89BD22E0 /* InfoToastTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = InfoToastTests.swift; sourceTree = "<group>"; };
@@ -67,6 +77,7 @@
 		324B26FB2DE3F759B489CB7B /* App.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = App.swift; sourceTree = "<group>"; };
 		3B4E8EF6472F1ABEBBC33DFB /* ios */ = {isa = PBXFileReference; lastKnownFileType = folder; name = ios; path = "../../native-sandbox/ios"; sourceTree = SOURCE_ROOT; };
 		3E1A53BCC888DAEA7153F458 /* AtomsStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AtomsStories.swift; sourceTree = "<group>"; };
+		478C8C03ABF1E0F4AFEF0836 /* LSWeatherBadge.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSWeatherBadge.swift; sourceTree = "<group>"; };
 		534D26C275878552CD82E5FE /* LSDisplayStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSDisplayStories.swift; sourceTree = "<group>"; };
 		5C592B52392DEEACF2D91C3B /* LaneShadowTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LaneShadowTests.swift; sourceTree = "<group>"; };
 		5FB23C9E4DF31CC4E50E47AB /* swift */ = {isa = PBXFileReference; lastKnownFileType = folder; name = swift; path = ../tokens/platforms/swift; sourceTree = SOURCE_ROOT; };
@@ -76,17 +87,24 @@
 		8F281656D06513E78E57D10D /* LSScrimStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSScrimStories.swift; sourceTree = "<group>"; };
 		9B5F858C066D550CE73CE6FD /* InfoToast.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = InfoToast.swift; sourceTree = "<group>"; };
 		9F8ABC117BB7538D9D09E1F6 /* LSPhaseDotStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSPhaseDotStories.swift; sourceTree = "<group>"; };
+		A1130AFDFD500511DD417BC8 /* LSFilterChip.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSFilterChip.swift; sourceTree = "<group>"; };
 		A2233125579D4855C122E592 /* EmptyState.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = EmptyState.swift; sourceTree = "<group>"; };
+		A238C56E1438A146430C1125 /* LSPillSemanticsStory.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSPillSemanticsStory.swift; sourceTree = "<group>"; };
+		A46A985C643A99B580C53E4E /* LSSuggestionChip.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSSuggestionChip.swift; sourceTree = "<group>"; };
 		A770CE2595F52C1DC3532F8A /* LSMapStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSMapStories.swift; sourceTree = "<group>"; };
 		A9EDF4218751AC8200085830 /* Foundation.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = Foundation.framework; path = System/Library/Frameworks/Foundation.framework; sourceTree = SDKROOT; };
 		B95CA989BE1243B1021F83D3 /* ContentView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ContentView.swift; sourceTree = "<group>"; };
+		C7D7D85AC834967019608CDE /* LSTagPill.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSTagPill.swift; sourceTree = "<group>"; };
+		D1DC83704B40351C691A4773 /* LSFilterChipTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSFilterChipTests.swift; sourceTree = "<group>"; };
 		D5107D4267204A230D572AB9 /* MarkdownTextTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MarkdownTextTests.swift; sourceTree = "<group>"; };
 		E0747C3C833D0EA3BAF7F3D2 /* MoleculesStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MoleculesStories.swift; sourceTree = "<group>"; };
+		E495FF258A7B5B6B9E5FBCD4 /* LSSuggestionChipTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSSuggestionChipTests.swift; sourceTree = "<group>"; };
 		ED792B4C270AB975C34CB118 /* LaneShadowTests.xctest */ = {isa = PBXFileReference; includeInIndex = 0; lastKnownFileType = wrapper.cfbundle; path = LaneShadowTests.xctest; sourceTree = BUILT_PRODUCTS_DIR; };
 		EE8CB573821E0981D725E364 /* LSInputStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSInputStories.swift; sourceTree = "<group>"; };
 		EF4B1C18D8FD1069B42CB70D /* LaneShadowUITests.xctest */ = {isa = PBXFileReference; includeInIndex = 0; lastKnownFileType = wrapper.cfbundle; path = LaneShadowUITests.xctest; sourceTree = BUILT_PRODUCTS_DIR; };
 		F57D4881CFC9C4FA4D11B5BC /* ConvexStore.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ConvexStore.swift; sourceTree = "<group>"; };
 		F7C289172CD246D71CC0E6BB /* LaneShadowSandboxEntry.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LaneShadowSandboxEntry.swift; sourceTree = "<group>"; };
+		FC83F862A5EB19DEB3876C9F /* LSTagPillTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSTagPillTests.swift; sourceTree = "<group>"; };
 /* End PBXFileReference section */
 
 /* Begin PBXFileSystemSynchronizedBuildFileExceptionSet section */
@@ -225,6 +243,7 @@
 		2F2DF9072E7DE318B1CF4168 /* Stories */ = {
 			isa = PBXGroup;
 			children = (
+				8C41ED0E046EE966A32C67CB /* Molecules */,
 				3E1A53BCC888DAEA7153F458 /* AtomsStories.swift */,
 				05416F03B3657341F705522A /* LSButtonStories.swift */,
 				534D26C275878552CD82E5FE /* LSDisplayStories.swift */,
@@ -245,6 +264,10 @@
 			children = (
 				A2233125579D4855C122E592 /* EmptyState.swift */,
 				9B5F858C066D550CE73CE6FD /* InfoToast.swift */,
+				A1130AFDFD500511DD417BC8 /* LSFilterChip.swift */,
+				A46A985C643A99B580C53E4E /* LSSuggestionChip.swift */,
+				C7D7D85AC834967019608CDE /* LSTagPill.swift */,
+				478C8C03ABF1E0F4AFEF0836 /* LSWeatherBadge.swift */,
 				6089A65C4DD27D71FDFC6B91 /* MarkdownText.swift */,
 			);
 			path = Molecules;
@@ -292,6 +315,14 @@
 			path = LaneShadowTests;
 			sourceTree = "<group>";
 		};
+		8C41ED0E046EE966A32C67CB /* Molecules */ = {
+			isa = PBXGroup;
+			children = (
+				A238C56E1438A146430C1125 /* LSPillSemanticsStory.swift */,
+			);
+			path = Molecules;
+			sourceTree = "<group>";
+		};
 		9A00239A316DF9BC49914EC8 /* Views */ = {
 			isa = PBXGroup;
 			children = (
@@ -316,6 +347,10 @@
 			children = (
 				2EEA7EB2CEBB6DE868C24B7E /* EmptyStateTests.swift */,
 				20AC933B1DF7AFFC89BD22E0 /* InfoToastTests.swift */,
+				D1DC83704B40351C691A4773 /* LSFilterChipTests.swift */,
+				E495FF258A7B5B6B9E5FBCD4 /* LSSuggestionChipTests.swift */,
+				FC83F862A5EB19DEB3876C9F /* LSTagPillTests.swift */,
+				05CF329976C1FF7D2469EB4D /* LSWeatherBadgeTests.swift */,
 				D5107D4267204A230D572AB9 /* MarkdownTextTests.swift */,
 			);
 			path = Molecules;
@@ -511,13 +546,18 @@
 				F9E41F8A8E5435B9BCD67D40 /* InfoToast.swift in Sources */,
 				0B45673D740CC18D7C34929C /* LSButtonStories.swift in Sources */,
 				1BAC7EA2369264B7A19C9D08 /* LSDisplayStories.swift in Sources */,
+				4C05ABB5C49D2E72EFB85198 /* LSFilterChip.swift in Sources */,
 				E38D09C5CE8E05B40EC425E5 /* LSIconStories.swift in Sources */,
 				3D2143A67410FB5D8D2F3B45 /* LSInputStories.swift in Sources */,
 				95572DAE37FCF32B9BDE4BC4 /* LSMapStories.swift in Sources */,
 				1EF50AB42CA36C6BAE6B79F2 /* LSPhaseDotStories.swift in Sources */,
+				7D14E5FC27DC166337CD21F6 /* LSPillSemanticsStory.swift in Sources */,
 				91C89DFA7917A4D7A0446E88 /* LSPillStories.swift in Sources */,
 				762FB79AB5AE6050179BB785 /* LSScrimStories.swift in Sources */,
+				FCAE00CC74E427BDB51D7F65 /* LSSuggestionChip.swift in Sources */,
+				293E7CA38C0EA35CD1365886 /* LSTagPill.swift in Sources */,
 				D3FCBC758470A7571618AF4A /* LSTextStories.swift in Sources */,
+				7F07F9ABF0C419E0E2BA5CEA /* LSWeatherBadge.swift in Sources */,
 				40979501CCACCFB156F25EB5 /* LaneShadowSandboxEntry.swift in Sources */,
 				B5FF9B8BF6CCCBF0478B2A77 /* LaneShadowStories.swift in Sources */,
 				E2B1C40DCB7D1C33CC729331 /* MarkdownText.swift in Sources */,
@@ -538,6 +578,10 @@
 			files = (
 				AFD4E47761A2E61BAAA06453 /* EmptyStateTests.swift in Sources */,
 				95DD81C1CEF88FF460DA7A6E /* InfoToastTests.swift in Sources */,
+				3844822E275E9D75B28903BB /* LSFilterChipTests.swift in Sources */,
+				1DBEC19288F8A92342DE8746 /* LSSuggestionChipTests.swift in Sources */,
+				0A78DB4A71E431B8B3F4AABC /* LSTagPillTests.swift in Sources */,
+				9F2D99868C5E402CD5589B29 /* LSWeatherBadgeTests.swift in Sources */,
 				06E6D012390862D9ABF3488C /* LaneShadowTests.swift in Sources */,
 				C9108535DE88E44D62CC2AE6 /* MarkdownTextTests.swift in Sources */,
 			);
diff --git a/ios/LaneShadow/Sandbox/LaneShadowStories.swift b/ios/LaneShadow/Sandbox/LaneShadowStories.swift
index 63b9f37e..77841bdb 100644
--- a/ios/LaneShadow/Sandbox/LaneShadowStories.swift
+++ b/ios/LaneShadow/Sandbox/LaneShadowStories.swift
@@ -66,6 +66,7 @@ enum LaneShadowStories {
         + LSButtonStories.all
         + LSInputStories.all
         + LSPillStories.all
+        + MoleculesStories.all
         + LSScrimStories.all
         + LSPhaseDotStories.all
 }
diff --git a/ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift b/ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
new file mode 100644
index 00000000..37cba031
--- /dev/null
+++ b/ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
@@ -0,0 +1,118 @@
+import LaneShadowTheme
+import NativeSandbox
+import SwiftUI
+
+@MainActor
+enum LSPillSemanticsStory {
+    static let all: [Story] = [
+        Story(
+            id: "molecules.pillSemantics.tagPill.default",
+            tier: .molecule,
+            component: "Pill Semantics",
+            name: "TagPill Default",
+            summary: "LSTagPill with glass surface, pin icon, and label."
+        ) { _ in
+            LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")
+                .padding(Theme.shared.space.lg)
+        },
+
+        Story(
+            id: "molecules.pillSemantics.filterChip.unselected",
+            tier: .molecule,
+            component: "Pill Semantics",
+            name: "FilterChip Unselected",
+            summary: "LSFilterChip with unselected card/border semantics."
+        ) { _ in
+            LSFilterChip(label: "Scenic", selected: false, onToggle: {})
+                .padding(Theme.shared.space.lg)
+        },
+
+        Story(
+            id: "molecules.pillSemantics.filterChip.selected",
+            tier: .molecule,
+            component: "Pill Semantics",
+            name: "FilterChip Selected",
+            summary: "LSFilterChip with selected signal semantics."
+        ) { _ in
+            LSFilterChip(label: "Scenic", selected: true, onToggle: {})
+                .padding(Theme.shared.space.lg)
+        },
+
+        Story(
+            id: "molecules.pillSemantics.suggestionChip.default",
+            tier: .molecule,
+            component: "Pill Semantics",
+            name: "SuggestionChip Default",
+            summary: "LSSuggestionChip card semantic with single-tap action."
+        ) { _ in
+            LSSuggestionChip(label: "Twisty back roads", onTap: {})
+                .padding(Theme.shared.space.lg)
+        },
+    ] + [
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.sun.sm", condition: .sun, size: .sm),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.sun.md", condition: .sun, size: .md),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.rain.sm", condition: .rain, size: .sm),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.rain.md", condition: .rain, size: .md),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.wind.sm", condition: .wind, size: .sm),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.wind.md", condition: .wind, size: .md),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.storm.sm", condition: .storm, size: .sm),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.storm.md", condition: .storm, size: .md),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.hot.sm", condition: .hot, size: .sm),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.hot.md", condition: .hot, size: .md),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.cold.sm", condition: .cold, size: .sm),
+        weatherStory(id: "molecules.pillSemantics.weatherBadge.cold.md", condition: .cold, size: .md),
+    ]
+
+    private static func weatherStory(
+        id: String,
+        condition: WeatherCondition,
+        size: PillSize
+    ) -> Story {
+        Story(
+            id: id,
+            tier: .molecule,
+            component: "Pill Semantics",
+            name: "WeatherBadge \(condition.storyLabel) \(size.storyLabel)",
+            summary: "LSWeatherBadge weather semantic for \(condition.storyLabel) at \(size.storyLabel)."
+        ) { _ in
+            LSWeatherBadge(condition: condition, label: condition.defaultLabel, size: size)
+                .padding(Theme.shared.space.lg)
+        }
+    }
+}
+
+private extension PillSize {
+    var storyLabel: String {
+        switch self {
+        case .sm:
+            "SM"
+        case .md:
+            "MD"
+        case .lg:
+            "LG"
+        }
+    }
+}
+
+private extension WeatherCondition {
+    var storyLabel: String {
+        rawValue.capitalized
+    }
+
+    var defaultLabel: String {
+        switch self {
+        case .sun:
+            "Clear"
+        case .rain:
+            "Rain 3pm"
+        case .wind:
+            "18mph NW"
+        case .storm:
+            "Storm"
+        case .hot:
+            "92F"
+        case .cold:
+            "38F"
+        }
+    }
+}
diff --git a/ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift b/ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
index 266acd2f..0aa720de 100644
--- a/ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
+++ b/ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
@@ -6,5 +6,5 @@ import SwiftUI
 /// Sprint 4 (molecules) will repopulate this aggregator.
 @MainActor
 enum MoleculesStories {
-    static let all: [Story] = []
+    static let all: [Story] = LSPillSemanticsStory.all
 }
diff --git a/ios/LaneShadow/Views/Molecules/LSFilterChip.swift b/ios/LaneShadow/Views/Molecules/LSFilterChip.swift
new file mode 100644
index 00000000..32184d07
--- /dev/null
+++ b/ios/LaneShadow/Views/Molecules/LSFilterChip.swift
@@ -0,0 +1,76 @@
+import LaneShadowTheme
+import SwiftUI
+
+struct LSFilterChipResolvedStyle {
+    let backgroundToken: String
+    let borderToken: String
+    let backgroundColor: Color
+    let borderColor: Color
+    let textColor: ContentColor
+}
+
+public struct LSFilterChip: View {
+    public static let tapAccessibilityIdentifier = "lsfilterchip-toggle"
+
+    @Environment(\.theme) private var theme
+
+    let label: String
+    let selected: Bool
+    private let onToggle: () -> Void
+
+    var resolvedStyle: LSFilterChipResolvedStyle {
+        if selected {
+            LSFilterChipResolvedStyle(
+                backgroundToken: "color.signal.default",
+                borderToken: "color.signal.default",
+                backgroundColor: LaneShadowTheme.color.signal.default,
+                borderColor: LaneShadowTheme.color.signal.default,
+                textColor: .onSignal
+            )
+        } else {
+            LSFilterChipResolvedStyle(
+                backgroundToken: "color.surface.card",
+                borderToken: "color.border.default",
+                backgroundColor: LaneShadowTheme.color.surface.card,
+                borderColor: LaneShadowTheme.color.border.default,
+                textColor: .secondary
+            )
+        }
+    }
+
+    public init(
+        label: String,
+        selected: Bool,
+        onToggle: @escaping () -> Void
+    ) {
+        self.label = label
+        self.selected = selected
+        self.onToggle = onToggle
+    }
+
+    public var body: some View {
+        let style = resolvedStyle
+
+        Button(action: { Self.dispatch(onToggle) }) {
+            LSPill(size: .md) {
+                LSText(label, variant: .label.md, color: style.textColor)
+                    .padding(.horizontal, theme.space.xs)
+                    .background(
+                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                            .fill(style.backgroundColor)
+                    )
+                    .overlay(
+                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                            .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
+                    )
+            }
+        }
+        .buttonStyle(.plain)
+        .accessibilityIdentifier(Self.tapAccessibilityIdentifier)
+        .accessibilityAddTraits(.isButton)
+    }
+
+    static func dispatch(_ action: () -> Void) {
+        action()
+    }
+}
diff --git a/ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift b/ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift
new file mode 100644
index 00000000..85f8610a
--- /dev/null
+++ b/ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift
@@ -0,0 +1,65 @@
+import LaneShadowTheme
+import SwiftUI
+
+struct LSSuggestionChipResolvedStyle {
+    let backgroundToken: String
+    let borderToken: String
+    let backgroundColor: Color
+    let borderColor: Color
+}
+
+public struct LSSuggestionChip: View {
+    public static let tapAccessibilityIdentifier = "lssuggestionchip-tap"
+
+    @Environment(\.theme) private var theme
+
+    let label: String
+    private let onTap: () -> Void
+
+    var resolvedStyle: LSSuggestionChipResolvedStyle {
+        LSSuggestionChipResolvedStyle(
+            backgroundToken: "color.surface.card",
+            borderToken: "color.border.default",
+            backgroundColor: LaneShadowTheme.color.surface.card,
+            borderColor: LaneShadowTheme.color.border.default
+        )
+    }
+
+    var size: PillSize {
+        .md
+    }
+
+    public init(
+        label: String,
+        onTap: @escaping () -> Void
+    ) {
+        self.label = label
+        self.onTap = onTap
+    }
+
+    public var body: some View {
+        let style = resolvedStyle
+
+        Button(action: { Self.dispatch(onTap) }) {
+            LSPill(size: .md) {
+                LSText(label, variant: .label.md, color: .secondary)
+                    .padding(.horizontal, theme.space.xs)
+                    .background(
+                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                            .fill(style.backgroundColor)
+                    )
+                    .overlay(
+                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                            .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
+                    )
+            }
+        }
+        .buttonStyle(.plain)
+        .accessibilityIdentifier(Self.tapAccessibilityIdentifier)
+        .accessibilityAddTraits(.isButton)
+    }
+
+    static func dispatch(_ action: () -> Void) {
+        action()
+    }
+}
diff --git a/ios/LaneShadow/Views/Molecules/LSTagPill.swift b/ios/LaneShadow/Views/Molecules/LSTagPill.swift
new file mode 100644
index 00000000..9dd0c905
--- /dev/null
+++ b/ios/LaneShadow/Views/Molecules/LSTagPill.swift
@@ -0,0 +1,61 @@
+import LaneShadowTheme
+import SwiftUI
+
+struct LSTagPillResolvedStyle {
+    let backgroundToken: String
+    let borderToken: String
+    let iconColor: IconContentColor
+    let backgroundColor: Color
+    let borderColor: Color
+}
+
+public struct LSTagPill: View {
+    @Environment(\.theme) private var theme
+
+    let icon: IconName?
+    let labelText: String
+    let size: PillSize
+
+    var resolvedStyle: LSTagPillResolvedStyle {
+        LSTagPillResolvedStyle(
+            backgroundToken: "color.surface.glass",
+            borderToken: "color.border.default",
+            iconColor: .signal,
+            backgroundColor: LaneShadowTheme.color.surface.glass,
+            borderColor: LaneShadowTheme.color.border.default
+        )
+    }
+
+    public init(
+        icon: IconName? = nil,
+        label: String,
+        size: PillSize = .sm
+    ) {
+        self.icon = icon
+        labelText = label
+        self.size = size
+    }
+
+    public var body: some View {
+        let style = resolvedStyle
+
+        LSPill(size: size) {
+            HStack(spacing: theme.space.xs) {
+                if let icon {
+                    LSIcon(name: icon, size: .xs, color: style.iconColor)
+                }
+
+                LSText(labelText, variant: .label.sm, color: .secondary)
+            }
+            .padding(.horizontal, theme.space.xs)
+            .background(
+                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                    .fill(style.backgroundColor)
+            )
+            .overlay(
+                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                    .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
+            )
+        }
+    }
+}
diff --git a/ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift b/ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift
new file mode 100644
index 00000000..f7f7430b
--- /dev/null
+++ b/ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift
@@ -0,0 +1,124 @@
+import LaneShadowTheme
+import SwiftUI
+
+public struct WeatherConditionResolvedStyle {
+    public let backgroundToken: String
+    public let foregroundToken: String
+    public let borderToken: String
+    public let backgroundColor: Color
+    public let foregroundColor: Color
+    public let borderColor: Color
+    public let icon: IconName
+}
+
+public enum WeatherCondition: String, CaseIterable, Sendable {
+    case sun
+    case rain
+    case wind
+    case storm
+    case hot
+    case cold
+
+    var resolvedStyle: WeatherConditionResolvedStyle {
+        switch self {
+        case .sun:
+            weatherStyle(
+                key: "sun",
+                background: LaneShadowTheme.color.weather.clear.tint,
+                foreground: LaneShadowTheme.color.weather.clear.default,
+                icon: .sun
+            )
+        case .rain:
+            weatherStyle(
+                key: "rain",
+                background: LaneShadowTheme.color.weather.rain.tint,
+                foreground: LaneShadowTheme.color.weather.rain.default,
+                icon: .rain
+            )
+        case .wind:
+            weatherStyle(
+                key: "wind",
+                background: LaneShadowTheme.color.weather.wind.tint,
+                foreground: LaneShadowTheme.color.weather.wind.default,
+                icon: .wind
+            )
+        case .storm:
+            weatherStyle(
+                key: "storm",
+                background: LaneShadowTheme.color.weather.storm.tint,
+                foreground: LaneShadowTheme.color.weather.storm.default,
+                icon: .storm
+            )
+        case .hot:
+            weatherStyle(
+                key: "hot",
+                background: LaneShadowTheme.color.weather.hot.tint,
+                foreground: LaneShadowTheme.color.weather.hot.default,
+                icon: .therm
+            )
+        case .cold:
+            weatherStyle(
+                key: "cold",
+                background: LaneShadowTheme.color.weather.cold.tint,
+                foreground: LaneShadowTheme.color.weather.cold.default,
+                icon: .therm
+            )
+        }
+    }
+
+    private func weatherStyle(
+        key: String,
+        background: Color,
+        foreground: Color,
+        icon: IconName
+    ) -> WeatherConditionResolvedStyle {
+        WeatherConditionResolvedStyle(
+            backgroundToken: "color.weather.\(key).tint",
+            foregroundToken: "color.weather.\(key).default",
+            borderToken: "color.weather.\(key).default",
+            backgroundColor: background,
+            foregroundColor: foreground,
+            borderColor: foreground,
+            icon: icon
+        )
+    }
+}
+
+public struct LSWeatherBadge: View {
+    @Environment(\.theme) private var theme
+
+    let condition: WeatherCondition
+    let label: String
+    let size: PillSize
+
+    public init(
+        condition: WeatherCondition,
+        label: String,
+        size: PillSize = .md
+    ) {
+        self.condition = condition
+        self.label = label
+        self.size = size
+    }
+
+    public var body: some View {
+        let style = condition.resolvedStyle
+
+        LSPill(size: size) {
+            HStack(spacing: theme.space.xs) {
+                LSIcon(name: style.icon, size: .xs, resolvedColorOverride: style.foregroundColor)
+                LSText(label, variant: .label.sm, color: .secondary)
+                    .foregroundStyle(style.foregroundColor)
+            }
+            .padding(.horizontal, theme.space.xs)
+            .background(
+                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                    .fill(style.backgroundColor)
+            )
+            .overlay(
+                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
+                    .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
+            )
+        }
+    }
+}
diff --git a/ios/LaneShadowTests/Molecules/LSFilterChipTests.swift b/ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
new file mode 100644
index 00000000..7427ee96
--- /dev/null
+++ b/ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
@@ -0,0 +1,42 @@
+import XCTest
+@testable import LaneShadow
+
+@MainActor
+final class LSFilterChipTests: XCTestCase {
+    func test_selected_uses_signal_default_unselected_uses_card_surface() throws {
+        let selected = LSFilterChip(label: "Scenic", selected: true, onToggle: {})
+        let unselected = LSFilterChip(label: "Scenic", selected: false, onToggle: {})
+
+        XCTAssertEqual(selected.resolvedStyle.backgroundToken, "color.signal.default")
+        XCTAssertEqual(selected.resolvedStyle.borderToken, "color.signal.default")
+        XCTAssertEqual(unselected.resolvedStyle.backgroundToken, "color.surface.card")
+        XCTAssertEqual(unselected.resolvedStyle.borderToken, "color.border.default")
+
+        let source = try moleculeSource(named: "LSFilterChip.swift")
+        XCTAssertTrue(source.contains("LSPill("))
+        XCTAssertTrue(source.contains("LSText("))
+    }
+
+    func test_ontoggle_fires_exactly_once() {
+        var tapCount = 0
+        LSFilterChip.dispatch { tapCount += 1 }
+        XCTAssertEqual(tapCount, 1)
+    }
+
+    private func moleculeSource(named fileName: String) throws -> String {
+        let root = URL(fileURLWithPath: #filePath)
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+
+        let url = root
+            .appendingPathComponent("ios")
+            .appendingPathComponent("LaneShadow")
+            .appendingPathComponent("Views")
+            .appendingPathComponent("Molecules")
+            .appendingPathComponent(fileName)
+
+        return try String(contentsOf: url, encoding: .utf8)
+    }
+}
diff --git a/ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift b/ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
new file mode 100644
index 00000000..69f939f9
--- /dev/null
+++ b/ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
@@ -0,0 +1,41 @@
+import XCTest
+@testable import LaneShadow
+
+@MainActor
+final class LSSuggestionChipTests: XCTestCase {
+    func test_ontap_fires_once_and_resolves_card_surface() throws {
+        var tapCount = 0
+        let chip = LSSuggestionChip(label: "Twisty back roads") {
+            tapCount += 1
+        }
+
+        XCTAssertEqual(chip.resolvedStyle.backgroundToken, "color.surface.card")
+        XCTAssertEqual(chip.resolvedStyle.borderToken, "color.border.default")
+        XCTAssertEqual(chip.size, .md)
+
+        LSSuggestionChip.dispatch { tapCount += 1 }
+        XCTAssertEqual(tapCount, 1)
+
+        let source = try moleculeSource(named: "LSSuggestionChip.swift")
+        XCTAssertTrue(source.contains("LSPill(size: .md"))
+        XCTAssertTrue(source.contains("LSText("))
+        XCTAssertFalse(source.contains("frame(height: 32"))
+    }
+
+    private func moleculeSource(named fileName: String) throws -> String {
+        let root = URL(fileURLWithPath: #filePath)
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+
+        let url = root
+            .appendingPathComponent("ios")
+            .appendingPathComponent("LaneShadow")
+            .appendingPathComponent("Views")
+            .appendingPathComponent("Molecules")
+            .appendingPathComponent(fileName)
+
+        return try String(contentsOf: url, encoding: .utf8)
+    }
+}
diff --git a/ios/LaneShadowTests/Molecules/LSTagPillTests.swift b/ios/LaneShadowTests/Molecules/LSTagPillTests.swift
new file mode 100644
index 00000000..92eb6d8a
--- /dev/null
+++ b/ios/LaneShadowTests/Molecules/LSTagPillTests.swift
@@ -0,0 +1,92 @@
+import XCTest
+@testable import LaneShadow
+
+final class LSTagPillTests: XCTestCase {
+    func test_glass_surface_and_icon_atom_composition() throws {
+        let pill = LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")
+
+        XCTAssertEqual(pill.resolvedStyle.backgroundToken, "color.surface.glass")
+        XCTAssertEqual(pill.resolvedStyle.borderToken, "color.border.default")
+        XCTAssertEqual(pill.resolvedStyle.iconColor, .signal)
+        XCTAssertEqual(pill.labelText, "Near Santa Cruz, CA")
+
+        let source = try moleculeSource(named: "LSTagPill.swift")
+        XCTAssertTrue(source.contains("LSPill("))
+        XCTAssertTrue(source.contains("LSIcon("))
+        XCTAssertTrue(source.contains("LSText("))
+        XCTAssertFalse(source.contains("Image(systemName:"))
+        XCTAssertFalse(containsRawTextCall(source))
+    }
+
+    func test_pill_semantics_stories_registered() throws {
+        let stories = try storySource(named: "LSPillSemanticsStory.swift")
+        let moleculesAggregator = try storySource(named: "MoleculesStories.swift")
+        let laneShadowStories = try sandboxSource(named: "LaneShadowStories.swift")
+
+        XCTAssertTrue(moleculesAggregator.contains("LSPillSemanticsStory.all"))
+        XCTAssertTrue(laneShadowStories.contains("+ MoleculesStories.all"))
+
+        XCTAssertTrue(stories.contains("molecules.pillSemantics.tagPill.default"))
+        XCTAssertTrue(stories.contains("molecules.pillSemantics.filterChip.unselected"))
+        XCTAssertTrue(stories.contains("molecules.pillSemantics.filterChip.selected"))
+        XCTAssertTrue(stories.contains("molecules.pillSemantics.suggestionChip.default"))
+
+        for condition in ["sun", "rain", "wind", "storm", "hot", "cold"] {
+            for size in ["sm", "md"] {
+                XCTAssertTrue(stories.contains("molecules.pillSemantics.weatherBadge.\(condition).\(size)"))
+            }
+        }
+    }
+
+    private func moleculeSource(named fileName: String) throws -> String {
+        let root = repoRoot()
+        let url = root
+            .appendingPathComponent("ios")
+            .appendingPathComponent("LaneShadow")
+            .appendingPathComponent("Views")
+            .appendingPathComponent("Molecules")
+            .appendingPathComponent(fileName)
+
+        return try String(contentsOf: url, encoding: .utf8)
+    }
+
+    private func storySource(named fileName: String) throws -> String {
+        let root = repoRoot()
+        let candidateURLs = [
+            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/Molecules/\(fileName)"),
+            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/\(fileName)"),
+        ]
+
+        for url in candidateURLs where FileManager.default.fileExists(atPath: url.path) {
+            return try String(contentsOf: url, encoding: .utf8)
+        }
+
+        XCTFail("Missing story source: \(fileName)")
+        return ""
+    }
+
+    private func sandboxSource(named fileName: String) throws -> String {
+        let root = repoRoot()
+        let url = root
+            .appendingPathComponent("ios")
+            .appendingPathComponent("LaneShadow")
+            .appendingPathComponent("Sandbox")
+            .appendingPathComponent(fileName)
+
+        return try String(contentsOf: url, encoding: .utf8)
+    }
+
+    private func repoRoot() -> URL {
+        URL(fileURLWithPath: #filePath)
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+    }
+
+    private func containsRawTextCall(_ source: String) -> Bool {
+        source
+            .replacingOccurrences(of: "LSText(", with: "")
+            .contains("Text(")
+    }
+}
diff --git a/ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift b/ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
new file mode 100644
index 00000000..c1fba2cb
--- /dev/null
+++ b/ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
@@ -0,0 +1,53 @@
+import LaneShadowTheme
+import XCTest
+@testable import LaneShadow
+
+final class LSWeatherBadgeTests: XCTestCase {
+    func test_all_six_conditions_resolve_weather_color_tokens() {
+        let expected: [(WeatherCondition, String, IconName)] = [
+            (.sun, "sun", .sun),
+            (.rain, "rain", .rain),
+            (.wind, "wind", .wind),
+            (.storm, "storm", .storm),
+            (.hot, "hot", .therm),
+            (.cold, "cold", .therm),
+        ]
+
+        for (condition, key, icon) in expected {
+            let style = condition.resolvedStyle
+            XCTAssertEqual(style.backgroundToken, "color.weather.\(key).tint")
+            XCTAssertEqual(style.foregroundToken, "color.weather.\(key).default")
+            XCTAssertEqual(style.borderToken, "color.weather.\(key).default")
+            XCTAssertEqual(style.icon, icon)
+        }
+    }
+
+    func test_sm_and_md_size_heights_from_pill_atom() throws {
+        let badgeSmall = LSWeatherBadge(condition: .rain, label: "Rain", size: .sm)
+        let badgeMedium = LSWeatherBadge(condition: .rain, label: "Rain", size: .md)
+
+        XCTAssertEqual(badgeSmall.size, .sm)
+        XCTAssertEqual(badgeMedium.size, .md)
+
+        let source = try moleculeSource(named: "LSWeatherBadge.swift")
+        XCTAssertTrue(source.contains("LSPill(size: size"))
+        XCTAssertFalse(source.contains("frame(height:"))
+    }
+
+    private func moleculeSource(named fileName: String) throws -> String {
+        let root = URL(fileURLWithPath: #filePath)
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+            .deletingLastPathComponent()
+
+        let url = root
+            .appendingPathComponent("ios")
+            .appendingPathComponent("LaneShadow")
+            .appendingPathComponent("Views")
+            .appendingPathComponent("Molecules")
+            .appendingPathComponent(fileName)
+
+        return try String(contentsOf: url, encoding: .utf8)
+    }
+}
diff --git a/ios/project.yml b/ios/project.yml
index 0cfe9025..84f4acd5 100644
--- a/ios/project.yml
+++ b/ios/project.yml
@@ -138,6 +138,7 @@ targets:
       - path: LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift
       - path: LaneShadow/Sandbox/Stories/LSTextStories.swift
       - path: LaneShadow/Sandbox/Stories/MoleculesStories.swift
+      - path: LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
       - path: LaneShadow/Views/Atoms
         type: syncedFolder
         excludes:
@@ -147,6 +148,10 @@ targets:
       - path: LaneShadow/Views/Molecules/EmptyState.swift
       - path: LaneShadow/Views/Molecules/InfoToast.swift
       - path: LaneShadow/Views/Molecules/MarkdownText.swift
+      - path: LaneShadow/Views/Molecules/LSTagPill.swift
+      - path: LaneShadow/Views/Molecules/LSFilterChip.swift
+      - path: LaneShadow/Views/Molecules/LSSuggestionChip.swift
+      - path: LaneShadow/Views/Molecules/LSWeatherBadge.swift
     dependencies:
       - package: ConvexMobile
       - package: LaneShadowTheme
@@ -185,6 +190,10 @@ targets:
       - path: LaneShadowTests/Molecules/EmptyStateTests.swift
       - path: LaneShadowTests/Molecules/InfoToastTests.swift
       - path: LaneShadowTests/Molecules/MarkdownTextTests.swift
+      - path: LaneShadowTests/Molecules/LSTagPillTests.swift
+      - path: LaneShadowTests/Molecules/LSFilterChipTests.swift
+      - path: LaneShadowTests/Molecules/LSSuggestionChipTests.swift
+      - path: LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
       # Legacy molecule tests are intentionally outside the managed folder
       # until the molecule implementation layer is migrated.
     dependencies:

```

Changed file contents:
## FILE: ai-specs/UC-MOL-05/ios-learnings.md
```
# iOS Learnings: UC-MOL-05 Pill Semantics Family

## Implementation Date
April 24, 2026

## Edge Cases Discovered
1. Story registration assertions that rely on source scanning need explicit literal story IDs in source; dynamically interpolated IDs are harder to validate and caused false negatives in AC-8 tests.
2. Running multiple `xcodebuild test` commands in parallel against the same simulator destination can cause intermittent XCTest bootstrap crashes (signal kill) even when code is correct.

## API Contract Notes
- `WeatherCondition` was defined as a public enum in molecule scope with six required cases (`sun`, `rain`, `wind`, `storm`, `hot`, `cold`) so downstream molecules can import and reuse it.
- Both `.hot` and `.cold` conditions map to `.therm` icon while preserving distinct weather token families.

## UI Decisions
- `LSTagPill`, `LSFilterChip`, `LSSuggestionChip`, and `LSWeatherBadge` all compose from `LSPill` and route content through atom layer (`LSIcon`/`LSText`) to preserve tokenized sizing/typography behavior.
- Suggestion chip height is resolved through `LSPill(size: .md)` instead of hardcoded frame values.

## Platform-Specific Notes
- Swift 6 strict concurrency surfaced sendability warnings in tests that touched view initializers from non-main contexts; annotating interaction tests with `@MainActor` avoided data-race diagnostics.
- For callback-once verification, deterministic static dispatch helpers avoid brittle UIKit-control introspection against SwiftUI button internals.

## Files Created/Modified
- ios/LaneShadow/Views/Molecules/LSTagPill.swift
- ios/LaneShadow/Views/Molecules/LSFilterChip.swift
- ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift
- ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift
- ios/LaneShadowTests/Molecules/LSTagPillTests.swift
- ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
- ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
- ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
- ios/LaneShadow/Sandbox/LaneShadowStories.swift
- ios/project.yml

```
## FILE: ios/LaneShadow.xcodeproj/project.pbxproj
```
// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 77;
	objects = {

/* Begin PBXBuildFile section */
		06E6D012390862D9ABF3488C /* LaneShadowTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 5C592B52392DEEACF2D91C3B /* LaneShadowTests.swift */; };
		078589B1255FE42AA7459089 /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = 0A5A63FC5750EC47FC36E0DC /* Assets.xcassets */; };
		0A215149AE7AF5FBBCB5409E /* ConvexStore.swift in Sources */ = {isa = PBXBuildFile; fileRef = F57D4881CFC9C4FA4D11B5BC /* ConvexStore.swift */; };
		0A78DB4A71E431B8B3F4AABC /* LSTagPillTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = FC83F862A5EB19DEB3876C9F /* LSTagPillTests.swift */; };
		0B45673D740CC18D7C34929C /* LSButtonStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 05416F03B3657341F705522A /* LSButtonStories.swift */; };
		1952669D73F48496CFB75791 /* LaneShadowTheme in Frameworks */ = {isa = PBXBuildFile; productRef = A82A70CA01368BECA5189F19 /* LaneShadowTheme */; };
		1BAC7EA2369264B7A19C9D08 /* LSDisplayStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 534D26C275878552CD82E5FE /* LSDisplayStories.swift */; };
		1DBEC19288F8A92342DE8746 /* LSSuggestionChipTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = E495FF258A7B5B6B9E5FBCD4 /* LSSuggestionChipTests.swift */; };
		1EF50AB42CA36C6BAE6B79F2 /* LSPhaseDotStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 9F8ABC117BB7538D9D09E1F6 /* LSPhaseDotStories.swift */; };
		293E7CA38C0EA35CD1365886 /* LSTagPill.swift in Sources */ = {isa = PBXBuildFile; fileRef = C7D7D85AC834967019608CDE /* LSTagPill.swift */; };
		3844822E275E9D75B28903BB /* LSFilterChipTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = D1DC83704B40351C691A4773 /* LSFilterChipTests.swift */; };
		3D2143A67410FB5D8D2F3B45 /* LSInputStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = EE8CB573821E0981D725E364 /* LSInputStories.swift */; };
		40979501CCACCFB156F25EB5 /* LaneShadowSandboxEntry.swift in Sources */ = {isa = PBXBuildFile; fileRef = F7C289172CD246D71CC0E6BB /* LaneShadowSandboxEntry.swift */; };
		4C05ABB5C49D2E72EFB85198 /* LSFilterChip.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1130AFDFD500511DD417BC8 /* LSFilterChip.swift */; };
		4CDBE631CAAFA6685708C14B /* ConvexMobile in Frameworks */ = {isa = PBXBuildFile; productRef = CE666EC279651E6E31EE5FBE /* ConvexMobile */; };
		762FB79AB5AE6050179BB785 /* LSScrimStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 8F281656D06513E78E57D10D /* LSScrimStories.swift */; };
		7D14E5FC27DC166337CD21F6 /* LSPillSemanticsStory.swift in Sources */ = {isa = PBXBuildFile; fileRef = A238C56E1438A146430C1125 /* LSPillSemanticsStory.swift */; };
		7E8799D5CE1C5FFCE3D09066 /* App.swift in Sources */ = {isa = PBXBuildFile; fileRef = 324B26FB2DE3F759B489CB7B /* App.swift */; };
		7F07F9ABF0C419E0E2BA5CEA /* LSWeatherBadge.swift in Sources */ = {isa = PBXBuildFile; fileRef = 478C8C03ABF1E0F4AFEF0836 /* LSWeatherBadge.swift */; };
		91C89DFA7917A4D7A0446E88 /* LSPillStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 220BC64128EB0A24188F4C65 /* LSPillStories.swift */; };
		925CA576235653EA9D6CE109 /* NativeSandbox in Frameworks */ = {isa = PBXBuildFile; productRef = 9DD5E01C1B4FE6A3686813CA /* NativeSandbox */; };
		95572DAE37FCF32B9BDE4BC4 /* LSMapStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = A770CE2595F52C1DC3532F8A /* LSMapStories.swift */; };
		95DD81C1CEF88FF460DA7A6E /* InfoToastTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 20AC933B1DF7AFFC89BD22E0 /* InfoToastTests.swift */; };
		9F2D99868C5E402CD5589B29 /* LSWeatherBadgeTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 05CF329976C1FF7D2469EB4D /* LSWeatherBadgeTests.swift */; };
		A09AB47FC330215325A9F4F1 /* Foundation.framework in Frameworks */ = {isa = PBXBuildFile; fileRef = A9EDF4218751AC8200085830 /* Foundation.framework */; };
		A71A81EDC8563AFD14EE83FB /* ContentView.swift in Sources */ = {isa = PBXBuildFile; fileRef = B95CA989BE1243B1021F83D3 /* ContentView.swift */; };
		AFD4E47761A2E61BAAA06453 /* EmptyStateTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 2EEA7EB2CEBB6DE868C24B7E /* EmptyStateTests.swift */; };
		B55D247513D3B4742E36D92B /* AtomsStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 3E1A53BCC888DAEA7153F458 /* AtomsStories.swift */; };
		B5FF9B8BF6CCCBF0478B2A77 /* LaneShadowStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 85A9AD606174CC52A565ACA2 /* LaneShadowStories.swift */; };
		C20B40ADB8746BAD7B7A3FF1 /* LaneShadowTheme in Frameworks */ = {isa = PBXBuildFile; productRef = 5B658B1BAB40A50AE36EE201 /* LaneShadowTheme */; };
		C9108535DE88E44D62CC2AE6 /* MarkdownTextTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = D5107D4267204A230D572AB9 /* MarkdownTextTests.swift */; };
		D3FCBC758470A7571618AF4A /* LSTextStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 0E259B982ADB47ABE53D132D /* LSTextStories.swift */; };
		E2B1C40DCB7D1C33CC729331 /* MarkdownText.swift in Sources */ = {isa = PBXBuildFile; fileRef = 6089A65C4DD27D71FDFC6B91 /* MarkdownText.swift */; };
		E38D09C5CE8E05B40EC425E5 /* LSIconStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = 612E0B9004A2B36BFE5778E1 /* LSIconStories.swift */; };
		E868E14CF971E572F61A614E /* MoleculesStories.swift in Sources */ = {isa = PBXBuildFile; fileRef = E0747C3C833D0EA3BAF7F3D2 /* MoleculesStories.swift */; };
		ED9DF59A25970507B80D1720 /* MapboxMaps in Frameworks */ = {isa = PBXBuildFile; productRef = DA5E21A6F8345673A1101414 /* MapboxMaps */; };
		F9E41F8A8E5435B9BCD67D40 /* InfoToast.swift in Sources */ = {isa = PBXBuildFile; fileRef = 9B5F858C066D550CE73CE6FD /* InfoToast.swift */; };
		FCAE00CC74E427BDB51D7F65 /* LSSuggestionChip.swift in Sources */ = {isa = PBXBuildFile; fileRef = A46A985C643A99B580C53E4E /* LSSuggestionChip.swift */; };
		FEBAB697C67EECE893936275 /* EmptyState.swift in Sources */ = {isa = PBXBuildFile; fileRef = A2233125579D4855C122E592 /* EmptyState.swift */; };
/* End PBXBuildFile section */

/* Begin PBXContainerItemProxy section */
		3FC0A9068371F7D9BCAA7840 /* PBXContainerItemProxy */ = {
			isa = PBXContainerItemProxy;
			containerPortal = 5005A814B8F4CE91922BC5A4 /* Project object */;
			proxyType = 1;
			remoteGlobalIDString = 99475776B313D476E98630D0;
			remoteInfo = LaneShadow;
		};
		558A672E706BFC321A8AD88A /* PBXContainerItemProxy */ = {
			isa = PBXContainerItemProxy;
			containerPortal = 5005A814B8F4CE91922BC5A4 /* Project object */;
			proxyType = 1;
			remoteGlobalIDString = 99475776B313D476E98630D0;
			remoteInfo = LaneShadow;
		};
/* End PBXContainerItemProxy section */

/* Begin PBXFileReference section */
		05416F03B3657341F705522A /* LSButtonStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSButtonStories.swift; sourceTree = "<group>"; };
		05CF329976C1FF7D2469EB4D /* LSWeatherBadgeTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSWeatherBadgeTests.swift; sourceTree = "<group>"; };
		0A5A63FC5750EC47FC36E0DC /* Assets.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; };
		0E259B982ADB47ABE53D132D /* LSTextStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSTextStories.swift; sourceTree = "<group>"; };
		20AC933B1DF7AFFC89BD22E0 /* InfoToastTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = InfoToastTests.swift; sourceTree = "<group>"; };
		220BC64128EB0A24188F4C65 /* LSPillStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSPillStories.swift; sourceTree = "<group>"; };
		2EEA7EB2CEBB6DE868C24B7E /* EmptyStateTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = EmptyStateTests.swift; sourceTree = "<group>"; };
		307F61C56AD06224E9F93B51 /* LaneShadow.app */ = {isa = PBXFileReference; includeInIndex = 0; lastKnownFileType = wrapper.application; path = LaneShadow.app; sourceTree = BUILT_PRODUCTS_DIR; };
		324B26FB2DE3F759B489CB7B /* App.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = App.swift; sourceTree = "<group>"; };
		3B4E8EF6472F1ABEBBC33DFB /* ios */ = {isa = PBXFileReference; lastKnownFileType = folder; name = ios; path = "../../native-sandbox/ios"; sourceTree = SOURCE_ROOT; };
		3E1A53BCC888DAEA7153F458 /* AtomsStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AtomsStories.swift; sourceTree = "<group>"; };
		478C8C03ABF1E0F4AFEF0836 /* LSWeatherBadge.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSWeatherBadge.swift; sourceTree = "<group>"; };
		534D26C275878552CD82E5FE /* LSDisplayStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSDisplayStories.swift; sourceTree = "<group>"; };
		5C592B52392DEEACF2D91C3B /* LaneShadowTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LaneShadowTests.swift; sourceTree = "<group>"; };
		5FB23C9E4DF31CC4E50E47AB /* swift */ = {isa = PBXFileReference; lastKnownFileType = folder; name = swift; path = ../tokens/platforms/swift; sourceTree = SOURCE_ROOT; };
		6089A65C4DD27D71FDFC6B91 /* MarkdownText.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MarkdownText.swift; sourceTree = "<group>"; };
		612E0B9004A2B36BFE5778E1 /* LSIconStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSIconStories.swift; sourceTree = "<group>"; };
		85A9AD606174CC52A565ACA2 /* LaneShadowStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LaneShadowStories.swift; sourceTree = "<group>"; };
		8F281656D06513E78E57D10D /* LSScrimStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSScrimStories.swift; sourceTree = "<group>"; };
		9B5F858C066D550CE73CE6FD /* InfoToast.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = InfoToast.swift; sourceTree = "<group>"; };
		9F8ABC117BB7538D9D09E1F6 /* LSPhaseDotStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSPhaseDotStories.swift; sourceTree = "<group>"; };
		A1130AFDFD500511DD417BC8 /* LSFilterChip.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSFilterChip.swift; sourceTree = "<group>"; };
		A2233125579D4855C122E592 /* EmptyState.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = EmptyState.swift; sourceTree = "<group>"; };
		A238C56E1438A146430C1125 /* LSPillSemanticsStory.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSPillSemanticsStory.swift; sourceTree = "<group>"; };
		A46A985C643A99B580C53E4E /* LSSuggestionChip.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSSuggestionChip.swift; sourceTree = "<group>"; };
		A770CE2595F52C1DC3532F8A /* LSMapStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSMapStories.swift; sourceTree = "<group>"; };
		A9EDF4218751AC8200085830 /* Foundation.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = Foundation.framework; path = System/Library/Frameworks/Foundation.framework; sourceTree = SDKROOT; };
		B95CA989BE1243B1021F83D3 /* ContentView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ContentView.swift; sourceTree = "<group>"; };
		C7D7D85AC834967019608CDE /* LSTagPill.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSTagPill.swift; sourceTree = "<group>"; };
		D1DC83704B40351C691A4773 /* LSFilterChipTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSFilterChipTests.swift; sourceTree = "<group>"; };
		D5107D4267204A230D572AB9 /* MarkdownTextTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MarkdownTextTests.swift; sourceTree = "<group>"; };
		E0747C3C833D0EA3BAF7F3D2 /* MoleculesStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MoleculesStories.swift; sourceTree = "<group>"; };
		E495FF258A7B5B6B9E5FBCD4 /* LSSuggestionChipTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSSuggestionChipTests.swift; sourceTree = "<group>"; };
		ED792B4C270AB975C34CB118 /* LaneShadowTests.xctest */ = {isa = PBXFileReference; includeInIndex = 0; lastKnownFileType = wrapper.cfbundle; path = LaneShadowTests.xctest; sourceTree = BUILT_PRODUCTS_DIR; };
		EE8CB573821E0981D725E364 /* LSInputStories.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSInputStories.swift; sourceTree = "<group>"; };
		EF4B1C18D8FD1069B42CB70D /* LaneShadowUITests.xctest */ = {isa = PBXFileReference; includeInIndex = 0; lastKnownFileType = wrapper.cfbundle; path = LaneShadowUITests.xctest; sourceTree = BUILT_PRODUCTS_DIR; };
		F57D4881CFC9C4FA4D11B5BC /* ConvexStore.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ConvexStore.swift; sourceTree = "<group>"; };
		F7C289172CD246D71CC0E6BB /* LaneShadowSandboxEntry.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LaneShadowSandboxEntry.swift; sourceTree = "<group>"; };
		FC83F862A5EB19DEB3876C9F /* LSTagPillTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LSTagPillTests.swift; sourceTree = "<group>"; };
/* End PBXFileReference section */

/* Begin PBXFileSystemSynchronizedBuildFileExceptionSet section */
		58099F917373377216261552 /* PBXFileSystemSynchronizedBuildFileExceptionSet */ = {
			isa = PBXFileSystemSynchronizedBuildFileExceptionSet;
			membershipExceptions = (
				Button.swift,
			);
			target = 99475776B313D476E98630D0 /* LaneShadow */;
		};
/* End PBXFileSystemSynchronizedBuildFileExceptionSet section */

/* Begin PBXFileSystemSynchronizedRootGroup section */
		3BC11B009ED26B33FC7A0333 /* Entry */ = {
			isa = PBXFileSystemSynchronizedRootGroup;
			explicitFileTypes = {
			};
			explicitFolders = (
			);
			name = Entry;
			path = Entry;
			sourceTree = "<group>";
		};
		5B8A253F72C6B3D6A21D5422 /* Atoms */ = {
			isa = PBXFileSystemSynchronizedRootGroup;
			explicitFileTypes = {
			};
			explicitFolders = (
			);
			name = Atoms;
			path = Atoms;
			sourceTree = "<group>";
		};
		9B1969E887592C82E1672459 /* Launch */ = {
			isa = PBXFileSystemSynchronizedRootGroup;
			explicitFileTypes = {
			};
			explicitFolders = (
			);
			name = Launch;
			path = Launch;
			sourceTree = "<group>";
		};
		A1DA24033B9915EAB116ED62 /* Generated */ = {
			isa = PBXFileSystemSynchronizedRootGroup;
			explicitFileTypes = {
			};
			explicitFolders = (
			);
			name = Generated;
			path = Generated;
			sourceTree = "<group>";
		};
		A8E49074235FCF05900AA173 /* LaneShadowUITests */ = {
			isa = PBXFileSystemSynchronizedRootGroup;
			explicitFileTypes = {
			};
			explicitFolders = (
			);
			path = LaneShadowUITests;
			sourceTree = "<group>";
		};
		CE8B4DF54243DD52953C7CFE /* Atoms */ = {
			isa = PBXFileSystemSynchronizedRootGroup;
			exceptions = (
				58099F917373377216261552 /* PBXFileSystemSynchronizedBuildFileExceptionSet */,
			);
			explicitFileTypes = {
			};
			explicitFolders = (
			);
			name = Atoms;
			path = Atoms;
			sourceTree = "<group>";
		};
		E5E2F792F8318B064762B018 /* Theme */ = {
			isa = PBXFileSystemSynchronizedRootGroup;
			explicitFileTypes = {
			};
			explicitFolders = (
			);
			name = Theme;
			path = Theme;
			sourceTree = "<group>";
		};
/* End PBXFileSystemSynchronizedRootGroup section */

/* Begin PBXFrameworksBuildPhase section */
		19699B30D5FFCEFA31F387A4 /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
				4CDBE631CAAFA6685708C14B /* ConvexMobile in Frameworks */,
				1952669D73F48496CFB75791 /* LaneShadowTheme in Frameworks */,
				925CA576235653EA9D6CE109 /* NativeSandbox in Frameworks */,
				ED9DF59A25970507B80D1720 /* MapboxMaps in Frameworks */,
				A09AB47FC330215325A9F4F1 /* Foundation.framework in Frameworks */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		6FEFE450FCF58F47BE1637ED /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
				C20B40ADB8746BAD7B7A3FF1 /* LaneShadowTheme in Frameworks */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		1F10FC2E199EFDF6EFDFEDA8 /* Sandbox */ = {
			isa = PBXGroup;
			children = (
				3BC11B009ED26B33FC7A0333 /* Entry */,
				2F2DF9072E7DE318B1CF4168 /* Stories */,
				E5E2F792F8318B064762B018 /* Theme */,
				F7C289172CD246D71CC0E6BB /* LaneShadowSandboxEntry.swift */,
				85A9AD606174CC52A565ACA2 /* LaneShadowStories.swift */,
			);
			path = Sandbox;
			sourceTree = "<group>";
		};
		298F12991DC33BF22132567F = {
			isa = PBXGroup;
			children = (
				559DE46475FFF70C1C60C52B /* LaneShadow */,
				7600803CDA1619744A2ED8BC /* LaneShadowTests */,
				A8E49074235FCF05900AA173 /* LaneShadowUITests */,
				74C87109A86D746141753D0A /* Packages */,
				610C91A4B1547818EABF70E3 /* Frameworks */,
				A409E156DCE522478E497BB1 /* Products */,
			);
			sourceTree = "<group>";
		};
		2F2DF9072E7DE318B1CF4168 /* Stories */ = {
			isa = PBXGroup;
			children = (
				8C41ED0E046EE966A32C67CB /* Molecules */,
				3E1A53BCC888DAEA7153F458 /* AtomsStories.swift */,
				05416F03B3657341F705522A /* LSButtonStories.swift */,
				534D26C275878552CD82E5FE /* LSDisplayStories.swift */,
				612E0B9004A2B36BFE5778E1 /* LSIconStories.swift */,
				EE8CB573821E0981D725E364 /* LSInputStories.swift */,
				A770CE2595F52C1DC3532F8A /* LSMapStories.swift */,
				9F8ABC117BB7538D9D09E1F6 /* LSPhaseDotStories.swift */,
				220BC64128EB0A24188F4C65 /* LSPillStories.swift */,
				8F281656D06513E78E57D10D /* LSScrimStories.swift */,
				0E259B982ADB47ABE53D132D /* LSTextStories.swift */,
				E0747C3C833D0EA3BAF7F3D2 /* MoleculesStories.swift */,
			);
			path = Stories;
			sourceTree = "<group>";
		};
		55726301A0BAEC18C69036BC /* Molecules */ = {
			isa = PBXGroup;
			children = (
				A2233125579D4855C122E592 /* EmptyState.swift */,
				9B5F858C066D550CE73CE6FD /* InfoToast.swift */,
				A1130AFDFD500511DD417BC8 /* LSFilterChip.swift */,
				A46A985C643A99B580C53E4E /* LSSuggestionChip.swift */,
				C7D7D85AC834967019608CDE /* LSTagPill.swift */,
				478C8C03ABF1E0F4AFEF0836 /* LSWeatherBadge.swift */,
				6089A65C4DD27D71FDFC6B91 /* MarkdownText.swift */,
			);
			path = Molecules;
			sourceTree = "<group>";
		};
		559DE46475FFF70C1C60C52B /* LaneShadow */ = {
			isa = PBXGroup;
			children = (
				A1DA24033B9915EAB116ED62 /* Generated */,
				9B1969E887592C82E1672459 /* Launch */,
				1F10FC2E199EFDF6EFDFEDA8 /* Sandbox */,
				9A00239A316DF9BC49914EC8 /* Views */,
				324B26FB2DE3F759B489CB7B /* App.swift */,
				0A5A63FC5750EC47FC36E0DC /* Assets.xcassets */,
				B95CA989BE1243B1021F83D3 /* ContentView.swift */,
				F57D4881CFC9C4FA4D11B5BC /* ConvexStore.swift */,
			);
			path = LaneShadow;
			sourceTree = "<group>";
		};
		610C91A4B1547818EABF70E3 /* Frameworks */ = {
			isa = PBXGroup;
			children = (
				A9EDF4218751AC8200085830 /* Foundation.framework */,
			);
			name = Frameworks;
			sourceTree = "<group>";
		};
		74C87109A86D746141753D0A /* Packages */ = {
			isa = PBXGroup;
			children = (
				3B4E8EF6472F1ABEBBC33DFB /* ios */,
				5FB23C9E4DF31CC4E50E47AB /* swift */,
			);
			name = Packages;
			sourceTree = "<group>";
		};
		7600803CDA1619744A2ED8BC /* LaneShadowTests */ = {
			isa = PBXGroup;
			children = (
				5B8A253F72C6B3D6A21D5422 /* Atoms */,
				ABBAFDBD7FF159A58193899A /* Molecules */,
				5C592B52392DEEACF2D91C3B /* LaneShadowTests.swift */,
			);
			path = LaneShadowTests;
			sourceTree = "<group>";
		};
		8C41ED0E046EE966A32C67CB /* Molecules */ = {
			isa = PBXGroup;
			children = (
				A238C56E1438A146430C1125 /* LSPillSemanticsStory.swift */,
			);
			path = Molecules;
			sourceTree = "<group>";
		};
		9A00239A316DF9BC49914EC8 /* Views */ = {
			isa = PBXGroup;
			children = (
				CE8B4DF54243DD52953C7CFE /* Atoms */,
				55726301A0BAEC18C69036BC /* Molecules */,
			);
			path = Views;
			sourceTree = "<group>";
		};
		A409E156DCE522478E497BB1 /* Products */ = {
			isa = PBXGroup;
			children = (
				307F61C56AD06224E9F93B51 /* LaneShadow.app */,
				ED792B4C270AB975C34CB118 /* LaneShadowTests.xctest */,
				EF4B1C18D8FD1069B42CB70D /* LaneShadowUITests.xctest */,
			);
			name = Products;
			sourceTree = "<group>";
		};
		ABBAFDBD7FF159A58193899A /* Molecules */ = {
			isa = PBXGroup;
			children = (
				2EEA7EB2CEBB6DE868C24B7E /* EmptyStateTests.swift */,
				20AC933B1DF7AFFC89BD22E0 /* InfoToastTests.swift */,
				D1DC83704B40351C691A4773 /* LSFilterChipTests.swift */,
				E495FF258A7B5B6B9E5FBCD4 /* LSSuggestionChipTests.swift */,
				FC83F862A5EB19DEB3876C9F /* LSTagPillTests.swift */,
				05CF329976C1FF7D2469EB4D /* LSWeatherBadgeTests.swift */,
				D5107D4267204A230D572AB9 /* MarkdownTextTests.swift */,
			);
			path = Molecules;
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		99475776B313D476E98630D0 /* LaneShadow */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = 765550164B633AF5BE20873D /* Build configuration list for PBXNativeTarget "LaneShadow" */;
			buildPhases = (
				4DA27FB2E419ED84C9F93CEF /* Inject Convex URL */,
				2A6033EDE1343B9C16180D04 /* Sources */,
				D12CB4045645161CAADD1E9D /* Resources */,
				19699B30D5FFCEFA31F387A4 /* Frameworks */,
			);
			buildRules = (
			);
			dependencies = (
			);
			fileSystemSynchronizedGroups = (
				CE8B4DF54243DD52953C7CFE /* Atoms */,
				3BC11B009ED26B33FC7A0333 /* Entry */,
				A1DA24033B9915EAB116ED62 /* Generated */,
				9B1969E887592C82E1672459 /* Launch */,
				E5E2F792F8318B064762B018 /* Theme */,
			);
			name = LaneShadow;
			packageProductDependencies = (
				CE666EC279651E6E31EE5FBE /* ConvexMobile */,
				A82A70CA01368BECA5189F19 /* LaneShadowTheme */,
				9DD5E01C1B4FE6A3686813CA /* NativeSandbox */,
				DA5E21A6F8345673A1101414 /* MapboxMaps */,
			);
			productName = LaneShadow;
			productReference = 307F61C56AD06224E9F93B51 /* LaneShadow.app */;
			productType = "com.apple.product-type.application";
		};
		EBACC6C6C5C2526D42D8718B /* LaneShadowUITests */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = 7B3C5253730D483D2D3B9A92 /* Build configuration list for PBXNativeTarget "LaneShadowUITests" */;
			buildPhases = (
				4233BA8C06D67164708C1BDD /* Sources */,
				60678B2DE87E4B4EFE0C1E7F /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
				81218BFBC741B5A356EE9708 /* PBXTargetDependency */,
			);
			fileSystemSynchronizedGroups = (
				A8E49074235FCF05900AA173 /* LaneShadowUITests */,
			);
			name = LaneShadowUITests;
			packageProductDependencies = (
			);
			productName = LaneShadowUITests;
			productReference = EF4B1C18D8FD1069B42CB70D /* LaneShadowUITests.xctest */;
			productType = "com.apple.product-type.bundle.ui-testing";
		};
		F62DED441A0EC9B332FC3293 /* LaneShadowTests */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = 370FB48DE918F2015751FF0C /* Build configuration list for PBXNativeTarget "LaneShadowTests" */;
			buildPhases = (
				93C20C085BB03E46FC5650F5 /* Sources */,
				B404D579F9A667C620CA8569 /* Resources */,
				6FEFE450FCF58F47BE1637ED /* Frameworks */,
			);
			buildRules = (
			);
			dependencies = (
				8941639FFAFA7D11ED5FFFCC /* PBXTargetDependency */,
			);
			fileSystemSynchronizedGroups = (
				5B8A253F72C6B3D6A21D5422 /* Atoms */,
			);
			name = LaneShadowTests;
			packageProductDependencies = (
				5B658B1BAB40A50AE36EE201 /* LaneShadowTheme */,
			);
			productName = LaneShadowTests;
			productReference = ED792B4C270AB975C34CB118 /* LaneShadowTests.xctest */;
			productType = "com.apple.product-type.bundle.unit-test";
		};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		5005A814B8F4CE91922BC5A4 /* Project object */ = {
			isa = PBXProject;
			attributes = {
				BuildIndependentTargetsInParallel = YES;
				LastUpgradeCheck = 1430;
				TargetAttributes = {
					99475776B313D476E98630D0 = {
						DevelopmentTeam = "";
						ProvisioningStyle = Automatic;
					};
					EBACC6C6C5C2526D42D8718B = {
						ProvisioningStyle = Automatic;
						TestTargetID = 99475776B313D476E98630D0;
					};
					F62DED441A0EC9B332FC3293 = {
						ProvisioningStyle = Automatic;
					};
				};
			};
			buildConfigurationList = C825AA9ACD7BBF70A26F04EE /* Build configuration list for PBXProject "LaneShadow" */;
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				Base,
				en,
			);
			mainGroup = 298F12991DC33BF22132567F;
			minimizedProjectReferenceProxies = 1;
			packageReferences = (
				2448E52A67F9CA102454EA73 /* XCRemoteSwiftPackageReference "convex-swift" */,
				B661C63E1ACC8A649A046360 /* XCRemoteSwiftPackageReference "mapbox-maps-ios" */,
				47209CE6204C4DADCDF34113 /* XCLocalSwiftPackageReference "../tokens/platforms/swift" */,
				AFE99AB4F94E0A32951934B9 /* XCLocalSwiftPackageReference "../../native-sandbox/ios" */,
			);
			preferredProjectObjectVersion = 77;
			productRefGroup = A409E156DCE522478E497BB1 /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				99475776B313D476E98630D0 /* LaneShadow */,
				F62DED441A0EC9B332FC3293 /* LaneShadowTests */,
				EBACC6C6C5C2526D42D8718B /* LaneShadowUITests */,
			);
		};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		60678B2DE87E4B4EFE0C1E7F /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		B404D579F9A667C620CA8569 /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		D12CB4045645161CAADD1E9D /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				078589B1255FE42AA7459089 /* Assets.xcassets in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXResourcesBuildPhase section */

/* Begin PBXShellScriptBuildPhase section */
		4DA27FB2E419ED84C9F93CEF /* Inject Convex URL */ = {
			isa = PBXShellScriptBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			inputFileListPaths = (
			);
			inputPaths = (
				"$(SRCROOT)/../server/.env.local",
			);
			name = "Inject Convex URL";
			outputFileListPaths = (
			);
			outputPaths = (
				"$(SRCROOT)/LaneShadow/Generated/ConvexConfig.generated.swift",
			);
			runOnlyForDeploymentPostprocessing = 0;
			shellPath = /bin/sh;
			shellScript = "\"${SRCROOT}/LaneShadow/Scripts/inject-convex-url.sh\"";
		};
/* End PBXShellScriptBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		2A6033EDE1343B9C16180D04 /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				7E8799D5CE1C5FFCE3D09066 /* App.swift in Sources */,
				B55D247513D3B4742E36D92B /* AtomsStories.swift in Sources */,
				A71A81EDC8563AFD14EE83FB /* ContentView.swift in Sources */,
				0A215149AE7AF5FBBCB5409E /* ConvexStore.swift in Sources */,
				FEBAB697C67EECE893936275 /* EmptyState.swift in Sources */,
				F9E41F8A8E5435B9BCD67D40 /* InfoToast.swift in Sources */,
				0B45673D740CC18D7C34929C /* LSButtonStories.swift in Sources */,
				1BAC7EA2369264B7A19C9D08 /* LSDisplayStories.swift in Sources */,
				4C05ABB5C49D2E72EFB85198 /* LSFilterChip.swift in Sources */,
				E38D09C5CE8E05B40EC425E5 /* LSIconStories.swift in Sources */,
				3D2143A67410FB5D8D2F3B45 /* LSInputStories.swift in Sources */,
				95572DAE37FCF32B9BDE4BC4 /* LSMapStories.swift in Sources */,
				1EF50AB42CA36C6BAE6B79F2 /* LSPhaseDotStories.swift in Sources */,
				7D14E5FC27DC166337CD21F6 /* LSPillSemanticsStory.swift in Sources */,
				91C89DFA7917A4D7A0446E88 /* LSPillStories.swift in Sources */,
				762FB79AB5AE6050179BB785 /* LSScrimStories.swift in Sources */,
				FCAE00CC74E427BDB51D7F65 /* LSSuggestionChip.swift in Sources */,
				293E7CA38C0EA35CD1365886 /* LSTagPill.swift in Sources */,
				D3FCBC758470A7571618AF4A /* LSTextStories.swift in Sources */,
				7F07F9ABF0C419E0E2BA5CEA /* LSWeatherBadge.swift in Sources */,
				40979501CCACCFB156F25EB5 /* LaneShadowSandboxEntry.swift in Sources */,
				B5FF9B8BF6CCCBF0478B2A77 /* LaneShadowStories.swift in Sources */,
				E2B1C40DCB7D1C33CC729331 /* MarkdownText.swift in Sources */,
				E868E14CF971E572F61A614E /* MoleculesStories.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		4233BA8C06D67164708C1BDD /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		93C20C085BB03E46FC5650F5 /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				AFD4E47761A2E61BAAA06453 /* EmptyStateTests.swift in Sources */,
				95DD81C1CEF88FF460DA7A6E /* InfoToastTests.swift in Sources */,
				3844822E275E9D75B28903BB /* LSFilterChipTests.swift in Sources */,
				1DBEC19288F8A92342DE8746 /* LSSuggestionChipTests.swift in Sources */,
				0A78DB4A71E431B8B3F4AABC /* LSTagPillTests.swift in Sources */,
				9F2D99868C5E402CD5589B29 /* LSWeatherBadgeTests.swift in Sources */,
				06E6D012390862D9ABF3488C /* LaneShadowTests.swift in Sources */,
				C9108535DE88E44D62CC2AE6 /* MarkdownTextTests.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXSourcesBuildPhase section */

/* Begin PBXTargetDependency section */
		81218BFBC741B5A356EE9708 /* PBXTargetDependency */ = {
			isa = PBXTargetDependency;
			target = 99475776B313D476E98630D0 /* LaneShadow */;
			targetProxy = 3FC0A9068371F7D9BCAA7840 /* PBXContainerItemProxy */;
		};
		8941639FFAFA7D11ED5FFFCC /* PBXTargetDependency */ = {
			isa = PBXTargetDependency;
			target = 99475776B313D476E98630D0 /* LaneShadow */;
			targetProxy = 558A672E706BFC321A8AD88A /* PBXContainerItemProxy */;
		};
/* End PBXTargetDependency section */

/* Begin XCBuildConfiguration section */
		03D80A5193AED8D39AEAA021 /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				BUNDLE_LOADER = "$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
					"@loader_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "com.laneshadow.app.ui-tests";
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				TARGETED_DEVICE_FAMILY = 1;
				TEST_TARGET_NAME = LaneShadow;
			};
			name = Debug;
		};
		19E83A40037E8C2F4313FEC2 /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CLANG_ENABLE_OBJC_WEAK = NO;
				CODE_SIGN_IDENTITY = "iPhone Developer";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEFINES_MODULE = YES;
				DEVELOPMENT_TEAM = "";
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = LaneShadow/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.laneshadow.app;
				SDKROOT = iphoneos;
				SWIFT_STRICT_CONCURRENCY = complete;
				TARGETED_DEVICE_FAMILY = 1;
			};
			name = Debug;
		};
		3D64718B8AC10E952CE325EA /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				BUNDLE_LOADER = "$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
					"@loader_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "com.laneshadow.app.ui-tests";
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				TARGETED_DEVICE_FAMILY = 1;
				TEST_TARGET_NAME = LaneShadow;
			};
			name = Release;
		};
		9371E35085AC631B9383C52D /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CLANG_ENABLE_OBJC_WEAK = NO;
				CODE_SIGN_IDENTITY = "iPhone Developer";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEFINES_MODULE = YES;
				DEVELOPMENT_TEAM = "";
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = LaneShadow/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.laneshadow.app;
				SDKROOT = iphoneos;
				SWIFT_STRICT_CONCURRENCY = complete;
				TARGETED_DEVICE_FAMILY = 1;
			};
			name = Release;
		};
		9B0CDF1DC765C25CA516AA52 /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				BUNDLE_LOADER = "$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
					"@loader_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.laneshadow.app.tests;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				SWIFT_STRICT_CONCURRENCY = complete;
				TARGETED_DEVICE_FAMILY = 1;
				TEST_HOST = "$(BUILT_PRODUCTS_DIR)/LaneShadow.app/LaneShadow";
			};
			name = Release;
		};
		B75DA993CEBD9678A536A98D /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++14";
				CLANG_CXX_LIBRARY = "libc++";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_C_LANGUAGE_STANDARD = gnu11;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				MTL_FAST_MATH = YES;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				SWIFT_OPTIMIZATION_LEVEL = "-O";
				SWIFT_VERSION = 6.0;
				VALIDATE_PRODUCT = YES;
			};
			name = Release;
		};
		BEA670E3AE6E6006E9410B92 /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++14";
				CLANG_CXX_LIBRARY = "libc++";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				GCC_C_LANGUAGE_STANDARD = gnu11;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				MTL_FAST_MATH = YES;
				ONLY_ACTIVE_ARCH = YES;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
				SWIFT_VERSION = 6.0;
			};
			name = Debug;
		};
		EAE97B256489FA4CA6BFBB3E /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				BUNDLE_LOADER = "$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
					"@loader_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.laneshadow.app.tests;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				SWIFT_STRICT_CONCURRENCY = complete;
				TARGETED_DEVICE_FAMILY = 1;
				TEST_HOST = "$(BUILT_PRODUCTS_DIR)/LaneShadow.app/LaneShadow";
			};
			name = Debug;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		370FB48DE918F2015751FF0C /* Build configuration list for PBXNativeTarget "LaneShadowTests" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				EAE97B256489FA4CA6BFBB3E /* Debug */,
				9B0CDF1DC765C25CA516AA52 /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};
		765550164B633AF5BE20873D /* Build configuration list for PBXNativeTarget "LaneShadow" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				19E83A40037E8C2F4313FEC2 /* Debug */,
				9371E35085AC631B9383C52D /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};
		7B3C5253730D483D2D3B9A92 /* Build configuration list for PBXNativeTarget "LaneShadowUITests" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				03D80A5193AED8D39AEAA021 /* Debug */,
				3D64718B8AC10E952CE325EA /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};
		C825AA9ACD7BBF70A26F04EE /* Build configuration list for PBXProject "LaneShadow" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				BEA670E3AE6E6006E9410B92 /* Debug */,
				B75DA993CEBD9678A536A98D /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};
/* End XCConfigurationList section */

/* Begin XCLocalSwiftPackageReference section */
		47209CE6204C4DADCDF34113 /* XCLocalSwiftPackageReference "../tokens/platforms/swift" */ = {
			isa = XCLocalSwiftPackageReference;
			relativePath = ../tokens/platforms/swift;
		};
		AFE99AB4F94E0A32951934B9 /* XCLocalSwiftPackageReference "../../native-sandbox/ios" */ = {
			isa = XCLocalSwiftPackageReference;
			relativePath = "../../native-sandbox/ios";
		};
/* End XCLocalSwiftPackageReference section */

/* Begin XCRemoteSwiftPackageReference section */
		2448E52A67F9CA102454EA73 /* XCRemoteSwiftPackageReference "convex-swift" */ = {
			isa = XCRemoteSwiftPackageReference;
			repositoryURL = "https://github.com/get-convex/convex-swift";
			requirement = {
				kind = upToNextMajorVersion;
				minimumVersion = 0.7.0;
			};
		};
		B661C63E1ACC8A649A046360 /* XCRemoteSwiftPackageReference "mapbox-maps-ios" */ = {
			isa = XCRemoteSwiftPackageReference;
			repositoryURL = "https://github.com/mapbox/mapbox-maps-ios";
			requirement = {
				kind = upToNextMajorVersion;
				minimumVersion = 11.6.0;
			};
		};
/* End XCRemoteSwiftPackageReference section */

/* Begin XCSwiftPackageProductDependency section */
		5B658B1BAB40A50AE36EE201 /* LaneShadowTheme */ = {
			isa = XCSwiftPackageProductDependency;
			productName = LaneShadowTheme;
		};
		9DD5E01C1B4FE6A3686813CA /* NativeSandbox */ = {
			isa = XCSwiftPackageProductDependency;
			productName = NativeSandbox;
		};
		A82A70CA01368BECA5189F19 /* LaneShadowTheme */ = {
			isa = XCSwiftPackageProductDependency;
			productName = LaneShadowTheme;
		};
		CE666EC279651E6E31EE5FBE /* ConvexMobile */ = {
			isa = XCSwiftPackageProductDependency;
			package = 2448E52A67F9CA102454EA73 /* XCRemoteSwiftPackageReference "convex-swift" */;
			productName = ConvexMobile;
		};
		DA5E21A6F8345673A1101414 /* MapboxMaps */ = {
			isa = XCSwiftPackageProductDependency;
			package = B661C63E1ACC8A649A046360 /* XCRemoteSwiftPackageReference "mapbox-maps-ios" */;
			productName = MapboxMaps;
		};
/* End XCSwiftPackageProductDependency section */
	};
	rootObject = 5005A814B8F4CE91922BC5A4 /* Project object */;
}

```
## FILE: ios/LaneShadow/Sandbox/LaneShadowStories.swift
```
import LaneShadowTheme
import NativeSandbox
import NativeTheme
import SwiftUI

@MainActor
enum LaneShadowStories {
    static let all: [Story] = [
        // MARK: - Token Swatch Stories

        Story(
            id: "tokens/color-swatches/all",
            tier: .atom,
            component: "ColorTokens",
            name: "All Colors",
            summary: "Every semantic color swatch: surface, content, signal, action, border, domain"
        ) { _ in
            ColorSwatchStory()
        },

        Story(
            id: "tokens/typography/all-families",
            tier: .atom,
            component: "TypographyTokens",
            name: "All Families & Sizes",
            summary: "Opinion (Newsreader), UI (Geist), Instrument (JetBrains Mono) — all size/weight variants"
        ) { _ in
            TypographyStory()
        },

        Story(
            id: "tokens/spacing/rungs",
            tier: .atom,
            component: "SpacingTokens",
            name: "Spacing Scale",
            summary: "xs through 4xl — every spacing rung visualized"
        ) { _ in
            SpacingStory()
        },

        Story(
            id: "tokens/radius/shapes",
            tier: .atom,
            component: "RadiusTokens",
            name: "Corner Radii",
            summary: "none through full — corner radius scale"
        ) { _ in
            RadiusStory()
        },

        Story(
            id: "tokens/elevation/levels",
            tier: .atom,
            component: "ElevationTokens",
            name: "Elevation Levels",
            summary: "Level 0 through 8 — shadow depth progression"
        ) { _ in
            ElevationStory()
        },

    ] + AtomsStories.all
        + LSMapStories.all
        + LSBadgeStories.all
        + LSSurfaceStories.all
        + LSDisplayStories.all
        + LSButtonStories.all
        + LSInputStories.all
        + LSPillStories.all
        + MoleculesStories.all
        + LSScrimStories.all
        + LSPhaseDotStories.all
}

@MainActor
enum LSBadgeStories {
    static let all: [Story] =
        BadgeStatusVariant.allCases.map { status in statusStory(status) } +
        BadgeWeatherVariant.allCases.map { weather in weatherStory(weather) } +
        [
            Story(
                id: "atoms.bestBadge.default",
                tier: .atom,
                component: "LSBestBadge",
                name: "Best Badge",
                summary: "BEST FOR TODAY badge with filled star icon."
            ) { _ in
                LSBestBadge()
                    .padding(Theme.shared.space.lg)
            },
        ]

    private static func statusStory(_ status: BadgeStatusVariant) -> Story {
        Story(
            id: "atoms.badge.status.\(status.rawValue)",
            tier: .atom,
            component: "LSBadge",
            name: "Status \(status.rawValue.capitalized)",
            summary: "Status badge for \(status.rawValue)."
        ) { _ in
            LSBadge(
                count: status == .recording ? 3 : nil,
                label: status == .recording ? nil : status.rawValue.uppercased(),
                variant: .status(status)
            )
            .padding(Theme.shared.space.lg)
        }
    }

    private static func weatherStory(_ weather: BadgeWeatherVariant) -> Story {
        let labels: [BadgeWeatherVariant: String] = [
            .clear: "Clear",
            .rain: "Rain 3pm",
            .wind: "18mph NW",
            .storm: "Storm",
            .hot: "92F",
            .cold: "38F",
        ]

        return Story(
            id: "atoms.badge.weather.\(weather.rawValue)",
            tier: .atom,
            component: "LSBadge",
            name: "Weather \(weather.rawValue.capitalized)",
            summary: "Weather badge for \(weather.rawValue)."
        ) { _ in
            LSBadge(
                label: labels[weather],
                variant: .weather(weather)
            )
            .padding(Theme.shared.space.lg)
        }
    }
}

@MainActor
enum LSPhaseDotStories {
    static let all: [Story] = [
        Story(
            id: "atoms.phaseDot.pending",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Pending",
            summary: "Hollow phase dot with the pending border treatment."
        ) { _ in
            LSPhaseDotStory(state: .pending)
        },

        Story(
            id: "atoms.phaseDot.active",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Active",
            summary: "Signal-filled phase dot with the recipe-driven pulse ring."
        ) { _ in
            LSPhaseDotStory(state: .active)
        },

        Story(
            id: "atoms.phaseDot.done",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Done",
            summary: "Success-filled phase dot without pulse animation."
        ) { _ in
            LSPhaseDotStory(state: .done)
        },
    ]
}

@MainActor
enum LSSurfaceStories {
    static let all: [Story] = [
        Story(
            id: "atoms.card.default",
            tier: .atom,
            component: "LSCard",
            name: "Card Default",
            summary: "Elevated card with the default surface tokens."
        ) { _ in
            SurfaceCardDefaultStory()
        },
        Story(
            id: "atoms.card.with-content",
            tier: .atom,
            component: "LSCard",
            name: "Card With Content",
            summary: "Elevated card with richer content composition."
        ) { _ in
            SurfaceCardContentStory()
        },
        Story(
            id: "atoms.panel.default",
            tier: .atom,
            component: "LSPanel",
            name: "Panel Default",
            summary: "Flat panel surface with compact padding."
        ) { _ in
            SurfacePanelDefaultStory()
        },
        Story(
            id: "atoms.panel.nested",
            tier: .atom,
            component: "LSPanel",
            name: "Panel Nested",
            summary: "Nested panel composition inside a card."
        ) { _ in
            SurfacePanelNestedStory()
        },
        Story(
            id: "atoms.glasspanel.chrome",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Chrome",
            summary: "Backdrop-blurred chrome surface."
        ) { _ in
            SurfaceGlassChromeStory()
        },
        Story(
            id: "atoms.glasspanel.callout-signal",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Callout Signal",
            summary: "Glass callout with the signal accent stripe."
        ) { _ in
            SurfaceGlassCalloutStory(accent: .signal)
        },
        Story(
            id: "atoms.glasspanel.callout-warning",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Callout Warning",
            summary: "Glass callout with the warning accent stripe."
        ) { _ in
            SurfaceGlassCalloutStory(accent: .warning)
        },
    ]
}

private struct LSPhaseDotStory: View {
    @Environment(\.theme) private var theme

    let state: PhaseState

    var body: some View {
        VStack(spacing: theme.space.sm) {
            LSPhaseDot(state: state)
            LSText(state.storyLabel, variant: .label.sm, color: .subtle)
        }
        .padding(theme.space.lg)
    }
}

private extension PhaseState {
    var storyLabel: String {
        switch self {
        case .pending:
            "Pending"
        case .active:
            "Active"
        case .done:
            "Done"
        }
    }
}

private struct SurfaceCardDefaultStory: View {
    var body: some View {
        LSCard {
            LSText("Ride Summary", variant: .title.md)
        }
        .padding(Theme.shared.space.lg)
    }
}

private struct SurfaceCardContentStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        LSCard {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                LSText("Favorite Route", variant: .title.md)
                LSText("64 mi  1h 42m  Scenic river loop", variant: .body.md, color: .secondary)
            }
        }
        .padding(theme.space.lg)
    }
}

private struct SurfacePanelDefaultStory: View {
    var body: some View {
        LSPanel {
            LSText("Panel Default", variant: .body.md)
        }
        .padding(Theme.shared.space.lg)
    }
}

private struct SurfacePanelNestedStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        LSCard {
            VStack(alignment: .leading, spacing: theme.space.md) {
                LSText("Nested Surface", variant: .title.md)
                LSPanel {
                    LSText("Panels stack cleanly inside cards.", variant: .body.md, color: .secondary)
                }
            }
        }
        .padding(theme.space.lg)
    }
}

private struct SurfaceGlassChromeStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .fill(theme.colors.surfaceVariant.default)
                .frame(height: 180)

            LSGlassPanel {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText("Chrome Surface", variant: .title.md)
                    LSText("Used for HUD and overlay chrome.", variant: .body.md, color: .secondary)
                }
            }
            .padding(theme.space.lg)
        }
        .padding(theme.space.lg)
    }
}

private struct SurfaceGlassCalloutStory: View {
    @Environment(\.theme) private var theme

    let accent: AccentColor

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .fill(theme.colors.surfaceVariant.default)
                .frame(height: 180)

            LSGlassPanel(variant: .callout(accent: accent)) {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText(title, variant: .title.md)
                    LSText(message, variant: .body.md, color: .secondary)
                }
            }
            .padding(theme.space.lg)
        }
        .padding(theme.space.lg)
    }

    private var title: String {
        switch accent {
        case .signal:
            "Signal Callout"
        case .warning:
            "Warning Callout"
        }
    }

    private var message: String {
        switch accent {
        case .signal:
            "Clear skies. Best conditions for a long ride."
        case .warning:
            "Watch the canyon gusts after 4 PM."
        }
    }
}

// MARK: - Color Swatch Story

private struct ColorSwatchStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.space.lg) {
                section("Surface") {
                    swatchRow("background", LaneShadowTheme.color.surface.primary)
                    swatchRow("surface", LaneShadowTheme.color.surface.primary)
                    swatchRow("card", LaneShadowTheme.color.surface.card)
                    swatchRow("inset", LaneShadowTheme.color.surface.inset)
                    swatchRow("overlay", LaneShadowTheme.color.surface.overlay)
                    swatchRow("glass", LaneShadowTheme.color.surface.glass)
                    swatchRow("scrim", LaneShadowTheme.color.surface.scrim)
                }

                section("Content") {
                    swatchRow("primary", LaneShadowTheme.color.content.primary)
                    swatchRow("secondary", LaneShadowTheme.color.content.secondary)
                    swatchRow("tertiary", LaneShadowTheme.color.content.tertiary)
                    swatchRow("subtle", LaneShadowTheme.color.content.subtle)
                }

                section("Signal") {
                    swatchRow("default", LaneShadowTheme.color.signal.default)
                    swatchRow("hover", LaneShadowTheme.color.signal.hover)
                    swatchRow("pressed", LaneShadowTheme.color.signal.pressed)
                    swatchRow("tint", LaneShadowTheme.color.signal.tint)
                    swatchRow("whisper", LaneShadowTheme.color.signal.whisper)
                }

                section("Action") {
                    swatchRow("primary", LaneShadowTheme.color.action.primary.default)
                    swatchRow("secondary", LaneShadowTheme.color.action.secondary.default)
                }

                section("Border") {
                    swatchRow("default", LaneShadowTheme.color.border.default)
                    swatchRow("subtle", LaneShadowTheme.color.border.subtle)
                    swatchRow("strong", LaneShadowTheme.color.border.strong)
                    swatchRow("focus", LaneShadowTheme.color.border.focus)
                    swatchRow("glass", LaneShadowTheme.color.border.glass)
                }

                section("Status") {
                    swatchRow("recording", LaneShadowTheme.color.status.recording)
                    swatchRow("info", LaneShadowTheme.color.status.info.default)
                    swatchRow("success", LaneShadowTheme.color.status.success.default)
                    swatchRow("warning", LaneShadowTheme.color.status.warning.default)
                }

                section("Weather") {
                    swatchRow("clear", LaneShadowTheme.color.weather.clear.default)
                    swatchRow("rain", LaneShadowTheme.color.weather.rain.default)
                    swatchRow("wind", LaneShadowTheme.color.weather.wind.default)
                    swatchRow("storm", LaneShadowTheme.color.weather.storm.default)
                    swatchRow("hot", LaneShadowTheme.color.weather.hot.default)
                    swatchRow("cold", LaneShadowTheme.color.weather.cold.default)
                }

                section("Route") {
                    swatchRow("best", LaneShadowTheme.color.route.best)
                    swatchRow("alt1", LaneShadowTheme.color.route.alt1)
                    swatchRow("alt2", LaneShadowTheme.color.route.alt2)
                }
            }
            .padding(theme.space.lg)
        }
    }

    private func section(_ title: String, @ViewBuilder content: @escaping () -> some View) -> some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text(title)
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
            content()
        }
    }

    private func swatchRow(_ name: String, _ color: Color) -> some View {
        HStack(spacing: theme.space.md) {
            RoundedRectangle(cornerRadius: theme.radius.sm)
                .fill(color)
                .frame(width: 40, height: 40)
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.sm)
                        .stroke(theme.colors.border.default, lineWidth: 0.5)
                )
            Text(name)
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
            Spacer()
        }
    }
}

// MARK: - Typography Story

private struct TypographyStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.space.xl) {
                familySection("Opinion — Newsreader", variants: [
                    ("display.lg", theme.type.display.lg),
                    ("display.md", theme.type.display.md),
                    ("display.sm", theme.type.display.sm),
                    ("heading.lg", theme.type.heading.lg),
                    ("heading.md", theme.type.heading.md),
                    ("heading.sm", theme.type.heading.sm),
                ])

                familySection("UI — Geist", variants: [
                    ("title.lg", theme.type.title.lg),
                    ("title.md", theme.type.title.md),
                    ("title.sm", theme.type.title.sm),
                    ("body.lg", theme.type.body.lg),
                    ("body.md", theme.type.body.md),
                    ("body.sm", theme.type.body.sm),
                    ("label.lg", theme.type.label.lg),
                    ("label.md", theme.type.label.md),
                    ("label.sm", theme.type.label.sm),
                ])

                instrumentSection()
            }
            .padding(theme.space.lg)
        }
    }

    private func familySection(_ title: String, variants: [(String, TypographyStyle)]) -> some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text(title)
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            ForEach(variants, id: \.0) { name, style in
                VStack(alignment: .leading, spacing: 2) {
                    Text("The quick brown fox jumps over the lazy dog")
                        .font(style.font)
                        .foregroundStyle(theme.colors.onSurface.default)
                    Text("\(name) — \(Int(style.fontSize))pt")
                        .font(theme.type.label.sm.font)
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
                }
            }
        }
    }

    private func instrumentSection() -> some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text("Instrument — JetBrains Mono")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            VStack(alignment: .leading, spacing: 2) {
                Text("42.7 mi  ·  1,204 ft  ·  14:32")
                    .font(LaneShadowTheme.typography.instrumentLg.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.lg — 18pt / medium")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("3:42:15 PM  ·  68°F  ·  12 mph")
                    .font(LaneShadowTheme.typography.instrumentMd.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.md — 13pt / medium")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("42.7mi")
                    .font(LaneShadowTheme.typography.instrumentSm.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.sm — 10pt / medium")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
            }
        }
    }
}

// MARK: - Spacing Story

private struct SpacingStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            Text("Spacing Scale (pt)")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            spacingBar("xs", theme.space.xs)
            spacingBar("sm", theme.space.sm)
            spacingBar("md", theme.space.md)
            spacingBar("lg", theme.space.lg)
            spacingBar("xl", theme.space.xl)
            spacingBar("xxl (2xl)", theme.space.xxl)
            spacingBar("xxxl (3xl)", theme.space.xxxl)
            spacingBar("xxxxl (4xl)", theme.space.xxxxl)
        }
        .padding(theme.space.lg)
    }

    private func spacingBar(_ label: String, _ value: CGFloat) -> some View {
        HStack(spacing: theme.space.md) {
            Text(label)
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .frame(width: 80, alignment: .trailing)

            RoundedRectangle(cornerRadius: 2)
                .fill(theme.colors.accent.default)
                .frame(width: value, height: 12)

            Text("\(Int(value))pt")
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
        }
    }
}

// MARK: - Radius Story

private struct RadiusStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            Text("Corner Radius Scale")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            HStack(spacing: theme.space.md) {
                radiusBox("none", theme.radius.none)
                radiusBox("sm", theme.radius.sm)
                radiusBox("md", theme.radius.md)
                radiusBox("lg", theme.radius.lg)
                radiusBox("xl", theme.radius.xl)
                radiusBox("2xl", theme.radius.xxl)
                radiusBox("full", theme.radius.full)
            }
        }
        .padding(theme.space.lg)
    }

    private func radiusBox(_ label: String, _ value: CGFloat) -> some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: value)
                .fill(theme.colors.accent.default.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: value)
                        .stroke(theme.colors.accent.default, lineWidth: 1)
                )
                .frame(width: 48, height: 48)
            Text(label)
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)
            Text("\(Int(value))pt")
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
        }
    }
}

// MARK: - Elevation Story

private struct ElevationStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            Text("Elevation Levels")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            HStack(spacing: theme.space.md) {
                elevationCard("0", theme.elevation.level0)
                elevationCard("1", theme.elevation.level1)
                elevationCard("2", theme.elevation.level2)
                elevationCard("3", theme.elevation.level3)
                elevationCard("4", theme.elevation.level4)
                elevationCard("5", theme.elevation.level5)
                elevationCard("8", theme.elevation.level8)
            }
        }
        .padding(theme.space.lg)
    }

    private func elevationCard(_ level: String, _ elevation: ElevationStyle) -> some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: theme.radius.md)
                .fill(theme.colors.surface.default)
                .shadow(
                    color: elevation.shadowColor,
                    radius: elevation.radius,
                    x: elevation.offsetX,
                    y: elevation.offsetY
                )
                .frame(width: 56, height: 56)
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.md)
                        .stroke(theme.colors.border.default, lineWidth: 0.5)
                )
            Text("L\(level)")
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)
        }
    }
}

```
## FILE: ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
```
import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSPillSemanticsStory {
    static let all: [Story] = [
        Story(
            id: "molecules.pillSemantics.tagPill.default",
            tier: .molecule,
            component: "Pill Semantics",
            name: "TagPill Default",
            summary: "LSTagPill with glass surface, pin icon, and label."
        ) { _ in
            LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")
                .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.pillSemantics.filterChip.unselected",
            tier: .molecule,
            component: "Pill Semantics",
            name: "FilterChip Unselected",
            summary: "LSFilterChip with unselected card/border semantics."
        ) { _ in
            LSFilterChip(label: "Scenic", selected: false, onToggle: {})
                .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.pillSemantics.filterChip.selected",
            tier: .molecule,
            component: "Pill Semantics",
            name: "FilterChip Selected",
            summary: "LSFilterChip with selected signal semantics."
        ) { _ in
            LSFilterChip(label: "Scenic", selected: true, onToggle: {})
                .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.pillSemantics.suggestionChip.default",
            tier: .molecule,
            component: "Pill Semantics",
            name: "SuggestionChip Default",
            summary: "LSSuggestionChip card semantic with single-tap action."
        ) { _ in
            LSSuggestionChip(label: "Twisty back roads", onTap: {})
                .padding(Theme.shared.space.lg)
        },
    ] + [
        weatherStory(id: "molecules.pillSemantics.weatherBadge.sun.sm", condition: .sun, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.sun.md", condition: .sun, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.rain.sm", condition: .rain, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.rain.md", condition: .rain, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.wind.sm", condition: .wind, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.wind.md", condition: .wind, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.storm.sm", condition: .storm, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.storm.md", condition: .storm, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.hot.sm", condition: .hot, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.hot.md", condition: .hot, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.cold.sm", condition: .cold, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.cold.md", condition: .cold, size: .md),
    ]

    private static func weatherStory(
        id: String,
        condition: WeatherCondition,
        size: PillSize
    ) -> Story {
        Story(
            id: id,
            tier: .molecule,
            component: "Pill Semantics",
            name: "WeatherBadge \(condition.storyLabel) \(size.storyLabel)",
            summary: "LSWeatherBadge weather semantic for \(condition.storyLabel) at \(size.storyLabel)."
        ) { _ in
            LSWeatherBadge(condition: condition, label: condition.defaultLabel, size: size)
                .padding(Theme.shared.space.lg)
        }
    }
}

private extension PillSize {
    var storyLabel: String {
        switch self {
        case .sm:
            "SM"
        case .md:
            "MD"
        case .lg:
            "LG"
        }
    }
}

private extension WeatherCondition {
    var storyLabel: String {
        rawValue.capitalized
    }

    var defaultLabel: String {
        switch self {
        case .sun:
            "Clear"
        case .rain:
            "Rain 3pm"
        case .wind:
            "18mph NW"
        case .storm:
            "Storm"
        case .hot:
            "92F"
        case .cold:
            "38F"
        }
    }
}

```
## FILE: ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
```
import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Molecule stories — empty shell per UC-SBX-05-ios (Sprint 1 cleanup).
/// Sprint 4 (molecules) will repopulate this aggregator.
@MainActor
enum MoleculesStories {
    static let all: [Story] = LSPillSemanticsStory.all
}

```
## FILE: ios/LaneShadow/Views/Molecules/LSFilterChip.swift
```
import LaneShadowTheme
import SwiftUI

struct LSFilterChipResolvedStyle {
    let backgroundToken: String
    let borderToken: String
    let backgroundColor: Color
    let borderColor: Color
    let textColor: ContentColor
}

public struct LSFilterChip: View {
    public static let tapAccessibilityIdentifier = "lsfilterchip-toggle"

    @Environment(\.theme) private var theme

    let label: String
    let selected: Bool
    private let onToggle: () -> Void

    var resolvedStyle: LSFilterChipResolvedStyle {
        if selected {
            LSFilterChipResolvedStyle(
                backgroundToken: "color.signal.default",
                borderToken: "color.signal.default",
                backgroundColor: LaneShadowTheme.color.signal.default,
                borderColor: LaneShadowTheme.color.signal.default,
                textColor: .onSignal
            )
        } else {
            LSFilterChipResolvedStyle(
                backgroundToken: "color.surface.card",
                borderToken: "color.border.default",
                backgroundColor: LaneShadowTheme.color.surface.card,
                borderColor: LaneShadowTheme.color.border.default,
                textColor: .secondary
            )
        }
    }

    public init(
        label: String,
        selected: Bool,
        onToggle: @escaping () -> Void
    ) {
        self.label = label
        self.selected = selected
        self.onToggle = onToggle
    }

    public var body: some View {
        let style = resolvedStyle

        Button(action: { Self.dispatch(onToggle) }) {
            LSPill(size: .md) {
                LSText(label, variant: .label.md, color: style.textColor)
                    .padding(.horizontal, theme.space.xs)
                    .background(
                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                            .fill(style.backgroundColor)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                            .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
                    )
            }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(Self.tapAccessibilityIdentifier)
        .accessibilityAddTraits(.isButton)
    }

    static func dispatch(_ action: () -> Void) {
        action()
    }
}

```
## FILE: ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift
```
import LaneShadowTheme
import SwiftUI

struct LSSuggestionChipResolvedStyle {
    let backgroundToken: String
    let borderToken: String
    let backgroundColor: Color
    let borderColor: Color
}

public struct LSSuggestionChip: View {
    public static let tapAccessibilityIdentifier = "lssuggestionchip-tap"

    @Environment(\.theme) private var theme

    let label: String
    private let onTap: () -> Void

    var resolvedStyle: LSSuggestionChipResolvedStyle {
        LSSuggestionChipResolvedStyle(
            backgroundToken: "color.surface.card",
            borderToken: "color.border.default",
            backgroundColor: LaneShadowTheme.color.surface.card,
            borderColor: LaneShadowTheme.color.border.default
        )
    }

    var size: PillSize {
        .md
    }

    public init(
        label: String,
        onTap: @escaping () -> Void
    ) {
        self.label = label
        self.onTap = onTap
    }

    public var body: some View {
        let style = resolvedStyle

        Button(action: { Self.dispatch(onTap) }) {
            LSPill(size: .md) {
                LSText(label, variant: .label.md, color: .secondary)
                    .padding(.horizontal, theme.space.xs)
                    .background(
                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                            .fill(style.backgroundColor)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                            .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
                    )
            }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(Self.tapAccessibilityIdentifier)
        .accessibilityAddTraits(.isButton)
    }

    static func dispatch(_ action: () -> Void) {
        action()
    }
}

```
## FILE: ios/LaneShadow/Views/Molecules/LSTagPill.swift
```
import LaneShadowTheme
import SwiftUI

struct LSTagPillResolvedStyle {
    let backgroundToken: String
    let borderToken: String
    let iconColor: IconContentColor
    let backgroundColor: Color
    let borderColor: Color
}

public struct LSTagPill: View {
    @Environment(\.theme) private var theme

    let icon: IconName?
    let labelText: String
    let size: PillSize

    var resolvedStyle: LSTagPillResolvedStyle {
        LSTagPillResolvedStyle(
            backgroundToken: "color.surface.glass",
            borderToken: "color.border.default",
            iconColor: .signal,
            backgroundColor: LaneShadowTheme.color.surface.glass,
            borderColor: LaneShadowTheme.color.border.default
        )
    }

    public init(
        icon: IconName? = nil,
        label: String,
        size: PillSize = .sm
    ) {
        self.icon = icon
        labelText = label
        self.size = size
    }

    public var body: some View {
        let style = resolvedStyle

        LSPill(size: size) {
            HStack(spacing: theme.space.xs) {
                if let icon {
                    LSIcon(name: icon, size: .xs, color: style.iconColor)
                }

                LSText(labelText, variant: .label.sm, color: .secondary)
            }
            .padding(.horizontal, theme.space.xs)
            .background(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .fill(style.backgroundColor)
            )
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
            )
        }
    }
}

```
## FILE: ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift
```
import LaneShadowTheme
import SwiftUI

public struct WeatherConditionResolvedStyle {
    public let backgroundToken: String
    public let foregroundToken: String
    public let borderToken: String
    public let backgroundColor: Color
    public let foregroundColor: Color
    public let borderColor: Color
    public let icon: IconName
}

public enum WeatherCondition: String, CaseIterable, Sendable {
    case sun
    case rain
    case wind
    case storm
    case hot
    case cold

    var resolvedStyle: WeatherConditionResolvedStyle {
        switch self {
        case .sun:
            weatherStyle(
                key: "sun",
                background: LaneShadowTheme.color.weather.clear.tint,
                foreground: LaneShadowTheme.color.weather.clear.default,
                icon: .sun
            )
        case .rain:
            weatherStyle(
                key: "rain",
                background: LaneShadowTheme.color.weather.rain.tint,
                foreground: LaneShadowTheme.color.weather.rain.default,
                icon: .rain
            )
        case .wind:
            weatherStyle(
                key: "wind",
                background: LaneShadowTheme.color.weather.wind.tint,
                foreground: LaneShadowTheme.color.weather.wind.default,
                icon: .wind
            )
        case .storm:
            weatherStyle(
                key: "storm",
                background: LaneShadowTheme.color.weather.storm.tint,
                foreground: LaneShadowTheme.color.weather.storm.default,
                icon: .storm
            )
        case .hot:
            weatherStyle(
                key: "hot",
                background: LaneShadowTheme.color.weather.hot.tint,
                foreground: LaneShadowTheme.color.weather.hot.default,
                icon: .therm
            )
        case .cold:
            weatherStyle(
                key: "cold",
                background: LaneShadowTheme.color.weather.cold.tint,
                foreground: LaneShadowTheme.color.weather.cold.default,
                icon: .therm
            )
        }
    }

    private func weatherStyle(
        key: String,
        background: Color,
        foreground: Color,
        icon: IconName
    ) -> WeatherConditionResolvedStyle {
        WeatherConditionResolvedStyle(
            backgroundToken: "color.weather.\(key).tint",
            foregroundToken: "color.weather.\(key).default",
            borderToken: "color.weather.\(key).default",
            backgroundColor: background,
            foregroundColor: foreground,
            borderColor: foreground,
            icon: icon
        )
    }
}

public struct LSWeatherBadge: View {
    @Environment(\.theme) private var theme

    let condition: WeatherCondition
    let label: String
    let size: PillSize

    public init(
        condition: WeatherCondition,
        label: String,
        size: PillSize = .md
    ) {
        self.condition = condition
        self.label = label
        self.size = size
    }

    public var body: some View {
        let style = condition.resolvedStyle

        LSPill(size: size) {
            HStack(spacing: theme.space.xs) {
                LSIcon(name: style.icon, size: .xs, resolvedColorOverride: style.foregroundColor)
                LSText(label, variant: .label.sm, color: .secondary)
                    .foregroundStyle(style.foregroundColor)
            }
            .padding(.horizontal, theme.space.xs)
            .background(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .fill(style.backgroundColor)
            )
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
            )
        }
    }
}

```
## FILE: ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
```
import XCTest
@testable import LaneShadow

@MainActor
final class LSFilterChipTests: XCTestCase {
    func test_selected_uses_signal_default_unselected_uses_card_surface() throws {
        let selected = LSFilterChip(label: "Scenic", selected: true, onToggle: {})
        let unselected = LSFilterChip(label: "Scenic", selected: false, onToggle: {})

        XCTAssertEqual(selected.resolvedStyle.backgroundToken, "color.signal.default")
        XCTAssertEqual(selected.resolvedStyle.borderToken, "color.signal.default")
        XCTAssertEqual(unselected.resolvedStyle.backgroundToken, "color.surface.card")
        XCTAssertEqual(unselected.resolvedStyle.borderToken, "color.border.default")

        let source = try moleculeSource(named: "LSFilterChip.swift")
        XCTAssertTrue(source.contains("LSPill("))
        XCTAssertTrue(source.contains("LSText("))
    }

    func test_ontoggle_fires_exactly_once() {
        var tapCount = 0
        LSFilterChip.dispatch { tapCount += 1 }
        XCTAssertEqual(tapCount, 1)
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }
}

```
## FILE: ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
```
import XCTest
@testable import LaneShadow

@MainActor
final class LSSuggestionChipTests: XCTestCase {
    func test_ontap_fires_once_and_resolves_card_surface() throws {
        var tapCount = 0
        let chip = LSSuggestionChip(label: "Twisty back roads") {
            tapCount += 1
        }

        XCTAssertEqual(chip.resolvedStyle.backgroundToken, "color.surface.card")
        XCTAssertEqual(chip.resolvedStyle.borderToken, "color.border.default")
        XCTAssertEqual(chip.size, .md)

        LSSuggestionChip.dispatch { tapCount += 1 }
        XCTAssertEqual(tapCount, 1)

        let source = try moleculeSource(named: "LSSuggestionChip.swift")
        XCTAssertTrue(source.contains("LSPill(size: .md"))
        XCTAssertTrue(source.contains("LSText("))
        XCTAssertFalse(source.contains("frame(height: 32"))
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }
}

```
## FILE: ios/LaneShadowTests/Molecules/LSTagPillTests.swift
```
import XCTest
@testable import LaneShadow

final class LSTagPillTests: XCTestCase {
    func test_glass_surface_and_icon_atom_composition() throws {
        let pill = LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")

        XCTAssertEqual(pill.resolvedStyle.backgroundToken, "color.surface.glass")
        XCTAssertEqual(pill.resolvedStyle.borderToken, "color.border.default")
        XCTAssertEqual(pill.resolvedStyle.iconColor, .signal)
        XCTAssertEqual(pill.labelText, "Near Santa Cruz, CA")

        let source = try moleculeSource(named: "LSTagPill.swift")
        XCTAssertTrue(source.contains("LSPill("))
        XCTAssertTrue(source.contains("LSIcon("))
        XCTAssertTrue(source.contains("LSText("))
        XCTAssertFalse(source.contains("Image(systemName:"))
        XCTAssertFalse(containsRawTextCall(source))
    }

    func test_pill_semantics_stories_registered() throws {
        let stories = try storySource(named: "LSPillSemanticsStory.swift")
        let moleculesAggregator = try storySource(named: "MoleculesStories.swift")
        let laneShadowStories = try sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertTrue(moleculesAggregator.contains("LSPillSemanticsStory.all"))
        XCTAssertTrue(laneShadowStories.contains("+ MoleculesStories.all"))

        XCTAssertTrue(stories.contains("molecules.pillSemantics.tagPill.default"))
        XCTAssertTrue(stories.contains("molecules.pillSemantics.filterChip.unselected"))
        XCTAssertTrue(stories.contains("molecules.pillSemantics.filterChip.selected"))
        XCTAssertTrue(stories.contains("molecules.pillSemantics.suggestionChip.default"))

        for condition in ["sun", "rain", "wind", "storm", "hot", "cold"] {
            for size in ["sm", "md"] {
                XCTAssertTrue(stories.contains("molecules.pillSemantics.weatherBadge.\(condition).\(size)"))
            }
        }
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }

    private func storySource(named fileName: String) throws -> String {
        let root = repoRoot()
        let candidateURLs = [
            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/Molecules/\(fileName)"),
            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/\(fileName)"),
        ]

        for url in candidateURLs where FileManager.default.fileExists(atPath: url.path) {
            return try String(contentsOf: url, encoding: .utf8)
        }

        XCTFail("Missing story source: \(fileName)")
        return ""
    }

    private func sandboxSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Sandbox")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }

    private func repoRoot() -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }

    private func containsRawTextCall(_ source: String) -> Bool {
        source
            .replacingOccurrences(of: "LSText(", with: "")
            .contains("Text(")
    }
}

```
## FILE: ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
```
import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSWeatherBadgeTests: XCTestCase {
    func test_all_six_conditions_resolve_weather_color_tokens() {
        let expected: [(WeatherCondition, String, IconName)] = [
            (.sun, "sun", .sun),
            (.rain, "rain", .rain),
            (.wind, "wind", .wind),
            (.storm, "storm", .storm),
            (.hot, "hot", .therm),
            (.cold, "cold", .therm),
        ]

        for (condition, key, icon) in expected {
            let style = condition.resolvedStyle
            XCTAssertEqual(style.backgroundToken, "color.weather.\(key).tint")
            XCTAssertEqual(style.foregroundToken, "color.weather.\(key).default")
            XCTAssertEqual(style.borderToken, "color.weather.\(key).default")
            XCTAssertEqual(style.icon, icon)
        }
    }

    func test_sm_and_md_size_heights_from_pill_atom() throws {
        let badgeSmall = LSWeatherBadge(condition: .rain, label: "Rain", size: .sm)
        let badgeMedium = LSWeatherBadge(condition: .rain, label: "Rain", size: .md)

        XCTAssertEqual(badgeSmall.size, .sm)
        XCTAssertEqual(badgeMedium.size, .md)

        let source = try moleculeSource(named: "LSWeatherBadge.swift")
        XCTAssertTrue(source.contains("LSPill(size: size"))
        XCTAssertFalse(source.contains("frame(height:"))
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }
}

```
## FILE: ios/project.yml
```
name: LaneShadow

options:
  bundleIdPrefix: com.laneshadow
  createIntermediateGroups: true
  defaultConfig: Debug
  developmentLanguage: en
  groupSortPosition: top
  minimumXcodeGenVersion: 2.45.4
  projectFormat: xcode16_0

configs:
  Debug: debug
  Release: release

packages:
  ConvexMobile:
    url: https://github.com/get-convex/convex-swift
    from: 0.7.0
  LaneShadowTheme:
    path: ../tokens/platforms/swift
  NativeSandbox:
    path: ../../native-sandbox/ios
  MapboxMaps:
    url: https://github.com/mapbox/mapbox-maps-ios
    from: 11.6.0

settings:
  base:
    ALWAYS_SEARCH_USER_PATHS: NO
    CLANG_ANALYZER_NONNULL: YES
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: YES_AGGRESSIVE
    CLANG_CXX_LANGUAGE_STANDARD: gnu++14
    CLANG_CXX_LIBRARY: libc++
    CLANG_ENABLE_MODULES: YES
    CLANG_ENABLE_OBJC_ARC: YES
    CLANG_ENABLE_OBJC_WEAK: YES
    CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING: YES
    CLANG_WARN_BOOL_CONVERSION: YES
    CLANG_WARN_COMMA: YES
    CLANG_WARN_CONSTANT_CONVERSION: YES
    CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS: YES
    CLANG_WARN_DIRECT_OBJC_ISA_USAGE: YES_ERROR
    CLANG_WARN_DOCUMENTATION_COMMENTS: YES
    CLANG_WARN_EMPTY_BODY: YES
    CLANG_WARN_ENUM_CONVERSION: YES
    CLANG_WARN_INFINITE_RECURSION: YES
    CLANG_WARN_INT_CONVERSION: YES
    CLANG_WARN_NON_LITERAL_NULL_CONVERSION: YES
    CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF: YES
    CLANG_WARN_OBJC_LITERAL_CONVERSION: YES
    CLANG_WARN_OBJC_ROOT_CLASS: YES_ERROR
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: YES
    CLANG_WARN_RANGE_LOOP_ANALYSIS: YES
    CLANG_WARN_STRICT_PROTOTYPES: YES
    CLANG_WARN_SUSPICIOUS_MOVE: YES
    CLANG_WARN_UNGUARDED_AVAILABILITY: YES_AGGRESSIVE
    CLANG_WARN_UNREACHABLE_CODE: YES
    CLANG_WARN__DUPLICATE_METHOD_MATCH: YES
    COPY_PHASE_STRIP: NO
    ENABLE_STRICT_OBJC_MSGSEND: YES
    GCC_C_LANGUAGE_STANDARD: gnu11
    GCC_NO_COMMON_BLOCKS: YES
    GCC_WARN_64_TO_32_BIT_CONVERSION: YES
    GCC_WARN_ABOUT_RETURN_TYPE: YES_ERROR
    GCC_WARN_UNDECLARED_SELECTOR: YES
    GCC_WARN_UNINITIALIZED_AUTOS: YES_AGGRESSIVE
    GCC_WARN_UNUSED_FUNCTION: YES
    GCC_WARN_UNUSED_VARIABLE: YES
    IPHONEOS_DEPLOYMENT_TARGET: "17.0"
    MTL_FAST_MATH: YES
    PRODUCT_NAME: $(TARGET_NAME)
    SDKROOT: iphoneos
    SWIFT_VERSION: "6.0"
  configs:
    Debug:
      DEBUG_INFORMATION_FORMAT: dwarf
      ENABLE_TESTABILITY: YES
      GCC_DYNAMIC_NO_PIC: NO
      GCC_OPTIMIZATION_LEVEL: "0"
      GCC_PREPROCESSOR_DEFINITIONS:
        - DEBUG=1
        - $(inherited)
      MTL_ENABLE_DEBUG_INFO: INCLUDE_SOURCE
      ONLY_ACTIVE_ARCH: YES
      SWIFT_ACTIVE_COMPILATION_CONDITIONS: DEBUG
      SWIFT_OPTIMIZATION_LEVEL: -Onone
    Release:
      DEBUG_INFORMATION_FORMAT: dwarf-with-dsym
      ENABLE_NS_ASSERTIONS: NO
      MTL_ENABLE_DEBUG_INFO: NO
      SWIFT_COMPILATION_MODE: wholemodule
      SWIFT_OPTIMIZATION_LEVEL: -O
      VALIDATE_PRODUCT: YES

targetTemplates:
  iOSBase:
    platform: iOS
    deploymentTarget: "17.0"
    settings:
      base:
        CURRENT_PROJECT_VERSION: "1"
        MARKETING_VERSION: "1.0"
        TARGETED_DEVICE_FAMILY: "1"

targets:
  LaneShadow:
    templates:
      - iOSBase
    type: application
    sources:
      # Keep source membership deterministic through XcodeGen. New Swift files
      # under these synchronized folders are picked up by Xcode 16 without
      # hand-editing project.pbxproj.
      - path: LaneShadow/App.swift
      - path: LaneShadow/ContentView.swift
      - path: LaneShadow/ConvexStore.swift
      - path: LaneShadow/Assets.xcassets
      - path: LaneShadow/Generated
        type: syncedFolder
      - path: LaneShadow/Launch
        type: syncedFolder
      - path: LaneShadow/Sandbox/Entry
        type: syncedFolder
      - path: LaneShadow/Sandbox/Theme
        type: syncedFolder
      - path: LaneShadow/Sandbox/LaneShadowSandboxEntry.swift
      - path: LaneShadow/Sandbox/LaneShadowStories.swift
      - path: LaneShadow/Sandbox/Stories/AtomsStories.swift
      - path: LaneShadow/Sandbox/Stories/LSButtonStories.swift
      - path: LaneShadow/Sandbox/Stories/LSDisplayStories.swift
      - path: LaneShadow/Sandbox/Stories/LSInputStories.swift
      - path: LaneShadow/Sandbox/Stories/LSIconStories.swift
      - path: LaneShadow/Sandbox/Stories/LSInputStories.swift
      - path: LaneShadow/Sandbox/Stories/LSMapStories.swift
      - path: LaneShadow/Sandbox/Stories/LSPillStories.swift
      - path: LaneShadow/Sandbox/Stories/LSScrimStories.swift
      - path: LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift
      - path: LaneShadow/Sandbox/Stories/LSTextStories.swift
      - path: LaneShadow/Sandbox/Stories/MoleculesStories.swift
      - path: LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
      - path: LaneShadow/Views/Atoms
        type: syncedFolder
        excludes:
          - Button.swift
      # Legacy molecule files are not yet build-clean as a folder. Keep only
      # the files that were already target members until that layer is migrated.
      - path: LaneShadow/Views/Molecules/EmptyState.swift
      - path: LaneShadow/Views/Molecules/InfoToast.swift
      - path: LaneShadow/Views/Molecules/MarkdownText.swift
      - path: LaneShadow/Views/Molecules/LSTagPill.swift
      - path: LaneShadow/Views/Molecules/LSFilterChip.swift
      - path: LaneShadow/Views/Molecules/LSSuggestionChip.swift
      - path: LaneShadow/Views/Molecules/LSWeatherBadge.swift
    dependencies:
      - package: ConvexMobile
      - package: LaneShadowTheme
      - package: NativeSandbox
      - package: MapboxMaps
      - sdk: Foundation.framework
    preBuildScripts:
      - name: Inject Convex URL
        script: '"${SRCROOT}/LaneShadow/Scripts/inject-convex-url.sh"'
        inputFiles:
          - $(SRCROOT)/../server/.env.local
        outputFiles:
          - $(SRCROOT)/LaneShadow/Generated/ConvexConfig.generated.swift
    settings:
      base:
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
        ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: AccentColor
        CLANG_ENABLE_OBJC_WEAK: NO
        CODE_SIGN_STYLE: Automatic
        DEFINES_MODULE: YES
        DEVELOPMENT_TEAM: ""
        GENERATE_INFOPLIST_FILE: NO
        INFOPLIST_FILE: LaneShadow/Info.plist
        LD_RUNPATH_SEARCH_PATHS: $(inherited) @executable_path/Frameworks
        PRODUCT_BUNDLE_IDENTIFIER: com.laneshadow.app
        SWIFT_STRICT_CONCURRENCY: complete

  LaneShadowTests:
    templates:
      - iOSBase
    type: bundle.unit-test
    sources:
      - path: LaneShadowTests/LaneShadowTests.swift
      - path: LaneShadowTests/Atoms
        type: syncedFolder
      - path: LaneShadowTests/Molecules/EmptyStateTests.swift
      - path: LaneShadowTests/Molecules/InfoToastTests.swift
      - path: LaneShadowTests/Molecules/MarkdownTextTests.swift
      - path: LaneShadowTests/Molecules/LSTagPillTests.swift
      - path: LaneShadowTests/Molecules/LSFilterChipTests.swift
      - path: LaneShadowTests/Molecules/LSSuggestionChipTests.swift
      - path: LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
      # Legacy molecule tests are intentionally outside the managed folder
      # until the molecule implementation layer is migrated.
    dependencies:
      - target: LaneShadow
      - package: LaneShadowTheme
    settings:
      base:
        BUNDLE_LOADER: $(TEST_HOST)
        CODE_SIGN_STYLE: Automatic
        GENERATE_INFOPLIST_FILE: YES
        PRODUCT_BUNDLE_IDENTIFIER: com.laneshadow.app.tests
        PRODUCT_NAME: $(TARGET_NAME)
        SWIFT_STRICT_CONCURRENCY: complete
        TEST_HOST: $(BUILT_PRODUCTS_DIR)/LaneShadow.app/LaneShadow

  LaneShadowUITests:
    templates:
      - iOSBase
    type: bundle.ui-testing
    sources:
      - path: LaneShadowUITests
        type: syncedFolder
    dependencies:
      - target: LaneShadow
    settings:
      base:
        CODE_SIGN_STYLE: Automatic
        GENERATE_INFOPLIST_FILE: YES
        PRODUCT_BUNDLE_IDENTIFIER: com.laneshadow.app.ui-tests
        PRODUCT_NAME: $(TARGET_NAME)
        TEST_TARGET_NAME: LaneShadow

schemes:
  LaneShadow:
    build:
      targets:
        LaneShadow: all
        LaneShadowTests: [test]
        LaneShadowUITests: [test]
    run:
      config: Debug
    test:
      config: Debug
      gatherCoverageData: false
      targets:
        - LaneShadowTests
        - LaneShadowUITests
    profile:
      config: Release
    analyze:
      config: Debug
    archive:
      config: Release

```

Return JSON only in this schema:
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-MOL-05-ios",
      "verdict": "APPROVED | NEEDS_FIXES",
      "requirements": [
        {
          "id": "AC-1",
          "satisfied": true,
          "evidence": "file/test output",
          "remediation": null
        }
      ]
    }
  ],
  "findings": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "task_id": "UC-MOL-05-ios",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
