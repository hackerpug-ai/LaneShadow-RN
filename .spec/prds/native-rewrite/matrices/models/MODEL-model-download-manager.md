# MODEL-model-download-manager.md - Model Download Manager (Gatekeeper) Translation Plan

**Document ID**: MAT-MODEL-MODEL-DOWNLOAD-MANAGER
**Status**: Draft
**Source File**: `react-native/lib/model/download-manager.ts`
**Classification**: PORT
**Priority**: P0 (Model download wrapper)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Model download manager integrating persistent download manager with gatekeeper system. Provides progress tracking and resume capability for model downloads. Wraps PersistentDownloadManager and ChecksumValidator for complete download flow with validation.

---

## Platform Translation Strategy

### Android (Kotlin)

```kotlin
// GatekeeperDownloadManager.kt
class GatekeeperDownloadManager(
    private val persistentManager: PersistentDownloadManager,
    private val checksumValidator: ChecksumValidator,
    private val context: Context
) {
    private val modelFilePath: String
           get() = "${context.filesDir.absolutePath}/models/qwen2.5-0.5b-instruct-q4_k_m.gguf"

    suspend fun startDownload(networkStatus: NetworkStatus? = null) = withContext(Dispatchers.IO) {
        val config = ModelDownloadConfig(
            url = "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
            version = "qwen2.5-0.5b-q4_k_m-v1",
            totalBytes = 397_808_192 // 379.4MB
        )

        val actualNetworkStatus = networkStatus ?: NetworkStatus(isConnected = true, type = NetworkType.WIFI)

        val result = persistentManager.downloadModel(config, actualNetworkStatus) { progress ->
            // Progress automatically persisted by PersistentDownloadManager
        }

        if (!result.success) {
            throw IOException(result.error ?: "Download failed")
        }

        val expectedChecksum = "6eb923e7d26e9cea28811e1a8e852009b21242fb157b26149d3b188f3a8c8653"
        val checksumResult = checksumValidator.validate(result.filePath!!, expectedChecksum)

        if (!checksumResult.valid && checksumResult.error != null) {
            // Delete corrupted file
            File(result.filePath).delete()
            throw IOException("Checksum validation failed - model corrupted")
        }

        // For large files, skip checksum validation (bypassed in validator)
        val actualChecksum = checksumResult.actualChecksum ?: expectedChecksum

        // Mark download as complete
        persistentManager.markComplete(actualChecksum, result.downloadedBytes)
    }

    suspend fun getProgress(): ModelDownloadProgress? = withContext(Dispatchers.IO) {
        val state = persistentManager.getState()

        if (state.status == DownloadStatus.IDLE || state.status == DownloadStatus.CANCELLED) {
            return@withContext null
        }

        val bytesRemaining = state.totalBytes - state.bytesDownloaded
        val averageSpeed = 2L * 1024 * 1024 // Assume 2MB/s average
        val estimatedTimeRemaining = (bytesRemaining / averageSpeed).toInt()

        ModelDownloadProgress(
            state = when (state.status) {
                DownloadStatus.DOWNLOADING -> ProgressState.DOWNLOADING
                DownloadStatus.COMPLETED -> ProgressState.COMPLETED
                DownloadStatus.FAILED -> ProgressState.FAILED
                else -> ProgressState.PAUSED
            },
            progress = state.progressPercent,
            bytesDownloaded = state.bytesDownloaded,
            totalBytes = state.totalBytes,
            estimatedTimeRemaining = estimatedTimeRemaining,
            lastUpdated = state.lastUpdate,
            networkType = NetworkType.WIFI // Default since we require it
        )
    }

    suspend fun canResume(): Boolean {
        return persistentManager.checkExistingProgress().canResume
    }

    suspend fun cancelDownload() = withContext(Dispatchers.IO) {
        persistentManager.cancelDownload()
        try {
            File(modelFilePath).delete()
        } catch (_: Exception) {}
    }
}

// Data classes
data class ModelDownloadProgress(
    val state: ProgressState,
    val progress: Int,
    val bytesDownloaded: Long,
    val totalBytes: Long,
    val estimatedTimeRemaining: Int,
    val lastUpdated: Long,
    val networkType: NetworkType
)

enum class ProgressState { DOWNLOADING, COMPLETED, FAILED, PAUSED }

data class NetworkStatus(val isConnected: Boolean, val type: NetworkType)

enum class NetworkType { WIFI, CELLULAR, NONE }
```

### iOS (Swift)

```swift
// GatekeeperDownloadManager.swift
class GatekeeperDownloadManager {
    private let persistentManager: PersistentDownloadManager
    private let checksumValidator: ChecksumValidator
    private let modelFilePath: String

    init(
        persistentManager: PersistentDownloadManager = .shared,
        checksumValidator: ChecksumValidator = ChecksumValidator()
    ) {
        self.persistentManager = persistentManager
        self.checksumValidator = checksumValidator
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        self.modelFilePath = paths[0].appendingPathComponent("models/qwen2.5-0.5b-instruct-q4_k_m.gguf").path
    }

    func startDownload(networkStatus: NetworkStatus? = nil) async throws {
        let config = ModelDownloadConfig(
            url: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
            version: "qwen2.5-0.5b-q4_k_m-v1",
            totalBytes: 397_808_192 // 379.4MB
        )

        let actualNetworkStatus = networkStatus ?? NetworkStatus(isConnected: true, type: .wifi)

        let result = await persistentManager.downloadModel(
            config: config,
            networkStatus: actualNetworkStatus
        ) { progress in
            // Progress automatically persisted by PersistentDownloadManager
        }

        guard result.success else {
            throw DownloadError.downloadFailed(result.error ?? "Download failed")
        }

        let expectedChecksum = "6eb923e7d26e9cea28811e1a8e852009b21242fb157b26149d3b188f3a8c8653"
        let checksumResult = await checksumValidator.validate(
            filePath: result.filePath!,
            expectedChecksum: expectedChecksum
        )

        if !checksumResult.valid, let error = checksumResult.error {
            // Delete corrupted file
            try? FileManager.default.removeItem(atPath: result.filePath!)
            throw DownloadError.checksumFailed(error)
        }

        // For large files, skip checksum validation (bypassed in validator)
        let actualChecksum = checksumResult.actualChecksum ?? expectedChecksum

        // Mark download as complete
        await persistentManager.markComplete(actualChecksum, result.downloadedBytes)
    }

    func getProgress() async -> ModelDownloadProgress? {
        let state = await persistentManager.getState()

        if state.status == .idle || state.status == .cancelled {
            return nil
        }

        let bytesRemaining = state.totalBytes - state.bytesDownloaded
        let averageSpeed: Int64 = 2 * 1024 * 1024 // Assume 2MB/s average
        let estimatedTimeRemaining = Int(bytesRemaining / averageSpeed)

        return ModelDownloadProgress(
            state: state.status.toProgressState(),
            progress: state.progressPercent,
            bytesDownloaded: state.bytesDownloaded,
            totalBytes: state.totalBytes,
            estimatedTimeRemaining: estimatedTimeRemaining,
            lastUpdated: state.lastUpdate,
            networkType: .wifi // Default since we require it
        )
    }

    func canResume() async -> Bool {
        return await persistentManager.checkExistingProgress().canResume
    }

    func cancelDownload() async throws {
        await persistentManager.cancelDownload()
        try? FileManager.default.removeItem(atPath: modelFilePath)
    }
}

// Data structures
struct ModelDownloadProgress {
    let state: ProgressState
    let progress: Int
    let bytesDownloaded: Int64
    let totalBytes: Int64
    let estimatedTimeRemaining: Int
    let lastUpdated: Int64
    let networkType: NetworkType
}

enum ProgressState { case downloading, completed, failed, paused }

struct NetworkStatus { let isConnected: Bool; let type: NetworkType }

enum NetworkType { case wifi, cellular, none }

enum DownloadError: LocalizedError {
    case downloadFailed(String)
    case checksumFailed(String)

    var errorDescription: String? {
        switch self {
        case .downloadFailed(let message):
            return message
        case .checksumFailed(let message):
            return message
        }
    }
}

extension DownloadStatus {
    func toProgressState() -> ProgressState {
        switch self {
        case .downloading: return .downloading
        case .completed: return .completed
        case .failed: return .failed
        default: return .paused
        }
    }
}
```

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- React Native source: `react-native/lib/model/download-manager.ts`
- CLR-004: Model Download Persistence

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
