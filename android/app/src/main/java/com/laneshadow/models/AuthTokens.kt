package com.laneshadow.models

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Auth Token Storage Interface
 *
 * Centralized token management for WorkOS OAuth.
 * Tokens stored securely via SharedPreferences.
 *
 * Translated from: react-native/lib/auth-tokens.ts
 */
interface AuthTokenStorage {
    suspend fun getStoredAccessToken(): String?
    suspend fun storeAccessToken(token: String)
    suspend fun storeRefreshToken(token: String)
    suspend fun getRefreshToken(): String?
    suspend fun storeTokenExpiry(expiresAt: Long)
    suspend fun getTokenExpiry(): Long?
    suspend fun storeCodeVerifier(verifier: String)
    suspend fun getCodeVerifier(): String?
    suspend fun storeActiveOrganizationId(orgId: String)
    suspend fun getActiveOrganizationId(): String?
    suspend fun clearActiveOrganizationId()
    suspend fun clearAllTokens()
}

/**
 * SharedPreferences-based implementation of AuthTokenStorage
 *
 * Uses platform SharedPreferences for token storage.
 * For production, consider using EncryptedSharedPreferences for better security.
 *
 * @param context Android application context
 */
class SharedPrefsAuthTokenStorage(
    private val context: Context
) : AuthTokenStorage {

    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences("auth_tokens", Context.MODE_PRIVATE)
    }

    override suspend fun getStoredAccessToken(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_ACCESS_TOKEN, null)
    }

    override suspend fun storeAccessToken(token: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    }

    override suspend fun storeRefreshToken(token: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
    }

    override suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_REFRESH_TOKEN, null)
    }

    override suspend fun storeTokenExpiry(expiresAt: Long) = withContext(Dispatchers.IO) {
        prefs.edit().putLong(KEY_TOKEN_EXPIRY, expiresAt).apply()
    }

    override suspend fun getTokenExpiry(): Long? = withContext(Dispatchers.IO) {
        val expiry = prefs.getLong(KEY_TOKEN_EXPIRY, -1L)
        if (expiry == -1L) null else expiry
    }

    override suspend fun storeCodeVerifier(verifier: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_CODE_VERIFIER, verifier).apply()
    }

    override suspend fun getCodeVerifier(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_CODE_VERIFIER, null)
    }

    override suspend fun storeActiveOrganizationId(orgId: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_ACTIVE_ORG_ID, orgId).apply()
    }

    override suspend fun getActiveOrganizationId(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_ACTIVE_ORG_ID, null)
    }

    override suspend fun clearActiveOrganizationId() = withContext(Dispatchers.IO) {
        prefs.edit().remove(KEY_ACTIVE_ORG_ID).apply()
    }

    override suspend fun clearAllTokens() = withContext(Dispatchers.IO) {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "workos_access_token"
        private const val KEY_REFRESH_TOKEN = "workos_refresh_token"
        private const val KEY_TOKEN_EXPIRY = "workos_token_expiry"
        private const val KEY_CODE_VERIFIER = "workos_code_verifier"
        private const val KEY_ACTIVE_ORG_ID = "active_organization_id"
    }
}
