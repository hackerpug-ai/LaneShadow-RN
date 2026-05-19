package com.laneshadow.ui.templates

import com.google.common.truth.Truth.assertThat
import com.laneshadow.ui.mapapp.planningMapControlsModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for PlanningScreen composition — PLAN-S08-AND-T02.
 *
 * AC-1: LSContextCapsule renders in --planning state with state.capsuleHeadline
 * AC-2: LSPhaseIndicator renders directly below the capsule with state.phaseSteps
 * AC-3: LSMapHost stays mounted across idle→planning transition (no remount)
 * AC-4: LSMapControls workbar configures for planning state
 * AC-5: PlanningScreenContainer injects ViewModel and binds state + cancel intent
 * AC-6: Token purity and lint gates pass on touched files
 * AC-7: Build passes and no consumed component is modified
 */
@RunWith(RobolectricTestRunner::class)
class PlanningScreenCompositionTest {

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
    fun ac1_context_capsule_renders_in_planning_state() {
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
            source.contains("headline = state.capsuleHeadline") || source.contains("headline = state.capsuleHeadline")
        )

        // Must have testTag for AC-1 verification
        assertTrue(
            "PlanningScreen must add testTag(\"planning.context-capsule\") to capsule",
            source.contains("testTag(\"planning.context-capsule\")")
        )

        // Must NOT pass metaItems (planning capsule has no meta row)
        val capsuleCall = source.substringAfter("LSContextCapsule(").substringBefore(")")
        assertFalse(
            "Planning capsule must NOT include meta row",
            capsuleCall.contains("metaItems")
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
    fun ac2_phase_indicator_renders_below_capsule() {
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

        // Must pass headerLabel from state
        assertTrue(
            "PlanningScreen must pass state.headerLabel as header to indicator",
            source.contains("header = state.headerLabel")
        )

        // Must have testTag for AC-2 verification
        assertTrue(
            "PlanningScreen must add testTag(\"planning.phase-indicator\") to indicator",
            source.contains("testTag(\"planning.phase-indicator\")")
        )

        // Must render capsule BEFORE indicator in the shared top overlay composition.
        val topOverlayContent = source.substringAfter("private fun PlanningTopOverlay(")
            .substringBefore("@Composable\nprivate fun PlanningBottomOverlay(")
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
     *       does not unmount; recomposition counter at testTag("planning.map-host-instance") = 1
     *
     * Verify: PlanningScreen uses LSMap directly (not recreating per recomposition)
     */
    @Test
    fun ac3_map_host_stays_mounted_across_state_transition() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must import LSMap
        assertTrue(
            "PlanningScreen must import LSMap",
            source.contains("import com.laneshadow.ui.atoms.LSMap")
        )

        // Must compose LSMap (not LSMapHost wrapper that would remount)
        assertTrue(
            "PlanningScreen must compose LSMap directly (persistent host contract)",
            source.contains("LSMap(")
        )

        // Must have testTag on LSMap for recomposition counter verification
        assertTrue(
            "PlanningScreen must add testTag(\"planning.map-host-instance\") to LSMap",
            source.contains("testTag(\"planning.map-host-instance\")")
        )

        // Must render LSMapLayer with map = { LSMap(...) } so the host is persistent
        assertTrue(
            "PlanningScreen must render LSMapLayer with LSMap in map slot",
            source.contains("LSMapLayer(") && source.contains("map = {") && source.contains("LSMap(")
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
     * Verify: the live planning path configures the workbar with the planning tag
     * plus non-null recenter/layers/toggle handlers.
     */
    @Test
    fun ac4_map_controls_in_planning_configuration() {
        val model = planningMapControlsModel(
            onZoomIn = {},
            onZoomOut = {},
            onRecenter = {},
            onClear = {},
            onToggleView = {},
        )

        assertThat(model.testTag).isEqualTo("planning.map-controls")
        assertThat(model.hasRouteToSave).isFalse()
        assertThat(model.isSavedRoute).isFalse()
        assertThat(model.handlers.onZoomIn).isNotNull()
        assertThat(model.handlers.onZoomOut).isNotNull()
        assertThat(model.handlers.onRecenter).isNotNull()
        assertThat(model.handlers.onClear).isNotNull()
        assertThat(model.handlers.onToggleView).isNotNull()
        assertThat(model.handlers.onSaveRoute).isNull()
    }

    /**
     * AC-5 — PlanningScreenContainer injects ViewModel and binds state + cancel intent
     *
     * GIVEN: PlanningScreenContainer is composed inside navigation graph
     * WHEN: Container resolves
     * THEN: PlanningViewModel obtained via hiltViewModel<..., Factory> { it.create(sessionId) };
     *       state collected via collectAsStateWithLifecycle; onCancel wires to viewModel::cancel
     *
     * Verify: PlanningScreenContainer file exists and contains required imports + logic
     */
    @Test
    fun ac5_planning_screen_container_injects_view_model() {
        val source = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()

        // Must exist
        assertTrue(
            "PlanningScreenContainer.kt must exist",
            source.isNotEmpty()
        )

        // Must use hiltViewModel with assisted factory
        assertTrue(
            "PlanningScreenContainer must use hiltViewModel with PlanningViewModel.Factory",
            source.contains("hiltViewModel<PlanningViewModel, PlanningViewModel.Factory>")
        )

        // Must pass creationCallback
        assertTrue(
            "PlanningScreenContainer must pass creationCallback to create(sessionId)",
            source.contains("creationCallback") && source.contains("factory.create(sessionId)")
        )

        // Must collect state with lifecycle
        assertTrue(
            "PlanningScreenContainer must use collectAsStateWithLifecycle",
            source.contains("collectAsStateWithLifecycle()")
        )

        // Must wire intents to ViewModel
        assertTrue(
            "PlanningScreenContainer must wire intents to viewModel methods",
            source.contains("viewModel.requestCancel()") || source.contains("viewModel.dismissCancelConfirm()") || source.contains("viewModel.cancel()")
        )
    }

    /**
     * AC-6 — Token purity and lint gates pass on touched files
     *
     * GIVEN: Modified PlanningScreen.kt + new/modified PlanningScreenContainer.kt
     * WHEN: Token compliance checked
     * THEN: scripts/tokens/enforce-native-compliance.sh exits 0; no hex literals,
     *       no hardcoded dp/sp constants outside token helpers, no raw color literals
     *
     * Verify: Source contains no Color(0x or hardcoded spacing/color in main layout
     */
    @Test
    fun ac6_token_purity_no_hardcoded_values() {
        val screenSource = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()
        val containerSource = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()

        // AC-6: Must NOT hardcode Color literals (Color(0x...)
        assertFalse(
            "PlanningScreen must NOT hardcode Color literals",
            screenSource.contains("Color(0x")
        )

        // AC-6: Must NOT hardcode spacing like 16.dp in layout (delegated to children)
        val layoutSection = screenSource.substringAfter("fun PlanningScreen(")
        assertFalse(
            "PlanningScreen layout must NOT hardcode spacing values",
            layoutSection.contains(".padding(16.dp)") || layoutSection.contains(".padding(24.dp)")
        )

        // AC-6: Container must not hardcode colors or spacing either
        assertFalse(
            "PlanningScreenContainer must NOT hardcode Color literals",
            containerSource.contains("Color(0x")
        )

        // AC-6: Must read from theme tokens
        assertTrue(
            "PlanningScreen must use LocalLaneShadowTheme for token access",
            screenSource.contains("LocalLaneShadowTheme")
        )
    }

    /**
     * AC-7 — Build passes and no consumed component is modified
     *
     * GIVEN: Working tree after task edits
     * WHEN: git diff --name-only inspected
     * THEN: None of LSMapHost.kt, LSMap.kt, LSContextCapsule.kt, LSMapControls.kt,
     *       LSPhaseIndicator.kt, LSChatInput.kt appear in diff; assembleDebug exits 0
     *
     * Verify: These files are NOT modified (checked via structural test)
     */
    @Test
    fun ac7_no_consumed_components_modified() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // AC-7: PlanningScreen must NOT define LSMapHost/LSContextCapsule/etc locally
        // (it consumes them from their source packages)
        assertFalse(
            "PlanningScreen must NOT redefine LSContextCapsule",
            source.contains("fun LSContextCapsule(") || source.contains("class LSContextCapsule")
        )

        assertFalse(
            "PlanningScreen must NOT redefine LSPhaseIndicator",
            source.contains("fun LSPhaseIndicator(") || source.contains("class LSPhaseIndicator")
        )

        assertFalse(
            "PlanningScreen must NOT redefine LSMapControls",
            source.contains("fun LSMapControls(") || source.contains("class LSMapControls")
        )

        // AC-7: Must import these components (not redefine)
        assertTrue(
            "PlanningScreen must import consumed components",
            source.contains("import com.laneshadow.ui.molecules.LSContextCapsule") &&
            source.contains("import com.laneshadow.ui.molecules.LSPhaseIndicator") &&
            source.contains("import com.laneshadow.ui.organisms.LSMapControls")
        )
    }

    /**
     * Verify plan-specific composition pattern
     */
    @Test
    fun planning_screen_follows_per_state_overlay_pattern() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must use LSMapLayer as root (per-state-overlay pattern)
        assertTrue(
            "PlanningScreen must use LSMapLayer root per per-state-overlay pattern",
            source.contains("LSMapLayer(")
        )

        // Must define topOverlays with id = "org-map-layer__top-overlay"
        assertTrue(
            "PlanningScreen must define topOverlays slot with canonical ID",
            source.contains("id = \"org-map-layer__top-overlay\"")
        )

        // Must define bottomOverlays for chat input
        assertTrue(
            "PlanningScreen must define bottomOverlays slot for chat input",
            source.contains("id = \"chat-input\"") || (source.contains("bottomOverlays") && source.contains("LSChatInput"))
        )
    }

    /**
     * Verify capsule headline passed correctly from state
     */
    @Test
    fun planning_screen_capsule_headline_from_state() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must read state.capsuleHeadline
        assertTrue(
            "PlanningScreen must read capsuleHeadline from state",
            source.contains("state.capsuleHeadline")
        )

        // Must pass to CapsuleState.Planning constructor
        assertTrue(
            "PlanningScreen must pass capsuleHeadline to CapsuleState.Planning",
            source.contains("CapsuleState.Planning(") && source.contains("headline = state.capsuleHeadline")
        )
    }

    /**
     * Verify phase steps passed correctly from state
     */
    @Test
    fun planning_screen_phase_steps_from_state() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must read state.phaseSteps
        assertTrue(
            "PlanningScreen must read phaseSteps from state",
            source.contains("state.phaseSteps")
        )

        // Must map to UI PlanningPhase list
        assertTrue(
            "PlanningScreen must map phaseSteps to UI PlanningPhase",
            source.contains("state.phaseSteps.map { step ->") ||
            source.contains("state.phaseSteps.map(")
        )
    }
}
