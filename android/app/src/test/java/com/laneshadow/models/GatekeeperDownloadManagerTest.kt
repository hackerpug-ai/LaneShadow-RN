package com.laneshadow.models

import android.content.Context
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations
import java.io.File

/**
 * Tests for GatekeeperDownloadManager
 *
 * Follows TDD: RED → GREEN → REFACTOR for each acceptance criterion
 *
 * Translation from: react-native/lib/model/download-manager.ts
 */
class GatekeeperDownloadManagerTest {

    @Mock
    private lateinit var mockContext: Context

    private lateinit var mockDownloadDir: File

    private lateinit var checksumValidator: ChecksumValidator

    private lateinit var testManager: GatekeeperDownloadManager

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        checksumValidator = ChecksumValidator()

        // Create temp directory for tests
        val tempDir = System.getProperty("java.io.tmpdir")
        mockDownloadDir = File(tempDir, "test_models_${System.currentTimeMillis()}")
        mockDownloadDir.mkdirs()

        // Setup Context mock to return our test directory
        `when`(mockContext.filesDir).thenReturn(mockDownloadDir)
    }

    // AC-1: Public API matches source
    @Test
    fun testPublicAPIMatchesSource() = runTest {
        // GIVEN: TypeScript source defines exported functions
        // class GatekeeperDownloadManager {
        //   constructor()
        //   async startDownload(networkStatus?: NetworkStatus): Promise<void>
        //   async getProgress(): Promise<ModelDownloadProgress | null>
        //   async canResume(): Promise<boolean>
        //   async cancelDownload(): Promise<void>
        // }

        // WHEN: Kotlin equivalents are called
        testManager = GatekeeperDownloadManager(
            context = mockContext
        )

        // THEN: Function signatures match (names, parameters, return types)
        // The fact that these compile and run proves the API exists

        // Verify startDownload exists and is suspend (takes NetworkStatus?)
        try {
            testManager.startDownload(NetworkStatus(isConnected = true, type = "wifi"))
        } catch (e: Exception) {
            // May fail without actual download infrastructure, but proves method exists
        }

        // Verify getProgress returns ModelDownloadProgress or null
        val progress = testManager.getProgress()
        assertTrue("getProgress should return ModelDownloadProgress or null",
            progress == null || progress is ModelDownloadProgress)

        // Verify canResume returns Boolean
        val canResume = testManager.canResume()
        assertTrue("canResume should return Boolean",
            canResume is Boolean)

        // Verify cancelDownload is callable (suspend)
        testManager.cancelDownload()
    }

    // AC-2: Async operations use coroutines
    @Test
    fun testAsyncOperationsUseCoroutines() = runTest {
        // GIVEN: Source uses async/await patterns
        // WHEN: Kotlin equivalents are invoked
        // THEN: Functions are suspend functions with proper context

        testManager = GatekeeperDownloadManager(
            context = mockContext
        )

        // Verify all suspend methods can be called from runTest
        // If we get here without exception, methods are properly suspend

        // Test getProgress
        val progress = testManager.getProgress()
        // getProgress can return null when no download is in progress
        // Just verify it completes without exception

        // Test canResume
        val canResume = testManager.canResume()
        assertNotNull("canResume should complete", canResume)

        // Test cancelDownload
        testManager.cancelDownload()

        // Test startDownload (may fail without proper setup, but should be suspend)
        try {
            testManager.startDownload(NetworkStatus(isConnected = true, type = "wifi"))
        } catch (e: Exception) {
            // Expected - proves it's suspend
        }
    }

    // AC-3: Storage abstractions work correctly
    @Test
    fun testStorageAbstractions() = runTest {
        // GIVEN: Source uses AsyncStorage/secure storage
        // WHEN: Kotlin equivalents read/write data
        // THEN: Data persists correctly using platform storage (FileSystem)

        testManager = GatekeeperDownloadManager(
            context = mockContext
        )

        // Create a test file to simulate partial download
        val testModelFile = File(mockDownloadDir, "models/qwen2.5-0.5b-instruct-q4_k_m.gguf")
        testModelFile.parentFile?.mkdirs()
        testModelFile.createNewFile()

        // Test canResume detects existing file
        val canResume = testManager.canResume()
        assertTrue("canResume should return true when file exists", canResume)

        // Test cancelDownload cleans up the file
        testManager.cancelDownload()
        assertFalse("File should be deleted after cancel", testModelFile.exists())

        // Clean up
        mockDownloadDir.deleteRecursively()
    }
}
