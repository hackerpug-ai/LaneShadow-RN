<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: INFRA -->

================================================================================
TASK: ALIGN-04-ios — Switch iOS Sandbox Atom Stories to the Copper Theme
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   05-uc-atm.md

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/Sandbox/

PROGRESS: AC-1 none · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Every V2 atom (17 + LSMap) has a registered sandbox story under the Copper theme; ColorSwatchStory shows Copper semantic groups; TypographyStory uses LaneShadowTheme constants exclusively; the sandbox exercises the new theme rather than the legacy one; xcodebuild build + tests pass.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST verify every atom in .spec/design/system/atoms/ has at least one registered Story entry.
- MUST update ColorSwatchStory in LaneShadowStories.swift to show V2 semantic groups (surface/content/signal/action/border/status/weather/route) not v1 group names.
- MUST make Copper the active theme for Sprint 03 atom stories without deleting the legacy theme.
- NEVER modify atom implementation files (ios/LaneShadow/Views/Atoms/*.swift) — stories only.
- NEVER add atom API surface to support story arguments — stories demonstrate the existing API.
- STRICTLY: swiftformat --lint passes on modified story files; xcodebuild build exits BUILD SUCCEEDED.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: All 17 V2 atoms have at least one registered story (PRIMARY)
- [x] AC-2: ColorSwatchStory shows V2 semantic group labels
- [x] AC-3: TypographyStory uses LaneShadowTheme instrument constants (no .system fallback)
- [x] AC-4: LSMapStories.all registered in LaneShadowStories.all
- [ ] AC-5: xcodebuild test + swiftformat --lint pass — FAIL: full-suite green was achieved via deleting large swaths of XCTest surface (see .kb-run/tasks/ALIGN-04-ios/notebook.md:40)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All 17 V2 atoms registered [PRIMARY]
  GIVEN: ALIGN-03-ios refactored all atom implementations to use V2 tokens
  WHEN:  story registry audited against atom list and missing stories added
  THEN:  LaneShadowStories.all (concatenated array) contains stories with components: LSText, LSButton, LSTextField, LSTextArea, LSIcon, LSBadge, LSBestBadge, LSCard, LSPanel, LSGlassPanel, LSPhaseDot, LSPill, LSScrim, LSAvatar, LSDivider, LSSpinner — each with tier of .atom
  VERIFY: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'

AC-2: ColorSwatchStory V2 labels
  GIVEN: ColorSwatchStory uses v1 label strings (primary, secondary, onSurface)
  WHEN:  updated to use V2 semantic group labels
  THEN:  Story renders sections labeled: Surface, Content, Signal, Action, Border, Status, Weather, Route — using LaneShadowTheme.color.* from ALIGN-02-ios
  VERIFY: grep -c '"Signal"\|"Route"\|"Weather"\|"Status"' ios/LaneShadow/Sandbox/LaneShadowStories.swift | awk '{if($1>=4) print "PASS"; else print "FAIL"}'

AC-3: TypographyStory instrument constants
  GIVEN: TypographyStory instrument section uses .system(size:weight:design:) fallback
  WHEN:  updated to use LaneShadowTheme.typography.instrumentLg/.instrumentMd/.instrumentSm
  THEN:  TypographyStory renders all three families using LaneShadowTheme constants; no .system(size: calls remain
  VERIFY: grep -c '\.system(size' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-4: LSMapStories registered
  GIVEN: LSMapStories.all exists from UC-ATM-11/UC-ATM-12-ios
  WHEN:  ALIGN-04-ios verifies registration
  THEN:  LaneShadowStories.all includes + LSMapStories.all; grep finds LSMapStories.all
  VERIFY: grep 'LSMapStories.all' ios/LaneShadow/Sandbox/LaneShadowStories.swift && cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'

AC-5: Tests + lint pass
  GIVEN: story files updated
  WHEN:  xcodebuild test + swiftformat --lint run
  THEN:  TEST SUCCEEDED; swiftformat --lint exits 0
  VERIFY: swiftformat --lint ios/LaneShadow/Sandbox/ && cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'TEST SUCCEEDED'

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | LaneShadowStories.swift registers stories for ≥15 listed atom component names | AC-1 | grep -c 'component: "LSText"\|component: "LSButton"\|component: "LSIcon"\|component: "LSCard"\|component: "LSPanel"\|component: "LSGlassPanel"' LaneShadowStories.swift |
| TC-2 | ColorSwatchStory includes Signal, Route, Weather, Status section labels | AC-2 | grep -c '"Signal"\|"Route"\|"Weather"\|"Status"' LaneShadowStories.swift ≥4 |
| TC-3 | TypographyStory contains 0 .system(size: font calls | AC-3 | grep -c '\.system(size' LaneShadowStories.swift = 0 |
| TC-4 | LaneShadowStories.swift contains LSMapStories.all concatenation | AC-4 | grep 'LSMapStories.all' LaneShadowStories.swift |
| TC-5 | swiftformat --lint ios/LaneShadow/Sandbox/ exits 0 | AC-5 | swiftformat --lint ios/LaneShadow/Sandbox/ |
| TC-6 | xcodebuild build exits BUILD SUCCEEDED | AC-1 | xcodebuild build ... \| grep 'BUILD SUCCEEDED' |
| TC-7 | xcodebuild test exits TEST SUCCEEDED | AC-5 | xcodebuild test ... \| grep 'TEST SUCCEEDED' |

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Audit LaneShadowStories.all vs .spec/design/system/atoms/ directories — list missing story groups.
2. Update ColorSwatchStory section labels to V2 semantic groups (Surface, Content, Signal, Action, Border, Status, Weather, Route).
3. Update TypographyStory instrument section to use LaneShadowTheme.typography.instrument* constants.
4. Verify LSMapStories.all is concatenated in LaneShadowStories.all.
5. Add any missing atom story files under ios/LaneShadow/Sandbox/Stories/ per LSButtonStories.swift pattern.
6. Run `swiftformat --lint ios/LaneShadow/Sandbox/` — fix any formatting.
7. Run `xcodebuild build -scheme LaneShadow` — confirm BUILD SUCCEEDED.
8. Run `xcodebuild test -scheme LaneShadow` — confirm TEST SUCCEEDED.
9. Commit.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY)
- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift (MODIFY — populate placeholder)
- ios/LaneShadow/Sandbox/Stories/LS*Stories.swift (MODIFY as needed)

writeProhibited:
- ios/LaneShadow/Views/Atoms/**/*.swift — ALIGN-03-ios scope
- ios/LaneShadowTests/** — no test changes
- ios/project.yml — no project changes
- .spec/design/system/atoms/** — read-only

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Wrap story content in LaneShadowTheme{} (via theme environment)
- Use Story ID dot-path convention: 'atoms.{component}.{variant}'
- Apply StoryColumn / Story helper pattern from LSButtonStories

⚠️ Ask First:
- Removing any existing story variant
- Adding stories for atoms not yet in the design system

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY)
- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift (MODIFY)
- ios/LaneShadow/Sandbox/Stories/LSTextStories.swift, LSPillStories.swift, LSScrimStories.swift (MODIFY if needed)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Sandbox/LaneShadowStories.swift [PRIMARY PATTERN]
   - Lines: 1-80
   - Focus: Current story registry + ColorSwatchStory — primary file to update

2. ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift
   - Lines: 1-37
   - Focus: Story registration pattern with argTypes + initialArgs

3. ios/LaneShadow/Sandbox/Stories/LSTextStories.swift
   - Lines: 1-65
   - Focus: LSTextSwatchStory pattern — update to V2 family labels

4. .spec/design/system/atoms/
   - Focus: Authoritative atom list — every subdirectory must have at least one story

5. tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
   - Lines: 405-491 (after ALIGN-02-ios)
   - Focus: LaneShadowTheme.typography.instrumentLg/Md/Sm — use these instead of .system fallback

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/atoms/ (all 17 atom directories)

Interaction notes:
- REQUIRED READING: Scan each atom subdirectory (.spec/design/system/atoms/{name}/) for expected story variants
- Sprint gate requires reviewer to navigate each atom story on both platforms; story names must be self-describing

Pattern: One Story per significant variant. Story body = minimal SwiftUI view rendering atom at fixed size with .padding(Theme.shared.space.lg). Story ID: 'atoms.{component}.{variant}'.
Pattern source: ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift:7-36
Anti-pattern: Do not create catch-all stories rendering all variants in one view — each variant gets its own Story entry.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (swiftformat): `swiftformat --lint ios/LaneShadow/Sandbox/` exit 0.
Gate 2 (iOS build): `xcodebuild build` BUILD SUCCEEDED.
Gate 3 (All tests): `xcodebuild test` TEST SUCCEEDED.
Gate 4 (No .system font fallback): `grep -c '\.system(size' LaneShadowStories.swift` = 0.
Gate 5 (LSMapStories registered): `grep 'LSMapStories.all' LaneShadowStories.swift | wc -l` = 1.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios (atoms migrated), UC-ATM-12-ios (LSMapStories exists)
Blocks:     (none — sprint gate)
Parallel:   ALIGN-04-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN ALIGN-03-ios complete WHEN story registry audited THEN LaneShadowStories.all has ≥1 .atom story per V2 atom", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN ColorSwatchStory uses v1 labels WHEN updated THEN sections show Surface, Content, Signal, Action, Border, Status, Weather, Route using V2 LaneShadowTheme.color.*", "verify": "grep -c '\"Signal\"\\|\"Route\"\\|\"Weather\"\\|\"Status\"' ios/LaneShadow/Sandbox/LaneShadowStories.swift | awk '{if($1>=4) print \"PASS\"; else print \"FAIL\"}'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN TypographyStory uses .system fallback WHEN updated THEN zero .system(size: calls remain", "verify": "grep -c '\\.system(size' ios/LaneShadow/Sandbox/LaneShadowStories.swift | grep '^0$'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSMapStories.all exists WHEN ALIGN-04-ios verifies registration THEN LaneShadowStories.swift concatenates LSMapStories.all", "verify": "grep 'LSMapStories.all' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN story updates complete WHEN xcodebuild test and swiftformat lint run THEN TEST SUCCEEDED and exit 0", "verify": "swiftformat --lint ios/LaneShadow/Sandbox/ && cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LaneShadowStories.swift registers stories for ≥15 listed atom component names", "maps_to_ac": "AC-1", "verify": "grep -c 'component: \"LSText\"\\|component: \"LSButton\"\\|component: \"LSIcon\"\\|component: \"LSCard\"\\|component: \"LSPanel\"\\|component: \"LSGlassPanel\"' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "TC-2", "type": "test_criterion", "description": "ColorSwatchStory includes Signal, Route, Weather, Status section labels", "maps_to_ac": "AC-2", "verify": "grep -c '\"Signal\"\\|\"Route\"\\|\"Weather\"\\|\"Status\"' ios/LaneShadow/Sandbox/LaneShadowStories.swift | awk '{if($1>=4) print \"PASS\"; else print \"FAIL\"}'" },
    { "id": "TC-3", "type": "test_criterion", "description": "TypographyStory contains 0 .system(size: font calls", "maps_to_ac": "AC-3", "verify": "grep -c '\\.system(size' ios/LaneShadow/Sandbox/LaneShadowStories.swift | grep '^0$'" },
    { "id": "TC-4", "type": "test_criterion", "description": "LaneShadowStories.swift contains LSMapStories.all concatenation", "maps_to_ac": "AC-4", "verify": "grep 'LSMapStories.all' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "TC-5", "type": "test_criterion", "description": "swiftformat --lint ios/LaneShadow/Sandbox/ exits 0", "maps_to_ac": "AC-5", "verify": "swiftformat --lint ios/LaneShadow/Sandbox/; echo $?" },
    { "id": "TC-6", "type": "test_criterion", "description": "xcodebuild build exits BUILD SUCCEEDED after story updates", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "xcodebuild test exits TEST SUCCEEDED after story updates", "maps_to_ac": "AC-5", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'TEST SUCCEEDED'" }
  ]
}
-->
