import LaneShadowTheme
import SwiftUI

struct ThemeTextarea: View {
    @Environment(\.theme) private var theme

    let label: String?
    @Binding var text: String
    let placeholder: String
    let isError: Bool
    let isEditable: Bool
    let minHeight: CGFloat

    init(
        label: String? = nil,
        text: Binding<String>,
        placeholder: String = "",
        isError: Bool = false,
        isEditable: Bool = true,
        minHeight: CGFloat = 120
    ) {
        self.label = label
        _text = text
        self.placeholder = placeholder
        self.isError = isError
        self.isEditable = isEditable
        self.minHeight = minHeight
    }

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            if let label, !label.isEmpty {
                ThemeText(label, variant: .labelSm, color: theme.colors.muted.default)
            }

            ThemeInputChrome(
                leftIconName: String?.none,
                rightIconName: String?.none,
                isError: isError,
                isEditable: isEditable
            ) {
                ZStack(alignment: .topLeading) {
                    if text.isEmpty, !placeholder.isEmpty {
                        ThemeText(placeholder, variant: .bodyMd, color: theme.colors.muted.default)
                            .padding(.top, 2)
                    }

                    TextEditor(text: $text)
                        .scrollContentBackground(.hidden)
                        .foregroundStyle(isEditable ? theme.colors.onSurface
                            .default : (theme.colors.onSurface.disabled ?? theme.colors.onSurface.default))
                        .frame(minHeight: minHeight)
                        .disabled(!isEditable)
                        .accessibilityLabel(label ?? placeholder)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
