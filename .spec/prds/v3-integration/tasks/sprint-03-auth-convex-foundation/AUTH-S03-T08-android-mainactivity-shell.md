================================================================================
TASK: AUTH-S03-T08 - Android MainActivity Compose shell
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew :app:ktlintCheck

PROGRESS: 0/9 AC · not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android MainActivity with @HiltAndroidApp, LaneShadowApp observes AuthViewModel state, routes to AuthNavGraph or MainNavGraph based on auth state.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use Hilt @HiltAndroidApp Application class
- MUST use @AndroidEntryPoint for MainActivity
- MUST observe AuthViewModel.authState as State<AuthState>
- MUST route to AuthNavGraph when SignedOut
- MUST route to MainNavGraph when SignedIn
- MUST use Navigation Compose 2.8+ with @Serializable routes
- MUST preserve DEBUG sandbox path for development
- MUST compile successfully with ./gradlew :app:compileDebugKotlin

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] LaneShadowApplication.kt exists with @HiltAndroidApp
- [x] MainActivity.kt exists with @AndroidEntryPoint
- [x] LaneShadowApp composable observes AuthViewModel.authState
- [x] Loading state shows SplashScreen
- [x] SignedOut state routes to AuthNavGraph
- [x] SignedIn state routes to MainNavGraph
- [x] Navigation Compose 2.8+ dependency added
- [x] 12 @Serializable routes defined (typed navigation)
- [ ] DeepLinkBus for OAuth callback wiring exists ← FAIL: cold-start deep link can be dropped because `DeepLinkBus` uses `MutableSharedFlow` with `replay=0`; MainActivity publishes before LaneShadowApp collector starts (evidence: android/app/src/main/java/com/laneshadow/MainActivity.kt:22 and android/app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt:9)
- [x] DEBUG sandbox path preserved
- [x] ./gradlew :app:compileDebugKotlin succeeds
- [x] Only SCOPE.writeAllowed files modified (scope expanded with justification for `android/app/src/main/java/com/laneshadow/LaneShadowApp.kt`: removed `@HiltAndroidApp` to resolve duplicate Hilt app-root conflict with required `LaneShadowApplication`)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Hilt Application class created [PRIMARY]
  GIVEN: Android app needs Hilt DI setup
  WHEN:  Developer creates LaneShadowApplication class
  THEN:  Class annotated with @HiltAndroidApp and registered in AndroidManifest.xml

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/LaneShadowApplication.kt
  TEST_FUNCTION: class LaneShadowApplication : Application(), @HiltAndroidApp

AC-2: MainActivity with @AndroidEntryPoint
  GIVEN: Main activity needs Hilt injection
  WHEN:  Developer creates MainActivity with Compose
  THEN:  Activity annotated with @AndroidEntryPoint and sets LaneShadowApp content

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/MainActivity.kt
  TEST_FUNCTION: class MainActivity : ComponentActivity(), @AndroidEntryPoint

AC-3: LaneShadowApp observes AuthViewModel state [PRIMARY]
  GIVEN: App shell needs auth state for routing
  WHEN:  LaneShadowApp composable observes AuthViewModel.authState
  THEN:  State drives navigation routing decisions

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt
  TEST_FUNCTION: @Composable fun LaneShadowApp(authViewModel: AuthViewModel = hiltViewModel())

AC-4: Loading state shows SplashScreen
  GIVEN: Auth state is Loading
  WHEN:  LaneShadowApp renders Loading state
  THEN:  SplashScreen composable displays

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt
  TEST_FUNCTION: is AuthState.Loading -> SplashScreen()

AC-5: SignedOut state routes to AuthNavGraph
  GIVEN: Auth state is SignedOut
  WHEN:  LaneShadowApp renders SignedOut state
  THEN:  AuthNavGraph composable displays sign-in/sign-up screens

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt
  TEST_FUNCTION: is AuthState.SignedOut -> AuthNavGraph(navController)

AC-6: SignedIn state routes to MainNavGraph
  GIVEN: Auth state is SignedIn
  WHEN:  LaneShadowApp renders SignedIn state
  THEN:  MainNavGraph composable displays authenticated app screens

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt
  TEST_FUNCTION: is AuthState.SignedIn -> MainNavGraph(navController)

AC-7: Navigation Compose 2.8+ typed routes [PRIMARY]
  GIVEN: App needs type-safe navigation
  WHEN:  Developer adds Navigation Compose 2.8+ dependency
  THEN:  12 @Serializable routes defined for typed navigation

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/navigation/Route.kt
  TEST_FUNCTION: 12 @Serializable sealed classes/objects for routes

AC-8: DeepLinkBus for OAuth callback wiring
  GIVEN: OAuth callbacks arrive via deep-links
  WHEN:  Deep-link intent received in MainActivity
  THEN:  DeepLinkBus publishes OAuth callback event to AuthViewModel

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt
  TEST_FUNCTION: object DeepLinkBus with OAuth callback flow

AC-9: DEBUG sandbox path preserved
  GIVEN: Development uses sandbox for testing
  WHEN:  DEBUG build variant runs
  THEN:  Sandbox navigation path accessible via DEBUG flag

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt
  TEST_FUNCTION: if (BuildConfig.DEBUG) SandboxNavGraph() else null

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/LaneShadowApplication.kt (CREATE)
- android/app/src/main/java/com/laneshadow/MainActivity.kt (CREATE or MODIFY)
- android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt (CREATE)
- android/app/src/main/java/com/laneshadow/navigation/Route.kt (CREATE)
- android/app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt (CREATE)
- android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt (CREATE)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (CREATE)
- android/app/src/main/AndroidManifest.xml (MODIFY — register Application class)
- android/app/build.gradle.kts (MODIFY — add Navigation Compose 2.8+)
- android/app/src/main/java/com/laneshadow/LaneShadowApp.kt (MODIFY — remove legacy `@HiltAndroidApp` annotation to avoid duplicate app roots)

writeProhibited:
- Do not modify Convex backend schema or functions
- Do not remove existing navigation structure without migration path
- Do not break DEBUG sandbox access

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use Hilt for DI throughout app shell
- Observe auth state via State<AuthState>
- Route based on AuthState, not nullable properties
- Use Navigation Compose 2.8+ @Serializable routes
- Preserve DEBUG sandbox for development

⚠️ Ask First:
- If Navigation Compose 2.8+ package structure differs from expectations
- If AuthViewModel location differs from di/AuthModule
- If sandbox navigation needs special routing logic

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/LaneShadowApplication.kt (CREATE): Hilt Application
- android/app/src/main/java/com/laneshadow/MainActivity.kt (CREATE or MODIFY): Entry point
- android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt (CREATE): App shell with routing
- android/app/src/main/java/com/laneshadow/navigation/Route.kt (CREATE): Typed routes
- android/app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt (CREATE): OAuth wiring
- android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt (CREATE): Auth navigation
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (CREATE): Main navigation
- android/app/src/main/AndroidManifest.xml (MODIFY): Application class registration
- android/app/build.gradle.kts (MODIFY): Navigation Compose dependency

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Follow standard RED/GREEN/REFACTOR cycle per AC.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/android-architecture.md [PRIMARY PATTERN]
   - Sections: § 3.1 (Application Setup), § 5 (App Shell & Navigation)
   - Focus: Hilt setup, Compose app shell, routing patterns

2. Navigation Compose 2.8 Documentation
   - Focus: @Serializable routes, typed navigation, NavHost setup

3. Jetpack Compose Documentation
   - Focus: State observation, side effects, deep-link handling

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

Depends on: AUTH-S03-T06
Blocks: AUTH-S03-T10

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T08",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "Class annotated with @HiltAndroidApp and registered in AndroidManifest.xml", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "Activity annotated with @AndroidEntryPoint and sets LaneShadowApp content", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "State drives navigation routing decisions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "SplashScreen composable displays", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "AuthNavGraph composable displays sign-in/sign-up screens", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "MainNavGraph composable displays authenticated app screens", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance", "description": "12 @Serializable routes defined for typed navigation", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-8", "type": "acceptance", "description": "DeepLinkBus publishes OAuth callback event to AuthViewModel", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-9", "type": "acceptance", "description": "Sandbox navigation path accessible via DEBUG flag", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "LaneShadowApplication.kt exists with @HiltAndroidApp", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "MainActivity.kt has @AndroidEntryPoint", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "LaneShadowApp observes AuthViewModel.authState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "Loading state shows SplashScreen", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "SignedOut routes to AuthNavGraph", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "SignedIn routes to MainNavGraph", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "Navigation Compose 2.8+ dependency added", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test", "description": "12 @Serializable routes exist", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-9", "type": "test", "description": "Code compiles without errors", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
