# MODEL-model-download.md - Download Logic Translation Plan

**Source File**: `react-native/lib/ai/model-download.ts`
**Classification**: PORT
**Priority**: P0 (model download flow)

---

## SOURCE ANALYSIS

### Purpose
Handles ML model downloads with WiFi requirement enforcement, storage space validation, and resume support for interrupted downloads.

### Exports
- `ModelDownloadManager` class with:
  - `downloadModel(url, networkStatus)` → `Promise<DownloadResult>`
  - Private `isOnWiFi(networkStatus)` → `boolean`
  - Private `ensureDirectoryExists()` → `Promise<void>`
  - Private `getFileNameFromUrl(url)` → `string`
  - Private `getExistingFileSize(filePath)` → `Promise<number>`

### Dependencies
- `expo-file-system/legacy` (FileSystem) - Download operations
- `./types.ts` (SHARED-TS) - DownloadResult, NetworkStatus types

### Key Behaviors
- WiFi enforcement (rejects cellular downloads)
- Storage space validation (requires 2GB free)
- Resume support via HTTP Range headers
- Download directory auto-creation
- URL parsing for filename extraction

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// download/ModelDownloadManager.kt
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class DownloadResult(
    val success: Boolean,
    val filePath: String? = null,
    val downloadedBytes: Long = 0,
    val error: String? = null
)

data class NetworkStatus(
    val isConnected: Boolean,
    val type: String // "wifi" | "cellular" | "none"
)

class ModelDownloadManager(private val context: Context) {

    private val downloadDirectory: File by lazy {
        File(context.filesDir, "models").apply { mkdirs() }
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

        try {
            // Check available storage space
            val storageInfo = getFreeDiskStorage()
            val MIN_REQUIRED_BYTES = 2L * 1024 * 1024 * 1024 // 2GB

            if (storageInfo < MIN_REQUIRED_BYTES) {
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
            val existingBytes = getExistingFileSize(filePath)
            val resumeHeader = if (existingBytes > 0) {
                mapOf("Range" to "bytes=$existingBytes-")
            } else {
                emptyMap()
            }

            // Download file
            val result = downloadFile(url, filePath, resumeHeader)

            if (result.success) {
                val fileSize = filePath.length()
                DownloadResult(
                    success = true,
                    filePath = filePath.absolutePath,
                    downloadedBytes = fileSize
                )
            } else {
                DownloadResult(
                    success = false,
                    downloadedBytes = existingBytes,
                    error = result.error
                )
            }
        } catch (error: Throwable) {
            DownloadResult(
                success = false,
                downloadedBytes = 0,
                error = error.message ?: "Unknown download error"
            )
        }
    }

    private fun isOnWiFi(networkStatus: NetworkStatus): Boolean {
        return networkStatus.isConnected && networkStatus.type == "wifi"
    }

    private fun getFileNameFromUrl(url: String): String {
        val urlParts = url.split("/")
        return urlParts.lastOrNull() ?: "model.bin"
    }

    private suspend fun getExistingFileSize(file: File): Long = withContext(Dispatchers.IO) {
        if (file.exists()) file.length() else 0L
    }

    private suspend fun downloadFile(
        url: String,
        destination: File,
        headers: Map<String, String>
    ): DownloadResult = withContext(Dispatchers.IO) {
        var connection: HttpURLConnection? = null
        try {
            val urlObj = URL(url)
            connection = urlObj.openConnection() as HttpURLConnection

            // Set headers
            headers.forEach { (key, value) ->
                connection.setRequestProperty(key, value)
            }

            connection.connectTimeout = 30000
            connection.readTimeout = 30000

            val responseCode = connection.responseCode

            if (responseCode == HttpURLConnection.HTTP_OK ||
                responseCode == HttpURLConnection.HTTP_PARTIAL) {
                // Download to temporary file first
                val tempFile = File(destination.absolutePath + ".tmp")

                connection.inputStream.use { input ->
                    tempFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }

                // Atomic rename
                if (!tempFile.renameTo(destination)) {
                    throw IllegalStateException("Failed to rename downloaded file")
                }

                DownloadResult(success = true)
            } else {
                DownloadResult(
                    success = false,
                    error = "Download failed with status $responseCode"
                )
            }
        } catch (error: Throwable) {
            DownloadResult(
                success = false,
                error = error.message ?: "Download error"
            )
        } finally {
            connection?.disconnect()
        }
    }

    private fun getFreeDiskStorage(): Long {
        val stat = android.os.StatFs(context.filesDir.absolutePath)
        return stat.availableBlocksLong * stat.blockSizeLong
    }
}
```

### iOS (Swift)

```swift
// download/ModelDownloadManager.swift
import Foundation

struct DownloadResult {
    let success: Bool
    let filePath: String?
    let downloadedBytes: Int
    let error: String?
}

struct NetworkStatus {
    let isConnected: Bool
    let type: String // "wifi" | "cellular" | "none"
}

class ModelDownloadManager {

    private let downloadDirectory: URL

    init() {
        let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.downloadDirectory = documentsDir.appendingPathComponent("models")

        // Ensure directory exists
        try? FileManager.default.createDirectory(at: downloadDirectory, withIntermediateDirectories: true)
    }

    func downloadModel(url: String, networkStatus: NetworkStatus) async -> DownloadResult {
        // Validate WiFi requirement
        if !isOnWiFi(networkStatus: networkStatus) {
            return DownloadResult(
                success: false,
                downloadedBytes: 0,
                error: "Model download requires WiFi connection"
            )
        }

        do {
            // Check available storage space
            let storageInfo = try getFreeDiskStorage()
            let MIN_REQUIRED_BYTES = 2 * 1024 * 1024 * 1024 // 2GB

            if storageInfo < MIN_REQUIRED_BYTES {
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
            let existingBytes = getExistingFileSize(file: filePath)
            var resumeHeader: [String: String] = [:]

            if existingBytes > 0 {
                resumeHeader["Range"] = "bytes=\(existingBytes)-"
            }

            // Download file
            let result = try await downloadFile(
                url: url,
                destination: filePath,
                headers: resumeHeader
            )

            if result.success {
                let fileAttributes = try FileManager.default.attributesOfItem(atPath: filePath.path)
                let fileSize = fileAttributes[.size] as? Int ?? 0

                return DownloadResult(
                    success: true,
                    filePath: filePath.path,
                    downloadedBytes: fileSize
                )
            } else {
                return DownloadResult(
                    success: false,
                    downloadedBytes: existingBytes,
                    error: result.error
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

    private func isOnWiFi(networkStatus: NetworkStatus) -> Bool {
        return networkStatus.isConnected && networkStatus.type == "wifi"
    }

    private func getFileNameFromUrl(url: String) -> String {
        guard let urlObj = URL(string: url) else {
            return "model.bin"
        }

        return urlObj.lastPathComponent.isEmpty ? "model.bin" : urlObj.lastPathComponent
    }

    private func getExistingFileSize(file: URL) -> Int {
        guard FileManager.default.fileExists(atPath: file.path),
              let attrs = try? FileManager.default.attributesOfItem(atPath: file.path),
              let fileSize = attrs[.size] as? Int else {
            return 0
        }

        return fileSize
    }

    private func downloadFile(
        url: String,
        destination: URL,
        headers: [String: String]
    ) async throws -> DownloadResult {
        var request = URLRequest(url: URL(string: url)!)

        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        let (tempURL, response) = try await URLSession.shared.download(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            return DownloadResult(success: false, error: "Invalid response")
        }

        if httpResponse.statusCode == 200 || httpResponse.statusCode == 206 {
            // Atomic move
            _ = FileManager.default.replaceItem(
                at: destination,
                withItemAt: tempURL,
                backupItemName: nil,
                options: [],
                resultingItemURL: nil
            )

            return DownloadResult(success: true)
        } else {
            return DownloadResult(
                success: false,
                error: "Download failed with status \(httpResponse.statusCode)"
            )
        }
    }

    private func getFreeDiskStorage() throws -> Int {
        let values = URLResourceValues(keys: [.volumeAvailableCapacityForImportantUsageKey])
        try downloadDirectory.resourceValues(forKeys: values.keys)

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
1. **WiFi Enforcement**: MUST reject downloads on cellular networks
2. **Storage Validation**: MUST require 2GB free space before download
3. **Resume Support**: MUST use HTTP Range headers for partial downloads
4. **Directory Creation**: MUST auto-create download directory
5. **Error Handling**: MUST return DownloadResult with error message on failure
6. **Atomic Write**: Downloaded file MUST be written atomically (temp + rename)

### Edge Cases
- Not on WiFi → return error "Model download requires WiFi connection"
- Insufficient storage → return error with available GB
- Partial file exists → resume from existing byte offset
- Download directory doesn't exist → create before download

### Download Specifications
- Minimum storage: 2GB
- Chunk size: Platform-default ( URLSession / HttpURLConnection )
- Timeout: 30 seconds connect, 30 seconds read
- HTTP codes accepted: 200 (OK), 206 (Partial Content)

---

## DEPENDENCIES

### Translation Order
- MUST translate AFTER `lib/ai/types.ts` (SHARED-TS) - uses NetworkStatus, DownloadResult

### Integration Points
- Used by `lib/ai/persistent-download-manager.ts` (NATIVE-OWNED) for download orchestration
- Used by `lib/model/download-manager.ts` (PORT) for gatekeeper integration
- UI components for download progress display

### Test Porting
- Port `lib/ai/__tests__/model-download.test.ts` to:
  - Android: JVM tests in `android/app/src/test/kotlin/download/ModelDownloadManagerTest.kt`
  - iOS: XCTest in `ios/LaneShadowTests/ModelDownloadManagerTests.swift`
