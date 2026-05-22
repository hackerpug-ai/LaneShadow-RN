import Combine
import ConvexMobile
import Foundation
import Testing
import XCTest
@testable import LaneShadow

struct ConvexClientLaneShadowSwiftTestingSpec {
    @Test
    func sendPlanningMessage_includesCurrentLocation() async throws {
        try await ConvexClientLaneShadowTestAssertions.assertSendPlanningMessageIncludesCurrentLocation()
    }

    @Test
    func sendPlanningMessage_omitsNilCurrentLocation() async throws {
        try await ConvexClientLaneShadowTestAssertions.assertSendPlanningMessageOmitsNilCurrentLocation()
    }
}

final class ConvexClientLaneShadowTests: XCTestCase {
    func test_sendPlanningMessage_includesCurrentLocation() async throws {
        try await ConvexClientLaneShadowTestAssertions.assertSendPlanningMessageIncludesCurrentLocation()
    }

    func test_sendPlanningMessage_omitsNilCurrentLocation() async throws {
        try await ConvexClientLaneShadowTestAssertions.assertSendPlanningMessageOmitsNilCurrentLocation()
    }
}

private enum ConvexClientLaneShadowTestAssertions {
    static func assertSendPlanningMessageIncludesCurrentLocation() async throws {
        let transport = SendMessageCaptureTransport()
        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )

        _ = try await client.sendPlanningMessage(
            sessionId: "session-123",
            content: "Plan a scenic 2-hour ride",
            currentLocation: LaneShadowCurrentLocation(lat: 37.77, lng: -122.42)
        )

        let location = try XCTUnwrap(try transport.capturedCurrentLocation())
        XCTAssertEqual(location.lat, 37.77)
        XCTAssertEqual(location.lng, -122.42)
    }

    static func assertSendPlanningMessageOmitsNilCurrentLocation() async throws {
        let transport = SendMessageCaptureTransport()
        let client = LaneShadowConvexClient(
            deploymentURL: "http://localhost:3210",
            tokenProvider: { nil },
            transport: transport
        )

        _ = try await client.sendPlanningMessage(
            sessionId: "session-123",
            content: "Plan a scenic 2-hour ride",
            currentLocation: nil
        )

        XCTAssertFalse(transport.capturedArgs.keys.contains("currentLocation"))
    }
}

private final class SendMessageCaptureTransport: LaneShadowConvexTransporting {
    private(set) var capturedEndpoint: String?
    private(set) var capturedArgs: [String: ConvexEncodable?] = [:]

    func subscribe<T: Decodable & Sendable>(
        to _: String,
        with _: [String: ConvexEncodable?]?,
        yielding _: T.Type
    ) -> AnyPublisher<T, ClientError> {
        Empty<T, ClientError>().eraseToAnyPublisher()
    }

    func mutation<T: Decodable>(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws -> T {
        throw LaneShadowError.server("Unexpected mutation")
    }

    func mutation(
        _: String,
        with _: [String: ConvexEncodable?]?
    ) async throws {
        throw LaneShadowError.server("Unexpected mutation")
    }

    func action<T: Decodable>(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws -> T {
        capturedEndpoint = endpoint
        capturedArgs = args ?? [:]

        let responseJSON = """
        {
            "response": "planning",
            "messageId": "message-123",
            "attachments": []
        }
        """
        let payload = Data(responseJSON.utf8)
        return try JSONDecoder().decode(T.self, from: payload)
    }

    func action(
        _ endpoint: String,
        with args: [String: ConvexEncodable?]?
    ) async throws {
        capturedEndpoint = endpoint
        capturedArgs = args ?? [:]
    }

    func triggerAuthRefresh() async {}

    func capturedCurrentLocation() throws -> CapturedLocation? {
        guard let rawValue = capturedArgs["currentLocation"],
              let value = rawValue
        else {
            return nil
        }

        let encoded = try value.convexEncode()
        let data = try XCTUnwrap(encoded.data(using: .utf8))
        return try JSONDecoder().decode(CapturedLocation.self, from: data)
    }
}

private struct CapturedLocation: Decodable {
    let lat: Double
    let lng: Double
}
