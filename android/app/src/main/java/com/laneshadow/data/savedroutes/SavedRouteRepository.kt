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
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull

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

        return flow<Boolean> {
            authenticateSavedRoutesClient()
            observeSavedRoutesPage(beforeDate = null).collect { firstPage ->
                emit(
                    hasRouteIndexFingerprintAcrossPages(
                        routeIndexFingerprint = routeIndexFingerprint,
                        firstPage = firstPage.getOrNull(),
                    ),
                )
            }
        }.catch {
            emit(false)
        }
    }

    protected open suspend fun authenticateSavedRoutesClient() {
        savedRoutesClient.loginFromCache().getOrThrow()
    }

    protected open fun observeSavedRoutesPage(beforeDate: Long?): Flow<Result<JsonElement>> =
        savedRoutesClient.subscribe(
            name = "db/savedRoutes:getSavedRoutesList",
            args = buildMap<String, Any> {
                put("limit", SavedRoutesPageLimit)
                beforeDate?.let { put("beforeDate", it) }
            },
        )

    private suspend fun hasRouteIndexFingerprintAcrossPages(
        routeIndexFingerprint: String,
        firstPage: JsonElement?,
    ): Boolean {
        var beforeDate: Long? = null
        val seenRouteIds = mutableSetOf<String>()
        var routes = firstPage?.savedRouteIndexRows().orEmpty()

        while (true) {
            val newRoutes = routes.filter { route -> seenRouteIds.add(route.savedRouteId) }
            if (newRoutes.any { route -> route.routeIndexFingerprint == routeIndexFingerprint }) {
                return true
            }

            if (routes.size < SavedRoutesPageLimit || newRoutes.isEmpty()) {
                return false
            }

            val oldestCreatedAt = newRoutes.minOfOrNull { route -> route.createdAt } ?: return false
            if (oldestCreatedAt == Long.MIN_VALUE) {
                return false
            }
            beforeDate = oldestCreatedAt - 1
            routes = observeSavedRoutesPage(beforeDate)
                .first()
                .getOrNull()
                ?.savedRouteIndexRows()
                .orEmpty()
        }
    }
}

private data class SavedRouteIndexRow(
    val savedRouteId: String,
    val createdAt: Long,
    val routeIndexFingerprint: String?,
)

private fun JsonElement.savedRouteIndexRows(): List<SavedRouteIndexRow> =
    runCatching {
        jsonObject["routes"]?.jsonArray.orEmpty().mapIndexedNotNull { index, route ->
            val routeObject = route.jsonObject
            val createdAt = routeObject["createdAt"]?.jsonPrimitive?.longOrNull ?: return@mapIndexedNotNull null
            val routeFingerprint = routeObject["routeIndex"]
                ?.jsonObject
                ?.get("routeFingerprint")
                ?.jsonPrimitive
                ?.contentOrNull
            val savedRouteId = routeObject["savedRouteId"]?.jsonPrimitive?.contentOrNull
                ?: "$createdAt:$index:${routeFingerprint.orEmpty()}"

            SavedRouteIndexRow(
                savedRouteId = savedRouteId,
                createdAt = createdAt,
                routeIndexFingerprint = routeFingerprint,
            )
        }
    }.getOrDefault(emptyList())

@Suppress("UNCHECKED_CAST")
private fun successfulSavedRouteLogoutResult(): Result<Void> =
    Result.success(null) as Result<Void>

private const val SavedRoutesPageLimit = 50
