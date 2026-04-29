package com.laneshadow.sandbox.mockproviders

import org.junit.Test
import org.junit.Assert.*

/**
 * TDD Phase: GREEN
 * AC-3: Variant switching via arg control
 * AC-4: Determinism (same input = same output)
 *
 * This test verifies that all providers support variant switching
 * and return deterministic data.
 */
class MockProviderVariantTest {

    @Test
    fun test_idleMockProvider_defaultVariant() {
        val state = IdleMockProvider.value("default")
        assertNotNull("IdleScreenState should not be null", state)
        assertEquals("Should have 4 suggestions", 4, state.suggestions.size)
        assertEquals("Greeting should be 'FRIDAY · 68°F · CLEAR'", "FRIDAY · 68°F · CLEAR", state.greeting.meta)
    }

    @Test
    fun test_idleMockProvider_emptyVariant() {
        val state = IdleMockProvider.value("empty")
        assertNotNull("IdleScreenState should not be null", state)
        assertEquals("Should have 0 suggestions", 0, state.suggestions.size)
        assertTrue("Location context should still exist", state.locationContext.label.isNotEmpty())
    }

    @Test
    fun test_idleMockProvider_overflowVariant() {
        val state = IdleMockProvider.value("overflow")
        assertNotNull("IdleScreenState should not be null", state)
        assertEquals("Should have 12 suggestions", 12, state.suggestions.size)
    }

    @Test
    fun test_idleMockProvider_determinism() {
        val state1 = IdleMockProvider.value("default")
        val state2 = IdleMockProvider.value("default")
        assertEquals("Same variant should return identical data", state1, state2)
    }

    @Test
    fun test_planningMockProvider_defaultVariant() {
        val state = PlanningMockProvider.value("default")
        assertNotNull("PlanningScreenState should not be null", state)
        assertEquals("Should have 5 phases", 5, state.phases.size)
        assertEquals("Should be thinking", true, state.isThinking)
    }

    @Test
    fun test_planningMockProvider_emptyVariant() {
        val state = PlanningMockProvider.value("empty")
        assertNotNull("PlanningScreenState should not be null", state)
        assertEquals("Should have 0 phases", 0, state.phases.size)
        assertEquals("Should not be thinking", false, state.isThinking)
    }

    @Test
    fun test_planningMockProvider_determinism() {
        val state1 = PlanningMockProvider.value("default")
        val state2 = PlanningMockProvider.value("default")
        assertEquals("Same variant should return identical data", state1, state2)
    }

    @Test
    fun test_routeResultsMockProvider_defaultVariant() {
        val state = RouteResultsMockProvider.value("default")
        assertNotNull("RouteResultsScreenState should not be null", state)
        assertEquals("Should have 3 routes", 3, state.routes.size)
        assertEquals("First route should be selected", "route-001", state.selectedRouteId)
        assertNotNull("Message should have attachments", state.message.attachments)
        assertEquals("Should have 3 attachments", 3, state.message.attachments?.size)
    }

    @Test
    fun test_routeResultsMockProvider_emptyVariant() {
        val state = RouteResultsMockProvider.value("empty")
        assertNotNull("RouteResultsScreenState should not be null", state)
        assertEquals("Should have 0 routes", 0, state.routes.size)
        assertNull("Should have no selected route", state.selectedRouteId)
        assertEquals("Message kind should be error", "error", state.message.kind)
    }

    @Test
    fun test_routeResultsMockProvider_overflowVariant() {
        val state = RouteResultsMockProvider.value("overflow")
        assertNotNull("RouteResultsScreenState should not be null", state)
        assertEquals("Should have 12 routes", 12, state.routes.size)
        assertTrue("Should have at least 10 routes", state.routes.size >= 10)
    }

    @Test
    fun test_routeResultsMockProvider_determinism() {
        val state1 = RouteResultsMockProvider.value("default")
        val state2 = RouteResultsMockProvider.value("default")
        assertEquals("Same variant should return identical data", state1, state2)
    }

    @Test
    fun test_routeDetailsMockProvider_defaultVariant() {
        val state = RouteDetailsMockProvider.value("default")
        assertNotNull("RouteDetailsScreenState should not be null", state)
        assertEquals("Route should be 'The Skyline Spine'", "The Skyline Spine", state.route.name)
        assertEquals("Should have 6 weather entries", 6, state.weatherTimeline.size)
    }

    @Test
    fun test_routeDetailsMockProvider_emptyVariant() {
        val state = RouteDetailsMockProvider.value("empty")
        assertNotNull("RouteDetailsScreenState should not be null", state)
        assertEquals("Should have 0 weather entries", 0, state.weatherTimeline.size)
        assertEquals("Route name should be 'No Route Available'", "No Route Available", state.route.name)
    }

    @Test
    fun test_routeDetailsMockProvider_determinism() {
        val state1 = RouteDetailsMockProvider.value("default")
        val state2 = RouteDetailsMockProvider.value("default")
        assertEquals("Same variant should return identical data", state1, state2)
    }

    @Test
    fun test_sessionsMockProvider_defaultVariant() {
        val state = SessionsMockProvider.value("default")
        assertNotNull("SessionsScreenState should not be null", state)
        assertEquals("Should have 3 sessions", 3, state.sessions.size)
        assertEquals("First session should be active", "session-001", state.activeSessionId)
        assertTrue("First session should be marked active", state.sessions[0].active)
    }

    @Test
    fun test_sessionsMockProvider_emptyVariant() {
        val state = SessionsMockProvider.value("empty")
        assertNotNull("SessionsScreenState should not be null", state)
        assertEquals("Should have 0 sessions", 0, state.sessions.size)
        assertNull("Should have no active session", state.activeSessionId)
    }

    @Test
    fun test_sessionsMockProvider_overflowVariant() {
        val state = SessionsMockProvider.value("overflow")
        assertNotNull("SessionsScreenState should not be null", state)
        assertEquals("Should have 12 sessions", 12, state.sessions.size)
        assertTrue("Should have at least 10 sessions", state.sessions.size >= 10)
    }

    @Test
    fun test_sessionsMockProvider_determinism() {
        val state1 = SessionsMockProvider.value("default")
        val state2 = SessionsMockProvider.value("default")
        assertEquals("Same variant should return identical data", state1, state2)
    }

    @Test
    fun test_errorMockProvider_defaultVariant() {
        val state = ErrorMockProvider.value("default")
        assertNotNull("ErrorScreenState should not be null", state)
        assertEquals("Error title should be 'THE NAVIGATOR'", "THE NAVIGATOR", state.error.title)
        assertEquals("Should have 2 suggestions", 2, state.suggestions.size)
        assertNotNull("Error should have detail", state.error.detail)
    }

    @Test
    fun test_errorMockProvider_emptyVariant() {
        val state = ErrorMockProvider.value("empty")
        assertNotNull("ErrorScreenState should not be null", state)
        assertEquals("Should have 0 suggestions", 0, state.suggestions.size)
        assertNull("Error should have no detail", state.error.detail)
    }

    @Test
    fun test_errorMockProvider_overflowVariant() {
        val state = ErrorMockProvider.value("overflow")
        assertNotNull("ErrorScreenState should not be null", state)
        assertEquals("Should have 12 suggestions", 12, state.suggestions.size)
        assertTrue("Should have at least 10 suggestions", state.suggestions.size >= 10)
    }

    @Test
    fun test_errorMockProvider_determinism() {
        val state1 = ErrorMockProvider.value("default")
        val state2 = ErrorMockProvider.value("default")
        assertEquals("Same variant should return identical data", state1, state2)
    }

    @Test
    fun test_allProviders_supportDefaultVariant() {
        // Test that all providers support the "default" variant
        val idleState = IdleMockProvider.value("default")
        assertNotNull("IdleMockProvider default", idleState)

        val planningState = PlanningMockProvider.value("default")
        assertNotNull("PlanningMockProvider default", planningState)

        val routeResultsState = RouteResultsMockProvider.value("default")
        assertNotNull("RouteResultsMockProvider default", routeResultsState)

        val routeDetailsState = RouteDetailsMockProvider.value("default")
        assertNotNull("RouteDetailsMockProvider default", routeDetailsState)

        val sessionsState = SessionsMockProvider.value("default")
        assertNotNull("SessionsMockProvider default", sessionsState)

        val errorState = ErrorMockProvider.value("default")
        assertNotNull("ErrorMockProvider default", errorState)
    }

    @Test
    fun test_allProviders_supportEmptyVariant() {
        // Test that all providers support the "empty" variant
        val idleState = IdleMockProvider.value("empty")
        assertNotNull("IdleMockProvider empty", idleState)
        assertTrue("IdleMockProvider empty should have empty collections", idleState.suggestions.isEmpty())

        val planningState = PlanningMockProvider.value("empty")
        assertNotNull("PlanningMockProvider empty", planningState)
        assertTrue("PlanningMockProvider empty should have empty phases", planningState.phases.isEmpty())

        val routeResultsState = RouteResultsMockProvider.value("empty")
        assertNotNull("RouteResultsMockProvider empty", routeResultsState)
        assertTrue("RouteResultsMockProvider empty should have empty routes", routeResultsState.routes.isEmpty())

        val sessionsState = SessionsMockProvider.value("empty")
        assertNotNull("SessionsMockProvider empty", sessionsState)
        assertTrue("SessionsMockProvider empty should have empty sessions", sessionsState.sessions.isEmpty())

        val errorState = ErrorMockProvider.value("empty")
        assertNotNull("ErrorMockProvider empty", errorState)
        assertTrue("ErrorMockProvider empty should have empty suggestions", errorState.suggestions.isEmpty())
    }

    @Test
    fun test_allProviders_supportOverflowVariant() {
        // Test that all providers support the "overflow" variant with >= 10 items
        val idleState = IdleMockProvider.value("overflow")
        assertTrue("IdleMockProvider overflow should have >= 10 suggestions", idleState.suggestions.size >= 10)

        val planningState = PlanningMockProvider.value("overflow")
        assertTrue("PlanningMockProvider overflow should have >= 5 phases", planningState.phases.size >= 5)

        val routeResultsState = RouteResultsMockProvider.value("overflow")
        assertTrue("RouteResultsMockProvider overflow should have >= 10 routes", routeResultsState.routes.size >= 10)

        val sessionsState = SessionsMockProvider.value("overflow")
        assertTrue("SessionsMockProvider overflow should have >= 10 sessions", sessionsState.sessions.size >= 10)

        val errorState = ErrorMockProvider.value("overflow")
        assertTrue("ErrorMockProvider overflow should have >= 10 suggestions", errorState.suggestions.size >= 10)
    }

    @Test
    fun test_allProviders_supportLongCopyVariant() {
        // Test that all providers support the "long-copy" variant
        val idleState = IdleMockProvider.value("long-copy")
        assertNotNull("IdleMockProvider long-copy", idleState)
        assertTrue("IdleMockProvider long-copy should have longer text", idleState.greeting.headline.length > 30)

        val planningState = PlanningMockProvider.value("long-copy")
        assertNotNull("PlanningMockProvider long-copy", planningState)
        assertTrue("PlanningMockProvider long-copy should have longer text", planningState.message.body.length > 50)

        val routeResultsState = RouteResultsMockProvider.value("long-copy")
        assertNotNull("RouteResultsMockProvider long-copy", routeResultsState)
        assertTrue("RouteResultsMockProvider long-copy should have longer text", routeResultsState.message.body.length > 100)

        val sessionsState = SessionsMockProvider.value("long-copy")
        assertNotNull("SessionsMockProvider long-copy", sessionsState)
        assertTrue("SessionsMockProvider long-copy should have longer text", sessionsState.sessions[0].title.length > 30)

        val errorState = ErrorMockProvider.value("long-copy")
        assertNotNull("ErrorMockProvider long-copy", errorState)
        assertTrue("ErrorMockProvider long-copy should have longer text", errorState.error.body.length > 100)
    }
}
