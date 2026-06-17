---
stability: CONSTITUTION
last_validated: 2026-04-16
prd_version: 2.0.0
---

# Technical Requirements

## System Components

| Component | Location | Role |
|-----------|----------|------|
| React Native App | `react-native/` | Existing Expo app — moved from root |
| Convex Backend | `convex/` | Backend functions and schema — moved from root |
| Android App | `android/` | Native Kotlin/Compose app (new) |
| iOS App | `ios/` | Native Swift/SwiftUI app (new) |
| Root Config | `./` | Makefile, .gitignore, CLAUDE.md, .husky |

## Directory Structure (End State)

```
LaneShadow/
├── android/                    # Native Android app (Kotlin/Compose)
│   ├── app/
│   │   ├── src/main/java/com/laneshadow/
│   │   │   ├── LaneShadowApp.kt
│   │   │   ├── MainActivity.kt
│   │   │   ├── di/                    # Hilt modules
│   │   │   ├── navigation/            # Screen sealed class, NavHost
│   │   │   ├── ui/
│   │   │   │   ├── theme/            # Color, Type, Theme
│   │   │   │   ├── components/       # Design system
│   │   │   │   │   ├── buttons/
│   │   │   │   │   ├── cards/
│   │   │   │   │   ├── chips/
│   │   │   │   │   ├── inputs/
│   │   │   │   │   ├── sheets/       # Bottom sheet system
│   │   │   │   │   ├── toasts/
│   │   │   │   │   └── skeleton/
│   │   │   │   └── screens/
│   │   │   │       ├── auth/
│   │   │   │       ├── map/
│   │   │   │       ├── routes/
│   │   │   │       ├── offline/
│   │   │   │       └── settings/
│   │   │   ├── data/
│   │   │   │   ├── local/            # Room database, DAOs
│   │   │   │   ├── remote/           # ConvexClient, ClerkBridge
│   │   │   │   └── repository/      # Offline-first repositories
│   │   │   └── domain/
│   │   │       ├── model/            # Route, Waypoint, Viewport
│   │   │       └── usecase/
│   │   └── build.gradle.kts
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── ios/                        # Native iOS app (Swift/SwiftUI)
│   └── LaneShadow/
│       ├── LaneShadowApp.swift
│       ├── Navigation/
│       ├── Views/
│       │   ├── Theme/
│       │   ├── Components/
│       │   └── Screens/
│       ├── ViewModels/
│       ├── Data/
│       │   ├── Local/              # SwiftData models
│       │   ├── Remote/             # ConvexClient, ClerkBridge
│       │   └── Repository/
│       └── Domain/
│           ├── Models/
│           └── UseCases/
├── react-native/               # Existing Expo/React Native app (moved from root)
│   ├── app/
│   ├── components/
│   ├── constants/
│   ├── convex/                 # (symlink or config pointing to convex/)
│   ├── hooks/
│   ├── providers/
│   ├── styles/
│   ├── utils/
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   └── .env.local
├── server/                     # Convex backend (moved from root)
│   ├── convex/
│   │   ├── _generated/
│   │   ├── lib/
│   │   ├── schema.ts
│   │   └── *.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local
├── .spec/
├── .husky/
├── .gitignore
├── CLAUDE.md
├── RULES.md
├── Makefile
└── README.md
```

---

## Backend Connectivity — Convex Native SDKs

Convex provides **official native client libraries** for both Android and iOS. No custom bridge is needed.

### Android (Kotlin) — `dev.convex:android-convexmobile`

- **Package**: `dev.convex:android-convexmobile:0.8.0@aar`
- **Source**: Built on official Convex Rust client, handles WebSocket reconnection automatically
- **Real-time subscriptions**: `ConvexClient.subscribe<T>("functionName")` returns a Kotlin `Flow<T>`
- **Mutations**: `convex.mutation<T>("functionName", args = mapOf(...))` — suspend function
- **Actions**: `convex.action<T>("functionName", args = mapOf(...))` — suspend function
- **Auth**: `ConvexClientWithAuth` supports Clerk via `clerk-convex-kotlin` library
- **Architecture**: Single `ConvexClient` instance for app lifetime, typically created in `Application` subclass
- **Testing**: `ConvexClient` is `open` class — can be mocked/faked in unit tests

```kotlin
// Example: Real-time subscription in Compose
var routes: List<Route> by remember { mutableStateOf(listOf()) }
LaunchedEffect("routes") {
    client.subscribe<List<Route>>("routes:list", args = mapOf("bbox" to bbox))
        .collect { result ->
            result.onSuccess { received -> routes = received }
        }
}
```

### iOS (Swift) — `convex-swift` SPM Package

- **Package URL**: `https://github.com/get-convex/convex-swift`
- **Source**: Built on official Convex Rust client, handles WebSocket reconnection automatically
- **Real-time subscriptions**: `convex.subscribe(to: "functionName", yielding: [T].self)` returns a Combine `Publisher`
- **Mutations**: `let result = try await convex.mutation("functionName", with: args)` — async
- **Actions**: `let result = try await convex.action("functionName", with: args)` — async
- **Auth**: `ConvexClientWithAuth` supports Clerk via `clerk-convex-swift` library
- **Architecture**: Single `ConvexClient` instance for app lifetime

```swift
// Example: Real-time subscription in SwiftUI
.task {
    let latestRoutes = convex.subscribe(to: "routes:list",
                                         with: ["bbox": bbox],
                                         yielding: [Route].self)
        .replaceError(with: [])
        .values
    for await routes in latestRoutes {
        self.routes = routes
    }
}
```

---

## Authentication — Clerk Native SDKs

Clerk provides **official native SDKs** for both Android and iOS with full Compose/SwiftUI integration.

### Android — `com.clerk:clerk-android-ui`

- **Packages**: `com.clerk:clerk-android-api` (core) + `com.clerk:clerk-android-ui` (Compose components)
- **Min SDK**: 24+, Java 17+
- **Init**: `Clerk.initialize(this, publishableKey = "pk_...")` in `Application.onCreate()`
- **Auth State**: `Clerk.userFlow` (StateFlow), `Clerk.isInitialized` (StateFlow)
- **Sign In**: `SignIn.create(SignIn.CreateParams.Strategy.Password(...))` — suspend
- **Sign Up**: `SignUp.create(...)`, `prepareVerification(...)`, `attemptVerification(...)` — suspend
- **Sign Out**: `Clerk.signOut()` — suspend
- **Prebuilt UI**: `SignInOrUpView()` composable, `AuthView`, `UserButton`
- **Custom Theming**: `ClerkTheme` for styling Clerk UI components
- **Google Sign-In**: Native support via Clerk Android SDK

### iOS — `ClerkKit` + `ClerkKitUI`

- **Package URL**: `https://github.com/clerk/clerk-ios`
- **Requires**: Associated Domains capability (`webcredentials:{FRONTEND_API_URL}`)
- **Init**: Configure in `@main` app file, inject `Clerk.shared` into SwiftUI environment
- **Auth State**: `clerk.user` observable via environment
- **Prebuilt UI**: `AuthView` (comprehensive sign-in/sign-up sheet), `UserButton` (profile management)
- **Sign Out**: Built into `UserButton` / `UserProfileView`

---

## Map Rendering — Mapbox Native SDKs

Both platforms use Mapbox Maps SDK for feature parity with current `@rnmapbox/maps` implementation.

### Android — Mapbox Maps SDK v11

- **Package**: `com.mapbox.maps:android:11.x`
- **Compose Integration**: Use `AndroidView` wrapper around `MapView` — Mapbox SDK uses Android View system
- **Custom Theming**: Mapbox Studio styles can be loaded at runtime via `Style_uri` or custom JSON. Supports:
  - Custom route line colors, widths, opacity matching app theme
  - Custom marker icons via `PointAnnotationOptions`
  - Dark/light map styles switchable at runtime
  - Clustering via `SymbolLayer` with `clusterProperties`
- **Key Consideration**: `AndroidView` wrapping means recomposition doesn't trigger map updates — use `update` block for imperative map changes

### iOS — Mapbox Maps SDK v11 (Mapbox iOS)

- **Package**: SPM or CocoaPods `MapboxMaps`
- **SwiftUI Integration**: Use `UIViewRepresentable` wrapper around `MapView`
- **Custom Theming**: Same Mapbox Studio style support as Android:
  - Runtime style changes via `mapboxMap.style.setStyleURI()` or custom style JSON
  - Custom line layer styling for route polylines
  - Custom marker annotations
  - Clustering support
- **Alternative: MapKit**: Apple's native `Map` view has first-class SwiftUI support but lacks Mapbox-specific features (custom route styling, advanced clustering, offline tiles). **Stick with Mapbox for feature parity.**

### Custom Theme Integration (Both Platforms)

Mapbox styles are JSON documents. To match the app's custom theme:

1. Create a base style in Mapbox Studio with LaneShadow's color palette
2. Reference style by URL or bundle a style JSON
3. At runtime, modify layer paint properties to match dynamic theme (dark/light):
   - Android: `style.addLayer(lineLayer { lineColor(theme.colors.routeLine) })`
   - iOS: `style.setLayerProperty(forLayerId:, property:, value:)`
4. Theme changes trigger style reload with updated colors

---

## Bottom Sheet System

### Android — Material3 `ModalBottomSheet` + `AnchoredDraggable`

For 18 sheet components, use a **sealed class hierarchy** with Material3's `ModalBottomSheet`:

- **Simple sheets**: Standard `ModalBottomSheet` with `SheetState` (collapsed/expanded)
- **Multi-snap sheets**: `AnchoredDraggable` for custom snap points (quarter, half, full)
- **Keyboard avoidance**: `WindowInsets.ime` observation + `sheetState.snapTo(Expanded)` when keyboard visible. Use `Modifier.imePadding()` in sheet content.
- **Nested navigation**: Scoped `NavHost` inside sheet content with separate `NavController`
- **Back button**: `BackHandler` dismisses sheet before popping navigation
- **Content scrolling**: `LazyColumn` with `NestedScrollConnection` for sheet gesture coordination

```kotlin
// Sheet management pattern
sealed class BottomSheetConfig {
    data class FilterOptions(...) : BottomSheetConfig()
    data class RouteDetails(val routeId: String) : BottomSheetConfig()
    // ... 16 more
}

@Composable
fun BottomSheetHost(currentSheet: BottomSheetConfig?) {
    if (currentSheet != null) {
        ModalBottomSheet(
            onDismissRequest = { /* dismiss */ },
            sheetState = rememberModalBottomSheetState()
        ) {
            when (currentSheet) {
                is BottomSheetConfig.FilterOptions -> FilterSheetContent(...)
                is BottomSheetConfig.RouteDetails -> RouteDetailSheetContent(...)
            }
        }
    }
}
```

### iOS — SwiftUI `.sheet` with `presentationDetents`

For 18 sheet components, use an **enum-based sheet router** with SwiftUI's native sheet API:

- **Snap points**: `.presentationDetents([.height(500), .medium(), .large()])` for dynamic sizing
- **Keyboard avoidance**: Custom `KeyboardAwareSheet` wrapper that observes `UIResponder.keyboardWillShowNotification` and switches to `.large` detent when keyboard appears
- **Nested navigation**: `NavigationStack` with `NavigationPath` inside sheet content
- **Interactive dismiss**: `.interactiveDismissDisabled()` for sheets requiring explicit close
- **Drag indicator**: `.presentationDragIndicator(.visible)` for grip handle
- **Advanced customization**: Fall back to `UISheetPresentationController` via `UIViewControllerRepresentable` for custom corner radius, shadow, grabber styling

```swift
// Sheet management pattern
enum AppSheet: Identifiable {
    case filters(FilterViewModel)
    case routeDetails(String)
    // ... 16 more

    var detents: Set<PresentationDetent> {
        switch self {
        case .filters: return [.height(500), .large]
        case .routeDetails: return [.medium, .large]
        }
    }

    @ViewBuilder var destination: some View {
        switch self {
        case .filters(let vm): FiltersSheet(viewModel: vm)
        case .routeDetails(let id): RouteDetailSheet(routeId: id)
        }
    }
}
```

---

## State Management

### Android — Google-Recommended UDF with ViewModel + StateFlow

Google's official recommendation (April 2026) is **Unidirectional Data Flow (UDF) with AAC ViewModel + StateFlow**:

- **ViewModel** at screen level only — handles business logic, exposes UI state
- **`StateFlow<UiState>`** — single source of truth per screen, collected via `collectAsStateWithLifecycle()`
- **Coroutines + Flows** for inter-layer communication
- **Hilt** for dependency injection
- **Repository pattern** — ViewModels never access data sources directly
- **Domain layer (use cases)** — recommended for large apps with shared business logic
- **Do NOT use ViewModels in reusable UI components** — use plain state holder classes instead

```kotlin
@HiltViewModel
class MapViewModel @Inject constructor(
    private val routeRepository: RouteRepository
) : ViewModel() {
    val uiState: StateFlow<MapUiState> = routeRepository
        .observeRoutes()
        .map { MapUiState.Content(routes = it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), MapUiState.Loading)
}
```

**Why not MVI?** MVI adds boilerplate (Intent sealed class, Reducer, etc.) without significant benefit for most screens. Google recommends UDF which is simpler. Use MVI-style event handling only for complex screens with many interactions.

### iOS — `@Observable` + `@Environment` (iOS 17+)

Apple's recommended pattern for SwiftUI apps targeting iOS 17+:

- **`@Observable` macro** on ViewModel classes — automatic observation, no `@Published` needed
- **`@Environment`** injection for shared dependencies (ConvexClient, auth state)
- **`@State`** for view-local state
- **Combine** only for bridging with `ConvexClient`'s Publisher-based subscriptions
- **No TCA (The Composable Architecture)** — adds significant complexity and learning curve. Apple's built-in `@Observable` handles the same use cases with less boilerplate for most apps.

```swift
@Observable
class MapViewModel {
    var routes: [Route] = []
    var selectedRoute: Route?

    private var cancellables = Set<AnyCancellable>()

    init(convex: ConvexClient) {
        convex.subscribe(to: "routes:list", yielding: [Route].self)
            .replaceError(with: [])
            .receive(on: DispatchQueue.main)
            .assign(to: &$routes)
    }
}
```

**Why not TCA?** For an app porting from React Native, `@Observable` provides the closest mental model to Zustand's simplicity. TCA's reducer-based architecture is powerful but adds 3-5x more boilerplate per feature. Reserve consideration only if the team has strong TCA experience.

---

## Offline Storage

### Android — Room

| Aspect | Detail |
|--------|--------|
| **Library** | `androidx.room:room-*:2.6.1` |
| **Entities** | Mirror Convex schema: RouteEntity, RoutePointEntity, WaypointEntity, OfflineRegionEntity, UserPreferencesEntity |
| **DAOs** | One per entity with Flow-based observation for reactivity |
| **Migrations** | Explicit migration classes required for schema changes |
| **Type converters** | Custom converters for JSON columns (lists, maps) |
| **Key-value** | `DataStore<Preferences>` for simple settings (replaces AsyncStorage) |
| **Secure storage** | `EncryptedSharedPreferences` for tokens (replaces expo-secure-store) |

### iOS — SwiftData (iOS 17+)

| Aspect | Detail |
|--------|--------|
| **Framework** | SwiftData (built-in, iOS 17+) |
| **Models** | `@Model` classes mirroring Convex schema |
| **Queries** | `@Query` property wrapper for reactive fetches |
| **Container** | `ModelContainer` configured at app launch |
| **Key-value** | `@AppStorage` for simple settings (replaces AsyncStorage) |
| **Secure storage** | Keychain via KeychainSwift (replaces expo-secure-store) |

---

## Dependency Summary

### Android Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| `androidx.compose.material3:material3` | 1.3.0+ | Material Design 3 UI |
| `androidx.navigation:navigation-compose` | 2.8.0+ | Screen navigation |
| `androidx.room:room-runtime` | 2.6.1 | Offline database |
| `com.google.dagger:hilt-android` | 2.50+ | Dependency injection |
| `dev.convex:android-convexmobile` | 0.8.0 | Convex backend client |
| `clerk-convex-kotlin` | latest | Clerk auth for Convex |
| `com.clerk:clerk-android-ui` | latest | Clerk auth UI components |
| `com.mapbox.maps:android` | 11.x | Mapbox maps |
| `androidx.work:work-runtime-ktx` | 2.9.0 | Background sync |
| `androidx.datastore:datastore-preferences` | 1.0.0 | Key-value storage |
| `org.jetbrains.kotlinx:kotlinx-serialization-json` | 1.6.3 | JSON parsing |
| `org.jetbrains.kotlinx:kotlinx-datetime` | 0.5.0 | Date/time |
| `androidx.security:security-crypto` | 1.1.0-alpha06 | Encrypted storage |

### iOS Dependencies (SPM)

| Package | Purpose |
|---------|---------|
| `convex-swift` (SPM) | Convex backend client |
| `clerk-convex-swift` (SPM) | Clerk auth for Convex |
| `clerk-ios` / `ClerkKit` + `ClerkKitUI` (SPM) | Clerk auth UI |
| `MapboxMaps` (SPM) | Mapbox maps |
| `KeychainSwift` (SPM) | Keychain wrapper |
| SwiftData (built-in, iOS 17) | Offline database |
| `@Observable` (built-in, iOS 17) | State management |

---

## Design Decision: Platform-Appropriate UI

**Android** uses Material Design 3 (Compose Material3).  
**iOS** uses native iOS design patterns (SwiftUI system components, SF Symbols, iOS sheet presentation).

The port goal of "visually exactly the same" means **functionally identical with platform-appropriate design** — not pixel-identical cross-platform. Each platform should feel native to its users while presenting the same features and data.

---

## Configuration Changes

| Config | Change |
|--------|--------|
| `npx convex dev` | Must run from `server/` directory |
| `npx expo start` | Must run from `react-native/` directory |
| Pre-commit hooks | Must `cd` into `react-native/` for typecheck/lint, `server/` for convex build |
| EAS Build | `eas.json` stays in `react-native/`, EAS project root = `react-native/` |
| Convex client URL | Unchanged — same deployment URL |
| Import paths | Unchanged within each subdirectory — only root-level references update |
