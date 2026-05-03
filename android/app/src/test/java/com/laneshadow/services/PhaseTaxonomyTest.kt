package com.laneshadow.services

import org.junit.Test
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals
import com.google.common.truth.Truth.assertThat

/**
 * AC-1: Phase enum has canonical cases only [PRIMARY]
 * GIVEN: RideFlowState.kt is loaded
 * WHEN:  Phase enum values are inspected
 * THEN:  Enum contains exactly Parsing, Searching, Drafting, Enriching, Finalizing AND no legacy cases (Sketching, Reading, etc.)
 */
class PhaseTaxonomyTest {

    @Test
    fun phase_enum_contains_only_canonical_cases() {
        // Get all enum values
        val allPhases = Phase.entries

        // Extract phase names
        val phaseNames = allPhases.map { it.name }.toSet()

        // Assert canonical cases exist
        assertThat(phaseNames).containsAtLeast(
            "Parsing",
            "Searching",
            "Drafting",
            "Enriching",
            "Finalizing"
        )

        // Assert no legacy cases
        val legacyNames = listOf("Reading", "Sketching", "Validating", "Weather", "Building", "Analyzing")
        assertThat(phaseNames).containsNoneIn(legacyNames)

        // Assert exactly 5 cases
        assertThat(allPhases).hasSize(5)
    }

    /**
     * AC-2: Label-to-phase map covers all 5 names
     * GIVEN: PhaseLabels map is loaded
     * WHEN:  Map keys are inspected
     * THEN:  Map contains exactly the strings 'parsing', 'searching', 'drafting', 'enriching', 'finalizing' (lowercase) AND each maps to the corresponding Phase enum
     */
    @Test
    fun label_map_covers_all_canonical_names() {
        // Get the label map
        val labelMap = Phase.LabelMap

        // Assert all 5 canonical names exist (lowercase)
        val canonicalLabels = listOf("parsing", "searching", "drafting", "enriching", "finalizing")
        assertThat(labelMap.keys).containsAtLeastElementsIn(canonicalLabels)

        // Assert each maps to the correct Phase enum
        assertEquals(Phase.Parsing, labelMap["parsing"])
        assertEquals(Phase.Searching, labelMap["searching"])
        assertEquals(Phase.Drafting, labelMap["drafting"])
        assertEquals(Phase.Enriching, labelMap["enriching"])
        assertEquals(Phase.Finalizing, labelMap["finalizing"])

        // Assert no legacy labels exist
        val legacyLabels = listOf("reading", "sketching", "validating", "weather", "building", "analyzing")
        assertThat(labelMap.keys).containsNoneIn(legacyLabels)

        // Assert exactly 5 entries
        assertThat(labelMap).hasSize(5)
    }
}
