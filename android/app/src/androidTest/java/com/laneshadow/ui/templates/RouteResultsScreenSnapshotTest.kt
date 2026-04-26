package com.laneshadow.ui.templates

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.sandbox.mockproviders.RouteResultsMockProvider
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Snapshot tests for RouteResultsScreen template.
 *
 * Tests visual appearance in light and dark themes to ensure
 * proper color re-resolution per AC-5.
 *
 * Note: These are unit tests that verify the screen renders without errors
 * in both themes. Visual snapshot verification would require additional
 * tooling like Paparazzi or Roborazzi.
 */
@RunWith(AndroidJUnit4::class)
class RouteResultsScreenSnapshotTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * TC-5: AC-5 — Light/dark re-resolution
     *
     * GIVEN Story rendered
     * WHEN Theme toggled
     * THEN Map style re-resolves to dark Studio style; glass chrome, message surface,
     *      route stripes re-resolve
     * Verify: Snapshot test light + dark
     */
    @Test
    fun tc5_ac5_lightTheme_renders() {
        // GIVEN: RouteResults screen with default state
        val state = RouteResultsMockProvider.value("default")

        // WHEN: Screen renders in light theme
        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = false) {
                RouteResultsScreen(
                    state = state,
                    onMenuTap = {},
                    onRouteCardTap = {},
                    onPinTap = {},
                    onDismissTap = {},
                    onRefineChange = {},
                    onRefineSend = {},
                    onCollapseTap = {},
                    onFilterTap = {},
                )
            }
        }

        // THEN: Screen renders without errors
        // (Visual verification would require snapshot capture)
        composeTestRule.waitForIdle()
    }

    @Test
    fun tc5_ac5_darkTheme_renders() {
        // GIVEN: RouteResults screen with default state
        val state = RouteResultsMockProvider.value("default")

        // WHEN: Screen renders in dark theme
        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = true) {
                RouteResultsScreen(
                    state = state,
                    onMenuTap = {},
                    onRouteCardTap = {},
                    onPinTap = {},
                    onDismissTap = {},
                    onRefineChange = {},
                    onRefineSend = {},
                    onCollapseTap = {},
                    onFilterTap = {},
                )
            }
        }

        // THEN: Screen renders without errors
        // (Visual verification would require snapshot capture)
        composeTestRule.waitForIdle()
    }

    @Test
    fun tc5_ac5_emptyState_lightTheme_renders() {
        // GIVEN: RouteResults screen with empty state
        val state = RouteResultsMockProvider.value("empty")

        // WHEN: Screen renders in light theme
        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = false) {
                RouteResultsScreen(
                    state = state,
                    onMenuTap = {},
                    onRouteCardTap = {},
                    onPinTap = {},
                    onDismissTap = {},
                    onRefineChange = {},
                    onRefineSend = {},
                    onCollapseTap = {},
                    onFilterTap = {},
                )
            }
        }

        // THEN: Screen renders without errors
        composeTestRule.waitForIdle()
    }

    @Test
    fun tc5_ac5_emptyState_darkTheme_renders() {
        // GIVEN: RouteResults screen with empty state
        val state = RouteResultsMockProvider.value("empty")

        // WHEN: Screen renders in dark theme
        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = true) {
                RouteResultsScreen(
                    state = state,
                    onMenuTap = {},
                    onRouteCardTap = {},
                    onPinTap = {},
                    onDismissTap = {},
                    onRefineChange = {},
                    onRefineSend = {},
                    onCollapseTap = {},
                    onFilterTap = {},
                )
            }
        }

        // THEN: Screen renders without errors
        composeTestRule.waitForIdle()
    }

    @Test
    fun tc5_ac5_overflowState_lightTheme_renders() {
        // GIVEN: RouteResults screen with overflow state
        val state = RouteResultsMockProvider.value("overflow")

        // WHEN: Screen renders in light theme
        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = false) {
                RouteResultsScreen(
                    state = state,
                    onMenuTap = {},
                    onRouteCardTap = {},
                    onPinTap = {},
                    onDismissTap = {},
                    onRefineChange = {},
                    onRefineSend = {},
                    onCollapseTap = {},
                    onFilterTap = {},
                )
            }
        }

        // THEN: Screen renders without errors
        composeTestRule.waitForIdle()
    }

    @Test
    fun tc5_ac5_overflowState_darkTheme_renders() {
        // GIVEN: RouteResults screen with overflow state
        val state = RouteResultsMockProvider.value("overflow")

        // WHEN: Screen renders in dark theme
        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = true) {
                RouteResultsScreen(
                    state = state,
                    onMenuTap = {},
                    onRouteCardTap = {},
                    onPinTap = {},
                    onDismissTap = {},
                    onRefineChange = {},
                    onRefineSend = {},
                    onCollapseTap = {},
                    onFilterTap = {},
                )
            }
        }

        // THEN: Screen renders without errors
        composeTestRule.waitForIdle()
    }
}
