import LaneShadowTheme
import SwiftUI

// MARK: - Auth Card Component

/**
 * Auth card molecule component
 *
 * Card container for authentication flows with optional icon, title, subtitle, and content.
 * Following the React Native component from react-native/components/ui/molecules/auth-card.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.surface.default` (background)
 *   - `theme.colors.border.default` (border)
 *   - `theme.colors.onSurface.default` (title/subtitle text)
 * - Layout:
 *   - Padding: 16pt
 *   - Border radius: 16pt
 *   - Border width: 1pt
 * - Typography:
 *   - Title: 16pt semibold
 *   - Subtitle: 14pt regular with 0.7 opacity
 * - Elevation:
 *   - Shadow radius 2pt, y offset 1pt
 *
 * ## Parameters
 * - title: Card title text
 * - subtitle: Optional subtitle/description text
 * - icon: Optional top icon view
 * - content: Card body content via ViewBuilder
 */
public struct LSAuthCard<Content: View>: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let subtitle: String?
    private let icon: AnyView?
    private let content: () -> Content

    public init(
        title: String,
        subtitle: String? = nil,
        icon: AnyView? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.content = content
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Icon area
            if let icon {
                HStack {
                    Spacer()
                    icon
                    Spacer()
                }
            }

            // Title and subtitle
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(theme.colors.onSurface.default)

                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.7))
                }
            }

            // Content area
            content()
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(theme.colors.surface.default)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(theme.colors.border.default, lineWidth: 1)
        )
        .shadow(
            color: Color.black.opacity(0.1),
            radius: 2,
            y: 1
        )
    }
}

// MARK: - Preview

#Preview("AuthCard - Basic") {
    LSAuthCard(title: "Welcome Back") {
        Text("Sign in to continue")
            .font(.body)
    }
    .laneShadowTheme()
    .padding()
}

#Preview("AuthCard - With Subtitle") {
    LSAuthCard(
        title: "Welcome Back",
        subtitle: "Enter your credentials to access your account"
    ) {
        Text("Sign in form goes here")
            .font(.body)
    }
    .laneShadowTheme()
    .padding()
}

#Preview("AuthCard - With Icon") {
    LSAuthCard(
        title: "Create Account",
        subtitle: "Join thousands of riders",
        icon: AnyView(
            Image(systemName: "person.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.blue)
        )
    ) {
        Text("Sign up form goes here")
            .font(.body)
    }
    .laneShadowTheme()
    .padding()
}

#Preview("AuthCard - Complete") {
    LSAuthCard(
        title: "Sign In",
        subtitle: "Welcome back to LaneShadow",
        icon: AnyView(
            Image(systemName: "motorcycle")
                .font(.system(size: 48))
                .foregroundStyle(Color.blue)
        )
    ) {
        VStack(spacing: 12) {
            Text("Email")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("user@example.com")
                .font(.body)
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)

            Text("Password")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("••••••••")
                .font(.body)
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
        }
    }
    .laneShadowTheme()
    .padding()
}
