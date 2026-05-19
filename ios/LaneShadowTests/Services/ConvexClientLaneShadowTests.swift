import Combine
import ConvexMobile
import Foundation
import Testing
@testable import LaneShadow

struct ConvexClientLaneShadowTests {
    @Test
    func sendPlanningMessage_includesCurrentLocation() async throws {
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

        let capturedLocation = try transport.capturedCurrentLocation()
        let location = try #require(capturedLocation)
        #expect(location.lat == 37.77)
        #expect(location.lng == -122.42)
    }

    @Test
    func sendPlanningMessage_omitsNilCurrentLocation() async throws {
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

        #expect(transport.capturedArgs.keys.contains("currentLocation") == false)
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
        let data = try #require(encoded.data(using: .utf8))
        return try JSONDecoder().decode(CapturedLocation.self, from: data)
    }
}

private struct CapturedLocation: Decodable {
    let lat: Double
    let lng: Double
}
