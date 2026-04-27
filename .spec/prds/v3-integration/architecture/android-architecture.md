# Android Architecture: v3-integration (LaneShadow Native Integration)

**Author:** kotlin-planner
**Date:** 2026-04-27
**Appetite:** 6 weeks (full feature parity with React Native)
**Source spec:** `.spec/prds/v3-integration/` (PRD pending — this document feeds technical-requirements.md)

> **Cut surface notice (Human Signal #4):** Android is the cuttable platform. Plan for it to ship; design so a mid-sprint cut leaves the v2 sandbox intact and forfeits only post-v2 work. No Android-specific Convex schema or backend changes. Minimal coupling to iOS work.

---

## 0. Progress Tracking (Token Recovery)

- [x] Investigation: research docs (01, 02), MainActivity, LaneShadowApp, build.gradle, manifest, atoms/molecules/organisms/templates inventory, RN ride-flow + chat-planning hooks, RN root layout
- [x] Architecture decisions documented
- [x] Per-screen wiring plan
- [x] Missing UI surfaces enumerated
- [x] Test strategy
- [x] Risk inventory
- [x] Cut sequence

---

## 1. App Entry & Navigation

### 1.1 Replace minimal `MainActivity`

The current `MainActivity` (`/android/app/src/main/java/com/laneshadow/MainActivity.kt`) renders a placeholder `LaneShadowAppContent` with no real composable shell. Replace with:

```
package com.laneshadow

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        installSplashScreen()                   // androidx.core:core-splashscreen
        currentIntent = intent                  // Sandbox path retained
        setContent {
            LaneShadowTheme {
                if (BuildConfig.DEBUG && SandboxChecker.shouldOpen(currentIntent)) {
                    SandboxChecker.Content(currentIntent)
                } else {
                    LaneShadowApp()             // New top-level composable
                }
            }
        }
    }
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        currentIntent = intent
        // Forward OAuth deep links to NavController via composition-local
        deepLinkBus.dispatch(intent)
    }
}
```

The sandbox launch path (`app-sandbox://sandbox`) is preserved verbatim. The integration only adds a `else` branch.

### 1.2 Top-level composable: `LaneShadowApp`

```
@Composable
fun LaneShadowApp() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val authState by authViewModel.state.collectAsStateWithLifecycle()

    // Subscribe to deep-link bus so OAuth callbacks reach the NavController
    LaunchedEffect(Unit) {
        deepLinkBus.intents.collect { intent ->
            navController.handleDeepLink(intent)
        }
    }

    when (val s = authState) {
        is AuthUiState.Loading      -> SplashScreen()
        is AuthUiState.SignedOut    -> AuthNavGraph(navController)
        is AuthUiState.SignedIn     -> MainNavGraph(navController, currentUser = s.user)
        is AuthUiState.Error        -> AuthErrorScreen(s.message, onRetry = authViewModel::retry)
    }
}
```

### 1.3 NavGraph structure

**Library:** `androidx.navigation:navigation-compose:2.8.0` — type-safe routes via Kotlin serialization, supported on `kotlin-serialization` plugin already present in build.gradle.

**Package:** `com.laneshadow.navigation`

```
com.laneshadow.navigation/
├── Routes.kt                    // Sealed @Serializable route classes
├── AuthNavGraph.kt              // Composable graph for unauthenticated
├── MainNavGraph.kt              // Composable graph for authenticated
├── DeepLinkBus.kt               // Singleton intent forwarder for onNewIntent
└── NavExtensions.kt             // navigateSingleTop, popUpToHome helpers
```

`Routes.kt` (typed routes — Compose Navigation 2.8 supports `@Serializable` data classes):

```
sealed interface Route {
    @Serializable data object SignIn : Route
    @Serializable data object OAuthCallback : Route       // not navigable; deep-link sink
    @Serializable data object Idle : Route
    @Serializable data class Planning(val sessionId: String) : Route
    @Serializable data class RouteResults(val sessionId: String) : Route
    @Serializable data class RouteDetails(val sessionId: String, val routeOptionId: String) : Route
    @Serializable data object Sessions : Route            // drawer-presented
    @Serializable data object SavedRoutes : Route
    @Serializable data class SavedRouteDetail(val savedRouteId: String) : Route
    @Serializable data object Settings : Route
    @Serializable data object OfflineRegions : Route
    @Serializable data object OfflineRegionSelector : Route
    @Serializable data class Error(val sessionId: String?, val message: String) : Route
}
```

`MainNavGraph.kt` skeleton (key bindings only — full Composable signatures in section 6):

```
NavHost(navController, startDestination = Route.Idle) {
    composable<Route.Idle> { IdleRoute(navController) }
    composable<Route.Planning> { entry -> PlanningRoute(entry.toRoute<Route.Planning>(), navController) }
    composable<Route.RouteResults> { entry -> RouteResultsRoute(entry.toRoute(), navController) }
    composable<Route.RouteDetails> { entry -> RouteDetailsRoute(entry.toRoute(), navController) }
    dialog<Route.Sessions> { SessionsRoute(navController) }   // drawer modeled as dialog destination
    composable<Route.SavedRoutes> { SavedRoutesRoute(navController) }
    composable<Route.SavedRouteDetail> { entry -> SavedRouteDetailRoute(entry.toRoute(), navController) }
    composable<Route.Settings> { SettingsRoute(navController) }
    composable<Route.OfflineRegions> { OfflineRegionsRoute(navController) }
    composable<Route.OfflineRegionSelector> { OfflineRegionSelectorRoute(navController) }
    composable<Route.Error> { entry -> ErrorRoute(entry.toRoute(), navController) }
}
```

### 1.4 Deep-link handling for OAuth callback

**Manifest intent filter** (added to existing `MainActivity` block):

```
<intent-filter android:autoVerify="false">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="laneshadow" android:host="oauth-callback" />
</intent-filter>
```

**DeepLinkBus** (singleton, injected via Hilt):

```
@Singleton
class DeepLinkBus @Inject constructor() {
    private val _intents = MutableSharedFlow<Intent>(extraBufferCapacity = 4)
    val intents: SharedFlow<Intent> = _intents.asSharedFlow()
    fun dispatch(intent: Intent) { _intents.tryEmit(intent) }
}
```

`MainActivity.onNewIntent` calls `deepLinkBus.dispatch(intent)`. `LaneShadowApp` collects from the shared flow and either invokes `navController.handleDeepLink(intent)` (if Clerk SDK uses NavController-driven flow) or hands the OAuth code to `AuthRepository.exchangeCallback(intent.data)` (Custom Tabs path).

---

## 2. Auth Stack (Clerk)

### 2.1 SDK selection — research summary

| Option | Status | Recommendation |
|---|---|---|
| `clerk-android` Kotlin SDK | Early-stage; published as `com.clerk:clerk-android` (alpha as of 2025-2026). API surface includes `Clerk.signIn()`, `OAuth.googleAuthCode()`, JWT retrieval via `clerk.session.getToken()`. | **Primary path** — adopt and pin a known-good version. Build a `ClerkAuthRepository` adapter so we can swap implementations if SDK is unstable. |
| Custom Tabs OAuth flow | Stable; manual exchange against Clerk Frontend API endpoints (`/v1/sign_ins`, `/v1/oauth_callbacks`). | **Fallback** — wire behind same `AuthRepository` interface so we can swap with one DI binding change if SDK fails QA. |

**Decision:** Adopt Clerk Android SDK. Wrap behind `interface AuthRepository`. Define a `CustomTabsAuthRepository` fallback in same package as a Phase-A insurance policy if the SDK proves unfit during week 1 spike.

### 2.2 `AuthRepository` contract

**Package:** `com.laneshadow.auth`

```
interface AuthRepository {
    val state: StateFlow<AuthState>          // SignedOut | SignedIn(user) | Error
    suspend fun signInWithEmail(email: String, password: String): Result<Unit>
    suspend fun signInWithGoogle(activity: Activity): Result<Unit>
    suspend fun signInWithApple(activity: Activity): Result<Unit>
    suspend fun signUp(email: String, password: String): Result<Unit>
    suspend fun handleOAuthCallback(uri: Uri): Result<Unit>
    suspend fun getJwtForConvex(): String?    // Called by ConvexClient.setAuth callback
    suspend fun signOut(): Result<Unit>
}

sealed interface AuthState {
    data object Loading : AuthState
    data object SignedOut : AuthState
    data class SignedIn(val user: AuthUser) : AuthState
    data class Error(val message: String) : AuthState
}

data class AuthUser(val clerkUserId: String, val email: String, val displayName: String?)
```

`ClerkAuthRepository` impl forwards to Clerk SDK; `CustomTabsAuthRepository` performs PKCE flow against `${CLERK_FRONTEND_API}/v1/...` and stores tokens via `EncryptedTokenStore`.

### 2.3 Sign-in screen composition

**File:** `com.laneshadow.ui.auth.SignInScreen.kt`

Built from existing v2 atoms/molecules:
- `LSCard` (panel wrapper)
- `LSText` (heading + subtitle)
- `LSTextField` for email + password (existing molecule `LSFormField` wraps label + helper text)
- `LSButton` for Continue
- `LSDivider` between password and OAuth
- Two `LSButton` variants for "Continue with Google" / "Continue with Apple" (variant=secondary, leading icon slot)
- `LSInlineErrorCallout` (organism) for error banner

```
@Composable
fun SignInScreen(
    state: SignInUiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onContinue: () -> Unit,
    onGoogleSignIn: () -> Unit,
    onAppleSignIn: () -> Unit,
    onSwitchToSignUp: () -> Unit,
    modifier: Modifier = Modifier,
)
```

`SignInUiState` is a sealed interface mirroring RN's multi-step flow:
- `EmailEntry(email, error)`
- `PasswordEntry(email, password, error)`
- `Submitting`
- `OAuthInFlight(provider)`

### 2.4 Token storage — `EncryptedTokenStore`

**Package:** `com.laneshadow.auth.storage`

```
@Singleton
class EncryptedTokenStore @Inject constructor(@ApplicationContext context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "clerk_tokens",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )
    suspend fun storeJwt(jwt: String) { /* ... */ }
    suspend fun getJwt(): String?
    suspend fun storeRefreshToken(token: String)
    suspend fun getRefreshToken(): String?
    suspend fun clear()
}
```

Dependency: `androidx.security:security-crypto:1.1.0-alpha06` (verify min-SDK 26 compat; current `androidx.security` releases require min-SDK 23, satisfies our 26).

The pre-existing `models/AuthTokens.kt` (`SharedPrefsAuthTokenStorage`) is a stub for legacy WorkOS — flag for retirement; do not extend. The new `EncryptedTokenStore` lives in `com.laneshadow.auth.storage`. Old file removed in cleanup commit at end of Phase A.

### 2.5 Token refresh strategy

Clerk JWTs are short-lived (default 60s). `AuthRepository.getJwtForConvex()` calls `clerk.session.getToken(forceRefresh = false)` which the Clerk SDK auto-refreshes against the refresh token. Convex's `setAuth` callback is invoked on every connection cycle, so by always asking the SDK we never serve a stale JWT. If SDK call fails, return null → Convex transitions to unauthenticated → AuthRepository emits `AuthState.SignedOut` → app reroutes to SignIn.

### 2.6 Sign-out

```
suspend fun signOut() {
    convexClient.setAuth { null }
    convexClient.disconnect()
    encryptedTokenStore.clear()
    clerkSdk.signOut()
    appStateRepository.clearSessionLocalState()    // DataStore: clear lastViewedSessionId, etc.
    _state.value = AuthState.SignedOut
}
```

---

## 3. Dependency Injection (Hilt)

### 3.1 Module layout

**Package:** `com.laneshadow.di`

```
com.laneshadow.di/
├── ConvexModule.kt          // ConvexClient + sub-clients
├── AuthModule.kt            // AuthRepository binding (Clerk impl)
├── StorageModule.kt         // DataStore + EncryptedTokenStore
├── RepositoryModule.kt      // ChatRepository, RouteRepository, SessionRepository
├── MapboxModule.kt          // OfflineManager wrapper
└── DispatcherModule.kt      // CoroutineDispatcher (IO, Main, Default)
```

### 3.2 Application + Activity

```
@HiltAndroidApp
class LaneShadowApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Mapbox already initialized via secrets.xml (existing path)
    }
}
```

`MainActivity` annotated `@AndroidEntryPoint`. ViewModels annotated `@HiltViewModel`.

### 3.3 ConvexModule

```
@Module
@InstallIn(SingletonComponent::class)
object ConvexModule {
    @Provides @Singleton
    fun provideConvexClient(
        authRepository: AuthRepository,
        @ApplicationContext ctx: Context,
    ): ConvexClient {
        val deploymentUrl = BuildConfig.CONVEX_DEPLOYMENT
            .ifBlank { error("CONVEX_DEPLOYMENT missing in BuildConfig") }
            .toConvexHttpUrl()
        return ConvexClientWithAuth(
            deploymentUrl = deploymentUrl,
            authRepository = authRepository,
        )
    }

    @Provides @Singleton
    fun provideChatRepository(client: ConvexClient): ChatRepository =
        ChatRepositoryImpl(client)

    @Provides @Singleton
    fun provideRouteRepository(client: ConvexClient): RouteRepository =
        RouteRepositoryImpl(client)

    @Provides @Singleton
    fun provideSessionRepository(client: ConvexClient): SessionRepository =
        SessionRepositoryImpl(client)
}
```

### 3.4 AuthModule

```
@Module
@InstallIn(SingletonComponent::class)
abstract class AuthModule {
    @Binds @Singleton
    abstract fun bindAuthRepository(impl: ClerkAuthRepository): AuthRepository
}

@Module
@InstallIn(SingletonComponent::class)
object ClerkModule {
    @Provides @Singleton
    fun provideClerk(@ApplicationContext ctx: Context): Clerk =
        Clerk.initialize(ctx, BuildConfig.CLERK_PUBLISHABLE_KEY)
}
```

If we fall back to Custom Tabs, swap the `@Binds` to `CustomTabsAuthRepository` — single-line change.

### 3.5 StorageModule

```
@Module
@InstallIn(SingletonComponent::class)
object StorageModule {
    private val Context.appPrefs by preferencesDataStore(name = "app_prefs")

    @Provides @Singleton
    fun provideAppDataStore(@ApplicationContext ctx: Context): DataStore<Preferences> =
        ctx.appPrefs

    @Provides @Singleton
    fun provideEncryptedTokenStore(@ApplicationContext ctx: Context): EncryptedTokenStore =
        EncryptedTokenStore(ctx)

    @Provides @Singleton
    fun provideAppStateRepository(ds: DataStore<Preferences>): AppStateRepository =
        AppStateRepositoryImpl(ds)
}
```

### 3.6 DispatcherModule (testability)

```
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class IoDispatcher
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class MainDispatcher
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class DefaultDispatcher

@Module
@InstallIn(SingletonComponent::class)
object DispatcherModule {
    @Provides @IoDispatcher fun ioDispatcher(): CoroutineDispatcher = Dispatchers.IO
    @Provides @MainDispatcher fun mainDispatcher(): CoroutineDispatcher = Dispatchers.Main
    @Provides @DefaultDispatcher fun defaultDispatcher(): CoroutineDispatcher = Dispatchers.Default
}
```

This enables `TestDispatcher` swap in unit tests.

### 3.7 Build.gradle additions for Hilt

```
plugins {
    id("com.google.devtools.ksp")          // Hilt now supports KSP, faster than kapt
    id("dagger.hilt.android.plugin")
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.52")
    ksp("com.google.dagger:hilt-android-compiler:2.52")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
}
```

KSP preferred over kapt — Kotlin 2.2 toolchain (project uses 2.2.21) treats kapt as legacy.

---

## 4. State Management Architecture

### 4.1 Pattern

| Concern | Tool | Notes |
|---|---|---|
| Per-screen UI state | `@HiltViewModel` + `StateFlow<UiState>` | Sealed interface UiState, sealed interface Intent |
| App-wide state | `AppStateRepository` (Singleton) backed by DataStore | Theme, hasCompletedOnboarding, lastViewedSessionId, defaultCamera |
| Auth state | `AuthRepository.state: StateFlow<AuthState>` | Shared flow consumed by `LaneShadowApp` |
| Compose collection | `state.collectAsStateWithLifecycle()` | `androidx.lifecycle:lifecycle-runtime-compose` (not currently in deps; add) |

### 4.2 Top-level `AppState`

Embedded in `AuthState` consumer + `AppStateRepository.appState: Flow<AppPreferences>`:

```
data class AppPreferences(
    val themeMode: ThemeMode,                 // SYSTEM | LIGHT | DARK
    val hasCompletedOnboarding: Boolean,
    val lastViewedSessionId: String?,
    val defaultCamera: CameraPosition?,
    val sessionCameras: Map<String, CameraPosition>,
)
```

`AppStateRepositoryImpl` exposes `Flow<AppPreferences>` and per-key suspend mutators. DataStore guarantees serialization; no manual lock needed.

### 4.3 ChatViewModel — state machine ported from `useRideFlow`

**File:** `com.laneshadow.ui.chat.ChatViewModel.kt`

Mirror RN reducer one-to-one. The Kotlin-idiomatic approach:

```
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val sessionRepository: SessionRepository,
    private val appStateRepository: AppStateRepository,
    @IoDispatcher private val io: CoroutineDispatcher,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val _flowState = MutableStateFlow<RideFlowState>(RideFlowState.Idle())
    val flowState: StateFlow<RideFlowState> = _flowState.asStateFlow()

    private val _optimisticMessages = MutableStateFlow<List<OptimisticMessage>>(emptyList())

    private var currentSessionId: String? = savedStateHandle["sessionId"]
    private var sendJob: Job? = null

    // Live messages stream from Convex per current session
    @OptIn(ExperimentalCoroutinesApi::class)
    val messages: StateFlow<List<SessionMessage>> = flowState
        .map { (it as? RideFlowState.WithSession)?.sessionId }
        .distinctUntilChanged()
        .flatMapLatest { sessionId ->
            if (sessionId == null) flowOf(emptyList())
            else chatRepository.subscribeToMessages(sessionId)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    // Active route plan stream
    val activeRoutePlan: StateFlow<RoutePlan?> = /* similar pattern, sourced from RouteRepository.subscribeToActivePlans */

    fun onIntent(intent: ChatIntent) { /* delegates to dispatch */ }
    private fun dispatch(action: RideFlowAction) {
        _flowState.update { current -> reduce(current, action) }
        // Side effects keyed off transitions
        when (action) {
            is RideFlowAction.SendMessage -> launchSendMessage(action.content)
            is RideFlowAction.CancelPlanning -> sendJob?.cancel().also { cancelOnBackend() }
            else -> Unit
        }
    }
}
```

`RideFlowState` and `RideFlowAction` live in `com.laneshadow.ui.chat.state`:

```
sealed interface RideFlowState {
    sealed interface WithSession : RideFlowState { val sessionId: String }

    data class Idle(
        val sessionId: String? = null,
        val routeOptions: PlannedRouteOptions? = null,
        val selectedRouteId: String? = null,
    ) : RideFlowState

    data class Planning(
        override val sessionId: String,
        val planId: String? = null,
        val currentPhase: String = "analyzing",
        val routeOptions: PlannedRouteOptions? = null,
        val selectedRouteId: String? = null,
    ) : RideFlowState, WithSession

    data class Error(
        val sessionId: String?,
        val message: String,
        val timestamp: Long,
    ) : RideFlowState

    data class RouteResults(
        override val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String?,
    ) : RideFlowState, WithSession

    data class RouteDetails(
        override val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String,
    ) : RideFlowState, WithSession

    data class SessionHistory(
        override val sessionId: String,
        val routeOptions: PlannedRouteOptions,
        val selectedRouteId: String?,
    ) : RideFlowState, WithSession
}

sealed interface RideFlowAction {
    data class SendMessage(val content: String) : RideFlowAction
    data class PlanningSuccess(val routeOptions: PlannedRouteOptions) : RideFlowAction
    data class PlanningError(val message: String) : RideFlowAction
    data object CancelPlanning : RideFlowAction
    data class SelectRoute(val routeOptionId: String) : RideFlowAction
    data object ViewHistory : RideFlowAction
    data object CloseHistory : RideFlowAction
    data object NewSession : RideFlowAction
    data class LoadSession(val sessionId: String, val options: PlannedRouteOptions, val selected: String?) : RideFlowAction
    data object ClearError : RideFlowAction
}

internal fun reduce(state: RideFlowState, action: RideFlowAction): RideFlowState { /* mirror RN reducer */ }
```

**Test doc:** `com.laneshadow.ui.chat.state.ReduceTest` — unit-test reducer purity for every transition (no Convex, no Hilt). Direct port of `react-native/hooks/use-ride-flow.test.ts`.

### 4.4 SessionViewModel

```
@HiltViewModel
class SessionsViewModel @Inject constructor(
    private val sessionRepository: SessionRepository,
    private val appStateRepository: AppStateRepository,
) : ViewModel() {
    val state: StateFlow<SessionsUiState> = combine(
        sessionRepository.subscribeToSessions(),
        appStateRepository.appState.map { it.lastViewedSessionId },
    ) { sessions, activeId -> SessionsUiState.Loaded(sessions, activeId) }
        .catch { emit(SessionsUiState.Error(it.message ?: "Unknown")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SessionsUiState.Loading)

    fun selectSession(id: String) = viewModelScope.launch {
        appStateRepository.setLastViewedSessionId(id)
    }
    fun newSession() = viewModelScope.launch { /* navigation handled by route */ }
}
```

Per-session camera persistence: `appStateRepository.setSessionCamera(sessionId, camera)`. The `LSMap` host calls this from a debounced `onCameraMove` callback (debounce 300 ms via Flow operator).

### 4.5 SettingsViewModel

```
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val appStateRepository: AppStateRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {
    val state = appStateRepository.appState
        .map { SettingsUiState(themeMode = it.themeMode) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SettingsUiState())

    fun setTheme(mode: ThemeMode) = viewModelScope.launch {
        appStateRepository.setThemeMode(mode)
    }
    fun signOut() = viewModelScope.launch { authRepository.signOut() }
}
```

### 4.6 Compose collection idiom

Add dep: `androidx.lifecycle:lifecycle-runtime-compose:2.8.3` (sibling to existing `lifecycle-runtime-ktx`). All screens use:

```
val uiState by viewModel.state.collectAsStateWithLifecycle()
```

Never `collectAsState` (no lifecycle awareness — leaks subscriptions).

---

## 5. Convex Client Wrapper

### 5.1 SDK selection

Convex publishes an official Kotlin Mobile SDK: `dev.convex:android-convexmobile` (Maven Central). Provides:
- `ConvexClient(deploymentUrl)`
- `subscribe<T>(name, args)` returning `Flow<Result<T>>`
- `mutation<T>(name, args)` returning `Result<T>`
- `action<T>(name, args)` returning `Result<T>`
- `setAuth { suspend -> jwt? }` for Clerk integration

**Decision:** Adopt the official SDK. Wrap behind feature-specific repositories so all screen code consumes Kotlin domain types, not SDK types.

### 5.2 ConvexClient extension — auth integration

```
@Singleton
class ConvexClientWithAuth @Inject constructor(
    deploymentUrl: ConvexHttpUrl,
    authRepository: AuthRepository,
) : ConvexClient(deploymentUrl) {
    init {
        setAuth { authRepository.getJwtForConvex() }
    }
}
```

Typed as `ConvexClient` everywhere downstream so we can swap in a fake during tests.

### 5.3 Repository interfaces (domain types only)

**Package:** `com.laneshadow.data`

```
package com.laneshadow.data.chat

interface ChatRepository {
    fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>>
    suspend fun sendMessage(sessionId: String, content: String, currentLocation: LatLng?): Result<Unit>
    suspend fun cancelPlan(routePlanId: String): Result<Unit>
}

class ChatRepositoryImpl @Inject constructor(
    private val client: ConvexClient,
    private val json: Json,
) : ChatRepository {
    override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
        client.subscribe<List<SessionMessageDto>>(
            name = "db/sessionMessages:list",
            args = mapOf("sessionId" to sessionId),
        ).map { result ->
            result.getOrThrow().map { it.toDomain() }
        }

    override suspend fun sendMessage(...) = runCatching {
        client.action<Unit>(
            name = "actions/agent/sendMessage:sendMessage",
            args = buildMap {
                put("sessionId", sessionId)
                put("content", content)
                currentLocation?.let { put("currentLocation", mapOf("lat" to it.lat, "lng" to it.lon)) }
            }
        ).getOrThrow()
    }
}
```

```
package com.laneshadow.data.session

interface SessionRepository {
    fun subscribeToSessions(): Flow<List<PlanningSession>>
    suspend fun createSession(firstMessage: String = ""): Result<String>      // returns sessionId
}
```

```
package com.laneshadow.data.route

interface RouteRepository {
    fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>>
    fun subscribeToSavedRoutes(): Flow<List<SavedRoute>>
    fun subscribeToSavedRoute(id: String): Flow<SavedRoute?>
    fun subscribeToEnrichmentStatus(routePlanId: String): Flow<EnrichmentStatus>
    suspend fun saveRoute(input: SaveRouteInput): Result<String>
    suspend fun renameRoute(id: String, name: String): Result<Unit>
    suspend fun softDeleteRoute(id: String): Result<Unit>
    suspend fun undoDeleteRoute(id: String): Result<Unit>
    fun subscribeToFavoriteRoads(): Flow<List<FavoriteRoad>>
    fun subscribeToPlanInit(): Flow<PlanInitDefaults>
}
```

### 5.4 DTO ↔ Domain mapping

`ConvexMobile` returns Kotlin types via kotlinx.serialization. DTOs in `data/.../dto/` are 1:1 wire mirrors; mapping functions in same package; domain types in `data/.../model/`. Keeps Convex changes from leaking into ViewModels.

### 5.5 Error handling

All Convex calls return `Result<T>`. ViewModels translate failures via `ConvexErrorMapper`:

```
object ConvexErrorMapper {
    fun toUserMessage(t: Throwable): String = when (t) {
        is ConvexException.Auth        -> "You've been signed out. Please sign in again."
        is ConvexException.RateLimited -> "You've reached your monthly limit."
        is ConvexException.Validation  -> t.message ?: "We couldn't process that request."
        is IOException                 -> "You appear to be offline. We'll retry."
        else                           -> "Something went wrong. Please try again."
    }
}
```

Mirrors `react-native/lib/convex-error.ts`.

---

## 6. Per-Screen Wiring Plan

Each existing v2 template (`com.laneshadow.ui.templates.*Screen`) is wired by a thin **Route composable** that owns `viewModel`, collects state, maps domain → mock-provider state types currently consumed by the templates, and forwards intents.

> **Important:** v2 templates take `MockProviders.X.State` arguments. We do not modify the templates. Instead we adapt domain types to those state types. This keeps the v2 sandbox golden snapshots stable and isolates real-data wiring to a thin adapter layer.

### 6.1 IdleRoute → IdleScreen

**File:** `com.laneshadow.ui.idle.IdleRoute.kt`

```
@Composable
fun IdleRoute(navController: NavController) {
    val vm: IdleViewModel = hiltViewModel()
    val ui by vm.state.collectAsStateWithLifecycle()
    IdleScreen(
        state = ui.toMockState(),
        onMenuTap = { navController.navigate(Route.Sessions) },
        onSuggestionTap = { chip -> vm.onSuggestionTap(chip.text) },
        onSend = { content -> vm.onSend(content) },
        onCollapse = { /* no-op or hide chat */ },
        onFilter = { /* future: open filter sheet */ },
        onValueChange = { vm.onInputChange(it) },
    )
    // React to flow state changes -> navigate
    LaunchedEffect(ui.navigateTo) {
        when (val nav = ui.navigateTo) {
            is IdleNavTarget.Planning -> navController.navigate(Route.Planning(nav.sessionId))
            null -> Unit
        }
    }
}
```

`IdleViewModel` shape:
- Inputs: text from chat input, suggestion chip taps
- Subscribes: `appStateRepository.appState` (greeting context: time-of-day, last city), `sessionRepository.subscribeToSessions()` (latest session for resume)
- On `onSend`: `chatRepository.createSession()` → `sendMessage` → set `navigateTo = Planning(sessionId)`
- Suggestion chips: 3-4 hardcoded prompts (RN behavior); chip tap fills input + sends

### 6.2 PlanningRoute → PlanningScreen

```
@Composable
fun PlanningRoute(args: Route.Planning, navController: NavController) {
    val vm: PlanningViewModel = hiltViewModel<PlanningViewModel, PlanningViewModel.Factory> {
        it.create(args.sessionId)
    }
    val ui by vm.state.collectAsStateWithLifecycle()
    PlanningScreen(
        state = ui.toMockState(),
        onMenuTap = { navController.navigate(Route.Sessions) },
        onCancel = { vm.cancel() },
        onRefineSend = { vm.refine(it) },
        ...
    )
    LaunchedEffect(ui.transition) {
        when (val t = ui.transition) {
            is PlanningTransition.Success -> navController.navigate(Route.RouteResults(args.sessionId)) {
                popUpTo(Route.Idle) { inclusive = false }
            }
            is PlanningTransition.Failure -> navController.navigate(Route.Error(args.sessionId, t.message))
            null -> Unit
        }
    }
}
```

`PlanningViewModel`:
- Subscribes to `chatRepository.subscribeToMessages(sessionId)` and derives current phase from latest agent message status
- Subscribes to `routeRepository.subscribeToActiveRoutePlans(sessionId)`; when a plan transitions to `status = "completed"` → emit `PlanningTransition.Success(routeOptions)`
- `cancel()` → `routeRepository.cancelPlan(planId)` for any in-flight plans + back-stack pop

Use Hilt `@AssistedInject` for `sessionId` factory pattern. Add `androidx.hilt:hilt-navigation-compose:1.2.0` for `hiltViewModel<VM, Factory>` API.

### 6.3 RouteResultsRoute → RouteResultsScreen

```
class RouteResultsViewModel @AssistedInject constructor(
    @Assisted sessionId: String,
    private val routeRepository: RouteRepository,
    ...
) : ViewModel() {
    val state: StateFlow<RouteResultsUiState> = routeRepository
        .subscribeToActiveRoutePlans(sessionId)
        .map { plans -> RouteResultsUiState.Loaded(plans.first().options) }
        .stateIn(...)

    fun selectRoute(routeOptionId: String) { _selected.value = routeOptionId }
    fun refine(content: String) { /* delegate to ChatRepository */ }
    fun saveRoute(routeOptionId: String) { /* open save sheet via ui-event flow */ }
}
```

`onRouteCardTap = { routeOptionId -> navController.navigate(Route.RouteDetails(sessionId, routeOptionId)) }`

### 6.4 RouteDetailsRoute → RouteDetailsScreen

ViewModel subscribes to:
- Active route plan (same session)
- Selected route option enrichment via `routeRepository.subscribeToEnrichmentStatus(routePlanId)`
- Polylines decoded once via existing `PolylineDecoder` util

`onSave` opens `SaveFavoriteSheet` (new — see §7.7); on confirm calls `routeRepository.saveRoute(input)` and surfaces success toast.

### 6.5 SessionsRoute → SessionsScreen

Already wired largely correctly. Minor change: `SessionsScreen.onSelect = { id -> vm.selectSession(id); navController.navigate(Route.Idle) { popUpTo(Route.Idle) { inclusive = true } } }`. The drawer path becomes navigation rather than just a drawer state.

`onNew = { vm.newSession(); navController.popBackStack(Route.Idle, inclusive = false) }`.

### 6.6 ErrorRoute → ErrorScreen

```
@Composable
fun ErrorRoute(args: Route.Error, navController: NavController) {
    val vm: ErrorViewModel = hiltViewModel()
    ErrorScreen(
        state = ErrorScreenState(message = args.message, suggestions = vm.suggestions(args)),
        onRetry = { vm.retry(); navController.popBackStack() },
        onSuggestionTap = { suggestion ->
            vm.handle(suggestion)
            navController.navigate(suggestion.target)
        },
    )
}
```

`ErrorViewModel.suggestions(args)` returns context-aware actions (sign in, switch session, retry).

---

## 7. Missing UI Surfaces

These have no v2 equivalent. Each is built from existing atoms/molecules — no new atoms required. No new icons should be needed (existing icon catalog covers settings, save, offline, theme).

### 7.1 SignInScreen / SignUpScreen

**Files:**
- `com.laneshadow.ui.auth.SignInScreen.kt`
- `com.laneshadow.ui.auth.SignUpScreen.kt`

Composition: `LSCard` > `Column { LSText(heading) + LSFormField(email) + LSFormField(password) + LSButton(continue) + LSDivider + LSButton(google) + LSButton(apple) + LSText(toggle to sign-up) }`

Signature:
```
@Composable
fun SignInScreen(
    state: SignInUiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onContinue: () -> Unit,
    onGoogleSignIn: () -> Unit,
    onAppleSignIn: () -> Unit,
    onSwitchToSignUp: () -> Unit,
    modifier: Modifier = Modifier,
)
```

### 7.2 OAuth callback / loading

Not a navigable destination — handled by `MainActivity.onNewIntent` → `DeepLinkBus`. `LaneShadowApp` shows `SplashScreen` (just an `LSSpinner` over `LSPanel`) during `AuthState.Loading`.

### 7.3 SavedRoutesScreen

**File:** `com.laneshadow.ui.savedroutes.SavedRoutesScreen.kt`

```
@Composable
fun SavedRoutesScreen(
    state: SavedRoutesUiState,
    onRouteTap: (String) -> Unit,
    onSearchChange: (String) -> Unit,
    onMenuTap: () -> Unit,
    onDeleteRoute: (String) -> Unit,
    onUndoDelete: (String) -> Unit,
    modifier: Modifier = Modifier,
)
```

Composition: `LSTopBar` + search field (`LSFormField`) + `LazyColumn { items(routes) { route -> LSContentCard / LSRouteCard } }` + `LSEmptyState` for empty.

`SavedRoutesViewModel` subscribes to `routeRepository.subscribeToSavedRoutes()`. Soft delete + undo wired through repository. Surfaces `LSToast` on delete with undo action (5-second window).

### 7.4 SavedRouteDetailScreen

Reuses `RouteDetailsScreen` template **provided** the `RouteDetailsScreenState` is fixture-compatible with saved-route data. Likely yes — both render distance/duration/elevation/segments. Differences: saved routes are immutable (no refine), no enrichment refresh. Add a `viewMode: SavedView | LiveView` flag to the wrapping route composable to suppress refine input.

### 7.5 SettingsScreen

**File:** `com.laneshadow.ui.settings.SettingsScreen.kt`

```
@Composable
fun SettingsScreen(
    state: SettingsUiState,
    onThemeModeChange: (ThemeMode) -> Unit,
    onSignOut: () -> Unit,
    onMenuTap: () -> Unit,
    modifier: Modifier = Modifier,
)
```

Composition: `LSTopBar` + `Column { LSSectionHeader("Appearance") + LSListRow with LSSwitch / segmented control for Light/Dark/Auto + LSSectionHeader("Account") + LSListRow(displayName, email) + LSButton(signOut, variant=destructive) }`.

### 7.6 OfflineRegionsScreen + OfflineRegionSelectorScreen

**Files:**
- `com.laneshadow.ui.offline.OfflineRegionsScreen.kt`
- `com.laneshadow.ui.offline.OfflineRegionSelectorScreen.kt`

`OfflineRegionsScreen` lists current regions with download progress; built from `LSContentCard` rows + `Progress` atom + `LSButton(delete)`.

`OfflineRegionSelectorScreen` is map-based:
- `LSMap(mode = MapMode.Interactive)` full-screen
- `LSGlassPanel` overlay with name input (`LSTextField`) + zoom range (`LSSlider`) + `LSButton("Download")`
- User pans to select region; on download tap, capture current map bounds + zoom range and dispatch to `OfflineDownloadWorker` (see §10).

```
@Composable
fun OfflineRegionsScreen(
    state: OfflineRegionsUiState,
    onAddRegion: () -> Unit,
    onDeleteRegion: (String) -> Unit,
    onResumeDownload: (String) -> Unit,
    onMenuTap: () -> Unit,
    modifier: Modifier = Modifier,
)

@Composable
fun OfflineRegionSelectorScreen(
    state: OfflineRegionSelectorUiState,
    onNameChange: (String) -> Unit,
    onMinZoomChange: (Int) -> Unit,
    onMaxZoomChange: (Int) -> Unit,
    onCameraMove: (CameraPosition, Bounds) -> Unit,
    onDownload: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier,
)
```

### 7.7 SaveFavoriteSheet (BottomSheet molecule)

**File:** `com.laneshadow.ui.sheets.SaveFavoriteSheet.kt`

Built on existing `LSBottomSheet` molecule (Compose `ModalBottomSheet` wrapper). Reuses `LSFormField` (name input), `LSContentCard` (route preview), `LSButton` (save / cancel). Uses `KeyboardAvoidingInput` pattern (per `MEMORY.md` rule: inputs in bottom sheets must be keyboard-aware) — wrap input area in `Modifier.imePadding()`.

```
@Composable
fun SaveFavoriteSheet(
    state: SaveFavoriteUiState,
    onNameChange: (String) -> Unit,
    onSave: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
)
```

### 7.8 PlanRideSheet (manual planning) — DEFER

Per Human Signal #2 (parity with RN), this exists in RN. Per the appetite (6 weeks), classify as **stretch**: build only if Phase A-D land on schedule. Place behind a `BuildConfig.FEATURE_MANUAL_PLANNING` flag default-off. Non-blocking for ship.

### 7.9 ModelSetupScreen — OUT OF SCOPE

Human Signal #3 excludes local LLM. Skip entirely. Existing `models/` package files (ModelDownloadManager etc.) remain untouched — flag as legacy in a `// TODO(v3): consider deletion post-cut` block.

### 7.10 Dev menu — DEFER unless needed

Skip. Use Android Studio Layout Inspector + Logcat for debugging. Re-evaluate if multiple non-engineering testers join.

---

## 8. Persistence Strategy

### 8.1 DataStore Preferences (`androidx.datastore:datastore-preferences:1.1.1`)

**File:** `com.laneshadow.data.local.AppStateRepositoryImpl.kt`

Stored keys:

| Key | Type | Default | Source |
|---|---|---|---|
| `theme_mode` | String enum (`LIGHT|DARK|SYSTEM`) | `SYSTEM` | RN: `theme_preference` |
| `has_completed_onboarding` | Boolean | `false` | RN: `useSettingsStore.hasCompletedOnboarding` |
| `last_viewed_session_id` | String? | null | RN: `useChatSessionStore.lastViewedSessionId` |
| `default_camera` | JSON-encoded `CameraPosition` | null | RN: `useChatSessionStore.defaultCamera` |
| `session_cameras` | JSON-encoded `Map<String, CameraPosition>` | empty | RN: `useChatSessionStore.bySession` |

Camera maps stored as a single JSON blob keyed by `session_cameras` (DataStore Preferences doesn't support nested types; for >1 KB blobs we'd switch to Proto DataStore — initial estimate keeps us under that threshold).

### 8.2 EncryptedSharedPreferences (`androidx.security:security-crypto:1.1.0-alpha06`)

Sole purpose: Clerk JWT + refresh token. See §2.4.

### 8.3 Room — NOT NEEDED

Convex's mobile SDK provides:
- In-memory query cache while subscribed
- Optional persistent query cache (off by default; enable selectively for `subscribeToSessions` once we measure)

For v3 we accept **online-only** behavior outside saved routes / camera state. Saved routes ARE persisted on the server (immutable snapshots in `saved_routes` table) so even on reload after a network outage they appear instantly via Convex SDK cache.

**Defer Room indefinitely** unless QA shows real-world crashy behavior on flaky networks. Adding Room later is non-breaking.

### 8.4 File system

Out of scope (no model files, no rich downloads). Mapbox offline regions are stored by Mapbox SDK in its own internal storage — we don't touch the filesystem ourselves.

---

## 9. Mapbox Integration Tasks

The existing `LSMap` atom (`com.laneshadow.ui.atoms.LSMap`) already wraps Mapbox via `AndroidView` and supports polylines + annotations + camera. Required v3 additions:

### 9.1 Camera persistence per session

`LSMap` currently exposes `camera: CameraPosition` as input but no `onCameraMove` callback. Add:

```
@Composable
fun LSMap(
    mode: MapMode,
    camera: CameraPosition,
    cameraFit: CameraFit = CameraFit.Static,
    polylines: List<PolylineData> = emptyList(),
    annotations: List<Annotation> = emptyList(),
    showFavorites: Boolean = false,
    onTap: ((LatLng) -> Unit)? = null,
    onCameraMove: ((CameraPosition) -> Unit)? = null,        // NEW
    onLongPressSegment: ((PolylineData, LatLng) -> Unit)? = null,  // NEW
)
```

`onCameraMove` is wired to Mapbox `MapboxMap.subscribeCameraChanged` → debounced 300 ms. `onLongPressSegment` uses `MapboxMap.queryRenderedFeatures` or proximity check via decoded polyline coordinates.

These changes are **additive** and backward-compatible. Existing v2 callers (sandbox stories) pass null — snapshot tests unchanged.

### 9.2 Multiple polyline rendering

Already supported (see `LSMap.kt:111-173`). Bind `polylines` to active `RoutePlan.options` list, decoding each option's `polyline: String` (encoded polyline) via existing `PolylineDecoder` util. Color via `RouteVariant.Best | Alt1 | Alt2`, sourced from theme.

### 9.3 Offline region download UI

**Mapbox 11.x APIs used:**
- `OfflineManager` (replaces deprecated `OfflineRegionManager` in 11.x)
- `TilesetDescriptorOptions(styleURI = ..., minZoom = 12, maxZoom = 16)`
- `TileStore.create(filePathProvider).loadTileRegion(regionId, options) { progress, error -> }`
- `TileStore.allTileRegions()` for list
- `TileStore.removeTileRegion(regionId)` for delete

Wrapped behind `MapboxOfflineRepository`:

```
interface MapboxOfflineRepository {
    val regions: Flow<List<OfflineRegion>>
    suspend fun downloadRegion(name: String, bounds: Bounds, minZoom: Int, maxZoom: Int): String   // returns regionId
    suspend fun deleteRegion(regionId: String)
    fun observeProgress(regionId: String): Flow<DownloadProgress>     // 0..1 + status
}
```

Implementation lives in `com.laneshadow.data.mapbox.MapboxOfflineRepositoryImpl`.

### 9.4 Long-press on polyline → open SaveFavoriteSheet

Use `onLongPressSegment` callback (see §9.1). `RouteResultsViewModel` exposes `_saveSheet: MutableStateFlow<SaveFavoriteUiState?>`; UI observes and conditionally renders `SaveFavoriteSheet`.

### 9.5 Search markers

Place autocomplete uses Mapbox Search API. Wrap with `interface PlaceAutocompleteRepository`:

```
interface PlaceAutocompleteRepository {
    suspend fun suggest(query: String, proximity: LatLng?): List<PlaceSuggestion>
    suspend fun retrieve(suggestionId: String): Place
}
```

Markers rendered via `LSMap.annotations` (existing Annotation type). Only used in plan-ride sheet (§7.8) — defer with the sheet.

---

## 10. Background Tasks

### 10.1 WorkManager for Mapbox offline downloads

Offline downloads are long-running and should survive the app being backgrounded. Use:

```
@HiltWorker
class OfflineDownloadWorker @AssistedInject constructor(
    @Assisted ctx: Context,
    @Assisted params: WorkerParameters,
    private val offlineRepo: MapboxOfflineRepository,
) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val regionId = inputData.getString("regionId") ?: return Result.failure()
        return runCatching {
            offlineRepo.downloadRegion(regionId, ...)
        }.fold({ Result.success() }, { Result.retry() })
    }
}
```

Dependencies:
- `androidx.work:work-runtime-ktx:2.9.1`
- `androidx.hilt:hilt-work:1.2.0` + `ksp("androidx.hilt:hilt-compiler:1.2.0")`

WorkManager spawns its own coroutines; tracks progress; survives process death.

### 10.2 ForegroundService for user-initiated downloads

Per Android 14 (API 34) policy, long-running data sync requires `dataSync` foreground service type when started from UI:

```
<service
    android:name=".offline.OfflineDownloadService"
    android:foregroundServiceType="dataSync"
    android:exported="false" />
```

The service publishes a low-priority notification ("Downloading offline map: city-name 47%") via `NotificationCompat`. Channel: `OFFLINE_DOWNLOADS`.

Notification permission (`POST_NOTIFICATIONS`) on API 33+: request from `OfflineRegionSelectorScreen` via `ActivityResultContracts.RequestPermission()`. Soft-fail if denied — download still works, user just doesn't see notification.

### 10.3 No other background work

No scheduled jobs. No analytics flush. No model preload. No discovery indexing. Anything requiring cron-like behavior is server-side in Convex.

---

## 11. Testing Strategy

### 11.1 Existing tests — KEEP

- `dropshots` snapshot tests for atoms/molecules/organisms/templates
- `androidx.compose.ui:ui-test-junit4` for any component tests
- `robolectric` for tests requiring Android resources
- All existing tests stay green throughout v3.

### 11.2 New test categories

| Layer | Framework | Pattern | Sample test name |
|---|---|---|---|
| Reducer (pure) | JUnit + kotlin-test | Direct port from RN | `RideFlowReducerTest.idle_sendMessage_transitionsToPlanning` |
| ViewModel | JUnit + Turbine + TestDispatcher | Inject fake repository, assert `state.test { }` emissions | `ChatViewModelTest.sendMessage_optimisticThenServerConfirmation` |
| Repository | JUnit + Convex test client | Real Convex dev deployment | `ChatRepositoryIntegrationTest.subscribeToMessages_emitsLiveUpdates` |
| Compose UI | ComposeTestRule + Hilt fakes | Click flows, screen-level asserts | `IdleRouteTest.suggestionTap_dispatchesSendMessage` |
| End-to-end | UIAutomator | 1-2 happy paths | `SignInToRouteResultsE2E.googleOAuthAndPlanRide` |

### 11.3 SUPREME RULE compliance

> **Stubbing is a cardinal sin.**
>
> Repository integration tests MUST hit a real Convex dev deployment. We provision a `convex-test-android` deployment with seeded data (test user via Clerk dev environment, fixed-id sessions/routes). CI pipeline reads the deployment URL + Clerk test JWT from a CI secret. Integration tests are gated `@RequiresConvexDeployment` and run on every PR.

E2E tests run against the same deployment via UIAutomator. The Clerk OAuth flow uses a known test user (email/password backed) so tests don't require real Google/Apple IDP interaction.

Mocks/fakes acceptable only at the **ViewModel** boundary (FakeChatRepository for unit tests). Repositories themselves are tested integration-style.

### 11.4 Test files to create — sample

```
android/app/src/test/java/com/laneshadow/
├── ui/chat/state/RideFlowReducerTest.kt
├── ui/chat/ChatViewModelTest.kt
├── ui/idle/IdleViewModelTest.kt
├── ui/sessions/SessionsViewModelTest.kt
├── ui/auth/AuthViewModelTest.kt
├── data/chat/ChatRepositoryImplTest.kt        // unit-level mocks
└── data/local/AppStateRepositoryImplTest.kt   // DataStore in-memory

android/app/src/androidTest/java/com/laneshadow/
├── data/chat/ChatRepositoryIntegrationTest.kt    // real Convex
├── data/route/RouteRepositoryIntegrationTest.kt  // real Convex
├── data/auth/AuthRepositoryIntegrationTest.kt    // real Clerk dev
├── ui/idle/IdleRouteTest.kt                      // ComposeTestRule
├── ui/auth/SignInScreenTest.kt
├── ui/route/RouteResultsRouteTest.kt
└── e2e/SignInToRouteResultsE2E.kt
```

### 11.5 Test infrastructure additions

```
testImplementation("app.cash.turbine:turbine:1.1.0")
testImplementation("io.mockk:mockk:1.13.10")               // optional, only at VM boundary
androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
androidTestImplementation("com.google.dagger:hilt-android-testing:2.52")
kspAndroidTest("com.google.dagger:hilt-android-compiler:2.52")
```

A `HiltTestRunner` test runner replaces the default to enable Hilt test components.

---

## 12. Build & Deployment

### 12.1 build.gradle.kts additions (`app/build.gradle.kts`)

```
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.devtools.ksp") version "2.2.21-1.0.25"   // NEW
    id("dagger.hilt.android.plugin") version "2.52"          // NEW
    id("com.dropbox.dropshots") version "0.6.0"
}

android {
    defaultConfig {
        // existing fields ...
        buildConfigField("String", "CLERK_PUBLISHABLE_KEY", "\"${readEnvValue("CLERK_PUBLISHABLE_KEY", "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY")}\"")
    }
}

dependencies {
    // existing ...

    // Hilt
    implementation("com.google.dagger:hilt-android:2.52")
    ksp("com.google.dagger:hilt-android-compiler:2.52")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    implementation("androidx.hilt:hilt-work:1.2.0")
    ksp("androidx.hilt:hilt-compiler:1.2.0")

    // Navigation Compose (typed routes via Kotlin Serialization)
    implementation("androidx.navigation:navigation-compose:2.8.0")

    // Lifecycle Compose (collectAsStateWithLifecycle)
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.3")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Encrypted prefs
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // SplashScreen
    implementation("androidx.core:core-splashscreen:1.0.1")

    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Convex
    implementation("dev.convexmobile:android:0.4.x")     // pin to known-good version after spike

    // Clerk
    implementation("com.clerk:clerk-android:0.x")        // alpha SDK; pin after spike

    // Test
    testImplementation("app.cash.turbine:turbine:1.1.0")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.52")
    kspAndroidTest("com.google.dagger:hilt-android-compiler:2.52")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
}
```

### 12.2 AndroidManifest.xml additions

```
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.INTERNET" />                   <!-- NEW -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />        <!-- NEW (current location) -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />      <!-- NEW -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />          <!-- NEW (offline downloads) -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />          <!-- NEW -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" /><!-- NEW (API 34+) -->

<application
    android:name=".LaneShadowApp"
    ...>
    <!-- existing MainActivity block ... -->
    <activity android:name=".MainActivity" ...>
        <!-- existing intent-filter blocks ... -->
        <intent-filter android:autoVerify="false">                                <!-- NEW deep link -->
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="laneshadow" android:host="oauth-callback" />
        </intent-filter>
    </activity>

    <service                                                                       <!-- NEW -->
        android:name=".offline.OfflineDownloadService"
        android:foregroundServiceType="dataSync"
        android:exported="false" />

    <provider                                                                      <!-- NEW (WorkManager Hilt) -->
        android:name="androidx.startup.InitializationProvider"
        android:authorities="${applicationId}.androidx-startup"
        android:exported="false"
        tools:node="merge">
        <meta-data
            android:name="androidx.work.WorkManagerInitializer"
            android:value="androidx.startup"
            tools:node="remove" />
    </provider>
</application>
```

### 12.3 Application class

```
@HiltAndroidApp
class LaneShadowApp : Application(), Configuration.Provider {
    @Inject lateinit var workerFactory: HiltWorkerFactory
    override val workManagerConfiguration: Configuration =
        Configuration.Builder().setWorkerFactory(workerFactory).build()
}
```

### 12.4 Signing config & app store metadata

- Out of scope for this architecture doc; existing release config remains. The Mapbox token and `CLERK_PUBLISHABLE_KEY` are read from env into BuildConfig, never committed.
- `proguard-rules.pro` may need `-keep` rules for kotlinx.serialization classes used by ConvexMobile, Clerk SDK reflection, Hilt — verify before first release build.

### 12.5 Sandbox preserved

The sandbox launch scheme (`app-sandbox://sandbox`) and `SandboxChecker` remain untouched. Sandbox stories, snapshot tests, and parity manifest validation continue to function. The new `LaneShadowApp()` composable is only entered when `SandboxChecker.shouldOpen` returns false.

---

## 13. Min/Target SDK Decisions

| Spec | Current | v3 target | Notes |
|---|---|---|---|
| `minSdk` | 26 | **26** (unchanged) | ConvexMobile supports 24+; Clerk Android supports 26+; security-crypto supports 23+; Mapbox 11.x supports 21+. Min 26 satisfied. |
| `targetSdk` | 34 | **34** | Triggers FGS-type, notification, scoped storage rules — all addressed above. |
| `compileSdk` | 36 | **36** | Existing. Allows access to API 34 features in source while compiling against latest. |
| Kotlin | 2.2.21 | 2.2.21 | KSP version pinned to match (`2.2.21-1.0.25`). |

No SDK bump required. Verify Clerk SDK alpha doesn't drag dependencies that would push minSdk above 26 — flag if so during week-1 spike.

---

## 14. Cut Sequence (per Human Signal #4)

If midway through the sprint cross-platform burden becomes too high, cutting Android cleanly:

### 14.1 What gets shipped if cut

- **Stays:** v2 sandbox + atoms/molecules/organisms/templates + token system + Mapbox infra + dropshots snapshot tests. No regression to design system work. Sandbox launch scheme intact.
- **Goes:** Anything in `com.laneshadow.di`, `com.laneshadow.auth`, `com.laneshadow.data`, `com.laneshadow.navigation`, `com.laneshadow.ui.{idle,planning,routeresults,routedetails,sessions,error,settings,savedroutes,offline,sheets,auth}`. The new `LaneShadowApp()` composable, the AndroidManifest deep-link filter, the WorkManager service.

### 14.2 Cut mechanics

1. Open a single revert-style PR. Files added in v3 are isolated to packages above; deletion is mechanical.
2. Restore minimal `MainActivity` from git (current `LaneShadowAppContent` placeholder).
3. Remove Hilt + Navigation + Convex + Clerk + Work + DataStore + security-crypto deps from build.gradle.
4. Remove new permissions from AndroidManifest.
5. Delete any test files in those packages.
6. Sandbox path stays green; existing tests remain.

### 14.3 Cut criteria

Cut if any of these are true at the **end of week 3**:
- Convex Mobile Kotlin SDK proves materially less reactive than iOS — i.e. takes engineering >1 week beyond planned to get message subscriptions working.
- Clerk Android SDK alpha is so unstable that Custom Tabs fallback also fails on >1 day of integration.
- iOS implementation has stalled and pulling Android+iOS together exceeds 6-week appetite by >25%.

Human decision, not algorithmic. Document the cut decision in `.spec/prds/v3-integration/DECISIONS.md`.

### 14.4 Post-cut backlog

If cut, surviving Android work re-scoped as a new sprint after iOS ships. PRD updates: technical-requirements.md gains "iOS only" callout; SPRINT.md scope reduces; Android entries move to "Deferred" section.

---

## 15. Risk Inventory

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Clerk Android SDK alpha breaks during sprint | M | H | `AuthRepository` interface allows Custom Tabs fallback; spike SDK in week 1; pin known-good version. |
| ConvexMobile Kotlin SDK reactivity gaps on Compose | M | H | Spike `subscribeToSessions` + `subscribeToMessages` in week 1 day 3-5; if backpressure or recompose storms appear, layer a `distinctUntilChanged` + `conflate()` operator chain or fall back to manual websocket. |
| Mapbox 11.x offline API in Compose interop | M | M | Existing `LSMap` is `AndroidView`-hosted; offline manager runs outside Compose (just Repository). Risk concentrated in `OfflineRegionSelectorScreen` UX, not the SDK call. Build offline scaffolding behind a feature flag if late. |
| Hilt + Compose interop edge cases (ViewModel scoping with NavGraph) | L | M | `androidx.hilt:hilt-navigation-compose` solves this. Use `hiltViewModel()` only inside `composable<Route.X> { }` lambdas — never raise above. Document in onboarding. |
| WorkManager + ForegroundService API 34 policy compliance | L | M | Use `dataSync` type; request `POST_NOTIFICATIONS` permission; soft-fail on denial. Tested against API 34 emulator early. |
| EncryptedSharedPreferences alpha (`1.1.0-alpha06`) | L | L | If alpha proves flaky, drop to `1.0.0` stable (only difference is API 23 support which we don't need at min-26). |
| Token refresh race during cold start | M | M | Convex `setAuth` callback called on every connection; if returns null app rerouts to SignIn; one-shot reconnect on token success. Test: kill JWT mid-session, expect graceful re-auth. |
| Per-session camera DataStore size growth | L | L | Cap session-camera map at 50 most recent sessions; LRU eviction in `AppStateRepository`. |
| Mock-state ↔ domain-state adapter divergence | M | M | Each `*Route` composable's `toMockState()` is unit-tested. Sandbox golden tests catch any drift; CI runs `pnpm snapshots:check` per RULES.md cross-platform-component-parity rule. |
| Subagent fabrication during implementation | H | H | Per `MEMORY.md` `feedback_subagent_fabrication`, kotlin-implementer must commit work and orchestrator independently verifies via `git log`. Per the SUPREME RULE, integration tests MUST hit real Convex dev and real Clerk dev — no stubs accepted. |
| Material3 contention with custom theme | L | L | `LaneShadowTheme` already wraps Material3; ensure new auth/settings screens use `MaterialTheme.colorScheme.X` only via `LocalLaneShadowTheme.current.colors.X` mapping (existing pattern). No new Material3 imports in feature code. |
| Mapbox token / Convex deployment leakage in test logs | L | M | Test runners read from CI secrets; never commit `.env.local`; existing `secrets.xml` generation is Gradle-task-driven. Audit `.gitignore` once before merge. |

---

## 16. Phasing & Calendar

The 6-week appetite maps to 6 phases. Android can run parallel to iOS; weekly sync to confirm no parity drift.

| Week | Phase | Android deliverable | Test gate |
|---|---|---|---|
| 1 | A1: Spikes | Clerk SDK + ConvexMobile spike repos; choose `ClerkAuthRepository` vs `CustomTabsAuthRepository`; confirm minSdk 26 holds | Spike repo works against dev Convex + dev Clerk |
| 1-2 | A2: Auth | SignInScreen + SignUpScreen + AuthRepository + EncryptedTokenStore + AuthNavGraph + DeepLinkBus | Real OAuth flow signs in test user; JWT cached + refreshed |
| 2-3 | B: DI + Convex client | Hilt scaffolding; ConvexModule; ChatRepository / SessionRepository / RouteRepository (skeleton) | `subscribeToMessages` returns live data from real Convex; mutation calls return Result |
| 3-4 | C: Per-screen wiring | `*Route` composables for all 6 v2 screens; ChatViewModel state machine; RideFlowReducerTest green | E2E: type message → see PlanningScreen → see RouteResultsScreen with real polylines |
| 4-5 | D: Missing UI surfaces | SettingsScreen, SavedRoutesScreen, SaveFavoriteSheet | Save route → appears in saved-routes list; theme persists across restart |
| 5 | E: Mapbox offline | OfflineRegionsScreen + OfflineRegionSelectorScreen + WorkManager + ForegroundService | Download a region; verify offline mode renders saved tiles |
| 5-6 | F: Hardening | E2E tests; ProGuard rules; performance (recomposition + cold-start); a11y pass | UIAutomator E2E green on emulator |
| 6 | G: QA + cut decision | Bug fixes; cross-platform parity validation; cut decision documented | Sandbox snapshots stable; integration tests passing |

Stretch (week 6 only if ahead):
- 7.8 PlanRideSheet
- 7.10 Dev menu
- Performance: route polyline projection improvements (current LSMap canvas projection is simplified)

---

## 17. File Manifest (Plan)

**New files (estimate ~85 production files, ~45 test files):**

```
android/app/src/main/java/com/laneshadow/
├── MainActivity.kt                                  (modified)
├── LaneShadowApp.kt                                 (modified — @HiltAndroidApp)
├── di/
│   ├── ConvexModule.kt
│   ├── AuthModule.kt
│   ├── ClerkModule.kt
│   ├── StorageModule.kt
│   ├── RepositoryModule.kt
│   ├── MapboxModule.kt
│   └── DispatcherModule.kt
├── auth/
│   ├── AuthRepository.kt
│   ├── ClerkAuthRepository.kt
│   ├── CustomTabsAuthRepository.kt                  (fallback)
│   ├── AuthState.kt
│   └── storage/EncryptedTokenStore.kt
├── data/
│   ├── chat/ChatRepository.kt
│   ├── chat/ChatRepositoryImpl.kt
│   ├── chat/dto/SessionMessageDto.kt
│   ├── chat/model/SessionMessage.kt
│   ├── chat/model/OptimisticMessage.kt
│   ├── session/SessionRepository.kt
│   ├── session/SessionRepositoryImpl.kt
│   ├── session/dto/PlanningSessionDto.kt
│   ├── session/model/PlanningSession.kt
│   ├── route/RouteRepository.kt
│   ├── route/RouteRepositoryImpl.kt
│   ├── route/dto/RoutePlanDto.kt
│   ├── route/dto/SavedRouteDto.kt
│   ├── route/model/RoutePlan.kt
│   ├── route/model/SavedRoute.kt
│   ├── route/model/PlannedRouteOptions.kt
│   ├── route/model/EnrichmentStatus.kt
│   ├── mapbox/MapboxOfflineRepository.kt
│   ├── mapbox/MapboxOfflineRepositoryImpl.kt
│   ├── mapbox/PlaceAutocompleteRepository.kt        (defer with §7.8)
│   ├── local/AppStateRepository.kt
│   ├── local/AppStateRepositoryImpl.kt
│   ├── local/AppPreferences.kt
│   └── ConvexErrorMapper.kt
├── navigation/
│   ├── Routes.kt
│   ├── AuthNavGraph.kt
│   ├── MainNavGraph.kt
│   ├── DeepLinkBus.kt
│   └── NavExtensions.kt
├── offline/
│   └── OfflineDownloadService.kt
├── work/
│   └── OfflineDownloadWorker.kt
└── ui/
    ├── auth/
    │   ├── SignInScreen.kt
    │   ├── SignInRoute.kt
    │   ├── SignInViewModel.kt
    │   ├── SignUpScreen.kt
    │   ├── SignUpRoute.kt
    │   └── SignUpViewModel.kt
    ├── splash/SplashScreen.kt
    ├── chat/
    │   ├── state/RideFlowState.kt
    │   ├── state/RideFlowAction.kt
    │   ├── state/Reduce.kt
    │   ├── ChatViewModel.kt
    │   ├── ChatIntent.kt
    │   └── ChatStateAdapter.kt          // domain ↔ MockState adapters
    ├── idle/
    │   ├── IdleRoute.kt
    │   └── IdleViewModel.kt
    ├── planning/
    │   ├── PlanningRoute.kt
    │   └── PlanningViewModel.kt
    ├── routeresults/
    │   ├── RouteResultsRoute.kt
    │   └── RouteResultsViewModel.kt
    ├── routedetails/
    │   ├── RouteDetailsRoute.kt
    │   └── RouteDetailsViewModel.kt
    ├── sessions/
    │   ├── SessionsRoute.kt
    │   └── SessionsViewModel.kt
    ├── error/
    │   ├── ErrorRoute.kt
    │   └── ErrorViewModel.kt
    ├── settings/
    │   ├── SettingsScreen.kt
    │   ├── SettingsRoute.kt
    │   └── SettingsViewModel.kt
    ├── savedroutes/
    │   ├── SavedRoutesScreen.kt
    │   ├── SavedRoutesRoute.kt
    │   ├── SavedRoutesViewModel.kt
    │   ├── SavedRouteDetailRoute.kt
    │   └── SavedRouteDetailViewModel.kt
    ├── offline/
    │   ├── OfflineRegionsScreen.kt
    │   ├── OfflineRegionsRoute.kt
    │   ├── OfflineRegionsViewModel.kt
    │   ├── OfflineRegionSelectorScreen.kt
    │   ├── OfflineRegionSelectorRoute.kt
    │   └── OfflineRegionSelectorViewModel.kt
    └── sheets/
        ├── SaveFavoriteSheet.kt
        └── SaveFavoriteViewModel.kt
```

**Modified existing files:**
- `MainActivity.kt` — replace placeholder with `LaneShadowApp()` + `@AndroidEntryPoint`
- `LaneShadowApp.kt` — add `@HiltAndroidApp` + `Configuration.Provider`
- `AndroidManifest.xml` — permissions, deep-link filter, foreground service
- `app/build.gradle.kts` — Hilt, Navigation, ConvexMobile, Clerk, DataStore, security-crypto, work, lifecycle-compose, splashscreen
- `app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — additive `onCameraMove` and `onLongPressSegment` callbacks (backward-compatible default null)

**Files to retire (post-merge cleanup commit):**
- `models/AuthTokens.kt` (`SharedPrefsAuthTokenStorage`) — superseded by `EncryptedTokenStore`. Retire only after Phase A green.
- Other `models/*.kt` files (ModelDownloadManager, ChecksumValidator, etc.) — out of scope per signal #3 but **keep** untouched until product confirms model feature is permanently dropped. Add `@Deprecated("v3: not wired; see HUMAN SIGNAL #3")` annotations.

---

## 18. Acceptance Criteria

### AC-1: Auth flow end-to-end
- **Given** an unauthenticated cold start
- **When** the user taps "Continue with Google" and completes the OAuth flow
- **Then** they land on `IdleScreen`, `AuthRepository.state` emits `SignedIn(user)`, and `EncryptedTokenStore.getJwt()` returns a non-null Clerk JWT
- **Test:** `androidTest/auth/AuthRepositoryIntegrationTest.googleOAuth_endsInSignedIn`

### AC-2: Send message → see route results
- **Given** a signed-in user on `IdleScreen`
- **When** they type "Plan a scenic ride from SF to LA" and tap send
- **Then** they navigate to `PlanningScreen`, then to `RouteResultsScreen` with at least one polyline rendered
- **Test:** `androidTest/e2e/SignInToRouteResultsE2E`

### AC-3: Save a route
- **Given** a route on `RouteDetailsScreen`
- **When** the user taps Save, enters a name, and confirms
- **Then** the route appears in `SavedRoutesScreen` and persists across app restart
- **Test:** `androidTest/route/SavedRouteFlowTest`

### AC-4: Theme persists
- **Given** any signed-in screen
- **When** the user switches theme to Dark in `SettingsScreen` and force-stops the app
- **Then** on next launch the app renders in Dark mode before any composition flash
- **Test:** `test/local/AppStateRepositoryImplTest.themeMode_persistsAcrossRestart`

### AC-5: Sign out clears state
- **Given** a signed-in user
- **When** they tap Sign Out
- **Then** they land on `SignInScreen`, `EncryptedTokenStore.getJwt()` returns null, and Convex state is unauthenticated
- **Test:** `androidTest/auth/SignOutTest`

### AC-6: Offline region download
- **Given** the user on `OfflineRegionSelectorScreen`
- **When** they pan to a region, name it, and tap Download
- **Then** a foreground service notification appears, progress increments to 100%, and the region appears in `OfflineRegionsScreen`
- **Test:** `androidTest/offline/OfflineRegionDownloadTest` (against Mapbox dev tile API)

### AC-7: State machine purity
- **Given** any `RideFlowState` / `RideFlowAction` pair
- **When** `reduce(state, action)` is called
- **Then** the result matches the iOS state machine and RN reducer 1:1
- **Test:** `test/chat/state/RideFlowReducerTest` — every transition

### AC-8: Sandbox unaffected
- **Given** the existing v2 sandbox launch scheme
- **When** the app is launched with `am start -a android.intent.action.VIEW -d 'app-sandbox://sandbox/...'`
- **Then** the sandbox renders identically to pre-v3, and `pnpm snapshots:check` passes
- **Test:** existing dropshots snapshot suite

### AC-9: Deep link OAuth callback
- **Given** an in-flight OAuth flow
- **When** the IDP redirects to `laneshadow://oauth-callback?code=...`
- **Then** the app exchanges the code for a JWT and routes to `IdleScreen`
- **Test:** `androidTest/auth/OAuthCallbackDeepLinkTest`

### AC-10: Cut-clean
- **Given** the v3 commit set on a branch
- **When** the cut decision is invoked
- **Then** removing v3 packages + manifest entries + build deps via the documented mechanic restores the pre-v3 build to green
- **Test:** Manual — exercised at decision point if invoked.

---

## 19. Open Questions for Implementer

1. **Clerk SDK version pin.** What version is current "known-good" at start of sprint? Spike on day 1 of week 1, document the pin in `DECISIONS.md`.
2. **ConvexMobile version pin.** Same question, same process.
3. **Convex function name format.** The Mobile SDK uses dotted/colon function names like `"db/sessionMessages:list"` or `"db.sessionMessages.list"` — confirm during spike. The repository implementations above assume `"path/file:funcName"` based on Convex conventions; correct as needed.
4. **Sandbox state types vs domain types.** This plan assumes `*ScreenState` in `sandbox.mockproviders.*` are stable contracts that can be populated from real data. Confirm during week 2 — if sandbox state types embed UI-only fields that don't map cleanly from domain, decide between (a) extend domain types upward or (b) extract a fresh `*ScreenContract` interface that both mock and live-data adapters satisfy.
5. **Splash screen duration.** Auth-state resolution (token → JWT exchange) may take 200-1500 ms on cold start. Acceptable to render `SplashScreen` for that duration? Default yes; reconsider if it feels janky.
6. **OAuth provider scope.** RN supports Google + Apple. Is Apple sign-in required on Android (iOS-style)? Apple Sign-In on Android requires Web flow via Custom Tabs — confirm parity expectation. Default: include both.
7. **Saved-route delete UX.** RN uses 30-day soft-delete with undo toast. Confirm parity (toast undo within 5 seconds; permanent delete after 30 days server-side).
8. **PlanRideSheet defer.** Confirm `7.8` may slip without breaking parity gate, since RN has it.
9. **Min Mapbox tiles age for offline.** Default 14 days per Mapbox; confirm with product whether to expose to user or pin to a sane default.

---

## 20. References

- `.spec/research/v3-integration-discovery/01-react-native-business-logic.md`
- `.spec/research/v3-integration-discovery/02-native-current-state.md`
- `react-native/hooks/use-ride-flow.ts`
- `react-native/hooks/use-chat-planning.ts`
- `react-native/app/_layout.tsx`
- `android/app/src/main/java/com/laneshadow/MainActivity.kt`
- `android/app/src/main/java/com/laneshadow/LaneShadowApp.kt`
- `android/app/src/main/java/com/laneshadow/ui/templates/*Screen.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt`
- `android/app/build.gradle.kts`
- `android/app/src/main/AndroidManifest.xml`
- `brain/docs/mobile-architecture/android-principles.md`
- `RULES.md` (project governance)
- `MEMORY.md` user feedback entries: `feedback_keyboard_avoidance`, `feedback_subagent_fabrication`, `feedback_honest_verdicts`

---

**Status:** Architecture document complete. Ready to feed `technical-requirements.md` of the v3-integration PRD. No production code in this document — only specifications, package paths, file manifests, signatures, and test approaches.
