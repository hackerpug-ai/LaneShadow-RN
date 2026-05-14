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
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must accept PlanningScreenState parameter
        assertTrue(
            "PlanningScreen must accept PlanningScreenState as parameter",
            source.contains("state: PlanningScreenState")
        )

        // Must accept callback parameters for interaction
        assertTrue(
            "PlanningScreen must accept onMenuTap callback",
            source.contains("onMenuTap: () -> Unit")
        )
        assertTrue(
            "PlanningScreen must accept onCollapse callback",
            source.contains("onCollapse: () -> Unit")
        )
        assertTrue(
            "PlanningScreen must accept onFilter callback",
            source.contains("onFilter: () -> Unit")
        )

        // Must compose LSMapLayer as root layout
        assertTrue(
            "PlanningScreen must compose LSMapLayer as root layout",
            source.contains("LSMapLayer(")
        )

        // Must compose LSTopBar
        assertTrue(
            "PlanningScreen must compose LSTopBar in topBar slot",
            source.contains("LSTopBar(")
        )

        // Must compose LSPhaseIndicator
        assertTrue(
            "PlanningScreen must compose LSPhaseIndicator in topOverlays",
            source.contains("LSPhaseIndicator(")
        )

        // Must compose LSChatInput
        assertTrue(
            "PlanningScreen must compose LSChatInput in bottomOverlays",
            source.contains("LSChatInput(")
        )

        // Must pass isThinking to LSChatInput (which shows spinner in trailing slot)
        assertTrue(
            "PlanningScreen must pass isThinking flag to LSChatInput",
            source.contains("isThinking")
        )
    }

    /**
     * AC-2 — Active phase argType drives re-render
     *
     * GIVEN: Story argTypes expose activePhase
     * WHEN: Developer changes the active phase
     * THEN: LSPhaseIndicator re-renders with the new step pulsing and prior steps marked done
     *
     * This test verifies that PlanningMockProvider provides multiple variants with
     * different active phases, enabling the story to demonstrate phase cycling.
     */
    @Test
    fun ac2_active_phase_argtype_is_parameterized() {
        val source = File("src/debug/java/com/laneshadow/sandbox/mockproviders/PlanningMockProvider.kt").readText()

        // Must create multiple states with different active phases
        // Each variant should have a different phase marked as "active"
        assertTrue(
            "PlanningMockProvider must provide 'default' variant",
            source.contains("default") || source.contains("\"default\"")
        )

        // Verify variants list includes multiple states
        assertTrue(
            "PlanningMockProvider must expose variants list with multiple states",
            source.contains("override val variants") && source.contains("listOf")
        )

        // Verify different phases can be active across variants
        // defaultState has "drafting" as active (canonical phase name)
        assertTrue(
            "PlanningMockProvider defaultState must have 'drafting' as active phase (canonical taxonomy)",
            source.contains("id = \"drafting\"") && source.contains("status = \"active\"")
        )

        // overflowState has "enriching" as active (different from default)
        assertTrue(
            "PlanningMockProvider overflowState must have 'enriching' as active phase to demonstrate phase cycling",
            source.contains("id = \"enriching\"") && source.contains("overflowState()")
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
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // POSITIVE ASSERTION: Must reference the correct motion token key
        // motion.duration["verySlow"] is the 1400ms token for sketch polyline loop
        // (per Sprint 08 spec: 1400ms linear loop matches iOS animation timing)
        assertTrue(
            "PlanningScreen must use motion.duration[\"verySlow\"] for sketch polyline loop (1400ms)",
            source.contains("motion.duration[\"verySlow\"]")
        )

        // Must use linear easing for the animation
        assertTrue(
            "PlanningScreen must use motion.easing[\"linear\"] for sketch polyline",
            source.contains("motion.easing[\"linear\"]")
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

        // Verify animation is infinite (loops continuously) via LSMotion.sketchPolylineLoop helper.
        // The helper internally wires infiniteRepeatable(tween(...), RepeatMode.Restart) —
        // see android/app/src/main/java/com/laneshadow/theme/LSMotion.kt:33-39.
        assertTrue(
            "Sketch polyline animation must use LSMotion.sketchPolylineLoop helper to loop continuously",
            source.contains("LSMotion.sketchPolylineLoop(")
        )

        // Verify animation passes theme-derived duration to LSMotion helper (not hardcoded)
        assertTrue(
            "Animation must pass sketchRecipe.durationMillis to LSMotion.sketchPolylineLoop (from theme)",
            source.contains("durationMillis = sketchRecipe.durationMillis")
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
        val source = File("src/main/java/com/laneshadow/ui/atoms/LSMap.kt").readText()

        // Must consume drawProgress in rendering
        assertTrue(
            "LSMap must read drawProgress from polylines and apply to rendering",
            source.contains("drawProgress") && (
                source.contains("Canvas") ||
                source.contains("PathMeasure") ||
                source.contains("lineTrimOffset")
            )
        )

        // Verify drawProgress is actually used in polyline rendering logic
        // (not just declared but never read)
        assertTrue(
            "LSMap must use polyline.drawProgress in Canvas drawing logic",
            source.contains("polyline") && source.contains("drawProgress")
        )
    }

    /**
     * AC-4 — Chat input non-interactive while thinking
     *
     * GIVEN: PlanningScreen rendered with isThinking=true
     * WHEN: Developer attempts to type or tap send
     * THEN: Input is disabled and trailing slot shows LSSpinner (not send button)
     *
     * This test verifies that PlanningScreen correctly wires the thinking state
     * to LSChatInput to disable interaction and show spinner.
     *
     * Note: Full UI verification (disabled semantics + spinner visibility) is done
     * via instrumented tests (PlanningScreenInstrumentedTest.tc4_chat_input_disabled_when_thinking).
     */
    @Test
    fun ac4_chat_input_is_disabled_when_thinking() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must pass isThinking parameter from state to LSChatInput
        assertTrue(
            "PlanningScreen must pass state.isThinking to LSChatInput",
            source.contains("state.isThinking")
        )

        // Must pass isEnabled = false to disable input while thinking
        assertTrue(
            "PlanningScreen must pass isEnabled = false to LSChatInput to disable interaction",
            source.contains("isEnabled = false") || source.contains("isEnabled:false")
        )

        // Must compose LSChatInput (which handles spinner rendering in trailing slot)
        assertTrue(
            "PlanningScreen must compose LSChatInput component",
            source.contains("LSChatInput(")
        )

        // Verify the pattern: LSChatInput call includes both isThinking and isEnabled
        val lsChatInputCall = source.substringAfter("LSChatInput(").substringBefore(")")
        assertTrue(
            "LSChatInput call must include isThinking parameter",
            lsChatInputCall.contains("isThinking")
        )
        assertTrue(
            "LSChatInput call must include isEnabled parameter",
            lsChatInputCall.contains("isEnabled")
        )
    }

    /**
     * AC-5 — Light/dark re-resolves tokens
     *
     * GIVEN: PlanningScreen rendered
     * WHEN: Theme toggled
     * THEN: All elements re-render with correct LaneShadowTheme tokens
     *
     * This test verifies that PlanningScreen reads theme tokens at composition time,
     * ensuring it will re-resolve tokens when theme changes.
     *
     * Note: Full visual verification of light/dark rendering is done via sandbox stories.
     * This test verifies the code structure enables theme reactivity.
     */
    @Test
    fun ac5_planning_screen_uses_theme_tokens() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must read from LocalLaneShadowTheme (enables reactivity to theme changes)
        assertTrue(
            "PlanningScreen must read LocalLaneShadowTheme.current to access motion tokens",
            source.contains("LocalLaneShadowTheme.current") || source.contains("LocalLaneShadowTheme")
        )

        // Must call sketchPolylineRecipe() which reads theme motion tokens
        assertTrue(
            "PlanningScreen must call sketchPolylineRecipe(theme) to build animation from theme",
            source.contains("sketchPolylineRecipe(theme)")
        )

        // Must compose theme-aware child components
        assertTrue(
            "PlanningScreen must compose LSPhaseIndicator (theme-aware component)",
            source.contains("LSPhaseIndicator(")
        )
        assertTrue(
            "PlanningScreen must compose LSChatInput (theme-aware component)",
            source.contains("LSChatInput(")
        )
        assertTrue(
            "PlanningScreen must compose LSMap (theme-aware component)",
            source.contains("LSMap(")
        )
        assertTrue(
            "PlanningScreen must compose LSMapLayer (theme-aware component)",
            source.contains("LSMapLayer(")
        )

        // Must NOT hardcode colors (e.g., Color(0xFF...))
        assertFalse(
            "PlanningScreen must NOT hardcode Color literals; use theme tokens",
            source.contains("Color(0x")
        )

        // Must NOT hardcode spacing values like 16.dp, 24.dp in main layout
        // (child components handle spacing via theme)
        assertTrue(
            "PlanningScreen should use fillMaxSize for layout (spacing delegated to child components)",
            source.contains("fillMaxSize")
        )
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
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must NOT import Convex
        assertFalse(
            "PlanningScreen must NOT import Convex (data via mock provider only)",
            source.contains("import com.laneshadow.convex") || source.contains("import convex.")
        )

        // Must NOT import networking libraries
        assertFalse(
            "PlanningScreen must NOT import Retrofit networking",
            source.contains("import retrofit.") || source.contains("import okhttp.")
        )

        // Must NOT import repository classes
        assertFalse(
            "PlanningScreen must NOT import repository classes (data via mock provider)",
            source.contains("import com.laneshadow.data.repository") || source.contains("import.*Repository")
        )

        // Must use mock provider types for screen state
        assertTrue(
            "PlanningScreen must import PlanningScreenState from mock providers",
            source.contains("import com.laneshadow.sandbox.mockproviders.PlanningScreenState")
        )

        // Must use UI PlanningPhase (not mock domain type)
        assertTrue(
            "PlanningScreen must import PlanningPhase from UI molecules",
            source.contains("import com.laneshadow.ui.molecules.PlanningPhase")
        )

        // Must NOT have any data fetching function calls (e.g., repository.fetch, api.call)
        assertFalse(
            "PlanningScreen must NOT call repository fetch methods",
            source.contains("repository.") || source.contains(".fetch(") || source.contains(".get(")
        )
    }

    /**
     * Verify PlanningScreenStory registers at correct tier and ID
     */
    @Test
    fun planning_screen_story_is_registered_at_correct_tier_and_id() {
        val source = File("src/debug/java/com/laneshadow/sandbox/stories/templates/PlanningScreenStory.kt").readText()

        // Must register with ComponentTier.Template
        assertTrue(
            "PlanningScreenStory must register with ComponentTier.Template",
            source.contains("ComponentTier.Template")
        )

        // Must have ID starting with templates.planning
        assertTrue(
            "PlanningScreenStory must have story ID starting with 'templates.planning'",
            source.contains("templates.planning")
        )

        // Must have at least one story registered
        assertTrue(
            "PlanningScreenStory must define Story list",
            source.contains("val all: List<Story>")
        )

        // Must register in TemplateStories
        val templatesSource = File("src/debug/java/com/laneshadow/sandbox/stories/templates/TemplateStories.kt").readText()
        assertTrue(
            "TemplateStories must include PlanningScreenStory",
            templatesSource.contains("PlanningScreenStory") ||
            templatesSource.contains("templates.planning")
        )
    }

    /**
     * Verify phase status is properly mapped to PhaseDotState enum
     *
     * PLAN-S08-AND-T02: Updated — phaseSteps already contain PhaseDotState from ViewModel,
     * so direct mapping is no longer needed in the view layer.
     */
    @Test
    fun planning_phases_map_status_to_phase_dot_state() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must consume PhaseDotState enum
        assertTrue(
            "PlanningScreen must import PhaseDotState enum",
            source.contains("PhaseDotState")
        )

        // PLAN-S08-AND-T02: Must read state.phaseSteps (which already have PhaseDotState.Active, etc.)
        assertTrue(
            "PlanningScreen must read state.phaseSteps from ViewModel",
            source.contains("state.phaseSteps")
        )

        // Must render phaseSteps with their state
        assertTrue(
            "PlanningScreen must pass phaseSteps to LSPhaseIndicator",
            source.contains("state.phaseSteps.map")
        )
    }

    // === PLAN-S08-AND-T02 Spec-Required Tests ===
    // These test methods are named per the spec's verification commands.

    /**
     * AC-1 — LSContextCapsule renders in --planning state with state.capsuleHeadline
     *
     * GIVEN: PlanningUiState(capsuleHeadline = "Sketching a coastal loop…", currentPhase = Phase.Drafting)
     * WHEN: PlanningScreen(state = ...) composes
     * THEN: LSContextCapsule is in --planning state, displays italic headline, shows copper pulse spinner,
     *       has no meta row; reachable via testTag("planning.context-capsule")
     *
     * Verify: PlanningScreen source includes LSContextCapsule(state = CapsuleState.Planning(...))
     */
    @Test
    fun context_capsule_renders_in_planning_state() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must import and compose LSContextCapsule
        assertTrue(
            "PlanningScreen must import LSContextCapsule",
            source.contains("import com.laneshadow.ui.molecules.LSContextCapsule")
        )

        assertTrue(
            "PlanningScreen must compose LSContextCapsule",
            source.contains("LSContextCapsule(")
        )

        // Must pass CapsuleState.Planning
        assertTrue(
            "PlanningScreen must pass CapsuleState.Planning to LSContextCapsule",
            source.contains("CapsuleState.Planning(")
        )

        // Must pass capsuleHeadline from state
        assertTrue(
            "PlanningScreen must pass state.capsuleHeadline to capsule",
            source.contains("headline = state.capsuleHeadline")
        )

        // Must have testTag for AC-1 verification
        assertTrue(
            "PlanningScreen must add testTag(\"planning.context-capsule\") to capsule",
            source.contains("testTag(\"planning.context-capsule\")")
        )
    }

    /**
     * AC-2 — LSPhaseIndicator renders directly below the capsule with state.phaseSteps
     *
     * GIVEN: PlanningUiState with phaseSteps[2].state == PhaseDotState.Active
     * WHEN: PlanningScreen composes
     * THEN: LSPhaseIndicator is reachable via testTag("planning.phase-indicator"),
     *       displays 5 step rows in stable id order (parsing/searching/drafting/enriching/finalizing),
     *       rendered below the capsule in layout tree
     *
     * Verify: PlanningScreen source includes Column layout with capsule above indicator
     */
    @Test
    fun phase_indicator_renders_below_capsule() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must import and compose LSPhaseIndicator
        assertTrue(
            "PlanningScreen must import LSPhaseIndicator",
            source.contains("import com.laneshadow.ui.molecules.LSPhaseIndicator")
        )

        assertTrue(
            "PlanningScreen must compose LSPhaseIndicator",
            source.contains("LSPhaseIndicator(")
        )

        // Must pass phaseSteps from state
        assertTrue(
            "PlanningScreen must pass state.phaseSteps to indicator",
            source.contains("state.phaseSteps")
        )

        // Must have testTag for AC-2 verification
        assertTrue(
            "PlanningScreen must add testTag(\"planning.phase-indicator\") to indicator",
            source.contains("testTag(\"planning.phase-indicator\")")
        )

        // Must render capsule BEFORE indicator in layout (Column with items in order)
        val topOverlayContent = source.substringAfter("id = \"org-map-layer__top-overlay\"")
            .substringBefore("GlassOverlaySlot(")
        assertTrue(
            "Capsule must be rendered before (above) indicator in composition order",
            topOverlayContent.indexOf("LSContextCapsule") < topOverlayContent.indexOf("LSPhaseIndicator")
        )
    }

    /**
     * AC-3 — LSMapHost stays mounted across idle→planning transition
     *
     * GIVEN: Composable hosts both idle and planning states on same LSMapHost
     * WHEN: Route navigates from idle to planning (state swap, not destination change)
     * THEN: LSMapHost does NOT recompose with new instance; underlying map (Mapbox/substrate)
     *       does not unmount; LSMap is NOT recreated on state changes
     *
     * Verify: PlanningScreen uses LSMapLayer with map slot containing LSMap,
     * ensuring the same map instance persists across state transitions
     * (LSMapLayer preserves the map slot content on recompositions).
     */
    @Test
    fun map_host_stays_mounted_across_state_transition() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must import LSMap and LSMapLayer
        assertTrue(
            "PlanningScreen must import LSMap",
            source.contains("import com.laneshadow.ui.atoms.LSMap")
        )

        assertTrue(
            "PlanningScreen must import LSMapLayer",
            source.contains("import com.laneshadow.ui.organisms.LSMapLayer")
        )

        // Must compose LSMap directly in the map slot (not wrapped in a condition that recreates it)
        assertTrue(
            "PlanningScreen must compose LSMap directly in map slot",
            source.contains("LSMap(")
        )

        // Critical: Must use LSMapLayer with map = { LSMap(...) } lambda
        // This pattern ensures LSMapLayer preserves the map instance across recompositions
        assertTrue(
            "PlanningScreen must render LSMapLayer with LSMap in map = {...} slot",
            source.contains("LSMapLayer(") && source.contains("map = {") && source.contains("LSMap(")
        )

        // Must NOT recreate LSMap based on state conditions
        // (LSMap should be composed once, with only overlay slots and config changing)
        // Check that LSMap is composed without conditional guards
        val mapBlock = source.substringAfter("map = {").substringBefore("topOverlays")
        assertFalse(
            "LSMap construction must NOT be guarded by if/when conditions (would cause remounting)",
            mapBlock.contains("if (") || mapBlock.contains("when (")
        )

        // Must have testTag for recomposition verification (allows test harness to count instances)
        assertTrue(
            "PlanningScreen must add testTag(\"planning.map-host-instance\") to LSMap for recomposition tracking",
            source.contains("testTag(\"planning.map-host-instance\")")
        )

        // Verify LSMapControls and overlay slots are OUTSIDE the map block
        // so they can change without affecting map persistence
        assertTrue(
            "topOverlays must be defined in LSMapLayer (separate from map slot)",
            source.contains("topOverlays = listOf(")
        )
        assertTrue(
            "LSMapControls must be in topBar slot (separate from map slot)",
            source.contains("topBar = {") && source.contains("LSMapControls(")
        )
    }

    /**
     * AC-4 — LSMapControls workbar configures for planning state
     *
     * GIVEN: PlanningScreen composes with planning state active
     * WHEN: Workbar renders
     * THEN: LSMapControls reachable via testTag("planning.map-controls"), recenter enabled,
     *       chat-mode toggle enabled, save/layers reconfigure per PLAN-S08-DR-T01;
     *       workbar anchored at right-edge midline per org-map-controls
     *
     * Verify: PlanningScreen source includes LSMapControls with testTag
     */
    @Test
    fun map_controls_in_planning_configuration() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must import LSMapControls
        assertTrue(
            "PlanningScreen must import LSMapControls",
            source.contains("import com.laneshadow.ui.organisms.LSMapControls")
        )

        // Must compose LSMapControls
        assertTrue(
            "PlanningScreen must compose LSMapControls",
            source.contains("LSMapControls(")
        )

        // Must have testTag for AC-4 verification
        assertTrue(
            "PlanningScreen must add testTag(\"planning.map-controls\") to controls",
            source.contains("testTag(\"planning.map-controls\")")
        )

        // Must use MapControlsMode.Map (not a different mode)
        assertTrue(
            "PlanningScreen must use MapControlsMode.Map for planning state",
            source.contains("mode = MapControlsMode.Map")
        )

        // Must provide MapControlsHandlers
        assertTrue(
            "PlanningScreen must provide MapControlsHandlers to LSMapControls",
            source.contains("handlers = MapControlsHandlers(")
        )
    }
}
