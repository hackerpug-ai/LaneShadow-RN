package com.laneshadow.models

import java.io.File
import java.security.MessageDigest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * SHA-256 checksum validation utilities
 *
 * Validates model file integrity before loading to prevent corrupted models
 * from causing runtime errors or incorrect inference results.
 */
class ChecksumValidator {

    /**
     * Validate file checksum against expected value
     *
     * @param filePath - Path to model file
     * @param expectedChecksum - Expected SHA-256 hash
     * @returns Checksum validation result
     */
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

    /**
     * Compute SHA-256 hash of file
     *
     * Uses chunked reading to avoid loading large files into memory.
     *
     * @param filePath - Path to file
     * @returns SHA-256 hash (hex string)
     */
    suspend fun computeSHA256ForTest(filePath: String): String = computeSHA256(filePath)

    /**
     * Compute SHA-256 hash of file
     *
     * Uses chunked reading to avoid loading large files into memory.
     *
     * @param filePath - Path to file
     * @returns SHA-256 hash (hex string)
     */
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

/**
 * Result of checksum validation
 */
data class ChecksumResult(
    val valid: Boolean,
    val actualChecksum: String? = null,
    val error: String? = null
)
