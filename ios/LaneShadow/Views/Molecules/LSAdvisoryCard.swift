import LaneShadowTheme
import SwiftUI

/// LSAdvisoryCard — A weather advisory card for Idle V03.
///
/// Renders a tinted advisory card with a left border stripe,
/// used to communicate weather warnings or other advisories.
public struct LSAdvisoryCard: View {
    @Environment(\.theme) private var theme

    private let label: String
    private let body: String
    private let color: ThemeColor  // The base color (e.g., wx.rain)

    public init(
        label: String,
        body: String,
        color: ThemeColor = \.wx.rain
    ) {
        self.label = label
        self.body = body
        self.color = color
    }

    public var body: some View {
        HStack(alignment: .top, spacing: 0) {
            // Left border stripe
            Rectangle()
                .fill(theme.colors[keyPath: color])
                .frame(width: theme.borderWidth.lg)

            // Content area
            VStack(alignment: .leading, spacing: theme.space.sm) {
                // Label
                Text(label)
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors[keyPath: color])

                // Body
                Text(body)
                    .font(theme.type.opinion.sm.font)
                    .italic()
                    .foregroundStyle(theme.colors.content.primary)
            }
            .padding(theme.space.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                theme.colors[keyPath: color].tint.opacity(0.5)
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Advisory: \(label)")
        .accessibilityValue(body)
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 16) {
        LSAdvisoryCard(
            label: "Weather advisory",
            body: "I can still plan something, but shorter loops near home will beat anything with a pass today.",
            color: \.wx.rain
        )
        .padding()

        LSAdvisoryCard(
            label: "Wind advisory",
            body: "Strong crosswinds expected on coastal routes. Consider inland alternatives.",
            color: \.wx.wind
        )
        .padding()
    }
    .background(Color.gray.opacity(0.1))
}
