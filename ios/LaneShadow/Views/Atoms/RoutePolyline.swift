import LaneShadowTheme
import SwiftUI

/// Public coordinate model for geographic locations
public struct LSLatLng: Equatable, Sendable {
    public let latitude: Double
    public let longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}

/// Route variant enum
public enum LSRouteVariant {
    case selected
    case alternate
}

/// RoutePolyline component - Visual representation of route paths
///
/// Displays route polylines with different styling for selected and alternate routes.
/// Uses Canvas as a visual placeholder for future MapKit integration.
///
/// Following the translation matrix specification:
/// - Selected route: theme.colors.routeSelected (primary color)
/// - Alternate route: theme.colors.routeAlternate (muted color)
/// - Stroke width: 6pt for overview, 4pt for legs
/// - Round line cap and join
public struct LSRoutePolyline: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme

    private let coordinates: [LSLatLng]
    private let variant: LSRouteVariant
    private let strokeWidth: CGFloat
    private let height: CGFloat

    // MARK: - Initialization

    /// Creates a RoutePolyline with the given route data
    /// - Parameters:
    ///   - coordinates: Array of coordinates representing the route
    ///   - variant: Route variant (selected or alternate)
    ///   - strokeWidth: Width of the stroke (default is 6pt)
    ///   - height: Canvas height for preview (default is 100pt)
    public init(
        coordinates: [LSLatLng],
        variant: LSRouteVariant = .selected,
        strokeWidth: CGFloat = 6,
        height: CGFloat = 100
    ) {
        self.coordinates = coordinates
        self.variant = variant
        self.strokeWidth = strokeWidth
        self.height = height
    }

    // MARK: - Body

    public var body: some View {
        Canvas { context, size in
            guard coordinates.count >= 2 else {
                // Draw placeholder for empty or single-point routes
                drawPlaceholder(context: context, size: size)
                return
            }

            // Draw the polyline
            drawPolyline(
                context: context,
                coordinates: coordinates,
                color: routeColor,
                size: size
            )
        }
        .frame(height: height)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityHint("Route polyline showing \(coordinates.count) points")
    }

    // MARK: - Private Computed Properties

    private var routeColor: Color {
        switch variant {
        case .selected:
            theme.colors.routeSelected.default
        case .alternate:
            theme.colors.routeAlternate.default
        }
    }

    private var accessibilityLabel: String {
        switch variant {
        case .selected:
            "Selected route"
        case .alternate:
            "Alternate route"
        }
    }

    // MARK: - Private Helpers

    private func drawPolyline(
        context: GraphicsContext,
        coordinates: [LSLatLng],
        color: Color,
        size: CGSize
    ) {
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
            style: StrokeStyle(
                lineWidth: strokeWidth,
                lineCap: .round,
                lineJoin: .round
            )
        )
    }

    private func drawPlaceholder(
        context: GraphicsContext,
        size: CGSize
    ) {
        // Draw a wavy placeholder line
        var path = Path()
        let padding: CGFloat = 20
        let startX = padding
        let endX = size.width - padding
        let midY = size.height / 2

        path.move(to: CGPoint(x: startX, y: midY))

        // Create a wavy line
        let waveCount = 3
        let waveAmplitude: CGFloat = 10
        let waveLength = (endX - startX) / CGFloat(waveCount)

        for i in 0 ..< waveCount {
            let startX = padding + CGFloat(i) * waveLength
            let endX = padding + CGFloat(i + 1) * waveLength
            let controlX1 = startX + waveLength * 0.25
            let controlX2 = startX + waveLength * 0.75
            let offset = CGFloat(i % 2 == 0 ? 1 : -1) * waveAmplitude

            path.addCurve(
                to: CGPoint(x: endX, y: midY),
                control1: CGPoint(x: controlX1, y: midY + offset),
                control2: CGPoint(x: controlX2, y: midY - offset)
            )
        }

        context.stroke(
            path,
            with: .color(routeColor.opacity(0.5)),
            style: StrokeStyle(
                lineWidth: strokeWidth,
                lineCap: .round,
                lineJoin: .round
            )
        )
    }

    private func normalizeCoordinate(
        _ coordinate: LSLatLng,
        in size: CGSize
    ) -> CGPoint {
        // Find bounding box of all coordinates
        let minLat = coordinates.map(\.latitude).min() ?? coordinate.latitude
        let maxLat = coordinates.map(\.latitude).max() ?? coordinate.latitude
        let minLon = coordinates.map(\.longitude).min() ?? coordinate.longitude
        let maxLon = coordinates.map(\.longitude).max() ?? coordinate.longitude

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

#Preview("Selected Route") {
    VStack(spacing: 20) {
        LSRoutePolyline(
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7750, longitude: -122.4180),
                LSLatLng(latitude: 37.7755, longitude: -122.4170),
                LSLatLng(latitude: 37.7765, longitude: -122.4160),
                LSLatLng(latitude: 37.7775, longitude: -122.4150),
            ],
            variant: .selected,
            strokeWidth: 6,
            height: 100
        )
        .padding()

        Text("Selected Route")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Alternate Route") {
    VStack(spacing: 20) {
        LSRoutePolyline(
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7750, longitude: -122.4180),
                LSLatLng(latitude: 37.7755, longitude: -122.4170),
                LSLatLng(latitude: 37.7765, longitude: -122.4160),
            ],
            variant: .alternate,
            strokeWidth: 6,
            height: 100
        )
        .padding()

        Text("Alternate Route")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Empty Route") {
    VStack(spacing: 20) {
        LSRoutePolyline(
            coordinates: [],
            variant: .selected,
            strokeWidth: 6,
            height: 100
        )
        .padding()

        Text("Empty Route (Placeholder)")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Single Point") {
    VStack(spacing: 20) {
        LSRoutePolyline(
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
            ],
            variant: .selected,
            strokeWidth: 6,
            height: 100
        )
        .padding()

        Text("Single Point (Placeholder)")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Route Comparison") {
    VStack(spacing: 16) {
        Text("Route Options")
            .font(.headline)

        LSRoutePolyline(
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7750, longitude: -122.4180),
                LSLatLng(latitude: 37.7755, longitude: -122.4170),
                LSLatLng(latitude: 37.7765, longitude: -122.4160),
                LSLatLng(latitude: 37.7775, longitude: -122.4150),
            ],
            variant: .selected,
            strokeWidth: 6,
            height: 80
        )

        LSRoutePolyline(
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7752, longitude: -122.4175),
                LSLatLng(latitude: 37.7760, longitude: -122.4170),
                LSLatLng(latitude: 37.7775, longitude: -122.4150),
            ],
            variant: .alternate,
            strokeWidth: 4,
            height: 80
        )
    }
    .padding()
    .laneShadowTheme()
}
