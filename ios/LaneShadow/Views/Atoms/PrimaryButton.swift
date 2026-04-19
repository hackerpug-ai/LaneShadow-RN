import LaneShadowTheme
import SwiftUI

// MARK: - Primary Button Component

/**
 * Primary button component with copper glow effect
 *
 * Full-width primary action button with distinctive copper shadow/glow.
 * Designed for main CTAs and primary actions in the LaneShadow app.
 *
 * ## Design Tokens Used
 * - Height: 56pt (fixed)
 * - Corner radius: `theme.radius.xl` (20)
 * - Horizontal padding: `theme.space.xl` (24)
 * - Background: `theme.colors.primary.default`
 * - Disabled background: `theme.colors.primary.default` with 0.5 opacity
 * - Text color: `theme.colors.onPrimary.default`
 * - Font: 16pt semibold
 * - Icon size: 20pt
 * - Icon spacing: `theme.space.sm` (8)
 * - Shadow color: Copper rgba(184,115,50,0.4)
 * - Shadow radius: 16
 * - Shadow y offset: 8
 *
 * ## Parameters
 * - Parameters:
 *   - title: Button text label
 *   - onPress: Action callback when button is pressed
 *   - icon: Optional SF Symbol name for 20pt icon
 *   - loading: Whether button is in loading state (shows ProgressView + "Loading...")
 *   - disabled: Whether button is disabled
 */
public struct LSPrimaryButton: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let onPress: () -> Void
    private let icon: String?
    private let loading: Bool
    private let disabled: Bool

    private let height: CGFloat = 56
    private let cornerRadius: CGFloat = 20
    private let horizontalPadding: CGFloat = 24
    private let iconSize: CGFloat = 20

    // Copper glow shadow color (rgba(184,115,50,0.4))
    private let glowColor = Color(red: 0.722, green: 0.451, blue: 0.2, opacity: 0.4)
    private let glowRadius: CGFloat = 16
    private let glowOffset: CGFloat = 8

    public init(
        _ title: String,
        onPress: @escaping () -> Void,
        icon: String? = nil,
        loading: Bool = false,
        disabled: Bool = false
    ) {
        self.title = title
        self.onPress = onPress
        self.icon = icon
        self.loading = loading
        self.disabled = disabled
    }

    // MARK: - Body

    public var body: some View {
        Button(action: {
            if !disabled, !loading {
                onPress()
            }
        }) {
            HStack(spacing: theme.space.sm) {
                if loading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: theme.colors.onPrimary.default))
                    Text("Loading...")
                } else {
                    if let icon {
                        Image(systemName: icon)
                            .font(.system(size: iconSize))
                    }
                    Text(title)
                }
            }
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(theme.colors.onPrimary.default)
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .padding(.horizontal, horizontalPadding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(backgroundColor)
            )
            .shadow(
                color: disabled || loading ? .clear : glowColor,
                radius: glowRadius,
                x: 0,
                y: glowOffset
            )
        }
        .buttonStyle(.plain)
        .disabled(disabled || loading)
        .accessibilityAddTraits(.isButton)
        .accessibilityAddTraits((disabled || loading) ? .notEnabled : [])
        .accessibilityLabel(loading ? "Loading" : title)
        .accessibilityIdentifier("primaryButton")
    }

    // MARK: - Computed Properties

    private var backgroundColor: Color {
        if disabled {
            return theme.colors.primary.default.opacity(0.5)
        }
        return theme.colors.primary.default
    }
}
