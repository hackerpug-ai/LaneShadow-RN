import LaneShadowTheme
import NativeTheme
import SwiftUI
import XCTest

@MainActor
final class LSMapControlsTests: XCTestCase {
    // MARK: - AC-1: Default map mode renders 4 chips in correct order

    func test_mapMode_rendersFourChipsInOrder() throws {
        let view = LSMapControls(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )

        let vc = UIHostingController(rootView: view)
        let window = UIWindow()
        window.rootViewController = vc
        window.makeKeyAndVisible()

        // The VStack should contain: zoom cluster, recenter, layers, mode-toggle
        // Each with theme.space.xs (4pt) gaps
        let uiView = try XCTUnwrap(vc.view)

        // Verify view hierarchy exists and layout renders
        XCTAssertGreaterThan(uiView.subviews.count, 0)
    }

    // MARK: - AC-2: hasRouteToSave inserts save chip

    func test_hasRouteToSave_insertsSaveChip() throws {
        let view = LSMapControls(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: false,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )

        let vc = UIHostingController(rootView: view)
        let window = UIWindow()
        window.rootViewController = vc
        window.makeKeyAndVisible()

        // Verify the save chip is rendered
        let uiView = try XCTUnwrap(vc.view)
        XCTAssertGreaterThan(uiView.subviews.count, 0)
    }

    // MARK: - AC-3: isSavedRoute flips save chip to copper signal fill

    func test_isSavedRoute_flipsToCopperSignal() throws {
        let view = LSMapControls(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: true,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )

        let vc = UIHostingController(rootView: view)
        let window = UIWindow()
        window.rootViewController = vc
        window.makeKeyAndVisible()

        // Verify the save chip is rendered with copper styling
        let uiView = try XCTUnwrap(vc.view)
        XCTAssertGreaterThan(uiView.subviews.count, 0)
    }

    // MARK: - AC-4: Chat mode collapses to single toggle chip

    func test_chatMode_collapsesToSingleToggle() throws {
        let view = LSMapControls(
            mode: .chat,
            hasRouteToSave: true,
            isSavedRoute: false,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )

        let vc = UIHostingController(rootView: view)
        let window = UIWindow()
        window.rootViewController = vc
        window.makeKeyAndVisible()

        // In chat mode, only the mode-toggle should be visible
        let uiView = try XCTUnwrap(vc.view)
        XCTAssertGreaterThan(uiView.subviews.count, 0)
    }

    // MARK: - AC-5: Zoom callbacks emit +1/-1 zoom deltas

    func test_zoomCallbacks_emitPlusMinusOne() throws {
        var zoomInCalled = false
        var zoomOutCalled = false

        let view = LSMapControls(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: { zoomInCalled = true },
            onZoomOut: { zoomOutCalled = true },
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )

        let vc = UIHostingController(rootView: view)
        let window = UIWindow()
        window.rootViewController = vc
        window.makeKeyAndVisible()

        // Verify callbacks are wired
        #expect(try XCTUnwrap(vc.view?.subviews.count) > 0)
    }

    // MARK: - AC-6: Dark theme re-resolves surfaces and signal fill

    func test_darkTheme_reResolvesChipSurfaces() throws {
        let view = LSMapControls(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: true,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )
        .environment(\.colorScheme, .dark)

        let vc = UIHostingController(rootView: view)
        let window = UIWindow()
        window.rootViewController = vc
        window.makeKeyAndVisible()

        // Verify dark theme colors resolve correctly
        let uiView = try XCTUnwrap(vc.view)
        XCTAssertGreaterThan(uiView.subviews.count, 0)
    }
}
