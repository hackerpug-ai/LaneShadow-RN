package com.laneshadow.sandbox

import com.laneshadow.sandbox.mockproviders.IdleMockProvider
import com.laneshadow.sandbox.mockproviders.PlanningMockProvider
import org.junit.Test
import org.junit.Assert.*

/**
 * TDD tests for Idle and Planning screen variants (FID-S02-T04).
 *
 * Tests the six new edge-state variants:
 * - Idle V01: no-location (copper pill + dim chat input)
 * - Idle V02: first-ride (no pins + onboarding chips)
 * - Idle V03: weather-advisory (warning meta + advisory card)
 * - Planning V01: slow (italic apology + dashed border)
 * - Planning V02: cancel-confirm (dimmed card + scrim + confirm sheet)
 * - Planning V03: single-candidate (warning border + compass chip + header string)
 */
class IdlePlanningVariantTests {

    // ========================================================================
    // AC-1: Idle V01 no-location
    // ========================================================================

    @Test
    fun testIdleV01NoLocation() {
        // GIVEN: Android sandbox story templates.idle-screen.v-no-location is rendered
        val state = IdleMockProvider.value("v-no-location")

        // THEN: Location context shows "Tap to set start"
        assertEquals("Tap to set start", state.locationContext.label)

        // THEN: isNoLocation flag is true
        assertTrue(state.isNoLocation)

        // THEN: Advisory card is not shown
        assertFalse(state.showAdvisoryCard)
    }

    // ========================================================================
    // AC-2: Idle V02 first-ride
    // ========================================================================

    @Test
    fun testIdleV02FirstRide() {
        // GIVEN: Android sandbox story templates.idle-screen.v-first-ride is rendered
        val state = IdleMockProvider.value("v-first-ride")

        // THEN: Onboarding chips are present
        assertEquals(2, state.suggestions.size)
        assertTrue(state.suggestions.any { it.label == "Short & scenic" })
        assertTrue(state.suggestions.any { it.label == "Learn the roads" })

        // THEN: Advisory card is not shown
        assertFalse(state.showAdvisoryCard)

        // THEN: isNoLocation is false
        assertFalse(state.isNoLocation)
    }

    // ========================================================================
    // AC-3: Idle V03 weather-advisory
    // ========================================================================

    @Test
    fun testIdleV03WeatherAdvisory() {
        // GIVEN: Android sandbox story templates.idle-screen.v-weather-advisory is rendered
        val state = IdleMockProvider.value("v-weather-advisory")

        // THEN: Advisory card should be shown
        assertTrue(state.showAdvisoryCard)

        // THEN: Advisory message is present
        assertEquals("Rain expected", state.advisoryMessage)

        // THEN: Meta text indicates rain
        assertTrue(state.greeting.meta.contains("RAIN EXPECTED"))
    }

    // ========================================================================
    // AC-4: Planning V01 slow
    // ========================================================================

    @Test
    fun testPlanningV01Slow() {
        // GIVEN: Android sandbox story templates.planning-screen.slow-planning-light (or -dark) is rendered
        val state = PlanningMockProvider.value("v-slow")

        // THEN: Slow apology message is present
        assertNotNull(state.slowApology)
        assertTrue(state.slowApology!!.isNotEmpty())

        // THEN: No cancel confirm
        assertFalse(state.showCancelConfirm)

        // THEN: No warning border
        assertFalse(state.warningBorder)
    }

    // ========================================================================
    // AC-5: Planning V02 cancel-confirm
    // ========================================================================

    @Test
    fun testPlanningV02CancelConfirm() {
        // GIVEN: Android sandbox story templates.planning-screen.cancel-prompt-light (or -dark) is rendered
        val state = PlanningMockProvider.value("v-cancel-confirm")

        // THEN: Show cancel confirm flag is true
        assertTrue(state.showCancelConfirm)

        // THEN: No slow apology
        assertNull(state.slowApology)

        // THEN: No warning border
        assertFalse(state.warningBorder)
    }

    // ========================================================================
    // AC-6: Planning V03 single-candidate + header string
    // ========================================================================

    @Test
    fun testPlanningV03SingleCandidateAndHeader() {
        // GIVEN: Android sandbox story templates.planning-screen.single-candidate-light (or -dark) is rendered
        val state = PlanningMockProvider.value("v-single-candidate")

        // THEN: Warning border flag is true
        assertTrue(state.warningBorder)

        // THEN: Phase headers map is present
        assertNotNull(state.phaseHeaders)
        assertTrue(state.phaseHeaders!!.isNotEmpty())

        // THEN: No cancel confirm
        assertFalse(state.showCancelConfirm)
    }
}
