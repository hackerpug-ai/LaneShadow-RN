import Testing
@testable import LaneShadow

/// Tests for canonical phase name taxonomy alignment.
///
/// Ensures iOS phase names match the server's canonical taxonomy:
/// - parsing (not "reading")
/// - searching (not "sketching")
/// - drafting (not "validating")
/// - enriching (not "weather")
/// - finalizing (not "building")
struct RideFlowPhaseTaxonomyTests {
    // MARK: - AC-1: Phase enum uses canonical cases

    @Test("test_phaseEnum_containsExactlyCanonicalCases")
    func phaseEnum_containsExactlyCanonicalCases() {
        // GIVEN: RideFlow phase enum exists

        // WHEN: The enum declaration is inspected

        // THEN: The cases are exactly: parsing, searching, drafting, enriching, finalizing
        // This test will fail until legacy names are purged from PlanningPhaseData usage

        // Verify that PlanningPhaseData.id uses canonical names
        // Check that no legacy phase IDs exist in the codebase

        let canonicalPhases = [
            "parsing",
            "searching",
            "drafting",
            "enriching",
            "finalizing",
        ]

        let legacyPhases = [
            "reading",
            "sketching",
            "validating",
            "weather",
            "building",
        ]

        // This test ensures PlanningMockProvider uses canonical phases
        let defaultState = PlanningMockProvider.value(variant: "default")
        let phaseIds = defaultState.phases.map(\.id)

        // All phase IDs should be canonical
        for phaseId in phaseIds {
            #expect(
                canonicalPhases.contains(phaseId),
                "Phase ID '\(phaseId)' should be canonical (one of: \(canonicalPhases))"
            )
        }

        // No phase IDs should be legacy
        for phaseId in phaseIds {
            #expect(
                !legacyPhases.contains(phaseId),
                "Phase ID '\(phaseId)' should not be a legacy name (legacy: \(legacyPhases))"
            )
        }

        // Verify we have exactly 5 phases
        #expect(phaseIds.count == 5, "Should have exactly 5 phases, got \(phaseIds.count)")
    }
}
