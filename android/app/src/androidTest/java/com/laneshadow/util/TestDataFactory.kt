package com.laneshadow.util

import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.services.Phase
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.planning.PlanningUiState
import com.laneshadow.ui.routeresults.AttachmentCard
import com.laneshadow.ui.routeresults.PolylineEntry
import com.laneshadow.ui.routeresults.PolylineStyle
import com.laneshadow.ui.routeresults.RouteResultsUiState
import java.time.Instant

/**
 * Factory for creating test data in UI tests.
 * Provides reusable test data builders to reduce duplication across test files.
 */
object TestDataFactory {

    /**
     * Creates a test PlanningSession with default values.
     */
    fun createTestSession(
        id: String = "test-session-id",
        title: String = "Test Session",
        status: String = "active",
    ): com.laneshadow.data.session.PlanningSession {
        return com.laneshadow.data.session.PlanningSession(
            id = id,
            title = title,
            status = status,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis(),
        )
    }

    /**
     * Creates a test SessionMessage.
     */
    fun createTestMessage(
        id: String = "test-message-id",
        role: String = "user",
        content: String = "Test message content",
        status: String? = null,
    ): com.laneshadow.data.chat.SessionMessage {
        return com.laneshadow.data.chat.SessionMessage(
            id = id,
            sessionId = "test-session-id",
            role = role,
            content = content,
            status = status,
            createdAt = System.currentTimeMillis(),
        )
    }

    /**
     * Creates a test RoutePlan.
     */
    fun createTestRoutePlan(
        id: String = "test-plan-id",
        status: String = "completed",
        options: List<com.laneshadow.services.RouteOption> = emptyList(),
    ): com.laneshadow.data.route.RoutePlan {
        return com.laneshadow.data.route.RoutePlan(
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
     * Creates a test PlanningUiState.
     */
    fun createTestPlanningUiState(
        sessionId: String = "test-session-id",
        currentPhase: Phase = Phase.Parsing,
        isThinking: Boolean = true,
        messages: List<com.laneshadow.data.chat.SessionMessage> = emptyList(),
    ): PlanningUiState {
        return PlanningUiState(
            sessionId = sessionId,
            currentPhase = currentPhase,
            activePhaseIndex = Phase.entries.indexOf(currentPhase),
            headerLabel = when (currentPhase) {
                Phase.Parsing -> "Let me think on that…"
                Phase.Searching -> "Searching for routes"
                Phase.Drafting -> "Drafting options"
                Phase.Enriching -> "Enriching details"
                Phase.Finalizing -> "Finalizing plan"
            },
            phaseHeaders = createDefaultPhaseHeaders(),
            messages = messages,
            recentSessions = emptyList(),
            activePlanId = null,
            isThinking = isThinking,
            transition = null,
            subscriptionError = null,
        )
    }

    /**
     * Creates test polyline entries for RouteResultsScreen.
     */
    fun createTestPolylines(
        selectedRouteId: String = "route-a",
    ): List<PolylineEntry> {
        return listOf(
            PolylineEntry(
                routeOptionId = "route-a",
                variant = RouteVariant.Best,
                coordinates = listOf(
                    LatLng(37.8104, -122.4752),
                    LatLng(37.8120, -122.4760),
                    LatLng(37.8150, -122.4800),
                ),
                style = if (selectedRouteId == "route-a") PolylineStyle.Solid else PolylineStyle.Dashed,
            ),
            PolylineEntry(
                routeOptionId = "route-b",
                variant = RouteVariant.Alt1,
                coordinates = listOf(
                    LatLng(37.8104, -122.4752),
                    LatLng(37.8110, -122.4770),
                    LatLng(37.8140, -122.4810),
                ),
                style = if (selectedRouteId == "route-b") PolylineStyle.Solid else PolylineStyle.Dashed,
            ),
            PolylineEntry(
                routeOptionId = "route-c",
                variant = RouteVariant.Alt2,
                coordinates = listOf(
                    LatLng(37.8104, -122.4752),
                    LatLng(37.8115, -122.4780),
                    LatLng(37.8135, -122.4820),
                ),
                style = if (selectedRouteId == "route-c") PolylineStyle.Solid else PolylineStyle.Dashed,
            ),
        )
    }

    /**
     * Creates test attachment cards for RouteResultsScreen.
     */
    fun createTestAttachmentCards(
        selectedRouteId: String = "route-a",
    ): List<AttachmentCard> {
        return listOf(
            AttachmentCard(
                routeOptionId = "route-a",
                title = "Route 1",
                via = "Via Highway 1",
                distanceLabel = "12 mi",
                durationLabel = "25m",
                scenicScore = 5,
                variant = RouteVariant.Best,
                borderColor = androidx.compose.ui.graphics.Color.Red,
                selected = selectedRouteId == "route-a",
                isBest = true,
            ),
            AttachmentCard(
                routeOptionId = "route-b",
                title = "Route 2",
                via = "Via Highway 101",
                distanceLabel = "15 mi",
                durationLabel = "30m",
                scenicScore = 3,
                variant = RouteVariant.Alt1,
                borderColor = androidx.compose.ui.graphics.Color.Blue,
                selected = selectedRouteId == "route-b",
                isBest = false,
            ),
            AttachmentCard(
                routeOptionId = "route-c",
                title = "Route 3",
                via = "Via scenic route",
                distanceLabel = "18 mi",
                durationLabel = "40m",
                scenicScore = 4,
                variant = RouteVariant.Alt2,
                borderColor = androidx.compose.ui.graphics.Color.Green,
                selected = selectedRouteId == "route-c",
                isBest = false,
            ),
        )
    }

    /**
     * Creates a test RouteResultsUiState.Loaded.
     */
    fun createTestRouteResultsLoadedState(
        sessionId: String = "test-session-id",
        routePlanId: String = "test-plan-id",
        selectedRouteId: String = "route-a",
        attachmentsDismissed: Boolean = false,
    ): RouteResultsUiState.Loaded {
        return RouteResultsUiState.Loaded(
            sessionId = sessionId,
            routePlanId = routePlanId,
            navigatorBody = "Three route options are ready.",
            selectedRouteId = selectedRouteId,
            attachmentsDismissed = attachmentsDismissed,
            polylineEntries = createTestPolylines(selectedRouteId),
            attachmentCards = createTestAttachmentCards(selectedRouteId),
        )
    }

    /**
     * Creates a list of canonical phase labels for testing.
     */
    fun createCanonicalPhaseLabels(): List<String> = listOf(
        "Parsing your request",
        "Searching for routes",
        "Drafting options",
        "Enriching details",
        "Finalizing plan"
    )

    /**
     * Creates a map of default phase headers for testing.
     */
    fun createDefaultPhaseHeaders(): Map<String, String> = linkedMapOf(
        "parsing" to "Let me think on that…",
        "searching" to "Three loops are forming…",
        "drafting" to "Sun on one leg, wind on another…",
        "enriching" to "Ranking by scenic + twist…",
        "finalizing" to "Picking the best three"
    )

    /**
     * Creates a list of legacy phase labels for testing (should not appear in UI).
     */
    fun createLegacyPhaseLabels(): List<String> {
        return listOf(
            "Reading your ride",
            "Sketching roads",
            "Checking they connect",
            "Reading the sky",
            "Ranking your options"
        )
    }
}
