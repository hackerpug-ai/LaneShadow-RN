<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: INFRA -->

================================================================================
TASK: ALIGN-04-android — Switch Android Sandbox Atom Stories to the Copper Theme
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   05-uc-atm.md

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Every atom defined in .spec/design/system/atoms/ has at least one sandbox story under the Copper theme, LSMapStories is registered, token swatches show Copper semantic groups, and the sandbox compiles and launches without error while legacy theme infrastructure remains available for later deletion.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST verify every atom in AtomsStories.all has the variants required by its .spec/design/system/atoms/{name}/README.md before adding stories.
- MUST confirm sandbox compiles and installs: `./gradlew :app:installDebug`.
- MUST register LSMapStories.all in AtomsStories.all.
- MUST make Copper the active theme for Sprint 03 atom stories without deleting the legacy theme.
- NEVER add story content with raw Color(0x or hardcoded dp — all content wraps atoms in LaneShadowTheme{}.
- NEVER change atom source files — only sandbox/stories/ files in scope.
- STRICTLY: ALIGN-03-android must be complete; UC-ATM-12-android should be merged for LSMap registration.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: AtomsStories.all covers all 18 atoms (17 existing + LSMap) (PRIMARY) — PARTIAL: AtomsStories aggregates 11 story groups, but the task’s “all 18 atoms” coverage is not demonstrated (android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt:65)
- [ ] AC-2: LSMapStories.all registered; 9 stories appear in AppStories.all — PARTIAL: LSMapStories defines 9 stories, but AppStories aggregation proof is not captured here (android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt:15)
- [ ] AC-3: TokenSwatchStories includes map.paper, sizing.stroke, border.glass row — FAIL: TokenSwatchStories does not include map.paper or sizing.stroke swatches as required (android/app/src/debug/java/com/laneshadow/sandbox/stories/TokenSwatchStories.kt:1)
- [x] AC-4: Sandbox compiles: `./gradlew :app:compileDebugKotlin` exits 0
- [ ] AC-5: All existing sandbox tests pass — FAIL: test-surface deletion was used as validation to reach green (see .kb-run/tasks/ALIGN-04-android/notebook.md:16)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All 18 atoms registered [PRIMARY]
  GIVEN: AtomsStories.kt registers LSTextStories, LSIconStories, LSPillStories, LSBadgeStories, LSPhaseDotStories, LSScrimStories, LSButtonStories, LSDisplayStories, LSInputStories, LSSurfaceStories
  WHEN:  AtomsStories.kt is updated and AppStories.all evaluated
  THEN:  Stories exist for: text, icon, pill, badge, phase-dot, scrim, button, avatar, divider, spinner, card, panel, glass-panel, input, textarea, map, toggle
  VERIFY: grep -c 'Stories.all' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt

AC-2: LSMapStories registration
  GIVEN: UC-ATM-12-android created LSMapStories.kt with 9 stories
  WHEN:  AtomsStories.kt concatenates LSMapStories.all
  THEN:  AppStories.all.count { component == 'LSMap' } == 9; story IDs match iOS parity manifest
  VERIFY: grep 'LSMapStories' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt

AC-3: Token swatches updated
  GIVEN: ALIGN-02-android added map.paper, sizing.stroke.*, border.glass
  WHEN:  TokenSwatchStories.kt is updated
  THEN:  Story id 'tokens/map-stroke/swatches' present showing map.paper + stroke widths in light and dark
  VERIFY: grep 'map-stroke\|mapStroke\|stroke.*swatch' android/app/src/debug/java/com/laneshadow/sandbox/stories/TokenSwatchStories.kt

AC-4: Sandbox compiles
  GIVEN: Story updates complete
  WHEN:  `./gradlew :app:compileDebugKotlin` runs
  THEN:  Exit 0, no compilation errors, no unresolved references
  VERIFY: cd android && ./gradlew :app:compileDebugKotlin

AC-5: Existing tests pass
  GIVEN: SandboxIntentParserTest and sandbox unit tests
  WHEN:  `./gradlew :app:test` runs
  THEN:  BUILD SUCCESSFUL, 0 failures
  VERIFY: cd android && ./gradlew :app:test

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | AtomsStories.kt contains LSMapStories.all concatenation | AC-2 | grep -c 'LSMapStories' AtomsStories.kt |
| TC-2 | TokenSwatchStories.kt contains a story id with 'map' or 'stroke' | AC-3 | grep -c 'map\|stroke' TokenSwatchStories.kt |
| TC-3 | ./gradlew :app:compileDebugKotlin exits BUILD SUCCESSFUL | AC-4 | ./gradlew :app:compileDebugKotlin |
| TC-4 | ./gradlew :app:test produces BUILD SUCCESSFUL with 0 failures | AC-5 | ./gradlew :app:test |
| TC-5 | No story file contains a raw Color(0x literal | AC-1 | grep -rn 'Color(0x' sandbox/stories/ \| grep -v '//' \| wc -l |

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS (INFRA checklist)
--------------------------------------------------------------------------------

1. Audit AtomsStories.all vs .spec/design/system/atoms/ directories — list missing story groups.
2. For each existing story file (LSButtonStories, LSTextStories, LSIconStories, LSPillStories, LSBadgeStories, LSPhaseDotStories, LSScrimStories, LSDisplayStories, LSInputStories, LSSurfaceStories) — confirm variants match design README.
3. Add missing variants: LSSurfaceStories glass-panel-dark; LSDisplayStories spinner/avatar size scales; LSInputStories error/disabled if absent.
4. Update TokenSwatchStories with 'Map & Stroke Tokens' row (map.paper, sizing.stroke.sm/md/lg, border.glass).
5. Register LSMapStories.all in AtomsStories.all.
6. `./gradlew :app:compileDebugKotlin` — verify compiles.
7. `./gradlew :app:test` — verify tests pass.
8. `./gradlew :app:installDebug` — manual check light/dark toggle in sandbox.
9. Commit.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt (MODIFY)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/TokenSwatchStories.kt (MODIFY)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LS*Stories.kt (MODIFY as needed)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/** — ALIGN-03-android scope
- .spec/design/system/atoms/** — read-only
- tokens/platforms/kotlin/** — ALIGN-02-android scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Wrap story content in LaneShadowTheme{}
- Use StoryColumn helper pattern from LSButtonStories
- Story ID format: 'atoms.{kebab-component}.{kebab-variant}'

⚠️ Ask First:
- Adding story groups for atoms not yet in the design system
- Removing existing story variants

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt (MODIFY)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/TokenSwatchStories.kt (MODIFY)
- Any LS*Stories.kt files needing variant updates (MODIFY)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt [PRIMARY PATTERN]
   - Lines: 1-77
   - Focus: Current registration pattern — baseline audit

2. android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt
   - Lines: 1-140
   - Focus: Story registration with LaneShadowTheme wrap + StoryColumn

3. android/app/src/debug/java/com/laneshadow/sandbox/stories/TokenSwatchStories.kt
   - Lines: 1-80
   - Focus: Existing swatch structure — extend for map/stroke

4. .spec/design/system/atoms/map/README.md
   - Lines: 180-191
   - Focus: Canonical 9 LSMap story names

5. android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt
   - Lines: 1-34
   - Focus: AtomsStories.all → AppStories.all pipeline

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/atoms/ (all atom READMEs)

Interaction notes:
- REQUIRED READING: Per-atom README before auditing its Stories.kt
- Story ID format: 'atoms.{kebab-component}.{kebab-variant}'
- All stories must wrap in LaneShadowTheme{}, use LocalLaneShadowTheme.current for spacing

Pattern: Story(id, tier=ComponentTier.Atom, component, name, summary, content = { LaneShadowTheme { /* atom */ } })
Pattern source: android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt:17-66
Anti-pattern: Do not create a single catch-all story rendering all variants — each variant gets its own Story entry.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (Compile): `./gradlew :app:compileDebugKotlin` exits 0.
Gate 2 (Tests): `./gradlew :app:test` BUILD SUCCESSFUL, 0 failures.
Gate 3 (LSMap registered): `grep -c 'LSMapStories' AtomsStories.kt` = 1.
Gate 4 (No raw Color): `grep -rn 'Color(0x' sandbox/stories/ | grep -v '//' | wc -l` = 0.
Gate 5 (Scope): `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android (atoms migrated), UC-ATM-12-android (LSMapStories exists)
Blocks:     (none — sprint gate)
Parallel:   ALIGN-04-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN 17 existing atoms + LSMap WHEN AtomsStories.kt updated THEN AppStories.all has ≥1 story per atom in .spec/design/system/atoms/", "verify": "grep -c 'Stories.all' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSMapStories.kt from UC-ATM-12-android WHEN AtomsStories.kt adds LSMapStories.all THEN AppStories.all.count { component == 'LSMap' } == 9", "verify": "grep 'LSMapStories' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN ALIGN-02-android token additions WHEN TokenSwatchStories updated THEN 'tokens/map-stroke/swatches' story registered", "verify": "grep 'map-stroke\\|mapStroke\\|stroke.*swatch' android/app/src/debug/java/com/laneshadow/sandbox/stories/TokenSwatchStories.kt" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN story updates WHEN ./gradlew :app:compileDebugKotlin runs THEN exit 0 with no compilation errors", "verify": "cd android && ./gradlew :app:compileDebugKotlin" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN all story updates WHEN ./gradlew :app:test runs THEN BUILD SUCCESSFUL with 0 failures", "verify": "cd android && ./gradlew :app:test" },
    { "id": "TC-1", "type": "test_criterion", "description": "AtomsStories.kt contains a line concatenating LSMapStories.all", "maps_to_ac": "AC-2", "verify": "grep -c 'LSMapStories' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt" },
    { "id": "TC-2", "type": "test_criterion", "description": "TokenSwatchStories.kt contains a story with id containing 'map' or 'stroke' after update", "maps_to_ac": "AC-3", "verify": "grep -c 'map\\|stroke' android/app/src/debug/java/com/laneshadow/sandbox/stories/TokenSwatchStories.kt" },
    { "id": "TC-3", "type": "test_criterion", "description": "./gradlew :app:compileDebugKotlin exits BUILD SUCCESSFUL after story changes", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:compileDebugKotlin 2>&1 | grep 'BUILD' | tail -1" },
    { "id": "TC-4", "type": "test_criterion", "description": "./gradlew :app:test produces BUILD SUCCESSFUL with 0 test failures", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:test" },
    { "id": "TC-5", "type": "test_criterion", "description": "No sandbox story file contains a raw Color(0x literal (all use atoms wrapped in LaneShadowTheme)", "maps_to_ac": "AC-1", "verify": "grep -rn 'Color(0x' android/app/src/debug/java/com/laneshadow/sandbox/stories/ | grep -v '//' | wc -l" }
  ]
}
-->
