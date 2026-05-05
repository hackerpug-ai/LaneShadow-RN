import CoreGraphics
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
    public let lineDasharray: [Double]?

    public init(
        coordinates: [LatLng],
        variant: RouteVariant,
        strokeWidth: StrokeSize? = .md,
        lineDasharray: [Double]? = nil
    ) {
        self.coordinates = coordinates
        self.variant = variant
        self.strokeWidth = strokeWidth
        self.lineDasharray = lineDasharray
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

let lsMapCameraEaseDurationMs = 400
let lsMapLightStyleURI = "mapbox://styles/laneshadow/clxwarm01"
let lsMapDarkStyleURI = "mapbox://styles/laneshadow/clxnight02"
let lsMapStrokeWidthSm: CGFloat = 1
let lsMapStrokeWidthMd: CGFloat = 2
let lsMapStrokeWidthLg: CGFloat = 3
let lsMapPolylineDasharray: [Double] = [2, 1]
let lsMapSignalDefaultColorTokenPath = "color.signal.default"
let lsMapSignalWhisperColorTokenPath = "color.signal.whisper"
let lsMapSignalTouringColorTokenPath = "color.signal.touring"
let lsMapSignalTouringColor = LaneShadowTheme.color.signal.touring

struct LSMapPolylineStyle: Equatable {
    let colorTokenPath: String
    let color: Color
    let lineWidth: CGFloat
    let lineDasharray: [Double]?
}

struct LSMapAnnotationVisualStyle: Equatable {
    let outerDiameter: CGFloat
    let borderWidth: CGFloat
    let innerDiameter: CGFloat?
}

struct LSMapAnnotationStyle: Equatable {
    let color: Color
    let visual: LSMapAnnotationVisualStyle
}

struct LSMapCameraFitModel: Equatable {
    let kind: String
    let padding: CGFloat?
    let durationMs: Int?
}

struct LSMapFallbackModel: Equatable {
    let error: MapError
    let title: String
    let message: String
}

struct LSMapInteractionModel: Equatable {
    let gesturesEnabled: Bool
    let scrollIsolationEnabled: Bool
}

struct LSMapRenderModel: Equatable {
    let styleURI: String?
    let shouldReloadStyle: Bool
    let interaction: LSMapInteractionModel
    let cameraFit: LSMapCameraFitModel
    let polylines: [LSMapPolylineStyle]
    let annotations: [LSMapAnnotationStyle]
    let fallback: LSMapFallbackModel?
}

let lsMapFavoritePinColorTokenPath = "color.signal.default"
let lsMapFavoritePinBorderColorTokenPath = "color.surface.card"

@MainActor
public func LSMap(
    mode: MapMode,
    camera: CameraPosition,
    cameraFit: CameraFit = .static,
    polylines: [PolylineData] = [],
    annotations: [Annotation] = [],
    favoriteLocations: [FavoriteLocation] = [],
    onTap: ((LatLng) -> Void)? = nil
) -> some View {
    LSMapContainer(
        mode: mode,
        camera: camera,
        cameraFit: cameraFit,
        polylines: polylines,
        annotations: annotations,
        favoriteLocations: favoriteLocations,
        onTap: onTap
    )
}

private struct LSMapContainer: View {
    @Environment(\.colorScheme) private var colorScheme

    let mode: MapMode
    let camera: CameraPosition
    let cameraFit: CameraFit
    let polylines: [PolylineData]
    let annotations: [Annotation]
    let favoriteLocations: [FavoriteLocation]
    let onTap: ((LatLng) -> Void)?

    var body: some View {
        let token = resolveMapboxAccessToken()
        let renderModel = resolveLSMapRenderModel(
            mode: mode,
            cameraFit: cameraFit,
            polylines: polylines,
            annotations: annotations,
            colorScheme: colorScheme,
            hasToken: !token.isEmpty
        )

        if let fallback = renderModel.fallback {
            LSMapErrorView(
                fallback: fallback,
                mode: mode,
                camera: camera,
                cameraFit: cameraFit,
                polylines: polylines,
                annotations: annotations,
                favoriteLocations: favoriteLocations,
                onTap: onTap
            )
        } else {
            LSMapUIViewRepresentable(
                mode: mode,
                camera: camera,
                cameraFit: cameraFit,
                polylines: polylines,
                annotations: annotations,
                favoriteLocations: favoriteLocations,
                onTap: onTap,
                accessToken: token,
                renderModel: renderModel
            )
        }
    }
}

private struct LSMapErrorView: View {
    @Environment(\.theme) private var theme

    let fallback: LSMapFallbackModel
    let mode: MapMode
    let camera: CameraPosition
    let cameraFit: CameraFit
    let polylines: [PolylineData]
    let annotations: [Annotation]
    let favoriteLocations: [FavoriteLocation]
    let onTap: ((LatLng) -> Void)?

    var body: some View {
        LSGlassPanel(variant: .chrome) {
            VStack(alignment: .leading, spacing: theme.space.xs) {
                Text(fallback.title)
                    .font(theme.type.heading.sm.font)
                    .foregroundStyle(theme.colors.danger.default)

                Text(fallback.message)
                    .font(theme.type.body.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                Text(summaryLine)
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.muted.default)

                Text(cameraLine)
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.muted.default)
            }
            .frame(maxWidth: .infinity, minHeight: 180, alignment: .topLeading)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(fallback.title)
        .accessibilityHint(fallback.message)
    }

    private var summaryLine: String {
        let favoritesText = favoriteLocations.isEmpty ? "favorites off" : "\(favoriteLocations.count) favorites"
        let tapText = onTap == nil ? "tap idle" : "tap wired"
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

func resolveLSMapRenderModel(
    mode: MapMode,
    cameraFit: CameraFit,
    polylines: [PolylineData],
    annotations: [Annotation],
    colorScheme: ColorScheme,
    hasToken: Bool,
    isNetworkAvailable: Bool = true,
    previousStyleURI: String? = nil
) -> LSMapRenderModel {
    let fallback: LSMapFallbackModel? = if !hasToken {
        resolveLSMapFallback(for: .missingToken)
    } else if !isNetworkAvailable {
        resolveLSMapFallback(for: .networkUnavailable)
    } else {
        nil
    }

    if let fallback {
        return LSMapRenderModel(
            styleURI: nil,
            shouldReloadStyle: false,
            interaction: resolveLSMapInteraction(for: mode),
            cameraFit: resolveLSMapCameraFit(for: cameraFit),
            polylines: [],
            annotations: [],
            fallback: fallback
        )
    }

    let styleURI = resolveLSMapStyleURI(colorScheme: colorScheme)
    return LSMapRenderModel(
        styleURI: styleURI,
        shouldReloadStyle: previousStyleURI != nil && previousStyleURI != styleURI,
        interaction: resolveLSMapInteraction(for: mode),
        cameraFit: resolveLSMapCameraFit(for: cameraFit),
        polylines: polylines.map { resolveLSMapPolylineStyle(for: $0) },
        annotations: annotations.map { resolveLSMapAnnotationStyle(for: $0.kind) },
        fallback: nil
    )
}

func resolveLSMapStyleURI(colorScheme: ColorScheme) -> String {
    switch colorScheme {
    case .dark:
        lsMapDarkStyleURI
    default:
        lsMapLightStyleURI
    }
}

func resolveLSMapInteraction(for mode: MapMode) -> LSMapInteractionModel {
    switch mode {
    case .preview:
        LSMapInteractionModel(gesturesEnabled: false, scrollIsolationEnabled: true)
    case .interactive:
        LSMapInteractionModel(gesturesEnabled: true, scrollIsolationEnabled: true)
    }
}

func resolveLSMapPolylineStyle(for polyline: PolylineData) -> LSMapPolylineStyle {
    LSMapPolylineStyle(
        colorTokenPath: resolveLSMapRouteColorTokenPath(polyline.variant),
        color: resolveLSMapRouteColor(polyline.variant),
        lineWidth: resolveLSMapStrokeWidth(polyline.strokeWidth ?? .md),
        lineDasharray: polyline.lineDasharray
    )
}

func resolveLSMapAnnotationStyle(for kind: AnnotationKind) -> LSMapAnnotationStyle {
    switch kind {
    case .start:
        LSMapAnnotationStyle(
            color: LaneShadowTheme.color.status.success.default,
            visual: LSMapAnnotationVisualStyle(
                outerDiameter: 14,
                borderWidth: 2.5,
                innerDiameter: nil
            )
        )
    case .end:
        LSMapAnnotationStyle(
            color: LaneShadowTheme.color.status.recording,
            visual: LSMapAnnotationVisualStyle(
                outerDiameter: 18,
                borderWidth: 0,
                innerDiameter: 6
            )
        )
    case .waypoint:
        LSMapAnnotationStyle(
            color: LaneShadowTheme.color.status.info.default,
            visual: LSMapAnnotationVisualStyle(
                outerDiameter: 12,
                borderWidth: 0,
                innerDiameter: nil
            )
        )
    }
}

func resolveLSMapCameraFit(for fit: CameraFit) -> LSMapCameraFitModel {
    switch fit {
    case .static:
        LSMapCameraFitModel(kind: "static", padding: nil, durationMs: nil)
    case let .polyline(padding):
        LSMapCameraFitModel(
            kind: "polyline",
            padding: resolveLSMapPadding(for: padding),
            durationMs: lsMapCameraEaseDurationMs
        )
    case let .polylines(padding):
        LSMapCameraFitModel(
            kind: "polylines",
            padding: resolveLSMapPadding(for: padding),
            durationMs: lsMapCameraEaseDurationMs
        )
    }
}

func resolveLSMapCameraFitCoordinates(
    for fit: CameraFit,
    polylines: [PolylineData]
) -> [LatLng]? {
    switch fit {
    case .static:
        return nil
    case .polyline:
        return polylines.first(where: { $0.coordinates.count >= 2 })?.coordinates
    case .polylines:
        let coordinates = polylines.flatMap(\.coordinates)
        return coordinates.count >= 2 ? coordinates : nil
    }
}

func resolveLSMapFallback(for error: MapError) -> LSMapFallbackModel {
    switch error {
    case .missingToken:
        LSMapFallbackModel(
            error: error,
            title: "Map unavailable",
            message: "Mapbox access token is missing. Please configure MAPBOX_ACCESS_TOKEN in build settings."
        )
    case .networkUnavailable:
        LSMapFallbackModel(
            error: error,
            title: "Network unavailable",
            message: "A network connection is required to load the map."
        )
    case .styleLoadFailed:
        LSMapFallbackModel(
            error: error,
            title: "Map style unavailable",
            message: "The selected Mapbox style could not be loaded."
        )
    }
}

private func resolveLSMapPadding(for token: SpacingToken) -> CGFloat {
    switch token {
    case .spacing3:
        12
    case .spacing4:
        16
    case .spacing5:
        24
    }
}

private func resolveLSMapStrokeWidth(_ size: StrokeSize) -> CGFloat {
    switch size {
    case .sm:
        lsMapStrokeWidthSm
    case .md:
        lsMapStrokeWidthMd
    case .lg:
        lsMapStrokeWidthLg
    }
}

private func resolveLSMapRouteColor(_ variant: RouteVariant) -> Color {
    switch variant {
    case .best:
        LaneShadowTheme.color.signal.default
    case .alt1:
        LaneShadowTheme.color.signal.whisper
    case .alt2:
        lsMapSignalTouringColor
    case let .custom(token):
        switch token.path {
        case lsMapSignalWhisperColorTokenPath:
            LaneShadowTheme.color.signal.whisper
        case lsMapSignalTouringColorTokenPath:
            lsMapSignalTouringColor
        default:
            LaneShadowTheme.color.signal.default
        }
    }
}

private func resolveLSMapRouteColorTokenPath(_ variant: RouteVariant) -> String {
    switch variant {
    case .best:
        lsMapSignalDefaultColorTokenPath
    case .alt1:
        lsMapSignalWhisperColorTokenPath
    case .alt2:
        lsMapSignalTouringColorTokenPath
    case let .custom(token):
        token.path
    }
}

private extension LaneShadowTheme.color.signal {
    static var touring: Color {
        LaneShadowTheme.color.status.success.default
    }
}

private func resolveMapboxAccessToken() -> String {
    let infoToken = (Bundle.main.infoDictionary?["MBXAccessToken"] as? String)?
        .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if !infoToken.isEmpty {
        return infoToken
    }

    return MapboxConfig.accessToken.trimmingCharacters(in: .whitespacesAndNewlines)
}
