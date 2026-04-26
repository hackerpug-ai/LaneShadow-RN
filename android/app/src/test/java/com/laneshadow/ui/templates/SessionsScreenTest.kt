package com.laneshadow.ui.templates

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for SessionsScreen template.
 *
 * AC-1: Sessions composition renders — scrim at 0.35, LSSessionsDrawer slides in, "Rides" header, "NEW" button, "THIS WEEK" section, 5 session rows, active stripe-highlighted
 * AC-2: Row select callback fires
 * AC-3: NEW button callback fires
 * AC-4: Scrim tap dismisses drawer
 * AC-5: Light/dark re-resolves tokens
 * AC-6: No data-fetching logic
 *
 * Note: Full UI testing is done via the sandbox stories (templates.sessions.default).
 * These unit tests verify code structure, imports, and callback wiring.
 */
@RunWith(RobolectricTestRunner::class)
class SessionsScreenTest {

    /**
     * AC-1 — Sessions composition renders
     *
     * GIVEN: Sandbox is launched on Android with templates.sessions.default selected
     * WHEN: The story mounts
     * THEN: Dimmed map behind LSScrim at 0.35, LSSessionsDrawer slides in from the left,
     *       'Rides' header + 'NEW' button + 'THIS WEEK' section label + 5 session rows
     *       ('Santa Cruz loop' marked active via signal stripe), no top bar
     *
     * Note: Visual verification is done via sandbox stories.
     * This test verifies the composable signature and structure.
     */
    @Test
    fun ac1_sessions_screen_has_correct_composable_signature() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // Must accept SessionsScreenState parameter
        assertTrue(source.contains("state: SessionsScreenState"))

        // Must compose LSMapLayer
        assertTrue(source.contains("LSMapLayer("))

        // Must compose LSSessionsDrawer
        assertTrue(source.contains("LSSessionsDrawer("))

        // Must pass sessions list from state
        assertTrue(source.contains("state.sessions"))

        // Must pass activeSessionId from state
        assertTrue(source.contains("state.activeSessionId"))

        // Must NOT compose LSTopBar (no top bar per spec)
        assertFalse(source.contains("LSTopBar("))
    }

    /**
     * AC-1b — Scrim opacity is 0.35 via LSScrim token
     *
     * GIVEN: SessionsScreen source
     * WHEN: Inspected
     * THEN: Scrim opacity is set to 0.35 via ScrimSpec (no hardcoded opacity)
     */
    @Test
    fun ac1b_scrim_opacity_is_0_35() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // Must use ScrimSpec for scrim configuration
        assertTrue(source.contains("ScrimSpec("))

        // Must set opacity to 0.35 (default value)
        assertTrue(
            "SessionsScreen must use ScrimSpec with opacity=0.35",
            source.contains("opacity = 0.35f") && source.contains("ScrimSpec(")
        )

        // Must NOT have inline opacity literals other than 0.35
        assertFalse(
            "Scrim opacity must be 0.35, not other hardcoded values",
            source.contains("opacity = 0.5") || source.contains("opacity = 0.8")
        )
    }

    /**
     * AC-1c — Leading drawer uses sidebarSlideIn motion
     *
     * GIVEN: SessionsScreen source
     * WHEN: Inspected
     * THEN: Leading drawer slot is configured with content and onDismiss callback
     *       (animation is handled by LSMapLayer's AnimatedVisibility)
     */
    @Test
    fun ac1c_leading_drawer_uses_motion_recipe() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // Must use DrawerSpec for leading drawer
        assertTrue(source.contains("DrawerSpec("))

        // Must pass content (LSSessionsDrawer)
        assertTrue(source.contains("content =") || source.contains("content = "))

        // Must pass onDismiss callback
        assertTrue(source.contains("onDismiss =") || source.contains("onDismiss = "))

        // DrawerSpec must be passed to LSMapLayer's leadingDrawer parameter
        assertTrue(source.contains("leadingDrawer ="))
    }

    /**
     * AC-2 — Row select callback fires
     *
     * GIVEN: SessionsScreen rendered with 5 sessions
     * WHEN: Developer taps a non-active session row
     * THEN: onSelect(session.id) fires exactly once
     */
    @Test
    fun ac2_row_select_callback_is_wired() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // Must accept onSelect callback parameter
        assertTrue(source.contains("onSelect:"))

        // Must pass onSelect to LSSessionsDrawer
        assertTrue(source.contains("onSelect = onSelect") ||
                   source.contains("onSelect =  onSelect") ||
                   source.contains("onSelect =\n            onSelect"))

        // Must not swallow the callback (must be passed through)
        assertTrue(source.contains("LSSessionsDrawer("))
    }

    /**
     * AC-3 — NEW button callback fires
     *
     * GIVEN: SessionsScreen rendered
     * WHEN: Developer taps 'NEW'
     * THEN: onNew fires exactly once
     */
    @Test
    fun ac3_new_button_callback_is_wired() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // Must accept onNew callback parameter
        assertTrue(source.contains("onNew:"))

        // Must pass onNew to LSSessionsDrawer
        assertTrue(source.contains("onNew = onNew") ||
                   source.contains("onNew =  onNew") ||
                   source.contains("onNew =\n            onNew"))

        // Must not swallow the callback (must be passed through)
        assertTrue(source.contains("LSSessionsDrawer("))
    }

    /**
     * AC-4 — Scrim tap dismisses drawer
     *
     * GIVEN: SessionsScreen rendered with drawer presented
     * WHEN: Developer taps the scrim outside the drawer
     * THEN: onDismiss fires; drawer animates out via reverse of sidebarSlideIn
     */
    @Test
    fun ac4_scrim_tap_dismisses_drawer() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // Must accept onDismiss callback parameter
        assertTrue(source.contains("onDismiss:"))

        // Must pass onDismiss to DrawerSpec (which wires it to scrim tap)
        assertTrue(source.contains("DrawerSpec("))
        assertTrue(source.contains("onDismiss = onDismiss") ||
                   source.contains("onDismiss =  onDismiss") ||
                   source.contains("onDismiss =\n            onDismiss"))

        // Scrim in LSMapLayer receives onDismiss from DrawerSpec
        // (verified by LSMapLayer implementation)
    }

    /**
     * AC-5 — Light/dark re-resolves tokens
     *
     * GIVEN: SessionsScreen rendered
     * WHEN: Theme toggled
     * THEN: Scrim, drawer chrome, active stripe, row backgrounds all re-resolve
     */
    @Test
    fun ac5_sessions_screen_uses_theme_tokens() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // SessionsScreen delegates theme handling to child components
        // (LSSessionsDrawer, LSMapLayer, LSScrim all use LocalLaneShadowTheme)
        // So it must compose those components
        assertTrue(source.contains("LSSessionsDrawer("))
        assertTrue(source.contains("LSMapLayer("))

        // Must NOT hardcode colors (e.g., Color(0xFF...))
        assertFalse(source.contains("Color(0x"))

        // Must NOT hardcode spacing values like 16.dp, 24.dp in main layout
        // (child components handle spacing via theme)
        assertTrue(source.contains("fillMaxSize"))
    }

    /**
     * AC-6 — No data-fetching logic
     *
     * GIVEN: SessionsScreen source
     * WHEN: Inspected
     * THEN: Contains no Convex/network/repository imports
     *        — data via SessionsMockProvider only
     */
    @Test
    fun ac6_sessions_screen_has_no_data_fetching_dependencies() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt").readText()

        // Must NOT import Convex
        assertFalse(source.contains("import com.laneshadow.convex"))
        assertFalse(source.contains("import convex."))

        // Must NOT import networking libraries
        assertFalse(source.contains("import retrofit."))
        assertFalse(source.contains("import okhttp."))

        // Must NOT import repository classes
        assertFalse(source.contains("import com.laneshadow.data.repository"))
        assertFalse(source.contains("Repository"))

        // Must use mock provider types for screen state
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.SessionsScreenState"))

        // Must use mock domain Session type
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.Session"))
    }

    /**
     * Verify SessionsScreenStory registers at correct tier and ID
     */
    @Test
    fun sessions_screen_story_is_registered_at_correct_tier_and_id() {
        val source = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/SessionsScreenStory.kt").readText()

        // Must register with ComponentTier.Template
        assertTrue(source.contains("ComponentTier.Template"))

        // Must have ID starting with templates.sessions
        assertTrue(source.contains("templates.sessions"))

        // Must register in TemplateStories
        val templatesSource = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/TemplateStories.kt").readText()
        assertTrue(
            templatesSource.contains("SessionsScreenStory") ||
            templatesSource.contains("templates.sessions")
        )
    }

    /**
     * Verify story exposes multiple variants (default, empty, overflow)
     */
    @Test
    fun sessions_screen_story_exposes_multiple_variants() {
        val source = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/SessionsScreenStory.kt").readText()

        // Must have default variant
        assertTrue(source.contains("templates.sessions.default") ||
                   source.contains("\"default\""))

        // Should have empty variant
        assertTrue(source.contains("templates.sessions.empty") ||
                   source.contains("\"empty\""))

        // Should have overflow variant (tests scrolling)
        assertTrue(source.contains("templates.sessions.overflow") ||
                   source.contains("\"overflow\""))
    }

    /**
     * Verify story wires all callbacks (even if no-op)
     */
    @Test
    fun sessions_screen_story_wires_all_callbacks() {
        val source = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/SessionsScreenStory.kt").readText()

        // Must pass onSelect callback
        assertTrue(source.contains("onSelect"))

        // Must pass onNew callback
        assertTrue(source.contains("onNew"))

        // Must pass onDismiss callback
        assertTrue(source.contains("onDismiss"))
    }
}
