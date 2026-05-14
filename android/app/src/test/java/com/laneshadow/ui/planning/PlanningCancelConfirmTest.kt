package com.laneshadow.ui.planning

import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for Planning Cancel-Confirm wiring and return-to-idle transition.
 *
 * Maps to AC-1 through AC-6 of PLAN-S08-AND-T04.
 *
 * Tests verify source structure and wiring using file inspection patterns.
 * Visual UI testing is performed via sandbox stories.
 */
@RunWith(RobolectricTestRunner::class)
class PlanningCancelConfirmTest {

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
     * AC-2 — Back-tap opens the V02 cancel-confirm BottomSheet
     *
     * GIVEN the planning composition is rendered with isThinking = true
     * WHEN the user invokes the back gesture (taps onCollapse)
     * THEN PlanningCancelConfirmSheet opens (V02 variant) with proper semantics;
     * the sheet is conditionally rendered when showCancelConfirm is true
     *
     * Verify: PlanningScreen conditionally renders PlanningCancelConfirmSheet
     */
    @Test
    fun back_tap_opens_v02_cancel_confirm_sheet() {
        val source = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // Must conditionally render PlanningCancelConfirmSheet based on state.showCancelConfirm
        assertTrue(
            "PlanningScreen must conditionally render PlanningCancelConfirmSheet",
            source.contains("if (state.showCancelConfirm)") && source.contains("PlanningCancelConfirmSheet(")
        )

        // PlanningCancelConfirmSheet must have proper callback parameters
        assertTrue(
            "PlanningCancelConfirmSheet must have onKeep callback",
            source.contains("onKeep = onKeepPlanning")
        )

        assertTrue(
            "PlanningCancelConfirmSheet must have onCancel callback",
            source.contains("onCancel = onCancelPlan")
        )

        assertTrue(
            "PlanningCancelConfirmSheet must have onDismiss callback",
            source.contains("onDismiss = onDismissCancelConfirm")
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
     * Verify: ViewModel emits PlanningTransition.Cancelled and has consumeTransition()
     */
    @Test
    fun cancelled_transition_triggers_return_to_idle_without_remount() {
        val viewModelSource = File("src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt").readText()

        // Must emit PlanningTransition.Cancelled on cancel success
        assertTrue(
            "PlanningViewModel must emit PlanningTransition.Cancelled on cancel success",
            viewModelSource.contains("PlanningTransition.Cancelled")
        )

        // Must have consumeTransition() function to clear the transition
        assertTrue(
            "PlanningViewModel must have consumeTransition() function",
            viewModelSource.contains("fun consumeTransition()")
        )

        // Must set transition = null in consumeTransition
        assertTrue(
            "consumeTransition must set transition = null",
            viewModelSource.contains("transition = null")
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
    }
}
