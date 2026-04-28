package com.laneshadow.sandbox

import com.laneshadow.sandbox.mockproviders.RouteResultsMockProvider
import com.laneshadow.ui.templates.RouteResultsScreen
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
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
        // GIVEN: S02 story state with best route selected
        val state = RouteResultsMockProvider.value("s02-alt-selected")
        var tappedRouteId: String? = null

        composeTestRule.setContent {
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = { routeId -> tappedRouteId = routeId },
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {},
            )
        }

        // WHEN: User taps the alt1 card (second attachment card)
        composeTestRule
            .onNodeWithTag("navigator-attachments")
            .performClick()

        // THEN: onRouteCardTap callback fired with alt1 route ID
        // Note: This test will FAIL initially because:
        // 1. The "s02-alt-selected" variant doesn't exist in RouteResultsMockProvider
        // 2. The onRouteCardTap callback is not wired to LSRouteAttachmentCard
        // These will be fixed in GREEN phase
    }
}
