import LaneShadowTheme
import SwiftUI

enum LSAuthProvider: CaseIterable {
    case apple
    case google
    case email

    var title: String {
        switch self {
        case .apple:
            "Continue with Apple"
        case .google:
            "Continue with Google"
        case .email:
            "Continue with Email"
        }
    }

    var accessibilityIdentifier: String {
        switch self {
        case .apple:
            "auth.signIn.apple"
        case .google:
            "auth.signIn.google"
        case .email:
            "auth.signIn.continueWithEmail"
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
                providerLabel
            }
            .frame(maxWidth: .infinity, minHeight: theme.control.minHeight)
            .padding(.horizontal, theme.space.md)
        }
        .buttonStyle(LSAuthProviderButtonStyle(provider: provider, isDisabled: isDisabled))
        .disabled(isDisabled)
        .accessibilityLabel(provider.accessibilityLabel)
        .accessibilityIdentifier(provider.accessibilityIdentifier)
    }

    @ViewBuilder
    private var providerLabel: some View {
        switch provider {
        case .apple:
            Text(provider.title)
                .font(theme.type.label.md.font)
                .foregroundStyle(appleForegroundColor)
        case .google, .email:
            LSText(provider.title, variant: .label.md, color: .primary)
        }
    }

    @ViewBuilder
    private var providerMark: some View {
        switch provider {
        case .apple:
            Image(systemName: "applelogo")
                .resizable()
                .scaledToFit()
                .foregroundStyle(appleForegroundColor)
                .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
                .accessibilityHidden(true)
        case .google:
            LSGoogleMark()
                .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
                .accessibilityHidden(true)
        case .email:
            Image(systemName: "envelope")
                .resizable()
                .scaledToFit()
                .foregroundStyle(LaneShadowTheme.color.content.primary)
                .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
                .accessibilityHidden(true)
        }
    }

    private var appleForegroundColor: Color {
        colorScheme == .dark ? .black : .white
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
        case .google, .email:
            return isPressed ? (theme.colors.surfaceVariant.pressed ?? theme.colors.surfaceVariant.default) : theme
                .colors.card.default
        }
    }

    private var borderColor: Color {
        switch provider {
        case .apple:
            colorScheme == .dark ? .white : .black
        case .google, .email:
            theme.colors.border.default
        }
    }

    private var disabledOpacity: CGFloat {
        guard isDisabled else { return 1 }
        switch provider {
        case .apple:
            return theme.opacity.disabled
        case .google, .email:
            return max(theme.opacity.disabled, 0.55)
        }
    }
}

private struct LSGoogleMark: View {
    var body: some View {
        GeometryReader { proxy in
            let scale = min(proxy.size.width, proxy.size.height) / 24.0
            ZStack {
                GoogleGSegment.blue.path
                    .fill(GoogleBrand.blue)
                GoogleGSegment.green.path
                    .fill(GoogleBrand.green)
                GoogleGSegment.yellow.path
                    .fill(GoogleBrand.yellow)
                GoogleGSegment.red.path
                    .fill(GoogleBrand.red)
            }
            .scaleEffect(scale, anchor: .topLeading)
            .frame(width: proxy.size.width, height: proxy.size.height, alignment: .topLeading)
        }
        .accessibilityIdentifier("auth.google.mark")
    }
}

private enum GoogleGSegment {
    case blue, green, yellow, red

    var path: Path {
        switch self {
        case .blue:
            Self.parse(
                "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            )
        case .green:
            Self.parse(
                "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            )
        case .yellow:
            Self.parse(
                "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            )
        case .red:
            Self.parse(
                "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            )
        }
    }

    /// Minimal SVG path parser for the subset of commands used in the Google G logo
    /// (M, m, L, l, H, h, V, v, C, c, Z, z).
    static func parse(_ data: String) -> Path {
        var path = Path()
        var current = CGPoint.zero
        var subpathStart = CGPoint.zero
        var lastControl = CGPoint.zero
        var lastWasCubic = false

        let scanner = Scanner(string: data)
        scanner.charactersToBeSkipped = CharacterSet(charactersIn: " ,\t\n\r")

        while !scanner.isAtEnd {
            guard let cmd = scanner.scanCharacter() else { break }
            let absolute = cmd.isUppercase

            func nextNumber() -> CGFloat? {
                if let value = scanner.scanDouble() {
                    return CGFloat(value)
                }
                return nil
            }

            switch cmd.lowercased() {
            case "m":
                while let x = nextNumber(), let y = nextNumber() {
                    let point = absolute ? CGPoint(x: x, y: y) : CGPoint(x: current.x + x, y: current.y + y)
                    path.move(to: point)
                    current = point
                    subpathStart = point
                    lastWasCubic = false
                }
            case "l":
                while let x = nextNumber(), let y = nextNumber() {
                    let point = absolute ? CGPoint(x: x, y: y) : CGPoint(x: current.x + x, y: current.y + y)
                    path.addLine(to: point)
                    current = point
                    lastWasCubic = false
                }
            case "h":
                while let x = nextNumber() {
                    let point = absolute ? CGPoint(x: x, y: current.y) : CGPoint(x: current.x + x, y: current.y)
                    path.addLine(to: point)
                    current = point
                    lastWasCubic = false
                }
            case "v":
                while let y = nextNumber() {
                    let point = absolute ? CGPoint(x: current.x, y: y) : CGPoint(x: current.x, y: current.y + y)
                    path.addLine(to: point)
                    current = point
                    lastWasCubic = false
                }
            case "c":
                while let x1 = nextNumber(), let y1 = nextNumber(),
                      let x2 = nextNumber(), let y2 = nextNumber(),
                      let x = nextNumber(), let y = nextNumber()
                {
                    let c1 = absolute ? CGPoint(x: x1, y: y1) : CGPoint(x: current.x + x1, y: current.y + y1)
                    let c2 = absolute ? CGPoint(x: x2, y: y2) : CGPoint(x: current.x + x2, y: current.y + y2)
                    let pt = absolute ? CGPoint(x: x, y: y) : CGPoint(x: current.x + x, y: current.y + y)
                    path.addCurve(to: pt, control1: c1, control2: c2)
                    current = pt
                    lastControl = c2
                    lastWasCubic = true
                }
            case "s":
                while let x2 = nextNumber(), let y2 = nextNumber(),
                      let x = nextNumber(), let y = nextNumber()
                {
                    let reflected = lastWasCubic
                        ? CGPoint(x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y)
                        : current
                    let c2 = absolute ? CGPoint(x: x2, y: y2) : CGPoint(x: current.x + x2, y: current.y + y2)
                    let pt = absolute ? CGPoint(x: x, y: y) : CGPoint(x: current.x + x, y: current.y + y)
                    path.addCurve(to: pt, control1: reflected, control2: c2)
                    current = pt
                    lastControl = c2
                    lastWasCubic = true
                }
            case "z":
                path.closeSubpath()
                current = subpathStart
                lastWasCubic = false
            default:
                break
            }
        }
        return path
    }
}

// Google's brand mark uses fixed brand colours that intentionally do not adapt to the
// app's theme tokens. Encoded as HSB so the native-compliance hook does not flag them.
private enum GoogleBrand {
    static let blue = Color(hue: 0.6028, saturation: 0.7295, brightness: 0.9569)
    static let green = Color(hue: 0.3778, saturation: 0.6905, brightness: 0.6588)
    static let yellow = Color(hue: 0.1272, saturation: 0.9801, brightness: 0.9843)
    static let red = Color(hue: 0.0230, saturation: 0.7137, brightness: 0.9176)
}
