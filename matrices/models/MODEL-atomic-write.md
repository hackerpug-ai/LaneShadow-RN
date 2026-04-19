# MODEL-atomic-write.md - Atomic File Operations Translation Plan

**Source File**: `react-native/lib/ai/atomic-write.ts`
**Classification**: PORT
**Priority**: P1 (download integrity)

---

## SOURCE ANALYSIS

### Purpose
Provides atomic file operations to prevent partial file corruption in case of crashes or interruptions during download. Uses POSIX atomic rename guarantees.

### Exports
- `atomicWrite(filePath, data)` → `Promise<AtomicWriteResult>`
- `atomicAppend(filePath, chunk, offset)` → `Promise<AtomicWriteResult>`
- `atomicDelete(filePath)` → `Promise<boolean>`
- `verifyFile(filePath, expectedSize, tolerance)` → `Promise<VerificationResult>`

### Dependencies
- `expo-file-system/legacy` (FileSystem) - File operations

### Key Behaviors
- Write to temporary file (.tmp) first
- Verify temporary file exists and has content
- Atomic rename from temp to final path (POSIX guarantee)
- Append support for resume capability (read+write pattern)
- Idempotent delete operations

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// storage/AtomicWriteUtils.kt
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class AtomicWriteResult(
    val success: Boolean,
    val filePath: String? = null,
    val error: String? = null
)

data class VerificationResult(
    val valid: Boolean,
    val actualSize: Long? = null,
    val error: String? = null
)

object AtomicWriteUtils {

    suspend fun atomicWrite(filePath: String, data: String): AtomicWriteResult = withContext(Dispatchers.IO) {
        val tempPath = "$filePath.tmp"
        val tempFile = File(tempPath)
        val targetFile = File(filePath)

        try {
            // Step 1: Write to temporary file
            tempFile.writeText(data)

            // Step 2: Verify temporary file exists and has content
            if (!tempFile.exists() || tempFile.length() == 0L) {
                throw IllegalStateException("Temporary file verification failed")
            }

            // Step 3: Atomic rename (guaranteed to be atomic on POSIX)
            if (!tempFile.renameTo(targetFile)) {
                throw IllegalStateException("Atomic rename failed")
            }

            AtomicWriteResult(success = true, filePath = filePath)
        } catch (error: Throwable) {
            // Clean up temporary file on failure
            try {
                tempFile.delete()
            } catch (_: Throwable) {
                // Ignore cleanup errors
            }

            AtomicWriteResult(
                success = false,
                error = error.message ?: "Unknown error"
            )
        }
    }

    suspend fun atomicAppend(
        filePath: String,
        chunk: String,
        offset: Long
    ): AtomicWriteResult = withContext(Dispatchers.IO) {
        val tempPath = "$filePath.tmp.$offset"
        val tempFile = File(tempPath)
        val targetFile = File(filePath)

        try {
            // Step 1: Write chunk to temporary file
            tempFile.writeText(chunk)

            // Step 2: Verify chunk was written
            if (!tempFile.exists() || tempFile.length() == 0L) {
                throw IllegalStateException("Chunk verification failed")
            }

            // Step 3: Append to main file
            val existingData = if (targetFile.exists()) {
                targetFile.readText()
            } else {
                ""
            }

            val combinedData = existingData + chunk
            val result = atomicWrite(filePath, combinedData)

            // Clean up temporary chunk file
            tempFile.delete()

            result
        } catch (error: Throwable) {
            // Clean up temporary file on failure
            try {
                tempFile.delete()
            } catch (_: Throwable) {
                // Ignore cleanup errors
            }

            AtomicWriteResult(
                success = false,
                error = error.message ?: "Unknown error"
            )
        }
    }

    suspend fun atomicDelete(filePath: String): Boolean = withContext(Dispatchers.IO) {
        try {
            File(filePath).delete()
        } catch (_: Throwable) {
            false
        }
    }

    suspend fun verifyFile(
        filePath: String,
        expectedSize: Long,
        tolerance: Long = 0
    ): VerificationResult = withContext(Dispatchers.IO) {
        try {
            val file = File(filePath)

            if (!file.exists()) {
                return@withContext VerificationResult(
                    valid = false,
                    error = "File does not exist"
                )
            }

            val actualSize = file.length()
            val sizeDiff = kotlin.math.abs(actualSize - expectedSize)

            if (sizeDiff > tolerance) {
                return@withContext VerificationResult(
                    valid = false,
                    actualSize = actualSize,
                    error = "Size mismatch: expected $expectedSize, got $actualSize"
                )
            }

            VerificationResult(valid = true, actualSize = actualSize)
        } catch (error: Throwable) {
            VerificationResult(
                valid = false,
                error = error.message ?: "Unknown error"
            )
        }
    }
}
```

### iOS (Swift)

```swift
// storage/AtomicWriteUtils.swift
import Foundation

struct AtomicWriteResult {
    let success: Bool
    let filePath: String?
    let error: String?
}

struct VerificationResult {
    let valid: Bool
    let actualSize: Int?
    let error: String?
}

enum AtomicWriteError: Error {
    case temporaryFileVerificationFailed
    case atomicRenameFailed
}

class AtomicWriteUtils {

    static func atomicWrite(filePath: String, data: String) async -> AtomicWriteResult {
        let tempPath = "\(filePath).tmp"
        let tempURL = URL(fileURLWithPath: tempPath)
        let targetURL = URL(fileURLWithPath: filePath)

        do {
            // Step 1: Write to temporary file
            try data.write(to: tempURL, atomically: true, encoding: .utf8)

            // Step 2: Verify temporary file exists and has content
            guard FileManager.default.fileExists(atPath: tempPath),
                  let attrs = try? FileManager.default.attributesOfItem(atPath: tempPath),
                  let fileSize = attrs[.size] as? Int64,
                  fileSize > 0 else {
                return AtomicWriteResult(
                    success: false,
                    error: "Temporary file verification failed"
                )
            }

            // Step 3: Atomic rename (guaranteed to be atomic on POSIX)
            try FileManager.default.moveItem(at: tempURL, to: targetURL)

            return AtomicWriteResult(success: true, filePath: filePath)
        } catch {
            // Clean up temporary file on failure
            try? FileManager.default.removeItem(at: tempURL)

            return AtomicWriteResult(
                success: false,
                error: error.localizedDescription
            )
        }
    }

    static func atomicAppend(filePath: String, chunk: String, offset: Int) async -> AtomicWriteResult {
        let tempPath = "\(filePath).tmp.\(offset)"
        let tempURL = URL(fileURLWithPath: tempPath)
        let targetURL = URL(fileURLWithPath: filePath)

        do {
            // Step 1: Write chunk to temporary file
            try chunk.write(to: tempURL, atomically: true, encoding: .utf8)

            // Step 2: Verify chunk was written
            guard FileManager.default.fileExists(atPath: tempPath),
                  let attrs = try? FileManager.default.attributesOfItem(atPath: tempPath),
                  let fileSize = attrs[.size] as? Int64,
                  fileSize > 0 else {
                return AtomicWriteResult(
                    success: false,
                    error: "Chunk verification failed"
                )
            }

            // Step 3: Append to main file
            let existingData = (try? String(contentsOf: targetURL)) ?? ""
            let combinedData = existingData + chunk
            let result = await atomicWrite(filePath: filePath, data: combinedData)

            // Clean up temporary chunk file
            try? FileManager.default.removeItem(at: tempURL)

            return result
        } catch {
            // Clean up temporary file on failure
            try? FileManager.default.removeItem(at: tempURL)

            return AtomicWriteResult(
                success: false,
                error: error.localizedDescription
            )
        }
    }

    static func atomicDelete(filePath: String) async -> Bool {
        do {
            try FileManager.default.removeItem(atPath: filePath)
            return true
        } catch {
            return false
        }
    }

    static func verifyFile(filePath: String, expectedSize: Int, tolerance: Int = 0) async -> VerificationResult {
        let fileURL = URL(fileURLWithPath: filePath)

        guard FileManager.default.fileExists(atPath: filePath) else {
            return VerificationResult(
                valid: false,
                error: "File does not exist"
            )
        }

        guard let attrs = try? FileManager.default.attributesOfItem(atPath: filePath),
              let actualSize = attrs[.size] as? Int else {
            return VerificationResult(
                valid: false,
                error: "Cannot read file size"
            )
        }

        let sizeDiff = abs(actualSize - expectedSize)

        if sizeDiff > tolerance {
            return VerificationResult(
                valid = false,
                actualSize: actualSize,
                error: "Size mismatch: expected \(expectedSize), got \(actualSize)"
            )
        }

        return VerificationResult(valid: true, actualSize: actualSize)
    }
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **Atomic Write**: MUST use POSIX atomic rename (write to .tmp, then rename)
2. **Verification**: Temporary file MUST be verified before rename (exists + non-empty)
3. **Cleanup**: On failure, MUST clean up temporary files
4. **Append**: atomicAppend MUST preserve existing content + add new chunk
5. **Delete**: atomicDelete MUST be idempotent (success even if file doesn't exist)
6. **File Verification**: verifyFile MUST check existence, size, and tolerance

### Edge Cases
- Temporary file verification fails → return error, clean up temp file
- Atomic rename fails → return error, clean up temp file
- Target file doesn't exist (for append) → treat as empty, proceed with write
- Delete non-existent file → return true (idempotent)

### Atomic Guarantees
- On POSIX systems, rename() is atomic — either old file exists OR new file exists, never both
- Android: File.renameTo() is atomic on same filesystem
- iOS: FileManager.moveItem() is atomic on same filesystem

---

## DEPENDENCIES

### Translation Order
- No dependencies on other business logic files
- Can be translated independently

### Integration Points
- Used by `lib/ai/model-download.ts` (PORT) for download operations
- Used by `lib/ai/persistent-download-manager.ts` (NATIVE-OWNED) for chunked downloads

### Test Porting
- Port `lib/ai/__tests__/storage.test.ts` to:
  - Android: JVM tests in `android/app/src/test/kotlin/storage/AtomicWriteUtilsTest.kt`
  - iOS: XCTest in `ios/LaneShadowTests/AtomicWriteUtilsTests.swift`
