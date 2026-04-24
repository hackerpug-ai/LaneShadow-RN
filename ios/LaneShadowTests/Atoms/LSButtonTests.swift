import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSButtonTests: XCTestCase {
    func test_disabled_state_suppresses_action() {
        var actionCount = 0

        LSButton.dispatch(isDisabled: true) {
            actionCount += 1
        }

        XCTAssertEqual(actionCount, 0)
    }

    func test_button_icon_slot_routes_through_lsicon_without_hidden_or_canvas_fallbacks() throws {
        let source = try String(contentsOfFile: buttonSourceFilePath, encoding: .utf8)

        XCTAssertTrue(source.contains("LSIcon(name: name, size: .sm, resolvedColorOverride: color)"))
        XCTAssertTrue(source.contains(".onHover { isHovered = $0 }"))
        XCTAssertFalse(source.contains(".hidden()"))
        XCTAssertFalse(source.contains("LSButtonPlusIcon"))
        XCTAssertFalse(source.contains("LSButtonSparkleIcon"))
        XCTAssertFalse(source.contains("Canvas {"))
    }

    func test_lsicon_color_override_is_internal_to_the_module() throws {
        let source = try String(contentsOfFile: iconSourceFilePath, encoding: .utf8)
        let publicInitializerSignature = """
        public init(
                name: IconName,
                size: IconSize,
                color: IconContentColor = .primary
        """
        let internalOverrideSignature = """
        init(
                name: IconName,
                size: IconSize,
                resolvedColorOverride: Color
        """
        let removedPublicOverrideSignature = """
        public init(
                name: IconName,
                size: IconSize,
                color: IconContentColor = .primary,
                resolvedColorOverride: Color? = nil
        """

        XCTAssertTrue(source.contains(publicInitializerSignature))
        XCTAssertTrue(source.contains(internalOverrideSignature))
        XCTAssertFalse(source.contains(removedPublicOverrideSignature))
    }

    func test_minimum_touch_target_44pt_on_smallest_size() {
        let theme = Theme.shared
        let metrics = LSButtonStyle.metrics(for: .sm, in: theme)

        XCTAssertGreaterThanOrEqual(metrics.minWidth, theme.touchTarget.minTouchTarget)
        XCTAssertGreaterThanOrEqual(metrics.minHeight, theme.touchTarget.minTouchTarget)
        XCTAssertGreaterThanOrEqual(metrics.minWidth, 44)
        XCTAssertGreaterThanOrEqual(metrics.minHeight, 44)
    }

    func test_action_fires_exactly_once_per_press() {
        var actionCount = 0

        LSButton.dispatch(isDisabled: false) {
            actionCount += 1
        }

        XCTAssertEqual(actionCount, 1)
    }

    private var buttonSourceFilePath: String {
        let testsFileURL = URL(fileURLWithPath: #filePath)
        return testsFileURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/Views/Atoms/LSButton.swift")
            .path
    }

    private var iconSourceFilePath: String {
        let testsFileURL = URL(fileURLWithPath: #filePath)
        return testsFileURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/Views/Atoms/LSIcon.swift")
            .path
    }
}
