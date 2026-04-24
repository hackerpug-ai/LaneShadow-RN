<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: FEATURE/TDD -->

================================================================================
TASK: ALIGN-02-ios — Introduce Copper Second-Theme Token Surface on iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     COMPLETE
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   04-uc-tok.md, ALIGN-01 drift-report.md

RUNTIME_COMMANDS:
  test:      pnpm tokens:validate && pnpm tokens:sync-check
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

The iOS token pipeline exposes the full Copper token surface required by Sprint 03 while preserving legacy-theme compatibility. Regenerated Tokens.swift contains every key listed MISSING in drift-report.md (scrimSoft, border.glass, map.*, sizing.stroke, signal.hover, status.*-tint); pnpm tokens:validate and xcodebuild both pass.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST read drift-report.md from ALIGN-01 before writing any code.
- MUST edit only tokens/scripts/generate.ts to add missing emission blocks — never hand-edit Tokens.swift.
- MUST preserve legacy theme compatibility; this sprint adds Copper as a second theme and does not delete old theme paths.
- NEVER hand-edit tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift.
- NEVER add hex literals inside Tokens.swift bodies — all values flow from generator reading semantic JSON.
- STRICTLY: pnpm tokens:validate + pnpm tokens:sync-check must pass; xcodebuild build must pass.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: surface.scrim-soft and border.glass emitted (PRIMARY)
- [x] AC-2: map.paper, map.contour, map.contour-faint emitted
- [x] AC-3: map.style.light/dark emitted as String constants
- [x] AC-4: sizing.stroke.sm/md/lg emitted as CGFloat
- [x] AC-5: pnpm tokens:validate + sync-check pass
- [x] AC-6: xcodebuild build passes

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Surface/border gaps emitted [PRIMARY]
  GIVEN: colors.tokens.json has surface.scrim-soft and border.glass entries (added if missing)
  WHEN:  pnpm tokens:generate runs
  THEN:  Tokens.swift contains LaneShadowTheme.color.surface.scrimSoft (light rgba(34,24,16,0.18), dark rgba(10,6,3,0.28)) and LaneShadowTheme.color.border.glass (light rgba(255,255,255,0.55), dark rgba(242,238,232,0.22))
  VERIFY: grep 'scrimSoft\|border.*glass' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
  TDD_STATE: none
  TEST_FILE: (generator-output inspection)
  TEST_FUNCTION: (n/a)

AC-2: map color tokens emitted
  GIVEN: colors.tokens.json has map.paper, map.contour, map.contour-faint
  WHEN:  pnpm tokens:generate runs
  THEN:  Tokens.swift contains LaneShadowTheme.color.map.paper, .contour, .contourFaint with correct light/dark pairs
  VERIFY: grep -E 'enum map|contourFaint' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
  TDD_STATE: none
  TEST_FILE: (generator-output inspection)

AC-3: map.style String constants
  GIVEN: mapbox.tokens.json has map.style.light/dark URLs
  WHEN:  pnpm tokens:generate runs
  THEN:  Tokens.swift contains LaneShadowTheme.map.style.light = "mapbox://styles/laneshadow/clxwarm01" and .dark = "mapbox://styles/laneshadow/clxnight02" as static String
  VERIFY: grep 'mapbox://styles/laneshadow' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
  TDD_STATE: none

AC-4: sizing.stroke as CGFloat
  GIVEN: dimensions.tokens.json has sizing.stroke.sm=1, md=2, lg=3
  WHEN:  pnpm tokens:generate runs
  THEN:  Tokens.swift contains LaneShadowTheme.sizing.stroke.sm: CGFloat = 1, .md: CGFloat = 2, .lg: CGFloat = 3
  VERIFY: grep 'sizing\|stroke\.' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift | grep 'CGFloat'
  TDD_STATE: none

AC-5: Token validation + sync-check pass
  GIVEN: all token changes complete
  WHEN:  pnpm tokens:validate && pnpm tokens:sync-check runs
  THEN:  both exit 0 with no errors
  VERIFY: pnpm tokens:validate && pnpm tokens:sync-check
  TDD_STATE: none

AC-6: Tokens.swift compiles
  GIVEN: Tokens.swift regenerated
  WHEN:  xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' runs
  THEN:  BUILD SUCCEEDED
  VERIFY: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet | tail -5
  TDD_STATE: none

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | LaneShadowTheme.color.surface.scrimSoft exists in Tokens.swift | AC-1 | grep -c 'scrimSoft' Tokens.swift |
| TC-2 | LaneShadowTheme.color.border.glass exists in Tokens.swift | AC-1 | grep 'border.*glass\|glass.*dyn' Tokens.swift |
| TC-3 | LaneShadowTheme.color.map enum with paper/contour/contourFaint exists | AC-2 | grep -E 'enum map\|contourFaint' Tokens.swift |
| TC-4 | LaneShadowTheme.map.style.light/.dark String constants exist | AC-3 | grep 'mapbox://styles/laneshadow' Tokens.swift \| wc -l = 2 |
| TC-5 | LaneShadowTheme.sizing.stroke.sm CGFloat = 1 exists | AC-4 | grep 'stroke.*sm.*CGFloat\|sm.*CGFloat.*1' Tokens.swift |
| TC-6 | pnpm tokens:generate exits 0 | AC-5 | pnpm tokens:generate; echo $? |
| TC-7 | Tokens.swift header still reads GENERATED — do not edit | AC-5 | grep '// GENERATED' Tokens.swift \| grep -c 'do not edit' = 1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- tokens/scripts/generate.ts (MODIFY)
- tokens/semantic/colors.tokens.json (MODIFY if scrim-soft/border.glass absent)
- tokens/semantic/mapbox.tokens.json (MODIFY if needed)
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift (MODIFY via generator only)

writeProhibited:
- ios/LaneShadow/Views/** — ALIGN-03-ios scope
- ios/LaneShadow/Tests/** — not touched
- tokens/platforms/kotlin/** — ALIGN-02-android scope
- tokens/semantic/dimensions.tokens.json (read-only unless sizing.stroke missing)
- tokens/semantic/typography.tokens.json

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Run pnpm tokens:generate after each generator edit
- Use existing processColorGroup pattern in generate.ts

⚠️ Ask First:
- Adding brand-new semantic token groups beyond drift-report.md
- Changing map.style emission type from String to URL

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/scripts/generate.ts (MODIFY): new emission blocks for map, sizing.stroke, scrim-soft, border.glass
- tokens/semantic/colors.tokens.json (MODIFY if needed)
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift (MODIFY via generator)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md [PRIMARY PATTERN]
   - Lines: all
   - Focus: Authoritative gap list — do not guess; read first

2. tokens/scripts/generate.ts
   - Lines: 380-518
   - Focus: Swift emitter functions — insertion points for new blocks

3. tokens/semantic/colors.tokens.json
   - Lines: 1-60
   - Focus: Surface group structure — add scrim-soft/border.glass if absent

4. tokens/semantic/mapbox.tokens.json
   - Lines: 1-21
   - Focus: map.style key shape — emit as String, not Color

5. tokens/semantic/dimensions.tokens.json
   - Lines: 116-133
   - Focus: sizing.stroke.sm/md/lg values for CGFloat emission

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/tokens/theme.light.json, theme.dark.json

Interaction notes:
- REQUIRED READING: drift-report.md then theme JSONs
- map.style values are Strings (Mapbox style URIs) — emit under LaneShadowTheme.map.style enum, NOT inside LaneShadowTheme.color
- sizing.stroke is not a Color — emit as CGFloat under LaneShadowTheme.sizing.stroke mirroring spacing pattern

Pattern: Follow existing processColorGroup pattern in generate.ts lines 393-426; new emission blocks after the border group block.
Pattern source: tokens/scripts/generate.ts:393-426
Anti-pattern: Do not add a new 'color' group for map.style — URLs are strings, not dynamic colors.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.
RED: Write assertion (grep or build check) demonstrating missing key. Run; confirm FAIL.
GREEN: Edit generate.ts to emit the missing block. Run `pnpm tokens:generate`. Re-run assertion. Confirm PASS.
REFACTOR: Consolidate emission helpers; regenerate; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (tokens:validate): exit 0.
Gate 2 (tokens:sync-check): exit 0.
Gate 3 (xcodebuild build): BUILD SUCCEEDED.
Gate 4 (swiftformat --lint): exit 0.
Gate 5 (Scope): `git diff --name-only` ⊆ writeAllowed.
Gate 6 (No hand-edit): `git diff tokens/platforms/swift/.../Tokens.swift` shows only regenerated-block changes; header GENERATED comment still present.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-01 (drift-report.md)
Blocks:     ALIGN-03-ios (atom migration needs the Copper token surface)
Parallel:   ALIGN-02-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN colors.tokens.json has surface.scrim-soft and border.glass WHEN pnpm tokens:generate runs THEN Tokens.swift contains scrimSoft and border.glass with correct light/dark dynamic color pairs", "verify": "grep 'scrimSoft\\|border.*glass' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN colors.tokens.json has map.paper/contour/contour-faint WHEN pnpm tokens:generate runs THEN Tokens.swift contains LaneShadowTheme.color.map with paper/contour/contourFaint", "verify": "grep -E 'enum map|contourFaint' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN mapbox.tokens.json has map.style.light/dark URLs WHEN pnpm tokens:generate runs THEN Tokens.swift contains static String constants for both style URLs", "verify": "grep 'mapbox://styles/laneshadow' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN dimensions.tokens.json has sizing.stroke.sm/md/lg WHEN pnpm tokens:generate runs THEN Tokens.swift contains LaneShadowTheme.sizing.stroke.sm/md/lg as CGFloat", "verify": "grep 'sizing\\|stroke\\.' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift | grep 'CGFloat'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN all token changes WHEN pnpm tokens:validate && pnpm tokens:sync-check runs THEN both exit 0", "verify": "pnpm tokens:validate && pnpm tokens:sync-check" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN Tokens.swift regenerated WHEN xcodebuild build runs THEN BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet | tail -5" },
    { "id": "TC-1", "type": "test_criterion", "description": "LaneShadowTheme.color.surface.scrimSoft exists in generated Tokens.swift", "maps_to_ac": "AC-1", "verify": "grep -c 'scrimSoft' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift" },
    { "id": "TC-2", "type": "test_criterion", "description": "LaneShadowTheme.color.border.glass exists in generated Tokens.swift", "maps_to_ac": "AC-1", "verify": "grep 'border.*glass\\|glass.*dyn' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift" },
    { "id": "TC-3", "type": "test_criterion", "description": "LaneShadowTheme.color.map enum with paper, contour, contourFaint exists", "maps_to_ac": "AC-2", "verify": "grep -E 'enum map|contourFaint' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift" },
    { "id": "TC-4", "type": "test_criterion", "description": "LaneShadowTheme.map.style.light and .dark String constants exist", "maps_to_ac": "AC-3", "verify": "grep 'mapbox://styles/laneshadow' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift | wc -l | grep '^2$'" },
    { "id": "TC-5", "type": "test_criterion", "description": "LaneShadowTheme.sizing.stroke.sm CGFloat = 1 exists", "maps_to_ac": "AC-4", "verify": "grep 'stroke.*sm.*CGFloat\\|sm.*CGFloat.*1' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift" },
    { "id": "TC-6", "type": "test_criterion", "description": "pnpm tokens:generate exits 0", "maps_to_ac": "AC-5", "verify": "pnpm tokens:generate; echo $?" },
    { "id": "TC-7", "type": "test_criterion", "description": "Tokens.swift header still reads GENERATED by tokens/scripts/generate.ts — do not edit by hand", "maps_to_ac": "AC-5", "verify": "grep '// GENERATED' tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift | grep -c 'do not edit' | grep '^1$'" }
  ]
}
-->
