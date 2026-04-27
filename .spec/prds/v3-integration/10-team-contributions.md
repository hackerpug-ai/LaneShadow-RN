# Team Contributions

V3 PRD authored by a five-specialist team in parallel collaboration. Each specialist produced a focused architecture document referenced from `architecture/` and synthesized into this PRD by the product-manager lead.

## Phase 1: User Personas & Scope (product-manager — lead)

**Output**: `.spec/research/v3-integration-discovery/01-react-native-business-logic.md` consumed; PM analysis incorporated into `00-overview.md`, `01-scope.md`, `02-roles.md`, `03-functional-groups.md`, `04-uc-auth.md` through `09-uc-app.md`.

**Findings**:
- 4 rider personas drawn from RN parity signals (Carlos / Aisha / Marcus / Power user); no new personas invented
- 8 user journeys covering: first-install → first plan, returning-user resume, browse saved → re-plan, list management, sessions switch, offline region prep, settings, error recovery
- 6 functional groups (AUTH 4 / CHAT 6 / ROUTE 4 / SESS 3 / MAP 3 / APP 4) totaling 24 use cases — fits the 6-week appetite with margin for UC-splitting during sprint planning
- All 35 RN feature areas covered or explicitly deferred with rationale; no high-severity gaps
- Cut order in 3 layers; week-2 mechanical checkpoint on Android viability

**Contributors**: product-manager

---

## Phase 2: Backend Integration Architecture (convex-planner)

**Output**: Synthesized into `11-technical-requirements.md`; full document in chat history (~700 lines of Convex SDK choice, Clerk integration patterns, API surface inventory, reactivity patterns, error taxonomy, schema additions, risk register).

**Findings**:
- **SDK choice**: Official `convex-mobile` Swift + Kotlin from `https://github.com/get-convex/convex-mobile`; pin to specific tagged release (pre-1.0; semver-minor changes can break)
- **Auth**: Clerk SDKs (`clerk-ios`, `clerk-android`) preferred over rolling custom OAuth; Custom Tabs fallback documented for Android if SDK proves immature
- **Backend additions**: 2 minor — `db.users.getCurrentUser` public query (~30 LoC), optional `limit` arg on `db.sessionMessages.list` (+5 LoC); zero schema changes
- **Type generation**: `server/scripts/generate-mobile-types.ts` emits Swift Codable + Kotlin @Serializable from `_generated/api.d.ts`; non-optional even if Android is cut
- **API surface inventory**: 11 critical-path endpoints (sessions, messages, route plans, send-message action, current user) + 10 important (saved routes CRUD, plan init, enrichments, cancel) + nice-to-have (curated discovery, deferred)
- **Reactivity patterns**: 3 subscription tiers (long-lived screen, lazy per-row for attachments, one-shot imperative); cap simultaneous per-row subscriptions at 5
- **Error taxonomy**: 11 typed error codes from server, mapped to user-facing copy; `LaneShadowError` Swift enum + Kotlin sealed class mirror RN `lib/convex-error.ts` 1:1
- **Offline strategy**: ConvexMobile pre-1.0 has no persistent disk cache; treat app as online-required for V3
- **Risk inventory**: top concerns are Clerk Android SDK maturity, ConvexMobile reactivity completeness, optimistic UI reconciliation budget

**Contributors**: convex-planner

---

## Phase 3: iOS Architecture (swift-planner)

**Output**: `architecture/ios-architecture.md` (1567 lines); key decisions distilled in `11-technical-requirements.md`.

**Findings**:
- **iOS 17 minimum** (correction from V2 docs claiming iOS 16) — aligns with `ios/project.yml` `IPHONEOS_DEPLOYMENT_TARGET: "17.0"` and Swift 6.0; enables `@Observable`, Observation framework, modern `NavigationStack`
- **SPM-only**, no CocoaPods (V2 docs claim "hybrid" — stale; everything is SPM today)
- **Project generation via XcodeGen** from `project.yml`; lefthook enforces re-generation
- **App shell**: `RootView.swift` replaces `ContentView.swift`; auth-gate switches between `(auth)` and `(app)` flows; deep-link handling via `.onOpenURL`
- **State management**: `@Observable` AppEnvironment (Convex client + Clerk); `@Observable RideFlow` reducer; `@Observable ChatStore`, `SessionStore`, `SettingsStore`, `CameraStore`
- **Convex wrapper**: typed Swift wrappers in `Services/ConvexClient+LaneShadow.swift` exposing `subscribeToSessions() -> AsyncStream<[Session]>` and friends
- **Error handling**: `LaneShadowError` enum mapping `ConvexClientError.errorData["code"]` to typed cases
- **Persistence**: UserDefaults (theme, last-viewed session, camera per session); Keychain (Clerk handles); SwiftData NOT needed for V3
- **File-level handoff**: 6 new Swift files in `ios/LaneShadow/Services/` totaling ~700 LoC + ~800 LoC type-generated

**Contributors**: swift-planner

---

## Phase 4: Android Architecture (kotlin-planner)

**Output**: `architecture/android-architecture.md` (1682 lines); key decisions distilled in `11-technical-requirements.md`.

**Findings**:
- **Min SDK 26** unchanged; target/compile SDK 34/36 unchanged
- **Compose app shell** with `@HiltAndroidApp LaneShadowApp` + `@AndroidEntryPoint MainActivity` + Navigation Compose 2.8 with sealed `Route` interface (typed routes via `@Serializable` data classes)
- **DI**: Hilt + KSP scaffolding; `@HiltViewModel` per ViewModel; @Singleton for ConvexClient and AuthRepository
- **Auth**: `AuthRepository` interface with primary `ClerkAuthRepository` (alpha SDK) and `CustomTabsAuthRepository` fallback — single `@Binds` swap if week-1 SDK spike fails
- **State management**: ChatViewModel ports RN `useRideFlow` reducer 1:1 with sealed `RideFlowState` + `RideFlowAction` and pure `reduce()` function (unit-testable, mirrors RN reducer test)
- **Persistence**: DataStore Preferences (theme, onboarding, last-viewed session, camera); EncryptedSharedPreferences (tokens — Clerk handles)
- **Mapbox offline**: `MapboxOfflineRepository` wraps Mapbox 11.x `OfflineManager` + `TileStore`; WorkManager + ForegroundService (`dataSync` type for API 34) with `POST_NOTIFICATIONS` permission
- **Per-screen wiring**: thin `*Route.kt` composables wrap V2 templates and map domain types → existing `*ScreenState` mock-provider types so V2 screens and dropshots golden snapshots remain untouched
- **Cut sequence**: files isolated to specific packages enable mechanical revert; cut criteria evaluated end-of-week-3
- **Risk register**: 12 risks with mitigations including subagent fabrication risk per `MEMORY.md`

**Contributors**: kotlin-planner

---

## Phase 5: UI/UX Design for New Surfaces (ui-designer)

**Output**: `architecture/ui-design.md` (837 lines); key decisions distilled in `01-scope.md`, `09-uc-app.md`, and the use-case files for new screens.

**Findings**:
- **Drawer-based information architecture** — no new tab bar organism. Hamburger menu on V2 LSTopBar opens a side drawer (extending V2 LSSessionsDrawer pattern) with Home / Saved / Sessions / Offline / Settings entries. Map stays primary on all CHAT screens.
- **2 new molecules** (zero new atoms or tokens):
  - `LSDownloadProgressBar` (LSPill + Progress atom + LSText composition) — states: paused / downloading / complete / error
  - `LSAuthProviderButton` (LSButton with leading icon slot + provider logo) — variants: Apple, Google
- **9 new screens** all composed from V2 atoms/molecules/organisms: SignIn, SignUp, OAuthCallback, SavedRoutesList, SavedRouteDetail (RouteDetailsScreen variant), Settings, OfflineRegionsList, OfflineRegionSelector, SaveFavoriteSheet
- **PlanRideSheet stretch designation**: RN has manual mode but it's secondary; recommended stretch goal for week 4 if scope allows
- **Live data variants** annotated for V2 screens (no visual changes — just real provider wiring); loading / empty / error sub-states compose trivially from V2 LSEmptyState, LSSpinner, LSInlineErrorCallout
- **Design source authority**: V2 `concepts/designs.html` remains authoritative for the six Navigator screens; new surfaces extend the Copper palette (warm-paper topographic aesthetic) using existing tokens only

**Contributors**: ui-designer

---

## Synthesis (product-manager — lead)

After parallel specialist outputs landed, the product-manager:
1. Cross-validated each specialist's recommendations against HUMAN SIGNAL anchors (no contradictions found)
2. Reconciled the swift-planner's iOS 17 minimum claim with V2 documentation (V2 docs were stale; iOS 17 is correct per `project.yml`)
3. Confirmed cut order is consistent across all specialists (Android cuttable; iOS path always ships)
4. Confirmed the 24 UCs map cleanly to architecture: 6 V2 screens + 9 new + 2 new molecules + 0 new atoms/tokens + 11 critical Convex endpoints + 2 minor backend additions
5. Filed all specialist outputs into `architecture/` for downstream consumption by sprint planning, design specs, and implementer agents
