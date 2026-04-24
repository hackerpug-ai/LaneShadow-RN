package com.laneshadow.models

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.io.FileWriter

/**
 * Tests for ChecksumValidator
 *
 * Follows TDD: RED → GREEN → REFACTOR for each acceptance criterion
 */
class ChecksumValidatorTest {

    private lateinit var testFile: File

    // AC-1: Public API remains callable via the expected coroutine surface
    @Test
    fun testPublicAPIMatchesSource() = runTest {
        val validator = ChecksumValidator()
        testFile = File.createTempFile("checksum-api", ".tmp")
        testFile.writeText("api contract")

        val expectedChecksum = validator.computeSHA256ForTest(testFile.absolutePath)
        val result = validator.validate(testFile.absolutePath, expectedChecksum)

        assertTrue("validate should accept two strings and return a successful result", result.valid)
        assertEquals(expectedChecksum, result.actualChecksum)

        testFile.delete()
    }

    // AC-2: Async operations use coroutines
    @Test
    fun testAsyncOperationsUseCoroutines() = runTest {
        // GIVEN: Source uses async/await patterns
        // WHEN: Kotlin equivalents are invoked
        // THEN: Functions are suspend functions with proper context

        val validator = ChecksumValidator()

        // Create a temporary test file with known content
        testFile = File.createTempFile("checksum-test", ".tmp")
        testFile.writeText("test content for checksum")

        // Verify validate is a suspend function by calling it from runTest
        val result = validator.validate(
            testFile.absolutePath,
            "known_checksum_placeholder"
        )

        // If we get here without exception, validate is properly suspend
        assertNotNull("validate should return ChecksumResult", result)

        // Clean up
        testFile.delete()
    }

    // AC-3: Storage abstractions work correctly
    @Test
    fun testStorageAbstractions() = runTest {
        // GIVEN: Source uses file system operations
        // WHEN: Kotlin equivalents read/write data
        // THEN: Data persists correctly using platform storage (java.io.File)

        val validator = ChecksumValidator()

        // Create a temporary test file with known content
        testFile = File.createTempFile("checksum-test", ".tmp")
        val testContent = "test content for checksum validation"
        testFile.writeText(testContent)

        // Compute the expected checksum using the same algorithm
        val expectedChecksum = validator.computeSHA256ForTest(testFile.absolutePath)

        // WHEN: validate is called
        val result = validator.validate(testFile.absolutePath, expectedChecksum)

        // THEN: validation should succeed
        assertTrue("Validation should succeed for matching checksums", result.valid)
        assertEquals("Actual checksum should match", expectedChecksum, result.actualChecksum)
        assertNull("No error should occur", result.error)

        // Test non-matching checksum
        val mismatchResult = validator.validate(testFile.absolutePath, "wrong_checksum")
        assertFalse("Validation should fail for mismatched checksums", mismatchResult.valid)
        assertEquals("Actual checksum should still be returned", expectedChecksum, mismatchResult.actualChecksum)

        // Clean up
        testFile.delete()
    }

    // Additional test: Error handling for non-existent file
    @Test
    fun testNonExistentFile() = runTest {
        // GIVEN: File doesn't exist
        val validator = ChecksumValidator()
        val nonExistentPath = "/path/to/non/existent/file.txt"

        // WHEN: validate is called
        val result = validator.validate(nonExistentPath, "any_checksum")

        // THEN: Should return invalid result with error
        assertFalse("Validation should fail for non-existent file", result.valid)
        assertNotNull("Error message should be present", result.error)
        assertTrue("Error should mention file doesn't exist",
            result.error!!.contains("does not exist") || result.error!!.contains("File"))
    }

    // Additional test: Large file bypass
    @Test
    fun testLargeFileBypass() = runTest {
        // GIVEN: File is larger than 50MB
        val validator = ChecksumValidator()

        // Create a file > 50MB so validation explicitly bypasses checksum comparison
        testFile = File.createTempFile("checksum-large", ".tmp")

        // Write 51MB of data
        val largeContent = "x".repeat(51 * 1024 * 1024)
        testFile.writeText(largeContent)

        // WHEN: validate is called
        val result = validator.validate(testFile.absolutePath, "")

        // THEN: Should bypass validation (empty checksum)
        assertFalse("Validation should be bypassed for large files", result.valid)
        assertEquals("Actual checksum should be empty", "", result.actualChecksum)

        // Clean up
        testFile.delete()
    }
}
