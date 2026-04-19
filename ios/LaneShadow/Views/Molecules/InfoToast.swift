import LaneShadowTheme
import SwiftUI

// MARK: - Info Toast Component

/**
 * Info Toast molecule component
 *
 * Displays informational messages with an icon, title, description, and optional close button.
 * Following React Native component from react-native/components/toasts/info-toast.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.info.default`
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
 * - title: Info title text
 * - description: Info description text
 * - showCloseButton: Whether to show close button (default: true)
 * - onClose: Optional callback when close button is tapped
 */
public struct LSInfoToast: View {
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
                    // Info icon
                    Image(systemName: "info.circle")
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
                    .accessibilityLabel("Close info toast")
                }
            }

            // Description
            Text(description)
                .font(theme.type.body.sm.font)
                .foregroundStyle(theme.colors.onPrimary.default)
        }
        .padding(theme.space.md)
        .background(theme.colors.info.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .shadow(
            color: Color.black.opacity(0.15),
            radius: 8,
            x: 0,
            y: 4
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Info: \(title). \(description)")
    }
}

// MARK: - Preview

#Preview("InfoToast - With Close Button") {
    VStack(spacing: 16) {
        LSInfoToast(
            title: "Info",
            description: "This is an informational message."
        )

        LSInfoToast(
            title: "Update Available",
            description: "A new version of the app is available for download."
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("InfoToast - Without Close Button") {
    VStack(spacing: 16) {
        LSInfoToast(
            title: "Info",
            description: "This toast has no close button.",
            showCloseButton: false
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("InfoToast - With Callback") {
    LSInfoToast(
        title: "Info",
        description: "This toast has a close callback.",
        onClose: {
            print("Close button tapped")
        }
    )
    .padding()
    .laneShadowTheme()
}
