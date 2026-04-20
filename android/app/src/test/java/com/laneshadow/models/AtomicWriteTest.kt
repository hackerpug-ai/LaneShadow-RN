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
        assertTrue(result.success)
        assertEquals(testFilePath, result.filePath)
        assertNull(result.error)

        // Verify file was actually written
        val file = File(testFilePath)
        assertTrue(file.exists())
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
        assertTrue(writeResult.success, "Initial write should succeed")

        // WHEN: Calling atomicAppend with chunk and offset
        val chunk = "appended"
        val offset = 8L
        val result = AtomicWriteUtils.atomicAppend(testFilePath, chunk, offset)

        // THEN: Result matches source structure
        assertTrue(result.success)
        assertEquals(testFilePath, result.filePath)
        assertNull(result.error)

        // Verify content was appended
        val file = File(testFilePath)
        assertTrue(file.exists())
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
        assertTrue(writeResult.success, "Write should succeed")
        val file = File(testFilePath)
        assertTrue(file.exists(), "File should exist before delete")

        // WHEN: Calling atomicDelete
        val result = AtomicWriteUtils.atomicDelete(testFilePath)

        // THEN: Returns boolean matching source
        assertTrue(result)
        assertTrue(!file.exists())
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
        assertTrue(writeResult.success, "Write should succeed")
        val expectedSize = data.length.toLong()

        // WHEN: Calling verifyFile
        val result = AtomicWriteUtils.verifyFile(testFilePath, expectedSize)

        // THEN: Result matches source structure
        assertTrue(result.valid)
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
        assertTrue(writeResult.success)
        assertEquals("/path/to/file", writeResult.filePath)
        assertNull(writeResult.error)

        // Source: interface VerificationResult { valid: boolean; actualSize?: number; error?: string }
        val verifyResult = VerificationResult(
            valid = false,
            actualSize = 100L,
            error = "Size mismatch"
        )
        assertTrue(!verifyResult.valid)
        assertEquals(100L, verifyResult.actualSize)
        assertEquals("Size mismatch", verifyResult.error)
    }
}
