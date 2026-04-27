---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-27
prd_version: 1.0.0
---

# LaneShadow Native Integration (V3)

## Product Description

LaneShadow V3 takes the V2 design system — six native Navigator screens (Idle, Planning, RouteResults, RouteDetails, Sessions, Error) running off mock providers in a sandbox harness — and **makes it a real app**. The same Mapbox map, the same Copper visual language, the same conversational planner UX — but powered by live Convex queries, real Clerk auth, real Mapbox offline regions, and real persistence across app launches.

V3 is the integration cycle V2 explicitly deferred. It is the moment the iOS + Android apps stop being "design system shells" and start being "the app a rider installs and uses." Feature parity with the React Native reference at `react-native/` is the bar — minus local LLM inference and voice input, both explicit non-goals.

## Problem Statement

### Per HUMAN SIGNAL #1, the user's verbatim framing

> 1) all the full views in sandbox mode are distorted, because they are not real implementations. Just doing the real feature in the app will fix it. 2) we only have a UI system, we need to wire all services into the app to make it real

Two problems compound:

1. **Sandbox distortion.** The V2 Navigator screens render correctly in isolation, but the mock providers shape data in fixture-friendly ways that diverge from the real Convex types. When a designer or product reviewer looks at IdleScreen with a fixture greeting, they see something that looks like the product. When they look at SessionsScreen with five fake sessions stacked perfectly, the UI looks great — but it's lying about the data. Until real Convex subscriptions land, every screen is a slightly-warped mirror of the real product.

2. **No app outside the sandbox.** Today the iOS app boots into a `ContentView` that subscribes to a `hello:get` test query. The Android app boots into a launcher activity with no app shell. Neither has auth, neither has navigation between screens, neither has any real data. The V2 work shipped a beautiful design system. V3 ships the actual app.

### What this implies for V3

- **Replace mock providers with real subscriptions** on every V2 screen so the data shapes are correct end-to-end.
- **Build the missing app surfaces** that V2 didn't cover (sign-in, settings, saved-routes list, offline regions, save sheets, plan-ride sheet).
- **Preserve the React Native app** as a reference (Sprint 7 RN retirement is deferred — the user explicitly chose to keep it for now).
- **Ship native iOS + Android together** with explicit cut authority on Android if cross-platform testing burdens scope.

## Solution Summary

V3 delivers six functional groups across 24 use cases, organized to map cleanly to V2's existing screen inventory:

### 1. Authentication & Session (AUTH — 4 UCs)

Clerk OAuth on both platforms (email/password + social) with the existing Convex `auth.config.ts` Clerk JWT integration. Sign-in/sign-up screens compose V2 atoms (LSCard + LSTextField + LSButton + new LSAuthProviderButton molecule). Tokens cached to Keychain (iOS) / EncryptedSharedPreferences (Android). Sign-out clears local state cleanly.

### 2. Conversational Planning Flow (CHAT — 6 UCs)

The core navigator loop wired end-to-end: tap a suggestion chip on IdleScreen → `createSession` mutation + `sendMessage` action → PlanningScreen subscribes to `session_messages` and `route_plans.getActiveRoutePlansForSession` → on completion routes to RouteResultsScreen with three real polylines from `route_plans.options[]` → tap a card → RouteDetailsScreen with route sheet driven by `route_enrichments`. Cancel button calls `cancelPlan`. Errors transition to ErrorScreen with recovery chips. Manual mode (PlanRideSheet) is in scope as a stretch — RN has it via `agent.planRide`.

The phase state machine (IDLE → PLANNING → ROUTE_RESULTS → ROUTE_DETAILS → SESSION_HISTORY → ERROR → NAVIGATION_EXPORT) ports the RN `useRideFlow` reducer 1:1 to a Swift `@Observable` and Kotlin `StateFlow`-backed reducer, with a pure `reduce()` function that's unit-testable on both sides.

### 3. Saved Routes CRUD (ROUTE — 4 UCs)

Save a planned route (immutable snapshot via `savedRoutes.saveRoute`), browse saved routes in a new list screen with search and date ordering, view detail (reuses RouteDetailsScreen template against a `saved_routes` snapshot), rename, soft-delete with 30-day undo window. Mirrors RN's `use-saved-routes` hooks exactly.

### 4. Sessions History (SESS — 3 UCs)

Existing V2 SessionsScreen drawer wired to `planningSessions.listSessions`. Tap a session to switch active session and route to its current phase screen. Camera position persists per session (UserDefaults / DataStore). New session button creates a fresh `planning_sessions` row.

### 5. Map & Offline (MAP — 3 UCs)

Real CoreLocation / FusedLocationProvider for current location. Mapbox offline region download with a new bounding-box selector screen. Background downloads via URLSession background config (iOS) / WorkManager + ForegroundService (Android). Resume on reconnect.

### 6. Settings & App Infrastructure (APP — 4 UCs)

Minimal Settings screen (theme picker, sign-out, account info — matches RN scope). Top-level auth-gating router. Global error boundary that catches uncaught exceptions and surfaces them through V2's `LSInlineErrorCallout` organism. Hamburger menu on `LSTopBar` with Home / Saved / Sessions / Offline / Settings entries.

### Architectural cornerstones

- **ConvexMobile Swift + Kotlin SDKs** (`https://github.com/get-convex/convex-mobile`) — official, reactive, JWT-aware. Pinned to specific tagged releases.
- **Clerk SDKs** (`clerk-ios` for iOS, `clerk-android` alpha for Android) — with Custom Tabs OAuth fallback on Android if the SDK proves immature in week 1.
- **Type generation script** at `server/scripts/generate-mobile-types.ts` emits Swift `Codable` and Kotlin `@Serializable` types from `_generated/api.d.ts`, eliminating drift.
- **Two backend additions only**: a thin `db.users.getCurrentUser` public query (verifies the Clerk webhook has provisioned the user row), and an optional `limit` arg on `db.sessionMessages.list` (avoid loading thousands of messages on long sessions). No schema changes.
- **Drawer-based information architecture** — no new tab bar organism. The hamburger menu on `LSTopBar` opens a side drawer (extending V2's `LSSessionsDrawer` pattern) with Home / Saved Routes / Sessions / Offline Regions / Settings entries. The map stays primary.
- **Two new molecules only**: `LSDownloadProgressBar` (offline region download UI) and `LSAuthProviderButton` (Apple/Google OAuth row with provider logo). No new atoms, no new tokens.

## Why iOS 17 + Android API 26 (Unchanged from V2)

- iOS 17 minimum aligns with the project's `IPHONEOS_DEPLOYMENT_TARGET: "17.0"` setting (`ios/project.yml`) and lets us use `@Observable`, the Observation framework, and modern `NavigationStack`.
- Android API 26 minimum is unchanged. Clerk Android and ConvexMobile Kotlin both support this floor.

## Why Preserving React Native (Sprint 7 Deferred)

The user explicitly chose to keep `react-native/` for reference during V3. The RN app is the parity target — implementers consult it when behavior is ambiguous (state machine transitions, optimistic UI reconciliation, error recovery copy). Once V3 ships and the user confirms parity, a follow-on initiative can run V2's deferred Sprint 7 RN retirement.

## Why No Local LLM, No Voice (Per HUMAN SIGNAL #3)

> no new functionality outside of what is visible in react native, ex: local llm not in scope, voice not in scope

Both are present in RN today. Both are explicitly excluded from V3. The Android `models/` package (33 files of MLX-related infrastructure) becomes dead weight that a v3.1 cleanup will sweep. iOS has no equivalent infrastructure to remove.

This non-goal is critical: every UC in this PRD traces back to an existing RN behavior. **No invention.** If a user-visible feature is not in `react-native/`, it is not in V3.

## Scope Boundary (Cut Authority Acknowledged)

> if cross platform testing is too burdensome then we might cut android

Per HUMAN SIGNAL #4, Android is the cuttable surface. V3's sprint plan inserts a **week-2 mechanical checkpoint**: if Android Convex client + Clerk auth aren't green by end of week 2, the team escalates to the user with a cut recommendation (drop Android tests → drop Android UI gap-fills → drop Android entirely). See [01-scope.md](./01-scope.md) Cut Order section.

The iOS path always ships. The cut decision affects Android only.
