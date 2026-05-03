package com.laneshadow.ui.sandbox

import com.google.common.truth.Truth.assertThat
import com.laneshadow.sandbox.mockproviders.PlanningMockProvider
import com.laneshadow.sandbox.mockproviders.PlanningScreenState
import org.junit.Test

/**
 * AC-4: MockProviders use canonical labels
 * GIVEN: MockProviders.kt sandbox fixtures are loaded
 * WHEN:  All phase-related mocks are inspected
 * THEN:  No mock string contains 'Sketching', 'Reading', 'Tracing', or any legacy label AND all phase mocks reference Phase enum cases
 */
class MockProvidersPhaseTest {

    @Test
    fun mock_providers_use_canonical_phase_labels() {
        // Get all variants
        val variants = PlanningMockProvider.variants

        // Check each variant for legacy phase labels
        variants.forEach { variant ->
            val state = PlanningMockProvider.value(variant)

            // Collect all phase IDs and labels
            val phaseIds = state.phases.map { it.id }
            val phaseLabels = state.phases.map { it.label }

            // Assert no legacy phase IDs
            val legacyIds = listOf("reading", "sketching", "validating", "weather", "building", "analyzing", "tracing")
            phaseIds.forEach { id ->
                assertThat(id.lowercase()).isNotIn(legacyIds)
            }

            // Assert no legacy phase labels (case-insensitive)
            val legacyLabelSubstrings = listOf(
                "reading your ride",
                "sketching roads",
                "checking they connect",
                "reading the sky",
                "ranking your options"
            )
            phaseLabels.forEach { label ->
                legacyLabelSubstrings.forEach { legacy ->
                    assertThat(label.lowercase()).doesNotContain(legacy)
                }
            }
        }
    }

    @Test
    fun mock_providers_contain_only_canonical_phase_ids() {
        // Get all variants
        val variants = PlanningMockProvider.variants

        // Define canonical phase IDs (lowercase)
        val canonicalIds = listOf("parsing", "searching", "drafting", "enriching", "finalizing")

        variants.forEach { variant ->
            val state = PlanningMockProvider.value(variant)

            // All phase IDs should be canonical
            state.phases.forEach { phase ->
                assertThat(phase.id.lowercase()).isIn(canonicalIds)
            }
        }
    }
}
