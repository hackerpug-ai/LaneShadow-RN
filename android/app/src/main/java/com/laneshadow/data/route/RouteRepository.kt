package com.laneshadow.data.route

import com.laneshadow.data.dto.RoutePlanDto
import com.laneshadow.services.RouteOption
import dev.convex.android.ConvexClient
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

data class RoutePlan(
    val id: String = "",
    val status: String = "pending",
    val options: List<RouteOption> = emptyList(),
    val statusMessage: String? = null,
    val errorMessage: String? = null,
)

interface RouteRepository {
    fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>>

    suspend fun cancelPlan(routePlanId: String): Result<Unit>
}

@Singleton
class RouteRepositoryImpl @Inject constructor(
    private val convexClient: ConvexClient,
) : RouteRepository {
    override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
        convexClient.subscribe<List<RoutePlanDto>>(
            name = "db/routePlans:getActiveRoutePlansForSession",
            args = mapOf("sessionId" to sessionId),
        ).map { result ->
            result.getOrDefault(emptyList()).map { it.toDomain() }
        }.catch {
            emit(emptyList())
        }

    override suspend fun cancelPlan(routePlanId: String): Result<Unit> = runCatching {
        convexClient.mutation<Any?>(
            name = "db/routePlans:cancelPlan",
            args = mapOf("routePlanId" to routePlanId),
        )
        Unit
    }
}
