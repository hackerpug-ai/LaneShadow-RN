package com.laneshadow.data.store

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

interface TokenStore {
    suspend fun saveJwt(token: String)
    suspend fun readJwt(): String?
    suspend fun clear()
}

@Singleton
class EncryptedTokenStore @Inject constructor(
    @ApplicationContext context: Context,
) : TokenStore {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        PREFS_NAME,
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    override suspend fun saveJwt(token: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_JWT, token).apply()
    }

    override suspend fun readJwt(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_JWT, null)
    }

    override suspend fun clear() = withContext(Dispatchers.IO) {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val PREFS_NAME = "auth_secure_tokens"
        const val KEY_JWT = "clerk_jwt"
    }
}
