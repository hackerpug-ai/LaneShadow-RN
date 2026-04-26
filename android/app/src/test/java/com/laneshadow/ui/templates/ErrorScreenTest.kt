package com.laneshadow.ui.templates

import com.laneshadow.sandbox.mockproviders.ErrorScreenState
import com.laneshadow.sandbox.mockproviders.NavigatorError
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for ErrorScreen template.
 *
 * AC-1: Error composition renders with all components
 * AC-2: Suggestion chip callback fires on tap
 * AC-3: Trailing icon swap on typing
 * AC-4: Light/dark token re-resolution
 * AC-5: No data-fetching logic
 *
 * Note: Full UI testing is done via the sandbox stories (templates.error.default).
 * These unit tests verify code structure, imports, and callback wiring.
 */
@RunWith(RobolectricTestRunner::class)
class ErrorScreenTest {

    /**
     * AC-1 — Error composition renders
     *
     * GIVEN: Sandbox is launched on Android with templates.error.default selected
     * WHEN: The story mounts
     * THEN: LSTopBar renders at top, LSInlineErrorCallout sits under top bar
     *       with warn-stripe + compass chip + "THE NAVIGATOR" label +
     *       opinion-serif body + muted detail + "Try inland" + "End at Big Sur" chips,
     *       LSMap fills canvas, LSChatInput anchored at bottom with recovery placeholder
     *
     * Note: Visual verification is done via sandbox stories.
     * This test verifies the composable signature and structure.
     */
    @Test
    fun ac1_error_screen_has_correct_composable_signature() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt").readText()

        // Must accept ErrorScreenState parameter
        assertTrue(source.contains("state: ErrorScreenState"))

        // Must accept callback parameters
        assertTrue(source.contains("onMenuTap: () -> Unit"))
        assertTrue(source.contains("onSuggestionTap: (MockSuggestionChip) -> Unit"))
        assertTrue(source.contains("onSend: (String) -> Unit"))
        assertTrue(source.contains("onCollapse: () -> Unit"))
        assertTrue(source.contains("onFilter: () -> Unit"))
        assertTrue(source.contains("onValueChange: (String) -> Unit"))

        // Must compose LSMapLayer
        assertTrue(source.contains("LSMapLayer("))

        // Must compose LSTopBar
        assertTrue(source.contains("LSTopBar("))

        // Must compose LSInlineErrorCallout
        assertTrue(source.contains("LSInlineErrorCallout("))

        // Must compose LSChatInput
        assertTrue(source.contains("LSChatInput("))
    }

    /**
     * AC-1 continued — Verify error callout receives correct params
     *
     * GIVEN: ErrorScreen composable
     * WHEN: Inspected
     * THEN: LSInlineErrorCallout receives body, detail, suggestions, onSuggestionTap
     */
    @Test
    fun ac1_error_callout_receives_correct_parameters() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt").readText()

        // Must pass error body from state.error.body
        assertTrue(source.contains("state.error.body"))

        // Must pass error detail from state.error.detail
        assertTrue(source.contains("state.error.detail"))

        // Must pass suggestions from state.suggestions
        assertTrue(source.contains("state.suggestions"))

        // Must pass onSuggestionTap callback
        assertTrue(source.contains("onSuggestionTap = { uiChip ->"))
    }

    /**
     * AC-1 continued — Verify chat input has recovery placeholder
     *
     * GIVEN: ErrorScreen composable
     * WHEN: Inspected
     * THEN: LSChatInput placeholder is "Try again, or let me know what to change…"
     */
    @Test
    fun ac1_chat_input_has_recovery_placeholder() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt").readText()

        // Must use recovery placeholder
        assertTrue(source.contains("Try again, or let me know what to change"))
    }

    /**
     * AC-2 — Suggestion chip callback
     *
     * GIVEN: Error screen rendered with ErrorMockProvider
     * WHEN: Developer taps a suggestion chip
     * THEN: onSuggestionTap(chip) fires exactly once with the tapped chip
     */
    @Test
    fun ac2_suggestion_chip_callback_wiring_is_correct() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt").readText()

        // Must pass onSuggestionTap to LSInlineErrorCallout
        assertTrue(source.contains("onSuggestionTap = { uiChip ->"))

        // Must map UI chips back to mock chips
        assertTrue(source.contains("state.suggestions.firstOrNull"))
        assertTrue(source.contains("onSuggestionTap(originalChip"))
    }

    /**
     * AC-3 — Trailing icon swap on input
     *
     * GIVEN: Chat input is empty
     * WHEN: Developer types into the input
     * THEN: Trailing slot swaps from sliders to send (matching Idle behavior)
     *
     * Note: The actual icon swap is handled by LSChatInput molecule.
     * This test verifies ErrorScreen properly wires the onValueChange callback
     * and manages input state via remember.
     */
    @Test
    fun ac3_trailing_icon_swap_callback_wiring_is_correct() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt").readText()

        // Must manage input state via remember
        assertTrue(source.contains("remember { mutableStateOf(\"\") }"))

        // Must pass value state to LSChatInput
        assertTrue(source.contains("value = inputValue"))

        // Must handle onValueChange callback
        assertTrue(source.contains("onValueChange = { newValue ->"))
    }

    /**
     * AC-4 — Light/dark token re-resolution
     *
     * GIVEN: Error screen rendered
     * WHEN: Theme is toggled between light and dark
     * THEN: Callout warn stripe, glass chrome, suggestion chips all re-resolve
     *
     * Note: Visual verification is done via sandbox stories with theme toggle.
     * This test verifies the composable uses theme tokens correctly.
     */
    @Test
    fun ac4_error_screen_uses_theme_tokens() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt").readText()

        // Must use LocalLaneShadowTheme
        assertTrue(source.contains("LocalLaneShadowTheme.current"))

        // LSInlineErrorCallout and LSChatInput already use theme tokens internally
        // This test verifies they're composed correctly
        assertTrue(source.contains("LSInlineErrorCallout("))
        assertTrue(source.contains("LSChatInput("))
    }

    /**
     * AC-5 — No data-fetching logic
     *
     * GIVEN: Source code for ErrorScreen.kt
     * WHEN: Inspected
     * THEN: Contains no Convex client, no networking, no repository
     *        — all data injected via ErrorMockProvider
     */
    @Test
    fun ac5_error_screen_has_no_data_fetching_dependencies() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt").readText()

        // Must NOT import Convex
        assertFalse(source.contains("import com.laneshadow.convex"))
        assertFalse(source.contains("import convex."))

        // Must NOT import networking libraries
        assertFalse(source.contains("import retrofit."))
        assertFalse(source.contains("import okhttp."))

        // Must NOT import repository classes
        assertFalse(source.contains("import com.laneshadow.data.repository"))
        assertFalse(source.contains("Repository"))

        // Must use mock provider types
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.ErrorScreenState"))
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.SuggestionChip"))
    }

    /**
     * Verify that ErrorMockProvider provides correct default state
     *
     * RED test: Calls ErrorMockProvider.value("default") to assert
     * the provider returns correct error body and suggestion chips
     */
    @Test
    fun error_mock_provider_default_state_is_correct() {
        val provider = com.laneshadow.sandbox.mockproviders.ErrorMockProvider
        val state = provider.value("default")

        // Verify error body matches spec
        assertEquals("Couldn't stitch that one together — the segment through Lucia looked broken.", state.error.body)

        // Verify error detail
        assertEquals("Try a different end point, or let me route you inland via Carmel Valley Rd instead?", state.error.detail)

        // Verify 2 suggestion chips (per spec S01)
        assertEquals(2, state.suggestions.size)
        assertEquals("Try inland", state.suggestions[0].label)
        assertEquals("End at Big Sur", state.suggestions[1].label)
    }

    /**
     * Verify that ErrorMockProvider provides error variants
     *
     * Tests network timeout, constraint impossible, and safety-gate variants
     */
    @Test
    fun error_mock_provider_provides_all_variants() {
        val provider = com.laneshadow.sandbox.mockproviders.ErrorMockProvider

        // Network timeout variant
        val networkState = provider.value("network")
        assertEquals("I lost the signal mid-thought. Let's try that again when you're back on data.", networkState.error.body)
        assertEquals("You're offline. Suggestions below are drawn from your last 14 days of rides.", networkState.error.detail)

        // Constraint impossible variant
        val impossibleState = provider.value("impossible")
        assertEquals("30 miles and no highways between here and Big Sur? The geography says no.", impossibleState.error.body)

        // Safety gate variant
        val safetyState = provider.value("safety-gate")
        assertEquals("Thunderstorm across the entire region. I won't plan a ride through that.", safetyState.error.body)
    }
}
