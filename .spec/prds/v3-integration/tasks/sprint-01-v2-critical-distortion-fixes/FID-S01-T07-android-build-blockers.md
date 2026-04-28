================================================================================
TASK: FID-S01-T07 - Android Critical Build Blockers
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-2 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android app compiles without errors — `Session` data class is declared in LSSessionsDrawer.kt and `PolylineDecoder.decodeOrNull()` decodes polyline strings in RouteDetailsScreen.kt.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST declare `Session` data class inline in LSSessionsDrawer.kt with fields `(id: String, title: String, whenLabel: String, preview: String, meta: String)`
- MUST decode `state.route.polyline` via `PolylineDecoder.decodeOrNull()` in RouteDetailsScreen.kt — NOT return `emptyList()`
- NEVER leave the `Session` type unreferenced — this blocks ALL Android compilation
- NEVER silently return an empty polyline list when polyline data is available

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `./gradlew assembleDebug` exits 0 with zero compilation errors (AC-1 PRIMARY)
- [ ] RouteDetailsScreen renders a real polyline from mock data (AC-2)
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Session data class declared [PRIMARY]
  GIVEN: Android project is compiled via `./gradlew :app:compileDebugKotlin`
  WHEN:  The compiler processes LSSessionsDrawer.kt
  THEN:  `Session` data class is declared with fields `(id, title, whenLabel, preview, meta)` and no unresolved-reference errors

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/BuildBlockerTests.kt
  TEST_FUNCTION: testSessionDataClassDeclaration

AC-2: Polyline decoded from route state
  GIVEN: RouteDetailsScreen is displayed in sandbox with mock route data
  WHEN:  The map renders
  THEN:  Polyline coordinates are decoded from `state.route.polyline` via `PolylineDecoder.decodeOrNull()` — map shows a visible route, not blank

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/BuildBlockerTests.kt
  TEST_FUNCTION: testPolylineDecodedFromState

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY — add Session data class)
- android/app/src/main/java/com/laneshadow/ui/screens/RouteDetailsScreen.kt (MODIFY — decode polyline)
- android/app/src/test/java/com/laneshadow/sandbox/BuildBlockerTests.kt (NEW)

writeProhibited:
- ios/**, server/**, react-native/**, any file not listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY): Declare Session data class
- android/app/src/main/java/com/laneshadow/ui/screens/RouteDetailsScreen.kt (MODIFY): PolylineDecoder.decodeOrNull() instead of emptyList()

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt [PRIMARY PATTERN]
   - Focus: Current Session type references without declaration, compilation failure point

2. android/app/src/main/java/com/laneshadow/ui/screens/RouteDetailsScreen.kt
   - Focus: Current `emptyList()` polyline call, state.route.polyline access

3. .spec/prds/v3-integration/remediations/04-organisms.md
   - Sections: Gap C-07 (Session data class), Gap A2-01 (polyline decode)

4. android/app/src/main/java/com/laneshadow/util/PolylineDecoder.kt
   - Focus: decodeOrNull() API — verify it exists and its signature

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED evidence in TDD_STATE
Gate 2: One test per AC
Gate 3: ./gradlew test exits 0
Gate 4: ./gradlew assembleDebug exits 0
Gate 5: native-compliance exits 0
Gate 6: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Session data class migration to shared model package (Sprint 02)
- RouteDetailsScreen variant stories (Sprint 02)
- Polyline draw-on animation (Sprint 02)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** `LSSessionsDrawer.kt` references `Session` type throughout but never declares it — blocking ALL Android compilation. `RouteDetailsScreen.kt` passes `emptyList()` for polyline coordinates, producing a blank map despite mock data having polyline strings.
**Gap:** Compilation must succeed for any other Android task to proceed. Polyline decode is a functional gap visible in the sandbox.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None
Blocks:     FID-S01-T06, FID-S01-T08
Parallel:   FID-S01-T01..T05

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN Android project compiled WHEN LSSessionsDrawer.kt processed THEN Session data class declared with all fields and no errors", "verify": "./gradlew :app:compileDebugKotlin" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN RouteDetailsScreen with mock route data WHEN map renders THEN polyline decoded via PolylineDecoder.decodeOrNull() not emptyList()", "verify": "./gradlew test" },
    { "id": "TC-1", "type": "test_criterion", "description": "Session data class has id, title, whenLabel, preview, meta fields", "maps_to_ac": "AC-1", "verify": "./gradlew test --tests '*.BuildBlockerTests.testSessionDataClassDeclaration'" },
    { "id": "TC-2", "type": "test_criterion", "description": "Polyline decoded from state.route.polyline produces non-empty coordinate list", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.BuildBlockerTests.testPolylineDecodedFromState'" }
  ]
}
-->
