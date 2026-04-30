import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class LSTextFieldTests: XCTestCase {
    func test_error_state_resolves_danger_tokens() {
        let tokens = LSTextField.resolvedTokens(for: .error, theme: Theme.shared)
        XCTAssertEqual(tokens.border, Theme.shared.colors.danger.default)
    }

    func test_disabled_state_suppresses_input() {
        XCTAssertEqual(LSTextField.commitChange(current: "locked", proposed: "edited", state: .disabled), "locked")
    }

    func test_secure_entry_with_icons_and_helper_renders() {
        let view = LSTextField(
            value: .constant("secret"),
            placeholder: "Password",
            state: .focused,
            isSecureEntry: true,
            leadingIcon: .route,
            trailingIcon: .circle,
            helperText: "At least 8 characters"
        )
        .padding(Theme.shared.space.lg)
        .laneShadowTheme()

        assertSnapshot(matching: view, as: .image(precision: 0.95, traits: .init(userInterfaceStyle: .light)))
    }

    func test_formfield_auth_symbols_and_states_render() {
        let view = VStack(spacing: Theme.shared.space.md) {
            LSFormField(
                label: "Email",
                value: .constant("rider@example.com"),
                placeholder: "you@example.com",
                helperText: "We’ll check if this account exists.",
                state: .focused,
                leadingSymbolName: "mail"
            )
            LSFormField(
                label: "Password",
                value: .constant("hunter2"),
                placeholder: "••••••••",
                helperText: "At least 8 characters",
                isSecureEntry: true,
                leadingSymbolName: "lock",
                trailingSymbolName: "eye"
            )
            LSFormField(
                label: "Email",
                value: .constant("bad"),
                placeholder: "you@example.com",
                error: "Enter a valid email",
                leadingSymbolName: "mail"
            )
            LSFormField(
                label: "Email",
                value: .constant("locked@example.com"),
                placeholder: "you@example.com",
                helperText: "Disabled while submitting",
                state: .disabled,
                leadingSymbolName: "mail"
            )
        }
        .padding(Theme.shared.space.lg)
        .laneShadowTheme()

        assertSnapshot(matching: view, as: .image(precision: 0.95, traits: .init(userInterfaceStyle: .light)))
    }
}
