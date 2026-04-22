import LaneShadowTheme
import SwiftUI

/// Public coordinate model for geographic locations
public struct CLLocationCoordinate: Equatable, Sendable {
    public var latitude: Double
    public var longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}

/// DeviationPolyline component - Visual representation of route deviations
///
/// Displays the original route, detour path, and reconnection point on a map.
/// Uses Canvas as a visual placeholder for future MapKit integration.
///
/// Following the translation matrix specification:
/// - Original route stroke: theme.domain.deviationOriginalRoute (fallback gray)
/// - Detour path stroke: theme.domain.deviationDetourPath (fallback orange)
/// - Reconnect point: theme.domain.deviationReconnectPoint (fallback green)
/// - Stroke width: 6pt default
public struct DeviationPolyline: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme

    private let originalRoute: [CLLocationCoordinate]
    private let detourPath: [CLLocationCoordinate]
    private let reconnectPoint: CLLocationCoordinate?
    private let strokeWidth: CGFloat
    private let onPress: (() -> Void)?
    private let testID: String?

    // MARK: - Initialization

    /// Creates a DeviationPolyline with the given route data
    /// - Parameters:
    ///   - originalRoute: Array of coordinates representing the original route
    ///   - detourPath: Array of coordinates representing the detour path
    ///   - reconnectPoint: Optional coordinate where the detour reconnects to the original route
    ///   - strokeWidth: Width of the stroke (default is 6pt)
    ///   - onPress: Optional closure to call when the polyline is pressed
    ///   - testID: Optional identifier for testing
    public init(
        originalRoute: [CLLocationCoordinate],
        detourPath: [CLLocationCoordinate],
        reconnectPoint: CLLocationCoordinate? = nil,
        strokeWidth: CGFloat = 6,
        onPress: (() -> Void)? = nil,
        testID: String? = nil
    ) {
        self.originalRoute = originalRoute
        self.detourPath = detourPath
        self.reconnectPoint = reconnectPoint
        self.strokeWidth = strokeWidth
        self.onPress = onPress
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Canvas { context, size in
            // Draw original route
            drawPolyline(
                context: context,
                coordinates: originalRoute,
                color: theme.domain.deviationOriginalRoute.default,
                size: size
            )

            // Draw detour path
            drawPolyline(
                context: context,
                coordinates: detourPath,
                color: theme.domain.deviationDetourPath.default,
                size: size
            )

            // Draw reconnect point if provided
            if let reconnectPoint {
                drawReconnectPoint(
                    context: context,
                    coordinate: reconnectPoint,
                    size: size
                )
            }
        }
        .frame(height: 200) // Placeholder height for Canvas
        .contentShape(Rectangle())
        .onTapGesture {
            onPress?()
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Route deviation map")
        .accessibilityHint("Shows original route in gray, detour path in orange, and reconnection point in green")
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier(testID ?? "deviationPolyline")
    }

    // MARK: - Private Helpers

    private func drawPolyline(
        context: GraphicsContext,
        coordinates: [CLLocationCoordinate],
        color: Color,
        size: CGSize
    ) {
        guard coordinates.count >= 2 else { return }

        var path = Path()

        // Convert coordinates to normalized canvas coordinates
        let points = coordinates.map { coordinate in
            normalizeCoordinate(coordinate, in: size)
        }

        if let firstPoint = points.first {
            path.move(to: firstPoint)
        }

        for point in points.dropFirst() {
            path.addLine(to: point)
        }

        context.stroke(
            path,
            with: .color(color),
            lineWidth: strokeWidth
        )
    }

    private func drawReconnectPoint(
        context: GraphicsContext,
        coordinate: CLLocationCoordinate,
        size: CGSize
    ) {
        let point = normalizeCoordinate(coordinate, in: size)
        let radius: CGFloat = 8

        var circlePath = Path()
        circlePath.addEllipse(in: CGRect(
            x: point.x - radius,
            y: point.y - radius,
            width: radius * 2,
            height: radius * 2
        ))

        context.fill(
            circlePath,
            with: .color(theme.domain.deviationReconnectPoint.default)
        )
    }

    private func normalizeCoordinate(
        _ coordinate: CLLocationCoordinate,
        in size: CGSize
    ) -> CGPoint {
        // Find bounding box of all coordinates
        let allCoordinates = originalRoute + detourPath + ([reconnectPoint].compactMap { $0 })

        let minLat = allCoordinates.map(\.latitude).min() ?? coordinate.latitude
        let maxLat = allCoordinates.map(\.latitude).max() ?? coordinate.latitude
        let minLon = allCoordinates.map(\.longitude).min() ?? coordinate.longitude
        let maxLon = allCoordinates.map(\.longitude).max() ?? coordinate.longitude

        let latRange = maxLat - minLat
        let lonRange = maxLon - minLon

        // Normalize to canvas size with padding
        let padding: CGFloat = 20
        let usableWidth = size.width - (padding * 2)
        let usableHeight = size.height - (padding * 2)

        let normalizedX: CGFloat
        let normalizedY: CGFloat

        if lonRange > 0 {
            normalizedX = padding + ((coordinate.longitude - minLon) / lonRange) * usableWidth
        } else {
            normalizedX = size.width / 2
        }

        if latRange > 0 {
            normalizedY = padding + ((coordinate.latitude - minLat) / latRange) * usableHeight
        } else {
            normalizedY = size.height / 2
        }

        return CGPoint(x: normalizedX, y: normalizedY)
    }
}

// MARK: - Preview

#Preview("Deviation Polyline") {
    VStack(spacing: 20) {
        DeviationPolyline(
            originalRoute: [
                CLLocationCoordinate(latitude: 37.7749, longitude: -122.4194),
                CLLocationCoordinate(latitude: 37.7750, longitude: -122.4180),
                CLLocationCoordinate(latitude: 37.7755, longitude: -122.4170),
                CLLocationCoordinate(latitude: 37.7765, longitude: -122.4160),
                CLLocationCoordinate(latitude: 37.7775, longitude: -122.4150),
            ],
            detourPath: [
                CLLocationCoordinate(latitude: 37.7750, longitude: -122.4180),
                CLLocationCoordinate(latitude: 37.7752, longitude: -122.4175),
                CLLocationCoordinate(latitude: 37.7760, longitude: -122.4170),
                CLLocationCoordinate(latitude: 37.7765, longitude: -122.4160),
            ],
            reconnectPoint: CLLocationCoordinate(latitude: 37.7765, longitude: -122.4160),
            strokeWidth: 6,
            testID: "deviationPreview"
        )
        .padding()

        Text("Deviation Polyline")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Without Reconnect Point") {
    VStack(spacing: 20) {
        DeviationPolyline(
            originalRoute: [
                CLLocationCoordinate(latitude: 37.7749, longitude: -122.4194),
                CLLocationCoordinate(latitude: 37.7750, longitude: -122.4180),
                CLLocationCoordinate(latitude: 37.7755, longitude: -122.4170),
            ],
            detourPath: [
                CLLocationCoordinate(latitude: 37.7750, longitude: -122.4180),
                CLLocationCoordinate(latitude: 37.7752, longitude: -122.4175),
                CLLocationCoordinate(latitude: 37.7760, longitude: -122.4170),
            ],
            strokeWidth: 6
        )
        .padding()

        Text("Without Reconnect Point")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Single Point") {
    VStack(spacing: 20) {
        DeviationPolyline(
            originalRoute: [
                CLLocationCoordinate(latitude: 37.7749, longitude: -122.4194),
            ],
            detourPath: [
                CLLocationCoordinate(latitude: 37.7750, longitude: -122.4180),
            ],
            reconnectPoint: CLLocationCoordinate(latitude: 37.7755, longitude: -122.4170),
            strokeWidth: 6
        )
        .padding()

        Text("Single Point (Degenerate)")
            .font(.headline)
    }
    .laneShadowTheme()
}
