import LaneShadowTheme
import SwiftUI

// MARK: - Chip Component

/**
 * Chip component
 *
 * Following RN wrapper API from react-native/components/ui/chip.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Chip.md
 *
 * ## Design Tokens Used
 * - Padding: `theme.space.md` (12) horizontal, 6 vertical
 * - Radius: `theme.radius.full` (9999)
 * - Border: `theme.borderWidth.thin` (1)
 * - Colors: `theme.colors.primary`, `theme.colors.border`, `theme.colors.onSurface`, `theme.colors.muted`
 * - Typography: 13pt medium (between label.sm 12 and body.sm 14)
 * - Icon: 16pt, `theme.space.xs` (4) gap
 * - Opacity: 12% (selected background), 40% (selected border)
 *
 * ## Parameters
 * - Parameters:
 *   - label: Text label to display
 *   - selected: Whether the chip is selected (default: false)
 *   - onPress: Action callback when chip is pressed
 *   - icon: Optional icon view to display
 *   - testID: Test identifier for UI testing
 */
public struct LSChip: View {
    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let label: String
    private let selected: Bool
    private let onPress: (() -> Void)?
    private let icon: (() -> AnyView)?
    private let testID: String?

    public init(
        _ label: String,
        selected: Bool = false,
        onPress: (() -> Void)? = nil,
        icon: (() -> AnyView)? = nil,
        testID: String? = nil
    ) {
        self.label = label
        self.selected = selected
        self.onPress = onPress
        self.icon = icon
        self.testID = testID
    }

    // MARK: - Color Computed Properties

    private var backgroundColor: Color {
        if selected {
            return theme.colors.primary.default.opacity(0.12)
        }

        if isPressed {
            return theme.colors.muted.pressed ?? theme.colors.muted.default
        }

        return .clear
    }

    private var borderColor: Color {
        if selected {
            return theme.colors.primary.default.opacity(0.4)
        }

        return theme.colors.border.default
    }

    private var textColor: Color {
        if selected {
            return theme.colors.primary.default
        }

        return theme.colors.onSurface.default
    }

    private var iconColor: Color {
        if selected {
            return theme.colors.primary.default
        }

        return theme.colors.onSurface.muted ?? theme.colors.onSurface.default
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if let icon {
                chipContent(
                    label: AnyView(
                        HStack(spacing: theme.space.xs) {
                            icon()
                                .foregroundStyle(iconColor)
                            Text(label)
                        }
                    )
                )
            } else {
                chipContent(
                    label: AnyView(
                        Text(label)
                    )
                )
            }
        }
        .accessibilityAddTraits(.isButton)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier(testID ?? "chip")
    }

    // MARK: - Chip Content

    @ViewBuilder
    private func chipContent(label: AnyView) -> some View {
        let content = label
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(textColor)
            .padding(.horizontal, theme.space.md)
            .padding(.vertical, 6)
            .background(backgroundColor)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(borderColor, lineWidth: theme.borderWidth.thin)
            )

        if let onPress = onPress {
            Button(action: onPress) {
                content
            }
            .buttonStyle(.plain)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in
                        if !selected {
                            isPressed = true
                        }
                    }
                    .onEnded { _ in
                        isPressed = false
                    }
            )
        } else {
            content
        }
    }
}
