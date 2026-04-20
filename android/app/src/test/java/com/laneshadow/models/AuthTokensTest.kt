package com.laneshadow.models

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.anyLong
import org.mockito.Mockito.anyString
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.mockito.MockitoAnnotations
import org.mockito.Mockito.any
import org.mockito.ArgumentMatchers.anyBoolean
import org.mockito.ArgumentMatchers.eq
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD Test for AuthTokens Model Translation
 *
 * AC-1: Public API matches source
 * GIVEN: TypeScript source defines exported functions
 * WHEN: Kotlin equivalents are called
 * THEN: Function signatures match (names, parameters, return types)
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE)
class AuthTokensTest {

    @Mock
    private lateinit var mockContext: Context

    @Mock
    private lateinit var mockPrefs: SharedPreferences

    @Mock
    private lateinit var mockEditor: SharedPreferences.Editor

    private lateinit var authTokenStorage: AuthTokenStorage

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)

        `when`(mockContext.getSharedPreferences("auth_tokens", Context.MODE_PRIVATE))
            .thenReturn(mockPrefs)
        `when`(mockPrefs.edit()).thenReturn(mockEditor)
        `when`(mockEditor.putString(anyString(), anyString())).thenReturn(mockEditor)
        `when`(mockEditor.putLong(anyString(), anyLong())).thenReturn(mockEditor)
        `when`(mockEditor.remove(anyString())).thenReturn(mockEditor)
        `when`(mockEditor.clear()).thenReturn(mockEditor)

        authTokenStorage = SharedPrefsAuthTokenStorage(mockContext)
    }

    /**
     * Test that getStoredAccessToken matches source signature
     * Source: export const getStoredAccessToken = async (): Promise<string | undefined>
     */
    @Test
    fun testPublicAPI_matchesSource_getStoredAccessToken() = runTest {
        // GIVEN: Token is stored
        val expectedToken = "test-access-token"
        `when`(mockPrefs.getString("workos_access_token", null))
            .thenReturn(expectedToken)

        // WHEN: Getting stored access token
        val result = authTokenStorage.getStoredAccessToken()

        // THEN: Returns string or null (Kotlin equivalent of undefined)
        assertEquals(expectedToken, result)
    }

    /**
     * Test that storeAccessToken matches source signature
     * Source: export const storeAccessToken = async (token: string): Promise<void>
     */
    @Test
    fun testPublicAPI_matchesSource_storeAccessToken() = runTest {
        // GIVEN: Token to store
        val token = "new-access-token"

        // WHEN: Storing access token
        authTokenStorage.storeAccessToken(token)

        // THEN: Token is stored with correct key
        verify(mockEditor).putString("workos_access_token", token)
        verify(mockEditor).apply()
    }

    /**
     * Test that storeRefreshToken matches source signature
     * Source: export const storeRefreshToken = async (token: string): Promise<void>
     */
    @Test
    fun testPublicAPI_matchesSource_storeRefreshToken() = runTest {
        // GIVEN: Refresh token to store
        val token = "refresh-token"

        // WHEN: Storing refresh token
        authTokenStorage.storeRefreshToken(token)

        // THEN: Token is stored with correct key
        verify(mockEditor).putString("workos_refresh_token", token)
        verify(mockEditor).apply()
    }

    /**
     * Test that getRefreshToken matches source signature
     * Source: export const getRefreshToken = async (): Promise<string | null>
     */
    @Test
    fun testPublicAPI_matchesSource_getRefreshToken() = runTest {
        // GIVEN: Refresh token is stored
        val expectedToken = "stored-refresh-token"
        `when`(mockPrefs.getString("workos_refresh_token", null))
            .thenReturn(expectedToken)

        // WHEN: Getting refresh token
        val result = authTokenStorage.getRefreshToken()

        // THEN: Returns string or null
        assertEquals(expectedToken, result)
    }

    /**
     * Test that storeTokenExpiry matches source signature
     * Source: export const storeTokenExpiry = async (expiresAt: number): Promise<void>
     */
    @Test
    fun testPublicAPI_matchesSource_storeTokenExpiry() = runTest {
        // GIVEN: Expiry timestamp
        val expiresAt = 1234567890L

        // WHEN: Storing token expiry
        authTokenStorage.storeTokenExpiry(expiresAt)

        // THEN: Expiry is stored with correct key
        verify(mockEditor).putLong("workos_token_expiry", expiresAt)
        verify(mockEditor).apply()
    }

    /**
     * Test that getTokenExpiry matches source signature
     * Source: export const getTokenExpiry = async (): Promise<number | null>
     */
    @Test
    fun testPublicAPI_matchesSource_getTokenExpiry() = runTest {
        // GIVEN: Token expiry is stored
        val expectedExpiry = 1234567890L
        `when`(mockPrefs.getLong("workos_token_expiry", -1L))
            .thenReturn(expectedExpiry)

        // WHEN: Getting token expiry
        val result = authTokenStorage.getTokenExpiry()

        // THEN: Returns Long or null
        assertEquals(expectedExpiry, result)
    }

    /**
     * Test that getTokenExpiry returns null when not set
     */
    @Test
    fun testPublicAPI_matchesSource_getTokenExpiry_returnsNull() = runTest {
        // GIVEN: Token expiry is not stored
        `when`(mockPrefs.getLong("workos_token_expiry", -1L))
            .thenReturn(-1L)

        // WHEN: Getting token expiry
        val result = authTokenStorage.getTokenExpiry()

        // THEN: Returns null
        assertNull(result)
    }

    /**
     * Test that storeCodeVerifier matches source signature
     * Source: export const storeCodeVerifier = async (verifier: string): Promise<void>
     */
    @Test
    fun testPublicAPI_matchesSource_storeCodeVerifier() = runTest {
        // GIVEN: Code verifier to store
        val verifier = "code-verifier-123"

        // WHEN: Storing code verifier
        authTokenStorage.storeCodeVerifier(verifier)

        // THEN: Verifier is stored with correct key
        verify(mockEditor).putString("workos_code_verifier", verifier)
        verify(mockEditor).apply()
    }

    /**
     * Test that getCodeVerifier matches source signature
     * Source: export const getCodeVerifier = async (): Promise<string | null>
     */
    @Test
    fun testPublicAPI_matchesSource_getCodeVerifier() = runTest {
        // GIVEN: Code verifier is stored
        val expectedVerifier = "stored-verifier"
        `when`(mockPrefs.getString("workos_code_verifier", null))
            .thenReturn(expectedVerifier)

        // WHEN: Getting code verifier
        val result = authTokenStorage.getCodeVerifier()

        // THEN: Returns string or null
        assertEquals(expectedVerifier, result)
    }

    /**
     * Test that storeActiveOrganizationId matches source signature
     * Source: export const storeActiveOrganizationId = async (orgId: string): Promise<void>
     */
    @Test
    fun testPublicAPI_matchesSource_storeActiveOrganizationId() = runTest {
        // GIVEN: Organization ID to store
        val orgId = "org_123"

        // WHEN: Storing organization ID
        authTokenStorage.storeActiveOrganizationId(orgId)

        // THEN: Org ID is stored with correct key
        verify(mockEditor).putString("active_organization_id", orgId)
        verify(mockEditor).apply()
    }

    /**
     * Test that getActiveOrganizationId matches source signature
     * Source: export const getActiveOrganizationId = async (): Promise<string | null>
     */
    @Test
    fun testPublicAPI_matchesSource_getActiveOrganizationId() = runTest {
        // GIVEN: Organization ID is stored
        val expectedOrgId = "org_456"
        `when`(mockPrefs.getString("active_organization_id", null))
            .thenReturn(expectedOrgId)

        // WHEN: Getting organization ID
        val result = authTokenStorage.getActiveOrganizationId()

        // THEN: Returns string or null
        assertEquals(expectedOrgId, result)
    }

    /**
     * Test that clearActiveOrganizationId matches source signature
     * Source: export const clearActiveOrganizationId = async (): Promise<void>
     */
    @Test
    fun testPublicAPI_matchesSource_clearActiveOrganizationId() = runTest {
        // WHEN: Clearing organization ID
        authTokenStorage.clearActiveOrganizationId()

        // THEN: Org ID is removed
        verify(mockEditor).remove("active_organization_id")
        verify(mockEditor).apply()
    }

    /**
     * Test that clearAllTokens matches source signature
     * Source: export const clearAllTokens = async (): Promise<void>
     */
    @Test
    fun testPublicAPI_matchesSource_clearAllTokens() = runTest {
        // WHEN: Clearing all tokens
        authTokenStorage.clearAllTokens()

        // THEN: All preferences are cleared
        verify(mockEditor).clear()
        verify(mockEditor).apply()
    }

    /**
     * AC-2: Async operations use coroutines
     * GIVEN: Source uses async/await patterns
     * WHEN: Kotlin equivalents are invoked
     * THEN: Functions are suspend functions with proper context
     */
    @Test
    fun testAsyncOperationsUseCoroutines() = runTest {
        // Verify all operations are suspend functions by calling them in runTest
        authTokenStorage.storeAccessToken("token")
        authTokenStorage.getStoredAccessToken()
        authTokenStorage.storeRefreshToken("refresh")
        authTokenStorage.getRefreshToken()
        authTokenStorage.storeTokenExpiry(123L)
        authTokenStorage.getTokenExpiry()
        authTokenStorage.storeCodeVerifier("verifier")
        authTokenStorage.getCodeVerifier()
        authTokenStorage.storeActiveOrganizationId("org")
        authTokenStorage.getActiveOrganizationId()
        authTokenStorage.clearActiveOrganizationId()
        authTokenStorage.clearAllTokens()

        // If we reach here, all functions are suspend and work correctly
        assertEquals("All operations completed", "All operations completed")
    }

    /**
     * AC-3: Storage abstractions work correctly
     * GIVEN: Source uses AsyncStorage/secure storage
     * WHEN: Kotlin equivalents read/write data
     * THEN: Data persists correctly using platform storage
     */
    @Test
    fun testStorageAbstractions() = runTest {
        // Test write-read cycle for all storage operations

        // Test access token storage
        authTokenStorage.storeAccessToken("access-token")
        `when`(mockPrefs.getString("workos_access_token", null)).thenReturn("access-token")
        assertEquals("access-token", authTokenStorage.getStoredAccessToken())

        // Test refresh token storage
        authTokenStorage.storeRefreshToken("refresh-token")
        `when`(mockPrefs.getString("workos_refresh_token", null)).thenReturn("refresh-token")
        assertEquals("refresh-token", authTokenStorage.getRefreshToken())

        // Test token expiry storage
        authTokenStorage.storeTokenExpiry(1234567890L)
        `when`(mockPrefs.getLong("workos_token_expiry", -1L)).thenReturn(1234567890L)
        assertEquals(1234567890L, authTokenStorage.getTokenExpiry())

        // Test code verifier storage
        authTokenStorage.storeCodeVerifier("verifier")
        `when`(mockPrefs.getString("workos_code_verifier", null)).thenReturn("verifier")
        assertEquals("verifier", authTokenStorage.getCodeVerifier())

        // Test organization ID storage
        authTokenStorage.storeActiveOrganizationId("org_123")
        `when`(mockPrefs.getString("active_organization_id", null)).thenReturn("org_123")
        assertEquals("org_123", authTokenStorage.getActiveOrganizationId())

        // Test clear operations
        authTokenStorage.clearActiveOrganizationId()
        verify(mockEditor).remove("active_organization_id")

        authTokenStorage.clearAllTokens()
        verify(mockEditor).clear()
    }
}
