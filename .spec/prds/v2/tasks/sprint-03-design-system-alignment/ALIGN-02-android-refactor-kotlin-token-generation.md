<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: FEATURE/TDD -->

================================================================================
TASK: ALIGN-02-android — Introduce Copper Second-Theme Token Surface on Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     COMPLETE
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   04-uc-tok.md

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :theme:test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

The Android token pipeline exposes the full Copper token surface required by Sprint 03 while preserving legacy-theme compatibility. Generated Tokens.kt contains every key from theme.light.json and theme.dark.json with byte-identical values, including map.style, sizing.stroke, surface.scrim-soft, and border.glass.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST verify every key/value in Tokens.kt against theme.light.json and theme.dark.json before declaring done.
- MUST add missing token keys found in design/system/tokens/ but absent from Tokens.kt (surface.scrim-soft, border.glass, map.paper, map.contour, map.contour-faint, map.style.*, sizing.stroke.*).
- MUST preserve legacy theme compatibility; this sprint adds Copper as a second theme and does not delete old theme paths.
- NEVER hard-code hex literals in Tokens.kt — all values derive from generator reading semantic source files.
- NEVER bypass the input-hash drift-check header.
- STRICTLY: Tokens.kt is generated — edit generate.ts, never Tokens.kt by hand.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: Tokens.kt contains all color keys from theme.light.json (PRIMARY)
- [x] AC-2: Tokens.kt contains all color keys from theme.dark.json
- [x] AC-3: map.style.light/dark string constants exposed
- [x] AC-4: sizing.stroke.sm/md/lg constants exposed matching dimensions.tokens.json
- [x] AC-5: Input-hash changes on source edit
- [x] AC-6: All theme unit tests pass
- [x] `./gradlew :theme:test` and `./gradlew :app:compileDebugKotlin` exit 0
- [x] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Light-mode color coverage [PRIMARY]
  GIVEN: theme.light.json defines surface, content, signal, border, action, role, status, weather, route, map groups
  WHEN:  pnpm tokens:generate is run
  THEN:  Tokens.kt contains an entry for every key with byte-identical Color values; no key absent
  VERIFY: cd /Users/justinrich/Projects/LaneShadow && pnpm tokens:generate && grep -c 'val scrimSoft' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
  TDD_STATE: none
  TEST_FILE: tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/ColorSetTest.kt
  TEST_FUNCTION: bundledJson_decodesAllCoreGroups

AC-2: Dark-mode color coverage
  GIVEN: theme.dark.json defines dark variants including map.paper = #2D2218 and surface.glass rgba
  WHEN:  pnpm tokens:generate is run
  THEN:  Tokens.kt dark-variant objects match theme.dark.json; alpha-channel colors use Color(r,g,b,a) float constructor
  VERIFY: pnpm tokens:generate && grep -A2 'object dark' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt | grep 'map\|scrim\|glass'
  TDD_STATE: none
  TEST_FILE: tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/ColorSetTest.kt
  TEST_FUNCTION: bundledJson_decodesDarkModeDomainGroups

AC-3: map.style constants exposed
  GIVEN: mapbox.tokens.json defines map.style.light and map.style.dark URLs
  WHEN:  pnpm tokens:generate is run
  THEN:  Tokens.kt contains `object map { object style { val light; val dark } }` with exact URL strings
  VERIFY: grep -n 'clxwarm01\|clxnight02' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
  TDD_STATE: none
  TEST_FILE: tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensMapStyleTest.kt
  TEST_FUNCTION: mapStyle_resolvesFromTokens

AC-4: sizing.stroke scale exposed
  GIVEN: dimensions.tokens.json defines sizing.stroke.sm=1, md=2, lg=3
  WHEN:  pnpm tokens:generate is run
  THEN:  Tokens.kt contains `object sizing { object stroke { val sm = 1.dp; val md = 2.dp; val lg = 3.dp } }`; TokensDimensionsTest asserts exact values
  VERIFY: cd android && ./gradlew :theme:test --tests '*TokensDimensionsTest*'
  TDD_STATE: none
  TEST_FILE: tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensDimensionsTest.kt
  TEST_FUNCTION: strokeScale_matchesDimensionsTokens

AC-5: Input-hash changes on edit
  GIVEN: input-hash comment at line 2 reflects source file hash
  WHEN:  any value in colors.tokens.json is modified and pnpm tokens:generate is re-run
  THEN:  input-hash comment differs from prior value
  VERIFY: HASH_BEFORE=$(head -2 tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt | grep input-hash); echo $HASH_BEFORE
  TDD_STATE: none
  TEST_FILE: (manual verification; part of AC-6 runtime check)
  TEST_FUNCTION: (n/a)

AC-6: All theme unit tests pass
  GIVEN: ColorSetTest loads bundled semantic.tokens.json
  WHEN:  ./gradlew :theme:test runs after regeneration
  THEN:  BUILD SUCCESSFUL with 0 failures
  VERIFY: cd android && ./gradlew :theme:test
  TDD_STATE: none
  TEST_FILE: tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/ColorSetTest.kt
  TEST_FUNCTION: bundledJson_decodesAllCoreGroups

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | Tokens.kt contains a val for surface.scrim-soft mapped as Color with alpha ~0.18 float constructor | AC-1 | grep 'scrimSoft\|scrim_soft' Tokens.kt |
| TC-2 | Tokens.kt contains val for border.glass resolved to dark-mode rgba(242,238,232,0.22) | AC-2 | grep 'borderGlass\|border.*glass' Tokens.kt |
| TC-3 | Tokens.kt map.style.light equals exactly 'mapbox://styles/laneshadow/clxwarm01' | AC-3 | grep 'clxwarm01' Tokens.kt |
| TC-4 | LaneShadowTheme.sizing.stroke.md equals 2.dp | AC-4 | grep -A1 'object stroke' Tokens.kt \| grep 'md' |
| TC-5 | ColorSetTest.bundledJson_decodesAllCoreGroups exits BUILD SUCCESSFUL | AC-6 | ./gradlew :theme:test --tests '*.ColorSetTest.bundledJson_decodesAllCoreGroups' |
| TC-6 | pnpm tokens:generate with missing mapbox.tokens.json throws clear error (does not silently emit empty map.style) | AC-3 | mv mapbox.tokens.json; pnpm tokens:generate |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- tokens/scripts/generate.ts (MODIFY) — add emission of missing token groups
- tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt (MODIFY via generator only)
- tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensDimensionsTest.kt (NEW)
- tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensMapStyleTest.kt (NEW)

writeProhibited:
- .spec/design/system/tokens/** — read-only design source
- tokens/semantic/*.json — read-only for this task
- android/app/src/** — atom scope is ALIGN-03-android

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Regenerate after every generator edit
- Run ./gradlew :theme:test after regeneration
- Use Color(r,g,b,a) float constructor for alpha-channel colors

⚠️ Ask First:
- Adding brand-new semantic token groups beyond the drift list from ALIGN-01
- Changing the hash algorithm used for input-hash

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/scripts/generate.ts (MODIFY): emit missing groups
- tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt (MODIFY via generator)
- tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensDimensionsTest.kt (NEW)
- tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensMapStyleTest.kt (NEW)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. tokens/scripts/generate.ts [PRIMARY PATTERN]
   - Lines: 1-200
   - Focus: Kotlin emitter — where to add map/stroke/scrim-soft/border-glass emission

2. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
   - Lines: 1-293
   - Focus: Current output baseline for drift comparison

3. .spec/design/system/tokens/theme.light.json
   - Lines: 1-145
   - Focus: Authoritative key/value list — every key must appear in Tokens.kt

4. tokens/semantic/mapbox.tokens.json
   - Lines: 1-21
   - Focus: map.style URL values to emit as Kotlin constants

5. tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/ColorSetTest.kt
   - Lines: 1-46
   - Focus: Existing test pattern; mirror for new TokensDimensionsTest/TokensMapStyleTest

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- .spec/design/system/tokens/theme.light.json (REQUIRED READING)
- .spec/design/system/tokens/theme.dark.json
- .spec/design/system/tokens/tokens.css

Interaction notes:
- Every key in theme.light.json must appear in Tokens.kt — drift is failure
- Known gaps: surface.scrim-soft, border.glass, map.paper, map.contour, map.contour-faint, map.style.*, sizing.stroke.*
- Alpha-channel colors must use Color(r,g,b,a) float constructor, not 0xFF hex (cannot express alpha<1.0)

Pattern: Tokens.kt is purely GENERATED — all edits go into generate.ts TypeScript emitter; regenerate to verify.
Pattern source: tokens/scripts/generate.ts:128-141
Anti-pattern: Do not hand-edit Tokens.kt — input-hash drift detection will reject hand edits on next generation.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow — per AC)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC. Orchestrator verifies each transition.

RED: Write failing test in the TEST_FILE (new or update). Run `./gradlew :theme:test --tests ...`. Verify FAILS. Return TDD_STATE=red with failure output.
GREEN: Edit tokens/scripts/generate.ts to emit missing keys. Run `pnpm tokens:generate`. Run the same test. Verify PASSES. Return TDD_STATE=green.
REFACTOR: Clean up generator code; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (RED): TDD_STATE history shows each test went red before green.
Gate 2 (One test per AC): Test file contains one test function per AC.
Gate 3 (Tests pass): `cd android && ./gradlew :theme:test` exits 0.
Gate 4 (Typecheck): `cd android && ./gradlew :app:compileDebugKotlin` exits 0.
Gate 5 (Lint): `cd android && ./gradlew detekt` exits 0 (or skip if detekt disabled).
Gate 6 (Scope): `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-01 (drift report)
Blocks:     ALIGN-03-android (atom migration consumes these Copper tokens)
Parallel:   ALIGN-02-ios (iOS equivalent)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN theme.light.json defines all color groups WHEN pnpm tokens:generate runs THEN Tokens.kt contains an entry for every key with byte-identical Color values; no key absent", "verify": "cd /Users/justinrich/Projects/LaneShadow && pnpm tokens:generate && grep -c 'val scrimSoft' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN theme.dark.json defines dark variants WHEN pnpm tokens:generate runs THEN Tokens.kt dark-variant objects match theme.dark.json; alpha-channel colors use float constructor", "verify": "pnpm tokens:generate && grep -A2 'object dark' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN mapbox.tokens.json defines map.style.light/dark WHEN pnpm tokens:generate runs THEN Tokens.kt contains object map { object style { val light; val dark } } with exact URL strings", "verify": "grep -n 'clxwarm01\\|clxnight02' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN dimensions.tokens.json defines sizing.stroke.sm/md/lg WHEN pnpm tokens:generate runs THEN Tokens.kt contains object sizing { object stroke { val sm = 1.dp; val md = 2.dp; val lg = 3.dp } }", "verify": "cd android && ./gradlew :theme:test --tests '*TokensDimensionsTest*'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN input-hash comment reflects source hash WHEN any value in colors.tokens.json is modified and generate re-runs THEN input-hash differs from prior value", "verify": "HASH_BEFORE=$(head -2 tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt | grep input-hash); echo $HASH_BEFORE" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN regenerated Tokens.kt WHEN ./gradlew :theme:test runs THEN BUILD SUCCESSFUL with 0 failures", "verify": "cd android && ./gradlew :theme:test" },
    { "id": "TC-1", "type": "test_criterion", "description": "Tokens.kt contains a val for surface.scrim-soft mapped as Color with alpha ~0.18 float constructor", "maps_to_ac": "AC-1", "verify": "grep 'scrimSoft\\|scrim_soft' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt" },
    { "id": "TC-2", "type": "test_criterion", "description": "Tokens.kt contains val for border.glass resolved to dark-mode rgba(242,238,232,0.22)", "maps_to_ac": "AC-2", "verify": "grep 'borderGlass\\|border.*glass' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt" },
    { "id": "TC-3", "type": "test_criterion", "description": "Tokens.kt map.style.light equals exactly 'mapbox://styles/laneshadow/clxwarm01'", "maps_to_ac": "AC-3", "verify": "grep 'clxwarm01' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt" },
    { "id": "TC-4", "type": "test_criterion", "description": "LaneShadowTheme.sizing.stroke.md equals 2.dp in generated Tokens.kt", "maps_to_ac": "AC-4", "verify": "grep -A1 'object stroke' tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt | grep 'md'" },
    { "id": "TC-5", "type": "test_criterion", "description": "ColorSetTest.bundledJson_decodesAllCoreGroups exits BUILD SUCCESSFUL after regeneration", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :theme:test --tests '*.ColorSetTest.bundledJson_decodesAllCoreGroups'" },
    { "id": "TC-6", "type": "test_criterion", "description": "pnpm tokens:generate with missing mapbox.tokens.json throws a clear error instead of silently emitting empty map.style block", "maps_to_ac": "AC-3", "verify": "mv tokens/semantic/mapbox.tokens.json tokens/semantic/mapbox.tokens.json.bak; pnpm tokens:generate 2>&1 | grep -i 'error\\|missing'; mv tokens/semantic/mapbox.tokens.json.bak tokens/semantic/mapbox.tokens.json" }
  ]
}
-->
