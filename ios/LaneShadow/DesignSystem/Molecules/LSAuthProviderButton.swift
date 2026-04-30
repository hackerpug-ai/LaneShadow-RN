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
    @Environment(\.colorScheme) private var colorScheme

    let provider: LSAuthProvider
    var isDisabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: theme.space.sm) {
                providerMark
                LSText(provider.title, variant: .label.md, color: providerLabelColor)
            }
            .frame(maxWidth: .infinity, minHeight: theme.control.minHeight)
            .padding(.horizontal, theme.space.md)
        }
        .buttonStyle(LSAuthProviderButtonStyle(provider: provider, isDisabled: isDisabled))
        .disabled(isDisabled)
        .accessibilityLabel(provider.accessibilityLabel)
        .accessibilityIdentifier(provider.accessibilityIdentifier)
    }

    private var providerLabelColor: ContentColor {
        switch provider {
        case .apple:
            colorScheme == .dark ? .primary : .onSignal
        case .google:
            .primary
        }
    }

    @ViewBuilder
    private var providerMark: some View {
        switch provider {
        case .apple:
            Image(systemName: "applelogo")
                .font(theme.type.label.md.font)
                .foregroundStyle(colorScheme == .dark ? ContentColor.primary.resolved(in: theme) : ContentColor.onSignal
                    .resolved(in: theme))
                .frame(width: theme.iconSize.small, height: theme.iconSize.small)
                .accessibilityHidden(true)
        case .google:
            LSGoogleMark()
                .frame(width: theme.iconSize.small, height: theme.iconSize.small)
                .accessibilityHidden(true)
        }
    }
}

private struct LSAuthProviderButtonStyle: ButtonStyle {
    @Environment(\.theme) private var theme
    @Environment(\.colorScheme) private var colorScheme

    let provider: LSAuthProvider
    let isDisabled: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(backgroundColor(isPressed: configuration.isPressed))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.md)
                    .stroke(borderColor, lineWidth: theme.borderWidth.thin)
            )
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
            .opacity(disabledOpacity)
    }

    private func backgroundColor(isPressed: Bool) -> Color {
        switch provider {
        case .apple:
            if colorScheme == .dark {
                return isPressed ? (theme.colors.surfaceVariant.pressed ?? theme.colors.surfaceVariant.default) : theme
                    .colors.surface.default
            }
            return isPressed ? (theme.colors.primary.pressed ?? theme.colors.primary.default) : theme.colors.primary
                .default
        case .google:
            return isPressed ? (theme.colors.surfaceVariant.pressed ?? theme.colors.surfaceVariant.default) : theme
                .colors.card.default
        }
    }

    private var borderColor: Color {
        switch provider {
        case .apple:
            colorScheme == .dark ? theme.colors.surface.default : theme.colors.primary.default
        case .google:
            theme.colors.border.default
        }
    }

    private var disabledOpacity: CGFloat {
        guard isDisabled else { return 1 }
        switch provider {
        case .apple:
            return theme.opacity.disabled
        case .google:
            return max(theme.opacity.disabled, 0.55)
        }
    }
}

private struct LSGoogleMark: View {
    @Environment(\.theme) private var theme

    var body: some View {
        Circle()
            .fill(
                AngularGradient(
                    gradient: Gradient(colors: [blue, green, yellow, red, blue]),
                    center: .center
                )
            )
            .overlay {
                Circle()
                    .inset(by: 4)
                    .fill(theme.colors.surface.default)
            }
            .overlay(alignment: .trailing) {
                Rectangle()
                    .fill(blue)
                    .frame(width: 3)
                    .padding(.trailing, 1)
            }
            .accessibilityIdentifier("auth.google.mark")
    }

    private var blue: Color {
        LaneShadowTheme.color.route.best
    }

    private var green: Color {
        LaneShadowTheme.color.route.alt1
    }

    private var yellow: Color {
        theme.colors.warning.default
    }

    private var red: Color {
        theme.colors.danger.default
    }
}
