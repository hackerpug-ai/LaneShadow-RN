================================================================================
TASK: PRE-003 - Android Sandbox Tier System + Story Registration Pattern
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
PRIORITY: P0
EFFORT: L
ESTIMATE: 90 min
AGENT: kotlin-implementer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Extend Android SandboxTier enum to include Atom/Molecule/Organism/Template/Screen, establish the story registration pattern in AtomsStories, and verify the sandbox infrastructure is ready for Sprint 2 component registration.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/sandbox/model/SandboxStory.kt (MODIFY): Add tier enum values
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt (MODIFY): Add registration pattern comments
- Sandbox app compiles and story registration pattern is established

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] SandboxTier enum includes Atom, Molecule, Organism, Template, Screen (in addition to Infrastructure)
- [ ] AtomsStories.kt has comment pattern showing how to register stories
- [ ] Sandbox stories can be registered in all tier categories
- [ ] `./android/gradlew :app:compileDebugKotlin` exits 0
- [ ] RnReferenceRegistry is ready for Sprint 2 atom registration

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Implementing actual component stories (Sprint 2 responsibility)
- Creating molecule/organism/template/screen story registries yet
- Refactoring debug app structure

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Add SandboxTier enum values: Atom, Molecule, Organism, Template, Screen
- Add comment pattern in AtomsStories showing how to register stories
- Match native-sandbox library tier conventions (atoms/molecules use ComposableTier.Atom/Molecule)
- Leave AtomsStories.all empty (Sprint 2 fills with actual stories)

MUST NOT:
- Remove Infrastructure tier (still needed for debug infrastructure)
- Create actual component stories (just the pattern)
- Modify RnReferenceRegistry structure

STRICTLY:
- Follow existing SandboxStory pattern in AppStories.kt
- Verify gradle builds without errors

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Establish the sandbox tier system and story registration pattern so Sprint 2 can register components by tier.

**Current state**: SandboxTier only has Infrastructure. AtomsStories is empty. No pattern established for how to register.

**Target state**: Developers can register atom stories in AtomsStories following a clear pattern, with tier categorization for molecules/organisms/etc. prepared for future sprints.

**Success looks like**: `./android/gradlew :app:compileDebugKotlin` exits 0 and the sandbox app shows placeholder infrastructure stories ready for atom registration.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: SandboxTier extended with new values
  GIVEN: SandboxTier enum exists with Infrastructure only
  WHEN: The agent adds Atom, Molecule, Organism, Template, Screen values
  THEN: All new values compile and can be used in story registration
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-2: Registration pattern documented
  GIVEN: AtomsStories.kt exists as empty container
  WHEN: The agent adds comment pattern showing how to register stories
  THEN: Pattern clearly shows tier, component name, story variant structure
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-3: Story registration works
  GIVEN: Pattern is documented
  WHEN: A developer follows the pattern to add a test atom story
  THEN: Story compiles and appears in sandbox app
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-4: Sandbox app builds
  GIVEN: All tier values and patterns are in place
  WHEN: Agent compiles debug app
  THEN: `./android/gradlew :app:compileDebugKotlin` exits 0
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-5: RnReferenceRegistry is ready
  GIVEN: Tiers are established
  WHEN: Agent verifies registry structure
  THEN: Registry can accept atom, molecule, organism registrations
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/sandbox/model/SandboxStory.kt
   - Lines: ALL
   - Focus: SandboxTier enum and Story data class

2. android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt
   - Lines: ALL
   - Focus: Current empty structure and where pattern goes

3. android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt
   - Lines: ALL
   - Focus: Existing infrastructure story pattern to follow

4. .spec/prds/native-rewrite/08d-component-parity-spec.md
   - Sections: Tier definitions
   - Focus: Atom/Molecule/Organism conventions

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- android/app/src/main/java/com/laneshadow/ui/sandbox/model/SandboxStory.kt (MODIFY)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt (MODIFY)

WRITE-PROHIBITED:
- RnReferenceRegistry structure — read-only
- Other sandbox story files
- Component implementation code

MUST:
- [ ] Add 5 new tier enum values (Atom, Molecule, Organism, Template, Screen)
- [ ] Add clear comment pattern in AtomsStories
- [ ] Build and verify no type errors
- [ ] Leave AtomsStories.all empty for Sprint 2

MUST NOT:
- [ ] Remove Infrastructure tier
- [ ] Create actual component stories
- [ ] Change RnReferenceRegistry structure

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state**: Sandbox infrastructure exists but tiers are incomplete and no story registration pattern is documented.

**Why now**: Sprint 2 needs to register 42 atom stories, 107 molecule stories, etc. Tier system and pattern must be in place first.

**Platform parity**: PRE-004 establishes the same pattern for iOS (which already has native-sandbox tier support).

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: kotlin-implementer

1. READ SandboxStory.kt and understand current tier structure
2. READ AtomsStories.kt to see current empty state
3. READ AppStories.kt to understand existing story pattern
4. ADD to SandboxTier enum: Atom, Molecule, Organism, Template, Screen
5. ADD comment block in AtomsStories showing pattern:
   - How to define a story with tier, component name, variant
   - Example structure (without implementation)
   - Reference to matrix file location
6. VERIFY gradle compiles: `./android/gradlew :app:compileDebugKotlin` exits 0
7. RUN sandbox app and verify no errors
8. COMMIT with message: "PRE-003: Extend Android sandbox tier system + document story registration pattern"

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- PRE-001 — Theme accessors available

Blocks:
- All Sprint 2 Android atom and molecule tasks
- Sprint 2 Android organism/template/screen tasks

