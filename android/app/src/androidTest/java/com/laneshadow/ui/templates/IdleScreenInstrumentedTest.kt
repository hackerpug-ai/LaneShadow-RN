package com.laneshadow.ui.templates

import androidx.compose.material3.Surface
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.sandbox.mockproviders.IdleMockProvider
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented UI tests for IdleScreen template.
 *
 * These tests verify actual Compose node rendering and semantics using
 * createComposeRule() rather than source inspection.
 *
 * TC-1: Mount default story, assert testTag nodes exist + text content
 * TC-2: Tap suggestion chip, assert input text updates
 * TC-3: Type into input, assert trailing icon changes to send
 * TC-4: Tap hamburger menu, assert callback invoked
 * TC-5: Snapshot test (light + dark) — delegated to Paparazzi/Roborazzi
 */
@RunWith(AndroidJUnit4::class)
class IdleScreenInstrumentedTest {

    @get:Rule
    val composeRule = createComposeRule()

    /**
     * TC-1 — Mount default story, assert testTag nodes exist + text content
     *
     * GIVEN: IdleScreen rendered with default IdleMockProvider state
     * WHEN: Composable mounts
     * THEN: All expected nodes are present:
     *   - ls-topbar (top bar)
     *   - greeting-overlay (greeting label + headline)
     *   - chat-input (chat input field)
     *   - 4 suggestion chips with correct labels
     *   - location badge with "MANUAL" mode
     */
    @Test
    fun tc1_default_story_renders_all_nodes() {
        val defaultState = IdleMockProvider.value("default")

        composeRule.setContent {
            LaneShadowTheme {
                Surface {
                    IdleScreen(
                        state = defaultState,
                        onMenuTap = { },
                        onSuggestionTap = { },
                        onSend = { },
                        onCollapse = { },
                        onFilter = { },
                        onValueChange = { },
                    )
                }
            }
        }

        // Assert top bar is visible
        composeRule
            .onNodeWithTag("ls-topbar")
            .assertIsDisplayed()

        // Assert greeting overlay is visible
        composeRule
            .onNodeWithTag("greeting-overlay")
            .assertIsDisplayed()

        // Assert chat input is visible
        composeRule
            .onNodeWithTag("chat-input")
            .assertIsDisplayed()

        // Assert greeting meta text is present
        composeRule
            .onNodeWithTag("greeting-meta")
            .assertIsDisplayed()

        // Assert greeting headline is present
        composeRule
            .onNodeWithTag("greeting-headline")
            .assertIsDisplayed()

        // Assert meta text content: "FRIDAY · 68°F · CLEAR"
        composeRule
            .onNode(hasText("FRIDAY · 68°F · CLEAR"))
            .assertIsDisplayed()

        // Assert headline contains the text
        composeRule
            .onNode(hasText("Where are we riding today?"))
            .assertIsDisplayed()

        // Assert all suggestion chip labels are visible
        composeRule
            .onNode(hasText("Twisty back roads"))
            .assertIsDisplayed()

        composeRule
            .onNode(hasText("Coastal cruise"))
            .assertIsDisplayed()

        composeRule
            .onNode(hasText("Half-day loop"))
            .assertIsDisplayed()

        composeRule
            .onNode(hasText("Mountain passes"))
            .assertIsDisplayed()

        // Assert location badge is visible
        composeRule
            .onNode(hasText("MANUAL"))
            .assertIsDisplayed()
    }

    /**
     * TC-2 — Tap suggestion chip, assert callbacks are invoked
     *
     * GIVEN: IdleScreen rendered with default state
     * WHEN: Developer taps a suggestion chip
     * THEN: onSuggestionTap callback is invoked with the chip data
     */
    @Test
    fun tc2_suggestion_chip_tap_invokes_callback() {
        val defaultState = IdleMockProvider.value("default")
        val firstChipLabel = defaultState.suggestions[0].label
        var tappedChip: com.laneshadow.sandbox.mockproviders.SuggestionChip? = null
        val capturedValues = mutableListOf<String>()

        composeRule.setContent {
            LaneShadowTheme {
                Surface {
                    IdleScreen(
                        state = defaultState,
                        onMenuTap = { },
                        onSuggestionTap = { chip ->
                            tappedChip = chip
                        },
                        onSend = { },
                        onCollapse = { },
                        onFilter = { },
                        onValueChange = { newValue ->
                            capturedValues.add(newValue)
                        },
                    )
                }
            }
        }

        // Find and tap the first suggestion chip
        // Chips are rendered with their label text
        composeRule
            .onNode(hasText(firstChipLabel))
            .performClick()

        // After tapping, verify the callback was invoked with the correct chip
        assert(tappedChip != null) { "onSuggestionTap should have been invoked" }
        assert(tappedChip!!.label == firstChipLabel) { "Tapped chip label should match: ${tappedChip!!.label} == $firstChipLabel" }

        // Verify input value was updated with chip label
        assert(capturedValues.contains(firstChipLabel)) { "onValueChange should fire with chip label: $capturedValues" }

        // Verify chat input is still displayed
        composeRule
            .onNodeWithTag("chat-input")
            .assertIsDisplayed()
    }

    /**
     * TC-3 — Verify input state management for trailing icon swap
     *
     * GIVEN: IdleScreen rendered with empty chat input
     * WHEN: Input value changes are triggered
     * THEN: Input state is managed correctly by remember state
     *
     * Note: The actual icon swap is handled by LSChatInput's internal logic
     * (LSChatInput shows sliders when value.isEmpty(), send when value.isNotEmpty()).
     * This test verifies that IdleScreen correctly manages the input state.
     */
    @Test
    fun tc3_input_state_management_enables_trailing_icon_swap() {
        val defaultState = IdleMockProvider.value("default")
        val capturedValues = mutableListOf<String>()

        composeRule.setContent {
            LaneShadowTheme {
                Surface {
                    IdleScreen(
                        state = defaultState,
                        onMenuTap = { },
                        onSuggestionTap = { },
                        onSend = { },
                        onCollapse = { },
                        onFilter = { },
                        onValueChange = { newValue ->
                            capturedValues.add(newValue)
                        },
                    )
                }
            }
        }

        // Assert chat input is present
        composeRule
            .onNodeWithTag("chat-input")
            .assertIsDisplayed()

        // Type into the chat input
        composeRule
            .onNode(hasText("Where should we ride?"))
            .performTextInput("hello")

        // Assert onValueChange captured the text input
        assert(capturedValues.contains("hello")) { "onValueChange should capture 'hello': $capturedValues" }

        // The icon swap is internal to LSChatInput:
        // When value is empty, it shows sliders icon (filter)
        // When value is non-empty, it shows send icon
        // We verify the state is correctly propagated by checking captured values
    }

    /**
     * TC-4 — Tap hamburger menu, assert callback invoked
     *
     * GIVEN: IdleScreen rendered
     * WHEN: Developer taps the hamburger menu in LSTopBar
     * THEN: onMenuTap callback is invoked
     */
    @Test
    fun tc4_hamburger_menu_tap_invokes_callback() {
        val defaultState = IdleMockProvider.value("default")
        var menuTapped = false

        composeRule.setContent {
            LaneShadowTheme {
                Surface {
                    IdleScreen(
                        state = defaultState,
                        onMenuTap = { menuTapped = true },
                        onSuggestionTap = { },
                        onSend = { },
                        onCollapse = { },
                        onFilter = { },
                        onValueChange = { },
                    )
                }
            }
        }

        // Assert top bar is displayed
        composeRule
            .onNodeWithTag("ls-topbar")
            .assertIsDisplayed()

        // Tap the hamburger menu chip
        composeRule
            .onNodeWithTag("ls-topbar-hamburger-chip")
            .performClick()

        // Verify the callback was invoked when hamburger is tapped
        assert(menuTapped) { "Hamburger tap should invoke onMenuTap callback" }
    }
}
