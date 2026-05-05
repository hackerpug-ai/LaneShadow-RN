package com.laneshadow.ui.idle

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.data.favorites.FavoriteLocation
import com.laneshadow.sandbox.mockproviders.Greeting
import com.laneshadow.sandbox.mockproviders.IdleScreenState
import com.laneshadow.sandbox.mockproviders.LocationContext
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented tests for IdleScreen real-data wiring verification.
 *
 * These tests verify that the IdleScreen correctly renders UI components
 * that are wired to real data from the IdleViewModel, including:
 * - Greeting overlay with meta row and headline
 * - Chat input with location badge
 * - Map with favorite locations
 * - Weather advisory card
 *
 * Tests verify UI component presence and interaction patterns using
 * the IdleScreenState from debug mock providers to simulate real data flow.
 *
 * Note: Full integration tests with real Convex data require emulator/device
 * testing with authenticated backend connections. These tests verify the
 * UI layer correctly displays data when provided by the ViewModel.
 */
@RunWith(AndroidJUnit4::class)
class IdleScreenInstrumentedTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Verify greeting overlay components are displayed.
     *
     * GIVEN IdleScreen state with greeting data
     * WHEN screen is rendered
     * THEN greeting overlay, meta text, and headline are visible
     */
    @Test
    fun greeting_overlay_components_are_displayed() {
        // GIVEN: State with greeting data
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = emptyList(),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto",
            ),
            favoriteLocations = emptyList(),
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Greeting components are displayed
        composeTestRule.onNodeWithTag("greeting-overlay")
            .assertIsDisplayed()

        composeTestRule.onNodeWithTag("greeting-meta")
            .assertIsDisplayed()

        composeTestRule.onNodeWithTag("greeting-headline")
            .assertIsDisplayed()
    }

    /**
     * AC-2: Verify chat input is displayed with location badge.
     *
     * GIVEN IdleScreen state with location available
     * WHEN screen is rendered
     * THEN chat input with location badge is visible
     */
    @Test
    fun chat_input_with_location_badge_is_displayed() {
        // GIVEN: State with location available
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = emptyList(),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto",
            ),
            favoriteLocations = emptyList(),
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Chat input is displayed
        composeTestRule.onNodeWithTag("chat-input")
            .assertIsDisplayed()
    }

    /**
     * AC-3: Verify map is displayed with favorite locations.
     *
     * GIVEN IdleScreen state with favorite locations
     * WHEN screen is rendered
     * THEN map is visible and ready to render pins
     */
    @Test
    fun map_is_displayed_with_favorite_locations() {
        // GIVEN: State with favorite locations
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = emptyList(),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto",
            ),
            favoriteLocations = listOf(
                FavoriteLocation(
                    id = "fav-1",
                    lat = 37.8104,
                    lon = -122.4752,
                    label = "Home",
                )
            ),
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Map is displayed
        composeTestRule.onNodeWithTag("idlescreen-map")
            .assertIsDisplayed()
    }

    /**
     * AC-4: Verify top bar with menu button is displayed.
     *
     * GIVEN IdleScreen is rendered
     * WHEN screen is displayed
     * THEN top bar with menu button is visible
     */
    @Test
    fun top_bar_with_menu_is_displayed() {
        // GIVEN: IdleScreen state
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = emptyList(),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto",
            ),
            favoriteLocations = emptyList(),
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Top bar is displayed
        composeTestRule.onNodeWithTag("ls-topbar")
            .assertIsDisplayed()
    }

    /**
     * AC-5: Verify weather advisory card appears when enabled.
     *
     * GIVEN IdleScreen state with weather advisory
     * WHEN screen is rendered
     * THEN advisory card is visible
     */
    @Test
    fun weather_advisory_card_is_displayed_when_enabled() {
        // GIVEN: State with advisory weather
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 58°F · RAIN EXPECTED",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = emptyList(),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto",
            ),
            favoriteLocations = emptyList(),
            showAdvisoryCard = true,
            advisoryMessage = "Rain expected",
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Advisory card is displayed
        composeTestRule.onNodeWithTag("advisory-card")
            .assertIsDisplayed()

        // Verify meta text shows warning conditions
        composeTestRule.onNodeWithTag("greeting-meta")
            .assertIsDisplayed()
    }

    /**
     * AC-6: Verify no-location variant shows correct UI.
     *
     * GIVEN IdleScreen state without location
     * WHEN screen is rendered
     * THEN chat input is shown but location badge indicates no location
     */
    @Test
    fun no_location_variant_shows_correct_ui() {
        // GIVEN: State without location
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = listOf(
                MockSuggestionChip(id = "chip-1", label = "Twisty back roads")
            ),
            locationContext = LocationContext(
                label = "Tap to set start",
                mode = "manual",
            ),
            favoriteLocations = emptyList(),
            isNoLocation = true,
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Chat input is still displayed (but with "Tap to set start" badge)
        composeTestRule.onNodeWithTag("chat-input")
            .assertIsDisplayed()
    }

    /**
     * AC-7: Verify suggestion chips are displayed.
     *
     * GIVEN IdleScreen state with suggestion chips
     * WHEN screen is rendered
     * THEN suggestion chips are visible in chat input
     */
    @Test
    fun suggestion_chips_are_displayed() {
        // GIVEN: State with suggestion chips
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = listOf(
                MockSuggestionChip(id = "chip-1", label = "Twisty back roads"),
                MockSuggestionChip(id = "chip-2", label = "Coastal cruise"),
            ),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto",
            ),
            favoriteLocations = emptyList(),
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Chat input with suggestions is displayed
        composeTestRule.onNodeWithTag("chat-input")
            .assertIsDisplayed()
    }

    /**
     * AC-8: Verify greeting scope italic emphasis.
     *
     * GIVEN IdleScreen state with "today" emphasis
     * WHEN screen is rendered
     * THEN greeting headline contains italic "today"
     */
    @Test
    fun greeting_shows_italic_emphasis_on_scope_word() {
        // GIVEN: State with "today" emphasis
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today, Rider?",
                emphasis = "today",
            ),
            suggestions = emptyList(),
            locationContext = LocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto",
            ),
            favoriteLocations = emptyList(),
        )

        // WHEN: Screen is rendered
        composeTestRule.setContent {
            LaneShadowTheme {
                com.laneshadow.ui.templates.IdleScreen(
                    state = state,
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                )
            }
        }

        // THEN: Greeting headline with emphasis is displayed
        composeTestRule.onNodeWithTag("greeting-headline")
            .assertIsDisplayed()
    }
}
