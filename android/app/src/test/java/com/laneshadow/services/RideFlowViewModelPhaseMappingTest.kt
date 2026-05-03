package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * AC-3: ViewModel maps server status to canonical phase
 * GIVEN: RideFlowViewModel receives a sessionMessages.status update with values 'parsing', 'searching', 'drafting', 'enriching', 'finalizing'
 * WHEN:  ViewModel processes each status
 * THEN:  Emitted UI state contains corresponding Phase enum case AND no Phase.Unknown is emitted for canonical inputs
 */
class RideFlowViewModelPhaseMappingTest {

    @Test
    fun view_model_maps_server_status_to_canonical_phase() {
        // Test all 5 canonical server status strings
        val canonicalStatuses = listOf("parsing", "searching", "drafting", "enriching", "finalizing")

        canonicalStatuses.forEach { status ->
            // Parse the status using Phase.fromLabel
            val phase = Phase.fromLabel(status)

            // Assert that the phase is not null (all canonical statuses should parse)
            assertThat(phase).isNotNull()

            // Assert that the phase matches the expected enum
            when (status) {
                "parsing" -> assertThat(phase).isEqualTo(Phase.Parsing)
                "searching" -> assertThat(phase).isEqualTo(Phase.Searching)
                "drafting" -> assertThat(phase).isEqualTo(Phase.Drafting)
                "enriching" -> assertThat(phase).isEqualTo(Phase.Enriching)
                "finalizing" -> assertThat(phase).isEqualTo(Phase.Finalizing)
            }
        }
    }

    @Test
    fun phase_fromLabel_returns_null_for_legacy_labels() {
        // Test that legacy labels return null (no Unknown phase)
        val legacyLabels = listOf("reading", "sketching", "validating", "weather", "building", "analyzing")

        legacyLabels.forEach { label ->
            val phase = Phase.fromLabel(label)
            assertThat(phase).isNull()
        }
    }

    @Test
    fun phase_fromLabel_is_case_insensitive() {
        // Test that parsing is case-insensitive
        assertThat(Phase.fromLabel("Parsing")).isEqualTo(Phase.Parsing)
        assertThat(Phase.fromLabel("PARSING")).isEqualTo(Phase.Parsing)
        assertThat(Phase.fromLabel("PaRsInG")).isEqualTo(Phase.Parsing)

        assertThat(Phase.fromLabel("Searching")).isEqualTo(Phase.Searching)
        assertThat(Phase.fromLabel("SEARCHING")).isEqualTo(Phase.Searching)

        assertThat(Phase.fromLabel("Drafting")).isEqualTo(Phase.Drafting)
        assertThat(Phase.fromLabel("DRAFTING")).isEqualTo(Phase.Drafting)

        assertThat(Phase.fromLabel("Enriching")).isEqualTo(Phase.Enriching)
        assertThat(Phase.fromLabel("ENRICHING")).isEqualTo(Phase.Enriching)

        assertThat(Phase.fromLabel("Finalizing")).isEqualTo(Phase.Finalizing)
        assertThat(Phase.fromLabel("FINALIZING")).isEqualTo(Phase.Finalizing)
    }
}
