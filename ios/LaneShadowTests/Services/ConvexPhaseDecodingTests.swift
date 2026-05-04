import Testing
@testable import LaneShadow

/// Tests for Convex backend status string decoding to Phase enum.
///
/// Verifies that backend status strings are correctly decoded to the canonical Phase enum values.
struct ConvexPhaseDecodingTests {
    // MARK: - AC-5: Backend status string mapping verified

    @Test("test_convexStatus_decodesToCanonicalPhase")
    func convexStatus_decodesToCanonicalPhase() throws {
        // GIVEN: Convex sessionMessages status field as exposed in ConvexClient+LaneShadow

        // WHEN: A representative payload for each status is decoded

        // THEN: Decoder returns the matching iOS canonical phase enum value

        // Test JSON decoding for each canonical phase
        let canonicalPhases = ["parsing", "searching", "drafting", "enriching", "finalizing"]

        for phaseString in canonicalPhases {
            let jsonString = """
            {
                "_id": "test-plan-123",
                "status": "in_progress",
                "statusMessage": "Planning",
                "phase": "\(phaseString)",
                "result": null,
                "errorMessage": null
            }
            """

            let jsonData = jsonString.data(using: .utf8)!
            let decoder = JSONDecoder()
            let snapshot = try decoder.decode(LaneShadowRoutePlanSnapshot.self, from: jsonData)

            #expect(
                snapshot.phase != nil,
                "Phase '\(phaseString)' should decode successfully"
            )
            #expect(
                snapshot.phase?.rawValue == phaseString,
                "Decoded phase should match '\(phaseString)'"
            )
        }

        // Verify legacy phases don't crash and return nil
        let legacyPhases = ["reading", "sketching", "validating", "weather", "building"]
        for phaseString in legacyPhases {
            let jsonString = """
            {
                "_id": "test-plan-123",
                "status": "in_progress",
                "statusMessage": "Planning",
                "phase": "\(phaseString)",
                "result": null,
                "errorMessage": null
            }
            """

            let jsonData = jsonString.data(using: .utf8)!
            let decoder = JSONDecoder()
            let snapshot = try decoder.decode(LaneShadowRoutePlanSnapshot.self, from: jsonData)

            #expect(
                snapshot.phase == nil,
                "Legacy phase '\(phaseString)' should decode to nil"
            )
        }

        // Test nil phase
        let jsonString = """
        {
            "_id": "test-plan-123",
            "status": "in_progress",
            "statusMessage": "Planning",
            "result": null,
            "errorMessage": null
        }
        """

        let jsonData = jsonString.data(using: .utf8)!
        let decoder = JSONDecoder()
        let snapshot = try decoder.decode(LaneShadowRoutePlanSnapshot.self, from: jsonData)

        #expect(snapshot.phase == nil, "Missing phase field should decode to nil")
    }
}
