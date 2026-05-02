import Combine
import Foundation
import LaneShadowTheme
import SwiftUI

@MainActor
public protocol RouteResultsScreenInspectionSeam: AnyObject {
    var notice: PassthroughSubject<UInt, Never> { get }
    func visit(_ view: RouteResultsScreen, _ line: UInt)
}

/// RouteResultsScreen — displays three alternative route polylines with Navigator message and refine chat.
///
/// Composes `LSMapLayer` with three polylines, `LSNavigatorMessage` with three route attachment cards,
/// and `LSChatInput` for refinement. Data can come from `RouteResultsMockProvider` or a live state.
public struct RouteResultsScreen: View {
    @Environment(\.theme) private var theme

    private let state: RouteResultsScreenState
    private let onPin: @Sendable () -> Void
    private let onDismiss: @Sendable () -> Void
    private let onRouteCardTap: @Sendable (String) -> Void
    private let inspection: (any RouteResultsScreenInspectionSeam)?

    @State private var chatInputValue: String = ""
    @State private var drawProgress: [String: Double] = [:]
    @State private var isCalloutVisible: Bool = true

    public init(
        provider: RouteResultsMockProvider.Type = RouteResultsMockProvider.self,
        variant: String = "default",
        onPin: @escaping @Sendable () -> Void = {},
        onDismiss: @escaping @Sendable () -> Void = {},
        onRouteCardTap: @escaping @Sendable (String) -> Void = { _ in },
        inspection: (any RouteResultsScreenInspectionSeam)? = nil
    ) {
        self.init(
            state: provider.value(variant: variant),
            onPin: onPin,
            onDismiss: onDismiss,
            onRouteCardTap: onRouteCardTap,
            inspection: inspection
        )
    }

    init(
        state: RouteResultsScreenState,
        onPin: @escaping @Sendable () -> Void = {},
        onDismiss: @escaping @Sendable () -> Void = {},
        onRouteCardTap: @escaping @Sendable (String) -> Void = { _ in },
        inspection: (any RouteResultsScreenInspectionSeam)? = nil
    ) {
        self.state = state
        self.onPin = onPin
        self.onDismiss = onDismiss
        self.onRouteCardTap = onRouteCardTap
        self.inspection = inspection
    }

    public var body: some View {
        let content = baseBody

        if let inspection {
            content.onReceive(inspection.notice) { inspection.visit(self, $0) }
        } else {
            content
        }
    }

    private var baseBody: some View {
        ZStack(alignment: .topLeading) {
            navigatorMessageContainer
                .zIndex(2)

            LSMapLayer(
                map: {
                    mapView
                },
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
        }
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
                strokeWidth: route.id == effectiveSelectedRouteId ? .lg : .md
            )
        }
    }

    private var routeAnnotations: [Annotation] {
        state.routes.compactMap { route in
            // Only show start/end markers for the selected route
            if route.id == effectiveSelectedRouteId {
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

    private var effectiveSelectedRouteId: String? {
        state.selectedRouteId ?? state.routes.first?.id
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
        let decoded = decodeEncodedPolyline(encoded)
        return decoded.isEmpty ? fallbackCoordinates() : decoded
    }

    private func decodeEncodedPolyline(_ encoded: String, precision: Double = 5) -> [LatLng] {
        guard !encoded.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }

        let factor = pow(10.0, precision)
        let bytes = Array(encoded.utf8)
        var index = 0
        var latitude = 0
        var longitude = 0
        var coordinates: [LatLng] = []

        func decodeValue() -> Int? {
            var result = 0
            var shift = 0

            while index < bytes.count {
                let byte = Int(bytes[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5

                if byte < 0x20 {
                    return (result & 1) != 0 ? ~(result >> 1) : (result >> 1)
                }
            }

            return nil
        }

        while index < bytes.count {
            guard let deltaLat = decodeValue(),
                  let deltaLon = decodeValue()
            else {
                return []
            }

            latitude += deltaLat
            longitude += deltaLon

            coordinates.append(
                LatLng(
                    lat: Double(latitude) / factor,
                    lon: Double(longitude) / factor
                )
            )
        }

        return coordinates.count >= 2 ? coordinates : []
    }

    private func fallbackCoordinates() -> [LatLng] {
        [
            LatLng(lat: 37.7749, lon: -122.4194),
            LatLng(lat: 37.7849, lon: -122.4094),
            LatLng(lat: 37.7949, lon: -122.3994),
        ]
    }

    private func startRouteDrawAnimation() {
        // Reset draw progress
        drawProgress = Dictionary(uniqueKeysWithValues: state.routes.map { ($0.id, 0.0) })

        // Animate each route with stagger using theme motion tokens
        let staggerMs: Double = 120 // 120ms stagger between routes
        let durationMs = Double(theme.motion.duration["slower"] ?? 600)
        let easing = theme.motion.easing["standard"] ?? [0.4, 0, 0.2, 1]

        for (index, route) in state.routes.enumerated() {
            let delayMs = Double(index) * staggerMs

            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(Int(delayMs))) {
                withAnimation(
                    Animation.timingCurve(
                        easing[0],
                        easing[1],
                        easing[2],
                        easing[3],
                        duration: durationMs / 1000.0
                    )
                ) {
                    drawProgress[route.id] = 1.0
                }
            }
        }
    }

    // MARK: - Navigator Message Overlay

    private var navigatorMessageContainer: some View {
        VStack(alignment: .leading, spacing: 0) {
            navigatorMessageContent
        }
        .padding(.horizontal, theme.space.md)
        .padding(.top)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .accessibilityIdentifier("maplayer.topOverlay.navigator-message")
    }

    @ViewBuilder
    private var navigatorMessageContent: some View {
        if state.routes.isEmpty {
            emptyStateOverlay
        } else if isCalloutVisible {
            LSNavigatorMessage(
                body: state.message.body,
                attachments: routeAttachments,
                pinned: state.message.pinned,
                onPin: onPin,
                onDismiss: {
                    isCalloutVisible = false
                    onDismiss()
                },
                onRouteCardTap: { routeId in
                    onRouteCardTap(routeId)
                },
                selectedRouteId: effectiveSelectedRouteId
            )
        } else {
            recallChip
        }
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

    private var emptyStateOverlay: some View {
        LSEmptyState(
            title: "No routes available",
            body: "Try adjusting your start or end points."
        )
        .frame(maxWidth: .infinity)
    }

    private var recallChip: some View {
        Button(action: {
            isCalloutVisible = true
        }) {
            LSPill(size: .md) {
                LSText("Recall", variant: .label.md, color: .secondary)
            }
            .background(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .fill(LaneShadowTheme.color.surface.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .stroke(LaneShadowTheme.color.signal.default, lineWidth: theme.borderWidth.hairline)
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Recall route callout")
        .accessibilityIdentifier("routeresultsscreen-recall")
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
