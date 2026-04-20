import LaneShadowTheme
import SwiftUI

// MARK: - Error Toast Component

/**
 * Error Toast molecule component
 *
 * Displays error messages with an icon, title, description, and optional close button.
 * Following React Native component from react-native/components/toasts/error-toast.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.danger.default`
 *   - Text/Icons: `theme.colors.onPrimary.default`
 * - Layout:
 *   - Corner radius: `theme.radius.lg`
 *   - Padding: `theme.space.md` (internal padding)
 *   - Gap: `theme.space.xs` (vertical spacing between elements)
 *   - Margin: `theme.space.sm` (horizontal margins), `theme.space.md` (vertical margins from safe area top)
 * - Shadow: Color black with 4pt offset, 0.15 opacity, 8pt radius
 * - Typography:
 *   - Title: `theme.type.title.sm`
 *   - Description: `theme.type.body.sm`
 *
 * ## Parameters
 * - title: Error title text
 * - description: Error description text
 * - showCloseButton: Whether to show close button (default: true)
 * - onClose: Optional callback when close button is tapped
 */
public struct LSErrorToast: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let description: String
    private let showCloseButton: Bool
    private let onClose: (() -> Void)?

    public init(
        title: String,
        description: String,
        showCloseButton: Bool = true,
        onClose: (() -> Void)? = nil
    ) {
        self.title = title
        self.description = description
        self.showCloseButton = showCloseButton
        self.onClose = onClose
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            // Header: icon + title + optional close button
            HStack(alignment: .top, spacing: theme.space.sm) {
                // Icon and title
                HStack(alignment: .top, spacing: 8) {
                    // Error icon
                    Image(systemName: "xmark.circle")
                        .font(.system(size: 20))
                        .foregroundStyle(theme.colors.onPrimary.default)

                    // Title
                    Text(title)
                        .font(theme.type.title.sm.font)
                        .foregroundStyle(theme.colors.onPrimary.default)
                }

                Spacer()

                // Optional close button
                if showCloseButton {
                    Button(action: {
                        onClose?()
                    }) {
                        Image(systemName: "xmark.circle")
                            .font(.system(size: 20))
                            .foregroundStyle(theme.colors.onPrimary.default)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .accessibilityLabel("Close error toast")
                }
            }

            // Description
            Text(description)
                .font(theme.type.body.sm.font)
                .foregroundStyle(theme.colors.onPrimary.default)
        }
        .padding(theme.space.md)
        .background(theme.colors.danger.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .shadow(
            color: theme.elevation.level2.shadowColor,
            radius: theme.elevation.level2.radius,
            x: theme.elevation.level2.offsetX,
            y: theme.elevation.level2.offsetY
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Error: \(title). \(description)")
    }
}

// MARK: - Preview

#Preview("ErrorToast - With Close Button") {
    VStack(spacing: 16) {
        LSErrorToast(
            title: "Error",
            description: "Something went wrong. Please try again."
        )

        LSErrorToast(
            title: "Network Error",
            description: "Unable to connect to the server. Check your internet connection."
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("ErrorToast - Without Close Button") {
    VStack(spacing: 16) {
        LSErrorToast(
            title: "Error",
            description: "Something went wrong.",
            showCloseButton: false
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("ErrorToast - With Callback") {
    LSErrorToast(
        title: "Error",
        description: "This toast has a close callback.",
        onClose: {
            print("Close button tapped")
        }
    )
    .padding()
    .laneShadowTheme()
}
