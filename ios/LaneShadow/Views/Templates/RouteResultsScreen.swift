import LaneShadowTheme
import SwiftUI

/// RouteResultsScreen — displays three alternative route polylines with Navigator message and refine chat.
///
/// Composes `LSMapLayer` with three polylines, `LSNavigatorMessage` with three route attachment cards,
/// and `LSChatInput` for refinement. Data sourced entirely from `RouteResultsMockProvider`.
public struct RouteResultsScreen: View {
    @Environment(\.theme) private var theme

    private let provider: RouteResultsMockProvider.Type
    private let state: RouteResultsScreenState
    private let onPin: @Sendable () -> Void
    private let onDismiss: @Sendable () -> Void

    @State private var chatInputValue: String = ""
    @State private var selectedRouteId: String
    @State private var drawProgress: [String: Double] = [:]

    public init(
        provider: RouteResultsMockProvider.Type = RouteResultsMockProvider.self,
        onPin: @escaping @Sendable () -> Void = {},
        onDismiss: @escaping @Sendable () -> Void = {}
    ) {
        self.provider = provider
        state = provider.value(variant: "default")
        self.onPin = onPin
        self.onDismiss = onDismiss
        _selectedRouteId = State(initialValue: state.selectedRouteId ?? "")
    }

    public var body: some View {
        LSMapLayer(
            map: {
                mapView
            },
            topOverlays: [
                GlassOverlaySlot(
                    id: "navigator-message",
                    content: { navigatorMessageOverlay }
                ),
            ],
            bottomOverlays: [
                GlassOverlaySlot(
                    id: "chatinput",
                    content: { chatInputView }
                ),
            ],
            topBar: {
                LSTopBar(
                    trailing: .none,
                    onMenuTap: {},
                    onNewTap: {}
                )
            }
        )
        .accessibilityIdentifier("route-resultsscreen")
        .onAppear {
            startRouteDrawAnimation()
        }
    }

    // MARK: - Map

    private var mapView: some View {
        LSMap(
            mode: .interactive,
            camera: CameraPosition(
                center: LatLng(lat: 37.7749, lon: -122.4194),
                zoom: 12
            ),
            cameraFit: .polylines(padding: .spacing4),
            polylines: routePolylines,
            annotations: routeAnnotations
        )
        .accessibilityIdentifier("maplayer.map")
    }

    private var routePolylines: [PolylineData] {
        state.routes.map { route in
            let progress = drawProgress[route.id] ?? 0.0
            let coordinates = decodePolyline(route.polyline)

            // Apply animation progress by trimming coordinates
            let animatedCoordinates: [LatLng]
            if progress < 1.0 {
                let count = max(1, Int(Double(coordinates.count) * progress))
                animatedCoordinates = Array(coordinates.prefix(count))
            } else {
                animatedCoordinates = coordinates
            }

            return PolylineData(
                coordinates: animatedCoordinates,
                variant: routeVariant(from: route.variant),
                strokeWidth: .lg
            )
        }
    }

    private var routeAnnotations: [Annotation] {
        state.routes.compactMap { route in
            // Only show start/end markers for the selected route
            if route.id == selectedRouteId {
                let coords = decodePolyline(route.polyline)
                if let first = coords.first, let last = coords.last {
                    return [
                        Annotation(kind: .start, coordinate: first, label: nil),
                        Annotation(kind: .end, coordinate: last, label: nil),
                    ]
                }
            }
            return nil
        }.flatMap { $0 }
    }

    private func routeVariant(from variant: String?) -> RouteVariant {
        guard let variant else { return .alt2 }
        switch variant {
        case "best":
            return .best
        case "alt1":
            return .alt1
        case "alt2":
            return .alt2
        default:
            return .alt2
        }
    }

    private func decodePolyline(_ encoded: String) -> [LatLng] {
        // Placeholder polyline decoding
        // In production, this would decode the encoded polyline string
        [
            LatLng(lat: 37.7749, lon: -122.4194),
            LatLng(lat: 37.7849, lon: -122.4094),
            LatLng(lat: 37.7949, lon: -122.3994),
        ]
    }

    private func startRouteDrawAnimation() {
        // Reset draw progress
        drawProgress = Dictionary(uniqueKeysWithValues: state.routes.map { ($0.id, 0.0) })

        // Animate each route with stagger
        let staggerMs: Double = 120 // 120ms stagger between routes
        let durationMs: Double = 600 // deliberate duration from motion tokens

        for (index, route) in state.routes.enumerated() {
            let delayMs = Double(index) * staggerMs

            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(Int(delayMs))) {
                withAnimation(.easeOut(duration: durationMs / 1000.0)) {
                    drawProgress[route.id] = 1.0
                }
            }
        }
    }

    // MARK: - Navigator Message Overlay

    private var navigatorMessageOverlay: some View {
        LSNavigatorMessage(
            body: state.message.body,
            attachments: routeAttachments,
            pinned: state.message.pinned,
            onPin: onPin,
            onDismiss: onDismiss
        )
        .accessibilityIdentifier("maplayer.topOverlay.navigator-message")
    }

    private var routeAttachments: [LSRouteAttachment] {
        guard let attachments = state.message.attachments else { return [] }

        return attachments.compactMap { attachment in
            // Find the corresponding route
            guard let route = state.routes.first(where: { $0.id == attachment.routeId }) else {
                return nil
            }

            return LSRouteAttachment(
                id: attachment.routeId,
                label: route.name,
                description: route.via,
                distance: formatDistance(route.distance),
                duration: formatDuration(route.estimatedTime),
                scenicScore: Double(attachment.scenic),
                weatherBadge: LSWeatherBadgeInfo(
                    type: weatherBadgeType(from: attachment.weather.condition),
                    text: attachment.weather.label
                ),
                isBest: attachment.isBest
            )
        }
    }

    private func formatDistance(_ meters: Int) -> String {
        let miles = Double(meters) / 1609.34
        return String(format: "%.0f mi", miles)
    }

    private func formatDuration(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        if hours > 0 {
            return String(format: "%dh %dm", hours, minutes)
        } else {
            return String(format: "%dm", minutes)
        }
    }

    private func weatherBadgeType(from condition: String) -> LSWeatherBadgeType {
        switch condition.lowercased() {
        case "clear":
            .clear
        case "rain":
            .rain
        case "wind":
            .wind
        case "storm":
            .cloudy
        default:
            .clear
        }
    }

    // MARK: - Chat Input

    private var chatInputView: some View {
        LSChatInput(
            value: $chatInputValue,
            placeholder: "Refine — 'make it shorter' / 'avoid Hwy 1'",
            onSend: { _ in },
            onCollapse: {},
            onFilter: {}
        )
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("route-resultsscreen-chatinput")
    }
}

// MARK: - Preview

#Preview {
    RouteResultsScreen()
}
