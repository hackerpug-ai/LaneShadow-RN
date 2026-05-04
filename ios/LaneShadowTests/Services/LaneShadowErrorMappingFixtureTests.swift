import ConvexMobile
import XCTest
import Foundation
import Testing
@testable import LaneShadow

@Suite("LaneShadow Error Mapping Fixture Tests")
@MainActor
struct LaneShadowErrorMappingFixtureTests {
    @Test("test_fixture_roundTrip_allCodesMapToTargets")
    func fixture_roundTrip_allCodesMapToTargets() throws {
        // Load the fixture from the Resources directory
        let testBundle = Bundle(for: LaneShadowTests.self)
        let fixturePath = try #require(testBundle.path(forResource: "auth-error-taxonomy", ofType: "json"))
        let fixtureData = try Data(contentsOf: URL(fileURLWithPath: fixturePath))
        let fixture = try JSONDecoder().decode([AuthErrorFixtureEntry].self, from: fixtureData)

        // Test that every code in the fixture maps to its mobile_mapping_target
        for entry in fixture {
            let code = entry.code
            let target = entry.mobile_mapping_target

            // Create a Convex error with this code
            let error = ClientError.ConvexError(data: #"{"code":"\#(code)"}"#)
            let mapped = LaneShadowError.map(error)

            // Verify the mapped error matches the target
            let expectedError = try laneShadowErrorFromFixtureTarget(target)
            #expect(mapped == expectedError, "Code '\(code)' should map to '\(target)' but got '\(mapped)'")
        }
    }

    private func laneShadowErrorFromFixtureTarget(_ target: String) throws -> LaneShadowError {
        switch target {
        case "Unauthenticated": return .unauthenticated
        case "Forbidden": return .forbidden
        case "AgentResponseInvalid": return .agentResponseInvalid
        case "NoRoutesGenerated": return .noRoutesGenerated
        case "AgentTimeout": return .agentTimeout
        case "InvalidAgentResponseStructure": return .invalidAgentResponseStructure
        case "PlanAlreadyActive": return .planAlreadyActive
        case "PlanNotFound": return .planNotFound
        case "RateLimitExceeded": return .rateLimitExceeded
        case "LowConfidenceParse": return .lowConfidenceParse
        case "NetworkTimeout": return .networkTimeout
        case "WeatherUnavailable": return .weatherUnavailable
        case "GenerationFailed": return .generationFailed
        case "AgenticParseFailed": return .agenticParseFailed
        case "PlanLimitExceeded": return .planLimitExceeded
        case "SessionNotFound": return .sessionNotFound
        case "InvalidContent": return .invalidContent
        case "AgentBudgetExceeded": return .agentBudgetExceeded
        case "AgentLoopDetected": return .agentLoopDetected
        default:
            throw TestCaseError.unknownFixtureTarget(target)
        }
    }
}

// MARK: - Test Models

struct AuthErrorFixtureEntry: Codable {
    let code: String
    let description: String
    let mobile_mapping_target: String
}

enum TestCaseError: Error {
    case unknownFixtureTarget(String)
}
