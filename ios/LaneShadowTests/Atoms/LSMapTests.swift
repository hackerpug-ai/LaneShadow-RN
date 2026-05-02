import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

final class LSMapTests: XCTestCase {
    func test_style_tokens_switch_and_request_reload_when_theme_changes_in_place() {
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
        XCTAssertTrue(dark.shouldReloadStyle)
        XCTAssertNil(dark.fallback)
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

        XCTAssertEqual(styles[0].color, LaneShadowTheme.color.route.best)
        XCTAssertEqual(styles[1].color, LaneShadowTheme.color.route.alt1)
        XCTAssertEqual(styles[2].color, LaneShadowTheme.color.route.alt2)
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
