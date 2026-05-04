import Testing
@testable import LaneShadow

/// Tests for MockProviders phase label canonicalization.
///
/// Verifies that sandbox mock data uses only canonical phase labels.
struct MockProvidersPhaseTests {
    // MARK: - AC-3: MockProviders use canonical labels

    @Test("test_mockProviders_emitOnlyCanonicalPhases")
    func mockProviders_emitOnlyCanonicalPhases() {
        // GIVEN: Sandbox MockProviders for planning flow

        // WHEN: Each provider's emitted phases are inspected

        // THEN: Every emitted phase label is from the canonical set

        let canonicalPhases = ["parsing", "searching", "drafting", "enriching", "finalizing"]
        let legacyPhases = ["reading", "sketching", "validating", "weather", "building"]

        // Test all PlanningMockProvider variants
        let variants = PlanningMockProvider.variants

        for variant in variants {
            let state = PlanningMockProvider.value(variant: variant)
            let phaseIds = state.phases.map(\.id)

            // All phase IDs should be canonical
            for phaseId in phaseIds {
                #expect(
                    canonicalPhases.contains(phaseId),
                    "Variant '\(variant)': Phase ID '\(phaseId)' should be canonical (one of: \(canonicalPhases))"
                )
            }

            // No phase IDs should be legacy
            for phaseId in phaseIds {
                #expect(
                    !legacyPhases.contains(phaseId),
                    "Variant '\(variant)': Phase ID '\(phaseId)' should not be a legacy name (legacy: \(legacyPhases))"
                )
            }
        }
    }
}
