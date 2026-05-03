import LaneShadowTheme
import SwiftUI

/// RouteDetailsScreen — single best-variant polyline + LSRouteSheet at .large detent
///
/// Composes LSMapLayer with a single best-variant polyline and LSRouteSheet
/// pre-presented at .large detent showing best badge, instrument readout,
/// 6-hour weather timeline, and Save/Ride action row.
///
/// Supports two initialization paths:
/// 1. MockProvider (sandbox) — data sourced from RouteDetailsMockProvider
/// 2. ViewState (production) — data sourced from RouteDetailsViewState
public struct RouteDetailsScreen: View {
    @Environment(\.theme) private var theme

    private let provider: RouteDetailsMockProvider.Type?
    private let variant: String?
    private let data: RouteDetailsData?
    private let viewState: RouteDetailsViewState?
    private let onSave: @Sendable () -> Void
    private let onRide: @Sendable () -> Void
    private let onDismiss: @Sendable () -> Void

    /// Initializer for MockProvider (sandbox) usage.
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
        viewState = nil
        self.onSave = onSave
        self.onRide = onRide
        self.onDismiss = onDismiss
    }

    /// Initializer for ViewState (production) usage.
    init(
        viewState: RouteDetailsViewState,
        onSave: @escaping @Sendable () -> Void = {},
        onRide: @escaping @Sendable () -> Void = {},
        onDismiss: @escaping @Sendable () -> Void = {}
    ) {
        provider = nil
        variant = nil
        data = nil
        self.viewState = viewState
        self.onSave = onSave
        self.onRide = onRide
        self.onDismiss = onDismiss
    }

    public var body: some View {
        if let data {
            // MockProvider path (sandbox)
            mockProviderBody(data: data)
        } else if let viewState {
            // ViewState path (production)
            viewStateBody(viewState: viewState)
        }
    }

    private func mockProviderBody(data: RouteDetailsData) -> some View {
        LSMapLayer(
            map: {
                mapView(data: data)
            },
            bottomSheet: BottomSheetSpec(
                detent: .large,
                content: {
                    mockProviderRouteSheet(data: data)
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

    private func viewStateBody(viewState: RouteDetailsViewState) -> some View {
        LSMapLayer(
            map: {
                viewStateMap
            },
            bottomSheet: BottomSheetSpec(
                detent: .large,
                content: {
                    viewStateRouteSheet(viewState: viewState)
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

    // MARK: - Map (MockProvider)

    private func mapView(data: RouteDetailsData) -> some View {
        LSMap(
            mode: .interactive,
            camera: CameraPosition(
                center: LatLng(lat: 37.7749, lon: -122.4194),
                zoom: 12
            ),
            cameraFit: .polyline(padding: .spacing4),
            polylines: routePolylines(data: data),
            annotations: routeAnnotations(data: data)
        )
        .accessibilityIdentifier("maplayer.map")
    }

    private func routePolylines(data: RouteDetailsData) -> [PolylineData] {
        [
            PolylineData(
                coordinates: data.coordinates,
                variant: data.route.isBest ? .best : .alt1,
                strokeWidth: .lg
            ),
        ]
    }

    private func routeAnnotations(data: RouteDetailsData) -> [Annotation] {
        guard let first = data.coordinates.first, let last = data.coordinates.last else {
            return []
        }

        return [
            Annotation(kind: .start, coordinate: first, label: nil),
            Annotation(kind: .end, coordinate: last, label: nil),
        ]
    }

    // MARK: - Map (ViewState)

    private var viewStateMap: some View {
        LSMap(
            mode: .interactive,
            camera: CameraPosition(
                center: LatLng(lat: 37.7749, lon: -122.4194),
                zoom: 12
            ),
            cameraFit: .static,
            polylines: [],
            annotations: []
        )
        .accessibilityIdentifier("maplayer.map")
    }

    // MARK: - Route Sheet (MockProvider)

    private func mockProviderRouteSheet(data: RouteDetailsData) -> some View {
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

    // MARK: - Route Sheet (ViewState)

    private func viewStateRouteSheet(viewState: RouteDetailsViewState) -> some View {
        LSRouteSheet(
            route: LSRouteSheet.Route(
                id: viewState.routeTitle,
                title: viewState.routeTitle,
                subtitle: "",
                isBest: true,
                distance: viewState.distanceKm,
                time: viewState.durationFormatted,
                climb: viewState.elevationM,
                scenic: viewState.scenicScore
            ),
            weatherTimeline: viewState.weatherEntries,
            timeRange: ("", ""),
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
