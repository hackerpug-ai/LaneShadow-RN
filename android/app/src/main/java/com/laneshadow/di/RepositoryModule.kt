package com.laneshadow.di

import android.content.Context
import com.laneshadow.BuildConfig
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.ChatRepositoryImpl
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.route.RouteRepositoryImpl
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.session.SessionRepositoryImpl
import com.laneshadow.data.user.UserRepository
import com.laneshadow.data.user.UserRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import dev.convex.android.AuthProvider
import dev.convex.android.ConvexClient
import dev.convex.android.ConvexClientWithAuth
import java.util.concurrent.Executors
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.json.Json

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    @Provides
    @Singleton
    fun provideJson(): Json =
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
            explicitNulls = false
        }

    @Provides
    @Singleton
    fun provideConvexClient(
        authRepository: AuthRepository,
    ): ConvexClient {
        val authProvider = object : AuthProvider<String> {
            override suspend fun login(
                context: Context,
                onIdToken: (String?) -> Unit,
            ): Result<String> = loginFromCache(onIdToken)

            override suspend fun loginFromCache(
                onIdToken: (String?) -> Unit,
            ): Result<String> = runCatching {
                val token = authRepository.getJwtForConvex()
                onIdToken(token)
                token
            }

            override suspend fun logout(context: Context): Result<Void> =
                authRepository.signOut().fold(
                    onSuccess = { successfulConvexLogoutResult() },
                    onFailure = { Result.failure(it) },
                )

            override fun extractIdToken(authResult: String): String = authResult
        }

        return ConvexClientWithAuth(
            BuildConfig.CONVEX_DEPLOYMENT,
            authProvider,
            CoroutineScope(SupervisorJob() + Dispatchers.IO),
        )
    }
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryBindingsModule {
    @Binds
    @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository

    @Binds
    @Singleton
    abstract fun bindSessionRepository(impl: SessionRepositoryImpl): SessionRepository

    @Binds
    @Singleton
    abstract fun bindChatRepository(impl: ChatRepositoryImpl): ChatRepository

    @Binds
    @Singleton
    abstract fun bindRouteRepository(impl: RouteRepositoryImpl): RouteRepository
}

private fun successfulConvexLogoutResult(): Result<Void> =
    Result.success<Void>(java.lang.Void.TYPE.cast(null))
