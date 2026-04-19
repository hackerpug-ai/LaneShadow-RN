# MODEL-ai-model-download.md - Model Download Manager Translation Plan

**Document ID**: MAT-MODEL-AI-MODEL-DOWNLOAD
**Status**: Draft
**Source File**: `react-native/lib/ai/model-download.ts`
**Classification**: PORT
**Priority**: P0 (Model download)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Model download manager with progress tracking and resume support. Handles downloading ML models from remote URLs with WiFi requirement enforcement, storage space validation, and resume capability for interrupted downloads.

---

## Type Definitions

### Input/Output Contracts

```typescript
interface NetworkStatus {
  isConnected: boolean
  type: 'wifi' | 'cellular' | 'none'
}

interface DownloadResult {
  success: boolean
  filePath?: string
  downloadedBytes: number
  error?: string
}

class ModelDownloadManager {
  async downloadModel(url: string, networkStatus: NetworkStatus): Promise<DownloadResult>
}
```

---

## Platform Translation Strategy

### Android (Kotlin)

**Download**: OkHttp with resume support

```kotlin
// ModelDownloadManager.kt
class ModelDownloadManager(
    private val context: Context
) {
    private val downloadDirectory = File(context.filesDir, "models")

    init {
        downloadDirectory.mkdirs()
    }

    suspend fun downloadModel(url: String, networkStatus: NetworkStatus): DownloadResult = withContext(Dispatchers.IO) {
        // Validate WiFi requirement
        if (!isOnWiFi(networkStatus)) {
            return@withContext DownloadResult(
                success = false,
                downloadedBytes = 0,
                error = "Model download requires WiFi connection"
            )
        }

        // Check available storage
        val storageInfo = getFreeDiskStorage()
        val minRequiredBytes = 2L * 1024 * 1024 * 1024 // 2GB

        if (storageInfo < minRequiredBytes) {
            val availableGB = String.format("%.2f", storageInfo / (1024.0 * 1024 * 1024))
            return@withContext DownloadResult(
                success = false,
                downloadedBytes = 0,
                error = "Not enough storage. Need 2GB free space. Available: $availableGB GB"
            )
        }

        // Generate file path from URL
        val fileName = getFileNameFromUrl(url)
        val filePath = File(downloadDirectory, fileName)

        // Check if file already exists (resume support)
        val existingBytes = if (filePath.exists()) filePath.length() else 0
        val resumeHeaders = if (existingBytes > 0) {
            mapOf("Range" to "bytes=$existingBytes-")
        } else {
            emptyMap()
        }

        // Download file
        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        val request = Request.Builder()
            .url(url)
            .apply {
                resumeHeaders.forEach { (k, v) -> addHeader(k, v) }
            }
            .build()

        try {
            val response = client.newCall(request).execute()

            if (response.isSuccessful || response.code == 206) {
                filePath.writeBytes(response.body!!.bytes())
                return@withContext DownloadResult(
                    success = true,
                    filePath = filePath.absolutePath,
                    downloadedBytes = filePath.length()
                )
            } else {
                return@withContext DownloadResult(
                    success = false,
                    downloadedBytes = existingBytes,
                    error = "Download failed with status ${response.code}"
                )
            }
        } catch (error: Exception) {
            return@withContext DownloadResult(
                success = false,
                downloadedBytes = 0,
                error = error.message ?: "Unknown download error"
            )
        }
    }

    private fun isOnWiFi(networkStatus: NetworkStatus): Boolean {
        return networkStatus.isConnected && networkStatus.type == NetworkType.WIFI
    }

    private fun getFreeDiskStorage(): Long {
        val stat = StatFs(Environment.getDataDirectory().absolutePath)
        return stat.availableBlocksLong * stat.blockSizeLong
    }

    private fun getFileNameFromUrl(url: String): String {
        val parts = url.split("/")
        return parts.lastOrNull() ?: "model.bin"
    }
}

data class DownloadResult(
    val success: Boolean,
    val filePath: String? = null,
    val downloadedBytes: Long,
    val error: String? = null
)

enum class NetworkType { WIFI, CELLULAR, NONE }
data class NetworkStatus(val isConnected: Boolean, val type: NetworkType)
```

### iOS (Swift)

**Download**: URLSession with resume support

```swift
// ModelDownloadManager.swift
class ModelDownloadManager {
    private let downloadDirectory: URL

    init() {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        downloadDirectory = paths[0].appendingPathComponent("models")
        try? FileManager.default.createDirectory(at: downloadDirectory, withIntermediateDirectories: true)
    }

    func downloadModel(url: String, networkStatus: NetworkStatus) async -> DownloadResult {
        // Validate WiFi requirement
        guard isOnWiFi(networkStatus) else {
            return DownloadResult(
                success: false,
                downloadedBytes: 0,
                error: "Model download requires WiFi connection"
            )
        }

        // Check available storage
        let storageInfo = getFreeDiskStorage()
        let minRequiredBytes: Int64 = 2 * 1024 * 1024 * 1024 // 2GB

        guard storageInfo >= minRequiredBytes else {
            let availableGB = String(format: "%.2f", Double(storageInfo) / (1024.0 * 1024 * 1024))
            return DownloadResult(
                success: false,
                downloadedBytes: 0,
                error: "Not enough storage. Need 2GB free space. Available: \(availableGB) GB"
            )
        }

        // Generate file path from URL
        let fileName = getFileNameFromUrl(url: url)
        let filePath = downloadDirectory.appendingPathComponent(fileName)

        // Check if file already exists (resume support)
        var existingBytes: Int64 = 0
        if FileManager.default.fileExists(atPath: filePath.path) {
            if let attrs = try? FileManager.default.attributesOfItem(atPath: filePath.path),
               let fileSize = attrs[.size] as? Int64 {
                existingBytes = fileSize
            }
        }

        // Download file
        guard let downloadURL = URL(string: url) else {
            return DownloadResult(
                success: false,
                downloadedBytes: 0,
                error: "Invalid URL"
            )
        }

        var request = URLRequest(url: downloadURL)
        if existingBytes > 0 {
            request.setValue("bytes=\(existingBytes)-", forHTTPHeaderField: "Range")
        }

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 || httpResponse.statusCode == 206 {
                try data.write(to: filePath)
                let attrs = try? FileManager.default.attributesOfItem(atPath: filePath.path)
                let downloadedBytes = (attrs?[.size] as? Int64) ?? 0

                return DownloadResult(
                    success: true,
                    filePath: filePath.path,
                    downloadedBytes: downloadedBytes
                )
            } else {
                return DownloadResult(
                    success: false,
                    downloadedBytes: existingBytes,
                    error: "Download failed with status \((response as? HTTPURLResponse)?.statusCode ?? 0)"
                )
            }
        } catch {
            return DownloadResult(
                success: false,
                downloadedBytes: 0,
                error: error.localizedDescription
            )
        }
    }

    private func isOnWiFi(_ networkStatus: NetworkStatus) -> Bool {
        return networkStatus.isConnected && networkStatus.type == .wifi
    }

    private func getFreeDiskStorage() -> Int64 {
        do {
            let values = try URL(resourceValuesForKeys: [.volumeAvailableCapacityForImportantUsageKey]).resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
            return values.volumeAvailableCapacityForImportantUsage ?? 0
        } catch {
            return 0
        }
    }

    private func getFileNameFromUrl(url: String) -> String {
        let parts = url.split(separator: "/")
        return parts.last ?? "model.bin"
    }
}

struct DownloadResult {
    let success: Bool
    let filePath: String?
    let downloadedBytes: Int64
    let error: String?
}

enum NetworkType { case wifi, cellular, none }
struct NetworkStatus { let isConnected: Bool; let type: NetworkType }
```

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- React Native source: `react-native/lib/ai/model-download.ts`

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
