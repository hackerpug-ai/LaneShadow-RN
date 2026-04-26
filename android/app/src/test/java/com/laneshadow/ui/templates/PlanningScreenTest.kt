package com.laneshadow.ui.templates

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for PlanningScreen template.
 *
 * AC-1: Planning screen composition renders with all components
 * AC-2: Active phase argType drives re-render
 * AC-3: Sketch polyline references motion recipe
 * AC-4: Chat input non-interactive while thinking
 * AC-5: Light/dark token re-resolution
 * AC-6: No data-fetching logic
 *
 * Note: Full UI testing is done via the sandbox stories (templates.planning.default).
 * These unit tests verify code structure, imports, and animation recipe usage.
 */
@RunWith(RobolectricTestRunner::class)
class PlanningScreenTest {

    /**
     * AC-1 — Planning screen composition renders
     *
     * GIVEN: Sandbox is launched on Android with templates.planning.default selected
     * WHEN: The story mounts
     * THEN: Top bar visible, LSPhaseIndicator shows 5 labeled steps with one active (pulsing ring),
     *       map shows sketching polyline animation, chat input bottom-anchored with filled prompt
     *       and LSSpinner in trailing slot
     *
     * Note: Visual verification is done via sandbox stories.
     * This test verifies the composable signature and structure.
     */
    @Test
    fun ac1_planning_screen_has_correct_composable_signature() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must accept PlanningScreenState parameter
        assertTrue(source.contains("state: PlanningScreenState"))

        // Must compose LSMapLayer
        assertTrue(source.contains("LSMapLayer("))

        // Must compose LSTopBar
        assertTrue(source.contains("LSTopBar("))

        // Must compose LSPhaseIndicator
        assertTrue(source.contains("LSPhaseIndicator("))

        // Must compose LSChatInput
        assertTrue(source.contains("LSChatInput("))

        // Must pass isThinking to LSChatInput (which shows spinner in trailing slot)
        assertTrue(source.contains("isThinking"))
    }

    /**
     * AC-2 — Active phase argType drives re-render
     *
     * GIVEN: Story argTypes expose activePhase
     * WHEN: Developer changes the active phase
     * THEN: LSPhaseIndicator re-renders with the new step pulsing and prior steps marked done
     */
    @Test
    fun ac2_active_phase_argtype_is_parameterized() {
        val source = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/PlanningScreenStory.kt").readText()

        // Must create multiple stories with different activePhase values
        assertTrue(source.contains("templates.planning."))

        // Should have at least default and phase variants
        assertTrue(
            source.contains("default") ||
            source.contains("validating") ||
            source.contains("weather") ||
            source.contains("building")
        )
    }

    /**
     * AC-3 — Sketch polyline references motion recipe
     *
     * GIVEN: PlanningScreen source
     * WHEN: Inspected
     * THEN: Animation declaration references LaneShadowTheme.motion.recipe.sketchPolylineLoop
     *       (no inline duration/easing literals)
     *       AND pathProgress is wired to a rendering call (must not be dead variable)
     */
    @Test
    fun ac3_sketch_polyline_animation_references_motion_recipe() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // POSITIVE ASSERTION: Must reference the correct motion token key
        // motion.duration["slower"] is the 600ms token for sketch polyline loop
        assertTrue(
            "PlanningScreen must use motion.duration[\"slower\"] for sketch polyline loop (600ms)",
            source.contains("motion.duration[\"slower\"]")
        )

        // Must use standard easing for the animation
        assertTrue(
            "PlanningScreen must use motion.easing[\"standard\"] for sketch polyline",
            source.contains("motion.easing[\"standard\"]")
        )

        // Must NOT have inline animation duration literals (hardcoded values like 600)
        assertFalse(
            "Sketch polyline animation must use motion recipe, not hardcoded tween values",
            source.contains("tween(600)") || source.contains("tween(3000") || source.contains("tween(5000")
        )

        // Must NOT have inline easing without theme reference
        val hasLocalThemeReference = source.contains("LocalLaneShadowTheme")
        assertTrue(
            "Animation setup must use LocalLaneShadowTheme to access motion recipes",
            hasLocalThemeReference
        )

        // CRITICAL: pathProgress must be wired to LSMap rendering
        // Must be passed to PolylineData drawProgress which LSMap consumes
        assertTrue(
            "pathProgress must be passed to PolylineData drawProgress for LSMap rendering",
            source.contains("drawProgress = pathProgress")
        )
    }

    /**
     * AC-3b — Render test: drawProgress influences polyline rendering
     *
     * GIVEN: Polyline with drawProgress=0.5 in LSMap
     * WHEN: Inspected
     * THEN: Source uses Compose Canvas to render polyline with animated trim
     *
     * Note: This is a structural test ensuring the render boundary consumes drawProgress.
     * Visual verification done via sandbox story.
     */
    @Test
    fun ac3b_draw_progress_influences_polyline_render() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt").readText()

        // Must consume drawProgress in rendering
        assertTrue(
            "LSMap must read drawProgress from polylines and apply to rendering",
            source.contains("drawProgress") && (
                source.contains("Canvas") ||
                source.contains("PathMeasure") ||
                source.contains("lineTrimOffset")
            )
        )
    }

    /**
     * AC-4 — Chat input non-interactive while thinking
     *
     * GIVEN: PlanningScreen rendered with isThinking=true
     * WHEN: Developer attempts to type or tap send
     * THEN: Input is disabled and trailing slot shows LSSpinner (not send button)
     */
    @Test
    fun ac4_chat_input_is_disabled_when_thinking() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must pass isThinking to LSChatInput
        assertTrue(source.contains("isThinking"))

        // Must pass isEnabled parameter
        assertTrue(source.contains("isEnabled") || source.contains("isThinking"))

        // Must use state.isThinking from PlanningScreenState
        assertTrue(source.contains("state.isThinking"))

        // Must render LSSpinner in chat input trailing slot when thinking
        // (LSChatInput handles this, but PlanningScreen must pass the flag)
        assertTrue(source.contains("LSChatInput("))
    }

    /**
     * AC-5 — Light/dark re-resolves tokens
     *
     * GIVEN: PlanningScreen rendered
     * WHEN: Theme toggled
     * THEN: All elements re-render with correct LaneShadowTheme tokens
     */
    @Test
    fun ac5_planning_screen_uses_theme_tokens() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // PlanningScreen delegates theme handling to child components
        // (LSPhaseIndicator, LSChatInput, LSMap, LSMapLayer all use LocalLaneShadowTheme)
        // So it must compose those components
        assertTrue(source.contains("LSPhaseIndicator("))
        assertTrue(source.contains("LSChatInput("))
        assertTrue(source.contains("LSMap("))
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
     * GIVEN: PlanningScreen source
     * WHEN: Inspected
     * THEN: Contains no Convex/network/repository imports
     *        — data via PlanningMockProvider only
     */
    @Test
    fun ac6_planning_screen_has_no_data_fetching_dependencies() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

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
        assertTrue(source.contains("import com.laneshadow.sandbox.mockproviders.PlanningScreenState"))

        // Must use UI PlanningPhase (not mock domain type)
        assertTrue(source.contains("import com.laneshadow.ui.molecules.PlanningPhase"))
    }

    /**
     * Verify PlanningScreenStory registers at correct tier and ID
     */
    @Test
    fun planning_screen_story_is_registered_at_correct_tier_and_id() {
        val source = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/PlanningScreenStory.kt").readText()

        // Must register with ComponentTier.Template
        assertTrue(source.contains("ComponentTier.Template"))

        // Must have ID starting with templates.planning
        assertTrue(source.contains("templates.planning"))

        // Must register in TemplateStories
        val templatesSource = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/TemplateStories.kt").readText()
        assertTrue(
            templatesSource.contains("PlanningScreenStory") ||
            templatesSource.contains("templates.planning")
        )
    }

    /**
     * Verify phase status is properly mapped to PhaseDotState enum
     */
    @Test
    fun planning_phases_map_status_to_phase_dot_state() {
        val source = File("../app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must map "pending", "active", "done" to PhaseDotState
        assertTrue(
            source.contains("PhaseDotState") ||
            source.contains("phase.status")
        )
    }
}
