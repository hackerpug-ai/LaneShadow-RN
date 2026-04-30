import LaneShadowTheme
import SwiftUI

enum LSAuthProvider: CaseIterable {
    case apple
    case google

    var title: String {
        switch self {
        case .apple:
            "Continue with Apple"
        case .google:
            "Continue with Google"
        }
    }

    var accessibilityIdentifier: String {
        switch self {
        case .apple:
            "auth.signIn.apple"
        case .google:
            "auth.signIn.google"
        }
    }

    var accessibilityLabel: String {
        title
    }
}

struct LSAuthProviderButton: View {
    @Environment(\.theme) private var theme

    let provider: LSAuthProvider
    var isDisabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: theme.space.sm) {
                providerMark
                LSText(provider.title, variant: .label.md, color: provider == .apple ? .onSignal : .primary)
            }
            .frame(maxWidth: .infinity, minHeight: theme.control.minHeight)
            .padding(.horizontal, theme.space.md)
            .background(backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.md)
                    .stroke(borderColor, lineWidth: theme.borderWidth.thin)
            )
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
            .opacity(isDisabled ? theme.opacity.disabled : 1)
        }
        .disabled(isDisabled)
        .accessibilityLabel(provider.accessibilityLabel)
        .accessibilityIdentifier(provider.accessibilityIdentifier)
    }

    private var backgroundColor: Color {
        switch provider {
        case .apple:
            theme.colors.primary.default
        case .google:
            theme.colors.card.default
        }
    }

    private var borderColor: Color {
        switch provider {
        case .apple:
            theme.colors.primary.default
        case .google:
            theme.colors.border.default
        }
    }

    @ViewBuilder
    private var providerMark: some View {
        switch provider {
        case .apple:
            Image(systemName: "applelogo")
                .font(theme.type.label.md.font)
                .foregroundStyle(ContentColor.onSignal.resolved(in: theme))
                .frame(width: theme.iconSize.small, height: theme.iconSize.small)
                .accessibilityHidden(true)
        case .google:
            LSGoogleMark()
                .frame(width: theme.iconSize.small, height: theme.iconSize.small)
                .accessibilityHidden(true)
        }
    }
}

private struct LSGoogleMark: View {
    @Environment(\.theme) private var theme

    var body: some View {
        HStack(spacing: 0) {
            theme.colors.primary.default
            theme.colors.success.default
            theme.colors.warning.default
            theme.colors.danger.default
        }
        .clipShape(Circle())
        .overlay(Circle().stroke(Color.clear, lineWidth: 0))
    }
}
