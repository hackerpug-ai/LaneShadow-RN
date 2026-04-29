package com.laneshadow.di

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
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AuthBindingsModule {
    @Binds
    @Singleton
    abstract fun bindTokenStore(store: EncryptedTokenStore): TokenStore

    @Binds
    @Singleton
    abstract fun bindAuthRepository(repository: ClerkAuthRepository): AuthRepository
}

@Module
@InstallIn(SingletonComponent::class)
object AuthModule {
    @Provides
    @Singleton
    @Named("customTabs")
    fun provideCustomTabsAuthRepository(tokenStore: TokenStore): AuthRepository =
        CustomTabsAuthRepository(tokenStore)

    @Provides
    @Singleton
    fun provideClerkGateway(): ClerkGateway = ReflectionClerkGateway()

    @Provides
    @Singleton
    fun provideOAuthGateway(): OAuthGateway = ReflectionOAuthGateway()
}

private class ReflectionClerkGateway : ClerkGateway {
    override suspend fun signIn(email: String, password: String): Result<com.laneshadow.data.model.ClerkUser> =
        Result.failure(UnsupportedOperationException("Wire Clerk SDK sign-in in app initialization context"))

    override suspend fun signUp(email: String, password: String, name: String): Result<com.laneshadow.data.model.ClerkUser> =
        Result.failure(UnsupportedOperationException("Wire Clerk SDK sign-up in app initialization context"))

    override suspend fun signOut(): Result<Unit> = Result.success(Unit)

    override suspend fun getJwt(): Result<String> = Result.success("")
}

private class ReflectionOAuthGateway : OAuthGateway {
    override suspend fun signInWithGoogle(): OAuthResult = OAuthResult(
        userResult = Result.failure(UnsupportedOperationException("Complete OAuth in Custom Tabs then callback")),
        jwt = "",
    )

    override suspend fun signInWithApple(): OAuthResult = OAuthResult(
        userResult = Result.failure(UnsupportedOperationException("Complete OAuth in Custom Tabs then callback")),
        jwt = "",
    )
}
