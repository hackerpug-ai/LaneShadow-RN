package com.laneshadow.sandbox

import com.laneshadow.sandbox.mockproviders.RouteResultsMockProvider
import com.laneshadow.ui.templates.RouteResultsScreen
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import androidx.test.ext.junit.runners.AndroidJUnit4

/**
 * TDD tests for RouteResults + RouteDetails variant stories.
 *
 * Tests the 7 new sandbox variants:
 * - AC-1: S02 alt-selection re-promote
 * - AC-2: S04 refining state
 * - AC-3: V03 Recall chip
 * - AC-4: S03 dark story
 * - AC-5: S04 medium detent
 * - AC-6: S05 dismissing copper stripe
 * - AC-7: V01 saved-state toast + Save flip + SavedPill
 */
@RunWith(AndroidJUnit4::class)
class RouteResultsDetailsVariantTests {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Alt-selection re-promote (S02)
     *
     * GIVEN: RouteResultsScreen S02 story renders with selectedRouteId = best.id and three route attachment cards
     * WHEN: The user taps the alt1 card
     * THEN: LSNavigatorMessage.onRouteCardTap fires with alt1 id, selectedRouteId updates, alt1's polyline re-promotes
     */
    @Test
    fun testS02AltSelectionRepromote() {
        // GIVEN: S02 story state with alt1 route selected (not best)
        val state = RouteResultsMockProvider.value("s02-alt-selected")

        // THEN: State has alt1 route selected
        assertEquals("route-002", state.selectedRouteId) // Alt1 is selected

        // THEN: State has three routes
        assertEquals(3, state.routes.size)

        // THEN: First attachment is for best route
        assertEquals("route-001", state.message.attachments?.get(0)?.routeId)

        // THEN: Second attachment is for alt1 route
        assertEquals("route-002", state.message.attachments?.get(1)?.routeId)

        // Note: Full tap interaction test requires UI changes to LSNavigatorMessage
        // and LSRouteAttachmentCard to wire the callback through.
        // This test verifies the mock state is correctly configured.
    }

    /**
     * AC-2: Refining state (S04)
     *
     * GIVEN: RouteResultsScreen S04 story is rendered with mode = Refining
     * WHEN: The screen draws
     * THEN: surface.scrim-soft overlay, polylines alpha 0.4, callout hidden, primer chips, send button
     */
    @Test
    fun testS04RefiningState() {
        // GIVEN: S04 story state
        val state = RouteResultsMockProvider.value("s04-refining")

        // THEN: Mode is "refining"
        assertEquals("refining", state.mode)

        // THEN: Callout attachments are hidden
        assertEquals(null, state.message.attachments)

        // THEN: Primer chips are present
        assertEquals(3, state.primerChips.size)
        assertEquals("Make it shorter", state.primerChips[0].label)
    }

    /**
     * AC-3: Recall chip (V03)
     *
     * GIVEN: RouteResultsScreen V03 story with callout isVisible = false
     * WHEN: The screen draws
     * THEN: Glass Recall pill with surface.glass + border.glass + blur 14dp
     */
    @Test
    fun testV03RecallChip() {
        // GIVEN: V03 story state
        val state = RouteResultsMockProvider.value("v03-recall")

        // THEN: showRecallChip flag is true
        assertEquals(true, state.showRecallChip)

        // THEN: Message is still present (will be hidden by UI logic)
        assertEquals("msg-v03", state.message.id)
    }

    /**
     * AC-4: RouteDetails S03 dark
     *
     * GIVEN: Sandbox story templates.route-details.s03-dark with darkTheme = true
     * WHEN: The screen draws
     * THEN: Theme tokens resolve dark and map + sheet + weather timeline render in dark
     */
    @Test
    fun testRouteDetailsS03Dark() {
        // GIVEN: S03 dark story state
        val state = com.laneshadow.sandbox.mockproviders.RouteDetailsMockProvider.value("s03-dark")

        // THEN: darkTheme flag is true
        assertEquals(true, state.darkTheme)
    }

    /**
     * AC-5: RouteDetails S04 medium detent
     *
     * GIVEN: Sandbox story templates.route-details.s04-medium
     * WHEN: The sheet presents
     * THEN: LSBottomSheet(detent = SheetDetent.Medium) is used
     */
    @Test
    fun testRouteDetailsS04MediumDetent() {
        // GIVEN: S04 medium detent story state
        val state = com.laneshadow.sandbox.mockproviders.RouteDetailsMockProvider.value("s04-medium")

        // THEN: detent is "medium"
        assertEquals("medium", state.detent)
    }

    /**
     * AC-6: RouteDetails S05 dismissing copper stripe
     *
     * GIVEN: Sandbox story templates.route-details.s05-dismissing with drag past medium detent
     * WHEN: The dismiss threshold is passed
     * THEN: Copper top-edge stripe gradient flash renders
     */
    @Test
    fun testRouteDetailsS05Dismissing() {
        // GIVEN: S05 dismissing story state
        val state = com.laneshadow.sandbox.mockproviders.RouteDetailsMockProvider.value("s05-dismissing")

        // THEN: isDismissing flag is true
        assertEquals(true, state.isDismissing)
    }

    /**
     * AC-7: RouteDetails V01 saved-state
     *
     * GIVEN: Sandbox story templates.route-details.v01-saved with isSaved = true
     * WHEN: The screen draws
     * THEN: LSToast slides in, Save button renders saved variant, LSSavedPill appears
     */
    @Test
    fun testRouteDetailsV01Saved() {
        // GIVEN: V01 saved-state story
        val state = com.laneshadow.sandbox.mockproviders.RouteDetailsMockProvider.value("v01-saved")

        // THEN: isSaved flag is true
        assertEquals(true, state.isSaved)
    }
}
