import LaneShadowTheme
import SwiftUI
import UIKit

public struct LSSpinner: View {
    @Environment(\.theme) private var theme

    public init() {}

    public var body: some View {
        SpinnerIndicatorView(tint: Self.resolvedTint(in: theme))
            .accessibilityLabel("Loading")
    }
}

extension LSSpinner {
    static func resolvedTint(in theme: Theme) -> Color {
        theme.colors.primary.default
    }

    static func makeIndicator(tint: Color) -> UIActivityIndicatorView {
        let indicator = UIActivityIndicatorView(style: .medium)
        let resolvedTint: UIColor = .init(tint)
        indicator.hidesWhenStopped = false
        indicator.accessibilityIdentifier = "lsspinner-indicator"
        indicator.color = resolvedTint
        indicator.tintColor = resolvedTint
        indicator.startAnimating()
        return indicator
    }
}

private struct SpinnerIndicatorView: UIViewRepresentable {
    let tint: Color

    func makeUIView(context _: Context) -> UIActivityIndicatorView {
        LSSpinner.makeIndicator(tint: tint)
    }

    func updateUIView(_ uiView: UIActivityIndicatorView, context _: Context) {
        let configuredIndicator = LSSpinner.makeIndicator(tint: tint)
        uiView.color = configuredIndicator.color
        uiView.tintColor = configuredIndicator.tintColor
        if !uiView.isAnimating {
            uiView.startAnimating()
        }
    }
}
