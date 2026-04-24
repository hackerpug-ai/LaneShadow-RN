<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: FEATURE/TDD -->

================================================================================
TASK: ALIGN-03-ios — Migrate iOS Atoms onto the Copper Second Theme
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   05-uc-atm.md, ALIGN-01 drift-report.md

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

All iOS atom files used by Sprint 03 atom stories resolve colors, spacing, radius, and stroke through the Copper theme surface — zero parseColorString / hex / raw-dp literals in production bodies, all atom stories render on the new theme, and the legacy theme remains available for later cleanup.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST read drift-report.md before editing any atom file.
- MUST ensure ALIGN-02-ios is complete so new token constants exist.
- MUST move atoms to the Copper second theme without deleting legacy theme infrastructure in this sprint.
- MUST replace every raw Color(0x...) / Color(red:green:blue:) / parseColorString in atom @ViewBuilder bodies with LaneShadowTheme.color.* or @Environment(\.theme) resolution.
- NEVER introduce new raw hex literals (Color(red:) or parseColorString) in atom bodies.
- NEVER delete or disable existing tests.
- STRICTLY: swiftformat --lint must exit 0; xcodebuild test Atoms/ passes; zero grep hits for parseColorString in ios/LaneShadow/Views/Atoms/.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: BadgeVariant.swift — all inline hex replaced with tokens (PRIMARY)
- [x] AC-2: LSText.swift — inline dyn(parseColorString()) replaced with constants
- [x] AC-3: All atom files — zero parseColorString calls in production
- [x] AC-4: All existing Atoms tests pass
- [x] AC-5: swiftformat --lint exits 0
- [x] AC-6: LSScrim.soft variant uses scrimSoft token

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: BadgeVariant.swift token replacement [PRIMARY]
  GIVEN: BadgeVariant.swift contains 14+ inline badgeColor("#...") calls
  WHEN:  refactor is applied
  THEN:  BadgeVariant.swift references LaneShadowTheme.color.weather.*.tint and LaneShadowTheme.color.status.*.tint; zero badgeColor("#") calls remain
  VERIFY: grep 'badgeColor("#' ios/LaneShadow/Views/Atoms/BadgeVariant.swift | wc -l
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/BadgeVariantTests.swift (new or existing)
  TEST_FUNCTION: test_variant_colors_resolve_from_tokens

AC-2: LSText.swift color replacement
  GIVEN: LSText.swift contains inline dyn(parseColorString("#1E1A16"), ...) for content colors
  WHEN:  refactor is applied
  THEN:  LSText.swift uses LaneShadowTheme.color.content.primary/.secondary/.tertiary/.subtle/.onSignal; zero parseColorString calls
  VERIFY: grep 'parseColorString' ios/LaneShadow/Views/Atoms/LSText.swift | wc -l
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSTextTests.swift
  TEST_FUNCTION: test_content_colors_resolve_from_tokens

AC-3: Zero parseColorString across atoms
  GIVEN: 54 atom files in ios/LaneShadow/Views/Atoms/
  WHEN:  refactor applied across all files
  THEN:  grep -r parseColorString in Atoms/ (excl. #Preview and comments) returns 0
  VERIFY: grep -r 'parseColorString' ios/LaneShadow/Views/Atoms/ --include='*.swift' | grep -v '#Preview\|//' | wc -l
  TDD_STATE: none
  TEST_FILE: (static grep assertion)

AC-4: Existing Atoms tests pass
  GIVEN: LaneShadowTests/Atoms/ tests for LSText, LSScrim, LSPhaseDot, LSPill, etc.
  WHEN:  xcodebuild test -only-testing:LaneShadowTests/Atoms runs
  THEN:  all Atoms tests pass with 0 failures
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms
  TDD_STATE: none

AC-5: swiftformat --lint passes
  GIVEN: all atom files edited
  WHEN:  swiftformat --lint ios/LaneShadow/ runs
  THEN:  exit 0
  VERIFY: swiftformat --lint ios/LaneShadow/
  TDD_STATE: none

AC-6: LSScrim.soft variant
  GIVEN: ALIGN-02-ios added scrimSoft token
  WHEN:  LSScrim aligned to scrim.html spec
  THEN:  LSScrim has .soft variant using LaneShadowTheme.color.surface.scrimSoft; .default still uses color.surface.scrim
  VERIFY: grep 'scrimSoft\|scrim.*soft\|soft.*scrim' ios/LaneShadow/Views/Atoms/LSScrim.swift
  TDD_STATE: none

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | grep parseColorString in Atoms/ (excl. previews/comments) = 0 | AC-3 | grep -r 'parseColorString' Atoms/ \| grep -v '#Preview\|//' \| wc -l |
| TC-2 | BadgeVariant.swift contains 0 inline badgeColor("#") hex calls | AC-1 | grep -c 'badgeColor("#' BadgeVariant.swift |
| TC-3 | LSText.swift contains 0 parseColorString calls | AC-2 | grep -c 'parseColorString' LSText.swift |
| TC-4 | xcodebuild test LaneShadowTests/Atoms exits TEST SUCCEEDED | AC-4 | cd ios && xcodebuild test ... -only-testing:LaneShadowTests/Atoms |
| TC-5 | swiftformat --lint exits 0 | AC-5 | swiftformat --lint ios/LaneShadow/; echo $? |
| TC-6 | LSScrim.swift references scrimSoft for soft variant | AC-6 | grep 'scrimSoft' LSScrim.swift |
| TC-7 | No hardcoded cornerRadius: N in atom @ViewBuilder bodies | AC-3 | grep -rn 'cornerRadius: [0-9]' Atoms/ \| grep -v '#Preview\|//' \| wc -l |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/*.swift (MODIFY — fix token drift)

writeProhibited:
- tokens/platforms/swift/** — ALIGN-02-ios scope
- tokens/scripts/generate.ts
- tokens/semantic/**
- ios/LaneShadow/Tests/**
- ios/LaneShadow/Sandbox/** — ALIGN-04-ios scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use @Environment(\.theme) private var theme pattern (see LSGlassPanel, LSScrim)
- Resolve all values through LaneShadowTheme.color / theme.radius / theme.spacing

⚠️ Ask First:
- Adding new variant cases to existing atoms
- Changing an atom's public API signature

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/BadgeVariant.swift (MODIFY)
- ios/LaneShadow/Views/Atoms/LSText.swift (MODIFY)
- ios/LaneShadow/Views/Atoms/LSScrim.swift (MODIFY — add .soft variant)
- ios/LaneShadow/Views/Atoms/LSGlassPanel.swift, LSPanel.swift, LSCard.swift, LSPill.swift, LSPhaseDot.swift, etc. (MODIFY as needed)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Atoms/BadgeVariant.swift [PRIMARY PATTERN]
   - Lines: 1-160
   - Focus: 14+ inline hex badgeColor calls — highest violation density, fix first

2. ios/LaneShadow/Views/Atoms/LSText.swift
   - Lines: 1-30
   - Focus: Inline dyn(parseColorString()) content color calls

3. ios/LaneShadow/Views/Atoms/LSScrim.swift
   - Lines: 40-60
   - Focus: resolvedUIColor + scrim token; add scrimSoft variant

4. tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
   - Lines: 284-400 (after ALIGN-02-ios)
   - Focus: Color token access paths — verify new tokens exist before referencing

5. .spec/design/system/atoms/README.md
   - Lines: 1-50
   - Focus: Atom inventory — 17 atoms with HTML specs to align against

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/atoms/badge-best/, scrim/, glass-panel/, pill/, text/, button/, input/, card/, panel/, phase-dot/, icon/

Interaction notes:
- REQUIRED READING: drift-report.md + each atom's HTML spec before editing
- BadgeVariant hex colors map to weather/status .tint equivalents via theme.light.json
- LSText colors map to LaneShadowTheme.color.content.{primary,secondary,tertiary,subtle,onSignal}
- cornerRadius values use theme.radius.{xs,sm,md,lg,xl,2xl}

Pattern: @Environment(\.theme) private var theme, resolve through LaneShadowTheme.color.*
Pattern source: ios/LaneShadow/Views/Atoms/LSGlassPanel.swift:11
Anti-pattern: Do not introduce a local parseColorString helper in atoms — that belongs only in generated Tokens.swift.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.
RED: Write or extend test asserting expected token resolution for an atom. Run test. Confirm FAIL.
GREEN: Modify atom to resolve through LaneShadowTheme. Re-run test. Confirm PASS.
REFACTOR: Extract shared token-lookup helpers; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (zero parseColorString): 0 in production bodies.
Gate 2 (Atoms tests pass): `xcodebuild test ... -only-testing:LaneShadowTests/Atoms` exits 0.
Gate 3 (swiftformat lint): exit 0.
Gate 4 (No raw cornerRadius): 0 hits in production bodies.
Gate 5 (Scope): `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-02-ios (Copper token surface must exist first)
Blocks:     ALIGN-04-ios (sandbox stories switch to migrated atoms)
Parallel:   ALIGN-03-android, UC-ATM-12-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN BadgeVariant.swift has 14+ inline hex calls WHEN refactor applied THEN zero badgeColor(\"#\") calls remain; all use LaneShadowTheme.color.weather.*.tint or status.*.tint", "verify": "grep 'badgeColor(\"#' ios/LaneShadow/Views/Atoms/BadgeVariant.swift | wc -l | grep '^0$'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSText.swift has inline dyn(parseColorString()) calls WHEN refactor applied THEN zero parseColorString calls remain in LSText.swift", "verify": "grep 'parseColorString' ios/LaneShadow/Views/Atoms/LSText.swift | wc -l | grep '^0$'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN all atom files WHEN refactor applied THEN grep parseColorString in Atoms/ (excl. previews/comments) returns 0", "verify": "grep -r 'parseColorString' ios/LaneShadow/Views/Atoms/ --include='*.swift' | grep -v '#Preview\\|//' | wc -l | grep '^0$'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN existing Atoms tests WHEN xcodebuild test runs THEN all pass with 0 failures", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN all atom files edited WHEN swiftformat --lint runs THEN exit 0", "verify": "swiftformat --lint ios/LaneShadow/" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN scrimSoft token exists after ALIGN-02-ios WHEN LSScrim refactored THEN LSScrim.soft uses LaneShadowTheme.color.surface.scrimSoft", "verify": "grep 'scrimSoft' ios/LaneShadow/Views/Atoms/LSScrim.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "grep for parseColorString in Atoms/ (excl. previews/comments) returns 0", "maps_to_ac": "AC-3", "verify": "grep -r 'parseColorString' ios/LaneShadow/Views/Atoms/ --include='*.swift' | grep -v '#Preview\\|//' | wc -l | grep '^0$'" },
    { "id": "TC-2", "type": "test_criterion", "description": "BadgeVariant.swift contains zero inline badgeColor(\"#\") hex calls", "maps_to_ac": "AC-1", "verify": "grep -c 'badgeColor(\"#' ios/LaneShadow/Views/Atoms/BadgeVariant.swift | grep '^0$'" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSText.swift contains zero parseColorString calls", "maps_to_ac": "AC-2", "verify": "grep -c 'parseColorString' ios/LaneShadow/Views/Atoms/LSText.swift | grep '^0$'" },
    { "id": "TC-4", "type": "test_criterion", "description": "xcodebuild test for LaneShadowTests/Atoms exits with 0 failures", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms 2>&1 | grep 'Test Suite.*passed'" },
    { "id": "TC-5", "type": "test_criterion", "description": "swiftformat --lint ios/LaneShadow/ exits 0", "maps_to_ac": "AC-5", "verify": "swiftformat --lint ios/LaneShadow/; echo $?" },
    { "id": "TC-6", "type": "test_criterion", "description": "LSScrim.swift production body references scrimSoft for soft variant", "maps_to_ac": "AC-6", "verify": "grep 'scrimSoft' ios/LaneShadow/Views/Atoms/LSScrim.swift" },
    { "id": "TC-7", "type": "test_criterion", "description": "No hardcoded cornerRadius: N literals in atom @ViewBuilder bodies (excl. #Preview and comments)", "maps_to_ac": "AC-3", "verify": "grep -rn 'cornerRadius: [0-9]' ios/LaneShadow/Views/Atoms/ --include='*.swift' | grep -v '#Preview\\|//' | wc -l | grep '^0$'" }
  ]
}
-->
