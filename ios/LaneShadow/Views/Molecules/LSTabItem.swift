import LaneShadowTheme
import SwiftUI

public struct LSTabItem: View {
    @Environment(\.theme) private var theme

    private let icon: IconName
    private let label: String?
    private let isSelected: Bool
    private let isDisabled: Bool
    private let action: () -> Void

    public init(
        icon: IconName,
        label: String? = nil,
        selected: Bool = false,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.icon = icon
        self.label = label
        self.isSelected = selected
        self.isDisabled = disabled
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            VStack(spacing: theme.space.xs) {
                LSIcon(
                    name: icon,
                    size: .lg,
                    color: isSelected ? .signal : .tertiary
                )

                if let label {
                    LSText(label, variant: .label.sm)
                        .foregroundStyle(isSelected ? theme.colors.primary.default : ContentColor.tertiary.resolved(in: theme))
                }

                if isSelected {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(theme.colors.primary.default)
                        .frame(width: 24, height: theme.borderWidth.thick)
                        .frame(maxHeight: .infinity, alignment: .top)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, theme.space.sm)
            .padding(.horizontal, theme.space.sm)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(isDisabled)
        .opacity(isDisabled ? theme.opacity.disabled : 1)
        .accessibilityIdentifier("lstabitem-\(isSelected ? "selected" : "unselected")")
    }
}
