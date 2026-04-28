import LaneShadowTheme
import SwiftUI

/// LSAdvisoryCard — A weather advisory card for Idle V03.
///
/// Renders a tinted advisory card with a left border stripe,
/// used to communicate weather warnings or other advisories.
public struct LSAdvisoryCard: View {
    @Environment(\.theme) private var theme

    private let label: String
    private let advisoryBody: String
    private let advisoryColor: Color

    public init(
        label: String,
        body: String,
        color: Color = Color.blue
    ) {
        self.label = label
        advisoryBody = body
        advisoryColor = color
    }

    public var body: some View {
        HStack(alignment: .top, spacing: 0) {
            // Left border stripe
            Rectangle()
                .fill(advisoryColor)
                .frame(width: theme.borderWidth.thick)

            // Content area
            VStack(alignment: .leading, spacing: theme.space.sm) {
                // Label
                Text(label)
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(advisoryColor)

                // Body
                Text(advisoryBody)
                    .font(theme.type.opinion.sm.font)
                    .italic()
                    .foregroundStyle(LaneShadowTheme.color.content.primary)
            }
            .padding(theme.space.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                advisoryColor.opacity(0.15)
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Advisory: \(label)")
        .accessibilityValue(advisoryBody)
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 16) {
        LSAdvisoryCard(
            label: "Weather advisory",
            body: "I can still plan something, but shorter loops near home will beat anything with a pass today."
        )
        .padding()

        LSAdvisoryCard(
            label: "Wind advisory",
            body: "Strong crosswinds expected on coastal routes. Consider inland alternatives.",
            color: Color.orange
        )
        .padding()
    }
    .background(Color.gray.opacity(0.1))
}
