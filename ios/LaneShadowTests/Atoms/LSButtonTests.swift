import LaneShadowTheme
import SwiftUI
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

        XCTAssertEqual(tokens.border, theme.colors.border.default)
        XCTAssertEqual(tokens.borderWidth, theme.borderWidth.thin)
        XCTAssertEqual(tokens.background, theme.colors.surface.default.opacity(0))
        XCTAssertEqual(tokens.foreground, theme.colors.onSurface.default)
        XCTAssertEqual(LSButtonStyle.iconSize(for: .sm, in: theme), theme.iconSize.small)
        XCTAssertEqual(LSButtonStyle.labelSpacing(in: theme), theme.space.sm)
        XCTAssertEqual(LSButtonStyle.metrics(for: .sm, in: theme).horizontalPadding, theme.space.lg)
        XCTAssertEqual(LSButtonStyle.metrics(for: .md, in: theme).horizontalPadding, theme.space.lg)
        XCTAssertEqual(LSButtonStyle.metrics(for: .lg, in: theme).horizontalPadding, theme.space.lg)
        XCTAssertNotNil(LSButton(title: "NEW", variant: .outline, leadingIcon: .sparkle, action: {}))
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
}
