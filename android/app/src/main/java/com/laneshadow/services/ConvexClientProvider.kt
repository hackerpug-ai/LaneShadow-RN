package com.laneshadow.services

import android.content.Context
import com.laneshadow.BuildConfig
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.dto.FavoriteLocationDto
import com.laneshadow.data.dto.RoutePlanDto
import com.laneshadow.data.dto.SessionMessageDto
import com.laneshadow.data.dto.WeatherDto
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.organisms.Session
import dagger.hilt.android.qualifiers.ApplicationContext
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
import kotlinx.coroutines.flow.map
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

data class ConvexCurrentUser(
    val id: String,
    val displayName: String,
    val email: String = "",
)

/**
 * Result from reverse geocoding a location
 */
data class GeocodeResult(
    val label: String,
    val placeId: String? = null,
)

internal interface ConvexGateway {
    suspend fun bindAuthToken(token: String): Result<Unit>
    suspend fun clearAuth(context: Context): Result<Unit>
    suspend fun getCurrentUser(): ConvexCurrentUser?
    fun observeCurrentUser(): Flow<ConvexCurrentUser?>
    fun observePlanningSessions(): Flow<List<PlanningSession>>
    fun observeSessionMessages(sessionId: String): Flow<List<SessionMessage>>
    fun observeActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>>
    fun observeSessions(): Flow<List<Session>>
    fun observeFavoriteLocations(): Flow<List<com.laneshadow.data.favorites.FavoriteLocation>>
    suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng? = null,
    ): Result<ConvexSendMessageResponseDto>
    suspend fun createSession(firstMessage: String): Result<String>
    suspend fun cancelPlan(routePlanId: String): Result<Unit>
    suspend fun getCurrentWeather(lat: Double, lng: Double): WeatherDto
    suspend fun reverseGeocode(lat: Double, lng: Double): GeocodeResult
}

@Singleton
class ConvexClientProvider private constructor(
    @ApplicationContext private val appContext: Context,
    private val authRepository: AuthRepository,
    private val activeGateway: ConvexGateway,
) {
    @Inject
    constructor(
        @ApplicationContext appContext: Context,
        authRepository: AuthRepository,
    ) : this(
        appContext = appContext,
        authRepository = authRepository,
        activeGateway = RealConvexGateway(authRepository),
    )

    internal constructor(
        authRepository: AuthRepository,
        appContext: Context,
        convexGateway: ConvexGateway,
    ) : this(appContext, authRepository, convexGateway)

    fun observeSessions(): Flow<List<Session>> = flow {
        bindClerkJwtBeforeAuthenticatedQuery().getOrThrow()
        activeGateway.observeSessions()
            .catch { error ->
                handleConvexError(error)
                throw error
            }
            .collect { emit(it) }
    }

    fun observeCurrentUser(): Flow<ConvexCurrentUser?> =
        observeAuthenticatedFlow { activeGateway.observeCurrentUser() }

    fun observePlanningSessions(): Flow<List<PlanningSession>> =
        observeAuthenticatedFlow { activeGateway.observePlanningSessions() }

    fun observeSessionMessages(sessionId: String): Flow<List<SessionMessage>> =
        observeAuthenticatedFlow { activeGateway.observeSessionMessages(sessionId) }

    fun observeActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
        observeAuthenticatedFlow { activeGateway.observeActiveRoutePlans(sessionId) }

    fun observeFavoriteLocations(): Flow<List<com.laneshadow.data.favorites.FavoriteLocation>> =
        observeAuthenticatedFlow { activeGateway.observeFavoriteLocations() }

    suspend fun getCurrentWeather(lat: Double, lng: Double): Result<WeatherDto> =
        runAuthenticated {
            activeGateway.getCurrentWeather(lat, lng)
        }

    suspend fun reverseGeocode(lat: Double, lng: Double): Result<GeocodeResult> =
        runAuthenticated {
            activeGateway.reverseGeocode(lat, lng)
        }

    suspend fun getCurrentUser(): Result<ConvexCurrentUser> = runAuthenticated {
        val currentUser = activeGateway.getCurrentUser()
            ?: throw IllegalStateException("Current rider profile unavailable")
        currentUser
    }

    suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng? = null,
    ): Result<Unit> = runAuthenticated {
        activeGateway.sendMessage(sessionId, content, currentLocation).getOrThrow()
        Unit
    }

    suspend fun createSession(
        firstMessage: String = "",
    ): Result<String> = runAuthenticated {
        activeGateway.createSession(firstMessage).getOrThrow()
    }

    suspend fun cancelPlan(routePlanId: String): Result<Unit> = runAuthenticated {
        activeGateway.cancelPlan(routePlanId).getOrThrow()
    }

    suspend fun signOut(): Result<Unit> {
        // clearAuth will call authRepository.signOut() internally, so we don't call it here
        return activeGateway.clearAuth(appContext)
    }

    private suspend fun bindClerkJwtBeforeAuthenticatedQuery(): Result<Unit> = runCatching {
        val token = authRepository.getJwtForConvex()
        activeGateway.bindAuthToken(token).getOrThrow()
    }

    private suspend fun <T> runAuthenticated(block: suspend () -> T): Result<T> {
        val bindResult = bindClerkJwtBeforeAuthenticatedQuery()
        if (bindResult.isFailure) {
            return Result.failure(bindResult.exceptionOrNull() ?: IllegalStateException("Convex auth binding failed"))
        }

        return runCatching { block() }.recoverCatching { error ->
            handleConvexError(error)
            throw error
        }
    }

    private fun <T> observeAuthenticatedFlow(flowFactory: () -> Flow<T>): Flow<T> = flow {
        bindClerkJwtBeforeAuthenticatedQuery().getOrThrow()
        flowFactory()
            .catch { error ->
                handleConvexError(error)
                throw error
            }
            .collect { emit(it) }
    }

    private suspend fun handleConvexError(error: Throwable) {
        if (!error.isUnauthenticatedConvexError()) {
            return
        }
        activeGateway.clearAuth(appContext)
        authRepository.handleUnauthenticated(SessionExpiredMessage)
    }

    private fun Throwable.isUnauthenticatedConvexError(): Boolean =
        message?.contains(UnauthenticatedCode) == true ||
            cause?.message?.contains(UnauthenticatedCode) == true ||
            toString().contains(UnauthenticatedCode)

    private companion object {
        const val UnauthenticatedCode = "UNAUTHENTICATED"
        const val SessionExpiredMessage = "Your session expired. Please sign in again."
    }
}

private class RealConvexGateway(
    private val authRepository: AuthRepository,
) : ConvexGateway {
    private val convexAuthProvider = object : AuthProvider<String> {
        override suspend fun login(context: Context, onIdToken: (String?) -> Unit): Result<String> =
            loginFromCache(onIdToken)

        override suspend fun loginFromCache(onIdToken: (String?) -> Unit): Result<String> =
            runCatching {
                val token = authRepository.getJwtForConvex()
                onIdToken(token)
                token
            }

        override suspend fun logout(context: Context): Result<Void> =
            authRepository.signOut().fold(
                onSuccess = { successfulConvexLogoutResult() },
                onFailure = { error -> Result.failure(error) },
            )

        override fun extractIdToken(authResult: String): String = authResult
    }

    private val convexClient = ConvexClientWithAuth(
        BuildConfig.CONVEX_DEPLOYMENT,
        convexAuthProvider,
        CoroutineScope(SupervisorJob() + Dispatchers.IO),
    )

    override suspend fun bindAuthToken(token: String): Result<Unit> =
        convexClient.loginFromCache().map { Unit }

    override suspend fun clearAuth(context: Context): Result<Unit> =
        convexClient.logout(context).map { Unit }

    override suspend fun getCurrentUser(): ConvexCurrentUser? {
        val currentUser = convexClient.subscribe<CurrentUserDto?>(
            name = "db/users:getCurrentUser",
        ).first().getOrThrow()
        return currentUser?.toCurrentUser()
    }

    override fun observeCurrentUser(): Flow<ConvexCurrentUser?> =
        convexClient.subscribe<CurrentUserDto?>(
            name = "db/users:getCurrentUser",
        ).map { result ->
            result.getOrThrow()?.toCurrentUser()
        }

    override fun observePlanningSessions(): Flow<List<PlanningSession>> =
        convexClient.subscribe<List<com.laneshadow.data.dto.PlanningSessionDto>>(
            name = "db/planningSessions:listSessions",
        ).map { result ->
            result.getOrThrow().map { it.toDomain() }
        }

    override fun observeSessionMessages(sessionId: String): Flow<List<SessionMessage>> =
        convexClient.subscribe<List<SessionMessageDto>>(
            name = "db/sessionMessages:list",
            args = mapOf("sessionId" to sessionId),
        ).map { result ->
            result.getOrThrow().map { it.toDomain() }
        }

    override fun observeActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> =
        convexClient.subscribe<List<RoutePlanDto>>(
            name = "db/routePlans:getActiveRoutePlansForSession",
            args = mapOf("sessionId" to sessionId),
        ).map { result ->
            result.getOrThrow().map { it.toDomain() }
        }

    override fun observeSessions(): Flow<List<Session>> =
        convexClient.subscribe<List<PlanningSessionDto>>(
            name = "db/planningSessions:list",
        ).map { result ->
            result.getOrThrow().map { it.toSession() }
        }

    override fun observeFavoriteLocations(): Flow<List<com.laneshadow.data.favorites.FavoriteLocation>> =
        convexClient.subscribe<List<FavoriteLocationDto>>(
            name = "db/favorites:listFavoriteLocations",
        ).map { result ->
            result.getOrThrow().map { it.toDomain() }
        }

    override suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng?,
    ): Result<ConvexSendMessageResponseDto> = runCatching {
        convexClient.action<ConvexSendMessageResponseDto>(
            name = "actions/agent/sendMessage:sendMessage",
            args = buildMap<String, Any?> {
                put("sessionId", sessionId)
                put("content", content)
                currentLocation?.let {
                    put(
                        "currentLocation",
                        mapOf(
                            "lat" to it.lat,
                            "lng" to it.lon,
                        ),
                    )
                }
            },
        )
    }

    override suspend fun createSession(firstMessage: String): Result<String> = runCatching {
        val result = convexClient.mutation<CreateSessionResponse>(
            name = "db/planningSessions:createSession",
            args = mapOf("firstMessage" to firstMessage),
        )
        result.sessionId
    }

    override suspend fun cancelPlan(routePlanId: String): Result<Unit> = runCatching {
        convexClient.mutation<Any?>(
            name = "db/routePlans:cancelPlan",
            args = mapOf("routePlanId" to routePlanId),
        )
        Unit
    }

    override suspend fun getCurrentWeather(lat: Double, lng: Double): WeatherDto = runCatching {
        convexClient.action<WeatherDto>(
            name = "actions/weather:getCurrentWeather",
            args = mapOf(
                "lat" to lat,
                "lng" to lng,
            ),
        )
    }.getOrThrow()

    override suspend fun reverseGeocode(lat: Double, lng: Double): GeocodeResult = runCatching {
        convexClient.action<GeocodeResultDto>(
            name = "actions/places:reverseGeocode",
            args = mapOf(
                "lat" to lat,
                "lng" to lng,
            ),
        )
    }.getOrThrow().toDomain()
}

internal fun successfulConvexLogoutResult(): Result<Void> =
    Result.success(java.lang.Void.TYPE.cast(null))

@Serializable
private data class CurrentUserDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val email: String = "",
) {
    fun toCurrentUser(): ConvexCurrentUser =
        ConvexCurrentUser(
            id = id,
            displayName = name.ifBlank { "Rider" },
            email = email,
        )
}

@Serializable
private data class PlanningSessionDto(
    val id: String,
    val title: String,
    @SerialName("preview") val previewText: String = "",
    val meta: String = "",
    @SerialName("when") val whenLabel: String = "",
    val active: Boolean = false,
    val routeIds: List<String> = emptyList(),
    val createdAt: String = "",
) {
    fun toSession(): Session {
        return Session(
            id = id,
            title = title,
            preview = previewText,
            meta = meta,
            whenLabel = whenLabel,
            isActive = active,
            routeIds = routeIds,
            createdAt = createdAt,
        )
    }
}

@Serializable
private data class CreateSessionResponse(
    val sessionId: String,
)

@Serializable
internal data class ConvexSendMessageAttachmentDto(
    val type: String,
    val routePlanId: String? = null,
)

@Serializable
internal data class ConvexSendMessageResponseDto(
    val response: String,
    val messageId: String,
    val attachments: List<ConvexSendMessageAttachmentDto>? = null,
)

@Serializable
private data class GeocodeResultDto(
    val label: String,
    @SerialName("placeId")
    val placeId: String? = null,
) {
    fun toDomain(): GeocodeResult = GeocodeResult(
        label = label,
        placeId = placeId,
    )
}
