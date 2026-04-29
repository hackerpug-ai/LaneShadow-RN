package com.laneshadow.di

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.laneshadow.BuildConfig
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.data.repository.ClerkAuthRepository
import com.laneshadow.data.repository.ClerkGateway
import com.laneshadow.data.repository.OAuthGateway
import com.laneshadow.data.repository.OAuthResult
import com.laneshadow.data.store.EncryptedTokenStore
import com.laneshadow.data.store.TokenStore
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import java.util.UUID
import javax.inject.Qualifier
import javax.inject.Singleton
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

@Module
@InstallIn(SingletonComponent::class)
abstract class AuthBindingsModule {
    @Binds
    @Singleton
    abstract fun bindTokenStore(store: EncryptedTokenStore): TokenStore

    @Binds
    @PrimaryAuthRepository
    @Singleton
    abstract fun bindPrimaryAuthRepository(repository: ClerkAuthRepository): AuthRepository

    @Binds
    @FallbackAuthRepository
    @Singleton
    abstract fun bindFallbackAuthRepository(repository: com.laneshadow.data.repository.CustomTabsAuthRepository): AuthRepository
}

@Module
@InstallIn(SingletonComponent::class)
object AuthModule {
    @Provides
    @Singleton
    fun provideAuthRepository(@PrimaryAuthRepository repository: AuthRepository): AuthRepository = repository

    @Provides
    @Singleton
    fun provideClerkGateway(): ClerkGateway = ClerkHttpGateway()

    @Provides
    @Singleton
    fun provideOAuthGateway(@ApplicationContext context: Context): OAuthGateway =
        CustomTabsOAuthGateway(context)
}

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class PrimaryAuthRepository

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class FallbackAuthRepository

private class ClerkHttpGateway : ClerkGateway {
    private val client = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private var sessionId: String? = null

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> = runCatching {
        val payload = """{"strategy":"password","identifier":"$email","password":"$password"}"""
        val response = post("/v1/client/sign_ins", payload)
        val parsed = json.parseToJsonElement(response).jsonObject
        val createdSessionId = parsed["response"]?.jsonObject?.get("created_session_id")?.jsonPrimitive?.contentOrNull
            ?: throw IllegalStateException("Clerk sign-in did not produce created_session_id")
        sessionId = createdSessionId
        extractUser(parsed)
    }

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> = runCatching {
        val firstName = name.substringBefore(' ').ifBlank { name }
        val lastName = name.substringAfter(' ', "")
        val payload = """{"email_address":"$email","password":"$password","first_name":"$firstName","last_name":"$lastName"}"""
        val response = post("/v1/client/sign_ups", payload)
        val parsed = json.parseToJsonElement(response).jsonObject
        val createdSessionId = parsed["response"]?.jsonObject?.get("created_session_id")?.jsonPrimitive?.contentOrNull
            ?: throw IllegalStateException("Clerk sign-up requires verification before session creation")
        sessionId = createdSessionId
        extractUser(parsed)
    }

    override suspend fun signOut(): Result<Unit> = runCatching {
        sessionId = null
    }

    override suspend fun getJwt(): Result<String> = runCatching {
        val id = sessionId ?: throw IllegalStateException("No active Clerk session available for JWT retrieval")
        val response = post("/v1/client/sessions/$id/tokens", "{}")
        val parsed = json.parseToJsonElement(response).jsonObject
        parsed["jwt"]?.jsonPrimitive?.contentOrNull
            ?: parsed["token"]?.jsonPrimitive?.contentOrNull
            ?: throw IllegalStateException("Clerk token response missing jwt/token")
    }

    private fun post(path: String, body: String): String {
        val frontendApi = frontendApiOrThrow()
        val url = "https://$frontendApi$path"
        val request = Request.Builder()
            .url(url)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer ${BuildConfig.CLERK_PUBLISHABLE_KEY}")
            .post(body.toRequestBody("application/json".toMediaType()))
            .build()

        client.newCall(request).execute().use { response ->
            val responseBody = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw IllegalStateException("Clerk request failed (${response.code}): $responseBody")
            }
            return responseBody
        }
    }

    private fun frontendApiOrThrow(): String {
        val key = BuildConfig.CLERK_PUBLISHABLE_KEY
        require(key.isNotBlank()) { "CLERK_PUBLISHABLE_KEY is required" }
        val encoded = key.substringAfter("pk_").substringAfter("_").substringBefore("$")
        val decoded = String(android.util.Base64.decode(encoded, android.util.Base64.DEFAULT)).trimEnd('$')
        require(decoded.isNotBlank()) { "Unable to derive Clerk frontend API from publishable key" }
        return decoded
    }

    private fun extractUser(root: JsonObject): ClerkUser {
        val sessionUser = root["client"]
            ?.jsonObject
            ?.get("sessions")
            ?.jsonArray
            ?.firstOrNull()
            ?.jsonObject
            ?.get("user")
            ?.jsonObject
            ?: throw IllegalStateException("Clerk response did not include session user")

        val userId = sessionUser["id"]?.jsonPrimitive?.contentOrNull
            ?: throw IllegalStateException("Clerk user missing id")
        val name = listOfNotNull(
            sessionUser["first_name"]?.jsonPrimitive?.contentOrNull,
            sessionUser["last_name"]?.jsonPrimitive?.contentOrNull,
        ).joinToString(" ").ifBlank { sessionUser["username"]?.jsonPrimitive?.contentOrNull ?: "" }
        val email = sessionUser["primary_email_address"]?.jsonObject?.get("email_address")?.jsonPrimitive?.contentOrNull
            ?: ""

        return ClerkUser(
            id = userId,
            email = email,
            name = name,
            provider = "password",
        )
    }
}

private class CustomTabsOAuthGateway(
    private val context: Context,
) : OAuthGateway {
    private var pendingState: String? = null
    private var pendingProvider: String? = null
    private val pendingResultMutex = Mutex()
    private var pendingResult: CompletableDeferred<OAuthResult>? = null

    override suspend fun signInWithGoogle(): OAuthResult = launchAndAwait("google")

    override suspend fun signInWithApple(): OAuthResult = launchAndAwait("apple")

    override suspend fun completeOAuthCallback(uri: Uri): OAuthResult {
        val expectedState = pendingState
        val callbackState = uri.getQueryParameter("state")
        if (expectedState.isNullOrBlank() || expectedState != callbackState) {
            val mismatch = OAuthResult(Result.failure(IllegalArgumentException("OAuth state mismatch")), "")
            pendingResult?.complete(mismatch)
            return mismatch
        }

        val jwt = uri.getQueryParameter("token") ?: uri.getQueryParameter("jwt")
        if (jwt.isNullOrBlank()) {
            val noToken = OAuthResult(Result.failure(IllegalArgumentException("OAuth callback missing token/jwt")), "")
            pendingResult?.complete(noToken)
            return noToken
        }

        val userId = uri.getQueryParameter("user_id")
        val email = uri.getQueryParameter("email")
        val name = uri.getQueryParameter("name")
        if (userId.isNullOrBlank() || email.isNullOrBlank() || name.isNullOrBlank()) {
            val noFields = OAuthResult(Result.failure(IllegalArgumentException("OAuth callback missing required user fields")), "")
            pendingResult?.complete(noFields)
            return noFields
        }

        val provider = uri.getQueryParameter("provider") ?: pendingProvider ?: "oauth"
        val callbackResult =
            OAuthResult(
                userResult = Result.success(ClerkUser(userId, email, name, provider)),
                jwt = jwt,
            )
        pendingResult?.complete(callbackResult)
        pendingState = null
        pendingProvider = null
        return callbackResult
    }

    private suspend fun launchAndAwait(provider: String): OAuthResult {
        val startUrl = BuildConfig.CLERK_OAUTH_START_URL
        if (startUrl.isBlank()) {
            return OAuthResult(Result.failure(IllegalStateException("CLERK_OAUTH_START_URL is missing")), "")
        }

        val state = UUID.randomUUID().toString()
        pendingState = state
        pendingProvider = provider
        val launchUri = Uri.parse(startUrl).buildUpon()
            .appendQueryParameter("provider", provider)
            .appendQueryParameter("state", state)
            .appendQueryParameter("redirect_uri", BuildConfig.CLERK_OAUTH_REDIRECT_URI)
            .build()

        val customTabsIntent = CustomTabsIntent.Builder().build()
        customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        customTabsIntent.launchUrl(context, launchUri)

        val deferred = pendingResultMutex.withLock {
            pendingResult?.cancel()
            CompletableDeferred<OAuthResult>().also { pendingResult = it }
        }
        return deferred.await()
    }
}
