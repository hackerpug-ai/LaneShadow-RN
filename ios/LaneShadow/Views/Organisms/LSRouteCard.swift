import LaneShadowTheme
import SwiftUI

/// LSRouteCard — Full route-card organism used in catalog views
///
/// Composed from:
/// - LSCard wrapper (surface-card bg, border-default, elev-card, 14pt radius)
/// - LSMap preview (mode: .preview, polylines, cameraFit: .polyline)
/// - Title/subtitle rows (LSText with ui.title.md, instrument.sm)
/// - Difficulty tags (LSPill with semantic tokens)
/// - Optional saved state (LSIcon.heartFill)
///
/// Data model mirrors the Convex routes read type from server/convex/schema.ts
public struct LSRouteCard: View {
    @Environment(\.theme) private var theme

    private let route: Route

    public init(route: Route) {
        self.route = route
    }

    public var body: some View {
        LSCard(padding: .spacing4) {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                // Map preview
                mapPreview

                // Route info
                routeInfo
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("lsroutecard")
    }

    // MARK: - Map Preview

    private var mapPreview: some View {
        let mapHeight: CGFloat = 160

        return ZStack(alignment: .topLeading) {
            if !route.polyline.isEmpty {
                LSMap(
                    mode: .preview,
                    camera: defaultCamera,
                    cameraFit: .polyline(padding: .spacing3),
                    polylines: [
                        PolylineData(
                            coordinates: route.polyline,
                            variant: route.variant
                        ),
                    ],
                    annotations: mapAnnotations
                )
                .frame(height: mapHeight)
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
            } else {
                // Fallback placeholder when no polyline
                Rectangle()
                    .fill(LSSurfaceColorToken.card.resolved(in: theme))
                    .frame(height: mapHeight)
                    .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
                    .overlay {
                        VStack(spacing: theme.space.xs) {
                            LSIcon(name: .map, size: .md, color: .tertiary)
                            LSText("Map preview", variant: .label.sm, color: .tertiary)
                        }
                    }
            }
        }
    }

    // MARK: - Route Info

    private var routeInfo: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            // Title row with optional saved icon
            HStack(alignment: .top, spacing: theme.space.xs) {
                LSText(route.title, variant: .title.md)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if route.isSaved {
                    LSIcon(name: .heartFill, size: .sm, color: .signal)
                        .accessibilityLabel("Saved")
                }
            }

            // Subtitle row: distance + duration
            HStack(spacing: theme.space.xs) {
                LSText(formattedDistance, variant: .body.sm, color: .secondary)
                divider
                LSText(formattedDuration, variant: .body.sm, color: .secondary)
            }

            // Difficulty tags
            if let difficulty = route.difficulty {
                LSPill(size: .sm) {
                    LSText(difficulty.displayName, variant: .label.md)
                        .foregroundStyle(difficulty.color(in: theme))
                }
            } else if route.polyline.isEmpty {
                LSPill(size: .sm) {
                    LSText("Unknown", variant: .label.md, color: .subtle)
                }
            }
        }
    }

    // MARK: - Computed Properties

    private var defaultCamera: CameraPosition {
        let center = route.polyline.first ?? LatLng(lat: 37.7749, lon: -122.4194)
        return CameraPosition(center: center, zoom: 12)
    }

    private var mapAnnotations: [Annotation] {
        var annotations: [Annotation] = []

        if !route.polyline.isEmpty {
            // Start annotation
            annotations.append(
                Annotation(
                    kind: .start,
                    coordinate: route.polyline.first!,
                    label: nil
                )
            )

            // End annotation
            if route.polyline.count > 1 {
                annotations.append(
                    Annotation(
                        kind: .end,
                        coordinate: route.polyline.last!,
                        label: nil
                    )
                )
            }
        }

        return annotations
    }

    private var divider: some View {
        Rectangle()
            .fill(theme.colors.border.default)
            .frame(width: 1, height: 10)
    }

    private var formattedDistance: String {
        if route.distance == 0 {
            return "— mi"
        }
        let miles = Double(route.distance) / 1609.34
        return String(format: "%.0f mi", miles)
    }

    private var formattedDuration: String {
        if route.duration == 0 {
            return "—"
        }
        let hours = route.duration / 3600
        let minutes = (route.duration % 3600) / 60

        if hours > 0 {
            return String(format: "%dh %dm", hours, minutes)
        } else {
            return String(format: "%dm", minutes)
        }
    }
}

// MARK: - Route Data Model

public extension LSRouteCard {
    /// Route data model mirroring the Convex routes read type
    /// See server/convex/schema.ts and .spec/prds/v2/11-technical-requirements.md
    struct Route: Equatable, Sendable {
        public let id: String
        public let title: String
        public let distance: Int // meters
        public let duration: Int // seconds
        public let polyline: [LatLng]
        public let variant: RouteVariant
        public let difficulty: Difficulty?
        public var isSaved: Bool

        public init(
            id: String,
            title: String,
            distance: Int,
            duration: Int,
            polyline: [LatLng],
            variant: RouteVariant,
            difficulty: Difficulty?,
            isSaved: Bool
        ) {
            self.id = id
            self.title = title
            self.distance = distance
            self.duration = duration
            self.polyline = polyline
            self.variant = variant
            self.difficulty = difficulty
            self.isSaved = isSaved
        }
    }

    /// Route difficulty level
    enum Difficulty: String, Equatable, Sendable, CaseIterable {
        case easy
        case moderate
        case advanced

        public var displayName: String {
            switch self {
            case .easy:
                "Easy"
            case .moderate:
                "Moderate"
            case .advanced:
                "Challenging"
            }
        }

        public func color(in theme: Theme) -> Color {
            switch self {
            case .easy:
                LaneShadowTheme.color.route.alt1
            case .moderate:
                LaneShadowTheme.color.status.warning.default
            case .advanced:
                theme.colors.danger.default
            }
        }
    }
}
