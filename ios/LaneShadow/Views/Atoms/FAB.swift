import LaneShadowTheme
import SwiftUI

// MARK: - FAB Component

/**
 * Floating Action Button component
 *
 * ## Design Tokens Used
 * - Size: 56×56pt (composed from theme.space.xxxxl - theme.space.md)
 * - Corner radius: theme.radius.xl (16)
 * - Background: theme.colors.primary.default
 * - Content color: theme.colors.onSurface.default
 * - Shadow: theme.elevation.level3
 * - Icon size: 24pt (theme.iconSize.medium)
 * - Spacing: theme.space.md (12, for icon-label gap)
 * - Typography: theme.type.label.sm (14pt, medium weight)
 * - Opacity: 0.5 when disabled
 *
 * ## Parameters
 * - icon: Optional SF Symbol name for icon (default: nil)
 * - label: Optional text label (default: nil)
 * - onPress: Action callback when FAB is pressed
 * - visible: Animated visibility (default: true)
 * - disabled: Whether FAB is disabled (default: false)
 * - accessibilityLabel: Accessibility label for screen readers
 * - testID: Test identifier for UI testing
 */
public struct LSFAB: View {
    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let icon: String?
    private let label: String?
    private let onPress: (() -> Void)?
    private let visible: Bool
    private let disabled: Bool
    private let accessibilityLabel: String?
    private let testID: String?

    public init(
        icon: String? = nil,
        label: String? = nil,
        onPress: (() -> Void)? = nil,
        visible: Bool = true,
        disabled: Bool = false,
        accessibilityLabel: String? = nil,
        testID: String? = nil
    ) {
        self.icon = icon
        self.label = label
        self.onPress = onPress
        self.visible = visible
        self.disabled = disabled
        self.accessibilityLabel = accessibilityLabel
        self.testID = testID
    }

    // MARK: - Layout Computed Properties

    private var fabSize: CGFloat {
        // 56×56pt as per spec
        theme.space.xxxxl - theme.space.md // 64 - 8 = 56
    }

    private var horizontalPadding: CGFloat {
        if label != nil {
            theme.space.lg // 16
        } else {
            0
        }
    }

    private var cornerRadius: CGFloat {
        theme.radius.xl // 16 as per spec
    }

    // MARK: - Body

    public var body: some View {
        Button(action: {
            onPress?()
        }) {
            fabContent
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .opacity(visible ? 1.0 : 0.0)
        .animation(.easeInOut, value: visible)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !disabled {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    isPressed = false
                }
        )
        .accessibilityAddTraits(.isButton)
        .accessibilityAddTraits(disabled ? .notEnabled : [])
        .accessibilityLabel(accessibilityLabel ?? computedAccessibilityLabel)
        .accessibilityIdentifier(testID ?? "fab")
    }

    // MARK: - FAB Content

    private var fabContent: some View {
        HStack(spacing: theme.space.md) {
            if let icon {
                Image(systemName: icon)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
            }

            if let label {
                Text(label.uppercased())
                    .font(.system(size: theme.type.label.sm.fontSize, weight: .medium))
                    .tracking(0.75)
            }
        }
        .foregroundStyle(theme.colors.onSurface.default)
        .frame(width: hasLabel ? nil : fabSize, height: fabSize)
        .padding(.horizontal, horizontalPadding)
        .background(theme.colors.primary.default)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .shadow(
            color: theme.elevation.level3.shadowColor,
            radius: theme.elevation.level3.radius,
            x: theme.elevation.level3.offsetX,
            y: theme.elevation.level3.offsetY
        )
        .opacity(shadowOpacity)
    }

    // MARK: - Helpers

    private var hasLabel: Bool {
        label != nil
    }

    private var computedAccessibilityLabel: String {
        if let label {
            return label
        }
        if let icon {
            return icon
        }
        return "Floating action button"
    }

    private var shadowOpacity: Double {
        if disabled {
            return theme.elevation.level3.opacity * 0.5
        }
        return theme.elevation.level3.opacity
    }
}
