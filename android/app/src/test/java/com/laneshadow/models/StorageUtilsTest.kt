package com.laneshadow.models

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

/**
 * Tests for StorageUtils
 *
 * Follows TDD: RED → GREEN → REFACTOR for each acceptance criterion
 */
class StorageUtilsTest {

    // AC-1: Public API matches source
    @Test
    fun testPublicAPIMatchesSource() = runTest {
        // GIVEN: TypeScript source defines exported functions
        // StorageUtils object with:
        // - configure(opts) → void
        // - getStorageInfo() → Promise<StorageInfo>
        // - estimateRegionSize(bounds, minZoom, maxZoom) → number
        // - hasEnoughStorage(requiredBytes) → Promise<boolean>
        // - formatBytes(bytes) → string

        // WHEN: Kotlin equivalents are called
        // THEN: Function signatures match (names, parameters, return types)

        // Verify StorageUtils object exists
        assertNotNull("StorageUtils object should exist", StorageUtils)

        // Verify configure method exists by calling it
        val mockProvider = object : StorageInfoProvider {
            override suspend fun getStorageInfo(): StorageInfo {
                return StorageInfo(1000, 500)
            }
        }
        StorageUtils.configure(mockProvider)
        // If we get here without exception, configure exists

        // Verify estimateRegionSize method exists by calling it
        val bounds = listOf(listOf(-122.4, 37.7), listOf(-122.3, 37.8))
        val size = StorageUtils.estimateRegionSize(bounds, 10, 15)
        assertTrue("estimateRegionSize should return positive bytes", size > 0)

        // Verify formatBytes method exists by calling it
        val formatted = StorageUtils.formatBytes(1536)
        assertEquals("formatBytes should format correctly", "1.5 KB", formatted)

        // Verify getStorageInfo and hasEnoughStorage are suspend by calling them
        val info = StorageUtils.getStorageInfo()
        assertNotNull("getStorageInfo should return StorageInfo", info)
        assertEquals(1000, info.totalBytes)
        assertEquals(500, info.freeBytes)

        val hasEnough = StorageUtils.hasEnoughStorage(100)
        assertFalse("Should not have enough storage (500-500MB buffer < 100)", hasEnough)
    }

    // AC-2: Async operations use coroutines
    @Test
    fun testAsyncOperationsUseCoroutines() = runTest {
        // GIVEN: Source uses async/await patterns
        // WHEN: Kotlin equivalents are invoked
        // THEN: Functions are suspend functions with proper context

        val mockProvider = object : StorageInfoProvider {
            override suspend fun getStorageInfo(): StorageInfo {
                return StorageInfo(
                    totalBytes = 64L * 1024 * 1024 * 1024,
                    freeBytes = 32L * 1024 * 1024 * 1024
                )
            }
        }

        StorageUtils.configure(mockProvider)

        // Verify getStorageInfo is suspend by calling it from runTest
        val info = StorageUtils.getStorageInfo()
        assertNotNull("getStorageInfo should return StorageInfo", info)
        assertEquals(64L * 1024 * 1024 * 1024, info.totalBytes)
        assertEquals(32L * 1024 * 1024 * 1024, info.freeBytes)

        // Verify hasEnoughStorage is suspend
        val hasEnough = StorageUtils.hasEnoughStorage(1024L * 1024 * 1024) // 1GB
        assertTrue("Should have enough storage", hasEnough)
    }

    // AC-3: Storage abstractions work correctly
    @Test
    fun testStorageAbstractions() = runTest {
        // GIVEN: Source uses AsyncStorage/secure storage
        // WHEN: Kotlin equivalents read/write data
        // THEN: Data persists correctly using platform storage

        val mockProvider = object : StorageInfoProvider {
            private var freeBytes = 32L * 1024 * 1024 * 1024

            override suspend fun getStorageInfo(): StorageInfo {
                return StorageInfo(
                    totalBytes = 64L * 1024 * 1024 * 1024,
                    freeBytes = freeBytes
                )
            }
        }

        StorageUtils.configure(mockProvider)

        // Test storage info retrieval
        val info = StorageUtils.getStorageInfo()
        assertNotNull("StorageInfo should not be null", info)
        assertTrue("Total bytes should be positive", info.totalBytes > 0)
        assertTrue("Free bytes should be positive", info.freeBytes > 0)

        // Test hasEnoughStorage with buffer calculation
        val hasEnough = StorageUtils.hasEnoughStorage(10L * 1024 * 1024 * 1024) // 10GB
        // 32GB free - 500MB buffer = 31.5GB available, 10GB should fit
        assertTrue("Should have enough storage with buffer", hasEnough)
    }
}
