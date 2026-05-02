package com.laneshadow.data.savedroutes

import com.laneshadow.BuildConfig
import com.laneshadow.data.repository.AuthRepository
import dev.convex.android.AuthProvider
import dev.convex.android.ConvexClientWithAuth
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

@Singleton
open class SavedRouteRepository @Inject constructor(
    private val authRepository: AuthRepository,
) {
    private val savedRoutesClient by lazy {
        ConvexClientWithAuth(
            BuildConfig.CONVEX_DEPLOYMENT,
            object : AuthProvider<String> {
                override suspend fun login(
                    context: android.content.Context,
                    onIdToken: (String?) -> Unit,
                ): Result<String> = loginFromCache(onIdToken)

                override suspend fun loginFromCache(
                    onIdToken: (String?) -> Unit,
                ): Result<String> = runCatching {
                    val token = authRepository.getJwtForConvex()
                    onIdToken(token)
                    token
                }

                override suspend fun logout(context: android.content.Context): Result<Void> =
                    authRepository.signOut().fold(
                        onSuccess = { successfulSavedRouteLogoutResult() },
                        onFailure = { error -> Result.failure(error) },
                    )

                override fun extractIdToken(authResult: String): String = authResult
            },
            CoroutineScope(SupervisorJob() + Dispatchers.IO),
        )
    }

    open fun matchesFingerprint(routeIndexFingerprint: String): Flow<Boolean> {
        if (routeIndexFingerprint.isBlank()) {
            return flowOf(false)
        }

        return flow {
            savedRoutesClient.loginFromCache().getOrThrow()
            emitAll(
                savedRoutesClient.subscribe<JsonElement>(
                    name = "db/savedRoutes:getSavedRoutesList",
                    args = mapOf("limit" to 100),
                ).map { result ->
                    result.getOrNull()
                        ?.hasRouteIndexFingerprint(routeIndexFingerprint)
                        ?: false
                },
            )
        }.catch {
            emit(false)
        }
    }
}

private fun JsonElement.hasRouteIndexFingerprint(routeIndexFingerprint: String): Boolean {
    val routes = jsonObject["routes"]?.jsonArray ?: return false
    return routes.any { route ->
        route.jsonObject["routeIndex"]?.jsonObject["routeFingerprint"]?.jsonPrimitive?.contentOrNull ==
            routeIndexFingerprint
    }
}

private fun successfulSavedRouteLogoutResult(): Result<Void> =
    Result.success(java.lang.Void.TYPE.cast(null))
