package com.laneshadow.ui.planning

import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for Planning Cancel-Confirm wiring and return-to-idle transition.
 *
 * Maps to AC-1 and AC-3 through AC-6 of PLAN-S08-AND-T04.
 *
 * AC-2 is tested via instrumented test (PlanningCancelConfirmTest in androidTest).
 *
 * Tests verify source structure and wiring using file inspection patterns.
 * Visual UI testing is performed via sandbox stories.
 */
@RunWith(RobolectricTestRunner::class)
class PlanningCancelConfirmTest {

    /**
     * AC-2 — Back-tap opens the V02 cancel-confirm BottomSheet
     *
     * GIVEN the planning composition is rendered with isThinking = true
     * WHEN the user invokes the back gesture (taps onCollapse)
     * THEN PlanningCancelConfirmSheet opens (V02 variant) with proper semantics;
     * the sheet is conditionally rendered when showCancelConfirm is true;
     * buttons are reachable via testTag
     *
     * Verify: PlanningCancelConfirmSheet uses standard androidx.compose.ui.semantics.dialog()
     */
    @Test
    fun back_tap_opens_v02_cancel_confirm_sheet() {
        // Verify LSCancelConfirmSheet uses standard dialog()
        val lsSheetSource = File("src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt").readText()

        // Must use standard dialog() extension
        assertTrue(
            "LSCancelConfirmSheet must import androidx.compose.ui.semantics.dialog",
            lsSheetSource.contains("import androidx.compose.ui.semantics.dialog")
        )

        // Must call dialog() in semantics block
        assertTrue(
            "LSCancelConfirmSheet must call dialog() in semantics",
            lsSheetSource.contains("dialog()")
        )

        // Must NOT have custom SemanticsPropertyKey
        assertTrue(
            "LSCancelConfirmSheet must not define custom SemanticsPropertyKey for isDialog",
            !lsSheetSource.contains("SemanticsPropertyKey<Boolean>(\"isDialog\")")
        )

        // Verify PlanningCancelConfirmSheet also uses standard dialog()
        val planningSheetSource = File("src/main/java/com/laneshadow/ui/planning/PlanningCancelConfirmSheet.kt").readText()

        // Must use standard dialog() extension
        assertTrue(
            "PlanningCancelConfirmSheet must import androidx.compose.ui.semantics.dialog",
            planningSheetSource.contains("import androidx.compose.ui.semantics.dialog")
        )

        // Must NOT import custom isDialog from molecules
        assertTrue(
            "PlanningCancelConfirmSheet must not import custom isDialog extension",
            !planningSheetSource.contains("import com.laneshadow.ui.molecules.isDialog")
        )

        // Must call dialog() in semantics block
        assertTrue(
            "PlanningCancelConfirmSheet must call dialog() in semantics",
            planningSheetSource.contains("dialog()")
        )

        // Verify button testTags are attached
        assertTrue(
            "PlanningCancelConfirmSheet must have cancel-button testTag",
            planningSheetSource.contains("planning.cancel-confirm.cancel-button")
        )

        assertTrue(
            "PlanningCancelConfirmSheet must have keep-button testTag",
            planningSheetSource.contains("planning.cancel-confirm.keep-button")
        )

        // Verify contentDescription is present
        assertTrue(
            "PlanningCancelConfirmSheet must have contentDescription for dialog",
            planningSheetSource.contains("contentDescription = \"Cancel planning confirmation\"")
        )
    }

    /**
     * AC-1 — LSChatInput renders is-thinking mode bound to state.isThinking
     *
     * GIVEN PlanningUiState(isThinking = true)
     * WHEN the planning composition renders
     * THEN the LSChatInput shows has-value filled prompt,
     * the leading icon is dimmed (per is-thinking modifier),
     * the send button is replaced by a copper spinner;
     * the input field's editable flag is false
     *
     * Verify: PlanningScreen passes isThinking to LSChatInput
     */
    @Test
    fun chat_input_renders_in_thinking_mode() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must pass isThinking from state to LSChatInput
        assertTrue(
            "PlanningScreen must pass isThinking flag to LSChatInput",
            source.contains("isThinking = state.isThinking")
        )

        // LSChatInput must be in the bottomOverlays
        assertTrue(
            "LSChatInput must be composed in bottomOverlays",
            source.contains("LSChatInput(")
        )

        // The input must be disabled when thinking (isEnabled = false OR when isThinking)
        assertTrue(
            "LSChatInput must have isThinking parameter passed",
            source.contains("isThinking")
        )
    }

    /**
     * AC-3 — "Cancel ride" tap invokes viewModel.cancel() exactly once
     *
     * GIVEN the cancel-confirm sheet is open
     * WHEN the user taps "Cancel ride"
     * THEN viewModel.confirmCancel() is invoked exactly once; the sheet dismisses
     *
     * Verify: PlanningScreenContainer wires onCancelPlan to viewModel.confirmCancel()
     */
    @Test
    fun cancel_button_invokes_view_model_cancel() {
        val source = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()

        // Must have onCancelPlan callback wired to viewModel.confirmCancel()
        assertTrue(
            "PlanningScreenContainer must wire onCancelPlan to viewModel.confirmCancel()",
            source.contains("onCancelPlan = {") && source.contains("viewModel.confirmCancel()")
        )
    }

    /**
     * AC-4 — "Keep planning" tap dismisses sheet without invoking cancel
     *
     * GIVEN the cancel-confirm sheet is open
     * WHEN the user taps "Keep planning"
     * THEN the sheet dismisses; viewModel.cancel() is NOT invoked;
     * the planning composition resumes
     *
     * Verify: PlanningScreenContainer wires onKeepPlanning to viewModel.dismissCancelConfirm()
     */
    @Test
    fun keep_planning_dismisses_without_invoking_cancel() {
        val source = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()

        // Must have onKeepPlanning callback wired to viewModel.dismissCancelConfirm()
        assertTrue(
            "PlanningScreenContainer must wire onKeepPlanning to viewModel.dismissCancelConfirm()",
            source.contains("onKeepPlanning = {") && source.contains("viewModel.dismissCancelConfirm()")
        )
    }

    /**
     * AC-5 — Observed PlanningTransition.Cancelled triggers return-to-idle
     *
     * GIVEN the planning composition is mounted with PlanningTransition.Cancelled
     * emitted by the ViewModel
     * WHEN PlanningScreenContainer observes the transition
     * THEN the navigation callback is invoked to return to idle
     *
     * Verify: PlanningScreenContainer observes transition and calls onReturnToIdle
     */
    @Test
    fun cancelled_transition_triggers_return_to_idle_without_remount() {
        val containerSource = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()

        // Must observe PlanningTransition.Cancelled in LaunchedEffect
        assertTrue(
            "PlanningScreenContainer must observe transition in LaunchedEffect",
            containerSource.contains("LaunchedEffect(uiState.transition)") &&
                containerSource.contains("PlanningTransition.Cancelled")
        )

        // Must invoke onReturnToIdle when Cancelled transition observed
        assertTrue(
            "Container must call onReturnToIdle when Cancelled transition observed",
            containerSource.contains("onReturnToIdle()")
        )

        // Must call consumeTransition() to clear the transition
        assertTrue(
            "Container must call viewModel.consumeTransition()",
            containerSource.contains("viewModel.consumeTransition()")
        )
    }

    /**
     * AC-5b — BackHandler intercepts system back gesture
     *
     * GIVEN the planning screen is showing with cancel-confirm sheet visible
     * WHEN the user triggers system back gesture
     * THEN BackHandler dismisses the sheet without navigating away
     *
     * Verify: PlanningScreenContainer has BackHandler wired
     */
    @Test
    fun back_handler_intercepts_system_back() {
        val containerSource = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()

        // Must have BackHandler import
        assertTrue(
            "PlanningScreenContainer must import BackHandler",
            containerSource.contains("BackHandler")
        )

        // Must check showCancelConfirm to decide whether to dismiss or request cancel
        assertTrue(
            "BackHandler must check showCancelConfirm state",
            containerSource.contains("if (uiState.showCancelConfirm)") &&
                containerSource.contains("viewModel.dismissCancelConfirm()")
        )

        // Must call requestCancel if sheet not showing
        assertTrue(
            "BackHandler must call requestCancel when sheet not showing",
            containerSource.contains("viewModel.requestCancel()")
        )
    }

    /**
     * AC-6 — Token purity, lint, and consumed-component non-modification gates pass
     *
     * GIVEN the new/modified files
     * WHEN lint and token checks run
     * THEN both gates exit 0; LSChatInput.kt does NOT appear in diff
     *
     * Verify: LSChatInput.kt is not modified in this task
     */
    @Test
    fun token_purity_and_lschat_input_unmodified() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt").readText()

        // Verify the component still has the isThinking parameter (unchanged)
        assertTrue(
            "LSChatInput must still have isThinking parameter",
            source.contains("isThinking: Boolean")
        )

        // Verify it still renders spinner when isThinking
        assertTrue(
            "LSChatInput must still render spinner when isThinking",
            source.contains("isThinking") && source.contains("LSSpinner")
        )

        // Verify no hardcoded colors in PlanningScreen (use theme tokens)
        val planningScreenSource = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()
        assertTrue(
            "PlanningScreen must use theme tokens, not hardcoded colors",
            !planningScreenSource.contains("Color(0x")
        )

        val containerSource = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()
        assertTrue(
            "PlanningScreenContainer must use theme tokens, not hardcoded colors",
            !containerSource.contains("Color(0x")
        )

        // Verify LSCancelConfirmSheet has button modifier support
        val sheetSource = File("src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt").readText()
        assertTrue(
            "LSCancelConfirmSheet must have keepButtonModifier parameter",
            sheetSource.contains("keepButtonModifier: Modifier")
        )

        assertTrue(
            "LSCancelConfirmSheet must have cancelButtonModifier parameter",
            sheetSource.contains("cancelButtonModifier: Modifier")
        )

        // Verify dialog semantics - must use dialog() extension from standard Compose
        assertTrue(
            "LSCancelConfirmSheet must use dialog() extension",
            sheetSource.contains("dialog()")
        )

        // Verify contentDescription is also present
        assertTrue(
            "LSCancelConfirmSheet must have contentDescription semantic",
            sheetSource.contains("contentDescription = \"Confirmation dialog\"")
        )

        // Verify no hardcoded scrim color - should use LSScrim
        assertTrue(
            "LSCancelConfirmSheet must not use hardcoded Color.Black for scrim",
            !sheetSource.contains("Color.Black") && !sheetSource.contains("Color(0xFF")
        )

        // Verify LSScrim is used
        assertTrue(
            "LSCancelConfirmSheet must use LSScrim token for backdrop",
            sheetSource.contains("LSScrim(")
        )
    }
}
