import LaneShadowTheme
import SwiftUI

/// RoutePolylineComponent - Higher-level route polyline wrapper
///
/// A route-specific component that wraps RoutePolyline with simplified selection-based styling.
/// Designed for use in route cards and route selection UIs.
///
/// Following the translation matrix specification:
/// - Selected route: theme.colors.primary.default (fallback to routeSelected)
/// - Unselected route: theme.colors.onSurface.default.opacity(0.7) (fallback to routeAlternate)
/// - Stroke width: 6pt for overview, 4pt for legs
/// - Canvas height: 100pt default
public struct LSRoutePolylineComponent: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme

    private let isSelected: Bool
    private let coordinates: [LSLatLng]
    private let strokeWidth: CGFloat
    private let legStrokeWidth: CGFloat
    private let height: CGFloat

    // MARK: - Initialization

    /// Creates a RoutePolylineComponent with the given route data
    /// - Parameters:
    ///   - isSelected: Whether this route is selected (default is false)
    ///   - coordinates: Array of coordinates representing the route
    ///   - strokeWidth: Width of the stroke for overview display (default is 6pt)
    ///   - legStrokeWidth: Width of the stroke for leg display (default is 4pt)
    ///   - height: Canvas height for preview (default is 100pt)
    public init(
        isSelected: Bool = false,
        coordinates: [LSLatLng],
        strokeWidth: CGFloat = 6,
        legStrokeWidth: CGFloat = 4,
        height: CGFloat = 100
    ) {
        self.isSelected = isSelected
        self.coordinates = coordinates
        self.strokeWidth = strokeWidth
        self.legStrokeWidth = legStrokeWidth
        self.height = height
    }

    // MARK: - Body

    public var body: some View {
        LSRoutePolyline(
            coordinates: coordinates,
            variant: isSelected ? .selected : .alternate,
            strokeWidth: isSelected ? strokeWidth : legStrokeWidth,
            height: height
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(isSelected ? "Selected route" : "Alternate route")
        .accessibilityHint("Route polyline showing \(coordinates.count) points")
    }
}

// MARK: - Preview

#Preview("Selected Route") {
    VStack(spacing: 20) {
        LSRoutePolylineComponent(
            isSelected: true,
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7750, longitude: -122.4180),
                LSLatLng(latitude: 37.7755, longitude: -122.4170),
                LSLatLng(latitude: 37.7765, longitude: -122.4160),
                LSLatLng(latitude: 37.7775, longitude: -122.4150),
            ],
            strokeWidth: 6,
            legStrokeWidth: 4,
            height: 100
        )
        .padding()

        Text("Selected Route")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Unselected Route") {
    VStack(spacing: 20) {
        LSRoutePolylineComponent(
            isSelected: false,
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7750, longitude: -122.4180),
                LSLatLng(latitude: 37.7755, longitude: -122.4170),
                LSLatLng(latitude: 37.7765, longitude: -122.4160),
            ],
            strokeWidth: 6,
            legStrokeWidth: 4,
            height: 100
        )
        .padding()

        Text("Unselected Route")
            .font(.headline)
    }
    .laneShadowTheme()
}

#Preview("Route Comparison") {
    VStack(spacing: 16) {
        Text("Route Options")
            .font(.headline)

        LSRoutePolylineComponent(
            isSelected: true,
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7750, longitude: -122.4180),
                LSLatLng(latitude: 37.7755, longitude: -122.4170),
                LSLatLng(latitude: 37.7765, longitude: -122.4160),
                LSLatLng(latitude: 37.7775, longitude: -122.4150),
            ],
            strokeWidth: 6,
            legStrokeWidth: 4,
            height: 80
        )

        LSRoutePolylineComponent(
            isSelected: false,
            coordinates: [
                LSLatLng(latitude: 37.7749, longitude: -122.4194),
                LSLatLng(latitude: 37.7752, longitude: -122.4175),
                LSLatLng(latitude: 37.7760, longitude: -122.4170),
                LSLatLng(latitude: 37.7775, longitude: -122.4150),
            ],
            strokeWidth: 6,
            legStrokeWidth: 4,
            height: 80
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Empty Route") {
    VStack(spacing: 20) {
        LSRoutePolylineComponent(
            isSelected: true,
            coordinates: [],
            strokeWidth: 6,
            legStrokeWidth: 4,
            height: 100
        )
        .padding()

        Text("Empty Route (Placeholder)")
            .font(.headline)
    }
    .laneShadowTheme()
}
