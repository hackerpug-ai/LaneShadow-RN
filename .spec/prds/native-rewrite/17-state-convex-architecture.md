# State & Convex Architecture — Native Rewrite

**Document ID:** ARCH-STATE
**Status:** Draft
**Last Updated:** 2026-04-16

## Overview

This document defines the unified state management and Convex integration architecture for LaneShadow's native rewrite (Android Kotlin/Compose + iOS Swift/SwiftUI). The architecture prioritizes Convex cache-first data flow, minimizes local database complexity, and maintains structural parity between platforms.

### Core Principles

1. **Convex Cache First** — Use Convex real-time subscriptions as the primary data source
2. **Fallback to Local Store** — Only persist state that must survive offline/app-restart
3. **Minimize Local DB Complexity** — Don't duplicate Convex data in Room/SwiftData unless truly necessary
4. **Maintain Structural Parity** — Both platforms implement identical repository interfaces

### Data Flow Priority

```
Convex (cache/network) → Local In-Memory State → Device DB (only for offline-required data)
```

---

## Section 1: Data Tier Classification

For EVERY Convex table, classify which tier it lives in:

| Convex Table | Primary Tier | Local Persistence? | Reason |
|---|---|---|---|
| `users` | Convex only | No | Auth-managed via Clerk, always online when needed |
| `orgs` | Convex only | No | Org data is auth-scoped, not needed offline |
| `org_memberships` | Convex only | No | Membership data is auth-scoped, not needed offline |
| `saved_routes` | Convex primary | **YES — device DB** | User's saved routes must work offline for ride review |
| `favorite_roads` | Convex primary | Optional cache | Favorite roads are nice-to-have offline, can cache with TTL |
| `route_plans` | Convex primary | Optional cache | Planning is online-first, cache only for session recovery |
| `plan_usage` | Convex only | No | Rate limiting data is server-side only |
| `planning_sessions` | Convex primary | Optional cache | Session history for chat transcript, cache for review |
| `session_messages` | Convex primary | Optional cache | Chat messages, cache for transcript review |
| `performance` | Convex only | No | Debug/telemetry data, not needed in client |
| `osm_nodes` | Convex only | No | Server-side scenic waypoint data |
| `osm_ways` | Convex only | No | Server-side road segment data |
| `osm_import_jobs` | Convex only | No | Server-side ETL tracking |
| `trip_plans` | Convex only | No | Server-side trip plan records |
| `route_enrichments` | Convex primary | Optional cache | Weather/wind overlays, cache with short TTL (15min) |
| `waypoints` | Convex primary | Optional cache | Route waypoints, cache with route plan |
| `curated_routes` | Convex primary | **YES — device DB** | Route discovery must work offline, cache with TTL |
| `curated_route_enrichments` | Convex primary | No | Rich tier data, fetch on-demand when online |
| `route_feedback` | Convex primary | Yes (queue) | Feedback actions, queue for sync when online |
| `route_posts_raw` | Convex only | No | Server-side LLM extraction artifacts |
| `route_matches` | Convex only | No | Server-side audit log |
| `community_waypoint_mentions` | Convex only | No | Server-side waypoint extraction data |
| `curation_artifact_releases` | Convex only | No | Server-side artifact metadata |
| `curation_artifact_shards` | Convex only | No | Server-side shard metadata |

### Tier Definitions

| Tier | Description | Example |
|---|---|---|
| **Convex only** | Server-side only, never cached locally | Auth, rate limiting, ETL jobs |
| **Convex primary** | Real-time subscription, optional cache with TTL | Route plans, chat messages, weather overlays |
| **Convex primary + device DB** | Must work offline, full local sync | Saved routes, curated routes for discovery |

---

## Section 2: Unified Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     UI Layer (Views)                            │
│   Compose UI (Android) / SwiftUI Views (iOS)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ observes
┌────────────────────────────▼────────────────────────────────────┐
│                  ViewModel Layer                                │
│   ViewModel + StateFlow (Android)                               │
│   @Observable ViewModel (iOS)                                   │
│   - Holds UI state                                               │
│   - Exposes state as Flow/Publisher                              │
│   - Handles user actions                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ subscribes
┌────────────────────────────▼────────────────────────────────────┐
│                Repository Layer                                 │
│   Single source of truth per domain                             │
│   ┌─────────────────┐  ┌──────────────────┐                   │
│   │ Convex Repo      │  │ Local Repo        │                   │
│   │ (realtime)       │  │ (offline)         │                   │
│   │ - Subscribe      │  │ - Room/SwiftData  │                   │
│   │ - Mutation       │  │ - Key-value       │                   │
│   │ - Action         │  │ - File cache      │                   │
│   └────────┬─────────┘  └────────┬─────────┘                   │
└────────────┼─────────────────────┼──────────────────────────────┘
             │                     │
┌────────────▼─────────┐ ┌────────▼─────────┐
│ ConvexClient         │ │ Room/SwiftData   │
│ (WebSocket)          │ │ (local SQLite)   │
│ - Real-time sync     │ │ - Offline cache  │
│ - Auto-reconnect     │ │ - Crash recovery │
└──────────────────────┘ └──────────────────┘
```

### Data Flow Rules

1. **UI observes ViewModel** — Views never access repositories directly
2. **ViewModel subscribes to Repository** — ViewModels never access ConvexClient directly
3. **Repository abstracts data source** — Repositories decide Convex vs local
4. **Convex is primary** — Always try Convex first, fall back to local cache
5. **Local is offline fallback** — Only use local data when Convex is unreachable

---

## Section 3: Convex SDK Integration

### Android (Kotlin) — `dev.convex:android-convexmobile`

#### Singleton Setup

```kotlin
// di/ConvexModule.kt
@Module
@InstallIn(SingletonComponent::class)
object ConvexModule {
    
    @Provides
    @Singleton
    fun provideConvexClient(@ApplicationContext context: Context): ConvexClient {
        return ConvexClient(
            context = context,
            deploymentUrl = BuildConfig.CONVEX_DEPLOYMENT_URL
        )
    }
    
    @Provides
    @Singleton
    fun provideConvexClientWithAuth(
        client: ConvexClient,
        clerkAuthState: ClerkAuthState
    ): ConvexClientWithAuth {
        return ConvexClientWithAuth(
            client = client,
            fetchToken = { requireNotNull(clerkAuthState.getToken()) }
        )
    }
}
```

#### Subscription Pattern

```kotlin
// repository/SavedRoutesRepository.kt
class SavedRoutesRepositoryImpl(
    private val convex: ConvexClientWithAuth
) : SavedRoutesRepository {
    
    override fun observeSavedRoutes(): Flow<List<SavedRoute>> {
        return convex.subscribe<List<SavedRoute>>(
            functionName = "db.savedRoutes.getSavedRoutesList",
            args = mapOf("limit" to 50)
        ).map { result ->
            result.getOrElse { 
                emptyList() // Return empty on error, don't throw
            }
        }
    }
}
```

#### Mutation Pattern

```kotlin
override suspend fun saveRoute(input: SaveRouteInput): Result<String> = withContext(Dispatchers.IO) {
    try {
        val result = convex.mutation<SaveRouteResult>(
            functionName = "db.savedRoutes.saveRoute",
            args = mapOf(
                "name" to input.name,
                "planInput" to input.planInput,
                "routeSnapshot" to input.routeSnapshot
            )
        )
        Result.success(result.savedRouteId)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Action Pattern (AI Chat)

```kotlin
override suspend fun sendMessage(sessionId: String, content: String): Result<SendMessageResult> {
    return withContext(Dispatchers.IO) {
        try {
            val result = convex.action<SendMessageResult>(
                functionName = "actions.agent.sendMessage",
                args = mapOf(
                    "sessionId" to sessionId,
                    "content" to content
                )
            )
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### iOS (Swift) — `convex-swift` SPM Package

#### Singleton Setup

```swift
// Data/Remote/ConvexClient.swift
@Observable
class AppModel {
    var convex: ConvexClient
    var convexWithAuth: ConvexClientWithAuth?
    
    init() {
        self.convex = ConvexClient(
            deploymentUrl: Bundle.main.convexDeploymentUrl
        )
    }
    
    func configureAuth(clerkToken: @escaping () -> String?) {
        self.convexWithAuth = ConvexClientWithAuth(
            client: convex,
            fetchToken: { clerkToken() }
        )
    }
}
```

#### Subscription Pattern

```swift
// Data/Repository/SavedRoutesRepository.swift
actor SavedRoutesRepositoryImpl: SavedRoutesRepository {
    private let convex: ConvexClientWithAuth
    
    func observeSavedRoutes() -> AnyPublisher<[SavedRoute], Never> {
        convex.subscribe(
            to: "db.savedRoutes.getSavedRoutesList",
            with: ["limit": 50],
            yielding: [SavedRoute].self
        )
        .replaceError(with: [])
        .eraseToAnyPublisher()
    }
}
```

#### Mutation Pattern

```swift
func saveRoute(_ input: SaveRouteInput) async -> Result<String, Error> {
    do {
        let result: SaveRouteResult = try await convex.mutation(
            "db.savedRoutes.saveRoute",
            with: [
                "name": input.name,
                "planInput": input.planInput,
                "routeSnapshot": input.routeSnapshot
            ]
        )
        return .success(result.savedRouteId)
    } catch {
        return .failure(error)
    }
}
```

#### Action Pattern (AI Chat)

```swift
func sendMessage(sessionId: String, content: String) async -> Result<SendMessageResult, Error> {
    do {
        let result: SendMessageResult = try await convex.action(
            "actions.agent.sendMessage",
            with: [
                "sessionId": sessionId,
                "content": content
            ]
        )
        return .success(result)
    } catch {
        return .failure(error)
    }
}
```

---

## Section 4: Repository Pattern (Shared Interface)

Define the shared repository interface that BOTH platforms implement:

### 1. SavedRoutesRepository

```kotlin
// Android
interface SavedRoutesRepository {
    fun observeSavedRoutes(
        limit: Int? = null,
        searchQuery: String? = null
    ): Flow<List<SavedRoute>>
    
    suspend fun getSavedRouteDetail(id: String): Result<SavedRouteDetailView>
    
    suspend fun saveRoute(input: SaveRouteInput): Result<String>
    
    suspend fun renameRoute(id: String, name: String): Result<Unit>
    
    suspend fun softDeleteRoute(id: String): Result<Unit>
    
    suspend fun undoDeleteRoute(id: String): Result<Unit>
}
```

```swift
// iOS
protocol SavedRoutesRepository {
    func observeSavedRoutes(
        limit: Int?,
        searchQuery: String?
    ) -> AnyPublisher<[SavedRoute], Never>
    
    func getSavedRouteDetail(id: String) async -> Result<SavedRouteDetailView, Error>
    
    func saveRoute(_ input: SaveRouteInput) async -> Result<String, Error>
    
    func renameRoute(id: String, name: String) async -> Result<(), Error>
    
    func softDeleteRoute(id: String) async -> Result<(), Error>
    
    func undoDeleteRoute(id: String) async -> Result<(), Error>
}
```

### 2. RoutePlansRepository

```kotlin
// Android
interface RoutePlansRepository {
    fun observeActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>>
    
    suspend fun getPlanById(routePlanId: String): Result<RoutePlan>
    
    suspend fun cancelPlan(routePlanId: String): Result<Unit>
    
    // Local-only cache for session recovery
    suspend fun cacheRoutePlan(plan: RoutePlan)
    suspend fun getCachedRoutePlan(sessionId: String): RoutePlan?
}
```

```swift
// iOS
protocol RoutePlansRepository {
    func observeActiveRoutePlans(sessionId: String) -> AnyPublisher<[RoutePlan], Never>
    
    func getPlanById(routePlanId: String) async -> Result<RoutePlan, Error>
    
    func cancelPlan(routePlanId: String) async -> Result<(), Error>
    
    // Local-only cache for session recovery
    func cacheRoutePlan(_ plan: RoutePlan) async
    func getCachedRoutePlan(sessionId: String) async -> RoutePlan?
}
```

### 3. PlanningSessionsRepository

```kotlin
interface PlanningSessionsRepository {
    fun observeSessionMessages(sessionId: String): Flow<List<SessionMessage>>
    
    suspend fun createSession(): Result<CreateSessionResult>
    
    suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLon?
    ): Result<SendMessageResult>
}
```

```swift
protocol PlanningSessionsRepository {
    func observeSessionMessages(sessionId: String) -> AnyPublisher<[SessionMessage], Never>
    
    func createSession() async -> Result<CreateSessionResult, Error>
    
    func sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLon?
    ) async -> Result<SendMessageResult, Error>
}
```

### 4. CuratedRoutesRepository

```kotlin
interface CuratedRoutesRepository {
    // Convex subscription for real-time updates
    fun observeCuratedRoutes(bounds: MapBounds): Flow<List<CuratedRoute>>
    
    // Search with filters
    suspend fun searchCuratedRoutes(
        query: String?,
        state: String?,
        archetype: String?,
        limit: Int
    ): Result<List<CuratedRoute>>
    
    // Local cache for offline discovery
    suspend fun cacheCuratedRoutes(routes: List<CuratedRoute>)
    suspend fun getCachedCuratedRoutes(bounds: MapBounds): List<CuratedRoute>
}
```

```swift
protocol CuratedRoutesRepository {
    // Convex subscription for real-time updates
    func observeCuratedRoutes(bounds: MapBounds) -> AnyPublisher<[CuratedRoute], Never>
    
    // Search with filters
    func searchCuratedRoutes(
        query: String?,
        state: String?,
        archetype: String?,
        limit: Int
    ) async -> Result<[CuratedRoute], Error>
    
    // Local cache for offline discovery
    func cacheCuratedRoutes(_ routes: [CuratedRoute]) async
    func getCachedCuratedRoutes(bounds: MapBounds) async -> [CuratedRoute]
}
```

### 5. FavoriteRoadsRepository

```kotlin
interface FavoriteRoadsRepository {
    fun observeFavoriteRoads(): Flow<List<FavoriteRoad>>
    
    suspend fun addFavoriteRoad(road: FavoriteRoadInput): Result<String>
    
    suspend fun removeFavoriteRoad(id: String): Result<Unit>
}
```

```swift
protocol FavoriteRoadsRepository {
    func observeFavoriteRoads() -> AnyPublisher<[FavoriteRoad], Never>
    
    func addFavoriteRoad(_ road: FavoriteRoadInput) async -> Result<String, Error>
    
    func removeFavoriteRoad(id: String) async -> Result<(), Error>
}
```

### 6. RouteEnrichmentsRepository

```kotlin
interface RouteEnrichmentsRepository {
    // Short TTL cache (15 minutes)
    suspend fun getEnrichment(routePlanId: String): Result<RouteEnrichment>
    
    suspend fun cacheEnrichment(enrichment: RouteEnrichment)
    
    suspend fun invalidateEnrichment(routePlanId: String)
}
```

```swift
protocol RouteEnrichmentsRepository {
    // Short TTL cache (15 minutes)
    func getEnrichment(routePlanId: String) async -> Result<RouteEnrichment, Error>
    
    func cacheEnrichment(_ enrichment: RouteEnrichment) async
    
    func invalidateEnrichment(routePlanId: String) async
}
```

### 7. WaypointsRepository

```kotlin
interface WaypointsRepository {
    fun observeWaypoints(routePlanId: String): Flow<List<Waypoint>>
    
    suspend fun addWaypoint(waypoint: WaypointInput): Result<String>
    
    suspend fun updateWaypointStatus(
        waypointId: String,
        status: WaypointStatus
    ): Result<Unit>
}
```

```swift
protocol WaypointsRepository {
    func observeWaypoints(routePlanId: String) -> AnyPublisher<[Waypoint], Never>
    
    func addWaypoint(_ waypoint: WaypointInput) async -> Result<String, Error>
    
    func updateWaypointStatus(
        waypointId: String,
        status: WaypointStatus
    ) async -> Result<(), Error>
}
```

### 8. OfflineRegionsRepository (Local-Only)

```kotlin
interface OfflineRegionsRepository {
    fun observeOfflineRegions(): Flow<List<OfflineRegion>>
    
    suspend fun downloadRegion(bounds: MapBounds): Result<String>
    
    suspend fun deleteRegion(regionId: String): Result<Unit>
    
    suspend fun renameRegion(regionId: String, name: String): Result<Unit>
}
```

```swift
protocol OfflineRegionsRepository {
    func observeOfflineRegions() -> AnyPublisher<[OfflineRegion], Never>
    
    func downloadRegion(bounds: MapBounds) async -> Result<String, Error>
    
    func deleteRegion(regionId: String) async -> Result<(), Error>
    
    func renameRegion(regionId: String, name: String) async -> Result<(), Error>
}
```

### 9. UserPreferencesRepository (Local-Only)

```kotlin
interface UserPreferencesRepository {
    fun observePreferences(): Flow<UserPreferences>
    
    suspend fun updateTheme(theme: AppTheme): Result<Unit>
    
    suspend fun updateUnits(units: UnitSystem): Result<Unit>
    
    suspend fun updateScenicBias(bias: ScenicBias): Result<Unit>
}
```

```swift
protocol UserPreferencesRepository {
    func observePreferences() -> AnyPublisher<UserPreferences, Never>
    
    func updateTheme(_ theme: AppTheme) async -> Result<(), Error>
    
    func updateUnits(_ units: UnitSystem) async -> Result<(), Error>
    
    func updateScenicBias(_ bias: ScenicBias) async -> Result<(), Error>
}
```

### 10. ActiveRideRepository (Local-Only for Recording)

```kotlin
interface ActiveRideRepository {
    fun observeActiveRide(): Flow<ActiveRide?>
    
    suspend fun startRide(routePlanId: String): Result<String>
    
    suspend fun recordWaypoint(waypoint: RideWaypoint): Result<Unit>
    
    suspend fun stopRide(): Result<RideSummary>
    
    suspend fun crashRecovery(): ActiveRide?
}
```

```swift
protocol ActiveRideRepository {
    func observeActiveRide() -> AnyPublisher<ActiveRide?, Never>
    
    func startRide(routePlanId: String) async -> Result<String, Error>
    
    func recordWaypoint(_ waypoint: RideWaypoint) async -> Result<(), Error>
    
    func stopRide() async -> Result<RideSummary, Error>
    
    func crashRecovery() async -> ActiveRide?
}
```

---

## Section 5: State Machine Architecture

The ride flow state machine from `use-ride-flow.ts` needs a cross-platform definition:

### RideFlowPhase Enum

```kotlin
// Android
enum class RideFlowPhase {
    IDLE,
    DISCOVERING,
    PLANNING,
    ROUTE_RESULTS,
    ROUTE_DETAILS,
    SESSION_HISTORY,
    NAVIGATION_EXPORT,
    RECORDING,
    COMPLETED,
    ERROR
}
```

```swift
// iOS
enum RideFlowPhase: Equatable {
    case idle
    case discovering
    case planning
    case routeResults
    case routeDetails
    case sessionHistory
    case navigationExport
    case recording
    case completed
    case error(String)
}
```

### Android Implementation

```kotlin
// RideFlowViewModel.kt
@HiltViewModel
class RideFlowViewModel @Inject constructor(
    private val savedRoutesRepository: SavedRoutesRepository,
    private val activeRideRepository: ActiveRideRepository
) : ViewModel() {
    
    private val _state = MutableStateFlow<RideFlowState>(RideFlowState.Idle)
    val state: StateFlow<RideFlowState> = _state.asStateFlow()
    
    fun dispatch(action: RideFlowAction) {
        viewModelScope.launch {
            val newState = rideFlowReducer(_state.value, action)
            _state.value = newState
            persistState(newState)
        }
    }
    
    private suspend fun persistState(state: RideFlowState) {
        // Persist to Room for crash recovery
        when (state.phase) {
            RideFlowPhase.PLANNING -> {
                // Save session ID, route options
            }
            RideFlowPhase.RECORDING -> {
                // Save active ride state
            }
            else -> {
                // Clear persisted state
            }
        }
    }
}

sealed class RideFlowState {
    abstract val phase: RideFlowPhase
    abstract val sessionId: String?
    abstract val routeOptions: PlannedRouteOptionsView?
    abstract val selectedRouteId: String?
    
    data class Idle(
        override val sessionId: String? = null,
        override val routeOptions: PlannedRouteOptionsView? = null,
        override val selectedRouteId: String? = null
    ) : RideFlowState() {
        override val phase = RideFlowPhase.IDLE
    }
    
    data class Planning(
        override val sessionId: String,
        val planId: String? = null,
        val currentPhase: String,
        override val routeOptions: PlannedRouteOptionsView? = null,
        override val selectedRouteId: String? = null
    ) : RideFlowState() {
        override val phase = RideFlowPhase.PLANNING
    }
    
    data class Error(
        val errorMessage: String,
        override val sessionId: String? = null,
        val errorTimestamp: Long = System.currentTimeMillis()
    ) : RideFlowState() {
        override val phase = RideFlowPhase.ERROR
        override val routeOptions = null
        override val selectedRouteId = null
    }
    
    // ... other states
}
```

### iOS Implementation

```swift
// RideFlowViewModel.swift
@Observable
class RideFlowViewModel {
    var state: RideFlowState = .idle(
        sessionId: nil,
        routeOptions: nil,
        selectedRouteId: nil
    ) {
        didSet {
            Task {
                await persistState(state)
            }
        }
    }
    
    func dispatch(_ action: RideFlowAction) {
        state = rideFlowReducer(state, action)
    }
    
    private func persistState(_ state: RideFlowState) async {
        // Persist to SwiftData for crash recovery
        switch state {
        case .planning(let sessionId, _, _, _, _):
            // Save session ID, route options
            break
        case .recording:
            // Save active ride state
            break
        default:
            // Clear persisted state
            break
        }
    }
}

enum RideFlowState: Equatable {
    case idle(
        sessionId: String?,
        routeOptions: PlannedRouteOptionsView?,
        selectedRouteId: String?
    )
    case planning(
        sessionId: String,
        planId: String?,
        currentPhase: String,
        routeOptions: PlannedRouteOptionsView?,
        selectedRouteId: String?
    )
    case error(errorMessage: String, sessionId: String?)
    case routeResults(
        sessionId: String,
        routeOptions: PlannedRouteOptionsView,
        selectedRouteId: String?
    )
    case routeDetails(
        sessionId: String,
        routeOptions: PlannedRouteOptionsView,
        selectedRouteId: String
    )
    case sessionHistory(
        sessionId: String,
        routeOptions: PlannedRouteOptionsView,
        selectedRouteId: String?
    )
    case navigationExport(
        sessionId: String,
        routeOptions: PlannedRouteOptionsView,
        selectedRouteId: String
    )
    
    var phase: RideFlowPhase {
        switch self {
        case .idle: return .idle
        case .planning: return .planning
        case .error: return .error
        case .routeResults: return .routeResults
        case .routeDetails: return .routeDetails
        case .sessionHistory: return .sessionHistory
        case .navigationExport: return .navigationExport
        }
    }
}
```

### Persistence for Crash Recovery

Both platforms persist the current state machine state to device DB for crash recovery:

```kotlin
// Android - Room entity
@Entity(tableName = "ride_flow_state")
data class RideFlowStateEntity(
    @PrimaryKey val id: String = "current",
    val phase: String,
    val sessionId: String?,
    val serializedData: String // JSON blob for route options, etc.
)
```

```swift
// iOS - SwiftData model
@Model
final class RideFlowStateEntity {
    var id: String = "current"
    var phase: String
    var sessionId: String?
    var serializedData: Data // JSON blob for route options, etc.
}
```

---

## Section 6: Local DB Schema (Minimal)

Only define Room/SwiftData entities for data that MUST persist offline:

### 1. SavedRouteEntity

User's saved routes (offline access)

```kotlin
// Android - Room
@Entity(tableName = "saved_routes")
data class SavedRouteEntity(
    @PrimaryKey val id: String,
    val ownerType: String,
    val ownerId: String,
    val createdByUserId: String,
    val visibility: String,
    val name: String,
    val planInput: String, // JSON
    val routeSnapshot: String, // JSON
    val routeIndex: String, // JSON
    val snapshotMeta: String, // JSON
    val routeProvenance: String?, // JSON
    val createdAt: Long,
    val updatedAt: Long,
    val deletedAt: Long?,
    val scheduledDeletionId: String?,
    val lastSyncedAt: Long // For sync conflict resolution
)
```

```swift
// iOS - SwiftData
@Model
final class SavedRouteEntity {
    var id: String
    var ownerType: String
    var ownerId: String
    var createdByUserId: String
    var visibility: String
    var name: String
    var planInput: Data // JSON
    var routeSnapshot: Data // JSON
    var routeIndex: Data // JSON
    var snapshotMeta: Data // JSON
    var routeProvenance: Data? // JSON
    var createdAt: Date
    var updatedAt: Date
    var deletedAt: Date?
    var scheduledDeletionId: String?
    var lastSyncedAt: Date // For sync conflict resolution
}
```

### 2. CuratedRouteCacheEntity

Cached discovery results (TTL-based)

```kotlin
@Entity(tableName = "curated_routes_cache")
data class CuratedRouteCacheEntity(
    @PrimaryKey val routeId: String,
    val name: String,
    val state: String,
    val source: String,
    val primaryArchetype: String,
    val secondaryTags: String, // JSON array
    val centroidLat: Double,
    val centroidLng: Double,
    val boundsNeLat: Double,
    val boundsNeLng: Double,
    val boundsSwLat: Double,
    val boundsSwLng: Double,
    val lengthMiles: Double,
    val compositeScore: Double,
    val oneLiner: String,
    val summary: String,
    val badges: String, // JSON array
    val season: String,
    val cachedAt: Long,
    val ttlSeconds: Int = 86400 // 24 hours default
)
```

```swift
@Model
final class CuratedRouteCacheEntity {
    var routeId: String
    var name: String
    var state: String
    var source: String
    var primaryArchetype: String
    var secondaryTags: Data // JSON array
    var centroidLat: Double
    var centroidLng: Double
    var boundsNeLat: Double
    var boundsNeLng: Double
    var boundsSwLat: Double
    var boundsSwLng: Double
    var lengthMiles: Double
    var compositeScore: Double
    var oneLiner: String
    var summary: String
    var badges: Data // JSON array
    var season: String
    var cachedAt: Date
    var ttlSeconds: Int = 86400 // 24 hours default
}
```

### 3. ActiveRideEntity

Active ride recording state (crash recovery)

```kotlin
@Entity(tableName = "active_rides")
data class ActiveRideEntity(
    @PrimaryKey val rideId: String,
    val routePlanId: String,
    val sessionId: String,
    val startedAt: Long,
    val lastWaypointAt: Long?,
    val waypoints: String, // JSON array
    val isRecording: Boolean,
    val distanceMeters: Double,
    val durationSeconds: Long
)
```

```swift
@Model
final class ActiveRideEntity {
    var rideId: String
    var routePlanId: String
    var sessionId: String
    var startedAt: Date
    var lastWaypointAt: Date?
    var waypoints: Data // JSON array
    var isRecording: Bool
    var distanceMeters: Double
    var durationSeconds: TimeInterval
}
```

### 4. UserPreferencesEntity

Theme, units, preferences

```kotlin
@Entity(tableName = "user_preferences")
data class UserPreferencesEntity(
    @PrimaryKey val id: String = "current",
    val theme: String, // "light", "dark", "system"
    val units: String, // "imperial", "metric"
    val scenicBias: String, // "default", "high"
    val avoidHighways: Boolean,
    val avoidTolls: Boolean
)
```

```swift
@Model
final class UserPreferencesEntity {
    var id: String = "current"
    var theme: String // "light", "dark", "system"
    var units: String // "imperial", "metric"
    var scenicBias: String // "default", "high"
    var avoidHighways: Bool
    var avoidTolls: Bool
}
```

### 5. OfflineRegionEntity

Downloaded map regions

```kotlin
@Entity(tableName = "offline_regions")
data class OfflineRegionEntity(
    @PrimaryKey val regionId: String,
    val name: String,
    val bounds: String, // JSON
    val sizeBytes: Long,
    val downloadedAt: Long,
    val lastUsedAt: Long,
    val status: String // "pending", "downloading", "complete", "error"
)
```

```swift
@Model
final class OfflineRegionEntity {
    var regionId: String
    var name: String
    var bounds: Data // JSON
    var sizeBytes: Int64
    var downloadedAt: Date
    var lastUsedAt: Date
    var status: String // "pending", "downloading", "complete", "error"
}
```

---

## Section 7: Hook → ViewModel Migration Map

For each RN hook, show which ViewModel/Repository replaces it:

| RN Hook | Native Equivalent | Pattern |
|---|---|---|
| `useQuery(api.db.savedRoutes.getSavedRoutesList)` | `SavedRoutesRepository.observeSavedRoutes()` | Convex subscription → Flow/Publisher |
| `useMutation(api.db.savedRoutes.saveRoute)` | `SavedRoutesRepository.saveRoute()` | Suspend function with Result |
| `useAction(api.actions.agent.sendMessage)` | `PlanningSessionsRepository.sendMessage()` | Convex action via Repository |
| `useRideFlow()` | `RideFlowViewModel` (state machine) | Local state + Convex sync |
| `useChatPlanning()` | `PlanningSessionsRepository` + `RideFlowViewModel` | Repository for API, ViewModel for state |
| `useSavedRoutesList()` | `SavedRoutesRepository.observeSavedRoutes()` | Direct repository observation |
| `useSavedRouteDetail()` | `SavedRoutesRepository.getSavedRouteDetail()` | Repository suspend function |
| `useSaveRoute()` | `SavedRoutesRepository.saveRoute()` | Repository mutation |
| `useRenameRoute()` | `SavedRoutesRepository.renameRoute()` | Repository mutation |
| `useSoftDeleteRoute()` | `SavedRoutesRepository.softDeleteRoute()` | Repository mutation |
| `useRouteDiscovery()` | `CuratedRoutesRepository.observeCuratedRoutes()` | Convex subscription + local cache |
| `useRouteEnrichment()` | `RouteEnrichmentsRepository.getEnrichment()` | Repository with TTL cache |
| `useActiveSessionRoute()` | `RoutePlansRepository.getPlanById()` | Repository query |
| `usePlanRide()` | `RoutePlansRepository.createPlan()` | Repository mutation |
| `useIntentSearch()` | `CuratedRoutesRepository.searchCuratedRoutes()` | Repository search |
| `useVoiceAssistant()` | `ViewModel` + platform speech SDK | Platform-specific (no Convex) |
| `useToastMessages()` | `ViewModel` local state | Local-only state management |
| `useAsyncStorage()` | `DataStore<Preferences>` / `@AppStorage` | Local key-value storage |
| `useOfflineDownload()` | `OfflineRegionsRepository` | Local-only + Mapbox SDK |
| `useState()` | `remember + mutableStateOf` / `@State` | Local UI state |
| `useReducer()` | `ViewModel` + sealed class reducer | Local state machine |

---

## Section 8: Offline Strategy

### Features That Work Offline

| Feature | Offline Support | Data Source |
|---|---|---|
| **Saved routes view** | ✅ Full | Local DB (SavedRouteEntity) |
| **Route discovery** | ✅ Read-only | Local cache (CuratedRouteCacheEntity) |
| **Recorded ride data** | ✅ Full | Local DB (ActiveRideEntity) |
| **Settings/preferences** | ✅ Full | Local DB (UserPreferencesEntity) |
| **Offline map tiles** | ✅ Full | Mapbox SDK (OfflineRegionEntity) |
| **Ride review/comparison** | ✅ Full | Local DB + cache |

### Features That Require Online

| Feature | Online Requirement | Fallback |
|---|---|---|
| **Route planning** | ✅ Required | Show "offline" banner, disable planning |
| **Chat with AI** | ✅ Required | Show "offline" banner, disable chat input |
| **Weather overlays** | ✅ Required | Show cached data if < 15min old |
| **Save new route** | ✅ Required | Queue for sync when online |
| **Route enrichment** | ✅ Required | Show cached data if available |

### Convex Disconnection Handling

```kotlin
// Android - Connection state observer
class ConnectionStateObserver(
    private val convex: ConvexClient
) {
    val connectionState: StateFlow<ConnectionState> =
        convex.connectionState()
            .map { socketState ->
                when (socketState) {
                    is SocketState.Connected -> ConnectionState.Online
                    is SocketState.Disconnected -> ConnectionState.Offline
                    is SocketState.Connecting -> ConnectionState.Connecting
                }
            }
            .stateIn(
                scope = CoroutineScope(Dispatchers.Default),
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = ConnectionState.Connecting
            )
}

sealed class ConnectionState {
    object Online : ConnectionState()
    object Offline : ConnectionState()
    object Connecting : ConnectionState()
}
```

```swift
// iOS - Connection state observer
@Observable
class ConnectionStateObserver {
    private let convex: ConvexClient
    
    var connectionState: ConnectionState = .connecting {
        didSet {
            // Post notification for UI to observe
            NotificationCenter.default.post(
                name: .connectionStateDidChange,
                object: connectionState
            )
        }
    }
    
    init(convex: ConvexClient) {
        self.convex = convex
        observeConnectionState()
    }
    
    private func observeConnectionState() {
        // Observe Convex connection state
        // Update connectionState property
    }
}

enum ConnectionState: Equatable {
    case online
    case offline
    case connecting
}
```

### Sync Conflict Resolution

**Strategy: Convex Wins (Last-Write-Wins with Server Timestamps)**

1. **Client timestamps are ignored** — Server `_creationTime` and `_modifiedTime` are authoritative
2. **Offline writes are queued** — Mutations are queued and sent when connection restores
3. **Conflict detection** — If server version is newer, client update is rejected
4. **User notification** — Show toast: "Route updated on another device, refresh to see changes"

```kotlin
// Android - Sync queue
@Entity(tableName = "sync_queue")
data class SyncQueueItem(
    @PrimaryKey val id: String,
    val mutationName: String,
    val args: String, // JSON
    val createdAt: Long,
    val retryCount: Int = 0
)

class SyncQueueRepository(
    private val convex: ConvexClientWithAuth,
    private val db: AppDatabase
) {
    suspend fun enqueueMutation(mutationName: String, args: Map<String, Any?>) {
        val item = SyncQueueItem(
            id = UUID.randomUUID().toString(),
            mutationName = mutationName,
            args = Json.encodeToString(args),
            createdAt = System.currentTimeMillis()
        )
        db.syncQueueDao().insert(item)
    }
    
    suspend fun processQueue() {
        val items = db.syncQueueDao().getAllPending()
        for (item in items) {
            try {
                convex.mutation(
                    functionName = item.mutationName,
                    args = Json.decodeFromString<Map<String, Any?>>(item.args)
                )
                db.syncQueueDao().delete(item)
            } catch (e: Exception) {
                // Increment retry count, skip if too many failures
                db.syncQueueDao().update(item.copy(retryCount = item.retryCount + 1))
            }
        }
    }
}
```

### Cache TTL Management

| Data Type | TTL | Invalidation Strategy |
|---|---|---|
| Saved routes | Forever (sync on change) | Convex subscription updates |
| Curated routes | 24 hours | Background refresh when online |
| Route enrichments | 15 minutes | Time-based eviction |
| Weather overlays | 15 minutes | Time-based eviction |
| Chat messages | 7 days | LRU eviction after 7 days |
| Route plans | 24 hours | Session-scoped, clear on new session |

---

## Section 9: Platform-Specific Patterns

### Android: Coroutines + Flow

```kotlin
// Standard repository pattern
class SomeRepositoryImpl(
    private val convex: ConvexClientWithAuth,
    private val localDb: AppDatabase
) : SomeRepository {
    
    override fun observeData(): Flow<Data> {
        return convex.subscribe<Data>("api.db.data.get")
            .onEach { data ->
                // Cache to local DB on each update
                localDb.dataDao().insert(data)
            }
            .catch { error ->
                // Fall back to local cache on error
                emit(localDb.dataDao().getLatest())
            }
    }
    
    override suspend fun updateData(input: Input): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                convex.mutation(
                    functionName = "api.db.data.update",
                    args = mapOf("input" to input)
                )
                Result.success(Unit)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
}
```

### iOS: Combine + async/await

```swift
// Standard repository pattern
actor SomeRepositoryImpl: SomeRepository {
    private let convex: ConvexClientWithAuth
    private let localDb: LocalDatabase
    
    func observeData() -> AnyPublisher<Data, Never> {
        convex.subscribe(
            to: "api.db.data.get",
            with: [:],
            yielding: Data.self
        )
        .handleEvents(receiveOutput: { data in
            // Cache to local DB on each update
            Task {
                await localDb.insert(data)
            }
        })
        .catch { error in
            // Fall back to local cache on error
            await localDb.getLatest()
        }
        .eraseToAnyPublisher()
    }
    
    func updateData(_ input: Input) async -> Result<(), Error> {
        do {
            try await convex.mutation(
                "api.db.data.update",
                with: ["input": input]
            )
            return .success(())
        } catch {
            return .failure(error)
        }
    }
}
```

---

## Section 10: Testing Strategy

### Unit Tests

- **Repository tests**: Fake ConvexClient and LocalDatabase
- **ViewModel tests**: Fake repositories, verify state transitions
- **State machine tests**: Pure reducer function tests (no async)

### Integration Tests

- **Repository + Convex**: Use test deployment
- **Offline sync**: Simulate network loss, verify queue/flush
- **Crash recovery**: Kill process, verify state restoration

### Platform Tests

- **Android**: Instrumentation tests with Hilt test support
- **iOS**: XCTest with dependency injection fakes

---

## References

- Convex schema: `/convex/schema.ts`
- RN hooks: `/hooks/*.ts`
- Convex provider: `/providers/convex-provider.tsx`
- Technical requirements: `/.spec/prds/native-rewrite/06-technical-requirements.md`
- Ride flow UC: `/.spec/prds/native-rewrite/15-uc-ride-flow.md`
