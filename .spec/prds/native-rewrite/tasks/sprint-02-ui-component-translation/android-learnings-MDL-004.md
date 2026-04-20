# Android Learnings: MDL-004 - Checksum Model Translation

## Implementation Date
2026-04-19

## Edge Cases Discovered

1. **File Size Limits**: The TypeScript source bypasses validation for files > 50MB. This is implemented in Kotlin using `file.length()` to check file size before processing. Important to prevent memory issues on mobile devices.

2. **Empty File Handling**: Empty files throw `IllegalArgumentException("File is empty")` rather than returning empty checksum. This matches TypeScript behavior and provides clear error messages.

3. **SHA-256 Hex Format**: The digest must be converted to lowercase hex string using `"%02x".format(it)` for each byte. Using uppercase or other formats would break parity with TypeScript implementation.

4. **Chunked Reading**: Instead of loading entire file into memory, use `ByteArray(8192)` buffer with streaming input stream. This prevents OutOfMemoryError for large files.

5. **Coroutine Dispatchers**: File I/O operations must use `Dispatchers.IO` via `withContext()` to avoid blocking main thread. This is critical for Android app responsiveness.

## API Contract Notes

- **TypeScript**: `async validate(filePath: string, expectedChecksum: string): Promise<ChecksumResult>`
- **Kotlin**: `suspend fun validate(filePath: String, expectedChecksum: String): ChecksumResult`

Perfect parity achieved:
- Both use async/suspend patterns
- Both return ChecksumResult data class/object
- Both handle errors with try-catch and return `valid: false` on error
- Both compute SHA-256 using platform crypto APIs

## UI Decisions

N/A - This is a model/utility class with no UI components.

## Gotchas for iOS Implementer

1. **File Size Check**: Implement the 50MB bypass logic using `FileManager.default.attributesOfItem(atPath:)[.size]`. This is crucial for memory management.

2. **SHA-256 Algorithm**: Use `CryptoKit.SHA256.hash(data:)` on iOS, not older CommonCrypto APIs. The modern Swift API is cleaner and type-safe.

3. **Error Messages**: Match error message strings exactly: "File does not exist", "File is empty", "Failed to compute checksum". These may be parsed or logged by other systems.

4. **Hex Encoding**: Swift's `String(format: "%02x", byte)` is equivalent to Kotlin's `"%02x".format(it)`. Ensure lowercase hex output.

5. **Async/Await vs Coroutines**: TypeScript's `async/await` maps to Swift's `async/await` (not Combine or completion handlers). This is a direct translation.

6. **Streaming Reads**: For large files, avoid `Data(contentsOf: URL)` which loads entire file. Use `InputStream` or chunked reading to match Kotlin's 8KB buffer approach.

## Files Created/Modified

- **Created**: `android/app/src/main/java/com/laneshadow/models/ChecksumValidator.kt` (95 lines)
  - Complete SHA-256 validation implementation
  - Chunked file reading for memory efficiency
  - Coroutine-based async operations
  - Error handling matching TypeScript source

- **Created**: `android/app/src/test/java/com/laneshadow/models/ChecksumValidatorTest.kt` (148 lines)
  - 7 comprehensive test cases
  - Tests all acceptance criteria (AC-1, AC-2, AC-3)
  - Additional tests for edge cases (empty file, large file, SHA-256 verification)
  - Data class structure verification

## Translation Accuracy

Successfully translated all features from `react-native/lib/ai/checksum.ts`:
- ✅ Public API matches (validate function signature)
- ✅ Async operations use coroutines (suspend functions with Dispatchers.IO)
- ✅ Storage abstractions work correctly (java.io.File)
- ✅ SHA-256 algorithm implementation (MessageDigest with chunked reading)
- ✅ Large file bypass (> 50MB)
- ✅ Error handling for missing/empty files
- ✅ ChecksumResult data class structure

## Pre-existing Infrastructure Issues

No issues encountered. The implementation compiled and built successfully without any dependencies on external test frameworks or problematic infrastructure.

## Integration Points

This implementation is ready to be used by:
- `lib/ai/model-manifest.ts` (PORT) for model validation
- `lib/ai/persistent-download-manager.ts` (NATIVE-OWNED) for download verification
- `lib/model/gatekeeper.ts` (NATIVE-OWNED) for app launch validation

The Kotlin version can be imported and used in the same way as the TypeScript version:
```kotlin
val validator = ChecksumValidator()
val result = validator.validate(filePath, expectedChecksum)
if (result.valid) {
    // File is valid
} else {
    // Handle error - result.error contains message
}
```
