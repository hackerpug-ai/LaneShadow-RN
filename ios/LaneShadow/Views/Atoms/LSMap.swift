import LaneShadowTheme
import SwiftUI

public struct LatLng: Equatable, Hashable, Sendable {
    public let lat: Double
    public let lon: Double

    public init(lat: Double, lon: Double) {
        self.lat = lat
        self.lon = lon
    }
}

public struct ColorToken: Equatable, Hashable, Sendable {
    public let path: String

    public init(path: String) {
        self.path = path
    }
}

public enum StrokeSize: String, CaseIterable, Equatable, Sendable {
    case sm
    case md
    case lg
}

public enum SpacingToken: String, CaseIterable, Equatable, Sendable {
    case spacing3
    case spacing4
    case spacing5
}

public struct CameraPosition: Equatable, Sendable {
    public let center: LatLng
    public let zoom: Double
    public let pitch: Double?
    public let bearing: Double?

    public init(
        center: LatLng,
        zoom: Double,
        pitch: Double? = nil,
        bearing: Double? = nil
    ) {
        self.center = center
        self.zoom = zoom
        self.pitch = pitch
        self.bearing = bearing
    }
}

public enum AnnotationKind: String, CaseIterable, Equatable, Sendable {
    case start
    case end
    case waypoint
}

public struct Annotation: Equatable, Sendable {
    public let kind: AnnotationKind
    public let coordinate: LatLng
    public let label: String?

    public init(
        kind: AnnotationKind,
        coordinate: LatLng,
        label: String? = nil
    ) {
        self.kind = kind
        self.coordinate = coordinate
        self.label = label
    }
}

public enum RouteVariant: Equatable, Sendable {
    case best
    case alt1
    case alt2
    case custom(ColorToken)
}

public struct PolylineData: Equatable, Sendable {
    public let coordinates: [LatLng]
    public let variant: RouteVariant
    public let strokeWidth: StrokeSize?

    public init(
        coordinates: [LatLng],
        variant: RouteVariant,
        strokeWidth: StrokeSize? = .md
    ) {
        self.coordinates = coordinates
        self.variant = variant
        self.strokeWidth = strokeWidth
    }
}

public enum MapMode: String, CaseIterable, Equatable, Sendable {
    case preview
    case interactive
}

public enum CameraFit: Equatable, Sendable {
    case `static`
    case polyline(padding: SpacingToken)
    case polylines(padding: SpacingToken)
}

public enum MapError: String, CaseIterable, Equatable, Sendable {
    case missingToken
    case networkUnavailable
    case styleLoadFailed
}

@MainActor
public func LSMap(
    mode: MapMode,
    camera: CameraPosition,
    cameraFit: CameraFit = .static,
    polylines: [PolylineData] = [],
    annotations: [Annotation] = [],
    showFavorites: Bool = false,
    onTap: ((LatLng) -> Void)? = nil
) -> some View {
    LSMapStubView(
        mode: mode,
        camera: camera,
        cameraFit: cameraFit,
        polylines: polylines,
        annotations: annotations,
        showFavorites: showFavorites,
        onTap: onTap
    )
}

private struct LSMapStubView: View {
    @Environment(\.theme) private var theme

    let mode: MapMode
    let camera: CameraPosition
    let cameraFit: CameraFit
    let polylines: [PolylineData]
    let annotations: [Annotation]
    let showFavorites: Bool
    let onTap: ((LatLng) -> Void)?

    var body: some View {
        LSGlassPanel(variant: .chrome) {
            VStack(alignment: .leading, spacing: theme.space.xs) {
                Text("Map preview - UC-ATM-12")
                    .font(.headline)

                Text(summaryLine)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Text(cameraLine)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, minHeight: 180, alignment: .topLeading)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Map preview placeholder")
        .accessibilityHint("UC-ATM-12 replaces this fallback with the native map implementation.")
    }

    private var summaryLine: String {
        let favoritesText = showFavorites ? "favorites on" : "favorites off"
        let tapText = onTap == nil ? "tap disabled" : "tap ready"

        return "\(mode.label) | \(cameraFit.label) | \(polylines.count) polylines | \(annotations.count) annotations | \(favoritesText) | \(tapText)"
    }

    private var cameraLine: String {
        "Center \(camera.center.lat), \(camera.center.lon) at zoom \(camera.zoom)"
    }
}

private extension MapMode {
    var label: String {
        switch self {
        case .preview:
            "preview"
        case .interactive:
            "interactive"
        }
    }
}

private extension CameraFit {
    var label: String {
        switch self {
        case .static:
            "static"
        case let .polyline(padding):
            "polyline(\(padding.rawValue))"
        case let .polylines(padding):
            "polylines(\(padding.rawValue))"
        }
    }
}
