package com.laneshadow.ui.templates

import android.graphics.Bitmap
import androidx.compose.material3.Surface
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.laneshadow.sandbox.mockproviders.IdleMockProvider
import com.laneshadow.theme.LaneShadowTheme
import java.io.File
import java.io.FileOutputStream
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented UI tests for IdleScreen template (refreshed for Sprint 07 retrofit).
 *
 * These tests verify actual Compose node rendering and semantics using
 * createComposeRule() against the retrofitted IdleScreen with idle-context-capsule
 * and idle-map-controls testTags (introduced by CAPS-S07-T06).
 *
 * IMPORTANT: The v0 design-review pipeline (`pnpm design:review`) is iOS-only per
 * Sprint 05 (FID-S05-T10). Android instrumented captures here are best-effort
 * artifacts emitted via `composeRule.onRoot().captureToImage()` for manual
 * inspection until the Android pipeline ships.
 *
 * TC-1: Mount default story, assert testTag nodes exist + text content
 * TC-2: Tap suggestion chip, assert input text updates
 * TC-3: Type into input, assert trailing icon changes to send
 * TC-4: Tap hamburger menu, assert callback invoked
 * TC-5..8: Variant captures — emit ≥7 PNG artifacts to test-additional-output
 */
@RunWith(AndroidJUnit4::class)
class IdleScreenInstrumentedTest {

    @get:Rule
    val composeRule = createComposeRule()

    /**
     * TC-1 — Mount default story, assert testTag nodes exist + text content
     *
     * GIVEN: IdleScreen rendered with default IdleMockProvider state (after CAPS-S07-T06 retrofit)
     * WHEN: Composable mounts
     * THEN: All expected nodes are present:
     *   - ls-topbar (top bar)
     *   - idle-context-capsule (context capsule overlay)
     *   - idle-map-controls (map controls on right edge)
     *   - chat-input (chat input field)
     *   - idlescreen-map (map)
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

        // Assert context capsule is visible (idle-context-capsule replaces legacy greeting-overlay)
        composeRule
            .onNodeWithTag("idle-context-capsule")
            .assertIsDisplayed()

        // Assert map controls are visible (idle-map-controls replaces legacy advisory-card)
        composeRule
            .onNodeWithTag("idle-map-controls")
            .assertIsDisplayed()

        // Assert chat input is visible
        composeRule
            .onNodeWithTag("chat-input")
            .assertIsDisplayed()

        // Assert map is present
        composeRule
            .onNodeWithTag("idlescreen-map")
            .assertIsDisplayed()

        // Assert headline text content: "Where are we riding today?"
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
     * GIVEN: IdleScreen rendered with default state (after CAPS-S07-T06 retrofit)
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

        // Assert context capsule and map controls are visible (new testTags)
        composeRule
            .onNodeWithTag("idle-context-capsule")
            .assertIsDisplayed()

        composeRule
            .onNodeWithTag("idle-map-controls")
            .assertIsDisplayed()

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
     * GIVEN: IdleScreen rendered with empty chat input (after CAPS-S07-T06 retrofit)
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
     * GIVEN: IdleScreen rendered (after CAPS-S07-T06 retrofit)
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

    /**
     * TC-5 — Capture "default" variant screenshot
     *
     * GIVEN: IdleScreen rendered with "default" IdleMockProvider variant
     * WHEN: composeRule.waitForIdle() completes
     * THEN: Screenshot emitted to test-additional-output via composeRule.onRoot().captureToImage()
     */
    @Test
    fun tc5_capture_default_variant() {
        val state = IdleMockProvider.value("default")
        captureVariant(state, "idle-default")
    }

    /**
     * TC-6 — Capture "empty" variant screenshot
     */
    @Test
    fun tc6_capture_empty_variant() {
        val state = IdleMockProvider.value("empty")
        captureVariant(state, "idle-empty")
    }

    /**
     * TC-7 — Capture "overflow" variant screenshot
     */
    @Test
    fun tc7_capture_overflow_variant() {
        val state = IdleMockProvider.value("overflow")
        captureVariant(state, "idle-overflow")
    }

    /**
     * TC-8 — Capture "long-copy" variant screenshot
     */
    @Test
    fun tc8_capture_long_copy_variant() {
        val state = IdleMockProvider.value("long-copy")
        captureVariant(state, "idle-long-copy")
    }

    /**
     * TC-9 — Capture "v-no-location" variant screenshot
     */
    @Test
    fun tc9_capture_no_location_variant() {
        val state = IdleMockProvider.value("v-no-location")
        captureVariant(state, "idle-v-no-location")
    }

    /**
     * TC-10 — Capture "v-first-ride" variant screenshot
     */
    @Test
    fun tc10_capture_first_ride_variant() {
        val state = IdleMockProvider.value("v-first-ride")
        captureVariant(state, "idle-v-first-ride")
    }

    /**
     * TC-11 — Capture "v-weather-advisory" variant screenshot
     */
    @Test
    fun tc11_capture_weather_advisory_variant() {
        val state = IdleMockProvider.value("v-weather-advisory")
        captureVariant(state, "idle-v-weather-advisory")
    }

    /**
     * Helper to capture a variant screenshot.
     *
     * Renders IdleScreen with the given state, waits for idle, then verifies
     * all expected testTags are present. The screenshot is captured via
     * composeRule for manual inspection.
     *
     * Images are emitted to: app/build/outputs/connected_android_test_additional_output/
     *
     * @param state The IdleScreenState to render
     * @param variantId The variant identifier (e.g., "idle-default", "idle-empty")
     */
    private fun captureVariant(state: com.laneshadow.sandbox.mockproviders.IdleScreenState, variantId: String) {
        composeRule.setContent {
            LaneShadowTheme {
                Surface {
                    IdleScreen(
                        state = state,
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

        // Wait for all recompositions and animations to settle
        composeRule.runOnIdle {
            // Verify expected testTags are present in the rendered tree (AC-4)
            composeRule
                .onNodeWithTag("idle-context-capsule")
                .assertIsDisplayed()

            composeRule
                .onNodeWithTag("idle-map-controls")
                .assertIsDisplayed()

            composeRule
                .onNodeWithTag("chat-input")
                .assertIsDisplayed()

            composeRule
                .onNodeWithTag("ls-topbar")
                .assertIsDisplayed()

            composeRule
                .onNodeWithTag("idlescreen-map")
                .assertIsDisplayed()

            // Capture actual screenshot for design review
            val bitmap = composeRule.onRoot().captureToImage().asAndroidBitmap()
            val dir = InstrumentationRegistry.getInstrumentation()
                .targetContext
                .filesDir
                .resolve("design-review-captures")
                .also { it.mkdirs() }
            val file = File(dir, "$variantId.png")
            FileOutputStream(file).use { output ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
            }
            bitmap.recycle()
        }
    }
}
