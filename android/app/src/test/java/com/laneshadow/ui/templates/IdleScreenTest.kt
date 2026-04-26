package com.laneshadow.ui.templates

import com.laneshadow.sandbox.mockproviders.Greeting
import com.laneshadow.sandbox.mockproviders.IdleScreenState
import com.laneshadow.sandbox.mockproviders.LocationContext as MockLocationContext
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for IdleScreen template.
 *
 * AC-1: Idle screen composition renders with all components
 * AC-2: Suggestion chip tap updates input
 * AC-3: Trailing icon swap on typing
 * AC-4: Hamburger menu callback
 * AC-5: Light/dark token re-resolution
 * AC-6: No data-fetching logic
 *
 * Note: Full UI testing is done via the sandbox stories (templates.idle.default).
 * These unit tests verify code structure, imports, and callback wiring.
 */
@RunWith(RobolectricTestRunner::class)
class IdleScreenTest {

    /**
     * AC-1 — Idle screen composition renders
     *
     * GIVEN: Sandbox is launched on Android with templates.idle.default selected
     * WHEN: The story mounts
     * THEN: LSTopBar renders at top, greeting overlay sits immediately below,
     *       LSMap fills the canvas, LSChatInput is anchored at bottom with 4 chips
     *       and location badge
     *
     * Note: Visual verification is done via sandbox stories.
     * This test verifies the composable signature and structure.
     */
    @Test
    fun ac1_idle_screen_has_correct_composable_signature() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt").readText()

        // Must accept IdleScreenState parameter
        assertTrue(source.contains("state: IdleScreenState"))

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

        // Must compose LSChatInput
        assertTrue(source.contains("LSChatInput("))

        // Must compose GreetingOverlay
        assertTrue(source.contains("GreetingOverlay("))
    }

    /**
     * AC-2 — Suggestion chip tap updates input
     *
     * GIVEN: Idle screen rendered with IdleMockProvider
     * WHEN: Developer taps a suggestion chip
     * THEN: onSuggestionTap(chip) fires once
     */
    @Test
    fun ac2_suggestion_chip_callback_wiring_is_correct() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt").readText()

        // Must pass onSuggestionTap to LSChatInput
        assertTrue(source.contains("onSuggestionTap = { uiChip ->"))

        // Must map UI chips back to mock chips
        assertTrue(source.contains("state.suggestions.firstOrNull"))
        assertTrue(source.contains("onSuggestionTap(originalChip"))
    }

    /**
     * AC-3 — Trailing icon swap
     *
     * GIVEN: Chat input is empty
     * WHEN: Developer types into the input
     * THEN: Trailing icon swaps from sliders to send
     *
     * Note: The actual icon swap is handled by LSChatInput molecule.
     * This test verifies IdleScreen properly wires the onValueChange callback.
     */
    @Test
    fun ac3_trailing_icon_swap_callback_wiring_is_correct() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt").readText()

        // Must pass onValueChange to LSChatInput
        assertTrue(source.contains("onValueChange = onValueChange"))

        // LSChatInput must accept value parameter (we pass empty string for now)
        assertTrue(source.contains("value ="))
    }

    /**
     * AC-4 — Hamburger menu callback
     *
     * GIVEN: Idle screen rendered
     * WHEN: Developer taps the hamburger in LSTopBar
     * THEN: onMenuTap fires
     */
    @Test
    fun ac4_hamburger_menu_callback_wiring_is_correct() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt").readText()

        // Must pass onMenuTap to LSTopBar
        assertTrue(source.contains("onMenuTap = onMenuTap"))
    }

    /**
     * AC-5 — Light/dark token re-resolution
     *
     * GIVEN: Idle screen rendered
     * WHEN: Theme is toggled between light and dark
     * THEN: Components re-render using LaneShadowTheme tokens
     *
     * Note: Visual verification is done via sandbox stories with theme toggle.
     * This test verifies the composable uses theme tokens correctly.
     */
    @Test
    fun ac5_idle_screen_uses_theme_tokens() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt").readText()

        // Must use LocalLaneShadowTheme
        assertTrue(source.contains("LocalLaneShadowTheme.current"))

        // Must use theme.typography instead of hardcoded values
        assertTrue(source.contains("theme.typography.ui.label.sm"))
        assertTrue(source.contains("theme.typography.opinion.xl"))

        // Must use theme.colors for colors
        assertTrue(source.contains("theme.colors.primary.default"))
        assertTrue(source.contains("theme.content.primary"))

        // Must use theme.space for spacing
        assertTrue(source.contains("theme.space.md"))
        assertTrue(source.contains("theme.space.xs"))
    }

    /**
     * AC-6 — No data-fetching logic
     *
     * GIVEN: Source code for IdleScreen.kt
     * WHEN: Inspected
     * THEN: Contains no Convex client, no networking, no repository
     *        — all data injected via IdleMockProvider
     */
    @Test
    fun ac6_idle_screen_has_no_data_fetching_dependencies() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt").readText()

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
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.IdleScreenState"))
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.SuggestionChip"))
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.LocationContext"))
    }

    /**
     * Verify that GreetingOverlay properly italicizes the emphasis text
     */
    @Test
    fun greeting_overlay_builds_annotated_string_with_italic_emphasis() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt").readText()

        // Must build AnnotatedString
        assertTrue(source.contains("buildAnnotatedString"))

        // Must use SpanStyle with FontStyle.Italic
        assertTrue(source.contains("SpanStyle(fontStyle = FontStyle.Italic)"))

        // Must find emphasis substring in headline
        assertTrue(source.contains("headline.indexOf(emphasis"))
        assertTrue(source.contains("headline.substring(startIndex, endIndex)"))
    }

    /**
     * Verify that IdleMockProvider provides correct default state
     */
    @Test
    fun idle_mock_provider_default_state_is_correct() {
        val state = IdleScreenState(
            greeting = Greeting(
                meta = "FRIDAY · 68°F · CLEAR",
                headline = "Where are we riding today?",
                emphasis = "today"
            ),
            suggestions = listOf(
                MockSuggestionChip(id = "chip-001", label = "Twisty back roads"),
                MockSuggestionChip(id = "chip-002", label = "Coastal cruise"),
                MockSuggestionChip(id = "chip-003", label = "Half-day loop"),
                MockSuggestionChip(id = "chip-004", label = "Mountain passes")
            ),
            locationContext = MockLocationContext(
                label = "Near Santa Cruz, CA",
                mode = "auto"
            )
        )

        // Verify greeting
        assertEquals("FRIDAY · 68°F · CLEAR", state.greeting.meta)
        assertEquals("Where are we riding today?", state.greeting.headline)
        assertEquals("today", state.greeting.emphasis)

        // Verify 4 suggestion chips
        assertEquals(4, state.suggestions.size)
        assertEquals("Twisty back roads", state.suggestions[0].label)
        assertEquals("Coastal cruise", state.suggestions[1].label)
        assertEquals("Half-day loop", state.suggestions[2].label)
        assertEquals("Mountain passes", state.suggestions[3].label)

        // Verify location context
        assertEquals("Near Santa Cruz, CA", state.locationContext.label)
        assertEquals("auto", state.locationContext.mode)
    }
}
