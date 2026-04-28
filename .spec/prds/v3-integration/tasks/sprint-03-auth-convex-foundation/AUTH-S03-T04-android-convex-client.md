================================================================================
TASK: AUTH-S03-T04 - Android ConvexMobile Kotlin SDK integration
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew :app:ktlintCheck

PROGRESS: 0/6 AC · not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android ConvexClient Hilt singleton wrapper exposes Flow<List<Session>> and suspend mutations with Clerk JWT auth binding.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use Hilt @Singleton for ConvexClientProvider
- MUST bind setAuth callback to AuthRepository.getJwtForConvex()
- STRICTLY follow ConvexModule DI registration pattern from android-architecture.md § 3.3
- NEVER expose ConvexClient directly — all access through provider wrapper
- MUST compile successfully with ./gradlew :app:compileDebugKotlin

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] ConvexClientProvider.kt exists at android/app/src/main/java/com/laneshadow/services/
- [ ] Gradle dependency for Convex SDK declared in build.gradle.kts
- [ ] ConvexModule Hilt module binds ConvexClientProvider as @Singleton
- [ ] Flow<List<Session>> session subscription method compiles
- [ ] Suspend mutation functions (sendMessage, createSession) compile
- [ ] setAuth callback receives JWT from AuthRepository
- [ ] ./gradlew :app:compileDebugKotlin succeeds
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Gradle dependency added
  GIVEN: Android project with Gradle build configuration
  WHEN:  Developer adds Convex Android SDK dependency to build.gradle.kts
  THEN:  Dependency resolves successfully and compileDebugKotlin includes Convex classes

  TDD_STATE:     none
  TEST_FILE:     android/app/build.gradle.kts
  TEST_FUNCTION: dependencies block contains convex-android SDK

AC-2: ConvexClientProvider singleton created [PRIMARY]
  GIVEN: Hilt DI module configured in project
  WHEN:  Developer creates ConvexClientProvider class with @Singleton annotation
  THEN:  Provider wraps ConvexClient instance and exposes typed Flow<List<Session>> subscription

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt
  TEST_FUNCTION: class ConvexClientProvider @Singleton constructor()

AC-3: Session subscription Flow exposed
  GIVEN: ConvexClientProvider wraps ConvexClient
  WHEN:  Client queries sessions from Convex backend
  THEN:  Flow<List<Session>> emits typed session objects on updates

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt
  TEST_FUNCTION: fun observeSessions(): Flow<List<Session>>

AC-4: Suspend mutation functions implemented
  GIVEN: ConvexClient needs to write mutations to backend
  WHEN:  Developer creates suspend functions for mutations
  THEN:  sendMessage, createSession, and other mutations compile as suspend functions

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt
  TEST_FUNCTION: suspend fun sendMessage(...), suspend fun createSession(...)

AC-5: Auth callback bound to Clerk JWT [PRIMARY]
  GIVEN: ConvexClient requires authentication token
  WHEN:  Provider calls setAuth on ConvexClient
  THEN:  setAuth callback receives JWT from AuthRepository.getJwtForConvex()

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt
  TEST_FUNCTION: setAuth { authRepository.getJwtForConvex() }

AC-6: Hilt module registration
  GIVEN: ConvexClientProvider implements singleton pattern
  WHEN:  ConvexModule Hilt module configures DI
  THEN:  ConvexClientProvider is bound as @Singleton in DI graph

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/di/ConvexModule.kt
  TEST_FUNCTION: @Module @InstallIn(SingletonComponent::class) provides ConvexClientProvider

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/build.gradle.kts (MODIFY — add Convex SDK dependency)
- android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt (CREATE)
- android/app/src/main/java/com/laneshadow/di/ConvexModule.kt (CREATE or MODIFY)

writeProhibited:
- Do not modify Convex backend schema or functions
- Do not expose ConvexClient directly without wrapper

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use Hilt @Singleton for provider
- Expose Flow<List<Session>> not raw Convex types
- Bind setAuth to AuthRepository.getJwtForConvex()

⚠️ Ask First:
- If Convex Android SDK package name differs from com.convex:convex-android
- If Session type needs manual definition vs SDK-provided

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/build.gradle.kts (MODIFY): Add Convex Android SDK Gradle dependency
- android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt (CREATE): Hilt singleton wrapper
- android/app/src/main/java/com/laneshadow/di/ConvexModule.kt (CREATE or MODIFY): DI registration

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Follow standard RED/GREEN/REFACTOR cycle per AC.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/android-architecture.md [PRIMARY PATTERN]
   - Sections: § 3.3 (ConvexModule), § 4 (Convex Client Wrapper)
   - Focus: ConvexClientProvider design, Hilt registration, Flow patterns

2. server/convex/schema.ts
   - Focus: Session type definition for Flow typing

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
Gate 2: Each AC has a test
Gate 3: Kotlin compilation
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0.
Gate 4: Scope compliance
  Command: git diff --name-only

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T01
Blocks: AUTH-S03-T10

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T04",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "Dependency resolves successfully and compileDebugKotlin includes Convex classes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "Provider wraps ConvexClient instance and exposes typed Flow<List<Session>> subscription", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Flow<List<Session>> emits typed session objects on updates", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "sendMessage, createSession, and other mutations compile as suspend functions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "setAuth callback receives JWT from AuthRepository.getJwtForConvex()", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "ConvexClientProvider is bound as @Singleton in DI graph", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "Gradle dependency for convex-android exists in build.gradle.kts", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "ConvexClientProvider.kt file exists at com.laneshadow.services package", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "ConvexClientProvider class has @Singleton annotation", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "observeSessions() function returns Flow<List<Session>>", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "Mutation functions exist as suspend (sendMessage, createSession)", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "setAuth callback references getJwtForConvex()", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "ConvexModule.kt exists and binds ConvexClientProvider", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test", "description": "Code compiles without errors", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
