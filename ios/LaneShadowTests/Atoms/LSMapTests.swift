import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

final class LSMapTests: XCTestCase {
    func test_style_uri_resolves_to_available_mapbox_public_styles() {
        let light = resolveLSMapRenderModel(
            mode: .interactive,
            cameraFit: .static,
            polylines: [],
            annotations: [],
            colorScheme: .light,
            hasToken: true,
            previousStyleURI: nil
        )

        XCTAssertEqual(light.styleURI, lsMapLightStyleURI)
        XCTAssertEqual(light.styleURI, "mapbox://styles/mapbox/light-v11")
        XCTAssertNotEqual(light.styleURI, LaneShadowTheme.map.style.light)
        XCTAssertFalse(light.shouldReloadStyle)

        let dark = resolveLSMapRenderModel(
            mode: .interactive,
            cameraFit: .static,
            polylines: [],
            annotations: [],
            colorScheme: .dark,
            hasToken: true,
            previousStyleURI: light.styleURI
        )

        XCTAssertEqual(dark.styleURI, lsMapDarkStyleURI)
        XCTAssertEqual(dark.styleURI, "mapbox://styles/mapbox/dark-v11")
        XCTAssertNotEqual(dark.styleURI, LaneShadowTheme.map.style.dark)
        XCTAssertTrue(dark.shouldReloadStyle)
        XCTAssertNotEqual(light.styleURI, dark.styleURI)
        XCTAssertNil(dark.fallback)
    }

    func test_style_uri_is_not_unavailable_laneshadow_studio_style() {
        XCTAssertNotEqual(lsMapLightStyleURI, "mapbox://styles/mapbox/standard")
        XCTAssertNotEqual(lsMapDarkStyleURI, "mapbox://styles/mapbox/standard")
        XCTAssertTrue(lsMapLightStyleURI.hasPrefix("mapbox://styles/mapbox/"))
        XCTAssertTrue(lsMapDarkStyleURI.hasPrefix("mapbox://styles/mapbox/"))
        XCTAssertNotEqual(lsMapLightStyleURI, LaneShadowTheme.map.style.light)
        XCTAssertNotEqual(lsMapDarkStyleURI, LaneShadowTheme.map.style.dark)
    }

    func test_three_polylines_use_token_colors_and_dash_states() {
        let styles = [
            resolveLSMapPolylineStyle(
                for: PolylineData(
                    coordinates: [LatLng(lat: 37.7749, lon: -122.4194)],
                    variant: .best
                )
            ),
            resolveLSMapPolylineStyle(
                for: PolylineData(
                    coordinates: [LatLng(lat: 37.7749, lon: -122.4194)],
                    variant: .alt1
                )
            ),
            resolveLSMapPolylineStyle(
                for: PolylineData(
                    coordinates: [LatLng(lat: 37.7749, lon: -122.4194)],
                    variant: .alt2
                )
            ),
        ]

        XCTAssertEqual(styles[0].colorTokenPath, "color.signal.default")
        XCTAssertEqual(styles[1].colorTokenPath, "color.signal.whisper")
        XCTAssertEqual(styles[2].colorTokenPath, "color.signal.touring")
        XCTAssertEqual(styles[0].color, LaneShadowTheme.color.signal.default)
        XCTAssertEqual(styles[1].color, LaneShadowTheme.color.signal.whisper)
        XCTAssertEqual(styles[2].color, lsMapSignalTouringColor)
        XCTAssertEqual(styles[0].lineWidth, lsMapStrokeWidthMd)
        XCTAssertNil(styles[0].lineDasharray)

        let dashedStyle = resolveLSMapPolylineStyle(
            for: PolylineData(
                coordinates: [LatLng(lat: 37.7749, lon: -122.4194)],
                variant: .alt2,
                lineDasharray: lsMapPolylineDasharray
            )
        )

        XCTAssertEqual(dashedStyle.lineDasharray, lsMapPolylineDasharray)
    }

    func test_camera_fit_coordinates_follow_polyline_scope() {
        let firstPolyline = PolylineData(
            coordinates: [
                LatLng(lat: 37.7000, lon: -122.5000),
                LatLng(lat: 37.7500, lon: -122.4500),
            ],
            variant: .best
        )
        let secondPolyline = PolylineData(
            coordinates: [
                LatLng(lat: 37.7800, lon: -122.3800),
                LatLng(lat: 37.8100, lon: -122.3200),
            ],
            variant: .alt1
        )

        let singleFit = resolveLSMapCameraFitCoordinates(
            for: .polyline(padding: .spacing4),
            polylines: [firstPolyline, secondPolyline]
        )
        let multiFit = resolveLSMapCameraFitCoordinates(
            for: .polylines(padding: .spacing4),
            polylines: [firstPolyline, secondPolyline]
        )
        let staticFit = resolveLSMapCameraFitCoordinates(
            for: .static,
            polylines: [firstPolyline, secondPolyline]
        )

        XCTAssertEqual(singleFit, firstPolyline.coordinates)
        XCTAssertEqual(multiFit, firstPolyline.coordinates + secondPolyline.coordinates)
        XCTAssertNil(staticFit)
    }

    func test_annotations_render_with_status_colors_and_spec_sizes() {
        let start = resolveLSMapAnnotationStyle(for: .start)
        let end = resolveLSMapAnnotationStyle(for: .end)
        let waypoint = resolveLSMapAnnotationStyle(for: .waypoint)

        XCTAssertEqual(start.color, LaneShadowTheme.color.status.success.default)
        XCTAssertEqual(start.visual.outerDiameter, 14)
        XCTAssertEqual(start.visual.borderWidth, 2.5)
        XCTAssertNil(start.visual.innerDiameter)

        XCTAssertEqual(end.color, LaneShadowTheme.color.status.recording)
        XCTAssertEqual(end.visual.outerDiameter, 18)
        XCTAssertEqual(end.visual.borderWidth, 0)
        XCTAssertEqual(end.visual.innerDiameter, 6)

        XCTAssertEqual(waypoint.color, LaneShadowTheme.color.status.info.default)
        XCTAssertEqual(waypoint.visual.outerDiameter, 12)
        XCTAssertEqual(waypoint.visual.borderWidth, 0)
        XCTAssertNil(waypoint.visual.innerDiameter)
    }

    func test_camera_fit_polylines_uses_spacing4_padding_and_duration() {
        let fit = resolveLSMapCameraFit(for: .polylines(padding: .spacing4))

        XCTAssertEqual(fit.kind, "polylines")
        XCTAssertEqual(fit.padding, 16)
        XCTAssertEqual(fit.durationMs, 400)
    }

    func test_missing_token_renders_error_fallback_without_crash() {
        let renderModel = resolveLSMapRenderModel(
            mode: .preview,
            cameraFit: .static,
            polylines: [],
            annotations: [],
            colorScheme: .light,
            hasToken: false
        )

        XCTAssertEqual(renderModel.fallback?.error, .missingToken)
        XCTAssertEqual(renderModel.fallback?.title, "Map unavailable")
        XCTAssertNil(renderModel.styleURI)
    }

    func test_token_prefix_classifier_rejects_secret_token_for_ios_tiles() {
        XCTAssertEqual(resolveLSMapTokenPrefix("pk.public-token"), .publicToken)
        XCTAssertEqual(resolveLSMapTokenPrefix("sk.secret-token"), .secretToken)
        XCTAssertEqual(resolveLSMapTokenPrefix(""), .empty)
        XCTAssertEqual(resolveLSMapTokenPrefix("not-a-mapbox-token"), .unknown)
        XCTAssertEqual(
            resolveLSMapDebugMisconfigurationMessage(tokenPrefix: .secretToken),
            "Mapbox token misconfigured (`sk.`); see CAPS-S07-T15."
        )
        XCTAssertNil(resolveLSMapDebugMisconfigurationMessage(tokenPrefix: .publicToken))
    }

    func test_network_unavailable_renders_error_fallback_without_crash() {
        let renderModel = resolveLSMapRenderModel(
            mode: .preview,
            cameraFit: .static,
            polylines: [],
            annotations: [],
            colorScheme: .light,
            hasToken: true,
            isNetworkAvailable: false
        )

        XCTAssertEqual(renderModel.fallback?.error, .networkUnavailable)
        XCTAssertEqual(renderModel.fallback?.title, "Network unavailable")
        XCTAssertNil(renderModel.styleURI)
    }

    func test_scroll_isolation_and_preview_gesture_rules() {
        let preview = resolveLSMapInteraction(for: .preview)
        let interactive = resolveLSMapInteraction(for: .interactive)

        XCTAssertFalse(preview.gesturesEnabled)
        XCTAssertTrue(preview.scrollIsolationEnabled)
        XCTAssertTrue(interactive.gesturesEnabled)
        XCTAssertTrue(interactive.scrollIsolationEnabled)
    }
}
