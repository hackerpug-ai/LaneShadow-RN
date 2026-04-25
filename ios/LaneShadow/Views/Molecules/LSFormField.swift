import LaneShadowTheme
import SwiftUI

public struct LSFormField: View {
    @Environment(\.theme) private var theme

    @Binding private var value: String
    private let label: String
    private let placeholder: String?
    private let error: String?
    private let isRequired: Bool

    public init(
        label: String,
        value: Binding<String>,
        placeholder: String? = nil,
        error: String? = nil,
        isRequired: Bool = false
    ) {
        self.label = label
        _value = value
        self.placeholder = placeholder
        self.error = error
        self.isRequired = isRequired
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
                state: error != nil ? .error : .default
            )

            // Error text
            if let error {
                HStack(spacing: theme.space.xs) {
                    LSIcon(name: .close, size: .xs, resolvedColorOverride: theme.colors.danger.default)
                    LSText(error, variant: .body.sm, color: .danger)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("lsformfield")
    }
}
