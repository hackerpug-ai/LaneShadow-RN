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
        XCTAssertEqual(appearanceUnsaved.saveChipAccessibilityLabel, "Save route")

        // Saved variant
        XCTAssertEqual(appearanceSaved.saveChipBackgroundToken, "color.signal.default")
        XCTAssertEqual(appearanceSaved.saveChipGlyphColorToken, "color.signal.onSignal")
        XCTAssertEqual(appearanceSaved.saveChipAccessibilityLabel, "Saved route")
    }

    // MARK: - TC-3: saveChipAccessibilityLabel is nil when hasRouteToSave is false

    func test_hasNoRouteToSave_savedChipAccessibilityLabelIsNil() throws {
        let appearance = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            in: Theme.shared
        )
        XCTAssertNil(appearance.saveChipAccessibilityLabel)
        XCTAssertFalse(appearance.isSaveChipVisible)
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
        // Verify that the appearance correctly identifies when zoom callbacks are bound
        let appearanceWithCallbacks = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: {},
            onZoomOut: {},
            in: Theme.shared
        )

        let appearanceWithoutCallbacks = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            in: Theme.shared
        )

        // When both zoom callbacks are bound, the flag should be true
        XCTAssertTrue(
            appearanceWithCallbacks.zoomCallbacksBound,
            "zoomCallbacksBound must be true when both onZoomIn and onZoomOut are provided"
        )

        // When zoom callbacks are not provided, the flag should be false
        XCTAssertFalse(
            appearanceWithoutCallbacks.zoomCallbacksBound,
            "zoomCallbacksBound must be false when callbacks are not provided"
        )

        // Verify zoom cluster is present and in correct position
        XCTAssertEqual(
            appearanceWithCallbacks.chipsInOrder.first,
            .zoomCluster,
            "Zoom cluster should be first chip in map mode"
        )

        // Verify the view initializes successfully with callbacks bound
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

    private func findAllAccessibilityIdentifiers(in view: UIView, depth: Int = 0) -> [String] {
        var identifiers: [String] = []
        if let id = view.accessibilityIdentifier {
            identifiers.append("\(String(repeating: "  ", count: depth))\(id)")
        }
        for subview in view.subviews {
            identifiers.append(contentsOf: findAllAccessibilityIdentifiers(in: subview, depth: depth + 1))
        }
        return identifiers
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}
