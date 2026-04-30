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
            colorScheme == .dark ? .onSignal : .primary
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
                .foregroundStyle(colorScheme == .dark ? Color.black : Color.white)
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
                return isPressed ? Color(white: 0.94) : .white
            }
            return isPressed ? Color(white: 0.16) : .black
        case .google:
            return isPressed ? (theme.colors.surfaceVariant.pressed ?? theme.colors.surfaceVariant.default) : theme
                .colors.card.default
        }
    }

    private var borderColor: Color {
        switch provider {
        case .apple:
            colorScheme == .dark ? .white : .black
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
        ZStack {
            Circle()
                .fill(theme.colors.card.default)

            Group {
                ArcSegment(start: 300, end: 360)
                    .stroke(GoogleBrand.blue, style: strokeStyle)
                ArcSegment(start: 0, end: 45)
                    .stroke(GoogleBrand.blue, style: strokeStyle)
                ArcSegment(start: 45, end: 140)
                    .stroke(GoogleBrand.red, style: strokeStyle)
                ArcSegment(start: 140, end: 220)
                    .stroke(GoogleBrand.yellow, style: strokeStyle)
                ArcSegment(start: 220, end: 300)
                    .stroke(GoogleBrand.green, style: strokeStyle)
                Rectangle()
                    .fill(GoogleBrand.blue)
                    .frame(width: theme.strokeWidth.thin * 2.5, height: theme.strokeWidth.thin * 6)
                    .offset(x: theme.strokeWidth.thin * 2.6, y: 0)
            }
        }
        .accessibilityIdentifier("auth.google.mark")
    }

    private var strokeStyle: StrokeStyle {
        StrokeStyle(lineWidth: theme.strokeWidth.thin * 2, lineCap: .round)
    }
}

private struct ArcSegment: Shape {
    let start: Double
    let end: Double

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2.15
        path.addArc(
            center: center,
            radius: radius,
            startAngle: .degrees(start),
            endAngle: .degrees(end),
            clockwise: false
        )
        return path
    }
}

private enum GoogleBrand {
    static let blue = Color(hue: 0.6028, saturation: 0.7295, brightness: 0.9569)
    static let green = Color(hue: 0.3778, saturation: 0.6905, brightness: 0.6588)
    static let yellow = Color(hue: 0.1272, saturation: 0.9801, brightness: 0.9843)
    static let red = Color(hue: 0.0230, saturation: 0.7137, brightness: 0.9176)
}
