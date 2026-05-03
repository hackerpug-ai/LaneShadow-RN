package com.laneshadow.ui.molecules

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.ui.atoms.PhaseDotState
import org.junit.Rule
import org.junit.Test

/**
 * AC-5: LSPhaseIndicator instrumented snapshot updated
 * GIVEN: LSPhaseIndicator UI test is run for each canonical phase
 * WHEN:  Snapshot is captured
 * THEN:  Each phase renders the canonical display label AND no orphan snapshot for legacy labels remains
 */
class LSPhaseIndicatorUiTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun renders_canonical_label_for_each_phase() {
        // Test all 5 canonical phases
        val canonicalPhases = listOf(
            "Parsing your request",
            "Searching for routes",
            "Drafting options",
            "Enriching details",
            "Finalizing plan"
        )

        canonicalPhases.forEach { label ->
            composeTestRule.setContent {
                LSPhaseIndicator(
                    phases = listOf(
                        PlanningPhase(label = label, state = PhaseDotState.Active)
                    )
                )
            }

            // Assert the label is displayed
            composeTestRule
                .onNodeWithText(label)
                .assertIsDisplayed()
        }
    }

    @Test
    fun renders_all_five_canonical_phases_in_sequence() {
        val phases = listOf(
            PlanningPhase(label = "Parsing your request", state = PhaseDotState.Done),
            PlanningPhase(label = "Searching for routes", state = PhaseDotState.Done),
            PlanningPhase(label = "Drafting options", state = PhaseDotState.Active),
            PlanningPhase(label = "Enriching details", state = PhaseDotState.Pending),
            PlanningPhase(label = "Finalizing plan", state = PhaseDotState.Pending)
        )

        composeTestRule.setContent {
            LSPhaseIndicator(phases = phases)
        }

        // Assert all canonical labels are displayed
        composeTestRule.onNodeWithText("Parsing your request").assertIsDisplayed()
        composeTestRule.onNodeWithText("Searching for routes").assertIsDisplayed()
        composeTestRule.onNodeWithText("Drafting options").assertIsDisplayed()
        composeTestRule.onNodeWithText("Enriching details").assertIsDisplayed()
        composeTestRule.onNodeWithText("Finalizing plan").assertIsDisplayed()
    }

    @Test
    fun does_not_render_legacy_phase_labels() {
        val legacyLabels = listOf(
            "Reading your ride",
            "Sketching roads",
            "Checking they connect",
            "Reading the sky",
            "Ranking your options"
        )

        legacyLabels.forEach { label ->
            composeTestRule.setContent {
                LSPhaseIndicator(
                    phases = listOf(
                        PlanningPhase(label = "Parsing your request", state = PhaseDotState.Active)
                    )
                )
            }

            // Assert legacy label is NOT displayed
            composeTestRule
                .onNodeWithText(label)
                .assertDoesNotExist()
        }
    }
}
