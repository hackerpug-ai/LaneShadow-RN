package com.laneshadow.data.route

import android.content.Context
import com.laneshadow.BuildConfig
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.services.RouteOption
import dev.convex.android.AuthProvider
import dev.convex.android.ConvexClientWithAuth
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

data class RoutePlan(
    val id: String = "",
    val status: String = "pending",
    val options: List<RouteOption> = emptyList(),
    val statusMessage: String? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null,
)

interface RouteRepository {
    fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>>

    fun subscribeToPlanById(routePlanId: String): Flow<JsonObject> = flow {
        error("subscribeToPlanById(routePlanId) must be implemented by a concrete repository")
    }

    fun subscribeToEnrichments(routePlanId: String): Flow<JsonElement> = flow {
        error("subscribeToEnrichments(routePlanId) must be implemented by a concrete repository")
    }

    suspend fun cancelPlan(routePlanId: String): Result<Unit>
}

@Singleton
class RouteRepositoryImpl @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
    private val authRepository: AuthRepository,
) : RouteRepository {
    private val routePlanClient = ConvexClientWithAuth(
        BuildConfig.CONVEX_DEPLOYMENT,
        object : AuthProvider<String> {
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
                    onSuccess = { successfulRoutePlanLogoutResult() },
                    onFailure = { error -> Result.failure(error) },
                )

            override fun extractIdToken(authResult: String): String = authResult
        },
        CoroutineScope(SupervisorJob() + Dispatchers.IO),
    )

    override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
        convexClientProvider.observeActiveRoutePlans(sessionId)

    override fun subscribeToPlanById(routePlanId: String): Flow<JsonObject> = flow {
        routePlanClient.loginFromCache().getOrThrow()
        emitAll(
            routePlanClient.subscribe<JsonObject>(
                name = "db/routePlans:getPlanById",
                args = mapOf("routePlanId" to routePlanId),
            ).map { result ->
                result.getOrThrow()
            },
        )
    }

    override fun subscribeToEnrichments(routePlanId: String): Flow<JsonElement> = flow {
        routePlanClient.loginFromCache().getOrThrow()
        emitAll(
            routePlanClient.subscribe<JsonElement>(
                name = "db/routeEnrichments:getByRoutePlanId",
                args = mapOf("routePlanId" to routePlanId),
            ).map { result ->
                result.getOrThrow()
            },
        )
    }

    override suspend fun cancelPlan(routePlanId: String): Result<Unit> =
        convexClientProvider.cancelPlan(routePlanId)
}

private fun successfulRoutePlanLogoutResult(): Result<Void> =
    Result.success(java.lang.Void.TYPE.cast(null))
