---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-27
prd_version: 1.0.0
---

# Roles

## Consumer Roles (Riders Using the App)

These are the end-user personas. V3 success is measured by how well their journeys complete on native iOS and Android. Drawn from React Native parity signals — V3 invents no new personas.

| Role | Description |
|------|-------------|
| **Carlos — The Weekend Scenic Rider (PRIMARY)** | Recreational motorcyclist, Saturday/Sunday morning rides (60–180 min). Wants to plan fresh scenic routes from current location, avoid highways/tolls, save favorites for repeat rides, and refine via conversation when the first plan misses ("more twisty", "shorter", "stop for coffee"). His core loop: open app → tap suggestion chip → 30s of planning → 3 options with weather → pick BEST → save. |
| **Aisha — The Returning Planner (SECONDARY)** | Touring rider planning a multi-day trip across state lines. Returns to the app over multiple sessions, reopens prior conversation threads to refine the same plan, downloads offline tiles for areas with patchy reception, expects light/dark theme to persist. Her journey: sign-in → see history list → tap an old session → continue planning → download offline regions for the trip. |
| **Marcus — The First-Time Installer (SECONDARY)** | New rider, just installed, first impression matters. Wants to sign in (Google/Apple OAuth or email) without confusion, plan their first ride without reading docs, understand what the app does within 60 seconds. His path: install → sign-in → land on Idle → tap suggestion → first plan completes. |
| **Power User (ASPIRATIONAL — must NOT over-build)** | Daily/weekly heavy user. Wants bulk-manage saved routes, fast switching between sessions, dark-mode default. RN has soft-delete + undo, search, filter for this persona. V3 includes these because they're cheap, but we don't add new power-user features beyond RN parity. |

## Build Roles (AI Agents Maintaining the Codebase)

V3 inherits V2's two-platform parallel agent model: Swift specialists implement and review iOS work; Kotlin specialists implement and review Android work; Convex specialists own backend additions. The product-manager remains the lead voice; ui-designer extends the V2 catalog when new molecules are needed.

| Agent Role | Responsibility |
|------------|----------------|
| `product-manager` | Lead role for this PRD, sprint definitions, scope decisions, acceptance criteria validation, cut-sequence enforcement at the week-2 checkpoint |
| `convex-planner` | Backend integration architecture: SDK choice, auth flow, API surface to wire, the 2 minor backend additions (`getCurrentUser`, optional `limit` on `sessionMessages.list`), type-generation pipeline |
| `convex-implementer` | The 2 backend additions, type-gen script, integration test harness against real Convex dev deployment |
| `convex-reviewer` | Backend addition review, validator correctness, query argument shape consistency with native types |
| `swift-planner` | iOS architecture: app shell, NavigationStack routing, `@Observable` stores, ConvexClient wrapper, Clerk integration, Mapbox offline manager, per-screen wiring plan |
| `swift-implementer` | iOS implementation: `RootView`, `AppEnvironment`, `RideFlow` reducer, `ChatStore`, `SessionStore`, all 9 new screens, V2-screen real-data wiring, integration tests against real Convex+Clerk dev |
| `swift-reviewer` | iOS code review: Swift 6 concurrency, Observation framework usage, memory management, subscription cancellation, snapshot test integrity |
| `kotlin-planner` | Android architecture: Compose app shell, Navigation Compose, Hilt DI graph, ViewModels with StateFlow, ConvexClient wrapper, Clerk integration with Custom Tabs fallback, Mapbox WorkManager downloads |
| `kotlin-implementer` | Android implementation: `MainActivity` + `LaneShadowApp`, ViewModels, repositories, all 9 new Composables (modulo cut authority), V2-screen real-data wiring, integration tests against real Convex+Clerk dev |
| `kotlin-reviewer` | Android code review: Compose patterns, coroutine safety, Hilt DI correctness, Compose UI test integrity, dropshots regression |
| `ui-designer` | Design specs for the 9 new screens; specifies which V2 atoms/molecules/organisms compose into each; introduces the 2 new molecules (`LSDownloadProgressBar`, `LSAuthProviderButton`) with full state matrix; coordinates with implementers via `/design` skill artifacts |

### Dispatch Priority

Per the project's `RULES.md` Local Domain Experts table: always prefer these specialist agents over generic `general-purpose` agents. Cross-platform tasks split into platform-specific iOS + Android pairs (see V2's pairing pattern under `tasks/sprint-NN-*/UC-*-ios.md` + `UC-*-android.md`).

The week-2 cut checkpoint is owned by `product-manager` (the orchestrator escalates the cut-recommendation to the user; the user confirms or overrides).
