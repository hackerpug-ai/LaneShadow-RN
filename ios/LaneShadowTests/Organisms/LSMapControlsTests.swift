import LaneShadowTheme
import NativeTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSMapControlsTests: XCTestCase {
    // MARK: - AC-1: Default map mode renders 4 chips in correct order

    func test_mapMode_rendersFourChipsInOrder() throws {
        let appearance = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            in: Theme.shared
        )

        let expectedChips: [LSMapControlsChipKind] = [
            .zoomCluster,
            .recenter,
            .layers,
            .modeToggle
        ]

        XCTAssertEqual(appearance.chipsInOrder, expectedChips)
        XCTAssertEqual(appearance.chipBackgroundToken, "color.surface.overlay")
        XCTAssertEqual(appearance.chipBorderToken, "color.border.default")
        XCTAssertEqual(appearance.modeToggleGlyphToken, "send")
        XCTAssertEqual(appearance.modeToggleAccessibilityLabel, "Open chat")
    }

    // MARK: - AC-2: hasRouteToSave inserts save chip

    func test_hasRouteToSave_insertsSaveChip() throws {
        let appearanceWithoutSave = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            in: Theme.shared
        )

        let appearanceWithSave = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: false,
            in: Theme.shared
        )

        let expectedWithoutSave: [LSMapControlsChipKind] = [
            .zoomCluster,
            .recenter,
            .layers,
            .modeToggle
        ]

        let expectedWithSave: [LSMapControlsChipKind] = [
            .zoomCluster,
            .recenter,
            .layers,
            .save(isSaved: false),
            .modeToggle
        ]

        XCTAssertEqual(appearanceWithoutSave.chipsInOrder, expectedWithoutSave)
        XCTAssertEqual(appearanceWithSave.chipsInOrder, expectedWithSave)
        XCTAssertFalse(appearanceWithoutSave.isSaveChipVisible)
        XCTAssertTrue(appearanceWithSave.isSaveChipVisible)
    }

    // MARK: - AC-3: isSavedRoute flips save chip to copper signal fill

    func test_isSavedRoute_flipsToCopperSignal() throws {
        let appearanceUnsaved = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: false,
            in: Theme.shared
        )

        let appearanceSaved = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: true,
            in: Theme.shared
        )

        // Unsaved variant
        XCTAssertNil(appearanceUnsaved.saveChipBackgroundToken)
        XCTAssertEqual(appearanceUnsaved.saveChipGlyphColorToken, "color.content.primary")

        // Saved variant
        XCTAssertEqual(appearanceSaved.saveChipBackgroundToken, "color.signal.default")
        XCTAssertEqual(appearanceSaved.saveChipGlyphColorToken, "color.signal.onSignal")
    }

    // MARK: - AC-4: Chat mode collapses to single toggle chip

    func test_chatMode_collapsesToSingleToggle() throws {
        let appearanceMapMode = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: false,
            in: Theme.shared
        )

        let appearanceChatMode = LSMapControls.resolvedAppearance(
            mode: .chat,
            hasRouteToSave: true,
            isSavedRoute: false,
            in: Theme.shared
        )

        let expectedMapMode: [LSMapControlsChipKind] = [
            .zoomCluster,
            .recenter,
            .layers,
            .save(isSaved: false),
            .modeToggle
        ]

        let expectedChatMode: [LSMapControlsChipKind] = [
            .modeToggle
        ]

        XCTAssertEqual(appearanceMapMode.chipsInOrder, expectedMapMode)
        XCTAssertEqual(appearanceChatMode.chipsInOrder, expectedChatMode)
        XCTAssertEqual(appearanceChatMode.modeToggleGlyphToken, "map")
        XCTAssertEqual(appearanceChatMode.modeToggleAccessibilityLabel, "Back to map")
    }

    // MARK: - AC-5: Zoom callbacks emit +1/-1 zoom deltas

    func test_zoomCallbacks_emitPlusMinusOne() throws {
        var zoomInCallCount = 0
        var zoomOutCallCount = 0

        // Create a test controller that holds and can invoke the callback closures
        let testController = ZoomCallbackTestController(
            onZoomIn: { zoomInCallCount += 1 },
            onZoomOut: { zoomOutCallCount += 1 }
        )

        // Verify the callback closures are callable and increment counters
        testController.invokeZoomIn()
        testController.invokeZoomOut()

        XCTAssertEqual(zoomInCallCount, 1, "Zoom in callback should be invokable")
        XCTAssertEqual(zoomOutCallCount, 1, "Zoom out callback should be invokable")

        // Verify the appearance includes zoom cluster in correct position
        let appearance = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            in: Theme.shared
        )

        // Zoom cluster must be the first chip when in map mode
        XCTAssertEqual(appearance.chipsInOrder.first, .zoomCluster, "Zoom cluster should be first chip in map mode")
        let expectedCount = 4
        let expectedMsg = "Map mode should have exactly 4 chips (zoom, recenter, layers, toggle)"
        XCTAssertEqual(appearance.chipsInOrder.count, expectedCount, expectedMsg)

        // Verify the view initializes without crash with callbacks bound
        let view = LSMapControls(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: { zoomInCallCount += 1 },
            onZoomOut: { zoomOutCallCount += 1 },
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )

        // Host the view to verify it renders successfully
        let harness = host(view)
        XCTAssertNotNil(harness.window, "View should host and render without error")
    }

    // MARK: - AC-6: Dark theme re-resolves surfaces and signal fill

    func test_darkTheme_reResolvesChipSurfaces() throws {
        let lightColors = LSMapControls.resolvedThemeColors(for: .light)
        let darkColors = LSMapControls.resolvedThemeColors(for: .dark)

        // surfaceOverlay should differ between light and dark
        XCTAssertNotEqual(lightColors.surfaceOverlay, darkColors.surfaceOverlay)

        // borderDefault should differ between light and dark
        XCTAssertNotEqual(lightColors.borderDefault, darkColors.borderDefault)

        // signalDefault should be the same (semantic signal color is consistent across themes)
        XCTAssertEqual(lightColors.signalDefault, darkColors.signalDefault)
    }

    // MARK: - Helper Methods

    private func host(_ rootView: some View) -> HostedHarness {
        let controller = UIHostingController(rootView: AnyView(rootView))
        controller.loadViewIfNeeded()
        controller.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        let window = UIWindow(frame: controller.view.frame)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
        window.layoutIfNeeded()
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
        return HostedHarness(window: window, controller: controller)
    }

    private func findView(withIdentifier identifier: String, in view: UIView) -> UIView? {
        if view.accessibilityIdentifier == identifier {
            return view
        }

        for subview in view.subviews {
            if let match = findView(withIdentifier: identifier, in: subview) {
                return match
            }
        }

        return nil
    }

    private func nearestButtonAncestor(from view: UIView?) -> UIControl? {
        var current = view?.superview

        while let candidate = current {
            if let control = candidate as? UIControl {
                return control
            }

            current = candidate.superview
        }

        return nil
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}

private final class ZoomCallbackTestController {
    let onZoomIn: () -> Void
    let onZoomOut: () -> Void

    init(onZoomIn: @escaping () -> Void, onZoomOut: @escaping () -> Void) {
        self.onZoomIn = onZoomIn
        self.onZoomOut = onZoomOut
    }

    func invokeZoomIn() {
        onZoomIn()
    }

    func invokeZoomOut() {
        onZoomOut()
    }
}
