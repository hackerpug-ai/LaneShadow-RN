package com.laneshadow.di

import android.net.Uri
import com.clerk.api.Clerk
import com.clerk.api.auth.builders.SignInWithPasswordBuilder
import com.clerk.api.auth.types.VerificationType
import com.clerk.api.network.serialization.successOrNull
import com.clerk.api.sso.OAuthProvider
import com.clerk.api.signup.verifyCode
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.data.repository.ClerkAuthRepository
import com.laneshadow.data.repository.ClerkGateway
import com.laneshadow.data.repository.CustomTabsAuthRepository
import com.laneshadow.data.repository.OAuthGateway
import com.laneshadow.data.repository.OAuthResult
import com.laneshadow.data.store.EncryptedTokenStore
import com.laneshadow.data.store.TokenStore
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Qualifier
import javax.inject.Singleton
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

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
    abstract fun bindFallbackAuthRepository(repository: CustomTabsAuthRepository): AuthRepository
}

@Module
@InstallIn(SingletonComponent::class)
object AuthModule {
    @Provides
    @Singleton
    fun provideAuthRepository(@PrimaryAuthRepository repository: AuthRepository): AuthRepository = repository

    @Provides
    @Singleton
    fun provideClerkGateway(): ClerkGateway = ClerkSdkGateway()

    @Provides
    @Singleton
    fun provideOAuthGateway(): OAuthGateway = ClerkSdkOAuthGateway()
}

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class PrimaryAuthRepository

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class FallbackAuthRepository

private class ClerkSdkGateway : ClerkGateway {
    private var pendingSignUpUser: ClerkUser? = null

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> {
        val signIn = Clerk.auth.signInWithPassword {
            credentials(email, password)
        }.successOrNull() ?: return Result.failure(IllegalStateException("Clerk sign-in failed"))

        val user = Clerk.user ?: return Result.failure(IllegalStateException("Clerk user unavailable after sign-in"))
        return Result.success(user.toModel(signIn.identifier ?: "password"))
    }

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> {
        val signUp = Clerk.auth.signUp {
            this.email = email
            this.password = password
            this.firstName = name.substringBefore(' ').ifBlank { name }
        }.successOrNull() ?: return Result.failure(IllegalStateException("verification required"))

        val resolvedUser = Clerk.user?.toModel("password")
            ?: ClerkUser(signUp.createdUserId ?: "pending-user", email, name, "password")
        pendingSignUpUser = resolvedUser

        return if (signUp.createdSessionId.isNullOrBlank()) {
            Result.failure(IllegalStateException("verification required"))
        } else {
            Result.success(resolvedUser)
        }
    }

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> {
        val currentSignUp = Clerk.auth.currentSignUp
            ?: return Result.failure(IllegalStateException("No active sign-up to verify"))
        val verifiedSignUp = currentSignUp.verifyCode(code, VerificationType.EMAIL).successOrNull()
            ?: return Result.failure(IllegalStateException("Verification failed"))
        if (verifiedSignUp.createdSessionId.isNullOrBlank()) {
            return Result.failure(IllegalStateException("Verification completed without session"))
        }
        return Result.success(
            pendingSignUpUser
                ?: Clerk.user?.toModel("password")
                ?: ClerkUser("pending-user", "", "", "password"),
        )
    }

    override suspend fun signOut(): Result<Unit> {
        Clerk.auth.signOut()
        pendingSignUpUser = null
        return Result.success(Unit)
    }

    override suspend fun getJwt(): Result<String> {
        val jwt = Clerk.auth.getToken().successOrNull().orEmpty()
        return if (jwt.isBlank()) Result.failure(IllegalStateException("Clerk JWT unavailable")) else Result.success(jwt)
    }

    override suspend fun getVerificationJwt(): Result<String> = getJwt()

    private fun SignInWithPasswordBuilder.credentials(email: String, password: String) {
        this.identifier = email
        this.password = password
    }
}

private class ClerkSdkOAuthGateway : OAuthGateway {
    private val pendingMutex = Mutex()
    private var pendingResult: CompletableDeferred<OAuthResult>? = null
    private var pendingProvider: String? = null

    override suspend fun signInWithGoogle(): OAuthResult = launchOAuth(OAuthProvider.GOOGLE)

    override suspend fun signInWithApple(): OAuthResult = launchOAuth(OAuthProvider.APPLE)

    override suspend fun completeOAuthCallback(uri: Uri): OAuthResult {
        if (!Clerk.auth.handle(uri)) {
            val failed = OAuthResult(Result.failure(IllegalStateException("OAuth callback was not handled by Clerk")), "")
            pendingResult?.complete(failed)
            return failed
        }

        val jwt = Clerk.auth.getToken().successOrNull().orEmpty()
        val user = Clerk.user
        val result = if (jwt.isBlank() || user == null) {
            OAuthResult(Result.failure(IllegalStateException("OAuth callback completed without user session")), "")
        } else {
            val provider = pendingMutex.withLock { pendingProvider ?: "oauth" }
            OAuthResult(Result.success(user.toModel(provider)), jwt)
        }
        pendingMutex.withLock {
            pendingResult?.complete(result)
            pendingResult = null
            pendingProvider = null
        }
        return result
    }

    private suspend fun launchOAuth(provider: OAuthProvider): OAuthResult {
        val deferred = pendingMutex.withLock {
            pendingResult?.cancel()
            pendingProvider = provider.toProviderValue()
            CompletableDeferred<OAuthResult>().also { pendingResult = it }
        }

        val launchResult = Clerk.auth.signInWithOAuth(provider).successOrNull()
        if (launchResult == null) {
            val failed = OAuthResult(Result.failure(IllegalStateException("Failed to start OAuth flow")), "")
            pendingMutex.withLock {
                deferred.complete(failed)
                pendingResult = null
                pendingProvider = null
            }
        }

        return deferred.await()
    }
}

private fun com.clerk.api.user.User.toModel(provider: String): ClerkUser {
    val fullName = listOfNotNull(firstName, lastName).joinToString(" ").ifBlank { username ?: "" }
    return ClerkUser(
        id = id,
        email = primaryEmailAddress?.emailAddress.orEmpty(),
        name = fullName,
        provider = provider,
    )
}

private fun OAuthProvider.toProviderValue(): String = when (this) {
    OAuthProvider.GOOGLE -> "google"
    OAuthProvider.APPLE -> "apple"
    else -> "oauth"
}
