================================================================================
TASK: AUTH-S03-T06 - Android AuthRepository + Clerk auth
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew :app:ktlintCheck

PROGRESS: 14/14 AC · complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android AuthRepository interface with ClerkAuthRepository primary impl and CustomTabsAuthRepository fallback, EncryptedSharedPreferences storage, deep-link OAuth callback.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use EncryptedSharedPreferences for token storage (security hard requirement)
- MUST support Clerk OAuth via CustomTabs for Chrome Custom Tabs integration
- MUST expose suspend fun getJwtForConvex(): String for ConvexClientProvider
- AuthState sealed interface must track SignedOut, SignedIn(user: ClerkUser), Loading, Error
- Deep-link intent filter MUST handle laneshadow://oauth-callback
- MUST compile successfully with ./gradlew :app:compileDebugKotlin

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AuthRepository interface exists at android/app/src/main/java/com/laneshadow/data/repository/ (evidence: android/app/src/main/java/com/laneshadow/data/repository/AuthRepository.kt:8)
- [x] AuthState sealed interface exists with all states (evidence: android/app/src/main/java/com/laneshadow/data/model/AuthState.kt:3)
- [x] ClerkAuthRepository implements AuthRepository (evidence: android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt:30)
- [x] CustomTabsAuthRepository fallback exists (evidence: android/app/src/main/java/com/laneshadow/data/repository/CustomTabsAuthRepository.kt:18)
- [x] EncryptedTokenStore wraps EncryptedSharedPreferences (evidence: android/app/src/main/java/com/laneshadow/data/store/EncryptedTokenStore.kt:22)
- [x] Deep-link intent filter registered in AndroidManifest.xml (evidence: android/app/src/main/AndroidManifest.xml:34)
- [x] AuthModule Hilt module binds AuthRepository (primary + fallback qualifiers) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:41)
- [x] Email/password sign-in works (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:74) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:125) (evidence: android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt:44)
- [x] Google OAuth flow works (provider preserved across launch/callback; mapped to `"google"`) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:141) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:171) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:157) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:200)
- [x] Apple OAuth flow works (provider preserved across launch/callback; mapped to `"apple"`) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:143) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:171) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:157) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:201)
- [x] OAuth callback handling parses deep-link tokens (evidence: android/app/src/main/java/com/laneshadow/MainActivity.kt:65) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:145)
- [x] getJwtForConvex() returns valid JWT string (non-blank enforced) (evidence: android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt:68)
- [x] Sign-out clears all auth state from storage (evidence: android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt:47)
- [x] Sign-up flow creates Clerk user (evidence: android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt:44) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:84) (evidence: android/app/src/main/java/com/laneshadow/di/AuthModule.kt:106)
- [x] ./gradlew :app:compileDebugKotlin succeeds (verified 2026-04-29) (evidence: android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt:1)
- [x] Only SCOPE.writeAllowed files modified (evidence: git diff --name-only dc8294ddc665a7d08ac21e0ba38a3261aa1a024e..d4126a35ce512815f6e5a1dea53524928ff286bf)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: AuthRepository interface created [PRIMARY]
  GIVEN: Android auth layer needs abstraction
  WHEN:  Developer creates AuthRepository interface
  THEN:  Interface defines suspend signIn, signUp, signOut, getJwtForConvex, observeAuthState methods

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/AuthRepository.kt
  TEST_FUNCTION: interface AuthRepository with all auth methods

AC-2: AuthState sealed interface defined
  GIVEN: Auth layer needs type-safe state tracking
  WHEN:  Developer creates AuthState sealed interface
  THEN:  States include SignedOut, SignedIn(user: ClerkUser), Loading, Error(message: String)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/model/AuthState.kt
  TEST_FUNCTION: sealed interface AuthState with all state types

AC-3: ClerkAuthRepository implements AuthRepository [PRIMARY]
  GIVEN: AuthRepository interface defined
  WHEN:  Developer creates ClerkAuthRepository
  THEN:  Class implements all interface methods using Clerk Kotlin SDK

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
  TEST_FUNCTION: class ClerkAuthRepository @Inject constructor() : AuthRepository

AC-4: CustomTabsAuthRepository fallback implemented
  GIVEN: Clerk SDK may fail or be unavailable
  WHEN:  Developer creates CustomTabsAuthRepository
  THEN:  Fallback impl uses Chrome Custom Tabs for OAuth with manual token handling

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/CustomTabsAuthRepository.kt
  TEST_FUNCTION: class CustomTabsAuthRepository @Inject constructor() : AuthRepository

AC-5: EncryptedTokenStore wraps EncryptedSharedPreferences [PRIMARY]
  GIVEN: Auth tokens must be stored securely
  WHEN:  Developer creates EncryptedTokenStore
  THEN:  Store uses AndroidX Security EncryptedSharedPreferences for token persistence

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/store/EncryptedTokenStore.kt
  TEST_FUNCTION: class EncryptedTokenStore @Singleton constructor(context: Context)

AC-6: Deep-link intent filter registered
  GIVEN: OAuth callbacks arrive via deep-links
  WHEN:  Developer updates AndroidManifest.xml
  THEN:  MainActivity intent filter handles laneshadow://oauth-callback scheme

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/AndroidManifest.xml
  TEST_FUNCTION: <intent-filter> with scheme laneshadow and host oauth-callback

AC-7: AuthModule Hilt binding configured
  GIVEN: AuthRepository implementations need DI
  WHEN:  Developer creates AuthModule Hilt module
  THEN:  Module binds ClerkAuthRepository as primary, CustomTabsAuthRepository as alternative

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/di/AuthModule.kt
  TEST_FUNCTION: @Module @InstallIn(SingletonComponent::class) binds AuthRepository

AC-8: Email/password sign-in works
  GIVEN: User has email and password
  WHEN:  User calls signIn(email, password)
  THEN:  AuthState transitions to SignedIn(user) and tokens stored

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
  TEST_FUNCTION: suspend fun signIn(email: String, password: String): Result<ClerkUser>

AC-9: Google OAuth flow works
  GIVEN: User selects Google sign-in
  WHEN:  OAuth flow completes via CustomTabs
  THEN:  AuthState transitions to SignedIn with Google-linked user

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
  TEST_FUNCTION: suspend fun signInWithGoogle(): Result<ClerkUser>

AC-10: Apple OAuth flow works
  GIVEN: User selects Apple sign-in
  WHEN:  OAuth flow completes via CustomTabs
  THEN:  AuthState transitions to SignedIn with Apple-linked user

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
  TEST_FUNCTION: suspend fun signInWithApple(): Result<ClerkUser>

AC-11: OAuth callback handling parses deep-link tokens
  GIVEN: OAuth provider redirects to laneshadow://oauth-callback
  WHEN:  Deep-link intent contains token/authorization code
  THEN:  Repository extracts token and completes sign-in flow

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
  TEST_FUNCTION: suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser>

AC-12: getJwtForConvex() returns valid JWT [PRIMARY]
  GIVEN: ConvexClientProvider needs auth token
  WHEN:  ConvexClientProvider calls getJwtForConvex()
  THEN:  Repository returns Clerk JWT string for Convex backend

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/AuthRepository.kt
  TEST_FUNCTION: suspend fun getJwtForConvex(): String

AC-13: Sign-out clears all auth state
  GIVEN: User is signed in
  WHEN:  User calls signOut()
  THEN:  AuthState transitions to SignedOut and all tokens cleared from storage

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
  TEST_FUNCTION: suspend fun signOut(): Result<Unit>

AC-14: Sign-up flow creates Clerk user
  GIVEN: New user provides email, password, name
  WHEN:  User calls signUp(email, password, name)
  THEN:  Clerk user created and AuthState transitions to SignedIn

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
  TEST_FUNCTION: suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser>

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/data/repository/AuthRepository.kt (CREATE)
- android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt (CREATE)
- android/app/src/main/java/com/laneshadow/data/repository/CustomTabsAuthRepository.kt (CREATE)
- android/app/src/main/java/com/laneshadow/data/model/AuthState.kt (CREATE)
- android/app/src/main/java/com/laneshadow/data/store/EncryptedTokenStore.kt (CREATE)
- android/app/src/main/java/com/laneshadow/di/AuthModule.kt (CREATE)
- android/app/src/main/AndroidManifest.xml (MODIFY — add intent filter)
- android/app/build.gradle.kts (MODIFY — add Clerk and security dependencies)
- android/build.gradle.kts (MODIFY — add Hilt plugin required by AuthModule)
- android/app/src/main/java/com/laneshadow/LaneShadowApp.kt (MODIFY — add @HiltAndroidApp and Clerk initialization)
- android/app/src/main/java/com/laneshadow/MainActivity.kt (MODIFY — dispatch oauth callback deep links to AuthRepository)
- android/app/src/test/java/com/laneshadow/data/repository/ClerkAuthRepositoryTest.kt (CREATE — targeted auth repository behavior tests)
- android/app/src/test/java/com/laneshadow/di/AuthModuleBindingTest.kt (CREATE — DI binding coverage)
- android/app/src/test/java/com/laneshadow/di/AuthModuleProviderTest.kt (CREATE — DI provider coverage)

writeProhibited:
- Do not modify Convex backend schema or functions
- Do not store tokens in plaintext SharedPreferences
- Do not skip encryption for token storage

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use EncryptedSharedPreferences for token storage
- Expose Flow<AuthState> for UI observation
- Handle OAuth callbacks via deep-link intent filter
- Provide fallback CustomTabsAuthRepository

⚠️ Ask First:
- If Clerk Kotlin SDK package name differs from expected
- If Apple OAuth requires special Sign in with Apple SDK integration
- If CustomTabs configuration needs special handling

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/data/repository/AuthRepository.kt (CREATE): Interface
- android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt (CREATE): Primary impl
- android/app/src/main/java/com/laneshadow/data/repository/CustomTabsAuthRepository.kt (CREATE): Fallback
- android/app/src/main/java/com/laneshadow/data/model/AuthState.kt (CREATE): Sealed interface
- android/app/src/main/java/com/laneshadow/data/store/EncryptedTokenStore.kt (CREATE): Secure storage
- android/app/src/main/java/com/laneshadow/di/AuthModule.kt (CREATE): Hilt DI
- android/app/src/main/AndroidManifest.xml (MODIFY): Deep-link intent filter
- android/app/build.gradle.kts (MODIFY): Dependencies

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Follow standard RED/GREEN/REFACTOR cycle per AC.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/android-architecture.md [PRIMARY PATTERN]
   - Sections: § 3.2 (AuthModule), § 4 (Auth Repository)
   - Focus: AuthRepository design, Hilt registration, Flow patterns

2. Clerk Kotlin SDK Documentation
   - Focus: OAuth flows, token management, user session handling

3. AndroidX Security Documentation
   - Focus: EncryptedSharedPreferences setup and usage

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
Blocks: AUTH-S03-T08, AUTH-S03-T10

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T06",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "Interface defines suspend signIn, signUp, signOut, getJwtForConvex, observeAuthState methods", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "States include SignedOut, SignedIn(user: ClerkUser), Loading, Error(message: String)", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Class implements all interface methods using Clerk Kotlin SDK", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "Fallback impl uses Chrome Custom Tabs for OAuth with manual token handling", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "Store uses AndroidX Security EncryptedSharedPreferences for token persistence", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "MainActivity intent filter handles laneshadow://oauth-callback scheme", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance", "description": "Module binds ClerkAuthRepository as primary, CustomTabsAuthRepository as alternative", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-8", "type": "acceptance", "description": "AuthState transitions to SignedIn(user) and tokens stored", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-9", "type": "acceptance", "description": "AuthState transitions to SignedIn with Google-linked user", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-10", "type": "acceptance", "description": "AuthState transitions to SignedIn with Apple-linked user", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-11", "type": "acceptance", "description": "Repository extracts token and completes sign-in flow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-12", "type": "acceptance", "description": "Repository returns Clerk JWT string for Convex backend", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-13", "type": "acceptance", "description": "AuthState transitions to SignedOut and all tokens cleared from storage", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-14", "type": "acceptance", "description": "Clerk user created and AuthState transitions to SignedIn", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "AuthRepository.kt interface file exists", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "AuthState.kt sealed interface file exists", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "ClerkAuthRepository.kt implements AuthRepository", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "CustomTabsAuthRepository.kt fallback exists", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "EncryptedTokenStore.kt uses EncryptedSharedPreferences", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "AndroidManifest.xml has deep-link intent filter", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "AuthModule.kt Hilt module binds AuthRepository", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test", "description": "Email/password sign-in method exists", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-9", "type": "test", "description": "Google OAuth method exists", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-10", "type": "test", "description": "Code compiles without errors", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
