import LaneShadowTheme
import SwiftUI

/// LSScenicDotStrip — 5-dot scenic rating indicator
///
/// Displays 5 dots representing scenic score (0-5). Filled dots use copper color
/// (signal.default), empty dots use border.strong. Each dot is 8pt diameter.
public struct LSScenicDotStrip: View {
    @Environment(\.theme) private var theme

    private let scenicScore: Double

    public init(scenicScore: Double) {
        self.scenicScore = scenicScore
    }

    public var body: some View {
        HStack(spacing: theme.space.xs) {
            ForEach(0 ..< 5, id: \.self) { index in
                dotView(isFilled: Double(index) < scenicScore)
            }

            Text("Scenic")
                .font(theme.type.label.sm.font)
                .foregroundStyle(ContentColor.secondary.resolved(in: theme))
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Scenic rating \(scenicScore, specifier: "%.1f") out of 5")
    }

    private func dotView(isFilled: Bool) -> some View {
        Circle()
            .fill(isFilled ? theme.domain.orange.default : Color.clear)
            .overlay(
                Circle()
                    .stroke(theme.colors.border.default, lineWidth: 1)
            )
            .frame(width: dotSize, height: dotSize)
    }

    private var dotSize: CGFloat {
        theme.iconSize.small / 2 // 8pt (half of small icon size)
    }
}

// MARK: - Preview

#Preview("4.8 scenic") {
    LSScenicDotStrip(scenicScore: 4.8)
        .laneShadowTheme()
        .padding()
}

#Preview("2.4 scenic") {
    LSScenicDotStrip(scenicScore: 2.4)
        .laneShadowTheme()
        .padding()
}

#Preview("Dark mode") {
    LSScenicDotStrip(scenicScore: 4.8)
        .laneShadowTheme()
        .preferredColorScheme(.dark)
        .padding()
}
