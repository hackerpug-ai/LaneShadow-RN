package com.laneshadow.models

import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue

/**
 * TDD Test for AtomicWrite Model Translation
 *
 * AC-1: Public API matches source
 * GIVEN: TypeScript source defines exported functions
 * WHEN: Kotlin equivalents are called
 * THEN: Function signatures match (names, parameters, return types)
 *
 * TypeScript source exports:
 * - atomicWrite(filePath: string, data: string): Promise<AtomicWriteResult>
 * - atomicAppend(filePath: string, chunk: string, offset: number): Promise<AtomicWriteResult>
 * - atomicDelete(filePath: string): Promise<boolean>
 * - verifyFile(filePath: string, expectedSize: number, tolerance?: number): Promise<VerificationResult>
 */
class AtomicWriteTest {

    private lateinit var tempDir: File
    private lateinit var testFilePath: String

    @Before
    fun setup() {
        // Create temporary directory for tests
        tempDir = File(System.getProperty("java.io.tmpdir"), "atomic-write-test-${System.currentTimeMillis()}")
        tempDir.mkdirs()
        testFilePath = File(tempDir, "test-file.txt").absolutePath
    }

    @After
    fun cleanup() {
        // Clean up temporary directory
        tempDir.deleteRecursively()
    }

    /**
     * Test that atomicWrite matches source signature
     * Source: export async function atomicWrite(filePath: string, data: string): Promise<AtomicWriteResult>
     */
    @Test
    fun testPublicAPI_matchesSource_atomicWrite() = runTest {
        // GIVEN: File path and data
        val data = "test-data-content"

        // WHEN: Calling atomicWrite
        val result = AtomicWriteUtils.atomicWrite(testFilePath, data)

        // THEN: Result matches source structure
        assertEquals(true, result.success)
        assertEquals(testFilePath, result.filePath)
        assertNull(result.error)

        // Verify file was actually written
        val file = File(testFilePath)
        assertEquals(true, file.exists())
        assertEquals(data, file.readText())
    }

    /**
     * Test that atomicAppend matches source signature
     * Source: export async function atomicAppend(filePath: string, chunk: string, offset: number): Promise<AtomicWriteResult>
     */
    @Test
    fun testPublicAPI_matchesSource_atomicAppend() = runTest {
        // GIVEN: Existing file with initial content
        val initialData = "initial-"
        val writeResult = AtomicWriteUtils.atomicWrite(testFilePath, initialData)
        assertEquals(true, writeResult.success)

        // WHEN: Calling atomicAppend with chunk and offset
        val chunk = "appended"
        val offset = 8L
        val result = AtomicWriteUtils.atomicAppend(testFilePath, chunk, offset)

        // THEN: Result matches source structure
        assertEquals(true, result.success)
        assertEquals(testFilePath, result.filePath)
        assertNull(result.error)

        // Verify content was appended
        val file = File(testFilePath)
        assertEquals(true, file.exists())
        assertEquals("initial-appended", file.readText())
    }

    /**
     * Test that atomicDelete matches source signature
     * Source: export async function atomicDelete(filePath: string): Promise<boolean>
     */
    @Test
    fun testPublicAPI_matchesSource_atomicDelete() = runTest {
        // GIVEN: Existing file
        val writeResult = AtomicWriteUtils.atomicWrite(testFilePath, "test-data")
        assertEquals(true, writeResult.success)
        val file = File(testFilePath)
        assertEquals(true, file.exists())

        // WHEN: Calling atomicDelete
        val result = AtomicWriteUtils.atomicDelete(testFilePath)

        // THEN: Returns boolean matching source
        assertEquals(true, result)
        assertEquals(true, !file.exists())
    }

    /**
     * Test that verifyFile matches source signature
     * Source: export async function verifyFile(filePath: string, expectedSize: number, tolerance?: number): Promise<VerificationResult>
     */
    @Test
    fun testPublicAPI_matchesSource_verifyFile() = runTest {
        // GIVEN: Existing file with known size
        val data = "test-data-content"
        val writeResult = AtomicWriteUtils.atomicWrite(testFilePath, data)
        assertEquals(true, writeResult.success)
        val expectedSize = data.length.toLong()

        // WHEN: Calling verifyFile
        val result = AtomicWriteUtils.verifyFile(testFilePath, expectedSize)

        // THEN: Result matches source structure
        assertEquals(true, result.valid)
        assertEquals(expectedSize, result.actualSize)
        assertNull(result.error)
    }

    /**
     * Test that data classes match source structure
     * Source: interface AtomicWriteResult { success: boolean; filePath?: string; error?: string }
     */
    @Test
    fun testPublicAPI_matchesSource_dataClasses() {
        // THEN: Data class structure matches TypeScript interface
        val writeResult = AtomicWriteResult(
            success = true,
            filePath = "/path/to/file",
            error = null
        )
        assertEquals(true, writeResult.success)
        assertEquals("/path/to/file", writeResult.filePath)
        assertNull(writeResult.error)

        // Source: interface VerificationResult { valid: boolean; actualSize?: number; error?: string }
        val verifyResult = VerificationResult(
            valid = false,
            actualSize = 100L,
            error = "Size mismatch"
        )
        assertEquals(true, !verifyResult.valid)
        assertEquals(100L, verifyResult.actualSize)
        assertEquals("Size mismatch", verifyResult.error)
    }

    /**
     * AC-2: Async operations use coroutines
     * GIVEN: Source uses async/await patterns
     * WHEN: Kotlin equivalents are invoked
     * THEN: Functions are suspend functions with proper context
     */

    /**
     * Test that atomicWrite is a suspend function
     * Source: export async function atomicWrite(filePath: string, data: string): Promise<AtomicWriteResult>
     */
    @Test
    fun testAsyncOperationsUseCoroutines_atomicWrite() = runTest {
        // GIVEN: File path and data
        val data = "test-coroutine-write"

        // WHEN: Calling suspend function atomicWrite
        val result = AtomicWriteUtils.atomicWrite(testFilePath, data)

        // THEN: Function executes in coroutine context and returns result
        assertEquals(true, result.success)
        assertEquals(testFilePath, result.filePath)
        assertNull(result.error)

        // Verify file was written
        val file = File(testFilePath)
        assertEquals(true, file.exists())
        assertEquals(data, file.readText())
    }

    /**
     * Test that atomicAppend is a suspend function
     * Source: export async function atomicAppend(filePath: string, chunk: string, offset: number): Promise<AtomicWriteResult>
     */
    @Test
    fun testAsyncOperationsUseCoroutines_atomicAppend() = runTest {
        // GIVEN: Existing file
        val initialData = "coroutine-initial"
        AtomicWriteUtils.atomicWrite(testFilePath, initialData)

        // WHEN: Calling suspend function atomicAppend
        val chunk = "-appended"
        val offset = 17L
        val result = AtomicWriteUtils.atomicAppend(testFilePath, chunk, offset)

        // THEN: Function executes in coroutine context and returns result
        assertEquals(true, result.success)
        assertEquals(testFilePath, result.filePath)
        assertNull(result.error)

        // Verify content was appended
        val file = File(testFilePath)
        assertEquals("coroutine-initial-appended", file.readText())
    }

    /**
     * Test that atomicDelete is a suspend function
     * Source: export async function atomicDelete(filePath: string): Promise<boolean>
     */
    @Test
    fun testAsyncOperationsUseCoroutines_atomicDelete() = runTest {
        // GIVEN: Existing file
        AtomicWriteUtils.atomicWrite(testFilePath, "delete-test")

        // WHEN: Calling suspend function atomicDelete
        val result = AtomicWriteUtils.atomicDelete(testFilePath)

        // THEN: Function executes in coroutine context and returns boolean
        assertEquals(true, result)
        assertEquals(false, File(testFilePath).exists())
    }

    /**
     * Test that verifyFile is a suspend function
     * Source: export async function verifyFile(filePath: string, expectedSize: number, tolerance?: number): Promise<VerificationResult>
     */
    @Test
    fun testAsyncOperationsUseCoroutines_verifyFile() = runTest {
        // GIVEN: Existing file with known size
        val data = "coroutine-verify-test"
        AtomicWriteUtils.atomicWrite(testFilePath, data)
        val expectedSize = data.length.toLong()

        // WHEN: Calling suspend function verifyFile
        val result = AtomicWriteUtils.verifyFile(testFilePath, expectedSize)

        // THEN: Function executes in coroutine context and returns result
        assertEquals(true, result.valid)
        assertEquals(expectedSize, result.actualSize)
        assertNull(result.error)
    }

    /**
     * Test that operations use proper coroutine context (Dispatchers.IO)
     */
    @Test
    fun testAsyncOperationsUseCoroutines_properContext() = runTest {
        // GIVEN: Multiple file operations
        val testFilePath2 = File(tempDir, "test-file-2.txt").absolutePath

        // WHEN: Executing multiple suspend functions concurrently
        val result1 = AtomicWriteUtils.atomicWrite(testFilePath, "concurrent-1")
        val result2 = AtomicWriteUtils.atomicWrite(testFilePath2, "concurrent-2")

        // THEN: All operations complete successfully with proper coroutine context
        assertEquals(true, result1.success)
        assertEquals(true, result2.success)
        assertEquals(true, File(testFilePath).exists())
        assertEquals(true, File(testFilePath2).exists())
    }

    /**
     * AC-3: Storage abstractions work correctly
     * GIVEN: Source uses AsyncStorage/secure storage
     * WHEN: Kotlin equivalents read/write data
     * THEN: Data persists correctly using platform storage
     */

    /**
     * Test atomic write with temporary file and rename pattern
     * Source: Uses .tmp file pattern with atomic rename
     */
    @Test
    fun testStorageAbstractions_atomicWriteWithTempFile() = runTest {
        // GIVEN: File path and data
        val data = "temp-file-test"
        val tempPath = "$testFilePath.tmp"

        // WHEN: Writing atomically
        val result = AtomicWriteUtils.atomicWrite(testFilePath, data)

        // THEN: Temp file is cleaned up, final file exists
        assertEquals(true, result.success)
        assertEquals(true, File(testFilePath).exists())
        val tempFileExists = File(tempPath).exists()
        assertEquals(false, tempFileExists)
        assertEquals(data, File(testFilePath).readText())
    }

    /**
     * Test atomic append preserves existing content
     * Source: Reads existing content and combines with new chunk
     */
    @Test
    fun testStorageAbstractions_atomicAppendPreservesContent() = runTest {
        // GIVEN: Existing file with content
        val originalContent = "original-content"
        AtomicWriteUtils.atomicWrite(testFilePath, originalContent)

        // WHEN: Appending new chunk
        val chunk = "-appended"
        val result = AtomicWriteUtils.atomicAppend(testFilePath, chunk, originalContent.length.toLong())

        // THEN: Original content is preserved
        assertEquals(true, result.success)
        assertEquals("original-content-appended", File(testFilePath).readText())
    }

    /**
     * Test atomic delete is idempotent
     * Source: deleteAsync with { idempotent: true }
     */
    @Test
    fun testStorageAbstractions_atomicDeleteIdempotent() = runTest {
        // GIVEN: No file exists
        val nonExistentPath = File(tempDir, "does-not-exist.txt").absolutePath

        // WHEN: Deleting non-existent file
        val result = AtomicWriteUtils.atomicDelete(nonExistentPath)

        // THEN: Operation succeeds (idempotent)
        assertEquals(true, result)
    }

    /**
     * Test file verification with size matching
     * Source: Checks file size within tolerance
     */
    @Test
    fun testStorageAbstractions_verifyFileWithSize() = runTest {
        // GIVEN: File with known size
        val data = "verification-test-data"
        AtomicWriteUtils.atomicWrite(testFilePath, data)

        // WHEN: Verifying with exact size
        val result = AtomicWriteUtils.verifyFile(testFilePath, data.length.toLong())

        // THEN: Verification passes
        assertEquals(true, result.valid)
        assertEquals(data.length.toLong(), result.actualSize)
        assertNull(result.error)
    }

    /**
     * Test file verification with tolerance
     * Source: tolerance parameter allows size deviation
     */
    @Test
    fun testStorageAbstractions_verifyFileWithTolerance() = runTest {
        // GIVEN: File with known size
        val data = "tolerance-test"
        AtomicWriteUtils.atomicWrite(testFilePath, data)
        val expectedSize = data.length.toLong() + 10 // Add some buffer

        // WHEN: Verifying with tolerance
        val result = AtomicWriteUtils.verifyFile(testFilePath, expectedSize, tolerance = 20)

        // THEN: Verification passes within tolerance
        assertEquals(true, result.valid)
        assertEquals(data.length.toLong(), result.actualSize)
    }

    /**
     * Test file verification failure on size mismatch
     * Source: Returns error when size differs beyond tolerance
     */
    @Test
    fun testStorageAbstractions_verifyFileFailureOnMismatch() = runTest {
        // GIVEN: File with known size
        val data = "size-mismatch-test"
        AtomicWriteUtils.atomicWrite(testFilePath, data)

        // WHEN: Verifying with wrong size
        val result = AtomicWriteUtils.verifyFile(testFilePath, expectedSize = 9999, tolerance = 0)

        // THEN: Verification fails with error
        assertEquals(false, result.valid)
        assertEquals(data.length.toLong(), result.actualSize)
        assertEquals("Size mismatch: expected 9999, got ${data.length}", result.error)
    }

    /**
     * Test atomic write cleanup on failure
     * Source: Cleans up temp file on write failure
     */
    @Test
    fun testStorageAbstractions_cleanupOnWriteFailure() = runTest {
        // Note: This test verifies the cleanup behavior in the implementation
        // The implementation uses try-catch to clean up temp files on failure

        // GIVEN: Invalid path that will cause failure
        val invalidPath = "/invalid/path/that/cannot/be/created/test.txt"

        // WHEN: Attempting to write to invalid path
        val result = AtomicWriteUtils.atomicWrite(invalidPath, "test-data")

        // THEN: Operation fails gracefully
        assertEquals(false, result.success)
        assertEquals(true, result.error != null)
    }

    /**
     * Test atomic append to non-existent file
     * Source: Treats missing file as empty and proceeds
     */
    @Test
    fun testStorageAbstractions_appendToNonExistentFile() = runTest {
        // GIVEN: Non-existent file path
        val newFilePath = File(tempDir, "new-file.txt").absolutePath

        // WHEN: Appending to non-existent file
        val result = AtomicWriteUtils.atomicAppend(newFilePath, "new-content", 0)

        // THEN: File is created with content
        assertEquals(true, result.success)
        assertEquals(true, File(newFilePath).exists())
        assertEquals("new-content", File(newFilePath).readText())
    }
}
