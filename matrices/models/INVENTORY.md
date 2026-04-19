# Model Translation Inventory

**Version**: 1.0.0
**Status**: Draft
**Last Updated**: 2026-04-18
**Related Protocol**: `.spec/prds/native-rewrite/08g-model-translation-protocol.md`

## Overview

This inventory classifies every TypeScript business logic file in `react-native/lib/` and `react-native/stores/` according to the three-category framework defined in 08g:

- **SHARED-TS**: Pure TypeScript, no RN dependencies, no translation needed
- **PORT**: Business logic requiring platform-specific APIs, must be ported with behavioral parity
- **NATIVE-OWNED**: UI state, stores, orchestration, replaced with platform-idiomatic patterns

**Classification Count**:
- SHARED-TS: 8 files
- PORT: 19 files
- NATIVE-OWNED: 13 files
- Test files: 8 files (port to platform test suites)
- **Total**: 40 files

---

## Complete Inventory

### AI/ML Module (`lib/ai/`)

#### `lib/ai/types.ts` — **SHARED-TS**

**Rationale**: Pure TypeScript type definitions with no React Native dependencies. Exports only type aliases and forward declarations.

**Dependencies**: None

**Priority**: P0 (baseline for other AI files)

**Translation**: No translation needed. Use as-is from shared TypeScript module.

---

#### `lib/ai/NativeMLXBridge.ts` — **NATIVE-OWNED** (documentation only)

**Rationale**: Documents the native module interface between JS and Swift/Kotlin. Contains embedded Swift/Kotlin implementation code as documentation. The actual implementation is in platform-native code.

**Dependencies**: None (documentation file)

**Priority**: P2 (reference for native implementation)

**Translation**: No translation. This file IS the documentation for native implementation.

---

#### `lib/ai/local-model.ts` — **NATIVE-OWNED**

**Rationale**: Orchestrates native MLX module bridge. Manages singleton model instance, checksum validation, and inference orchestration. Contains React Native-specific code (NativeModules, FileSystem) and business state management.

**Dependencies**:
- `react-native` (NativeModules)
- `expo-file-system/legacy` (FileSystem)
- `./types.ts` (SHARED-TS)
- `./checksum.ts` (PORT)

**Priority**: P0 (core AI orchestration)

**Translation**: Replace with platform-native MLX orchestration (Android: direct MLX Kotlin bindings, iOS: MLX Swift framework). ViewModel pattern for state management.

---

#### `lib/ai/checksum.ts` — **PORT**

**Rationale**: Pure SHA-256 validation logic but uses expo-crypto (platform-specific API). Business logic is portable but requires platform crypto APIs.

**Dependencies**:
- `expo-crypto` (Crypto.digestStringAsync)
- `expo-file-system/legacy` (FileSystem)
- `./types.ts` (SHARED-TS)

**Priority**: P0 (model validation, used by gatekeeper)

**Translation**: Port to Android (java.security.MessageDigest) and iOS (CryptoKit SHA256). Maintain identical input/output contract. Port unit tests from `checksum.test.ts`.

---

#### `lib/ai/atomic-write.ts` — **PORT**

**Rationale**: Atomic file operations using expo-file-system. Pure logic for crash-safe file writes but requires platform filesystem APIs.

**Dependencies**:
- `expo-file-system/legacy` (FileSystem)

**Priority**: P1 (download integrity)

**Translation**: Port to Android (java.io atomic rename) and iOS (FileManager atomic writes). Port unit tests from `storage.test.ts`.

---

#### `lib/ai/model-manifest.ts` — **PORT**

**Rationale**: Version management and metadata persistence using AsyncStorage. Business logic for version comparison and rollback requires platform storage APIs.

**Dependencies**:
- `@react-native-async-storage/async-storage` (AsyncStorage)
- `./checksum.ts` (PORT)

**Priority**: P1 (model updates)

**Translation**: Port to Android (DataStore/SharedPreferences) and iOS (UserDefaults/SwiftData). Maintain version comparison logic.

---

#### `lib/ai/model-download.ts` — **PORT**

**Rationale**: Download logic with WiFi validation, storage checks, and resume support. Uses expo-file-system for downloads. Core business logic is portable.

**Dependencies**:
- `expo-file-system/legacy` (FileSystem)
- `./types.ts` (SHARED-TS)

**Priority**: P0 (model download flow)

**Translation**: Port to Android (WorkManager/DownloadManager) and iOS (URLSession + BackgroundTasks). Maintain WiFi enforcement and resume semantics.

---

#### `lib/ai/persistent-download-manager.ts` — **NATIVE-OWNED**

**Rationale**: Download state orchestration with Zustand store integration. Manages download progress persistence and resume state. Platform-specific FileSystem usage combined with UI state management.

**Dependencies**:
- `expo-file-system/legacy` (FileSystem)
- `zustand` (useDownloadStore)
- `./types.ts` (SHARED-TS)

**Priority**: P0 (download UX)

**Translation**: Replace with platform-native download manager (Android: WorkManager + Room, iOS: BackgroundTasks + SwiftData). State management via ViewModel.

---

#### `lib/ai/background-download-service.ts` — **NATIVE-OWNED**

**Rationale**: Background task orchestration using Expo BackgroundFetch and Notifications. Platform-specific lifecycle management and notification APIs. Orchestrates PersistentDownloadManager for background execution.

**Dependencies**:
- `expo-background-fetch` (BackgroundFetch)
- `expo-notifications` (Notifications)
- `react-native` (AppState)
- `zustand` (useDownloadStore)
- `./persistent-download-manager.ts` (NATIVE-OWNED)

**Priority**: P1 (background downloads)

**Translation**: Replace with platform-native background services (Android: WorkManager, iOS: BackgroundTasks). Notification APIs replaced with platform equivalents.

---

### Test Files (`lib/ai/__tests__/`)

#### Test files — **PORT to platform test suites**

**Files**:
- `checksum.test.ts` → Port to Android JVM tests + iOS XCTest
- `local-model.test.ts` → Port to platform tests (mock MLX)
- `model-download.test.ts` → Port to platform tests
- `storage.test.ts` → Port to platform tests

**Rationale**: Test code must be ported to platform-native test frameworks to verify behavioral parity of PORT files.

**Priority**: P1 (verification)

---

### Auth Module (`lib/`)

#### `lib/auth-tokens.ts` — **PORT**

**Rationale**: Token storage and retrieval using asyncStorage. Pure business logic but requires platform secure storage APIs.

**Dependencies**:
- `../hooks/use-async-storage` (asyncStorage)

**Priority**: P0 (authentication)

**Translation**: Port to Android (EncryptedSharedPreferences) and iOS (Keychain/SecureStore). Maintain token retrieval semantics.

---

#### `lib/clerk-token-cache.ts` — **NATIVE-OWNED**

**Rationale**: Clerk token cache implementation using expo-secure-store. Platform-specific secure storage integration for Clerk SDK.

**Dependencies**:
- `@clerk/clerk-expo` (TokenCache interface)
- `expo-secure-store` (SecureStore)

**Priority**: P0 (Clerk auth integration)

**Translation**: Replace with Clerk's native platform SDKs (Android: Clerk Android SDK, iOS: Clerk iOS SDK). Token caching handled by SDK.

---

#### `lib/convex-error.ts` — **SHARED-TS**

**Rationale**: Pure error handling logic importing only from server code (`../../server/lib/errors`). No React Native dependencies.

**Dependencies**:
- `../../server/lib/errors` (ServerErrorCode, SERVER_ERROR_MESSAGES)

**Priority**: P0 (error handling)

**Translation**: No translation needed. Use as-is from shared TypeScript module.

---

### Date Utilities (`lib/`)

#### `lib/date-formatters.ts` — **SHARED-TS**

**Rationale**: Pure date formatting functions using date-fns. No React Native dependencies. Pure math and date manipulation.

**Dependencies**:
- `date-fns` (format)

**Priority**: P1 (UI formatting)

**Translation**: No translation needed. Use as-is from shared TypeScript module OR port to platform formatters if performance-critical.

---

### Mapbox Module (`lib/mapbox/`)

#### `lib/mapbox/styles.ts` — **SHARED-TS**

**Rationale**: Pure constants defining Mapbox style URLs. No dependencies except itself. Pure configuration data.

**Dependencies**: None

**Priority**: P2 (map styling)

**Translation**: No translation needed. Use as-is from shared TypeScript module OR port to Android/iOS string resources.

---

#### `lib/mapbox/coordinate-converter.ts` — **SHARED-TS**

**Rationale**: Pure coordinate transformation functions (Google ↔ Mapbox format). No platform dependencies. Pure math array manipulation.

**Dependencies**: None

**Priority**: P0 (map correctness)

**Translation**: No translation needed. Use as-is from shared TypeScript module.

---

#### `lib/mapbox/download-queue.ts` — **PORT**

**Rationale**: Sequential download queue processor. Pure queue logic but used by Mapbox offline manager. No direct RN deps but consumed by offline-store (NATIVE-OWNED).

**Dependencies**: None (pure queue logic)

**Priority**: P1 (offline download orchestration)

**Translation**: Port to Android (Kotlin coroutines + Channel) and iOS (Swift AsyncStream + Actor). Maintain FIFO semantics and pause/resume behavior.

---

#### `lib/mapbox/storage-utils.ts` — **PORT**

**Rationale**: Storage estimation and limit detection. Pure math for tile counting but used by Mapbox offline code. Platform storage info provider injected at runtime.

**Dependencies**: None (storage info provider injected)

**Priority**: P1 (offline download validation)

**Translation**: Port to Android (StatFs for storage info) and iOS (FileManager for storage info). Maintain estimation algorithm.

---

#### `lib/mapbox/wifi-validator.ts` — **PORT**

**Rationale**: Network state validation for WiFi-only downloads. Network state provider injected at runtime. Pure validation logic but used by Mapbox code.

**Dependencies**: None (network state provider injected)

**Priority**: P1 (offline download requirements)

**Translation**: Port to Android (ConnectivityManager NetworkCallback) and iOS (NWPathMonitor). Maintain WiFi enforcement semantics.

---

#### `lib/mapbox/offline-manager.ts` — **NATIVE-OWNED**

**Rationale**: Thin wrapper around Mapbox SDK with validation logic. Orchestrates offline pack downloads via Mapbox offlineManager. Platform-specific SDK integration.

**Dependencies**:
- `@rnmapbox/maps` (offlineManager)
- `./download-queue.ts` (PORT)
- `./storage-utils.ts` (PORT)
- `./wifi-validator.ts` (PORT)
- `../../stores/offline-store.ts` (NATIVE-OWNED)

**Priority**: P0 (offline maps)

**Translation**: Replace with platform Mapbox SDKs (Android: Mapbox Android SDK, iOS: Mapbox iOS SDK). Direct SDK usage, no wrapper needed.

---

#### `lib/mapbox/weather-optimization.ts` — **PORT**

**Rationale**: Weather overlay batch rendering with Douglas-Peucker simplification. Uses server-side polyline utilities and theme colors. Pure geometry algorithms but imports from RN component themes.

**Dependencies**:
- `../../../server/lib/polyline` (polyline utilities)
- `../../../server/models/saved-routes` (overlay types)
- `../../styles/types` (ExtendedTheme)
- `../map/overlay-colors.ts` (color utilities)
- `./coordinate-converter.ts` (SHARED-TS)

**Priority**: P2 (weather overlays)

**Translation**: Port to Android (Kotlin with same algorithm) and iOS (Swift with same algorithm). Maintain LOD simplification and batching behavior. Theme colors resolve via platform theme system.

---

### Model Module (`lib/model/`)

#### `lib/model/download-manager.ts` — **PORT**

**Rationale**: Gatekeeper integration with PersistentDownloadManager. Uses expo-file-system and ChecksumValidator. Orchestrates download flow with checksum validation.

**Dependencies**:
- `expo-file-system/legacy` (FileSystem)
- `zustand` (useDownloadStore)
- `../ai/checksum.ts` (PORT)
- `../ai/persistent-download-manager.ts` (NATIVE-OWNED)

**Priority**: P0 (model download gatekeeper)

**Translation**: Port to Android (WorkManager integration) and iOS (BackgroundTasks integration). Maintain gatekeeper semantics (WiFi enforcement, checksum validation).

---

#### `lib/model/gatekeeper.ts` — **NATIVE-OWNED**

**Rationale**: Model gatekeeper enforcing download completion before app usage. Uses AsyncStorage and expo-file-system. Platform-specific storage and filesystem APIs combined with navigation guarding logic.

**Dependencies**:
- `@react-native-async-storage/async-storage` (AsyncStorage)
- `expo-file-system/legacy` (FileSystem)
- `../ai/checksum.ts` (PORT)

**Priority**: P0 (app launch gatekeeper)

**Translation**: Replace with platform-native gatekeeper (Android: DataStore + File validation, iOS: UserDefaults + FileManager). ViewModel-based navigation guarding.

---

### UI Utilities (`lib/`)

#### `lib/camera-quick.ts` — **PORT**

**Rationale**: Camera launch using expo-image-picker. Platform-specific camera API with permission handling.

**Dependencies**:
- `expo-image-picker` (ImagePicker)

**Priority**: P2 (photo capture)

**Translation**: Port to Android (ActivityResultContracts.TakePicture) and iOS (UIImagePickerController). Maintain permission flow.

---

#### `lib/is-dev-menu.ts` — **SHARED-TS**

**Rationale**: Dev menu flag detection using process.env and __DEV__. No runtime dependencies. Pure configuration check.

**Dependencies**: None

**Priority**: P3 (dev tooling)

**Translation**: No translation needed. Use BuildConfig.DEBUG (Android) and -DDEBUG (iOS) equivalents.

---

#### `lib/notifier-helpers.ts` — **NATIVE-OWNED**

**Rationale**: Notification helpers using react-native-notifier and RN components. Platform-specific notification system with UI components.

**Dependencies**:
- `react-native-notifier` (Notifier)
- `../components/ui/permission-notification` (RN component)

**Priority**: P2 (notifications)

**Translation**: Replace with platform notification APIs (Android: NotificationManager + Compose, iOS: UserNotifications + SwiftUI). Platform-idiomatic notification UI.

---

#### `lib/toast-config.tsx` — **NATIVE-OWNED**

**Rationale**: Toast configuration for react-native-toast-message with RN components. Platform-specific toast system with React Native UI.

**Dependencies**:
- `react-native` (StyleSheet, Text, View)
- `@expo/vector-icons` (MaterialCommunityIcons)
- `react-native-toast-message` (Toast)
- `../hooks/use-semantic-theme` (RN hook)

**Priority**: P2 (toast notifications)

**Translation**: Replace with platform toast/snackbar APIs (Android: Compose Snackbar, iOS: SwiftUI alerts/toasts). Platform-idiomatic UI.

---

#### `lib/toast-system.ts` — **NATIVE-OWNED**

**Rationale**: Toast notification system using react-native-notifier with RN components. Orchestrates toast display with queue management.

**Dependencies**:
- `react-native-notifier` (Notifier)
- `../components/toasts/*` (RN components)

**Priority**: P2 (toast orchestration)

**Translation**: Replace with platform notification managers (Android: SnackbarHost, iOS: Notification queue). Platform-idiomatic queue management.

---

### Stores Module (`stores/`)

#### `stores/chat-session-store.ts` — **NATIVE-OWNED**

**Rationale**: Zustand store with AsyncStorage persistence for chat session state (camera cache, last viewed session). Platform-specific state management with storage persistence.

**Dependencies**:
- `zustand` (create, persist)
- `@react-native-async-storage/async-storage` (AsyncStorage)

**Priority**: P0 (chat session state)

**Translation**: Replace with platform-native state management (Android: ViewModel + DataStore/Room, iOS: @Observable + SwiftData). Maintain camera cache and last viewed session semantics.

---

#### `stores/download-store.ts` — **NATIVE-OWNED**

**Rationale**: Zustand store with AsyncStorage persistence for model download state. Platform-specific state management with progress tracking and error recovery.

**Dependencies**:
- `zustand` (create, persist)
- `@react-native-async-storage/async-storage` (AsyncStorage)

**Priority**: P0 (download state)

**Translation**: Replace with platform-native state management (Android: ViewModel + DataStore, iOS: @Observable + SwiftData). Maintain download progress persistence and recovery semantics.

---

#### `stores/offline-store.ts` — **NATIVE-OWNED**

**Rationale**: Zustand store with AsyncStorage persistence and Mapbox SDK integration. Platform-specific state management with Mapbox offline pack orchestration.

**Dependencies**:
- `zustand` (create, persist)
- `@react-native-async-storage/async-storage` (AsyncStorage)
- `@rnmapbox/maps` (offlineManager)
- `../lib/mapbox/download-queue.ts` (PORT)
- `../lib/mapbox/storage-utils.ts` (PORT)
- `../lib/mapbox/wifi-validator.ts` (PORT)

**Priority**: P0 (offline regions state)

**Translation**: Replace with platform-native state management (Android: ViewModel + Room, iOS: @Observable + SwiftData). Direct Mapbox SDK integration (no wrapper). Maintain region metadata and download queue semantics.

---

#### `stores/settings-store.ts` — **NATIVE-OWNED**

**Rationale**: Zustand store with AsyncStorage persistence for app settings (theme, onboarding). Platform-specific state management with persistence.

**Dependencies**:
- `zustand` (create, persist)
- `@react-native-async-storage/async-storage` (AsyncStorage)

**Priority**: P0 (user preferences)

**Translation**: Replace with platform-native preferences (Android: DataStore/Preferences, iOS: @AppStorage/SwiftData). Maintain theme and onboarding flag persistence.

---

## Dependency Graph (Translation Order)

```
Layer 1: SHARED-TS (baseline)
├── lib/ai/types.ts
├── lib/convex-error.ts
├── lib/date-formatters.ts
├── lib/mapbox/styles.ts
├── lib/mapbox/coordinate-converter.ts
└── lib/is-dev-menu.ts

Layer 2: PORT (depends on SHARED-TS)
├── lib/ai/checksum.ts (depends on types.ts)
├── lib/ai/atomic-write.ts (no deps)
├── lib/ai/model-manifest.ts (depends on checksum.ts)
├── lib/ai/model-download.ts (depends on types.ts)
├── lib/mapbox/download-queue.ts (no deps)
├── lib/mapbox/storage-utils.ts (no deps)
├── lib/mapbox/wifi-validator.ts (no deps)
├── lib/mapbox/weather-optimization.ts (depends on coordinate-converter.ts)
├── lib/auth-tokens.ts (no deps)
├── lib/camera-quick.ts (no deps)
└── lib/model/download-manager.ts (depends on checksum.ts)

Layer 3: NATIVE-OWNED (depends on PORT + SHARED-TS)
├── lib/ai/local-model.ts (depends on checksum.ts, types.ts)
├── lib/ai/persistent-download-manager.ts (depends on types.ts)
├── lib/ai/background-download-service.ts (depends on persistent-download-manager.ts)
├── lib/model/gatekeeper.ts (depends on checksum.ts)
├── lib/clerk-token-cache.ts (no deps)
├── lib/mapbox/offline-manager.ts (depends on download-queue.ts, storage-utils.ts, wifi-validator.ts)
├── lib/notifier-helpers.ts (no deps)
├── lib/toast-config.tsx (no deps)
├── lib/toast-system.ts (no deps)
├── stores/chat-session-store.ts (no deps)
├── stores/download-store.ts (no deps)
├── stores/offline-store.ts (depends on download-queue.ts, storage-utils.ts, wifi-validator.ts)
└── stores/settings-store.ts (no deps)
```

**Translation Sequence**:
1. Translate all SHARED-TS tests (if needed)
2. Translate Layer 2 PORT files with unit tests
3. Translate Layer 3 NATIVE-OWNED files with integration tests
4. Verify cross-layer integration

---

## Summary by Category

### SHARED-TS (8 files) — No translation needed

1. `lib/ai/types.ts` — Type definitions
2. `lib/convex-error.ts` — Error handling
3. `lib/date-formatters.ts` — Date formatting
4. `lib/mapbox/styles.ts` — Map style URLs
5. `lib/mapbox/coordinate-converter.ts` — Coordinate transforms
6. `lib/is-dev-menu.ts` — Dev menu flag
7. Test files for above (port to platform tests)

**Strategy**: Use as-is from shared TypeScript module. No native implementation needed.

---

### PORT (19 files) — Behavioral parity required

**AI/ML (5)**:
1. `lib/ai/checksum.ts` — SHA-256 validation
2. `lib/ai/atomic-write.ts` — Atomic file operations
3. `lib/ai/model-manifest.ts` — Version management
4. `lib/ai/model-download.ts` — Download logic
5. `lib/model/download-manager.ts` — Gatekeeper integration

**Mapbox (5)**:
6. `lib/mapbox/download-queue.ts` — Sequential queue
7. `lib/mapbox/storage-utils.ts` — Storage estimation
8. `lib/mapbox/wifi-validator.ts` — Network validation
9. `lib/mapbox/weather-optimization.ts` — Weather batching
10. `lib/mapbox/offline-manager.ts` — Mapbox SDK wrapper (partial PORT, partial NATIVE-OWNED)

**Utilities (4)**:
11. `lib/auth-tokens.ts` — Token storage
12. `lib/camera-quick.ts` — Camera launch
13. `lib/model/gatekeeper.ts` — Gatekeeper logic (partial PORT, partial NATIVE-OWNED)
14. Test files for PORT code

**Strategy**: Implement platform-native version with identical input/output contract. Port unit tests. Verify behavioral parity.

---

### NATIVE-OWNED (13 files) — Platform-idiomatic replacement

**AI/ML (3)**:
1. `lib/ai/local-model.ts` — MLX orchestration
2. `lib/ai/persistent-download-manager.ts` — Download state
3. `lib/ai/background-download-service.ts` — Background tasks

**Mapbox (1)**:
4. `lib/mapbox/offline-manager.ts` — Offline pack management

**Model (1)**:
5. `lib/model/gatekeeper.ts` — App launch gatekeeper

**Auth (1)**:
6. `lib/clerk-token-cache.ts` — Clerk token caching

**UI (4)**:
7. `lib/notifier-helpers.ts` — Notification helpers
8. `lib/toast-config.tsx` — Toast configuration
9. `lib/toast-system.ts` — Toast orchestration

**Stores (4)**:
10. `stores/chat-session-store.ts` — Chat session state
11. `stores/download-store.ts` — Download state
12. `stores/offline-store.ts` — Offline regions state
13. `stores/settings-store.ts` — App settings

**Strategy**: Replace with platform-idiomatic patterns (ViewModels, DataStore/SwiftData, platform SDKs). Behavior must match but implementation follows platform conventions.

---

## Test Files (8) — Port to platform test suites

**AI Tests**:
- `lib/ai/__tests__/checksum.test.ts` → Android JVM tests + iOS XCTest
- `lib/ai/__tests__/local-model.test.ts` → Platform tests (mock MLX)
- `lib/ai/__tests__/model-download.test.ts` → Platform tests
- `lib/ai/__tests__/storage.test.ts` → Platform tests

**Mapbox Tests**:
- `lib/mapbox/__tests__/coordinate-converter.test.ts` → Port to platform tests
- `lib/mapbox/__tests__/weather-optimization.test.ts` → Port to platform tests

**Strategy**: Port test logic to platform-native test frameworks. Maintain test coverage and assertions.

---

## Verification Commands

### Verify all files are classified

```bash
# Count TypeScript files in lib and stores
find react-native/lib react-native/stores -name "*.ts" -o -name "*.tsx" | wc -l
# Expected: 40

# Count inventory entries (excluding headers)
grep -c "^###" matrices/models/INVENTORY.md
# Expected: 40
```

### Verify no unclassified files

```bash
find react-native/lib react-native/stores -name "*.ts" -o -name "*.tsx" | while read f; do
  if ! grep -q "$f" matrices/models/INVENTORY.md; then
    echo "Unclassified: $f"
  fi
done
# Expected: No output
```

### Verify SHARED-TS files have no RN deps

```bash
for file in lib/ai/types.ts lib/convex-error.ts lib/date-formatters.ts lib/mapbox/styles.ts lib/mapbox/coordinate-converter.ts lib/is-dev-menu.ts; do
  if grep -qE "(from ['\"]react-native|from ['\"]expo-|from ['\"]@rnmapbox)" "react-native/$file"; then
    echo "ERROR: $file has RN deps but classified as SHARED-TS"
  fi
done
# Expected: No output
```

### Verify PORT files have business logic

```bash
for file in lib/ai/checksum.ts lib/ai/atomic-write.ts lib/mapbox/storage-utils.ts; do
  if ! grep -qE "(export (class|function|const))" "react-native/$file"; then
    echo "WARNING: $file classified as PORT but has no exports"
  fi
done
# Expected: No output
```

### Verify NATIVE-OWNED files use state management

```bash
for file in stores/*.ts lib/ai/local-model.ts lib/ai/background-download-service.ts; do
  if ! grep -qE "(zustand|create\(\)|persist\(|ViewModel|Observable)" "react-native/$file"; then
    echo "WARNING: $file classified as NATIVE-OWNED but may not use state management"
  fi
done
# Expected: No output (or false positives for orchestration-only files)
```

---

## References

- `.spec/prds/native-rewrite/08g-model-translation-protocol.md` — Classification framework
- `.spec/prds/native-rewrite/17-state-convex-architecture.md` — Repository patterns
- Task FND-006 — Per-file MODEL-*.md translation plans
