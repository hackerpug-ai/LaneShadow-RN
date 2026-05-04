package com.laneshadow.e2e.sprint04

import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.services.ConvexCurrentUser
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

/**
 * Test helper for Convex client operations in instrumented tests.
 *
 * This helper provides utilities for setting up Convex test data,
 * mocking Convex responses, and verifying Convex interactions in E2E tests.
 *
 * IMPORTANT: This helper uses the REAL ConvexClientProvider wiring,
 * not stubbed/fake implementations. Tests using this helper make
 * actual Convex queries and mutations against the test backend.
 */
object ConvexTestHelper {

    /**
     * Creates a test Convex user.
     */
    fun createTestUser(
        id: String = "test-user-id",
        displayName: String = "Test Rider",
        email: String = "test@example.com",
    ): ConvexCurrentUser {
        return ConvexCurrentUser(
            id = id,
            displayName = displayName,
            email = email,
        )
    }

    /**
     * Creates a test planning session.
     */
    fun createTestPlanningSession(
        id: String = "test-session-id",
        title: String = "Test Session",
        status: String = "active",
    ): PlanningSession {
        return PlanningSession(
            id = id,
            title = title,
            status = status,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis(),
        )
    }

    /**
     * Creates a test session message.
     */
    fun createTestSessionMessage(
        id: String = "test-message-id",
        sessionId: String = "test-session-id",
        role: String = "user",
        content: String = "Test message",
        status: String? = null,
    ): SessionMessage {
        return SessionMessage(
            id = id,
            sessionId = sessionId,
            role = role,
            content = content,
            status = status,
            createdAt = System.currentTimeMillis(),
        )
    }

    /**
     * Creates a test route plan.
     */
    fun createTestRoutePlan(
        id: String = "test-plan-id",
        status: String = "completed",
        options: List<com.laneshadow.services.RouteOption> = emptyList(),
    ): RoutePlan {
        return RoutePlan(
            id = id,
            status = status,
            options = options,
            statusMessage = null,
            errorCode = null,
            errorMessage = null,
        )
    }

    /**
     * Creates test route options.
     */
    fun createTestRouteOptions(
        count: Int = 3,
    ): List<com.laneshadow.services.RouteOption> {
        return (1..count).map { index ->
            com.laneshadow.services.RouteOption(
                routeOptionId = "route-option-$index"
            )
        }
    }

    /**
     * Creates a test planning session with a completed route plan.
     * This simulates the state after a user completes the planning flow.
     */
    fun createCompletedPlanningSession(
        sessionId: String = "test-session-id",
        planId: String = "test-plan-id",
        userMessage: String = "Find me a scenic route",
    ): Pair<PlanningSession, List<SessionMessage>> {
        val session = createTestPlanningSession(
            id = sessionId,
            title = userMessage,
            status = "active",
        )

        val messages = listOf(
            createTestSessionMessage(
                id = "msg-1",
                sessionId = sessionId,
                role = "user",
                content = userMessage,
            ),
            createTestSessionMessage(
                id = "msg-2",
                sessionId = sessionId,
                role = "agent",
                content = "I found some great routes for you",
                status = "finalizing",
            ),
        )

        return session to messages
    }

    /**
     * Observes the current user from Convex and returns the result.
     * This makes a REAL authenticated query to Convex.
     *
     * @param convexClient The ConvexClientProvider to use
     * @return The current user, or null if not authenticated
     */
    suspend fun getCurrentUser(
        convexClient: ConvexClientProvider,
    ): ConvexCurrentUser? {
        return try {
            convexClient.observeCurrentUser().first()
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Observes planning sessions from Convex and returns the first result.
     * This makes a REAL authenticated query to Convex.
     *
     * @param convexClient The ConvexClientProvider to use
     * @return List of planning sessions, or empty list on error
     */
    suspend fun getPlanningSessions(
        convexClient: ConvexClientProvider,
    ): List<PlanningSession> {
        return try {
            convexClient.observePlanningSessions().first()
        } catch (e: Exception) {
            emptyList()
        }
    }

    /**
     * Observes session messages from Convex and returns the first result.
     * This makes a REAL authenticated query to Convex.
     *
     * @param convexClient The ConvexClientProvider to use
     * @param sessionId The session ID to query messages for
     * @return List of session messages, or empty list on error
     */
    suspend fun getSessionMessages(
        convexClient: ConvexClientProvider,
        sessionId: String,
    ): List<SessionMessage> {
        return try {
            convexClient.observeSessionMessages(sessionId).first()
        } catch (e: Exception) {
            emptyList()
        }
    }

    /**
     * Observes active route plans from Convex and returns the first result.
     * This makes a REAL authenticated query to Convex.
     *
     * @param convexClient The ConvexClientProvider to use
     * @param sessionId The session ID to query route plans for
     * @return List of active route plans, or empty list on error
     */
    suspend fun getActiveRoutePlans(
        convexClient: ConvexClientProvider,
        sessionId: String,
    ): List<RoutePlan> {
        return try {
            convexClient.observeActiveRoutePlans(sessionId).first()
        } catch (e: Exception) {
            emptyList()
        }
    }

    /**
     * Sends a message to the Convex backend.
     * This makes a REAL authenticated mutation to Convex.
     *
     * @param convexClient The ConvexClientProvider to use
     * @param sessionId The session ID to send the message to
     * @param content The message content
     * @return Result indicating success or failure
     */
    suspend fun sendMessage(
        convexClient: ConvexClientProvider,
        sessionId: String,
        content: String,
    ): Result<Unit> {
        return try {
            convexClient.sendMessage(sessionId, content)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Creates a new planning session in Convex.
     * This makes a REAL authenticated mutation to Convex.
     *
     * @param convexClient The ConvexClientProvider to use
     * @param firstMessage The first message to start the session
     * @return Result containing the session ID or failure
     */
    suspend fun createSession(
        convexClient: ConvexClientProvider,
        firstMessage: String,
    ): Result<String> {
        return try {
            convexClient.createSession(firstMessage)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Cancels a route plan in Convex.
     * This makes a REAL authenticated mutation to Convex.
     *
     * @param convexClient The ConvexClientProvider to use
     * @param routePlanId The route plan ID to cancel
     * @return Result indicating success or failure
     */
    suspend fun cancelPlan(
        convexClient: ConvexClientProvider,
        routePlanId: String,
    ): Result<Unit> {
        return try {
            convexClient.cancelPlan(routePlanId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Creates a flow that emits a single value.
     * Useful for mocking repository responses in tests.
     */
    fun <T> singleValueFlow(value: T): Flow<T> {
        return flowOf(value)
    }

    /**
     * Creates a flow that emits multiple values.
     * Useful for testing state transitions.
     */
    fun <T> multiValueFlow(vararg values: T): Flow<T> {
        return flowOf(*values)
    }

    /**
     * Runs a blocking suspend function.
     * Useful for running suspend functions in non-coroutine contexts (like tests).
     */
    fun <T> runBlockingTest(block: suspend () -> T): T {
        return runBlocking { block() }
    }
}
