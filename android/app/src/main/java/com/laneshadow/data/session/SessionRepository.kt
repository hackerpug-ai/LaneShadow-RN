package com.laneshadow.data.session

import com.laneshadow.services.ConvexClientProvider
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

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
    private val convexClientProvider: ConvexClientProvider,
) : SessionRepository {
    override fun subscribeToSessions(): Flow<List<PlanningSession>> =
        convexClientProvider.observePlanningSessions()

    override suspend fun createSession(firstMessage: String): Result<String> =
        convexClientProvider.createSession(firstMessage)
}
