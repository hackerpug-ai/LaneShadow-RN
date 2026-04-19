import LaneShadowTheme
import SwiftUI

// MARK: - Empty State Component

/**
 * Empty state molecule component
 *
 * Generic reusable empty state with icon, headline, body, and optional CTA button.
 * Following React Native component from react-native/components/ui/empty-state.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Icon: `theme.colors.onSurface.default` with 0.4 opacity
 *   - Headline: `theme.colors.onSurface.default`
 *   - Body: `theme.colors.onSurface.default` with 0.6 opacity
 *   - Button background: `theme.colors.primary.default`
 *   - Button text: `theme.colors.onPrimary.default`
 * - Layout:
 *   - VStack centered with spacer above and below
 *   - Icon size: 64pt
 *   - Spacing above headline: 16pt
 *   - Spacing above body: 8pt
 *   - Spacing above CTA: 24pt
 * - Typography:
 *   - Headline: 18pt semibold
 *   - Body: 14pt regular
 *
 * ## Parameters
 * - icon: SF Symbol name for the icon
 * - headline: Headline text
 * - body: Body description text
 * - ctaLabel: Optional CTA button text
 * - onCtaPress: Optional CTA button callback
 */
public struct LSEmptyState: View {
    @Environment(\.theme) private var theme

    private let icon: String
    private let headline: String
    private let body: String
    private let ctaLabel: String?
    private let onCtaPress: (() -> Void)?

    private let iconSize: CGFloat = 64
    private let headlineSpacing: CGFloat = 16
    private let bodySpacing: CGFloat = 8
    private let ctaSpacing: CGFloat = 24

    public init(
        icon: String,
        headline: String,
        body: String,
        ctaLabel: String? = nil,
        onCtaPress: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.headline = headline
        self.body = body
        self.ctaLabel = ctaLabel
        self.onCtaPress = onCtaPress
    }

    // MARK: - Body

    public var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Icon
            Image(systemName: icon)
                .font(.system(size: iconSize))
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.4))
                .accessibilityHidden(true)

            // Headline and body
            VStack(alignment: .center, spacing: bodySpacing) {
                Text(headline)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .multilineTextAlignment(.center)

                Text(body)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                    .multilineTextAlignment(.center)
            }
            .padding(.top, headlineSpacing)

            // Optional CTA button
            if let ctaLabel, let onCtaPress {
                Button(action: onCtaPress) {
                    Text(ctaLabel)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(theme.colors.onPrimary.default)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(theme.colors.primary.default)
                        )
                }
                .buttonStyle(.plain)
                .padding(.top, ctaSpacing)
                .accessibilityLabel(ctaLabel)
            }

            Spacer()
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(headline). \(body)")
    }
}

// MARK: - Preview

#Preview("EmptyState - Basic") {
    LSEmptyState(
        icon: "tray.fill",
        headline: "No items yet",
        body: "Items you add will appear here."
    )
    .laneShadowTheme()
}

#Preview("EmptyState - With CTA") {
    LSEmptyState(
        icon: "map.marker.path",
        headline: "No saved routes yet",
        body: "Plan a route and save it to see it here.",
        ctaLabel: "Plan your first route",
        onCtaPress: {
            print("CTA tapped")
        }
    )
    .laneShadowTheme()
}

#Preview("EmptyState - No favorites") {
    LSEmptyState(
        icon: "heart.slash.fill",
        headline: "No favorites",
        body: "Save rides to your favorites to quickly find them later."
    )
    .laneShadowTheme()
}

#Preview("EmptyState - No notifications") {
    LSEmptyState(
        icon: "bell.slash.fill",
        headline: "No notifications",
        body: "We'll notify you when there are updates.",
        ctaLabel: "Explore rides",
        onCtaPress: {
            print("Explore tapped")
        }
    )
    .laneShadowTheme()
}

#Preview("EmptyState - No search results") {
    LSEmptyState(
        icon: "magnifyingglass",
        headline: "No results found",
        body: "Try adjusting your search or filters to find what you're looking for."
    )
    .laneShadowTheme()
}
