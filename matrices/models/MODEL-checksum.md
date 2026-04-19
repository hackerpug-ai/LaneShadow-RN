# MODEL-checksum.md - SHA-256 Validation Translation Plan

**Source File**: `react-native/lib/ai/checksum.ts`
**Classification**: PORT
**Priority**: P0 (model validation, used by gatekeeper)

---

## SOURCE ANALYSIS

### Purpose
Validates model file integrity using SHA-256 checksums before loading to prevent corrupted models from causing runtime errors or incorrect inference results.

### Exports
- `ChecksumValidator` class with:
  - `validate(filePath, expectedChecksum)` → `Promise<ChecksumResult>`
  - Private `computeSHA256(filePath)` → `Promise<string>`
  - Private `base64ToHex(base64)` → `string`

### Dependencies
- `expo-crypto` (Crypto.digestStringAsync) - SHA-256 hash computation
- `expo-file-system/legacy` (FileSystem) - Chunked file reading
- `./types.ts` (SHARED-TS) - ChecksumResult type

### Key Behaviors
- Chunked reading (1MB chunks) to avoid loading large files into memory
- For files > 50MB, bypasses validation (returns empty checksum)
- Converts base64 digest to hex format
- Returns validation result with actual checksum for debugging

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// checksum/ChecksumValidator.kt
import java.io.File
import java.security.MessageDigest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ChecksumValidator {

    suspend fun validate(filePath: String, expectedChecksum: String): ChecksumResult {
        return try {
            val actualChecksum = computeSHA256(filePath)
            ChecksumResult(
                valid = actualChecksum == expectedChecksum,
                actualChecksum = actualChecksum
            )
        } catch (error: Throwable) {
            ChecksumResult(
                valid = false,
                error = error.message ?: "Unknown error"
            )
        }
    }

    private suspend fun computeSHA256(filePath: String): String = withContext(Dispatchers.IO) {
        val file = File(filePath)
        if (!file.exists()) {
            throw IllegalArgumentException("File does not exist")
        }

        val fileSize = file.length()
        if (fileSize == 0L) {
            throw IllegalArgumentException("File is empty")
        }

        // Bypass validation for large files (> 50MB)
        if (fileSize > 50 * 1024 * 1024) {
            return@withContext ""
        }

        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (input.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }

        digest.digest().joinToString("") { "%02x".format(it) }
    }
}

data class ChecksumResult(
    val valid: Boolean,
    val actualChecksum: String? = null,
    val error: String? = null
)
```

### iOS (Swift)

```swift
// checksum/ChecksumValidator.swift
import Foundation
import CryptoKit

class ChecksumValidator {

    func validate(filePath: String, expectedChecksum: String) async -> ChecksumResult {
        do {
            let actualChecksum = await computeSHA256(filePath: filePath)
            return ChecksumResult(
                valid: actualChecksum == expectedChecksum,
                actualChecksum: actualChecksum
            )
        } catch {
            return ChecksumResult(
                valid: false,
                error: error.localizedDescription
            )
        }
    }

    private func computeSHA256(filePath: String) async -> String {
        let fileURL = URL(fileURLWithPath: filePath)

        guard FileManager.default.fileExists(atPath: filePath) else {
            throw ChecksumError.fileDoesNotExist
        }

        let fileSize = try FileManager.default.attributesOfItem(atPath: filePath)[.size] as? Int64 ?? 0

        guard fileSize > 0 else {
            throw ChecksumError.fileIsEmpty
        }

        // Bypass validation for large files (> 50MB)
        if fileSize > 50 * 1024 * 1024 {
            return ""
        }

        let data = try Data(contentsOf: fileURL)
        let digest = SHA256.hash(data: data)

        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }
}

struct ChecksumResult {
    let valid: Bool
    let actualChecksum: String?
    let error: String?
}

enum ChecksumError: Error {
    case fileDoesNotExist
    case fileIsEmpty
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **SHA-256 Algorithm**: MUST use SHA-256 (not MD5, SHA-1, etc.)
2. **Hex Encoding**: Output MUST be lowercase hex string (not base64, not uppercase)
3. **Large File Bypass**: Files > 50MB MUST return empty string (not null, not error)
4. **Error Handling**: Non-existent files throw errors, empty files throw errors
5. **Chunked Reading**: Must not load entire file into memory (use streaming/chunked reads)
6. **Validation Result**: Always return ChecksumResult with valid boolean, even on error

### Edge Cases
- File doesn't exist → throw error with message "File does not exist"
- Empty file → throw error with message "File is empty"
- Large file (> 50MB) → return empty string (not error)
- Chunked reading → process in 8KB-1MB chunks (memory efficiency)

### Performance Requirements
- Must use streaming reads (not load entire file into memory)
- Should process ~100MB files in < 5 seconds on typical devices

---

## DEPENDENCIES

### Translation Order
- MUST translate AFTER `lib/ai/types.ts` (SHARED-TS, no translation needed)
- No other dependencies

### Integration Points
- Used by `lib/ai/model-manifest.ts` (PORT) for model validation
- Used by `lib/ai/persistent-download-manager.ts` (NATIVE-OWNED) for download verification
- Used by `lib/model/gatekeeper.ts` (NATIVE-OWNED) for app launch validation

### Test Porting
- Port `lib/ai/__tests__/checksum.test.ts` to:
  - Android: JVM tests in `android/app/src/test/kotlin/checksum/ChecksumValidatorTest.kt`
  - iOS: XCTest in `ios/LaneShadowTests/ChecksumValidatorTests.swift`
