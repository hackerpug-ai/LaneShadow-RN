import LaneShadowTheme
import SwiftUI

// MARK: - ErrorMessage Component

/**
 * ErrorMessage molecule component
 *
 * Displays error messages in a conversational format for chat interfaces.
 * Following React Native component from react-native/components/chat/error-message.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surfaceVariant.default`
 *   - Border: `theme.colors.warning.default`
 *   - Text: `theme.colors.onSurface.default`
 * - Layout:
 *   - Corner radius: `theme.radius.lg`
 *   - Padding: `theme.space.md`
 *   - Vertical margin: 4pt (equivalent to RN 4dp)
 *   - Max width: 80%
 * - Typography:
 *   - Text: `theme.type.body.md`
 * - Border:
 *   - Width: `theme.borderWidth.thin` (1dp)
 *
 * ## Parameters
 * - message: Error message text to display
 */
public struct LSErrorMessage: View {
    @Environment(\.theme) private var theme

    private let message: String

    public init(message: String) {
        self.message = message
    }

    // MARK: - Body

    public var body: some View {
        Text(message)
            .font(.system(size: theme.type.body.md.fontSize, weight: .regular))
            .foregroundStyle(theme.colors.onSurface.default)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(theme.space.md)
            .background(theme.colors.surfaceVariant.default)
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.lg)
                    .stroke(theme.colors.warning.default, lineWidth: theme.borderWidth.thin)
            )
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
            .frame(maxWidth: .infinity * 0.8, alignment: .leading)
            .padding(.vertical, 4)
            .accessibilityLabel("Error: \(message)")
    }
}

// MARK: - Preview

#Preview("ErrorMessage") {
    VStack(alignment: .leading, spacing: 16) {
        LSErrorMessage(message: "Something went wrong. Please try again.")
        LSErrorMessage(message: "Rate limit exceeded. Please upgrade your plan.")
        LSErrorMessage(message: "Could not parse your request. Try rephrasing.")
        LSErrorMessage(message: "Network timeout. Check your connection.")
    }
    .padding()
    .laneShadowTheme()
}

#Preview("ErrorMessage - Dark Mode") {
    VStack(alignment: .leading, spacing: 16) {
        LSErrorMessage(message: "Something went wrong. Please try again.")
        LSErrorMessage(message: "Rate limit exceeded. Please upgrade your plan.")
    }
    .padding()
    .preferredColorScheme(.dark)
    .laneShadowTheme()
}
