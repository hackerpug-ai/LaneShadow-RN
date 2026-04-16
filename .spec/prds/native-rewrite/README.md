# Native Rewrite — PRD

Complete specification for rewriting LaneShadow's React Native app as native Kotlin/Compose (Android) and Swift/SwiftUI (iOS) apps. The Convex backend requires zero changes.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Appetite | 30-40 weeks (2 platform engineers) |
| Scope Level | Full native rewrite — delete React Native |
| Created | 2026-04-15 |
| Last Updated | 2026-04-16 |

## Repository Structure (End State)

```
LaneShadow/
├── android/           # Native Android (Kotlin + Jetpack Compose + Material3)
├── ios/               # Native iOS (Swift + SwiftUI)
├── react-native/      # Original React Native/Expo app (DELETED after Phase 3)
├── server/            # Convex backend (TypeScript) — shared, unchanged
├── tokens/            # Design token source (W3C DTCG JSON)
├── config/            # Style Dictionary build config
├── Makefile           # Cross-platform build commands
└── .spec/             # Project specifications
```

## Document Index

### Foundation

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and use case summary | FEATURE_SPEC |
| [04-uc-restructure.md](./04-uc-restructure.md) | UC-RESTR-01 through UC-RESTR-06 | FEATURE_SPEC |
| [05-team-contributions.md](./05-team-contributions.md) | Phase contributions | - |
| [06-technical-requirements.md](./06-technical-requirements.md) | SDK selections, architecture, state management, offline storage | CONSTITUTION |
| [07-native-app-backlog.md](./07-native-app-backlog.md) | Deferred route data display work | FEATURE_SPEC |
| [08-design-system.md](./08-design-system.md) | Cross-platform token architecture, Style Dictionary, atomic components | FEATURE_SPEC |

### Component Architecture (Atomic Design)

| File | Purpose | Lines |
|------|---------|-------|
| [08a-atomic-component-catalog.md](./08a-atomic-component-catalog.md) | RN component inventory + atomic classification (170 components) | 686 |
| [08b-android-component-map.md](./08b-android-component-map.md) | Android Compose architecture + composable signatures | 933 |
| [08c-ios-component-map.md](./08c-ios-component-map.md) | iOS SwiftUI architecture + View signatures | 946 |
| [08d-component-parity-spec.md](./08d-component-parity-spec.md) | Cross-platform parity guarantees + acceptance criteria | — |

### Core Use Cases (Native App)

| File | UCs | Domain | Description |
|------|-----|--------|-------------|
| [09-uc-navigation.md](./09-uc-navigation.md) | 8 | NAV | Turn-by-turn navigation, voice instructions, deviation detection |
| [10-uc-ride-recording.md](./10-uc-ride-recording.md) | 7 | REC | Ride recording, background tracking, curvature detection |
| [11-uc-offline.md](./11-uc-offline.md) | 9 | OFFL | Offline map region download, storage management |
| [12-uc-chat-planning.md](./12-uc-chat-planning.md) | 8 | CHAT | AI-powered route planning via natural language |
| [13-uc-voice-assistant.md](./13-uc-voice-assistant.md) | 8 | VOICE | Hands-free voice interaction for motorcycle riders |
| [14-uc-route-comparison.md](./14-uc-route-comparison.md) | 6 | COMP | Side-by-side route evaluation and selection |
| [15-uc-ride-flow.md](./15-uc-ride-flow.md) | 11 | FLOW | Full ride lifecycle state machine (discovery → completion) |
| [16-uc-gatekeeper.md](./16-uc-gatekeeper.md) | 8 | GATE | Trial counter, feature gating, subscription billing |

### State & Data Architecture

| File | Purpose | Stability |
|------|---------|-----------|
| [17-state-convex-architecture.md](./17-state-convex-architecture.md) | Convex cache-first data flow, repository pattern, local DB schema, offline strategy | CONSTITUTION |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 9 (RESTR, DESIGN, NAV, REC, OFFL, CHAT, VOICE, COMP, FLOW, GATE) |
| Use Cases | 73 (6 restructure + 5 design + 8 nav + 7 recording + 9 offline + 8 chat + 8 voice + 6 comparison + 11 ride flow + 8 gatekeeper) |
| Backend Changes | 0 (Convex is fully compatible) |
| Target Platforms | 2 (Android Kotlin/Compose, iOS Swift/SwiftUI) |

## Phased Delivery

| Phase | Weeks | Content |
|-------|-------|---------|
| 1 — Foundation | 8-10 | Auth, navigation, theme, Room/SwiftData, Convex SDK, Mapbox basic map |
| 2 — Discovery & Planning | 8-10 | Discovery feed, chat planning, route comparison, waypoints, saved routes |
| 3 — Core Value | 10-14 | Turn-by-turn navigation, ride recording, offline downloads, ride flow, voice |
| 4 — Platform Polish | 6-8 | Push notifications, deep linking, gatekeeper/billing, onboarding, permissions |
| 5 — Enhancements | Optional | Widgets, Watch/CarPlay, Spotlight, Live Activities |

**Do not delete React Native until Phase 3 is complete.**

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 2.0.0 | 2026-04-16 | Added 8 UC files (09-16), updated functional groups, phased delivery | Red-hat review found 60-70% missing coverage |
| 1.0.0 | 2026-04-15 | Initial PRD — repo restructure only | New initiative |
