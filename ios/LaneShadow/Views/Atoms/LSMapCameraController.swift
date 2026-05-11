import CoreGraphics
import SwiftUI

@MainActor
@Observable
public final class LSMapCameraController {
    public var zoomLevel: Double = 12
    public private(set) var appliedZoomDeltas: [Double] = []
    public private(set) var recenterRequestCount: Int = 0
    public private(set) var handledRecenterRequestCount: Int = 0
    public private(set) var lastRecenterOutcome: RecenterOutcome = .idle

    public enum RecenterOutcome: String, Sendable {
        case idle
        case requested
        case applied
        case unavailableNoUserLocation = "unavailable-no-user-location"
    }

    public init(zoomLevel: Double = 12) {
        self.zoomLevel = zoomLevel
    }

    public func zoomIn(step: Double = 1) {
        zoomLevel += step
    }

    public func zoomOut(step: Double = 1) {
        zoomLevel -= step
    }

    public func recenterToUserLocation() {
        recenterRequestCount += 1
        lastRecenterOutcome = .requested
    }

    public func recordAppliedZoomDelta(_ delta: Double) {
        guard delta != 0 else {
            return
        }

        appliedZoomDeltas.append(delta)
    }

    @discardableResult
    public func consumePendingRecenterRequest(outcome: RecenterOutcome) -> Bool {
        guard handledRecenterRequestCount < recenterRequestCount else {
            return false
        }

        handledRecenterRequestCount = recenterRequestCount
        lastRecenterOutcome = outcome
        return true
    }

    public var debugAccessibilityValue: String {
        let zoomDeltas = appliedZoomDeltas
            .map(Self.formatDelta)
            .joined(separator: ",")
        return "zoom-deltas=\(zoomDeltas);recenter=\(handledRecenterRequestCount)/\(recenterRequestCount);outcome=\(lastRecenterOutcome.rawValue)"
    }

    private static func formatDelta(_ delta: Double) -> String {
        if delta == floor(delta) {
            return String(format: "%.0f", delta)
        }

        return String(delta)
    }
}
