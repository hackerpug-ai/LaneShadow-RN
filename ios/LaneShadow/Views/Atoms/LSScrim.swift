import LaneShadowTheme
import SwiftUI
import UIKit

public struct LSScrim: View {
    @Environment(\.theme) private var theme

    public static let defaultOpacity = 0.35
    static let tapCaptureAccessibilityIdentifier = "LSScrim.tapCapture"

    private let opacity: Double
    private let blocking: Bool
    private let onTap: (() -> Void)?

    public init(
        opacity: Double = defaultOpacity,
        blocking: Bool = false,
        onTap: (() -> Void)? = nil
    ) {
        self.opacity = opacity
        self.blocking = blocking
        self.onTap = onTap
    }

    public var body: some View {
        Rectangle()
            .fill(Self.resolvedFill(in: theme, opacity: opacity))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay {
                if blocking {
                    ScrimTapCaptureView(onTap: onTap)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .allowsHitTesting(blocking)
            .accessibilityHidden(true)
    }
}

extension LSScrim {
    static func resolvedFill(in theme: Theme, opacity: Double) -> Color {
        Color(uiColor: resolvedUIColor(in: theme, opacity: opacity))
    }

    static func resolvedUIColor(
        in theme: Theme,
        opacity: Double,
        traits: UITraitCollection = UITraitCollection.current
    ) -> UIColor {
        let tokenColor = UIColor(theme.colors.scrim.default).resolvedColor(with: traits)

        if abs(opacity - defaultOpacity) < 0.000_1 {
            return tokenColor
        }

        return tokenColor.withAlphaComponent(opacity)
    }
}

private struct ScrimTapCaptureView: UIViewRepresentable {
    let onTap: (() -> Void)?

    func makeUIView(context: Context) -> ScrimTapCaptureControl {
        let control = ScrimTapCaptureControl()
        control.onTap = onTap
        return control
    }

    func updateUIView(_ uiView: ScrimTapCaptureControl, context _: Context) {
        uiView.onTap = onTap
    }
}

private final class ScrimTapCaptureControl: UIControl {
    var onTap: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        accessibilityIdentifier = LSScrim.tapCaptureAccessibilityIdentifier
        backgroundColor = .clear
        addAction(UIAction { [weak self] _ in
            self?.onTap?()
        }, for: .touchUpInside)
    }

    @available(*, unavailable)
    required init?(coder _: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

#Preview("Default") {
    ZStack {
        RoundedRectangle(cornerRadius: 20)
            .fill(Color(uiColor: .systemGray5))
            .frame(height: 220)

        LSScrim()
            .clipShape(RoundedRectangle(cornerRadius: 20))
    }
    .padding()
    .laneShadowTheme()
}
