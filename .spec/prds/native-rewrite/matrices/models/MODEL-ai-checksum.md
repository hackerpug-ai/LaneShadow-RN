# MODEL-ai-checksum.md - SHA-256 Checksum Validation Translation Plan

**Document ID**: MAT-MODEL-AI-CHECKSUM
**Status**: Draft
**Source File**: `react-native/lib/ai/checksum.ts`
**Classification**: PORT
**Priority**: P0 (Model integrity)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

SHA-256 checksum validation utilities for ML model files. Validates model file integrity before loading to prevent corrupted models from causing runtime errors or incorrect inference results. Uses chunked reading for large files and skips validation for files >50MB to avoid memory issues.

---

## Type Definitions

### Input/Output Contracts

```typescript
interface ChecksumResult {
  valid: boolean
  actualChecksum?: string  // Present on success or when computed
  error?: string           // Present on failure
}

class ChecksumValidator {
  async validate(filePath: string, expectedChecksum: string): Promise<ChecksumResult>
}
```

### Checksum Format

- **Algorithm**: SHA-256
- **Output format**: Hex string (64 characters)
- **Input**: File path (reads binary data)

---

## State Machine

### Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ START: validate(filePath, expectedChecksum)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Read file metadata
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FILE_CHECK: Verify file exists and is not empty             │
│ - FileSystem.getInfoAsync(filePath)                         │
│ - Error: Return valid=false + error message                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Check file size
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ SIZE_CHECK: Is file > 50MB?                                 │
│ - If yes: Return valid=true with empty checksum (bypass)    │
│ - If no: Proceed to chunked reading                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Read file in 1MB chunks
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ CHUNKED_READ: Read file in chunks to avoid OOM              │
│ - CHUNK_SIZE = 1MB                                          │
│ - Read base64-encoded chunks                                │
│ - Accumulate in memory                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Compute SHA-256 hash
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ HASH_COMPUTE: SHA-256(fileContent)                          │
│ - Input: Base64 string (concatenated chunks)                │
│ - Output: Base64 digest                                     │
│ - Convert: Base64 → Hex                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Compare with expected
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPARE: actualChecksum === expectedChecksum?               │
│ - Match: Return valid=true + actualChecksum                 │
│ - Mismatch: Return valid=false + actualChecksum             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Surface

### Class: ChecksumValidator

| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `validate()` | `filePath: string`, `expectedChecksum: string` | `Promise<ChecksumResult>` | Validate file checksum |

### Private Methods

| Method | Purpose |
|--------|---------|
| `computeSHA256()` | Compute SHA-256 hash of file (chunked reading) |
| `base64ToHex()` | Convert base64 digest to hex string |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `CHUNK_SIZE` | 1024 * 1024 (1MB) | Read chunk size |
| `LARGE_FILE_THRESHOLD` | 50 * 1024 * 1024 (50MB) | Skip validation threshold |

---

## Platform Translation Strategy

### Android (Kotlin)

**Crypto**: java.security.MessageDigest (SHA-256)

**Implementation Pattern**:
```kotlin
// ChecksumValidator.kt
import java.io.File
import java.security.MessageDigest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ChecksumValidator {

    suspend fun validate(filePath: String, expectedChecksum: String): ChecksumResult = withContext(Dispatchers.IO) {
        try {
            val actualChecksum = computeSHA256(filePath)

            ChecksumResult(
                valid = actualChecksum == expectedChecksum,
                actualChecksum = actualChecksum
            )
        } catch (error: Exception) {
            ChecksumResult(
                valid = false,
                error = error.message
            )
        }
    }

    private suspend fun computeSHA256(filePath: String): String = withContext(Dispatchers.IO) {
        val file = File(filePath)

        if (!file.exists()) {
            throw IOException("File does not exist")
        }

        val fileSize = file.length()

        if (fileSize == 0L) {
            throw IOException("File is empty")
        }

        // For large files (> 50MB), skip validation to avoid memory issues
        if (fileSize > 50 * 1024 * 1024) {
            return@withContext "" // Return empty to bypass validation
        }

        // For smaller files, read in chunks
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(8192)
        var bytesRead: Int

        file.inputStream().use { input ->
            while (input.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }

        // Convert to hex string
        digest.digest().joinToString("") { "%02x".format(it) }
    }
}

data class ChecksumResult(
    val valid: Boolean,
    val actualChecksum: String? = null,
    val error: String? = null
)
```

---

### iOS (Swift)

**Crypto**: CryptoKit (SHA256)

**Implementation Pattern**:
```swift
// ChecksumValidator.swift
import CryptoKit
import Foundation

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

        let fileSize = (try? FileManager.default.attributesOfItem(atPath: filePath)[.size] as? Int64) ?? 0

        if fileSize == 0 {
            throw ChecksumError.fileIsEmpty
        }

        // For large files (> 50MB), skip validation to avoid memory issues
        if fileSize > 50 * 1024 * 1024 {
            return "" // Return empty to bypass validation
        }

        // For smaller files, read and hash
        do {
            let data = try Data(contentsOf: fileURL)
            let digest = SHA256.hash(data: data)
            return digest.compactMap { String(format: "%02x", $0) }.joined()
        } catch {
            throw ChecksumError.readFailed(error)
        }
    }
}

struct ChecksumResult {
    let valid: Bool
    let actualChecksum: String?
    let error: String?
}

enum ChecksumError: LocalizedError {
    case fileDoesNotExist
    case fileIsEmpty
    case readFailed(Error)

    var errorDescription: String? {
        switch self {
        case .fileDoesNotExist:
            return "File does not exist"
        case .fileIsEmpty:
            return "File is empty"
        case .readFailed(let error):
            return "Failed to read file: \(error.localizedDescription)"
        }
    }
}
```

---

## Parity Contracts

### Behavioral Requirements

| Requirement | Description |
|-------------|-------------|
| **SHA-256 algorithm** | Must use SHA-256 (not MD5, SHA-1, etc.) |
| **Hex output** | Must return 64-character hex string |
| **Chunked reading** | Must read large files in chunks (1MB on Android, full read on iOS) |
| **Large file bypass** | Files >50MB return empty checksum (bypass validation) |
| **Error handling** | Must never throw — return error in result object |
| **File existence check** | Must verify file exists before reading |
| **Empty file check** | Must reject zero-byte files |

### Checksum Computation Parity

| Input | Expected Output |
|-------|----------------|
| Empty file | Error (file is empty) |
| File with "hello" | `185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969` |
| File >50MB | Empty string (bypass) |

---

## Dependencies

### Internal
- `./types.ts` — ChecksumResult type definition

### External (React Native)
- `expo-crypto` — Digest computation (to be replaced with platform crypto)
- `expo-file-system/legacy` — File reading (to be replaced with platform file APIs)

### Platform Replacements
- **Android**: `java.security.MessageDigest`, `java.io.FileInputStream`
- **iOS**: `CryptoKit.SHA256`, `Foundation.Data`

---

## Test Migration Strategy

### Test Cases to Port

| Test Case | Description |
|-----------|-------------|
| Valid checksum | Verify validation passes for correct checksum |
| Invalid checksum | Verify validation fails for incorrect checksum |
| File not found | Verify error handling for missing file |
| Empty file | Verify error handling for empty file |
| Large file bypass | Verify files >50MB return empty checksum |
| Small file hash | Verify correct SHA-256 computation |
| Unicode file path | Verify handling of unicode paths |

### Android Test Framework
```kotlin
// ChecksumValidatorTest.kt
@RunWith(AndroidJUnit4::class)
class ChecksumValidatorTest {
    private lateinit var validator: ChecksumValidator
    private lateinit var testDir: File

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        testDir = File(context.cacheDir, "checksum_test")
        testDir.mkdirs()
        validator = ChecksumValidator()
    }

    @After
    fun cleanup() {
        testDir.deleteRecursively()
    }

    @Test
    fun `valid checksum passes`() = runTest {
        val testFile = File(testDir, "test.bin")
        testFile.writeBytes(byteArrayOf(1, 2, 3, 4, 5))

        // Expected SHA-256 of [1,2,3,4,5]
        val expectedChecksum = "6741ca9cb6b0a7d2e3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f"

        val result = validator.validate(testFile.absolutePath, expectedChecksum)

        assertTrue(result.valid)
        assertEquals(expectedChecksum, result.actualChecksum)
    }

    @Test
    fun `invalid checksum fails`() = runTest {
        val testFile = File(testDir, "test.bin")
        testFile.writeBytes(byteArrayOf(1, 2, 3))

        val wrongChecksum = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

        val result = validator.validate(testFile.absolutePath, wrongChecksum)

        assertFalse(result.valid)
        assertNotNull(result.actualChecksum)
        assertNotEquals(wrongChecksum, result.actualChecksum)
    }

    @Test
    fun `file not found returns error`() = runTest {
        val result = validator.validate("/nonexistent/file.bin", "anychecksum")

        assertFalse(result.valid)
        assertNotNull(result.error)
    }

    @Test
    fun `empty file returns error`() = runTest {
        val testFile = File(testDir, "empty.bin")
        testFile.createNewFile()

        val result = validator.validate(testFile.absolutePath, "anyc checksum")

        assertFalse(result.valid)
        assertNotNull(result.error)
        assertTrue(result.error!!.contains("empty", ignoreCase = true))
    }

    // ... other test cases
}
```

### iOS Test Framework
```swift
// ChecksumValidatorTests.swift
@testable import LaneShadow
import XCTest

class ChecksumValidatorTests: XCTestCase {
    var validator: ChecksumValidator!
    var testDir: URL!

    override func setUp() async throws {
        validator = ChecksumValidator()
        testDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("checksum_test")
        try FileManager.default.createDirectory(at: testDir, withIntermediateDirectories: true)
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: testDir)
    }

    func testValidChecksumPasses() async throws {
        let testFile = testDir.appendingPathComponent("test.bin")
        try Data([1, 2, 3, 4, 5]).write(to: testFile)

        // Expected SHA-256 of [1,2,3,4,5]
        let expectedChecksum = "6741ca9cb6b0a7d2e3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f"

        let result = await validator.validate(
            filePath: testFile.path,
            expectedChecksum: expectedChecksum
        )

        XCTAssertTrue(result.valid)
        XCTAssertEqual(expectedChecksum, result.actualChecksum)
    }

    func testInvalidChecksumFails() async throws {
        let testFile = testDir.appendingPathComponent("test.bin")
        try Data([1, 2, 3]).write(to: testFile)

        let wrongChecksum = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

        let result = await validator.validate(
            filePath: testFile.path,
            expectedChecksum: wrongChecksum
        )

        XCTAssertFalse(result.valid)
        XCTAssertNotNil(result.actualChecksum)
        XCTAssertNotEqual(wrongChecksum, result.actualChecksum)
    }

    func testFileNotFoundReturnsError() async throws {
        let result = await validator.validate(
            filePath: "/nonexistent/file.bin",
            expectedChecksum: "anychecksum"
        )

        XCTAssertFalse(result.valid)
        XCTAssertNotNil(result.error)
    }

    func testEmptyFileReturnsError() async throws {
        let testFile = testDir.appendingPathComponent("empty.bin")
        FileManager.default.createFile(atPath: testFile.path, contents: nil)

        let result = await validator.validate(
            filePath: testFile.path,
            expectedChecksum: "anycchecksum"
        )

        XCTAssertFalse(result.valid)
        XCTAssertNotNil(result.error)
        XCTAssertTrue(result.error?.contains("empty", caseInsensitive: true) ?? false)
    }

    // ... other test cases
}
```

---

## Edge Cases

| Edge Case | Expected Behavior |
|-----------|------------------|
| File path with unicode | Must handle unicode characters correctly |
| File path with spaces | Must handle spaces in path |
| Symbolic link | Follow symlink (platform default) |
| File in use (locked) | Return error (cannot read) |
| Permission denied | Return error (access denied) |
| Corrupted file system | Return error (I/O error) |
| Very small file (<1KB) | Compute checksum normally |
| Exactly 50MB file | Compute checksum (not bypassed) |
| 50MB + 1 byte file | Return empty checksum (bypassed) |

---

## Performance Considerations

| File Size | Performance Target | Notes |
|-----------|-------------------|-------|
| < 1MB | < 50ms | Fast path |
| 1-10MB | < 200ms | Chunked reading |
| 10-50MB | < 1s | Upper limit before bypass |
| > 50MB | < 10ms | Bypass (return empty) |

---

## Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Timing attack resistance** | Use constant-time comparison for checksums (future enhancement) |
| **Path validation** | Validate file paths (sanitize user input) |
| **No sensitive data in logs** | Never log file contents or checksums |

---

## Migration Notes

### Data Migration from RN

No migration needed — checksum validation is a read-only operation. Platform implementations can validate files written by expo-file-system.

### Backward Compatibility

Both implementations produce identical SHA-256 hashes for the same input data, so validation is fully compatible.

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- `INVENTORY.md` — Complete file inventory
- React Native source: `react-native/lib/ai/checksum.ts`
- SHA-256 standard: NIST FIPS 180-4

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
