# Native iOS & Android Current State Inventory

**Generated:** 2026-04-27
**Purpose:** Map what currently exists in native trees post-Sprint-6, identify gaps for real-data wiring.

---

## 1. iOS (`/ios/`)

### Project
- Bundle ID: `com.laneshadow.app`
- Min iOS: 16.0
- Build: Xcode (SPM + CocoaPods)
- Schemes: LaneShadow (main), LaneShadowTests, LaneShadowUITests

### Tree
```
ios/LaneShadow/
├── App.swift                           # @main entry, sandbox launch config
├── ContentView.swift                   # Root nav stack (calls ConvexStore.start())
├── ConvexStore.swift                   # MINIMAL Convex client — subscribes to hello:get test query only
├── Generated/
│   ├── ConvexConfig.generated.swift    # Deployment URL injection
│   └── MapboxConfig.generated.swift    # Mapbox token + style URLs
├── Launch/                             # Splash + launch onboarding
├── Views/
│   ├── Atoms/                          # 60 files
│   ├── Molecules/                      # 112 files
│   ├── Organisms/                      # 13 files
│   └── Templates/                      # 6 Navigator screens
├── Sandbox/
│   ├── Entry/, Stories/, MockProviders/, Controls/, Theme/
│   └── ConvexStore.swift               # Sandbox stub
└── Assets.xcassets, Info.plist
```

### Atoms (60 files)
LSText, LSButton, LSTextField, LSTextArea, LSAvatar, LSDivider, LSSpinner, LSIcon, LSCard, LSPanel, LSGlassPanel, LSBadge, LSBestBadge, LSPhaseDot, LSScrim, LSPill, LSCheckbox, LSSwitch, LSSlider, Progress, Collapsible, Toggle, LSMap (Mapbox UIViewRepresentable), RoutePolyline, DeviationPolyline

### Molecules (112 files)
LSNavHeader, AppHeader, MapHeaderOverlay, SectionHeader, LSListRow, LSContentCard, LSFormField, LSChatInput, KeyboardAvoidingInput, BottomSheetInput, LSTabItem, LSToolbar, ToggleGroup, LSModal, LSBottomSheet, LSToast, ErrorToast, InfoToast, Banner, EmptyState, DiscoveryFilterBar, DiscoverySortToggle, LocationSearchCard, IntentSearchSheet, LSWeatherBadge, LSWeatherTimeline, LSInstrumentReadout, RouteAttachmentCard, LSRouteAttachmentCard, StatRow, ChatTranscript, MarkdownText, etc.

### Organisms (13 files)
LSTopBar, LSNavBar, LSMapLayer, LSNavigatorMessage, LSRouteCard, LSRouteSheet, LSSessionsDrawer, LSSectionHeader, LSInlineErrorCallout

### Templates (6 Navigator Screens)
IdleScreen, PlanningScreen, RouteResultsScreen, RouteDetailsScreen, SessionsScreen, ErrorScreen — **all static**, render from MockProviders only

### Sandbox Stories (70+ files)
Atoms: AtomsStories, LSText/Button/Input/Display/Surface/Icon/Badge/Pill/PhaseDot/Scrim/Map Stories, ModifierStories, InfrastructureStories
Molecules: BottomSheet, ChatInput, ContentCard, EmptyState, FormField, ListRow, LocationContextBar, Modal, NavHeader, NavigatorMolecules, PillSemantics, RouteAttachmentCard, TabItem, Toast, Toolbar
Organisms: InlineErrorCallout, MapLayer, NavBar, NavigatorMessage, RouteCard, RouteSheet, SectionHeader, SessionsDrawer, TopBar
Templates: Idle, Planning, RouteDetails, RouteResults, Sessions, Error

### Mock Providers (6 screen-level)
IdleMockProvider, PlanningMockProvider, RouteResultsMockProvider, RouteDetailsMockProvider, SessionsMockProvider, ErrorMockProvider — fixture-bound structs in `NavigatorDomain.swift`, NOT Convex models

### Token Module: `tokens/platforms/swift/`
- `Sources/LaneShadowTheme/Generated/Tokens.swift` — auto-generated
- Theme.swift, ThemeEnvironment.swift, ThemeLoader.swift, DomainColors.swift, LaneShadowFontRegistry.swift

### Existing Services (Non-UI)
**ConvexStore.swift** — Placeholder only. Subscribes to `hello:get` test query. NO authentication, session queries, or route data wired.

### Mapbox
- SDK: Maps SDK for iOS (v6+) via CocoaPods
- LSMap = UIViewRepresentable wrapper
- Style URLs: Copper Paper Light + Dark
- Token via `Generated/MapboxConfig.generated.swift`

### Build
- CocoaPods/SPM hybrid
- Theme: SPM local path
- Mapbox: CocoaPods
- Native Sandbox: SPM
- Schemes: Debug (Sandbox), Release (Sandbox disabled)

---

## 2. Android (`/android/`)

### Project
- Application ID: `com.laneshadow.app`
- Min SDK: 26
- Target SDK: 34
- Compile SDK: 36
- Build: Gradle (Kotlin DSL)

### Tree
```
android/app/src/main/java/com/laneshadow/
├── MainActivity.kt
├── LaneShadowApp.kt                    # Application class (context, Mapbox setup)
├── DeploymentConfigParser.kt           # Env var parser
├── models/                             # 33 files (infrastructure)
│   ├── ModelDownloadManager.kt
│   ├── ModelManifestService.kt
│   ├── StorageUtils.kt
│   ├── AuthTokens.kt                   # Stub
│   ├── DownloadQueue.kt
│   ├── WifiValidator.kt
│   ├── WeatherOptimization.kt
│   ├── GatekeeperDownloadManager.kt
│   └── ChecksumValidator.kt + 24 more
├── ui/
│   ├── atoms/                          # ~60 files
│   ├── components/atoms/, molecules/
│   ├── molecules/                      # 40+ files
│   ├── organisms/                      # 13 files
│   ├── templates/                      # 6 Navigator screens
│   ├── util/
│   └── sandbox/
│       ├── host/, model/, navigation/, registry/
│       └── stories/AppStories.kt
└── sandbox/SandboxLaunchRequest.kt
```

### Composables Mirror iOS Structure
- Atoms: LSText, LSButton, LSTextField, LSAvatar, LSDivider, LSSpinner, LSIcon, LSCard, LSPanel, LSGlassPanel, LSBadge, LSPhaseDot, LSScrim, LSPill, LSMap (Mapbox MapComposable wrapper)
- Molecules: LSNavHeader, LSListRow, LSFormField, LSContentCard, LSChatInput, LSEmptyState, LSTabItem, LSToast, LSModal, LSBottomSheet, LSWeatherBadge, LSInstrumentReadout, LSPhaseIndicator, LSFilterChip, LSTagPill, LSPillSemantics
- Organisms: LSTopBar, LSNavBar, LSMapLayer, LSNavigatorMessage, LSRouteCard, LSRouteSheet, LSSessionsDrawer, LSSectionHeader, LSInlineErrorCallout
- Templates: IdleScreen, PlanningScreen, RouteResultsScreen, RouteDetailsScreen, SessionsScreen, ErrorScreen

### Sandbox: `AppStories.kt` aggregator (single file using native-sandbox `Story` DSL)

### Token Module: `tokens/platforms/kotlin/`
- LaneShadowColors.kt, LaneShadowTheme.kt, DomainColors.kt, ThemeLoader.kt, ThemeSchema.kt, Generated/Tokens.kt

### Mapbox
- SDK: 11.22.0 via Gradle
- MapComposable native (no AndroidView wrapper needed)
- Style URLs: Copper Paper Dark + Light
- Token via `secrets.xml` from `MAPBOX_ACCESS_TOKEN` env

### Existing Services (Non-UI)
33 model files including ModelDownloadManager, AuthTokens (stub), WifiValidator, etc. **NO Convex SDK integration**, NO authentication wiring, NO session management.

### Build (Kotlin DSL)
Compose BOM 2024.06.00, Material3, Mapbox 11.22.0, kotlinx.serialization 1.6.3, lifecycle-runtime-ktx 2.8.3, junit, robolectric, mockito, dropshots

---

## 3. Convex Backend (`/server/convex/`)

### Schema (22 tables)
- `users`, `orgs`, `org_memberships` — identity + multi-tenancy
- `saved_routes`, `favorite_roads` — user persistence
- `route_plans`, `plan_usage` — agent-generated routes + rate limiting
- `planning_sessions`, `session_messages` — conversational planning
- `performance` — monitoring
- `osm_nodes`, `osm_ways`, `osm_import_jobs` — OSM data + ETL
- `trip_plans` — no-tool LLM trip generation
- `route_enrichments` — async enrichment jobs (fingerprint dedup)
- `waypoints` — user route waypoints
- `curated_routes`, `curated_route_enrichments` — hand-curated motorcycle routes (vector search)
- `route_feedback` — user feedback on curated routes
- `route_posts_raw`, `route_matches`, `community_waypoint_mentions` — community data extraction
- `curation_artifact_releases`, `curation_artifact_shards` — release metadata

**Key indices:** `clerkUserId`, `status`, `createdAt`, `compositeScore`, vector index on `searchEmbedding` (1536 dims)

### Auth: `auth.config.ts`
- Provider: Clerk JWT (`CLERK_JWT_ISSUER_DOMAIN`)
- Application ID: `convex`
- **Configured but native apps are NOT integrated**

### HTTP Endpoints
- POST `/admin/curation/routes` — Batch upsert (Python pipeline, requires `CURATION_DEPLOY_KEY`)

### Actions
**Agent:**
- `agent/runAgent.ts`, `agent/planRide.ts`, `agent/sendMessage.ts`, `agent/generateTripPlan.ts`, `agent/sessionContext.ts`, `agent/loopDetector.ts`, `agent/budgetTracker.ts`, `agent/ridePlanningAgent.ts`

**Tools (10+):**
- findScenicWaypoints, getRouteWeather, enrichRoute, getElevation, getCurvature, lookupRoad, searchAlongRoute, webSearch, mapConditions, normalizeRoute, checkSurface, getUserFavorites, searchNearby

**Other:**
- mapData (Protomaps tile routing), osm (OSM import), monitoring, users, curation/intentExtraction

### Status
**Production-ready for agent-driven route planning. Native apps NOT yet wired to ANY Convex queries/mutations** (only minimal hello:get test on iOS).

---

## 4. Token Pipeline

### Swift Output: `tokens/platforms/swift/Sources/LaneShadowTheme/`
- Generated/Tokens.swift (auto-generated)
- Theme.swift (composite struct)
- ThemeEnvironment.swift (`@Environment(\.theme)` injection)
- DomainColors.swift (semantic aliases)
- LaneShadowFontRegistry.swift (Assets.xcassets fonts)

Usage:
```swift
@Environment(\.theme) private var theme
Text("Label").font(theme.type.label.md.font).foregroundStyle(theme.colors.onSurface.default)
```

### Kotlin Output: `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/`
- Tokens.kt (auto-generated)
- LaneShadowTheme.kt (Material3 wrapper)
- DomainColors.kt

Usage:
```kotlin
CompositionLocalProvider(LocalColors provides LaneShadowTheme.colors) { ... }
```

### TypeScript: `tokens/platforms/typescript/`
Likely exists for legacy RN reference, NOT consumed by native.

### Generation Pipeline: `tokens/scripts/`
- Parses YAML/JSON schema
- Outputs Swift, Kotlin, TS, Mapbox style JSON
- Functional and live

---

## 5. Gap Analysis (Critical Missing Layers)

### Authentication & Authorization
| Category | iOS | Android |
|----------|-----|---------|
| Clerk JWT integration | ❌ | ❌ |
| Sign-in screen | ❌ | ❌ |
| Sign-up screen | ❌ | ❌ |
| OAuth callback handling | ❌ | ❌ |
| Session persistence | ❌ | ❌ |

### Convex Client Integration
| Category | iOS | Android |
|----------|-----|---------|
| ConvexClient in app | ⚠️ Stub | ❌ None |
| Query subscriptions | ❌ | ❌ |
| Mutation handlers | ❌ | ❌ |
| Error handling | ❌ | ❌ |
| Offline cache | ❌ | ❌ |

### State Management & Navigation
| Category | iOS | Android |
|----------|-----|---------|
| AppState / ViewModel | ❌ | ❌ |
| Router / Deep Linking | ❌ | ❌ |
| Error boundary | ❌ | ❌ |
| Onboarding / Capability Checks | ❌ | ❌ |

### Real Data Binding (per screen)
| Feature | iOS | Android | Source |
|---------|-----|---------|--------|
| Planning Session | ❌ | ❌ | `planning_sessions` table |
| Route Plans | ❌ | ❌ | `route_plans` table |
| Session Messages | ❌ | ❌ | `session_messages` table |
| Saved Routes | ❌ | ❌ | `saved_routes` table |
| Route Enrichments | ❌ | ❌ | `route_enrichments` (async) |
| Curated Routes | ❌ | ❌ | `curated_routes` + vector |
| User Favorites | ❌ | ❌ | `favorite_roads` table |

### Offline & Local Storage
| Category | iOS | Android |
|----------|-----|---------|
| Offline map regions | ❌ | ❌ |
| Local route cache | ❌ | ❌ |
| Session persistence | ❌ | ❌ |
| Draft route saving | ❌ | ❌ |

### AI Model Management
| Category | iOS | Android |
|----------|-----|---------|
| Model manifest check | ❌ | ⚠️ Infra |
| Model download UI | ❌ | ❌ |
| Model storage | ❌ | ⚠️ Infra |
| AI inference | ❌ | ❌ |
| Voice input | ❌ | ❌ |

---

## 6. Existing Feature Parity (v2 Design System ONLY)

✅ **Sandbox Infrastructure** — Native-sandbox host, story registry, theme controller, argTypes controls, mock providers, snapshot testing (swift-snapshot-testing + dropshots), parity manifest validation

✅ **Atoms (60 each)** — All foundation primitives + Mapbox polyline integration with motion recipes

✅ **Molecules (112 iOS / 40+ Android)** — All composite patterns, LSChatInput state variants

✅ **Organisms (13 each)** — All Navigator domain compositions

✅ **Screens (6 each)** — Render from named mock providers with fixture variants, all motion recipes

✅ **Token System** — Swift + Kotlin token packages, semantic domain colors, theme env injection, Mapbox style URLs, design-owned icon catalog (no SF Symbols/Material Icons)

---

## 7. Missing UI Surfaces (Beyond v2 Six Screens)

These react-native screens have **NO native v2 equivalent**:
| Screen | RN file | iOS/Android Status |
|--------|---------|-------------------|
| Sign In | `app/(auth)/sign-in.tsx` | ❌ Missing |
| OAuth Callback | `app/(auth)/oauth-callback.tsx` | ❌ Missing |
| Tasks (auth) | `app/(auth)/tasks.tsx` | ❌ Missing |
| Settings | `app/(app)/(tabs)/settings.tsx` | ⚠️ Tab exists, no impl |
| Saved Routes List | `app/(app)/(tabs)/saved-routes.tsx` | ❌ Missing (Sessions ≠ saved-routes) |
| Saved Route Detail | `app/(app)/saved-route/[id].tsx` | ⚠️ RouteDetails screen exists but for active plan, not saved |
| Offline Regions List | `app/(app)/offline/regions-list.tsx` | ❌ Missing |
| Offline Region Selector | `app/(app)/offline/region-selector.tsx` | ❌ Missing |
| Model Setup | `screens/ModelSetupScreen.tsx` | ❌ Missing |
| Plan Ride Sheet (manual) | `components/sheets/plan-ride-sheet.tsx` | ❌ Missing |
| Save Favorite Sheet | `components/ui/save-favorite-sheet.tsx` | ❌ Missing |
| Dev Menu | `components/dev/DevMenu.tsx` | ❌ Missing |

---

## 8. Effort Estimate (Discovery Snapshot)

Per phases identified:
- **Phase A: Auth Layer** — 2-3 weeks (Clerk OAuth + sign-in/up + token storage + auth guard)
- **Phase B: Convex Integration** — 3-4 weeks (Client init + subscriptions + mutations + error handling)
- **Phase C: Real Data Binding** — 2-3 weeks (6 screens wired to live queries)
- **Phase D: State Management** — 1-2 weeks (ViewModel + Router + error boundary)
- **Phase E: Offline & Storage** — 2 weeks (UserDefaults/SharedPrefs + Core Data/Room + offline mode)
- **Phase F: Missing UI Surfaces** — 2-3 weeks (auth screens, saved routes list, settings, offline UI, model setup)
- **Phase G: AI Model Management** — 1-2 weeks (download UI + native bridge wiring) [DEFERABLE]
- **Phase H: Voice & Discovery** — 1 week each [DEFERABLE]

**Core parity total:** ~12-17 weeks across iOS+Android (parallelizable to ~6-9 weeks calendar with two-platform parallel agents).

---

## 9. Critical Path for Real-Data Wiring

1. **Auth (Week 1-2):** Clerk OAuth → sign-in/up → token storage
2. **Convex SDK (Week 3-4):** Client init → query/mutation handlers → error handling
3. **Data Binding (Week 5-6):** 6 screens wired
4. **State Management (Week 7):** ViewModel + Router + error boundaries
5. **Missing UI Surfaces (Week 7-8):** Saved routes list, settings, offline regions
6. **Offline & Storage (Week 9):** Cache + offline mode

This is a **6-9 week initiative** if parallelized aggressively, **12-17 weeks** if sequential.
