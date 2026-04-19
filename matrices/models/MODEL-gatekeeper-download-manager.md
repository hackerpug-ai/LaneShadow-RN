# MODEL-gatekeeper-download-manager.md - Gatekeeper Integration Translation Plan

**Source File**: `react-native/lib/model/download-manager.ts`
**Classification**: PORT
**Priority**: P0 (model download gatekeeper)

---

## SOURCE ANALYSIS

### Purpose
Integrates the persistent download manager with the gatekeeper system. Provides progress tracking and resume capability for model downloads with checksum validation.

### Exports
- `GatekeeperDownloadManager` class with:
  - `startDownload(networkStatus)` → `Promise<void>`
  - `getProgress()` → `Promise<ModelDownloadProgress | null>`
  - `canResume()` → `Promise<boolean>`
  - `cancelDownload()` → `Promise<void>`

### Dependencies
- `expo-file-system/legacy` (FileSystem) - File operations
- `../../stores/download-store.ts` (NATIVE-OWNED) - Zustand store for progress
- `../ai/checksum.ts` (PORT) - Checksum validation
- `../ai/persistent-download-manager.ts` (NATIVE-OWNED) - Download orchestration

### Key Behaviors
- WiFi enforcement for downloads
- Storage space validation (2GB required)
- Checksum validation after download
- Progress tracking via Zustand store
- Resume support for interrupted downloads
- Cleanup on cancellation

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// download/GatekeeperDownloadManager.kt
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import java.io.File

data class ModelDownloadProgress(
    val state: DownloadState,
    val progress: Int, // 0-100
    val bytesDownloaded: Long,
    val totalBytes: Long,
    val estimatedTimeRemaining: Int, // seconds
    val lastUpdated: Long,
    val networkType: String
)

enum class DownloadState {
    DOWNLOADING,
    COMPLETED,
    FAILED,
    PAUSED
}

data class NetworkStatus(
    val isConnected: Boolean,
    val type: String // "wifi" | "cellular" | "none"
)

class GatekeeperDownloadManager(
    private val context: Context,
    private val checksumValidator: ChecksumValidator,
    private val downloadStore: DownloadStore // Native equivalent of Zustand store
) {

    private val documentsDir: File by lazy {
        context.filesDir
    }

    private val modelFilePath: File by lazy {
        File(documentsDir, "models/qwen2.5-0.5b-instruct-q4_k_m.gguf")
    }

    private val _progress = MutableStateFlow<ModelDownloadProgress?>(null)
    val progress: StateFlow<ModelDownloadProgress?> = _progress.asStateFlow()

    private var currentDownloadJob: kotlinx.coroutines.Job? = null

    suspend fun startDownload(networkStatus: NetworkStatus? = null) {
        val actualNetworkStatus = networkStatus ?: NetworkStatus(isConnected = true, type = "wifi")

        // Model configuration
        val config = ModelConfig(
            url = "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
            version = "qwen2.5-0.5b-q4_k_m-v1",
            totalBytes = 397_808_192L // 379.4MB
        )

        currentDownloadJob = kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
            try {
                // Validate WiFi requirement
                if (!isOnWiFi(actualNetworkStatus)) {
                    throw Error("Model download requires WiFi connection")
                }

                // Check storage space
                val storageInfo = getFreeDiskStorage()
                val MIN_REQUIRED_BYTES = 2L * 1024 * 1024 * 1024 // 2GB

                if (storageInfo < MIN_REQUIRED_BYTES) {
                    throw Error("Not enough storage")
                }

                // Start download with progress tracking
                val result = downloadWithProgress(config, actualNetworkStatus)

                if (!result.success) {
                    throw Error(result.error ?: "Download failed")
                }

                // Validate checksum
                val expectedChecksum = "6eb923e7d26e9cea28811e1a8e852009b21242fb157b26149d3b188f3a8c8653"
                val checksumResult = checksumValidator.validate(
                    result.filePath!!,
                    expectedChecksum
                )

                if (!checksumResult.valid) {
                    // Delete corrupted file
                    modelFilePath.delete()
                    throw Error("Checksum validation failed - model corrupted")
                }

                // Mark complete
                downloadStore.markComplete(
                    checksumResult.actualChecksum ?: expectedChecksum,
                    result.downloadedBytes
                )

                _progress.value = ModelDownloadProgress(
                    state = DownloadState.COMPLETED,
                    progress = 100,
                    bytesDownloaded = result.downloadedBytes,
                    totalBytes = config.totalBytes,
                    estimatedTimeRemaining = 0,
                    lastUpdated = System.currentTimeMillis(),
                    networkType = "wifi"
                )
            } catch (error: Throwable) {
                _progress.value = ModelDownloadProgress(
                    state = DownloadState.FAILED,
                    progress = 0,
                    bytesDownloaded = 0,
                    totalBytes = config.totalBytes,
                    estimatedTimeRemaining = 0,
                    lastUpdated = System.currentTimeMillis(),
                    networkType = actualNetworkStatus.type
                )
                throw error
            }
        }
    }

    suspend fun getProgress(): ModelDownloadProgress? {
        return _progress.value
    }

    suspend fun canResume(): Boolean {
        return modelFilePath.exists()
    }

    suspend fun cancelDownload() {
        currentDownloadJob?.cancel()
        currentDownloadJob = null

        // Clean up partial file
        try {
            modelFilePath.delete()
        } catch (_: Exception) {
            // Ignore cleanup errors
        }

        _progress.value = null
    }

    private fun isOnWiFi(networkStatus: NetworkStatus): Boolean {
        return networkStatus.isConnected && networkStatus.type == "wifi"
    }

    private suspend fun downloadWithProgress(
        config: ModelConfig,
        networkStatus: NetworkStatus
    ): DownloadResult {
        // Implementation uses platform download manager with progress callbacks
        // This is simplified - actual implementation would integrate with WorkManager
        TODO("Implement download with progress tracking")
    }

    private fun getFreeDiskStorage(): Long {
        val stat = android.os.StatFs(documentsDir.absolutePath)
        return stat.availableBlocksLong * stat.blockSizeLong
    }
}
```

### iOS (Swift)

```swift
// download/GatekeeperDownloadManager.swift
import Foundation
import Combine

struct ModelDownloadProgress {
    let state: DownloadState
    let progress: Int // 0-100
    let bytesDownloaded: Int
    let totalBytes: Int
    let estimatedTimeRemaining: Int // seconds
    let lastUpdated: Int
    let networkType: String
}

enum DownloadState {
    case downloading
    case completed
    case failed
    case paused
}

struct NetworkStatus {
    let isConnected: Bool
    let type: String // "wifi" | "cellular" | "none"
}

class GatekeeperDownloadManager: ObservableObject {

    @Published private(set) var progress: ModelDownloadProgress?

    private let checksumValidator: ChecksumValidator
    private let downloadStore: DownloadStore // Native equivalent of Zustand store
    private var downloadTask: Task<Void, Never>?

    private let documentsURL: URL
    private var modelFilePath: URL {
        documentsURL.appendingPathComponent("models/qwen2.5-0.5b-instruct-q4_k_m.gguf")
    }

    init(
        checksumValidator: ChecksumValidator,
        downloadStore: DownloadStore
    ) {
        self.checksumValidator = checksumValidator
        self.downloadStore = downloadStore

        let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.documentsURL = documentsDir

        // Ensure models directory exists
        try? FileManager.default.createDirectory(
            at: documentsDir.appendingPathComponent("models"),
            withIntermediateDirectories: true
        )
    }

    func startDownload(networkStatus: NetworkStatus? = nil) async throws {
        let actualNetworkStatus = networkStatus ?? NetworkStatus(isConnected: true, type: "wifi")

        // Model configuration
        let config = ModelConfig(
            url: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
            version: "qwen2.5-0.5b-q4_k_m-v1",
            totalBytes: 397_808_192 // 379.4MB
        )

        downloadTask = Task {
            do {
                // Validate WiFi requirement
                if !isOnWiFi(actualNetworkStatus) {
                    throw NSError(domain: "Download", code: -1, userInfo: [NSLocalizedDescriptionKey: "Model download requires WiFi connection"])
                }

                // Check storage space
                let storageInfo = try getFreeDiskStorage()
                let MIN_REQUIRED_BYTES = 2 * 1024 * 1024 * 1024 // 2GB

                if storageInfo < MIN_REQUIRED_BYTES {
                    throw NSError(domain: "Download", code: -1, userInfo: [NSLocalizedDescriptionKey: "Not enough storage"])
                }

                // Start download with progress tracking
                let result = try await downloadWithProgress(config: config, networkStatus: actualNetworkStatus)

                if !result.success {
                    throw NSError(domain: "Download", code: -1, userInfo: [NSLocalizedDescriptionKey: result.error ?? "Download failed"])
                }

                // Validate checksum
                let expectedChecksum = "6eb923e7d26e9cea28811e1a8e852009b21242fb157b26149d3b188f3a8c8653"
                let checksumResult = await checksumValidator.validate(
                    filePath: result.filePath!!,
                    expectedChecksum: expectedChecksum
                )

                if !checksumResult.valid {
                    // Delete corrupted file
                    try? FileManager.default.removeItem(atPath: modelFilePath.path)
                    throw NSError(domain: "Download", code: -1, userInfo: [NSLocalizedDescriptionKey: "Checksum validation failed - model corrupted"])
                }

                // Mark complete
                await downloadStore.markComplete(
                    checksum: checksumResult.actualChecksum ?? expectedChecksum,
                    bytesDownloaded: result.downloadedBytes
                )

                self.progress = ModelDownloadProgress(
                    state: .completed,
                    progress: 100,
                    bytesDownloaded: result.downloadedBytes,
                    totalBytes: config.totalBytes,
                    estimatedTimeRemaining: 0,
                    lastUpdated: Int(Date().timeIntervalSince1970),
                    networkType: "wifi"
                )
            } catch {
                self.progress = ModelDownloadProgress(
                    state: .failed,
                    progress: 0,
                    bytesDownloaded: 0,
                    totalBytes: config.totalBytes,
                    estimatedTimeRemaining: 0,
                    lastUpdated: Int(Date().timeIntervalSince1970),
                    networkType: actualNetworkStatus.type
                )
                throw error
            }
        }

        try await downloadTask?.value
    }

    func getProgress() -> ModelDownloadProgress? {
        return progress
    }

    func canResume() -> Bool {
        return FileManager.default.fileExists(atPath: modelFilePath.path)
    }

    func cancelDownload() async {
        downloadTask?.cancel()
        downloadTask = nil

        // Clean up partial file
        try? FileManager.default.removeItem(atPath: modelFilePath.path)

        self.progress = nil
    }

    private func isOnWiFi(_ networkStatus: NetworkStatus) -> Bool {
        return networkStatus.isConnected && networkStatus.type == "wifi"
    }

    private func downloadWithProgress(
        config: ModelConfig,
        networkStatus: NetworkStatus
    ) async throws -> DownloadResult {
        // Implementation uses URLSession with progress tracking
        // This is simplified - actual implementation would use URLSessionDownloadDelegate
        TODO("Implement download with progress tracking")
    }

    private func getFreeDiskStorage() throws -> Int {
        let values = try documentsURL.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
        guard let availableBytes = values.volumeAvailableCapacityForImportantUsage else {
            throw NSError(domain: "Storage", code: -1, userInfo: [NSLocalizedDescriptionKey: "Cannot get storage info"])
        }

        return availableBytes
    }
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **WiFi Enforcement**: MUST reject downloads on cellular
2. **Storage Validation**: MUST require 2GB free space
3. **Checksum Validation**: MUST validate SHA-256 after download
4. **Progress Tracking**: MUST update progress state via store
5. **Resume Support**: MUST detect existing partial file
6. **Cleanup**: MUST delete partial file on cancellation

### Edge Cases
- Not on WiFi → throw error
- Insufficient storage → throw error
- Checksum mismatch → delete file, throw error
- Cancel while downloading → clean up file, reset state

### Integration Points
- Uses `ChecksumValidator` from checksum.ts (PORT)
- Uses `DownloadStore` from stores/download-store.ts (NATIVE-OWNED)
- Uses `PersistentDownloadManager` from persistent-download-manager.ts (NATIVE-OWNED)

---

## DEPENDENCIES

### Translation Order
- MUST translate AFTER `lib/ai/checksum.ts` (PORT) - uses ChecksumValidator
- MUST translate AFTER `stores/download-store.ts` (NATIVE-OWNED) - uses DownloadStore
- MUST translate AFTER `lib/ai/persistent-download-manager.ts` (NATIVE-OWNED) - uses PersistentDownloadManager

### Integration Points
- Used by `lib/model/gatekeeper.ts` (NATIVE-OWNED) for download orchestration
- UI components for download progress display

### Test Porting
- Port integration tests to platform tests
- Test WiFi enforcement
- Test checksum validation flow
- Test progress tracking
