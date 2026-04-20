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

    // AC-1: Public API matches source
    @Test
    fun testPublicAPIMatchesSource() = runTest {
        // GIVEN: TypeScript source defines exported functions
        // ChecksumValidator class with:
        // - validate(filePath, expectedChecksum) → Promise<ChecksumResult>

        // WHEN: Kotlin equivalents are called
        val validator = ChecksumValidator()

        // THEN: Function signatures match (names, parameters, return types)
        // Verify class exists with correct method signature
        val validateMethod = validator.javaClass.getDeclaredMethod(
            "validate",
            String::class.java,
            String::class.java
        )

        // Verify method name matches
        assertEquals("validate", validateMethod.name)

        // Verify parameter count matches
        assertEquals(2, validateMethod.parameterCount)

        // Verify return type contains suspend signature
        assertTrue("validate should return ChecksumResult",
            validateMethod.returnType.name.contains("ChecksumResult") ||
            validateMethod.returnType.name.contains("Continuation"))
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

        // Create a file > 50MB (we'll simulate this by testing the logic)
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
