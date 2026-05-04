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

        let allCases = Phase.allCases

        #expect(allCases.count == 5, "Phase enum should have exactly 5 cases")

        let expectedRawValues = ["parsing", "searching", "drafting", "enriching", "finalizing"]

        for (index, phase) in allCases.enumerated() {
            #expect(
                phase.rawValue == expectedRawValues[index],
                "Phase case \(index) should have rawValue '\(expectedRawValues[index])', got '\(phase.rawValue)'"
            )
        }

        // Verify no legacy names exist
        let legacyNames = ["reading", "sketching", "validating", "weather", "building"]
        for phase in allCases {
            #expect(
                !legacyNames.contains(phase.rawValue),
                "Phase should not use legacy name '\(phase.rawValue)'"
            )
        }
    }

    // MARK: - AC-2: Label-to-phase mapping covers all 5 names

    @Test("test_labelMap_decodesAllFiveCanonicalLabels")
    func labelMap_decodesAllFiveCanonicalLabels() {
        // GIVEN: Backend status strings 'parsing','searching','drafting','enriching','finalizing'

        // WHEN: Each is decoded into the iOS phase enum

        // THEN: Each maps to the corresponding canonical case

        let canonicalLabels = ["parsing", "searching", "drafting", "enriching", "finalizing"]

        for label in canonicalLabels {
            let phase = Phase(fromStatus: label)
            #expect(phase != nil, "Label '\(label)' should decode to a Phase")
            #expect(phase?.rawValue == label, "Phase should have rawValue '\(label)'")
        }

        // Verify legacy labels don't decode
        let legacyLabels = ["reading", "sketching", "validating", "weather", "building"]
        for label in legacyLabels {
            let phase = Phase(fromStatus: label)
            #expect(phase == nil, "Legacy label '\(label)' should not decode to a Phase")
        }
    }
}
