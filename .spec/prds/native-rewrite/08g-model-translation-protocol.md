---
stability: CONSTITUTION
last_validated: 2026-04-18
prd_version: 1.0.0
functional_group: DESIGN
---

# Model Translation Protocol (RN → Native Business Logic)

## Overview

This document defines the protocol for translating React Native business logic into platform-native implementations (Android Kotlin/Compose + iOS Swift/SwiftUI). Unlike UI component translation (08f), which focuses on visual parity, **model translation** focuses on behavioral correctness, state consistency, and cross-platform business logic portability.

**Key distinction from 08f:**
- **08f (UI Translation)**: Photocopy visual rendering, animations, and accessibility from RN components to native UI primitives
- **08g (Model Translation)**: Port business logic, state management, and data orchestration to platform-native patterns

Every business logic file in `react-native/lib/` and `react-native/stores/` must be classified and translated according to this protocol before parallel native implementation (FND-006) can proceed.

---

## Classification Framework

All TypeScript business logic files fall into exactly one of three categories:

### SHARED-TS

**Definition**: Pure TypeScript with no React Native dependencies — portable to any TypeScript environment.

**Criteria**:
- ✅ No imports from `react-native`, `expo-*`, `@rnmapbox/*`, or other RN-specific packages
- ✅ Pure functions (no UI state, no platform APIs)
- ✅ Standard TypeScript types only (no RN-specific types)
- ✅ May import from `date-fns`, `convex/*`, or other cross-platform libraries

**Examples**:
- Date formatters (`lib/date-formatters.ts`) — pure functions, no RN deps
- Error handling (`lib/convex-error.ts`) — imports from server code only
- Type definitions (`lib/ai/types.ts`) — no RN deps

**Translation Strategy**: **NO TRANSLATION NEEDED** — use as-is from shared TypeScript module

**Verification**:
```bash
grep -E "(from ['\"]react-native|from ['\"]expo-|from ['\"]@rnmapbox)" lib/date-formatters.ts
# Should return empty
```

---

### PORT

**Definition**: Business logic that React Native depends on, which must be ported to both Android and iOS with **identical behavior**.

**Criteria**:
- ✅ Contains business rules or algorithms that affect user-facing behavior
- ✅ Currently used by RN code (components, hooks, stores)
- ✅ Requires platform-specific APIs (filesystem, network, crypto)
- ❌ NOT UI state (that's NATIVE-OWNED)
- ❌ NOT RN-specific rendering logic

**Examples**:
- `lib/ai/checksum.ts` — SHA-256 validation, uses expo-crypto
- `lib/ai/atomic-write.ts` — File operations, uses expo-file-system
- `lib/mapbox/storage-utils.ts` — Storage estimation, pure math but used by Mapbox code
- `lib/auth-tokens.ts` — Token storage, uses asyncStorage

**Translation Strategy**: **PORT WITH BEHAVIORAL PARITY**
- Android: Kotlin implementation using platform equivalents (java.security.crypto, java.io)
- iOS: Swift implementation using platform equivalents (CryptoKit, FileManager)
- **Must maintain identical input/output contracts**
- Unit tests from `*.test.ts` must be ported to Kotlin/iOS test suites

**Verification**:
```bash
# Check for RN deps
grep -E "(from ['\"]react-native|from ['\"]expo-)" lib/ai/checksum.ts
# Should return expo-crypto (platform API)

# Check if business logic
grep -E "(export (class|function|const))" lib/ai/checksum.ts | head -5
# Should show business logic exports

# Check for usage
grep -r "checksum" react-native/hooks react-native/components | wc -l
# Should be > 0 (used by RN code)
```

---

### NATIVE-OWNED

**Definition**: UI state, store orchestration, and platform-specific glue that is owned by each platform's native implementation.

**Criteria**:
- ✅ Manages UI state (Zustand stores, React hooks)
- ✅ Orchestrates RN-specific APIs (background tasks, notifications)
- ✅ Bridges between JS and native modules
- ✅ Platform-specific lifecycle management
- ❌ NOT pure business logic

**Examples**:
- `stores/chat-session-store.ts` — Zustand store with AsyncStorage
- `stores/download-store.ts` — Zustand store for download state
- `stores/offline-store.ts` — Zustand store with Mapbox integration
- `stores/settings-store.ts` — Zustand store for theme/onboarding
- `lib/ai/local-model.ts` — Native module bridge orchestration
- `lib/ai/background-download-service.ts` — Expo BackgroundFetch orchestration
- `lib/ai/persistent-download-manager.ts` — Download state with FileSystem
- `lib/mapbox/offline-manager.ts` — Mapbox SDK wrapper
- `lib/mapbox/wifi-validator.ts` — Network state management

**Translation Strategy**: **REPLACE WITH PLATFORM-NATIVE EQUIVALENT**
- Android: ViewModels + StateFlow/Flow, Room database, WorkManager for background tasks
- iOS: @Observable ViewModels, SwiftData/Persistence, BackgroundTasks framework
- **Behavior must match** but implementation is platform-idiomatic

**Verification**:
```bash
# Check for state management
grep -E "(zustand|create\(\(|persist\()" stores/chat-session-store.ts
# Should match Zustand patterns

# Check for platform APIs
grep -E "(NativeModules|expo-|@rnmapbox)" lib/ai/background-download-service.ts
# Should match platform-specific imports

# Check for lifecycle/orchestration
grep -E "(AppState|TaskManager|BackgroundFetch)" lib/ai/background-download-service.ts
# Should match lifecycle management
```

---

## Translation Decision Tree

For each TypeScript file, follow this decision tree:

```
┌─────────────────────────────────────────────────────────────────┐
│ START: Does file have RN/expo/@rnmapbox imports?                │
└────────────────────┬────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │ NO                    │ YES
         ▼                       ▼
┌─────────────────┐   ┌─────────────────────────────────────────┐
│ SHARED-TS       │   │ Does it manage UI state or orchestrate   │
│ (no translation │   │ platform lifecycle (stores, hooks,       │
│ needed)         │   │ background tasks, native bridges)?       │
└─────────────────┘   └──────────────────┬──────────────────────┘
                                       │
                      ┌─────────────────┴─────────────────┐
                      │ YES                               │ NO
                      ▼                                   ▼
           ┌───────────────────┐           ┌───────────────────────────┐
           │ NATIVE-OWNED      │           │ PORT                      │
           │ (replace with     │           │ (port with identical      │
           │ platform-idiom)   │           │ behavior)                 │
           └───────────────────┘           └───────────────────────────┘
```

---

## Translation Patterns by Category

### SHARED-TS: No Translation

**Action**: Do nothing. File remains in shared TypeScript module.

**Example**: `lib/date-formatters.ts`

```typescript
// Already pure TypeScript
export const formatRelativeDate = (ms: number): string => {
  const date = new Date(ms)
  const now = new Date()
  // ... pure logic
}
```

**Consumption in Native**:
```kotlin
// Android: Use shared TypeScript module via JS interop OR port to Kotlin
// Option A: Call via JS bridge
val formatted = jsBridge.call("formatRelativeDate", timestamp)

// Option B: Port to Kotlin if performance-critical
fun formatRelativeDate(ms: Long): String {
  val date = Date(ms)
  val now = Date()
  // ... equivalent logic
}
```

```swift
// iOS: Use shared TypeScript module via JS interop OR port to Swift
// Option A: Call via JS bridge
let formatted = jsBridge.call("formatRelativeDate", timestamp)

// Option B: Port to Swift if performance-critical
func formatRelativeDate(_ ms: Int64) -> String {
  let date = Date(timeIntervalSince1970: TimeInterval(ms / 1000))
  let now = Date()
  // ... equivalent logic
}
```

---

### PORT: Behavioral Parity Required

**Action**: Implement platform-native version with identical input/output contract.

**Example**: `lib/ai/checksum.ts` → SHA-256 validation

**Original (TypeScript)**:
```typescript
export class ChecksumValidator {
  async validate(filePath: string, expectedChecksum: string): Promise<ChecksumResult> {
    const actualChecksum = await this.computeSHA256(filePath)
    return {
      valid: actualChecksum === expectedChecksum,
      actualChecksum,
    }
  }

  private async computeSHA256(filePath: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fileContent,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    )
    return this.base64ToHex(digest)
  }
}
```

**Ported (Android)**:
```kotlin
// checksum/ChecksumValidator.kt
class ChecksumValidator {

    suspend fun validate(filePath: String, expectedChecksum: String): ChecksumResult {
        val actualChecksum = computeSHA256(filePath)
        return ChecksumResult(
            valid = actualChecksum == expectedChecksum,
            actualChecksum = actualChecksum
        )
    }

    private suspend fun computeSHA256(filePath: String): String {
        val file = File(filePath)
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (input.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}
```

**Ported (iOS)**:
```swift
// checksum/ChecksumValidator.swift
class ChecksumValidator {

    func validate(filePath: String, expectedChecksum: String) async -> ChecksumResult {
        let actualChecksum = await computeSHA256(filePath: filePath)
        return ChecksumResult(
            valid: actualChecksum == expectedChecksum,
            actualChecksum: actualChecksum
        )
    }

    private func computeSHA256(filePath: String) async -> String {
        let fileURL = URL(fileURLWithPath: filePath)
        let data = try Data(contentsOf: fileURL)
        let digest = SHA256.hash(data: data)
        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }
}
```

**Verification**: Ported unit tests must pass with same test cases as `*.test.ts`

---

### NATIVE-OWNED: Platform-Idiomatic Replacement

**Action**: Replace with platform-native state management and lifecycle patterns.

**Example**: `stores/chat-session-store.ts` → Android ViewModel + iOS @Observable

**Original (TypeScript Zustand)**:
```typescript
export const useChatSessionStore = create<ChatSessionState>()(
  persist(
    (set, get) => ({
      defaultCamera: null,
      bySession: {},
      lastViewedSessionId: null,
      setCamera: (sessionId, center, zoom) => {
        if (sessionId) {
          set((state) => ({
            bySession: { ...state.bySession, [sessionId]: { center, zoom } }
          }))
        } else {
          set({ defaultCamera: { center, zoom } })
        }
      },
      // ...
    }),
    { name: 'laneshadow-chat-session', storage: createJSONStorage(() => AsyncStorage) }
  )
)
```

**Native Replacement (Android)**:
```kotlin
// chat/ChatSessionViewModel.kt
@HiltViewModel
class ChatSessionViewModel @Inject constructor(
    private val dataStore: DataStore<ChatSessionPreferences>
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatSessionUiState())
    val uiState: StateFlow<ChatSessionUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            dataStore.data.collect { preferences ->
                _uiState.update { it.copy(
                    lastViewedSessionId = preferences.lastViewedSessionId,
                    defaultCamera = preferences.defaultCamera,
                    bySession = preferences.bySessionMap
                )}
            }
        }
    }

    fun setCamera(sessionId: String?, center: LatLng, zoom: Float) {
        viewModelScope.launch {
            dataStore.updateData { prefs ->
                if (sessionId != null) {
                    prefs.toBuilder()
                        .putBySession(sessionId, cameraToProto(center, zoom))
                        .build()
                } else {
                    prefs.toBuilder()
                        .setDefaultCamera(cameraToProto(center, zoom))
                        .build()
                }
            }
        }
    }
}
```

**Native Replacement (iOS)**:
```swift
// chat/ChatSessionViewModel.swift
@Observable
class ChatSessionViewModel {
    var state = ChatSessionState()

    private let persistence: ChatSessionPersistence

    init(persistence: ChatSessionPersistence = .shared) {
        self.persistence = persistence
        Task {
            await loadState()
        }
    }

    func setCamera(sessionId: String?, center: CLLocationCoordinate2D, zoom: Double) {
        Task {
            if let sessionId = sessionId {
                state.bySession[sessionId] = CameraSlot(center: center, zoom: zoom)
            } else {
                state.defaultCamera = CameraSlot(center: center, zoom: zoom)
            }
            await persistence.saveState(state)
        }
    }

    private func loadState() async {
        if let loaded = await persistence.loadState() {
            state = loaded
        }
    }
}
```

**Verification**: Platform-specific tests validate state persistence and restoration

---

## Special Cases

### Convex Schema/Functions

**Classification**: **SHARED-TS** by definition

Convex schema and function definitions (`convex/schema.ts`, `convex/*.ts`) are backend code, not client code. They remain in shared TypeScript and are consumed by both RN and native platforms via Convex SDK.

**Verification**:
```bash
# Convex files should NOT be classified as PORT
grep "^convex/" matrices/models/INVENTORY.md | grep "PORT"
# Should return empty
```

### Native Module Bridges

**Classification**: **NATIVE-OWNED** (documented for reference only)

Files like `lib/ai/NativeMLXBridge.ts` document the interface between JS and native code. The actual implementation is in Swift/Kotlin. These files are documentation, not executable code.

**Verification**:
```bash
# Bridge files are NATIVE-OWNED
grep "NativeMLXBridge" matrices/models/INVENTORY.md
# Should classify as NATIVE-OWNED
```

### Hybrid: Business Logic with Platform API Calls

**Classification**: **PORT** if core business logic can be extracted

If a file contains both pure business logic and platform API calls, extract the pure logic to a SHARED-TS file, then PORT the platform wrapper.

**Example**: `lib/ai/model-download.ts`

**Original (hybrid)**:
```typescript
export class ModelDownloadManager {
  async downloadModel(url: string, networkStatus: NetworkStatus): Promise<DownloadResult> {
    // Platform API: WiFi check
    if (!this.isOnWiFi(networkStatus)) {
      return { success: false, error: 'WiFi required' }
    }

    // Platform API: Storage check
    const storageInfo = await FileSystem.getFreeDiskStorageAsync()
    if (storageInfo < MIN_REQUIRED) {
      return { success: false, error: 'Not enough storage' }
    }

    // Pure logic: URL parsing
    const fileName = this.getFileNameFromUrl(url)

    // Platform API: Download
    const result = await FileSystem.downloadAsync(url, filePath)
    return { success: true, filePath: result.uri }
  }
}
```

**Refactored Approach**:
1. Extract pure logic to SHARED-TS: `lib/ai/url-utils.ts`
2. PORT platform wrapper: `lib/ai/platform-download-manager.ts`

```typescript
// SHARED-TS: lib/ai/url-utils.ts
export function getFileNameFromUrl(url: string): string {
  const urlParts = url.split('/')
  return urlParts[urlParts.length - 1] || 'model.bin'
}
```

```kotlin
// PORT: platform-download-manager.kt
class PlatformDownloadManager {
    suspend fun downloadModel(url: String, networkStatus: NetworkStatus): DownloadResult {
        // Platform: WiFi check
        if (!isOnWiFi(networkStatus)) {
            return DownloadResult(success = false, error = "WiFi required")
        }

        // Platform: Storage check
        val storageInfo = getFreeDiskStorage()
        if (storageInfo < MIN_REQUIRED) {
            return DownloadResult(success = false, error = "Not enough storage")
        }

        // Shared logic: Use ported URL utility
        val fileName = UrlUtils.getFileNameFromUrl(url)

        // Platform: Download
        val result = downloadFile(url, fileName)
        return DownloadResult(success = true, filePath = result.path)
    }
}
```

---

## Dependencies and Translation Order

Dependencies between files must be respected when planning parallel translation (FND-006). The `DEPENDENCIES` column in `INVENTORY.md` captures this.

**Dependency Graph Rules**:
1. **SHARED-TS** files have no dependencies on PORT or NATIVE-OWNED files
2. **PORT** files may depend on SHARED-TS files (must translate SHARED-TS first)
3. **NATIVE-OWNED** files may depend on PORT or SHARED-TS files

**Example Dependency Chain**:
```
lib/ai/types.ts (SHARED-TS)
  ↓
lib/ai/checksum.ts (PORT) — depends on types.ts
  ↓
lib/ai/local-model.ts (NATIVE-OWNED) — depends on checksum.ts
```

**Translation Order**: Translate in dependency order (bottom-up)

---

## Verification Procedures

### Pre-Translation Verification

For each file, before classification:

1. **Check imports**: Identify all external dependencies
```bash
grep -h "^import\|^export" lib/ai/checksum.ts | sort -u
```

2. **Check usage**: Verify if used by RN code
```bash
grep -r "ChecksumValidator" react-native/ --include="*.ts" --include="*.tsx"
```

3. **Check for platform APIs**: Identify RN/platform-specific calls
```bash
grep -E "(NativeModules|expo-|@rnmapbox|FileSystem|Crypto\.|AsyncStorage)" lib/ai/checksum.ts
```

### Post-Translation Verification

After translation to native:

1. **Contract parity**: Input/output signatures match
```kotlin
// Android: Must match TS signature
suspend fun validate(filePath: String, expectedChecksum: String): ChecksumResult
```

2. **Test parity**: Ported tests pass with same cases
```bash
# Run original TS tests
npm test -- lib/ai/checksum.test.ts

# Run ported Android tests
./gradlew test --tests checksum.ChecksumValidatorTest

# Run ported iOS tests
xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15'
```

3. **Integration parity**: Native code integrates with platform ecosystem
```kotlin
// Android: Should use DI, Coroutines, Flow
@Module
@InstallIn(SingletonComponent::class)
object ChecksumModule {
    @Provides
    @Singleton
    fun provideChecksumValidator(): ChecksumValidator = ChecksumValidator()
}
```

---

## References

- `08f-translation-protocol.md` — UI component translation (visual parity)
- `17-state-convex-architecture.md` — Repository patterns and state management
- `matrices/models/INVENTORY.md` — Complete file inventory with classifications
- Task FND-006 — Per-file MODEL-*.md translation plans

---

## Appendix: Classification Quick Reference

| File Pattern | Classification | Rationale |
|-------------|----------------|-----------|
| `lib/date-formatters.ts` | SHARED-TS | Pure functions, no RN deps |
| `lib/convex-error.ts` | SHARED-TS | Imports from server code only |
| `lib/ai/types.ts` | SHARED-TS | Type definitions, no RN deps |
| `lib/ai/checksum.ts` | PORT | Uses expo-crypto, pure business logic |
| `lib/ai/atomic-write.ts` | PORT | Uses expo-file-system, file operations |
| `lib/auth-tokens.ts` | PORT | Uses asyncStorage, token management |
| `lib/mapbox/storage-utils.ts` | PORT | Pure math but used by Mapbox code |
| `stores/chat-session-store.ts` | NATIVE-OWNED | Zustand store with AsyncStorage |
| `stores/download-store.ts` | NATIVE-OWNED | Zustand store for download state |
| `stores/offline-store.ts` | NATIVE-OWNED | Zustand store with Mapbox integration |
| `stores/settings-store.ts` | NATIVE-OWNED | Zustand store for theme/onboarding |
| `lib/ai/local-model.ts` | NATIVE-OWNED | Native module bridge orchestration |
| `lib/ai/background-download-service.ts` | NATIVE-OWNED | Expo BackgroundFetch orchestration |
| `lib/ai/persistent-download-manager.ts` | NATIVE-OWNED | Download state with FileSystem |
| `lib/mapbox/offline-manager.ts` | NATIVE-OWNED | Mapbox SDK wrapper |
| `lib/mapbox/wifi-validator.ts` | NATIVE-OWNED | Network state management |
| `lib/ai/NativeMLXBridge.ts` | NATIVE-OWNED | Documentation for native module |
| `lib/ai/model-manifest.ts` | PORT | Uses AsyncStorage, version management |
| `lib/ai/model-download.ts` | PORT | Uses expo-file-system, download logic |
| `lib/mapbox/download-queue.ts` | PORT | Pure queue logic but used by Mapbox |
| `lib/mapbox/styles.ts` | SHARED-TS | Pure constants, no RN deps |
| `lib/mapbox/weather-optimization.ts` | PORT | Uses Mapbox SDK, weather overlay logic |
| `lib/mapbox/coordinate-converter.ts` | SHARED-TS | Pure math, coordinate conversion |
| `lib/model/download-manager.ts` | PORT | Uses expo-file-system, download wrapper |
| `lib/model/gatekeeper.ts` | NATIVE-OWNED | Model gating logic with platform checks |
| `lib/clerk-token-cache.ts` | NATIVE-OWNED | Clerk token orchestration |
| `lib/camera-quick.ts` | SHARED-TS | Pure camera utilities (verify deps) |
| `lib/is-dev-menu.ts` | SHARED-TS | Pure dev detection (verify deps) |
| `lib/notifier-helpers.ts` | SHARED-TS | Pure notification helpers (verify deps) |
| `lib/toast-config.tsx` | NATIVE-OWNED | Toast UI configuration |
| `lib/toast-system.ts` | NATIVE-OWNED | Toast orchestration |
| Test files (`*.test.ts`) | SHARED-TS | Test code, port to platform test suites |
