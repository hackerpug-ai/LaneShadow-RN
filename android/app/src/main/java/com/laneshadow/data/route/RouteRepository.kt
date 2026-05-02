package com.laneshadow.data.route

import com.laneshadow.services.RouteOption
import com.laneshadow.services.ConvexClientProvider
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

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
    private val convexClientProvider: ConvexClientProvider,
) : RouteRepository {
    override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
        convexClientProvider.observeActiveRoutePlans(sessionId)

    override suspend fun cancelPlan(routePlanId: String): Result<Unit> =
        convexClientProvider.cancelPlan(routePlanId)
}
