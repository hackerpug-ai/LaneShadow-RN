import LaneShadowTheme
import SwiftUI

// MARK: - Banner Variant

/**
 * Banner variant enum
 *
 * Defines the four semantic variants for the Banner component.
 * Each variant maps to a theme color for tinting and borders.
 */
public enum LSBannerVariant: Sendable {
    case info
    case success
    case warning
    case error

    /// Returns the theme color associated with this variant
    var color: ThemeColors.KeyPath<ColorSet> {
        switch self {
        case .info: return \.info
        case .success: return \.success
        case .warning: return \.warning
        case .error: return \.danger
        }
    }
}

// MARK: - Banner Component

/**
 * Banner molecule component
 *
 * Displays contextual messages with optional icon, action button, and dismiss control.
 * Following React Native component from react-native/components/ui/molecules/banner.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: variant color at 10% opacity
 *   - Border: variant color at 30% opacity (1pt stroke)
 *   - Text: `theme.colors.onSurface.default`
 *   - Icon/Dismiss: variant color
 * - Layout:
 *   - Corner radius: 8pt
 *   - Padding: horizontal 12pt, vertical 8pt
 *   - Spacing: 8pt between elements
 * - Typography:
 *   - Message: 14pt regular
 *
 * ## Parameters
 * - message: Banner message text
 * - icon: Optional left icon (any SwiftUI View)
 * - action: Optional action button on right (any SwiftUI View)
 * - variant: Color variant (info, success, warning, error)
 * - dismissible: Whether to show close button (default: false)
 * - onDismiss: Optional callback when dismiss button tapped
 */
public struct LSBanner: View {
    @Environment(\.theme) private var theme

    private let message: String
    private let icon: AnyView?
    private let action: AnyView?
    private let variant: LSBannerVariant
    private let dismissible: Bool
    private let onDismiss: (() -> Void)?

    public init(
        message: String,
        icon: AnyView? = nil,
        action: AnyView? = nil,
        variant: LSBannerVariant = .info,
        dismissible: Bool = false,
        onDismiss: (() -> Void)? = nil
    ) {
        self.message = message
        self.icon = icon
        self.action = action
        self.variant = variant
        self.dismissible = dismissible
        self.onDismiss = onDismiss
    }

    // MARK: - Body

    public var body: some View {
        HStack(alignment: .top, spacing: 8) {
            // Optional left icon
            if let icon {
                icon
                    .frame(width: 20, height: 20)
            }

            // Message text area
            Text(message)
                .font(.system(size: 14, weight: .regular))
                .foregroundStyle(theme.colors.onSurface.default)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Optional action button
            if let action {
                action
            }

            // Dismiss button
            if dismissible {
                Button(action: {
                    onDismiss?()
                }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(variantColor)
                        .frame(width: 20, height: 20)
                }
                .buttonStyle(PlainButtonStyle())
                .accessibilityLabel("Dismiss")
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(variantColor.opacity(0.1))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(variantColor.opacity(0.3), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Banner: \(message)")
    }

    // MARK: - Computed Properties

    /// Returns the theme color for the current variant
    private var variantColor: Color {
        theme.colors[keyPath: variant.color]
    }
}

// MARK: - Preview

#Preview("Banner - Info") {
    VStack(spacing: 16) {
        LSBanner(message: "This is an informational banner")
        LSBanner(
            message: "Banner with icon",
            icon: AnyView(
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(Color.blue)
            )
        )
        LSBanner(
            message: "Dismissible banner with message",
            dismissible: true,
            onDismiss: {
                print("Dismissed")
            }
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Banner - Success") {
    LSBanner(
        message: "Your changes have been saved successfully",
        variant: .success,
        icon: AnyView(
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(Color.green)
        )
    )
    .padding()
    .laneShadowTheme()
}

#Preview("Banner - Warning") {
    LSBanner(
        message: "Your session will expire in 5 minutes",
        variant: .warning,
        icon: AnyView(
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(Color.orange)
        ),
        action: AnyView(
            Button("Renew") {
                print("Renew tapped")
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(Color.orange)
        )
    )
    .padding()
    .laneShadowTheme()
}

#Preview("Banner - Error") {
    LSBanner(
        message: "Failed to load content. Please try again.",
        variant: .error,
        icon: AnyView(
            Image(systemName: "xmark.circle.fill")
                .foregroundStyle(Color.red)
        ),
        dismissible: true,
        onDismiss: {
            print("Dismissed error")
        }
    )
    .padding()
    .laneShadowTheme()
}

#Preview("Banner - Complete") {
    VStack(spacing: 16) {
        LSBanner(
            message: "New ride available in your area",
            variant: .info,
            icon: AnyView(
                Image(systemName: "bell.fill")
                    .foregroundStyle(Color.blue)
            ),
            action: AnyView(
                Button("View") {
                    print("View tapped")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.blue)
            )
        )

        LSBanner(
            message: "Profile updated successfully",
            variant: .success,
            icon: AnyView(
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color.green)
            ),
            dismissible: true
        )

        LSBanner(
            message: "Connection lost. Retrying...",
            variant: .warning,
            icon: AnyView(
                Image(systemName: "wifi.exclamationmark")
                    .foregroundStyle(Color.orange)
            )
        )

        LSBanner(
            message: "Unable to complete request",
            variant: .error,
            icon: AnyView(
                Image(systemName: "xmark.octagon.fill")
                    .foregroundStyle(Color.red)
            ),
            action: AnyView(
                Button("Retry") {
                    print("Retry tapped")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.red)
            ),
            dismissible: true
        )
    }
    .padding()
    .laneShadowTheme()
}
