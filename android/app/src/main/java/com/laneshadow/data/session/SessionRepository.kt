package com.laneshadow.data.session

import com.laneshadow.data.dto.PlanningSessionDto
import dev.convex.android.ConvexClient
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable

data class PlanningSession(
    val id: String = "",
    val title: String = "",
    val status: String = "active",
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)

interface SessionRepository {
    fun subscribeToSessions(): Flow<List<PlanningSession>>

    suspend fun createSession(firstMessage: String): Result<String>
}

@Singleton
class SessionRepositoryImpl @Inject constructor(
    private val convexClient: ConvexClient,
) : SessionRepository {
    override fun subscribeToSessions(): Flow<List<PlanningSession>> =
        convexClient.subscribe<List<PlanningSessionDto>>(
            name = "db/planningSessions:listSessions",
        ).map { result ->
            result.getOrDefault(emptyList()).map { it.toDomain() }
        }.catch {
            emit(emptyList())
        }

    override suspend fun createSession(firstMessage: String): Result<String> = runCatching {
        val response = convexClient.mutation<CreateSessionResponseDto>(
            name = "db/planningSessions:createSession",
            args = mapOf("firstMessage" to firstMessage),
        )
        response.sessionId
    }
}

@Serializable
private data class CreateSessionResponseDto(
    val sessionId: String = "",
)
