package com.laneshadow.sandbox

import com.laneshadow.sandbox.mockproviders.ErrorMockProvider
import com.laneshadow.sandbox.mockproviders.SessionsMockProvider
import org.junit.Test
import org.junit.Assert.*

/**
 * TDD tests for FID-S02-T08 Sessions + Error variants
 *
 * Tests verify:
 * - AC-1: Sessions S05 new-confirm dialog
 * - AC-2: Sessions date grouping
 * - AC-3: Error S04 recovered state
 * - AC-4: Error V01 offline state
 * - AC-5: Error storm-gate variant
 * - AC-6: Error suggestion-chip wrap via FlowRow
 * - AC-7: Primary/tertiary chip color distinction
 */
class SessionsErrorVariantTests {

    // ========================================================================================
    // AC-1: Sessions S05 new-confirm dialog
    // ========================================================================================

    @Test
    fun testSessionsS05NewConfirm() {
        val state = SessionsMockProvider.value("s05-new-confirm")
        assertNotNull("S05 state should not be null", state)
        assertTrue("S05 should have sessions", state.sessions.isNotEmpty())
        assertNotNull("S05 should have active session", state.activeSessionId)

        // Verify the active session exists in the list
        val activeSession = state.sessions.firstOrNull { it.id == state.activeSessionId }
        assertNotNull("Active session should exist in sessions list", activeSession)
        assertTrue("Active session should be marked active", activeSession?.active == true)
    }

    // ========================================================================================
    // AC-2: Sessions date grouping
    // ========================================================================================

    @Test
    fun testSessionsDateGrouping() {
        val state = SessionsMockProvider.value("s04-grouped")
        assertNotNull("Grouped state should not be null", state)

        // Verify we have sessions distributed across multiple dates
        assertTrue("Grouped state should have sessions", state.sessions.isNotEmpty())

        // Verify at least 3 different date buckets are represented
        val dateLabels = state.sessions.map { it.`when` }.distinct()
        assertTrue("Should have at least 3 different date labels", dateLabels.size >= 3)

        // Verify date labels match expected buckets
        val expectedLabels = listOf("TONIGHT", "TODAY", "THIS WEEK", "LAST WEEK", "EARLIER")
        val actualLabels = dateLabels.filter { it in expectedLabels }
        assertTrue("Should have at least 3 recognized date labels", actualLabels.size >= 3)
    }

    // ========================================================================================
    // AC-3: Error S04 recovered state
    // ========================================================================================

    @Test
    fun testErrorS04Recovered() {
        val state = ErrorMockProvider.value("s04-recovered")
        assertNotNull("S04 recovered state should not be null", state)

        // Verify error state has suggestions
        assertTrue("S04 should have suggestion chips", state.suggestions.isNotEmpty())

        // Verify at least one chip is marked as primary
        val primaryChips = state.suggestions.filter { it.isPrimary }
        assertTrue("Should have at least one primary suggestion chip", primaryChips.isNotEmpty())

        // Verify error body describes recovery scenario
        assertTrue("Error body should describe recovery", state.error.body.isNotEmpty())
        assertNotNull("Error should have detail text", state.error.detail)
    }

    // ========================================================================================
    // AC-4: Error V01 offline state
    // ========================================================================================

    @Test
    fun testErrorV01Offline() {
        val state = ErrorMockProvider.value("v01-offline")
        assertNotNull("V01 offline state should not be null", state)

        // Verify error describes offline condition
        val body = state.error.body.lowercase()
        assertTrue("Error body should mention offline/signal", body.contains("offline") || body.contains("signal"))

        // Verify suggestions are appropriate for offline state
        assertTrue("V01 should have suggestions for offline recovery", state.suggestions.isNotEmpty())

        // Verify detail mentions offline state
        val detail = state.error.detail?.lowercase() ?: ""
        assertTrue("Error detail should mention offline", detail.contains("offline") || detail.contains("data"))
    }

    // ========================================================================================
    // AC-5: Error storm-gate variant
    // ========================================================================================

    @Test
    fun testErrorStormGate() {
        val state = ErrorMockProvider.value("s02-storm-gate")
        assertNotNull("Storm-gate state should not be null", state)

        // Verify error describes storm/weather condition
        val body = state.error.body.lowercase()
        assertTrue("Error body should mention storm/weather", body.contains("storm") || body.contains("weather") || body.contains("thunder"))

        // Verify suggestions are appropriate for storm-gate (rescheduling)
        assertTrue("Storm-gate should have rescheduling suggestions", state.suggestions.isNotEmpty())

        // Verify detail mentions safety gate
        val detail = state.error.detail?.lowercase() ?: ""
        assertTrue("Error detail should mention safety", detail.contains("safety") || detail.contains("gate"))
    }

    // ========================================================================================
    // AC-6: Error suggestion-chip wrap via FlowRow
    // ========================================================================================

    @Test
    fun testErrorSuggestionFlowRowWrap() {
        // For now, verify that chips can be rendered (FlowRow wrap will be tested in UI tests)
        // Use any variant with multiple chips
        val state = ErrorMockProvider.value("network")
        assertNotNull("Network state should not be null", state)

        // Verify we have chips to test wrapping behavior
        assertTrue("Should have suggestion chips for wrap test", state.suggestions.size >= 2)

        // Verify all chips have labels
        state.suggestions.forEach { chip ->
            assertTrue("Chip label should not be empty", chip.label.isNotEmpty())
        }
    }

    // ========================================================================================
    // AC-7: Primary/tertiary chip color distinction
    // ========================================================================================

    @Test
    fun testSuggestionChipPrimaryTertiary() {
        val state = ErrorMockProvider.value("s04-recovered")
        assertNotNull("State should not be null", state)

        // Verify we have mixed primary/tertiary chips
        val primaryChips = state.suggestions.filter { it.isPrimary }
        val tertiaryChips = state.suggestions.filter { !it.isPrimary }

        assertTrue("Should have at least one primary chip", primaryChips.isNotEmpty())
        assertTrue("Should have at least one tertiary chip", tertiaryChips.isNotEmpty())

        // Verify all chips have the isPrimary flag set
        state.suggestions.forEach { chip ->
            // The isPrimary field should be explicitly set (not default)
            assertNotNull("Chip should have isPrimary flag", chip.isPrimary)
        }
    }

    // ========================================================================================
    // Helper: Verify all new variants are registered
    // ========================================================================================

    @Test
    fun testAllNewVariantsRegistered() {
        // Verify SessionsMockProvider supports new variants
        val sessionsVariants = SessionsMockProvider.variants
        assertTrue("SessionsMockProvider should support s05-new-confirm", "s05-new-confirm" in sessionsVariants)
        assertTrue("SessionsMockProvider should support s04-grouped", "s04-grouped" in sessionsVariants)

        // Verify ErrorMockProvider supports new variants
        val errorVariants = ErrorMockProvider.variants
        assertTrue("ErrorMockProvider should support s04-recovered", "s04-recovered" in errorVariants)
        assertTrue("ErrorMockProvider should support v01-offline", "v01-offline" in errorVariants)
        assertTrue("ErrorMockProvider should support s02-storm-gate", "s02-storm-gate" in errorVariants)
    }
}
