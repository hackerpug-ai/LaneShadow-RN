================================================================================
TASK: PRE-004 - iOS Sandbox Tier System + Story Registration Pattern
================================================================================

TASK_TYPE: FEATURE
STATUS: Complete
PRIORITY: P0
EFFORT: L
ESTIMATE: 90 min
AGENT: swift-implementer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Establish the story registration pattern in iOS AtomsStories, verify NativeSandbox library tier support, and document the pattern for Sprint 2 component registration.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift (MODIFY): Add registration pattern comments
- iOS sandbox app compiles and story registration pattern is established

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AtomsStories.swift has comment pattern showing how to register atom stories
- [ ] Pattern includes tier specification (atom, molecule, organism, template, screen)
- [ ] NativeSandbox library tier support verified (.atom, .molecule, .organism, .template, .screen)
- [ ] `xcodebuild -scheme LaneShadow -configuration Debug build` exits 0
- [ ] Pattern is ready for Sprint 2 atom story registration

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Implementing actual component stories (Sprint 2 responsibility)
- Creating molecule/organism/template/screen story registries yet
- Refactoring LaneShadowStories debug app structure

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Add comment pattern in AtomsStories showing story registration
- Verify NativeSandbox library supports .atom, .molecule, .organism, .template, .screen tiers
- Match iOS tier conventions from native-sandbox library
- Leave AtomsStories.all empty (Sprint 2 fills with actual stories)

MUST NOT:
- Create actual component stories (just the pattern)
- Modify LaneShadowStories app structure
- Assume iOS has missing tiers (verify library support)

STRICTLY:
- Follow existing LaneShadowStories pattern from library
- Verify Xcode build succeeds

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Establish the iOS sandbox tier system and story registration pattern so Sprint 2 can register components by tier.

**Current state**: AtomsStories is empty. NativeSandbox library tier support needs verification.

**Target state**: Developers can register atom stories in AtomsStories following a clear pattern, with tier categorization for molecules/organisms/etc. verified.

**Success looks like**: `xcodebuild -scheme LaneShadow -configuration Debug build` exits 0 and the sandbox app shows placeholder stories ready for atom registration.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: NativeSandbox tiers verified
  GIVEN: NativeSandbox library provides tier enums
  WHEN: The agent checks library API for .atom, .molecule, .organism, .template, .screen
  THEN: All tiers are available and documented
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-2: Registration pattern documented
  GIVEN: AtomsStories.swift exists as container with empty all array
  WHEN: The agent adds comment pattern showing how to register stories
  THEN: Pattern clearly shows tier, component name, story variant structure
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-3: Story registration works
  GIVEN: Pattern is documented
  WHEN: A developer follows the pattern to add a test atom story
  THEN: Story compiles and appears in sandbox app
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-4: iOS app builds
  GIVEN: All patterns are in place
  WHEN: Agent builds debug app
  THEN: `xcodebuild -scheme LaneShadow -configuration Debug build` exits 0
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-5: Ready for Spring 2 registration
  GIVEN: Pattern and tiers are verified
  WHEN: Agent confirms structure
  THEN: 42 atom story registrations can follow the documented pattern
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Sandbox/Stories/AtomsStories.swift
   - Lines: ALL
   - Focus: Current empty structure and where pattern goes

2. ios/LaneShadow/Sandbox/Stories/LaneShadowStories.swift
   - Lines: ALL
   - Focus: Existing story pattern and NativeSandbox usage

3. Native Sandbox library documentation (from node_modules or package)
   - Focus: Available tier enum values (.atom, .molecule, .organism, .template, .screen)

4. .spec/prds/native-rewrite/08d-component-parity-spec.md
   - Sections: Tier definitions
   - Focus: Atom/Molecule/Organism conventions

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift (MODIFY)

WRITE-PROHIBITED:
- LaneShadowStories.swift — read-only reference
- Other sandbox story files
- Component implementation code

MUST:
- [ ] Add comment pattern showing story registration
- [ ] Verify all tiers supported by NativeSandbox library
- [ ] Build and verify no type errors
- [ ] Leave AtomsStories.all empty for Sprint 2

MUST NOT:
- [ ] Create actual component stories
- [ ] Assume tier support without verification
- [ ] Modify existing story structure

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state**: iOS sandbox exists with LaneShadowStories but AtomsStories is empty and registration pattern not documented.

**Why now**: Sprint 2 needs to register 42 atom stories, 107 molecule stories, etc. Pattern must be clear and verified first.

**Platform parity**: PRE-003 establishes the same pattern for Android (which needed tier enum extension).

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: swift-implementer

1. READ AtomsStories.swift to see current empty state
2. READ LaneShadowStories.swift to understand existing story pattern and tier usage
3. VERIFY NativeSandbox library has tier support:
   - Check for ComposableTier or StoryTier enum
   - Confirm .atom, .molecule, .organism, .template, .screen values exist
   - Document findings
4. ADD comment block in AtomsStories showing pattern:
   - How to define a story with tier, component name, variant
   - Example structure (without implementation)
   - Reference to matrix file location
5. VERIFY build: `xcodebuild -scheme LaneShadow -configuration Debug build` exits 0
6. RUN sandbox app and verify no errors
7. COMMIT with message: "PRE-004: Document iOS sandbox story registration pattern and verify tier support"

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- PRE-002 — Theme accessors available

Blocks:
- All Sprint 2 iOS atom and molecule tasks
- Sprint 2 iOS organism/template/screen tasks

