import LaneShadowTheme
import NativeTheme
import SwiftUI
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
final class LSMapControlsTests: XCTestCase {
    func test_map_mode_places_zoom_cluster_last() {
        let appearance = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onRecenter: {},
            onLayers: {},
            onToggleView: {},
            in: Theme.shared
        )

        let expectedChips: [LSMapControlsChipKind] = [
            .recenter,
            .layers,
            .modeToggle,
            .zoomCluster,
        ]

        XCTAssertEqual(appearance.chipsInOrder, expectedChips)
        XCTAssertEqual(appearance.chipBackgroundToken, "color.surface.overlay")
        XCTAssertEqual(appearance.chipBorderToken, "color.border.default")
        XCTAssertEqual(appearance.modeToggleGlyphToken, "send")
        XCTAssertEqual(appearance.modeToggleAccessibilityLabel, "Open chat")
        XCTAssertEqual(appearance.chipsInOrder.last, .zoomCluster)
        XCTAssertGreaterThanOrEqual(appearance.chipSize, Theme.shared.touchTarget.minTouchTarget)
        XCTAssertEqual(appearance.chipGapSpacing, Theme.shared.space.sm)
    }

    func test_save_chip_stays_above_bottom_zoom_cluster() {
        let appearance = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: false,
            onRecenter: {},
            onLayers: {},
            onToggleView: {},
            in: Theme.shared
        )

        let expectedChips: [LSMapControlsChipKind] = [
            .recenter,
            .layers,
            .save(isSaved: false),
            .modeToggle,
            .zoomCluster,
        ]

        XCTAssertEqual(appearance.chipsInOrder, expectedChips)
        XCTAssertTrue(appearance.isSaveChipVisible)
        XCTAssertEqual(appearance.chipsInOrder[2], .save(isSaved: false))
        XCTAssertEqual(appearance.chipsInOrder.dropLast().last, .modeToggle)
        XCTAssertEqual(appearance.chipsInOrder.last, .zoomCluster)
    }

    func test_zoom_cluster_uses_vertical_layout() throws {
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
        .laneShadowTheme()

        let inspected = try view.inspect()
        let controls = try inspected.find(viewWithAccessibilityIdentifier: "lsmapcontrols")
        let zoomCluster = try controls.find(viewWithAccessibilityIdentifier: "lsmapcontrols-zoom-cluster")

        XCTAssertNoThrow(try zoomCluster.vStack())
        XCTAssertNoThrow(try zoomCluster.find(viewWithAccessibilityIdentifier: "lsmapcontrols-zoom-in"))
        XCTAssertNoThrow(try zoomCluster.find(viewWithAccessibilityIdentifier: "lsmapcontrols-zoom-out"))
        XCTAssertNoThrow(try zoomCluster.find(ViewType.Divider.self))

        let source = try mapControlsSource()
        XCTAssertTrue(source.contains("VStack(spacing: 0)"))
        XCTAssertTrue(source.contains(".frame(width: chipSize, height: chipSize * 2"))
        XCTAssertTrue(source.contains(".frame(height: theme.borderWidth.thin)"))
    }

    func test_zoom_callbacks_and_identifiers_remain_stable() throws {
        var zoomInCount = 0
        var zoomOutCount = 0

        let appearance = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: { zoomInCount += 1 },
            onZoomOut: { zoomOutCount += 1 },
            onRecenter: {},
            onLayers: {},
            onToggleView: {},
            in: Theme.shared
        )

        XCTAssertTrue(appearance.zoomCallbacksBound)
        XCTAssertEqual(appearance.chipsInOrder.last, .zoomCluster)

        let view = LSMapControls(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: { zoomInCount += 1 },
            onZoomOut: { zoomOutCount += 1 },
            onRecenter: {},
            onLayers: {},
            onSaveRoute: {},
            onToggleView: {}
        )
        .laneShadowTheme()

        let inspected = try view.inspect()
        let controls = try inspected.find(viewWithAccessibilityIdentifier: "lsmapcontrols")
        let zoomCluster = try controls.find(viewWithAccessibilityIdentifier: "lsmapcontrols-zoom-cluster")
        let zoomInButton = try zoomCluster.find(viewWithAccessibilityIdentifier: "lsmapcontrols-zoom-in")
        let zoomOutButton = try zoomCluster.find(viewWithAccessibilityIdentifier: "lsmapcontrols-zoom-out")

        XCTAssertEqual(try zoomInButton.accessibilityIdentifier(), "lsmapcontrols-zoom-in")
        XCTAssertEqual(try zoomOutButton.accessibilityIdentifier(), "lsmapcontrols-zoom-out")

        try zoomInButton.button().tap()
        try zoomOutButton.button().tap()

        XCTAssertEqual(zoomInCount, 1)
        XCTAssertEqual(zoomOutCount, 1)
    }

    func test_isSavedRoute_flipsToCopperSignal() {
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

        XCTAssertNil(appearanceUnsaved.saveChipBackgroundToken)
        XCTAssertEqual(appearanceUnsaved.saveChipGlyphColorToken, "color.content.primary")
        XCTAssertEqual(appearanceUnsaved.saveChipAccessibilityLabel, "Save route")

        XCTAssertEqual(appearanceSaved.saveChipBackgroundToken, "color.signal.default")
        XCTAssertEqual(appearanceSaved.saveChipGlyphColorToken, "color.signal.onSignal")
        XCTAssertEqual(appearanceSaved.saveChipAccessibilityLabel, "Saved route")
    }

    func test_hasNoRouteToSave_savedChipAccessibilityLabelIsNil() {
        let appearance = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            in: Theme.shared
        )

        XCTAssertNil(appearance.saveChipAccessibilityLabel)
        XCTAssertFalse(appearance.isSaveChipVisible)
    }

    func test_chatMode_collapsesToSingleToggle() {
        let appearanceMapMode = LSMapControls.resolvedAppearance(
            mode: .map,
            hasRouteToSave: true,
            isSavedRoute: false,
            onRecenter: {},
            onLayers: {},
            onToggleView: {},
            in: Theme.shared
        )

        let appearanceChatMode = LSMapControls.resolvedAppearance(
            mode: .chat,
            hasRouteToSave: true,
            isSavedRoute: false,
            onToggleView: {},
            in: Theme.shared
        )

        let expectedMapMode: [LSMapControlsChipKind] = [
            .recenter,
            .layers,
            .save(isSaved: false),
            .modeToggle,
            .zoomCluster,
        ]

        XCTAssertEqual(appearanceMapMode.chipsInOrder, expectedMapMode)
        XCTAssertEqual(appearanceChatMode.chipsInOrder, [.modeToggle])
        XCTAssertEqual(appearanceChatMode.modeToggleGlyphToken, "map")
        XCTAssertEqual(appearanceChatMode.modeToggleAccessibilityLabel, "Back to map")
    }

    func test_darkTheme_reResolvesChipSurfaces() {
        let lightColors = LSMapControls.resolvedThemeColors(for: .light)
        let darkColors = LSMapControls.resolvedThemeColors(for: .dark)

        XCTAssertNotEqual(lightColors.surfaceOverlay, darkColors.surfaceOverlay)
        XCTAssertNotEqual(lightColors.borderDefault, darkColors.borderDefault)
        XCTAssertEqual(lightColors.signalDefault, darkColors.signalDefault)
    }

    private func mapControlsSource() throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Organisms")
            .appendingPathComponent("LSMapControls.swift")

        return try String(contentsOf: fileURL, encoding: .utf8)
    }
}

extension LSMapControls: Inspectable {}
