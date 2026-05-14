package com.laneshadow.ui.planning

import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for PlanningScreenContainer.
 *
 * AC-5: Container injects ViewModel and binds state + cancel intent
 */
@RunWith(RobolectricTestRunner::class)
class PlanningScreenContainerTest {

    /**
     * AC-5 — PlanningScreenContainer injects ViewModel and binds state
     *
     * GIVEN: PlanningScreenContainer is composed inside the navigation graph
     * WHEN: The container resolves
     * THEN: PlanningViewModel is obtained via hiltViewModel with assisted factory;
     *       the resulting state is collected via collectAsStateWithLifecycle;
     *       onCancel callback wires to viewModel.requestCancel
     *
     * Verify: Container source references hiltViewModel, collectAsStateWithLifecycle,
     * and viewModel.requestCancel / viewModel.dismissCancelConfirm / viewModel.confirmCancel
     */
    @Test
    fun container_injects_view_model_and_binds_state() {
        val source = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()

        // AC-5: Must use hiltViewModel<PlanningViewModel, PlanningViewModel.Factory>
        assertTrue(
            "PlanningScreenContainer must use hiltViewModel with assisted factory",
            source.contains("hiltViewModel<PlanningViewModel, PlanningViewModel.Factory>")
        )

        // AC-5: Must pass creationCallback to factory
        assertTrue(
            "PlanningScreenContainer must pass creationCallback to hiltViewModel",
            source.contains("creationCallback")
        )

        // AC-5: Must collect state with collectAsStateWithLifecycle
        assertTrue(
            "PlanningScreenContainer must collect state via collectAsStateWithLifecycle",
            source.contains("collectAsStateWithLifecycle()")
        )

        // AC-5: Must wire onCollapse to requestCancel
        assertTrue(
            "PlanningScreenContainer must wire onCollapse to viewModel.requestCancel",
            source.contains("viewModel.requestCancel()")
        )

        // AC-5: Must wire dismissCancelConfirm
        assertTrue(
            "PlanningScreenContainer must wire dismissCancelConfirm to viewModel.dismissCancelConfirm",
            source.contains("viewModel.dismissCancelConfirm()")
        )

        // AC-5: Must wire confirmCancel
        assertTrue(
            "PlanningScreenContainer must wire confirmCancel to viewModel.confirmCancel",
            source.contains("viewModel.confirmCancel()")
        )

        // AC-5: Must pass state to PlanningScreen
        assertTrue(
            "PlanningScreenContainer must pass state to PlanningScreen",
            source.contains("PlanningScreen(") && source.contains("state = mockState")
        )

        // AC-5: Must compose PlanningScreen (not directly call LSMapLayer)
        assertTrue(
            "PlanningScreenContainer must compose PlanningScreen (not LSMapLayer directly)",
            source.contains("PlanningScreen(")
        )

        // AC-5: Must NOT import LSMapHost or LSMap directly
        // (these are managed by PlanningScreen, not the container)
        assertTrue(
            "PlanningScreenContainer must NOT directly import LSMapHost",
            !source.contains("import.*LSMapHost") && !source.contains("LSMapHost(")
        )
    }

    /**
     * Verify container uses toMockState conversion (from PlanningRoute.kt)
     */
    @Test
    fun container_uses_to_mock_state_conversion() {
        val source = File("src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt").readText()
        val routeSource = File("src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt").readText()

        // Must call toMockState to convert ViewModel state
        assertTrue(
            "PlanningScreenContainer must call toMockState to convert state",
            source.contains("toMockState()")
        )

        // toMockState must exist in PlanningRoute
        assertTrue(
            "toMockState must exist in PlanningRoute.kt",
            routeSource.contains("fun PlanningUiState.toMockState()")
        )

        // Must return MockPlanningScreenState
        assertTrue(
            "toMockState must return PlanningScreenState from route file",
            routeSource.contains("PlanningScreenState(")
        )

        // Must map capsuleHeadline, phaseSteps, headerLabel
        assertTrue(
            "toMockState must map capsuleHeadline, phaseSteps, headerLabel from ViewModel state",
            routeSource.contains("capsuleHeadline = capsuleHeadline") &&
            routeSource.contains("phaseSteps = phaseSteps") &&
            routeSource.contains("headerLabel = headerLabel")
        )
    }
}
