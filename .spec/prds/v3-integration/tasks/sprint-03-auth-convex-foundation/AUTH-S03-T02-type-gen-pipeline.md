================================================================================
TASK: AUTH-S03-T02 - Type-gen pipeline
================================================================================

TASK_TYPE:  FEATURE
STATUS:     In Review
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      pnpm --dir server exec vitest run scripts/generate-mobile-types.test.ts
  typecheck: pnpm --dir server exec tsc --noEmit
  lint:      pnpm exec biome check server/

PROGRESS: 5/5 AC implemented · unblocked by explicit generated-data-model schema resolution contract

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Create server/scripts/generate-mobile-types.ts that emits Swift and Kotlin type files from Convex generated API/data-model declarations.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST read and validate server/convex/_generated/api.d.ts as the entrypoint/source-of-truth for generated Convex API presence
- MUST derive document shapes through server/convex/_generated/dataModel.d.ts; when Convex encodes DataModel as `DataModelFromSchemaDefinition<typeof schema>`, the script MAY explicitly resolve `server/convex/schema.ts` as a tested generated-data-model resolution path
- MUST fail closed when strict generated-declaration-only parsing is requested and dataModel.d.ts requires schema resolution
- MUST generate Swift Codable structs for all Convex document types
- MUST generate Kotlin @Serializable data classes matching same shapes
- MUST add server:codegen script to root package.json
- STRICTLY commit generated files to git (not gitignored) for IDE reference

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] server/scripts/generate-mobile-types.ts script exists and runs with explicit generated-data-model schema resolution when Convex dataModel.d.ts requires it (evidence: server/scripts/generate-mobile-types.ts:186-212,390-393; server/convex/_generated/dataModel.d.ts:18,60)
- [x] ios/LaneShadow/Generated/ConvexTypes.generated.swift generated (evidence: ios/LaneShadow/Generated/ConvexTypes.generated.swift:4)
- [x] android/app/src/main/.../generated/ConvexTypes.kt generated (evidence: android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt:7)
- [x] pnpm server:codegen script added to package.json (evidence: package.json:41)
- [x] Generated files compile on both platforms (evidence: `pnpm ios:build` exit 0; `pnpm android:build` exit 0)
- [x] pnpm --dir server exec tsc --noEmit passes (evidence: `pnpm --dir server exec tsc --noEmit` exit 0)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Script reads Convex generated API/data-model entrypoints
  GIVEN: Convex codegen has generated _generated/api.d.ts
  WHEN:  Developer runs pnpm server:codegen
  THEN:  Script validates api.d.ts, parses generated dataModel.d.ts, and explicitly resolves schema.ts only when Convex's generated DataModel alias requires it

  TDD_STATE:     RED: `pnpm --dir server exec vitest run scripts/generate-mobile-types.test.ts` failed at `test_throwsWhenGeneratedDataModelRequiresSchemaResolution` (expected throw, got none) on 2026-04-28; GREEN: same command passed after removing `schema.ts` from strict TS roots and adding strict guard
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_scriptReadsConvexTypesFromGeneratedApi

AC-2: Swift Codable structs generated [PRIMARY]
  GIVEN: Script has parsed Convex types
  WHEN:  Script runs Swift generation phase
  THEN:  Swift Codable structs emitted to ios/LaneShadow/Generated/ConvexTypes.generated.swift

  TDD_STATE:     RED: generated output initially omitted document fields; GREEN: `test_swiftCodableStructsGenerated` passed after dataModel-driven field extraction generated real Codable properties
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_swiftCodableStructsGenerated

AC-3: Kotlin @Serializable data classes generated [PRIMARY]
  GIVEN: Script has parsed Convex types
  WHEN:  Script runs Kotlin generation phase
  THEN:  Kotlin @Serializable data classes emitted to android/.../generated/ConvexTypes.kt

  TDD_STATE:     RED: generated output initially omitted document fields; GREEN: `test_kotlinSerializableDataClassesGenerated` passed after dataModel-driven field extraction generated real @Serializable properties
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_kotlinSerializableDataClassesGenerated

AC-4: Generated files compile on respective platforms
  GIVEN: Swift and Kotlin type files have been generated
  WHEN:  Developer builds iOS app and Android app
  THEN:  Both projects compile without type errors

  TDD_STATE:     GREEN: `pnpm ios:build` and `pnpm android:build` passed in reviewer verification; compile evidence recorded for generated files
  TEST_FILE:     null
  TEST_FUNCTION: null

AC-5: Codegen script wired to npm
  GIVEN: Script exists at server/scripts/generate-mobile-types.ts
  WHEN:  Developer runs pnpm server:codegen
  THEN:  Script executes and regenerates both platform type files

  TDD_STATE:     GREEN: `test_npmScriptWiredToCodegen` passed with `server:codegen` mapped to `npx tsx server/scripts/generate-mobile-types.ts`
  TEST_FILE:     server/scripts/generate-mobile-types.test.ts
  TEST_FUNCTION: test_npmScriptWiredToCodegen

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- server/scripts/generate-mobile-types.ts (CREATE)
- server/scripts/generate-mobile-types.test.ts (CREATE)
- ios/LaneShadow/Generated/ConvexTypes.generated.swift (CREATE)
- android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt (CREATE)
- package.json (MODIFY — add server:codegen script)

writeProhibited:
- server/convex/_generated/ — generated files, read only

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Read existing _generated/api.d.ts to validate generated API presence
- Use _generated/dataModel.d.ts for data-model shape extraction; allow schema.ts resolution only when required by Convex's generated DataModel alias and covered by tests
- Generate both Swift and Kotlin in a single script run
- Commit generated files to git (not gitignored)

⚠️ Ask First:
- If Convex type structure is unclear from _generated/api.d.ts
- If Swift/Kotlin type mapping requires custom logic

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- server/scripts/generate-mobile-types.ts (CREATE): Type generation script
- server/scripts/generate-mobile-types.test.ts (CREATE): Type generation tests
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
  RUN: pnpm --dir server exec vitest run {test_file}
  VERIFY: Test FAILS (not errors — fails)
  Never: Write ANY implementation code in RED phase.

### GREEN PHASE
  READ: Failing test, AC definition, code patterns
  WRITE: MINIMAL code to make test pass
  RUN: pnpm --dir server exec vitest run {test_file}
  VERIFY: Test PASSES
  Never: Add features beyond the current AC.

### REFACTOR PHASE
  READ: Implementation just written
  WRITE: Improved code (if needed)
  RUN: pnpm --dir server exec vitest run scripts/generate-mobile-types.test.ts
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
  Command: pnpm --dir server exec vitest run scripts/generate-mobile-types.test.ts
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
    {"id": "AC-1", "type": "acceptance", "description": "Script validates api.d.ts and parses generated dataModel.d.ts with explicit schema resolution when required by Convex", "satisfied": true, "evidence": "server/scripts/generate-mobile-types.test.ts::test_scriptReadsConvexTypesFromGeneratedApi and test_throwsWhenGeneratedDataModelRequiresSchemaResolution", "remediation": "Clarified task contract because current Convex dataModel.d.ts aliases DataModelFromSchemaDefinition<typeof schema> rather than materializing document fields in generated declarations."},
    {"id": "AC-2", "type": "acceptance", "description": "Swift Codable structs emitted to ios/LaneShadow/Generated/ConvexTypes.generated.swift", "satisfied": true, "evidence": "server/scripts/generate-mobile-types.test.ts::test_swiftCodableStructsGenerated", "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Kotlin @Serializable data classes emitted to android/.../generated/ConvexTypes.kt", "satisfied": true, "evidence": "server/scripts/generate-mobile-types.test.ts::test_kotlinSerializableDataClassesGenerated", "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "Both projects compile without type errors", "satisfied": true, "evidence": "reviewer verification: pnpm ios:build and pnpm android:build exit 0", "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "Script executes and regenerates both platform type files", "satisfied": true, "evidence": "pnpm server:codegen and server/scripts/generate-mobile-types.test.ts::test_npmScriptWiredToCodegen", "remediation": null},
    {"id": "TC-1", "type": "test", "description": "Script reads generated api.d.ts and explicitly handles generated dataModel schema-resolution requirements", "satisfied": true, "evidence": "server/scripts/generate-mobile-types.test.ts", "remediation": null},
    {"id": "TC-2", "type": "test", "description": "Swift generated file exists at ios/LaneShadow/Generated/ConvexTypes.generated.swift", "satisfied": true, "evidence": "server/scripts/generate-mobile-types.test.ts::test_swiftCodableStructsGenerated", "remediation": null},
    {"id": "TC-3", "type": "test", "description": "Kotlin generated file exists at android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt", "satisfied": true, "evidence": "server/scripts/generate-mobile-types.test.ts::test_kotlinSerializableDataClassesGenerated", "remediation": null},
    {"id": "TC-4", "type": "test", "description": "Swift generated file compiles without errors", "satisfied": true, "evidence": "reviewer verification: pnpm ios:build exit 0", "remediation": null},
    {"id": "TC-5", "type": "test", "description": "Kotlin generated file compiles without errors", "satisfied": true, "evidence": "reviewer verification: pnpm android:build exit 0", "remediation": null},
    {"id": "TC-6", "type": "test", "description": "npm script server:codegen exists in package.json", "satisfied": true, "evidence": "server/scripts/generate-mobile-types.test.ts::test_npmScriptWiredToCodegen", "remediation": null}
  ]
}
-->
================================================================================
