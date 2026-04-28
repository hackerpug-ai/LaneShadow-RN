================================================================================
TASK: AUTH-S03-T02 - Type-gen pipeline
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      pnpm --dir server test
  typecheck: pnpm --dir server exec tsc --noEmit
  lint:      pnpm exec biome check server/

PROGRESS: 0/5 AC · not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Create server/scripts/generate-mobile-types.ts that emits Swift and Kotlin type files from Convex _generated/api.d.ts.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST read from server/convex/_generated/api.d.ts (the source of truth)
- MUST generate Swift Codable structs for all Convex document types
- MUST generate Kotlin @Serializable data classes matching same shapes
- MUST add server:codegen script to root package.json
- STRICTLY commit generated files to git (not gitignored) for IDE reference

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] server/scripts/generate-mobile-types.ts script exists and runs
- [ ] ios/LaneShadow/Generated/ConvexTypes.generated.swift generated
- [ ] android/app/src/main/.../generated/ConvexTypes.kt generated
- [ ] pnpm server:codegen script added to package.json
- [ ] Generated files compile on both platforms
- [ ] pnpm --dir server exec tsc --noEmit passes

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Script reads Convex types from _generated/api.d.ts
  GIVEN: Convex codegen has generated _generated/api.d.ts
  WHEN:  Developer runs pnpm server:codegen
  THEN:  Script parses Convex types successfully

  TDD_STATE:     none
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_scriptReadsConvexTypesFromGeneratedApi

AC-2: Swift Codable structs generated [PRIMARY]
  GIVEN: Script has parsed Convex types
  WHEN:  Script runs Swift generation phase
  THEN:  Swift Codable structs emitted to ios/LaneShadow/Generated/ConvexTypes.generated.swift

  TDD_STATE:     none
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_swiftCodableStructsGenerated

AC-3: Kotlin @Serializable data classes generated [PRIMARY]
  GIVEN: Script has parsed Convex types
  WHEN:  Script runs Kotlin generation phase
  THEN:  Kotlin @Serializable data classes emitted to android/.../generated/ConvexTypes.kt

  TDD_STATE:     none
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_kotlinSerializableDataClassesGenerated

AC-4: Generated files compile on respective platforms
  GIVEN: Swift and Kotlin type files have been generated
  WHEN:  Developer builds iOS app and Android app
  THEN:  Both projects compile without type errors

  TDD_STATE:     none
  TEST_FILE:     null
  TEST_FUNCTION: null

AC-5: Codegen script wired to npm
  GIVEN: Script exists at server/scripts/generate-mobile-types.ts
  WHEN:  Developer runs pnpm server:codegen
  THEN:  Script executes and regenerates both platform type files

  TDD_STATE:     none
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_npmScriptWiredToCodegen

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- server/scripts/generate-mobile-types.ts (CREATE)
- ios/LaneShadow/Generated/ConvexTypes.generated.swift (CREATE)
- android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt (CREATE)
- package.json (MODIFY — add server:codegen script)

writeProhibited:
- server/convex/_generated/ — generated files, read only

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Read existing _generated/api.d.ts to understand type structure
- Generate both Swift and Kotlin in a single script run
- Commit generated files to git (not gitignored)

⚠️ Ask First:
- If Convex type structure is unclear from _generated/api.d.ts
- If Swift/Kotlin type mapping requires custom logic

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- server/scripts/generate-mobile-types.ts (CREATE): Type generation script
- ios/LaneShadow/Generated/ConvexTypes.generated.swift (CREATE): Swift Codable structs
- android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt (CREATE): Kotlin @Serializable data classes
- package.json (MODIFY): Add server:codegen script

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, existing tests, code patterns
  WRITE: ONE test that exercises GIVEN-WHEN-THEN
  RUN: pnpm --dir server test -- {test_file}
  VERIFY: Test FAILS (not errors — fails)
  Never: Write ANY implementation code in RED phase.

### GREEN PHASE
  READ: Failing test, AC definition, code patterns
  WRITE: MINIMAL code to make test pass
  RUN: pnpm --dir server test -- {test_file}
  VERIFY: Test PASSES
  Never: Add features beyond the current AC.

### REFACTOR PHASE
  READ: Implementation just written
  WRITE: Improved code (if needed)
  RUN: pnpm --dir server test
  VERIFY: Tests still pass
  Never: Introduce new behavior in REFACTOR.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. server/convex/_generated/api.d.ts [PRIMARY PATTERN]
   - Focus: Convex type definitions (source of truth)

2. .spec/prds/v3-integration/11-technical-requirements.md
   - Section: Data Schema
   - Focus: Document shapes for users, sessions, messages, routePlans, routeEnrichments, savedRoutes

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All tests pass
  Command: pnpm --dir server test
  Expected: Exit 0.

Gate 4: Type check
  Command: pnpm --dir server exec tsc --noEmit
  Expected: Exit 0.

Gate 5: Lint
  Command: pnpm exec biome check server/
  Expected: Exit 0.

Gate 6: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T01
Blocks: AUTH-S03-T03, AUTH-S03-T04

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T02",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "Script parses Convex types successfully", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "Swift Codable structs emitted to ios/LaneShadow/Generated/ConvexTypes.generated.swift", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Kotlin @Serializable data classes emitted to android/.../generated/ConvexTypes.kt", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "Both projects compile without type errors", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "Script executes and regenerates both platform type files", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "Script reads and parses _generated/api.d.ts without errors", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "Swift generated file exists at ios/LaneShadow/Generated/ConvexTypes.generated.swift", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "Kotlin generated file exists at android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "Swift generated file compiles without errors", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "Kotlin generated file compiles without errors", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "npm script server:codegen exists in package.json", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
