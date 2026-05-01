import LaneShadowTheme
import SwiftUI

public struct LSFormField: View {
    @Environment(\.theme) private var theme

    @Binding private var value: String
    private let label: String
    private let placeholder: String?
    private let error: String?
    private let helperText: String?
    private let isRequired: Bool
    private let state: InputState
    private let isSecureEntry: Bool
    private let leadingIcon: IconName?
    private let trailingIcon: IconName?
    private let leadingSymbolName: String?
    private let trailingSymbolName: String?
    private let inputAccessibilityIdentifier: String?

    public init(
        label: String,
        value: Binding<String>,
        placeholder: String? = nil,
        error: String? = nil,
        helperText: String? = nil,
        isRequired: Bool = false,
        state: InputState = .default,
        isSecureEntry: Bool = false,
        leadingIcon: IconName? = nil,
        trailingIcon: IconName? = nil,
        leadingSymbolName: String? = nil,
        trailingSymbolName: String? = nil,
        inputAccessibilityIdentifier: String? = nil
    ) {
        self.label = label
        _value = value
        self.placeholder = placeholder
        self.error = error
        self.helperText = helperText
        self.isRequired = isRequired
        self.state = state
        self.isSecureEntry = isSecureEntry
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.leadingSymbolName = leadingSymbolName
        self.trailingSymbolName = trailingSymbolName
        self.inputAccessibilityIdentifier = inputAccessibilityIdentifier
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            // Label row
            HStack(spacing: theme.space.xs) {
                LSText(label, variant: .label.md, color: .primary)

                if isRequired {
                    LSText("*", variant: .label.md, color: .danger)
                }
            }

            // Input field
            LSTextField(
                value: $value,
                placeholder: placeholder,
                state: error != nil ? .error : state,
                isSecureEntry: isSecureEntry,
                leadingIcon: leadingIcon,
                trailingIcon: trailingIcon,
                leadingSymbolName: leadingSymbolName,
                trailingSymbolName: trailingSymbolName,
                helperText: error == nil ? helperText : nil,
                inputAccessibilityIdentifier: inputAccessibilityIdentifier
            )

            // Error text
            if let error {
                HStack(spacing: theme.space.xs) {
                    LSIcon(name: .close, size: .xs, resolvedColorOverride: theme.colors.danger.default)
                    LSText(error, variant: .body.sm, color: .danger)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lsformfield")
    }
}
