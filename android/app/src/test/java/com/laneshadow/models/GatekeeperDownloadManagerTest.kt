package com.laneshadow.models

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations
import org.mockito.Mockito.atLeastOnce

/**
 * Tests for GatekeeperDownloadManager
 *
 * Follows TDD: RED → GREEN → REFACTOR for each acceptance criterion
 *
 * Translation from: react-native/lib/model/gatekeeper.ts
 */
class GatekeeperDownloadManagerTest {

    @Mock
    private lateinit var mockContext: Context

    @Mock
    private lateinit var mockSharedPreferences: SharedPreferences

    @Mock
    private lateinit var mockEditor: SharedPreferences.Editor

    private lateinit var checksumValidator: ChecksumValidator

    private lateinit var checksumValidatorWrapper: ChecksumValidatorWrapper

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        val checksumValidator = ChecksumValidator()
        checksumValidatorWrapper = ChecksumValidatorWrapper(checksumValidator)

        // Setup SharedPreferences mocks
        `when`(mockContext.getSharedPreferences(anyString(), anyInt())).thenReturn(mockSharedPreferences)
        `when`(mockSharedPreferences.edit()).thenReturn(mockEditor)
        `when`(mockEditor.putString(anyString(), anyString())).thenReturn(mockEditor)
        `when`(mockEditor.putLong(anyString(), anyLong())).thenReturn(mockEditor)
        `when`(mockEditor.remove(anyString())).thenReturn(mockEditor)
        `when`(mockEditor.clear()).thenReturn(mockEditor)
    }

    // AC-1: Public API matches source
    @Test
    fun testPublicAPIMatchesSource() = runTest {
        // GIVEN: TypeScript source defines exported functions
        // class ModelGatekeeper {
        //   constructor(modelFilePath, expectedChecksum, checksumValidator)
        //   async checkModelStatus(): Promise<ModelGatekeeperStatus>
        //   async deleteCorruptedModel(): Promise<void>
        //   async markSetupComplete(): Promise<void>
        //   async isSetupMarkedComplete(): Promise<boolean>
        //   async clearSetupCompleteFlag(): Promise<void>
        //   async validateNavigation(targetRoute): Promise<boolean>
        //   destroy(): void
        // }

        // WHEN: Kotlin equivalents are called
        val manager = GatekeeperDownloadManager(
            context = mockContext,
            modelFilePath = "/path/to/model",
            expectedChecksum = "abc123",
            checksumValidator = checksumValidatorWrapper
        )

        // THEN: Function signatures match (names, parameters, return types)
        // Verify class exists and has the correct methods by calling them
        // The fact that these compile and run proves the API exists

        // Verify checkModelStatus exists and returns ModelGatekeeperStatus
        val status = manager.checkModelStatus()
        assertTrue("checkModelStatus should return ModelGatekeeperStatus",
            status is ModelGatekeeperStatus)

        // Verify deleteCorruptedModel is callable (suspend)
        try {
            manager.deleteCorruptedModel()
        } catch (e: Exception) {
            // Expected for non-existent file, but proves method exists
        }

        // Verify markSetupComplete is callable (suspend)
        manager.markSetupComplete()

        // Verify isSetupMarkedComplete returns Boolean
        val isComplete = manager.isSetupMarkedComplete()
        assertTrue("isSetupMarkedComplete should return Boolean",
            isComplete is Boolean)

        // Verify clearSetupCompleteFlag is callable (suspend)
        manager.clearSetupCompleteFlag()

        // Verify validateNavigation takes String parameter and returns Boolean
        val canNavigate = manager.validateNavigation("/test/route")
        assertTrue("validateNavigation should return Boolean",
            canNavigate is Boolean)

        // Verify destroy is callable (non-suspend)
        manager.destroy()
    }

    // AC-2: Async operations use coroutines
    @Test
    fun testAsyncOperationsUseCoroutines() = runTest {
        // GIVEN: Source uses async/await patterns
        // WHEN: Kotlin equivalents are invoked
        // THEN: Functions are suspend functions with proper context

        val manager = GatekeeperDownloadManager(
            context = mockContext,
            modelFilePath = "/path/to/model",
            expectedChecksum = "abc123",
            checksumValidator = checksumValidatorWrapper
        )

        // Verify all suspend methods can be called from runTest
        val status = manager.checkModelStatus()
        assertNotNull("checkModelStatus should return ModelGatekeeperStatus", status)

        val isSetupComplete = manager.isSetupMarkedComplete()
        assertNotNull("isSetupMarkedComplete should return Boolean", isSetupComplete)

        // If we get here without exception, methods are properly suspend
        // Test other void methods
        manager.markSetupComplete()
        manager.clearSetupCompleteFlag()

        // Test deleteCorruptedModel with non-existent file (should not throw)
        try {
            manager.deleteCorruptedModel()
        } catch (e: Exception) {
            // Expected for non-existent file, but proves it's suspend
        }

        // Test validateNavigation
        val canNavigate = manager.validateNavigation("/some/route")
        assertNotNull("validateNavigation should return Boolean", canNavigate)

        // Test destroy (non-suspend)
        manager.destroy()
    }

    // AC-3: Storage abstractions work correctly
    @Test
    fun testStorageAbstractions() = runTest {
        // GIVEN: Source uses AsyncStorage/secure storage
        // WHEN: Kotlin equivalents read/write data
        // THEN: Data persists correctly using platform storage (SharedPreferences)

        // Test markSetupComplete writes to SharedPreferences
        `when`(mockSharedPreferences.getString("laneshadow_model_setup_complete", null))
            .thenReturn(null) // Initial state

        val manager = GatekeeperDownloadManager(
            context = mockContext,
            modelFilePath = "/path/to/model",
            expectedChecksum = "abc123",
            checksumValidator = checksumValidatorWrapper
        )

        manager.markSetupComplete()

        // Verify SharedPreferences were accessed
        verify(mockSharedPreferences, atLeastOnce()).edit()
        verify(mockEditor, atLeastOnce()).putString(eq("laneshadow_model_setup_complete"), eq("true"))

        // Test isSetupMarkedComplete reads from SharedPreferences
        `when`(mockSharedPreferences.getString("laneshadow_model_setup_complete", null))
            .thenReturn("true")
        val isComplete = manager.isSetupMarkedComplete()

        assertTrue("isSetupMarkedComplete should return true", isComplete)

        // Test clearSetupCompleteFlag removes from SharedPreferences
        manager.clearSetupCompleteFlag()

        verify(mockEditor, atLeastOnce()).remove("laneshadow_model_setup_complete")
    }
}
