================================================================================
TASK: PRE-005 - Fix Sprint 2 Task File Paths + Add Centralized Theme Mandate
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
PRIORITY: P0
EFFORT: XL
ESTIMATE: 180 min
AGENT: planner
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Correct all Sprint 2 task file paths to match canonical project structure, and inject a mandatory THEME COMPLIANCE section into every UI task to enforce centralized theming (zero hardcoded values).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-*.md (MODIFY): ~388 files with corrected paths + THEME COMPLIANCE section
- .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/MDL-*.md (MODIFY): ~11 files with corrected paths + theme reference
- Corrected component output paths matching `android/app/src/main/java/com/laneshadow/ui/components/{layer}/` and `ios/LaneShadow/Views/{Layer}/` standards
- Theme compliance enforced and documented in every task

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] All 388 UI task files have corrected Android component output path
- [ ] All 388 UI task files have corrected iOS component output path
- [ ] All 388 UI task files include THEME COMPLIANCE (MANDATORY) section
- [ ] All 11 MDL task files have corrected paths and theme references
- [ ] Test file paths corrected to match new component paths
- [ ] Reading list paths updated (matrices reference unchanged, source paths updated)
- [ ] No task references `react-native/android/app/...` (old path pattern)
- [ ] THEME COMPLIANCE section includes specific requirements:
  - Color sources (LocalLaneShadowTheme.current or @Environment)
  - Space sources (theme.space.*)
  - Radius sources (theme.radius.*)
  - ALL visual properties sourced from theme
  - Zero hardcoded values = immediate FAIL in review
- [ ] Spot-check: 10 random task files score ≥80/115 on kb-sprint-tasks-plan rubric

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Executing Sprint 2 implementation tasks
- Creating new matrices or translation plans
- Refactoring task structure beyond path fixes
- Implementing actual components

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Fix ALL paths (388 UI + 11 MDL = 399 total)
- Android output: `android/app/src/main/java/com/laneshadow/ui/components/{atoms|molecules|organisms|templates|screens}/{ComponentName}.kt`
- iOS output: `ios/LaneShadow/Views/{Atoms|Molecules|Organisms|Templates|Screens}/{ComponentName}.swift`
- Android test: `android/app/src/test/java/com/laneshadow/ui/components/{layer}/{ComponentName}Test.kt`
- iOS test: `ios/LaneShadowTests/Views/{Layer}/{ComponentName}Tests.swift`
- Add THEME COMPLIANCE section (MANDATORY) to ALL UI tasks
- THEME COMPLIANCE must be specific, not generic (name exact token categories)

MUST NOT:
- Leave any `react-native/android/app/...` paths in active tasks
- Create new task files (only modify existing)
- Change reading list references to matrices
- Miss any UI or MDL task files

STRICTLY:
- Use consistent case: atoms/, molecules/, organisms/ (lowercase)
- Test paths must reflect component output paths
- THEME COMPLIANCE wording consistent across all tasks
- Verify with grep that zero REACT-NATIVE paths remain in active directory

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Repair Sprint 2 task paths to match actual project structure and enforce centralized theming as a first-class, non-negotiable requirement.

**Current state**: Sprint 2 task files reference non-standard path `react-native/android/app/src/main/java/com/laneshadow/components/ui/`. No theme compliance requirement documented. Paths don't match actual canonical structure.

**Target state**: Every task references correct paths matching `android/app/src/main/java/com/laneshadow/ui/components/` and includes explicit theme compliance mandate. Components will fail review if they use hardcoded colors/spacing/radius.

**Success looks like**: `grep -r 'react-native/android' .spec/prds/native-rewrite/tasks/sprint-02*` returns 0 matches (archived folder ok). `grep -c 'THEME COMPLIANCE' .spec/prds/native-rewrite/tasks/sprint-02*/UI-*.md` returns 388. Spot-check confirms theme compliance sections are substantive and specific.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All Android paths corrected
  GIVEN: 388 UI task files exist
  WHEN: The agent updates all Android component output paths
  THEN: Zero files reference `react-native/android/app/...`; all use `android/app/src/main/java/com/laneshadow/ui/components/{layer}/{Component}.kt`
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-2: All iOS paths corrected
  GIVEN: 388 UI task files exist
  WHEN: The agent updates all iOS component output paths
  THEN: All iOS tasks reference `ios/LaneShadow/Views/{Layer}/{Component}.swift`
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-3: All test paths corrected
  GIVEN: Component paths are updated
  WHEN: The agent updates test file paths
  THEN: Test paths mirror component paths (matching layer directory structure)
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-4: Theme compliance section added
  GIVEN: All UI tasks exist
  WHEN: The agent adds THEME COMPLIANCE (MANDATORY) section
  THEN: All 388 UI tasks include section with specific color/space/radius sources
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-5: MDL tasks updated
  GIVEN: 11 MDL task files exist
  WHEN: The agent updates paths and adds theme context
  THEN: All MDL tasks reference correct paths and include theme import notes
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-6: Paths verified by grep
  GIVEN: All tasks are updated
  WHEN: The agent runs verification queries
  THEN: `grep -r 'react-native/android' .spec/prds/native-rewrite/tasks/sprint-02*` returns 0 matches
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-7: Theme compliance verified by grep
  GIVEN: All tasks are updated
  WHEN: The agent runs verification query
  THEN: `grep -c 'THEME COMPLIANCE' .spec/prds/native-rewrite/tasks/sprint-02*/UI-*.md` returns 388
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-8: Quality sample verified
  GIVEN: All tasks are updated
  WHEN: The agent spot-checks 10 random UI tasks against kb-sprint-tasks-plan rubric
  THEN: All 10 score ≥80/115 on quality dimensions (clarity, completeness, AC coverage)
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-001-android-avatar.md
   - Lines: ALL
   - Focus: Current incorrect path structure as baseline

2. .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/MDL-001-atomic-write.md
   - Lines: ALL
   - Focus: Model task structure and path pattern

3. RULES.md (project root)
   - Sections: Component file structure, canonical paths
   - Focus: Authoritative path conventions

4. .spec/prds/native-rewrite/08e-cross-platform-theme-module.md
   - Sections: Theme module organization
   - Focus: How components access theme values

5. android/app/src/main/java/com/laneshadow/ui/components/ (INSPECT)
   - Focus: Actual directory structure to validate path corrections

6. ios/LaneShadow/Views/ (INSPECT)
   - Focus: Actual iOS directory structure to validate path corrections

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-*.md (MODIFY, all 388)
- .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/MDL-*.md (MODIFY, all 11)

WRITE-PROHIBITED:
- _archived/ folder (don't touch)
- SPRINT.md or INDEX.md (read-only)
- Any matrix files
- sprint-01a files (except PRE-005 this file)

MUST:
- [ ] Update all 388 UI task files
- [ ] Update all 11 MDL task files
- [ ] Add THEME COMPLIANCE section to every UI task
- [ ] Verify grep results show zero old paths, 388 compliance sections
- [ ] Spot-check quality on 10 random files

MUST NOT:
- [ ] Miss any active task file
- [ ] Create new task files
- [ ] Modify matrix references in reading lists
- [ ] Leave old path patterns in place

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state**: Sprint 2 tasks reference non-canonical paths. Theme compliance is not explicitly required. Components could be implemented with hardcoded values.

**Why now**: Sprint 2 tasks are rewritten (FND-008) but paths are wrong and theme mandate missing. Can't dispatch implementers until paths are correct and requirements crystal clear.

**Design goal**: Centralized theming (zero hardcoding) is a non-negotiable requirement for the native rewrite. Every task must state this explicitly.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: planner

1. INSPECT actual directory structure:
   - `find android/app/src/main/java/com/laneshadow/ui/components -type d | sort`
   - `find ios/LaneShadow/Views -type d | sort`
   - Confirm layer names and case (atoms, molecules, etc.)

2. READ RULES.md and confirm canonical path conventions

3. FOR EACH of 388 UI task files:
   a. Find DELIVERABLE section with wrong path
   b. Replace `react-native/android/app/src/main/java/com/laneshadow/components/ui/` 
      with `android/app/src/main/java/com/laneshadow/ui/components/{layer}/`
   c. Fix iOS path similarly to `ios/LaneShadow/Views/{Layer}/`
   d. Update test file paths to match
   e. ADD new section before GUARDRAILS:
      ```
      --------------------------------------------------------------------------------
      THEME COMPLIANCE (MANDATORY)
      --------------------------------------------------------------------------------
      
      All colors MUST use:
      - Android: LocalLaneShadowTheme.current.colors.*
      - iOS: @Environment(\.theme).colors.*
      
      All spacing MUST use: theme.space.*
      All radius MUST use: theme.radius.*
      All elevation MUST use: theme.elevation.* (Android) or Theme.elevation.* (iOS)
      All opacity MUST use: theme.opacity.*
      All motion (duration, easing) MUST use: theme.motion.*
      
      Zero hardcoded color, spacing, radius, elevation, opacity, or motion values.
      Hardcoded visual properties = immediate FAIL in code review.
      ```
   f. Update READING LIST paths if they reference source files

4. FOR EACH of 11 MDL task files:
   a. Correct any path references
   b. Add note about theme imports/usage where relevant

5. VERIFY:
   - `grep -r 'react-native/android' .spec/prds/native-rewrite/tasks/sprint-02*` → 0 matches (exclude _archived)
   - `grep -c 'THEME COMPLIANCE' .spec/prds/native-rewrite/tasks/sprint-02*/UI-*.md` → 388
   - Spot-check 10 random UI task files:
     - Paths are correct
     - THEME COMPLIANCE section present and substantive
     - Overall task quality ≥80/115

6. COMMIT with message: "PRE-005: Correct Sprint 2 task paths and add mandatory theme compliance requirements"

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- PRE-001 — Android theme accessors available
- PRE-002 — iOS theme accessors available
- PRE-003 — Android sandbox tiers available
- PRE-004 — iOS sandbox tiers available

Blocks:
- All Sprint 2 implementation tasks (cannot dispatch until paths correct and theme mandate clear)

