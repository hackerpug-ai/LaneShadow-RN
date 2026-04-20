package com.laneshadow.models

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Atomic Write Utilities
 *
 * Provides atomic file operations to prevent partial file corruption
 * in case of crashes or interruptions during download.
 *
 * Pattern:
 * 1. Write to temporary file (.tmp)
 * 2. Verify write completed successfully
 * 3. Atomic rename to final path (POSIX guarantee)
 *
 * This ensures that either the complete file exists or nothing exists,
 * never a partial/corrupted file.
 *
 * Translation from: react-native/lib/ai/atomic-write.ts
 */

/**
 * Atomic write result
 *
 * Matches TypeScript interface:
 * interface AtomicWriteResult {
 *   success: boolean
 *   filePath?: string
 *   error?: string
 * }
 */
data class AtomicWriteResult(
    val success: Boolean,
    val filePath: String? = null,
    val error: String? = null
)

/**
 * Verification result
 *
 * Matches TypeScript interface:
 * interface VerificationResult {
 *   valid: boolean
 *   actualSize?: number
 *   error?: string
 * }
 */
data class VerificationResult(
    val valid: Boolean,
    val actualSize: Long? = null,
    val error: String? = null
)

/**
 * Atomic write utilities object
 *
 * Matches TypeScript exports:
 * - atomicWrite(filePath, data): Promise<AtomicWriteResult>
 * - atomicAppend(filePath, chunk, offset): Promise<AtomicWriteResult>
 * - atomicDelete(filePath): Promise<boolean>
 * - verifyFile(filePath, expectedSize, tolerance?): Promise<VerificationResult>
 */
object AtomicWriteUtils {

    /**
     * Write data to file atomically
     *
     * Matches: export async function atomicWrite(filePath: string, data: string): Promise<AtomicWriteResult>
     *
     * @param filePath - Target file path
     * @param data - Data to write (base64 encoded string)
     * @returns Write result with success status
     */
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

    /**
     * Append data to file atomically
     *
     * Matches: export async function atomicAppend(filePath: string, chunk: string, offset: number): Promise<AtomicWriteResult>
     *
     * For large downloads, this allows resuming by appending chunks.
     * Still uses atomic operations for each chunk.
     *
     * @param filePath - Target file path
     * @param chunk - Data chunk to append (base64 encoded)
     * @param offset - Byte offset for this chunk
     * @returns Write result with success status
     */
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

    /**
     * Delete file atomically (idempotent)
     *
     * Matches: export async function atomicDelete(filePath: string): Promise<boolean>
     *
     * @param filePath - File path to delete
     * @returns Success status
     */
    suspend fun atomicDelete(filePath: String): Boolean = withContext(Dispatchers.IO) {
        try {
            File(filePath).delete()
        } catch (_: Throwable) {
            false
        }
    }

    /**
     * Verify file integrity by checking size and optionally checksum
     *
     * Matches: export async function verifyFile(filePath: string, expectedSize: number, tolerance?: number): Promise<VerificationResult>
     *
     * @param filePath - File path to verify
     * @param expectedSize - Expected file size in bytes
     * @param tolerance - Allowed size deviation (default: 0)
     * @returns Verification result
     */
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
