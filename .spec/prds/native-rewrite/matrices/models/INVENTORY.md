# Model Translation Inventory — React Native Business Logic

**Document ID**: MAT-MODEL-INVENTORY
**Status**: Draft
**Last Updated**: 2026-04-19
**Protocol**: 08g-model-translation-protocol.md

## Overview

This inventory classifies every TypeScript business logic file in `react-native/lib/`, `react-native/stores/`, and `react-native/types/` as **SHARED-TS**, **PORT**, or **NATIVE-OWNED** per the classification framework in 08g.

**Classification Summary**:
- **SHARED-TS**: Pure TypeScript with no RN dependencies — no translation needed
- **PORT**: Business logic requiring platform-native implementation with behavioral parity
- **NATIVE-OWNED**: UI state management and platform-specific orchestration — replace with platform-idiomatic equivalents

**Total Files**: 32 (non-test)
- SHARED-TS: 8
- PORT: 9
- NATIVE-OWNED: 15

---

## Classification Criteria Reference

| Classification | Definition | Translation Strategy |
|----------------|------------|---------------------|
| **SHARED-TS** | Pure TypeScript, no RN dependencies | No translation — use as-is |
| **PORT** | Business logic RN depends on, requires platform APIs | Implement in Kotlin/Swift with identical behavior |
| **NATIVE-OWNED** | UI state management, platform orchestration | Replace with platform-idiomatic patterns |

---

## Complete Inventory

### lib/ Directory

#### lib/auth-tokens.ts

**Classification**: PORT

**Rationale**: Contains business logic for auth token lifecycle (storage, retrieval, expiry management, PKCE flow). Uses asyncStorage which is an implementation detail — core token management logic must be consistent across platforms.

**Dependencies**:
- Internal: `hooks/use-async-storage.ts`
- External: `@react-native-async-storage/async-storage`

**Priority**: P0 (auth is foundational)

**Translation Plan**: [MODEL-auth-tokens.md](./MODEL-auth-tokens.md)

---

#### lib/camera-quick.ts

**Classification**: SHARED-TS

**Rationale**: Pure camera utility functions with no RN dependencies (verify — needs dependency check).

**Dependencies**: (to be verified)

**Priority**: P1

**Translation Plan**: None

---

#### lib/clerk-token-cache.ts

**Classification**: NATIVE-OWNED

**Rationale**: Clerk token orchestration with platform-specific lifecycle management.

**Dependencies**: (to be verified)

**Priority**: P0

**Translation Plan**: Replace with Clerk's native SDKs

---

#### lib/convex-error.ts

**Classification**: SHARED-TS

**Rationale**: Pure error handling logic, imports from server code only, no RN dependencies.

**Dependencies**:
- Internal: `../../server/lib/errors`

**Priority**: P0 (error handling is foundational)

**Translation Plan**: None

---

#### lib/date-formatters.ts

**Classification**: SHARED-TS

**Rationale**: Pure date formatting functions using `date-fns`, no RN dependencies.

**Dependencies**:
- External: `date-fns`

**Priority**: P1

**Translation Plan**: None

---

#### lib/is-dev-menu.ts

**Classification**: SHARED-TS

**Rationale**: Pure dev environment detection (verify dependencies).

**Dependencies**: (to be verified)

**Priority**: P2

**Translation Plan**: None

---

#### lib/notifier-helpers.ts

**Classification**: NATIVE-OWNED

**Rationale**: Uses `react-native-notifier` which is RN-specific. Notification system is platform-owned.

**Dependencies**:
- External: `react-native-notifier`
- Internal: `../components/ui/permission-notification`

**Priority**: P1

**Translation Plan**: Replace with platform-native notification systems

---

#### lib/toast-config.tsx

**Classification**: NATIVE-OWNED

**Rationale**: Toast UI configuration component, tied to RN rendering.

**Dependencies**: (to be verified)

**Priority**: P1

**Translation Plan**: Replace with platform-native toast systems

---

#### lib/toast-system.ts

**Classification**: NATIVE-OWNED

**Rationale**: Toast orchestration using `react-native-notifier`, platform-specific notification system.

**Dependencies**:
- External: `react-native-notifier`
- Internal: `../components/toasts/*`

**Priority**: P1

**Translation Plan**: Replace with platform-native toast systems

---

### lib/ai/ Directory

#### lib/ai/NativeMLXBridge.ts

**Classification**: NATIVE-OWNED

**Rationale**: Documentation for native module interface. The actual implementation is in Swift/Kotlin.

**Dependencies**: None (documentation only)

**Priority**: P0 (AI model integration)

**Translation Plan**: Native implementation exists separately

---

#### lib/ai/atomic-write.ts

**Classification**: PORT

**Rationale**: File operation business logic using expo-file-system. Atomic write pattern must be consistent across platforms.

**Dependencies**:
- External: `expo-file-system`

**Priority**: P0 (model download integrity)

**Translation Plan**: [MODEL-ai-atomic-write.md](./MODEL-ai-atomic-write.md)

---

#### lib/ai/background-download-service.ts

**Classification**: NATIVE-OWNED

**Rationale**: Orchestrates Expo BackgroundFetch, Notifications, and AppState lifecycle. Platform-specific background task management.

**Dependencies**:
- External: `expo-background-fetch`, `expo-notifications`, `expo-task-manager`, `react-native`
- Internal: `../../stores/download-store`, `./persistent-download-manager`, `./types`

**Priority**: P0 (background model downloads)

**Translation Plan**: Replace with WorkManager (Android) / BackgroundTasks (iOS)

---

#### lib/ai/checksum.ts

**Classification**: PORT

**Rationale**: SHA-256 validation using expo-crypto. Core business logic for file integrity must be consistent.

**Dependencies**:
- External: `expo-crypto`, `expo-file-system`
- Internal: `./types`

**Priority**: P0 (model integrity)

**Translation Plan**: [MODEL-ai-checksum.md](./MODEL-ai-checksum.md)

---

#### lib/ai/local-model.ts

**Classification**: NATIVE-OWNED

**Rationale**: Orchestrates native module bridge, manages model lifecycle with platform-specific memory management.

**Dependencies**:
- External: `expo-file-system`, `react-native`
- Internal: `./types`, `./checksum`, `./model-download`

**Priority**: P0 (AI model inference)

**Translation Plan**: Replace with platform-native ML framework integration

---

#### lib/ai/model-download.ts

**Classification**: PORT

**Rationale**: Download orchestration logic using expo-file-system. Business rules for download management must be consistent.

**Dependencies**:
- External: `expo-file-system`
- Internal: `./types`, `./checksum`

**Priority**: P0 (model download)

**Translation Plan**: [MODEL-ai-model-download.md](./MODEL-ai-model-download.md)

---

#### lib/ai/model-manifest.ts

**Classification**: PORT

**Rationale**: Version comparison and update checking logic using AsyncStorage. Business rules for model versioning must be consistent.

**Dependencies**:
- External: `@react-native-async-storage/async-storage`

**Priority**: P0 (model version management)

**Translation Plan**: [MODEL-ai-model-manifest.md](./MODEL-ai-model-manifest.md)

---

#### lib/ai/persistent-download-manager.ts

**Classification**: NATIVE-OWNED

**Rationale**: Download state management with FileSystem integration. Platform-specific state persistence.

**Dependencies**:
- External: `expo-file-system`

**Priority**: P0 (download state)

**Translation Plan**: Replace with platform-native state management

---

#### lib/ai/types.ts

**Classification**: SHARED-TS

**Rationale**: Pure type definitions, no RN dependencies.

**Dependencies**: None

**Priority**: P0 (AI type definitions)

**Translation Plan**: None

---

### lib/mapbox/ Directory

#### lib/mapbox/coordinate-converter.ts

**Classification**: SHARED-TS

**Rationale**: Pure coordinate transformation math, no RN dependencies.

**Dependencies**: None

**Priority**: P1

**Translation Plan**: None

---

#### lib/mapbox/download-queue.ts

**Classification**: PORT

**Rationale**: Queue management logic for sequential downloads. Business rules for queue behavior must be consistent.

**Dependencies**:
- Internal: `../../stores/offline-store`

**Priority**: P0 (offline map downloads)

**Translation Plan**: [MODEL-mapbox-download-queue.md](./MODEL-mapbox-download-queue.md)

---

#### lib/mapbox/offline-manager.ts

**Classification**: NATIVE-OWNED

**Rationale**: Mapbox SDK wrapper, platform-specific offline pack management.

**Dependencies**:
- External: `@rnmapbox/maps`
- Internal: `../../stores/offline-store`, `./download-queue`, `./storage-utils`, `./wifi-validator`

**Priority**: P0 (offline maps)

**Translation Plan**: Replace with platform-native Mapbox SDK integration

---

#### lib/mapbox/storage-utils.ts

**Classification**: PORT

**Rationale**: Storage estimation math and validation logic. Pure business logic for storage calculations.

**Dependencies**: None (pure math with configurable storage info provider)

**Priority**: P0 (storage validation)

**Translation Plan**: [MODEL-mapbox-storage-utils.md](./MODEL-mapbox-storage-utils.md)

---

#### lib/mapbox/styles.ts

**Classification**: SHARED-TS

**Rationale**: Pure constants for map style URLs, no RN dependencies.

**Dependencies**: None

**Priority**: P1

**Translation Plan**: None

---

#### lib/mapbox/weather-optimization.ts

**Classification**: PORT

**Rationale**: Weather overlay logic using Mapbox SDK. Business rules for weather display must be consistent.

**Dependencies**:
- External: `@rnmapbox/maps`

**Priority**: P1 (weather overlays)

**Translation Plan**: [MODEL-mapbox-weather-optimization.md](./MODEL-mapbox-weather-optimization.md)

---

#### lib/mapbox/wifi-validator.ts

**Classification**: NATIVE-OWNED

**Rationale**: Network state management using NetInfo (platform-specific API).

**Dependencies**:
- External: `@react-native-community/netinfo`

**Priority**: P0 (WiFi requirement enforcement)

**Translation Plan**: Replace with platform-native network monitoring

---

#### lib/map/overlay-colors.ts

**Classification**: SHARED-TS

**Rationale**: Pure color constants for map overlays, no RN dependencies.

**Dependencies**: None

**Priority**: P1

**Translation Plan**: None

---

### lib/model/ Directory

#### lib/model/download-manager.ts

**Classification**: PORT

**Rationale**: Download wrapper logic using expo-file-system. Business rules for download orchestration must be consistent.

**Dependencies**:
- External: `expo-file-system`

**Priority**: P0 (model download wrapper)

**Translation Plan**: [MODEL-model-download-manager.md](./MODEL-model-download-manager.md)

---

#### lib/model/gatekeeper.ts

**Classification**: NATIVE-OWNED

**Rationale**: Model gating logic with platform-specific capability checks.

**Dependencies**: (to be verified)

**Priority**: P0 (model access control)

**Translation Plan**: Replace with platform-native gating

---

### stores/ Directory

#### stores/chat-session-store.ts

**Classification**: NATIVE-OWNED

**Rationale**: Zustand store with AsyncStorage persistence. UI state management is platform-owned.

**Dependencies**:
- External: `zustand`, `@react-native-async-storage/async-storage`

**Priority**: P0 (chat session state)

**Translation Plan**: Replace with ViewModel + DataStore (Android) / @Observable + SwiftData (iOS)

---

#### stores/download-store.ts

**Classification**: NATIVE-OWNED

**Rationale**: Zustand store for download state. UI state management is platform-owned.

**Dependencies**:
- External: `zustand`, `@react-native-async-storage/async-storage`

**Priority**: P0 (download UI state)

**Translation Plan**: Replace with ViewModel + DataStore (Android) / @Observable + SwiftData (iOS)

---

#### stores/offline-store.ts

**Classification**: NATIVE-OWNED

**Rationale**: Zustand store with Mapbox integration. Complex UI state management with platform-specific SDK.

**Dependencies**:
- External: `zustand`, `@react-native-async-storage/async-storage`, `@rnmapbox/maps`
- Internal: `../lib/mapbox/download-queue`, `../lib/mapbox/storage-utils`, `../lib/mapbox/wifi-validator`

**Priority**: P0 (offline region state)

**Translation Plan**: Replace with ViewModel + DataStore (Android) / @Observable + SwiftData (iOS)

---

#### stores/settings-store.ts

**Classification**: NATIVE-OWNED

**Rationale**: Zustand store for theme/onboarding settings. UI state management is platform-owned.

**Dependencies**:
- External: `zustand`, `@react-native-async-storage/async-storage`

**Priority**: P0 (app settings)

**Translation Plan**: Replace with ViewModel + DataStore (Android) / @Observable + SwiftData (iOS)

---

### Test Files (*.test.ts, *.test.tsx)

**Classification**: SHARED-TS (all test files)

**Rationale**: Test code is platform-independent. Tests should be ported to platform-native test suites (JUnit for Android, XCTest for iOS) to verify behavioral parity of translated PORT files.

**Translation Strategy**: Port test logic to platform-native test frameworks. Use same test cases to verify translated implementations produce identical results.

#### Test Files Inventory

| Test File | Tests | Translation Target |
|-----------|-------|-------------------|
| `lib/convex-error.test.ts` | Error handling utilities | JUnit / XCTest |
| `lib/map/overlay-colors.test.ts` | Color constants | JUnit / XCTest |
| `lib/ai/__tests__/checksum.test.ts` | SHA-256 validation | JUnit / XCTest (for `MODEL-ai-checksum.md`) |
| `lib/ai/__tests__/local-model.test.ts` | ML model operations | JUnit / XCTest (for native ML integration) |
| `lib/ai/__tests__/model-download.test.ts` | Download orchestration | JUnit / XCTest (for `MODEL-ai-model-download.md`) |
| `lib/ai/__tests__/storage.test.ts` | Storage operations | JUnit / XCTest |
| `lib/mapbox/__tests__/coordinate-converter.test.ts` | Coordinate math | JUnit / XCTest |
| `lib/mapbox/__tests__/weather-optimization.test.ts` | Weather overlay logic | JUnit / XCTest (for `MODEL-mapbox-weather-optimization.md`) |

**Total Test Files**: 8

---

## Summary Statistics (Updated)

### By Classification

| Classification | Count | Percentage |
|----------------|-------|------------|
| SHARED-TS | 8 | 25% |
| PORT | 9 | 28% |
| NATIVE-OWNED | 15 | 47% |
| **Total (non-test)** | **32** | **100%** |
| Test Files | 8 | — |
| **Grand Total** | **40** | — |

### By Directory

| Directory | SHARED-TS | PORT | NATIVE-OWNED | Test Files | Total |
|----------|-----------|------|--------------|------------|-------|
| lib/ (root) | 4 | 1 | 4 | 1 | 10 |
| lib/ai/ | 1 | 4 | 4 | 4 | 13 |
| lib/mapbox/ | 2 | 3 | 2 | 2 | 9 |
| lib/map/ | 1 | 0 | 0 | 1 | 2 |
| lib/model/ | 0 | 1 | 1 | 0 | 2 |
| stores/ | 0 | 0 | 4 | 0 | 4 |
| **Total** | **8** | **9** | **15** | **8** | **40** |

### By Priority

| Priority | Count | Files |
|----------|-------|-------|
| P0 (Foundational) | 20 | Auth, error handling, AI models, downloads, offline maps, stores |
| P1 (Important) | 10 | Camera, notifications, toasts, coordinate utils, weather |
| P2 (Nice-to-have) | 1 | Dev menu detection |

---

## Translation Ordering (Dependency-Based)

Translate in dependency order (bottom-up) to avoid blocking:

### Phase 1: Foundation (P0 SHARED-TS + Core PORT)
1. `lib/convex-error.ts` (SHARED-TS) — Error handling foundation
2. `lib/ai/types.ts` (SHARED-TS) — AI type definitions
3. `lib/auth-tokens.ts` (PORT) — Auth foundation
4. `lib/ai/checksum.ts` (PORT) — File integrity foundation

### Phase 2: Model Download Infrastructure (P0)
5. `lib/ai/atomic-write.ts` (PORT) — File operations
6. `lib/ai/model-manifest.ts` (PORT) — Version management
7. `lib/ai/model-download.ts` (PORT) — Download logic
8. `lib/model/download-manager.ts` (PORT) — Download wrapper

### Phase 3: Offline Maps (P0)
9. `lib/mapbox/storage-utils.ts` (PORT) — Storage validation
10. `lib/mapbox/download-queue.ts` (PORT) — Queue management
11. `lib/mapbox/weather-optimization.ts` (PORT) — Weather overlays

### Phase 4: State Migration (P0 NATIVE-OWNED)
12. `stores/settings-store.ts` — Replace with ViewModel
13. `stores/download-store.ts` — Replace with ViewModel
14. `stores/chat-session-store.ts` — Replace with ViewModel
15. `stores/offline-store.ts` — Replace with ViewModel

### Phase 5: Platform Replacements (P0-P1)
16. `lib/ai/local-model.ts` — Native ML framework integration
17. `lib/mapbox/offline-manager.ts` — Native Mapbox SDK
18. `lib/mapbox/wifi-validator.ts` — Native network monitoring
19. `lib/toast-system.ts` — Native toast system
20. `lib/notifier-helpers.ts` — Native notifications

---

## Verification Gates

### Gate 1: All Files Classified

**Command**:
```bash
find react-native/lib react-native/stores react-native/types -name '*.ts' -o -name '*.tsx' | while read f; do
  grep -q "$f" .spec/prds/native-rewrite/matrices/models/INVENTORY.md || echo "Unclassified: $f"
done
```

**Expected**: No output

---

### Gate 2: Rationale Documentation

**Check**: Each entry includes `Rationale:` field referencing classification criteria from 08g.

---

### Gate 3: Dependency Documentation

**Check**: Each entry includes `Dependencies:` field listing internal and external dependencies.

---

### Gate 4: Translation Plan Links

**Check**: All PORT-classified files have corresponding `MODEL-*.md` translation plans (authored in FND-006).

---

### Gate 5: No Circular Dependencies

**Check**: Dependency graph built from `Dependencies:` fields is a DAG (no cycles).

---

## Next Steps

1. **FND-005 (Current)**: Complete this inventory with all files classified
2. **FND-006**: Author per-file `MODEL-*.md` translation plans for every PORT-classified file
3. **Sprint 02+**: Implement native translations following the translation ordering above

---

## References

- `08g-model-translation-protocol.md` — Classification framework and translation patterns
- `17-state-convex-architecture.md` — State management architecture
- Task `FND-006` — Per-file translation plan authoring

---

**Change Log**:
- 2026-04-19: Initial inventory created (FND-005)
