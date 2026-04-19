import LaneShadowTheme
import SwiftUI

// MARK: - Discovery Empty Overlay Component

/**
 * Discovery empty overlay molecule component
 *
 * Glassmorphic empty state overlay for zero route results.
 * Displays context-aware message with suggestion to adjust filters.
 * Semi-transparent design (map visible behind).
 *
 * Following React Native component from react-native/components/discovery/discovery-empty-overlay.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default` with 0.8 opacity (80%)
 * - Layout:
 *   - Full-screen ZStack with ignoresSafeArea
 *   - Safe area top padding for notch/status bar
 *   - Content padding: 24pt horizontal
 *   - Centered content with VStack
 * - Reuses existing LSEmptyState component internally
 *
 * ## Parameters
 * - visible: Whether overlay should be shown (false returns EmptyView)
 * - message: Context-aware message (default: "No routes in this area")
 * - suggestion: Suggestion subtitle (default: "Try adjusting your filters or zooming out")
 * - ctaLabel: Optional CTA button label
 * - onCtaPress: Optional CTA button callback
 * - testID: Optional test identifier for testing
 */
public struct LSDiscoveryEmptyOverlay: View {
    @Environment(\.theme) private var theme

    private let visible: Bool
    private let message: String
    private let suggestion: String
    private let ctaLabel: String?
    private let onCtaPress: (() -> Void)?
    private let testID: String

    private let contentPadding: CGFloat = 24

    public init(
        visible: Bool,
        message: String = "No routes in this area",
        suggestion: String = "Try adjusting your filters or zooming out",
        ctaLabel: String? = nil,
        onCtaPress: (() -> Void)? = nil,
        testID: String = "discovery-empty-overlay"
    ) {
        self.visible = visible
        self.message = message
        self.suggestion = suggestion
        self.ctaLabel = ctaLabel
        self.onCtaPress = onCtaPress
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        if !visible {
            EmptyView()
        } else {
            GeometryReader { _ in
                ZStack {
                    // Semi-transparent background (80% opacity)
                    theme.colors.surface.default.opacity(0.8)
                        .ignoresSafeArea()

                    // Centered content with safe area top padding
                    VStack {
                        Spacer()

                        LSEmptyState(
                            icon: "map.marker.path",
                            headline: message,
                            body: suggestion,
                            ctaLabel: ctaLabel,
                            onCtaPress: onCtaPress
                        )
                        .padding(.horizontal, contentPadding)
                        .accessibilityIdentifier("\(testID)-state")

                        Spacer()
                    }
                    .accessibilityIdentifier(testID)
                }
            }
            .ignoresSafeArea()
        }
    }
}

// MARK: - Preview

#Preview("DiscoveryEmptyOverlay - Default") {
    ZStack {
        Color.gray.opacity(0.3) // Simulate map background

        LSDiscoveryEmptyOverlay(
            visible: true
        )
    }
    .laneShadowTheme()
}

#Preview("DiscoveryEmptyOverlay - Custom message") {
    ZStack {
        Color.gray.opacity(0.3) // Simulate map background

        LSDiscoveryEmptyOverlay(
            visible: true,
            message: "No routes match your filters",
            suggestion: "Try clearing your filters to see more results"
        )
    }
    .laneShadowTheme()
}

#Preview("DiscoveryEmptyOverlay - With CTA") {
    ZStack {
        Color.gray.opacity(0.3) // Simulate map background

        LSDiscoveryEmptyOverlay(
            visible: true,
            message: "No routes in this area",
            suggestion: "Try adjusting your filters or zooming out",
            ctaLabel: "Adjust Filters",
            onCtaPress: {
                print("CTA tapped")
            }
        )
    }
    .laneShadowTheme()
}

#Preview("DiscoveryEmptyOverlay - Hidden") {
    ZStack {
        Color.gray.opacity(0.3) // Simulate map background

        LSDiscoveryEmptyOverlay(
            visible: false
        )
    }
    .laneShadowTheme()
}
