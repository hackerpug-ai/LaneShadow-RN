# MODEL-ai-atomic-write.md - Atomic File Write Translation Plan

**Document ID**: MAT-MODEL-AI-ATOMIC-WRITE
**Status**: Draft
**Source File**: `react-native/lib/ai/atomic-write.ts`
**Classification**: PORT
**Priority**: P0 (Model download integrity)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Atomic file write utilities to prevent partial file corruption during downloads. Implements write-verify-rename pattern using temporary files. Ensures either the complete file exists or nothing exists, never a partial/corrupted file. Critical for ML model download integrity (CLR-004).

---

## Type Definitions

### Input/Output Contracts

```typescript
interface AtomicWriteResult {
  success: boolean
  filePath?: string
  error?: string
}

async function atomicWrite(filePath: string, data: string): Promise<AtomicWriteResult>
async function atomicAppend(filePath: string, chunk: string, offset: number): Promise<AtomicWriteResult>
async function atomicDelete(filePath: string): Promise<boolean>
async function verifyFile(filePath: string, expectedSize: number, tolerance?: number): Promise<{valid: boolean; actualSize?: number; error?: string}>
```

### Data Encoding

- **Input data**: Base64-encoded strings (from expo-file-system)
- **File storage**: Binary (decoded from base64)
- **Chunk size**: No limit (uses streaming for large files)

---

## State Machine

### Atomic Write Flow

```
┌─────────────────────────────────────────────────────────────┐
│ START: atomicWrite(filePath, data)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Step 1: Write to .tmp file
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ TEMP_WRITE: Write data to filePath.tmp                       │
│ - Encoding: base64 → binary                                 │
│ - Failure: Return success=false + error                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Step 2: Verify temp file
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ VERIFY: Check temp file exists and has content              │
│ - FileSystem.getInfoAsync(tempPath)                         │
│ - Failure: Cleanup temp + return error                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Step 3: Atomic rename
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ RENAME: Move tempPath → filePath (POSIX atomic guarantee)  │
│ - FileSystem.moveAsync({from, to})                          │
│ - Success: Return success=true + filePath                   │
│ - Failure: Cleanup temp + return error                      │
└─────────────────────────────────────────────────────────────┘
```

### Atomic Append Flow

```
┌─────────────────────────────────────────────────────────────┐
│ START: atomicAppend(filePath, chunk, offset)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Write chunk to .tmp.{offset}
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ CHUNK_WRITE: Write chunk to filePath.tmp.{offset}           │
│ - Verify chunk written                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Read existing file (if exists)
                     │ Combine: existing + chunk
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ MERGE: atomicWrite(filePath, combinedData)                  │
│ - Reuse atomic write for final merge                        │
│ - Cleanup chunk temp file                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## API Surface

### Functions

| Function | Parameters | Returns | Purpose |
|----------|-----------|---------|---------|
| `atomicWrite()` | `filePath: string`, `data: string` (base64) | `Promise<AtomicWriteResult>` | Write file atomically |
| `atomicAppend()` | `filePath: string`, `chunk: string` (base64), `offset: number` | `Promise<AtomicWriteResult>` | Append chunk atomically |
| `atomicDelete()` | `filePath: string` | `Promise<boolean>` | Delete file idempotently |
| `verifyFile()` | `filePath: string`, `expectedSize: number`, `tolerance?: number` | `Promise<{valid, actualSize, error}>` | Verify file integrity |

### Result Types

```typescript
interface AtomicWriteResult {
  success: boolean
  filePath?: string      // Present on success
  error?: string         // Present on failure
}

interface VerifyResult {
  valid: boolean
  actualSize?: number    // Present if file exists
  error?: string         // Present if verification fails
}
```

---

## Platform Translation Strategy

### Android (Kotlin)

**Storage**: java.io.File with atomic rename (POSIX guarantee)

**Implementation Pattern**:
```kotlin
// AtomicFileWriter.kt
class AtomicFileWriter {

    suspend fun atomicWrite(filePath: String, data: ByteArray): AtomicWriteResult = withContext(Dispatchers.IO) {
        val tempPath = "$filePath.tmp"

        try {
            // Step 1: Write to temp file
            val tempFile = File(tempPath)
            tempFile.writeBytes(data)

            // Step 2: Verify temp file
            if (!tempFile.exists() || tempFile.length() == 0L) {
                throw IOException("Temporary file verification failed")
            }

            // Step 3: Atomic rename (POSIX guarantee)
            val targetFile = File(filePath)
            if (!tempFile.renameTo(targetFile)) {
                throw IOException("Atomic rename failed")
            }

            AtomicWriteResult(
                success = true,
                filePath = filePath
            )
        } catch (error: Exception) {
            // Cleanup temp file
            try {
                File(tempPath).delete()
            } catch (_: Exception) {}

            AtomicWriteResult(
                success = false,
                error = error.message
            )
        }
    }

    suspend fun atomicAppend(filePath: String, chunk: ByteArray, offset: Int): AtomicWriteResult = withContext(Dispatchers.IO) {
        val tempPath = "$filePath.tmp.$offset"

        try {
            // Step 1: Write chunk to temp file
            val tempChunkFile = File(tempPath)
            tempChunkFile.writeBytes(chunk)

            // Step 2: Verify chunk
            if (!tempChunkFile.exists() || tempChunkFile.length() == 0L) {
                throw IOException("Chunk verification failed")
            }

            // Step 3: Read existing file
            val targetFile = File(filePath)
            val existingData = if (targetFile.exists()) {
                targetFile.readBytes()
            } else {
                byteArrayOf()
            }

            // Step 4: Combine and write atomically
            val combinedData = existingData + chunk
            val result = atomicWrite(filePath, combinedData)

            // Step 5: Cleanup chunk temp file
            try {
                tempChunkFile.delete()
            } catch (_: Exception) {}

            result
        } catch (error: Exception) {
            // Cleanup temp file
            try {
                File(tempPath).delete()
            } catch (_: Exception) {}

            AtomicWriteResult(
                success = false,
                error = error.message
            )
        }
    }

    suspend fun atomicDelete(filePath: String): Boolean = withContext(Dispatchers.IO) {
        try {
            File(filePath).delete()
        } catch (_: Exception) {
            false
        }
    }

    suspend fun verifyFile(filePath: String, expectedSize: Long, tolerance: Long = 0): VerifyResult = withContext(Dispatchers.IO) {
        try {
            val file = File(filePath)

            if (!file.exists()) {
                return@withContext VerifyResult(
                    valid = false,
                    error = "File does not exist"
                )
            }

            val actualSize = file.length()
            val sizeDiff = kotlin.math.abs(actualSize - expectedSize)

            if (sizeDiff > tolerance) {
                return@withContext VerifyResult(
                    valid = false,
                    actualSize = actualSize,
                    error = "Size mismatch: expected $expectedSize, got $actualSize"
                )
            }

            VerifyResult(valid = true, actualSize = actualSize)
        } catch (error: Exception) {
            VerifyResult(
                valid = false,
                error = error.message
            )
        }
    }
}

data class AtomicWriteResult(
    val success: Boolean,
    val filePath: String? = null,
    val error: String? = null
)

data class VerifyResult(
    val valid: Boolean,
    val actualSize: Long? = null,
    val error: String? = null
)
```

---

### iOS (Swift)

**Storage**: FileManager with atomic write (NSFileManager guarantee)

**Implementation Pattern**:
```swift
// AtomicFileWriter.swift
class AtomicFileWriter {

    func atomicWrite(filePath: String, data: Data) async -> AtomicWriteResult {
        let tempPath = "\(filePath).tmp"

        do {
            // Step 1: Write to temp file
            let tempURL = URL(fileURLWithPath: tempPath)
            try data.write(to: tempURL)

            // Step 2: Verify temp file
            let tempAttrs = try FileManager.default.attributesOfItem(atPath: tempPath)
            guard let fileSize = tempAttrs[.size] as? UInt64, fileSize > 0 else {
                throw AtomicWriteError.tempFileVerificationFailed
            }

            // Step 3: Atomic rename ( FileManager guarantee)
            let targetURL = URL(fileURLWithPath: filePath)
            try FileManager.default.moveItem(at: tempURL, to: targetURL)

            return AtomicWriteResult(success: true, filePath: filePath)
        } catch {
            // Cleanup temp file
            try? FileManager.default.removeItem(atPath: tempPath)

            return AtomicWriteResult(
                success: false,
                error: error.localizedDescription
            )
        }
    }

    func atomicAppend(filePath: String, chunk: Data, offset: Int) async -> AtomicWriteResult {
        let tempPath = "\(filePath).tmp.\(offset)"

        do {
            // Step 1: Write chunk to temp file
            let tempChunkURL = URL(fileURLWithPath: tempPath)
            try chunk.write(to: tempChunkURL)

            // Step 2: Verify chunk
            let tempAttrs = try FileManager.default.attributesOfItem(atPath: tempPath)
            guard let _ = tempAttrs[.size] as? UInt64 else {
                throw AtomicWriteError.chunkVerificationFailed
            }

            // Step 3: Read existing file
            let targetURL = URL(fileURLWithPath: filePath)
            let existingData: Data
            if FileManager.default.fileExists(atPath: filePath) {
                existingData = try Data(contentsOf: targetURL)
            } else {
                existingData = Data()
            }

            // Step 4: Combine and write atomically
            var combinedData = existingData
            combinedData.append(chunk)

            let result = await atomicWrite(filePath: filePath, data: combinedData)

            // Step 5: Cleanup chunk temp file
            try? FileManager.default.removeItem(at: tempChunkURL)

            return result
        } catch {
            // Cleanup temp file
            try? FileManager.default.removeItem(atPath: tempPath)

            return AtomicWriteResult(
                success: false,
                error: error.localizedDescription
            )
        }
    }

    func atomicDelete(filePath: String) async -> Bool {
        do {
            try FileManager.default.removeItem(atPath: filePath)
            return true
        } catch {
            return false
        }
    }

    func verifyFile(filePath: String, expectedSize: Int64, tolerance: Int64 = 0) async -> VerifyResult {
        do {
            guard FileManager.default.fileExists(atPath: filePath) else {
                return VerifyResult(valid: false, error: "File does not exist")
            }

            let attrs = try FileManager.default.attributesOfItem(atPath: filePath)
            guard let actualSize = attrs[.size] as? Int64 else {
                return VerifyResult(valid: false, error: "Could not determine file size")
            }

            let sizeDiff = abs(actualSize - expectedSize)

            if sizeDiff > tolerance {
                return VerifyResult(
                    valid: false,
                    actualSize: actualSize,
                    error: "Size mismatch: expected \(expectedSize), got \(actualSize)"
                )
            }

            return VerifyResult(valid: true, actualSize: actualSize)
        } catch {
            return VerifyResult(
                valid: false,
                error: error.localizedDescription
            )
        }
    }
}

struct AtomicWriteResult {
    let success: Bool
    let filePath: String?
    let error: String?
}

struct VerifyResult {
    let valid: Bool
    let actualSize: Int64?
    let error: String?
}

enum AtomicWriteError: LocalizedError {
    case tempFileVerificationFailed
    case chunkVerificationFailed

    var errorDescription: String? {
        switch self {
        case .tempFileVerificationFailed:
            return "Temporary file verification failed"
        case .chunkVerificationFailed:
            return "Chunk verification failed"
        }
    }
}
```

---

## Parity Contracts

### Behavioral Requirements

| Requirement | Description |
|-------------|-------------|
| **Atomic rename** | Rename must be atomic (POSIX on Android, FileManager on iOS) |
| **Temp file cleanup** | Must clean up .tmp files on failure |
| **Idempotent delete** | atomicDelete must not throw if file doesn't exist |
| **Size verification** | verifyFile must check size within tolerance |
| **Error handling** | Must never throw — return error in result object |

### File Path Patterns

| Operation | File Paths Involved |
|-----------|-------------------|
| `atomicWrite()` | `filePath`, `filePath.tmp` |
| `atomicAppend()` | `filePath`, `filePath.tmp.{offset}` |
| `atomicDelete()` | `filePath` |

---

## Dependencies

### Internal
- None (pure file operations)

### External (React Native)
- `expo-file-system/legacy` — To be replaced with platform-native file APIs

### Platform Replacements
- **Android**: `java.io.File`, `kotlinx.coroutines.Dispatchers.IO`
- **iOS**: `Foundation.FileManager`, `Foundation.Data`

---

## Test Migration Strategy

### Test Cases to Port

| Test Case | Description |
|-----------|-------------|
| Atomic write success | Verify file written correctly |
| Atomic write failure | Verify temp file cleaned up on error |
| Atomic append chunks | Verify chunks combined correctly |
| Atomic append resume | Verify resume from existing file |
| Atomic delete idempotent | Verify delete doesn't throw if file missing |
| Verify file size match | Verify validation passes for correct size |
| Verify file size mismatch | Verify validation fails for wrong size |
| Verify tolerance | Verify tolerance parameter works |

### Android Test Framework
```kotlin
// AtomicFileWriterTest.kt
@RunWith(AndroidJUnit4::class)
class AtomicFileWriterTest {
    private lateinit var writer: AtomicFileWriter
    private lateinit var testDir: File

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        testDir = File(context.cacheDir, "atomic_test")
        testDir.mkdirs()
        writer = AtomicFileWriter()
    }

    @After
    fun cleanup() {
        testDir.deleteRecursively()
    }

    @Test
    fun `atomic write success`() = runTest {
        val filePath = "${testDir.absolutePath}/test.bin"
        val data = byteArrayOf(1, 2, 3, 4, 5)

        val result = writer.atomicWrite(filePath, data)

        assertTrue(result.success)
        assertEquals(filePath, result.filePath)
        assertTrue(File(filePath).exists())
        assertContentEquals(data, File(filePath).readBytes())
    }

    @Test
    fun `atomic write cleanup on failure`() = runTest {
        val filePath = "/invalid/path/test.bin"
        val data = byteArrayOf(1, 2, 3)

        val result = writer.atomicWrite(filePath, data)

        assertFalse(result.success)
        assertNotNull(result.error)
        // Verify no temp files left
        assertFalse(File("$filePath.tmp").exists())
    }

    // ... other test cases
}
```

### iOS Test Framework
```swift
// AtomicFileWriterTests.swift
@testable import LaneShadow
import XCTest

class AtomicFileWriterTests: XCTestCase {
    var writer: AtomicFileWriter!
    var testDir: URL!

    override func setUp() async throws {
        writer = AtomicFileWriter()
        testDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("atomic_test")
        try FileManager.default.createDirectory(at: testDir, withIntermediateDirectories: true)
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: testDir)
    }

    func testAtomicWriteSuccess() async throws {
        let filePath = testDir.appendingPathComponent("test.bin").path
        let data = Data([1, 2, 3, 4, 5])

        let result = await writer.atomicWrite(filePath: filePath, data: data)

        XCTAssertTrue(result.success)
        XCTAssertEqual(result.filePath, filePath)
        XCTAssertTrue(FileManager.default.fileExists(atPath: filePath))
        let readData = try Data(contentsOf: URL(fileURLWithPath: filePath))
        XCTAssertEqual(data, readData)
    }

    func testAtomicWriteCleanupOnFailure() async throws {
        let filePath = "/invalid/path/test.bin"
        let data = Data([1, 2, 3])

        let result = await writer.atomicWrite(filePath: filePath, data: data)

        XCTAssertFalse(result.success)
        XCTAssertNotNil(result.error)
        // Verify no temp files left
        XCTAssertFalse(FileManager.default.fileExists(atPath: "\(filePath).tmp"))
    }

    // ... other test cases
}
```

---

## Edge Cases

| Edge Case | Expected Behavior |
|-----------|------------------|
| Disk full during write | Return success=false with error message |
| Permission denied | Return success=false with error message |
| Concurrent writes to same path | Last write wins (platform file locking handles this) |
| Very large files (>2GB) | Use streaming (chunked writes) |
| Invalid file path | Return success=false with error message |
| Temp file already exists | Overwrite (platform behavior) |
| Parent directory doesn't exist | Return success=false (caller must create dir first) |

---

## Performance Considerations

| Operation | Performance Target | Notes |
|-----------|-------------------|-------|
| `atomicWrite()` (1MB) | < 100ms | I/O bound |
| `atomicAppend()` (1MB chunk) | < 150ms | Read + write overhead |
| `atomicDelete()` | < 50ms | Single filesystem op |
| `verifyFile()` | < 20ms | Metadata read only |

---

## Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **File permissions** | Files created with user-only read/write (0600) |
| **Temp file cleanup** | Must not leave .tmp files on failure |
| **Path traversal protection** | Validate file paths (sanitize user input) |
| **No symlinks** | Don't follow symlinks (security risk) |

---

## Migration Notes

### Data Migration from RN

No migration needed — atomic write is a write pattern, not a data store. Existing files written by expo-file-system remain valid and can be read by platform-native implementations.

### Backward Compatibility

Platform implementations can read files written by expo-file-system, as both use standard file formats (binary data).

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- `INVENTORY.md` — Complete file inventory
- React Native source: `react-native/lib/ai/atomic-write.ts`
- CLR-004: Model Download Persistence

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
