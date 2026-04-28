import LaneShadowTheme
import SwiftUI

/// RouteDetailsScreen — single best-variant polyline + LSRouteSheet at .large detent
///
/// Composes LSMapLayer with a single best-variant polyline and LSRouteSheet
/// pre-presented at .large detent showing best badge, instrument readout,
/// 6-hour weather timeline, and Save/Ride action row.
///
/// Data sourced entirely from RouteDetailsMockProvider — no fetching.
public struct RouteDetailsScreen: View {
    @Environment(\.theme) private var theme

    private let provider: RouteDetailsMockProvider.Type
    private let variant: String
    private let data: RouteDetailsData
    private let onSave: @Sendable () -> Void
    private let onRide: @Sendable () -> Void
    private let onDismiss: @Sendable () -> Void

    public init(
        provider: RouteDetailsMockProvider.Type = RouteDetailsMockProvider.self,
        variant: String = "default",
        onSave: @escaping @Sendable () -> Void = {},
        onRide: @escaping @Sendable () -> Void = {},
        onDismiss: @escaping @Sendable () -> Void = {}
    ) {
        self.provider = provider
        self.variant = variant
        data = provider.value(variant: variant)
        self.onSave = onSave
        self.onRide = onRide
        self.onDismiss = onDismiss
    }

    public var body: some View {
        LSMapLayer(
            map: {
                mapView
            },
            bottomSheet: BottomSheetSpec(
                detent: .large,
                content: {
                    routeSheet
                }
            ),
            topBar: {
                LSTopBar(
                    trailing: .none,
                    onMenuTap: {},
                    onNewTap: {}
                )
            }
        )
        .accessibilityIdentifier("route-detailsscreen")
    }

    // MARK: - Map

    private var mapView: some View {
        LSMap(
            mode: .interactive,
            camera: CameraPosition(
                center: LatLng(lat: 37.7749, lon: -122.4194),
                zoom: 12
            ),
            cameraFit: .polyline(padding: .spacing4),
            polylines: routePolylines,
            annotations: routeAnnotations
        )
        .accessibilityIdentifier("maplayer.map")
    }

    private var routePolylines: [PolylineData] {
        [
            PolylineData(
                coordinates: data.coordinates,
                variant: data.route.isBest ? .best : .alt1,
                strokeWidth: .lg
            ),
        ]
    }

    private var routeAnnotations: [Annotation] {
        guard let first = data.coordinates.first, let last = data.coordinates.last else {
            return []
        }

        return [
            Annotation(kind: .start, coordinate: first, label: nil),
            Annotation(kind: .end, coordinate: last, label: nil),
        ]
    }

    // MARK: - Route Sheet

    private var routeSheet: some View {
        LSRouteSheet(
            route: LSRouteSheet.Route(
                id: data.route.id,
                title: data.route.title,
                subtitle: data.route.subtitle,
                isBest: data.route.isBest,
                distance: data.route.distance,
                time: data.route.time,
                climb: data.route.climb,
                scenic: data.route.scenic
            ),
            weatherTimeline: data.weatherTimeline,
            timeRange: data.timeRange,
            onSave: onSave,
            onRide: onRide,
            onDismiss: onDismiss
        )
        .accessibilityIdentifier("lsbottomsheet")
    }
}

// MARK: - Preview

#Preview("Default — Skyline") {
    RouteDetailsScreen()
}

#Preview("Mixed Weather") {
    RouteDetailsScreen(
        provider: RouteDetailsMockProvider.self,
        onSave: {},
        onRide: {},
        onDismiss: {}
    )
}

#Preview("Dark Mode") {
    RouteDetailsScreen()
        .preferredColorScheme(.dark)
}
