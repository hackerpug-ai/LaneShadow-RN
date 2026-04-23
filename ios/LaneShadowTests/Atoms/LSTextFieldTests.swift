import LaneShadowTheme
import XCTest
@testable import LaneShadow

@MainActor
final class LSTextFieldTests: XCTestCase {
    func test_default_state_resolves_default_tokens() {
        let theme = Theme.shared
        let tokens = LSTextField.resolvedTokens(for: .default, theme: theme)

        XCTAssertEqual(tokens.minHeight, theme.control.minHeight)
        XCTAssertEqual(tokens.horizontalPadding, theme.space.md)
        XCTAssertEqual(tokens.cornerRadius, theme.radius.sm)
        XCTAssertEqual(tokens.borderWidth, theme.borderWidth.thin)
        XCTAssertEqual(tokens.background, theme.colors.input.default)
        XCTAssertEqual(tokens.border, theme.colors.border.default)
        XCTAssertEqual(tokens.textStyle.fontSize, theme.type.body.lg.fontSize)
        XCTAssertNotNil(tokens.placeholderColor)
    }

    func test_focused_state_resolves_border_focus_copper() {
        let theme = Theme.shared
        let tokens = LSTextField.resolvedTokens(for: .focused, theme: theme)

        XCTAssertEqual(tokens.border, theme.colors.border.focus ?? theme.colors.primary.default)
    }

    func test_error_state_resolves_error_border_and_helper_text() throws {
        let theme = Theme.shared
        let tokens = LSTextField.resolvedTokens(for: .error, theme: theme)
        let source = try String(contentsOfFile: sourceFilePath, encoding: .utf8)

        XCTAssertEqual(tokens.border, theme.colors.danger.default)
        XCTAssertEqual(tokens.helperColor, theme.colors.danger.default)
        XCTAssertEqual(tokens.helperVariant, .body.sm)
        XCTAssertTrue(source.contains("LSText(helperText"))
    }

    func test_disabled_state_suppresses_input_and_resolves_disabled_tokens() {
        let theme = Theme.shared
        let tokens = LSTextField.resolvedTokens(for: .disabled, theme: theme)

        XCTAssertEqual(tokens.background, theme.colors.input.disabled ?? theme.colors.surfaceVariant.default)
        XCTAssertEqual(
            tokens.textColor,
            theme.colors.onSurface.disabled ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled)
        )
        XCTAssertEqual(
            tokens.border,
            theme.colors.border.disabled ?? theme.colors.border.default.opacity(theme.opacity.disabled)
        )
        XCTAssertEqual(LSTextField.commitChange(current: "locked", proposed: "edited", state: .disabled), "locked")
    }

    func test_leading_icon_slot_resolves_lsicon() throws {
        let theme = Theme.shared
        let tokens = LSTextField.resolvedTokens(for: .default, theme: theme)
        let source = try String(contentsOfFile: sourceFilePath, encoding: .utf8)

        XCTAssertEqual(tokens.iconSize, theme.iconSize.small)
        XCTAssertEqual(tokens.iconSpacing, theme.space.sm)
        XCTAssertTrue(source.contains("LSIcon(name: leadingIcon, size: .sm"))
    }

    func test_value_binding_reflects_typed_text_realtime() {
        XCTAssertEqual(LSTextField.commitChange(current: "", proposed: "a", state: .default), "a")
        XCTAssertEqual(LSTextField.commitChange(current: "a", proposed: "ab", state: .default), "ab")
        XCTAssertEqual(LSTextField.commitChange(current: "ab", proposed: "abc", state: .default), "abc")
    }

    private var sourceFilePath: String {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/Views/Atoms/LSTextField.swift")
            .path
    }
}
