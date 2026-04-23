import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSButtonTests: XCTestCase {
    func test_primary_variant_resolves_action_primary_tokens() {
        let theme = Theme.shared
        let tokens = LSButtonStyle.tokens(for: .primary, in: theme)

        XCTAssertEqual(tokens.background, theme.colors.primary.default)
        XCTAssertEqual(tokens.foreground, theme.colors.onPrimary.default)
        XCTAssertEqual(LSButtonStyle.cornerRadius(for: .md, in: theme), theme.radius.md)
        XCTAssertEqual(LSButtonStyle.typography(for: .md, in: theme).fontSize, theme.type.label.md.fontSize)
        XCTAssertNotNil(LSButton(title: "Continue", variant: .primary, action: {}))
    }

    func test_primary_pressed_state_resolves_pressed_token() {
        let theme = Theme.shared
        let tokens = LSButtonStyle.tokens(for: .primary, state: .pressed, in: theme)

        XCTAssertEqual(
            tokens.background,
            theme.colors.primary.pressed ?? theme.colors.accent.pressed ?? theme.colors.primary.default
        )
    }

    func test_all_six_variants_resolve_distinct_button_tokens() {
        let theme = Theme.shared

        let expected: [(LSButtonVariant, Color, Color, Color, CGFloat)] = [
            (
                .primary,
                theme.colors.primary.default,
                theme.colors.onPrimary.default,
                theme.colors.border.default.opacity(0),
                0
            ),
            (
                .secondary,
                theme.colors.secondary.default,
                theme.colors.onSurface.default,
                theme.colors.border.default,
                theme.borderWidth.thin
            ),
            (
                .ghost,
                theme.colors.surface.default.opacity(0),
                theme.colors.onSurface.default,
                theme.colors.border.default.opacity(0),
                0
            ),
            (
                .accept,
                theme.colors.success.default,
                theme.colors.onPrimary.default,
                theme.colors.border.default.opacity(0),
                0
            ),
            (
                .destructive,
                theme.colors.danger.default,
                theme.colors.onPrimary.default,
                theme.colors.border.default.opacity(0),
                0
            ),
            (
                .outline,
                theme.colors.surface.default.opacity(0),
                theme.colors.onSurface.default,
                theme.colors.border.default,
                theme.borderWidth.thin
            ),
        ]

        for (variant, background, foreground, border, borderWidth) in expected {
            let tokens = LSButtonStyle.tokens(for: variant, in: theme)

            XCTAssertEqual(tokens.background, background)
            XCTAssertEqual(tokens.foreground, foreground)
            XCTAssertEqual(tokens.border, border)
            XCTAssertEqual(tokens.borderWidth, borderWidth)
        }
    }

    func test_disabled_state_suppresses_action_and_resolves_disabled_tokens() {
        let theme = Theme.shared
        let tokens = LSButtonStyle.tokens(for: .primary, state: .disabled, in: theme)
        var actionCount = 0

        LSButton.dispatch(isDisabled: true) {
            actionCount += 1
        }

        XCTAssertEqual(
            tokens.background,
            theme.colors.primary.disabled ?? theme.colors.secondaryContainer.default
        )
        XCTAssertEqual(
            tokens.foreground,
            theme.colors.onPrimary.disabled ?? theme.colors.onPrimary.default.opacity(theme.opacity.disabled)
        )
        XCTAssertEqual(actionCount, 0)
    }

    func test_outline_variant_with_leading_icon_renders_chip_layout() {
        let theme = Theme.shared
        let tokens = LSButtonStyle.tokens(for: .outline, in: theme)
        let withIconImage = hostedButtonImage(
            LSButton(title: "", variant: .outline, leadingIcon: .sparkle, action: {})
        )
        let withoutIconImage = hostedButtonImage(
            LSButton(title: "", variant: .outline, action: {})
        )

        XCTAssertEqual(tokens.border, theme.colors.border.default)
        XCTAssertEqual(tokens.borderWidth, theme.borderWidth.thin)
        XCTAssertEqual(tokens.background, theme.colors.surface.default.opacity(0))
        XCTAssertEqual(tokens.foreground, theme.colors.onSurface.default)
        XCTAssertEqual(LSButtonStyle.iconSize(for: .sm, in: theme), theme.iconSize.small)
        XCTAssertEqual(LSButtonStyle.labelSpacing(in: theme), theme.space.sm)
        XCTAssertEqual(LSButtonStyle.metrics(for: .sm, in: theme).horizontalPadding, theme.space.lg)
        XCTAssertEqual(LSButtonStyle.metrics(for: .md, in: theme).horizontalPadding, theme.space.lg)
        XCTAssertEqual(LSButtonStyle.metrics(for: .lg, in: theme).horizontalPadding, theme.space.lg)
        XCTAssertNotNil(withIconImage.cgImage)
        XCTAssertNotNil(withoutIconImage.cgImage)
        XCTAssertEqual(withIconImage.size, withoutIconImage.size)
    }

    func test_button_icon_slot_routes_through_lsicon_without_hidden_or_canvas_fallbacks() throws {
        let source = try String(contentsOfFile: buttonSourceFilePath, encoding: .utf8)

        XCTAssertTrue(source.contains("LSIcon(name: name, size: .sm, resolvedColorOverride: color)"))
        XCTAssertFalse(source.contains(".hidden()"))
        XCTAssertFalse(source.contains("LSButtonPlusIcon"))
        XCTAssertFalse(source.contains("LSButtonSparkleIcon"))
        XCTAssertFalse(source.contains("Canvas {"))
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

    private func hostedButtonImage(_ button: LSButton) -> UIImage {
        let rootView = ZStack(alignment: .topLeading) {
            Color.white
            button.laneShadowTheme()
        }
        .frame(width: 240, height: 80, alignment: .topLeading)

        let controller = UIHostingController(rootView: rootView)
        controller.loadViewIfNeeded()
        controller.view.frame = CGRect(x: 0, y: 0, width: 240, height: 80)
        controller.view.backgroundColor = .white
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
        let renderer = UIGraphicsImageRenderer(bounds: controller.view.bounds)
        return renderer.image { _ in
            controller.view.layer.render(in: UIGraphicsGetCurrentContext()!)
        }
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
}
