================================================================================
TASK: MDL-008 - ModelManifest Model Translation
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
PRIORITY: P1
EFFORT: M
AGENT: kotlin-implementer
SPRINT: sprint-02-ui-component-translation

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Translate model-manifest model/logic from TypeScript to Kotlin following the MODEL translation plan.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- react-native/android/app/src/main/java/com/laneshadow/models/ModelManifest.kt (NEW): Kotlin implementation
- react-native/android/app/src/test/java/com/laneshadow/models/ModelManifestTest.kt (NEW): Model tests

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] All exports from source file have Kotlin equivalents
- [ ] Async operations use coroutines properly
- [ ] Platform storage abstractions match (SharedPreferences/DataStore)
- [ ] Tests cover all public methods
- [ ] Error handling matches source behavior

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- UI components (handled by UI-* tasks)
- Network layer changes
- Database migrations

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Public API matches source
  GIVEN: TypeScript source defines exported functions
  WHEN: Kotlin equivalents are called
  THEN: Function signatures match (names, parameters, return types)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: ModelManifestTest.kt
  TEST_FUNCTION: testPublicAPIMatchesSource

AC-2: Async operations use coroutines
  GIVEN: Source uses async/await patterns
  WHEN: Kotlin equivalents are invoked
  THEN: Functions are suspend functions with proper context

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: ModelManifestTest.kt
  TEST_FUNCTION: testAsyncOperationsUseCoroutines

AC-3: Storage abstractions work correctly
  GIVEN: Source uses AsyncStorage/secure storage
  WHEN: Kotlin equivalents read/write data
  THEN: Data persists correctly using platform storage

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: ModelManifestTest.kt
  TEST_FUNCTION: testStorageAbstractions

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. matrices/models/MODEL-model-manifest.md
   - Lines: ALL
   - Focus: SOURCE ANALYSIS and TRANSLATION STRATEGY

2. react-native/lib/model-manifest.ts
   - Lines: ALL
   - Focus: Exports, dependencies, key behaviors

3. brain/docs/native/kotlin-coroutines-patterns.md
   - Sections: Suspend functions, context, flow
   - Focus: Async patterns

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- react-native/android/app/src/main/java/com/laneshadow/models/ModelManifest.kt (NEW)
- react-native/android/app/src/test/java/com/laneshadow/models/ModelManifestTest.kt (NEW)

WRITE-PROHIBITED:
- matrices/** — read-only references
- react-native/lib/model-manifest.ts (MODIFY) — source is reference only

MUST:
- [ ] Follow translation strategy from MODEL-model-manifest.md
- [ ] Use coroutines for async operations
- [ ] Match function signatures from source
- [ ] Handle errors equivalently to source
- [ ] Test all public methods

MUST NOT:
- [ ] Change the public API contract
- [ ] Use blocking IO on main thread
- [ ] Skip error handling from source

--------------------------------------------------------------------------------
CODE PATTERN
--------------------------------------------------------------------------------

// Kotlin model pattern
class ModelManifestManager(
    private val context: Context
) {
    // Implementation following translation strategy
}

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** model-manifest exists as TypeScript module
**Gap:** No Kotlin implementation exists

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: kotlin-implementer

1. READ matrices/models/MODEL-model-manifest.md for complete translation strategy
2. READ TypeScript source for API contract
3. IMPLEMENT Kotlin equivalents using coroutines
4. TEST all public methods
5. VERIFY error handling matches source

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-006 — MODEL-model-manifest.md translation plan complete

Blocks: (none — MDL tasks are leaf nodes)
