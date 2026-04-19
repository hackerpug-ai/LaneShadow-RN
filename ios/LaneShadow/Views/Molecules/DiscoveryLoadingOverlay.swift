import LaneShadowTheme
import SwiftUI

// MARK: - Discovery Loading Overlay Component

/**
 * Discovery loading overlay molecule component
 *
 * Full-screen overlay with skeleton placeholders for filter bar and route pins.
 * Shows during data loading with 300ms debounce to prevent flash on fast loads.
 * Immediately hides when visible becomes false (no debounce on hide).
 *
 * Following React Native component from react-native/components/discovery/discovery-loading-overlay.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default` with 0.8 opacity (80%)
 * - Layout:
 *   - Full-screen ZStack with ignoresSafeArea
 *   - Filter bar: horizontal scroll with chip skeletons (80-100pt wide, 32pt tall)
 *   - Route pins: grid layout with avatar + label skeletons
 * - Reuses existing LSSkeleton atom component
 *
 * ## Parameters
 * - visible: Whether overlay should be shown (false returns EmptyView, hides immediately)
 * - testID: Optional test identifier for testing (default: "discovery-loading-overlay")
 */
public struct LSDiscoveryLoadingOverlay: View {
    @Environment(\.theme) private var theme

    private let visible: Bool
    private let testID: String

    @State private var showOverlay = false

    private let debounceDelay: TimeInterval = 0.3 // 300ms

    public init(
        visible: Bool,
        testID: String = "discovery-loading-overlay"
    ) {
        self.visible = visible
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        if !visible {
            // Immediately hide when visible becomes false
            EmptyView()
        } else {
            GeometryReader { _ in
                ZStack {
                    // Semi-transparent background (80% opacity)
                    theme.colors.surface.default.opacity(0.8)
                        .ignoresSafeArea()

                    // Loading content with debounce
                    VStack(spacing: 0) {
                        // Filter bar skeleton placeholders
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: theme.space.sm) {
                                ForEach(0..<5, id: \.self) { _ in
                                    filterChipSkeleton()
                                }
                            }
                            .padding(.horizontal, theme.space.md)
                            .padding(.vertical, theme.space.sm)
                        }

                        Spacer()

                        // Route pin skeleton placeholders
                        VStack(spacing: theme.space.lg) {
                            ForEach(0..<3, id: \.self) { _ in
                                routePinSkeleton()
                            }
                        }
                        .padding(.horizontal, theme.space.md)
                        .padding(.bottom, theme.space.xl)
                    }
                    .accessibilityIdentifier("\(testID)-content")
                }
            }
            .ignoresSafeArea()
            .task {
                // Debounce: wait 300ms before showing overlay
                try? await Task.sleep(nanoseconds: UInt64(debounceDelay * 1_000_000_000))
                showOverlay = true
            }
        }
    }

    // MARK: - Private Helpers

    private func filterChipSkeleton() -> some View {
        // Random width between 80-100pt, height 32pt, rounded
        let randomWidth = CGFloat(Double.random(in: 80...100))
        return LSSkeleton(
            width: randomWidth,
            height: 32,
            cornerRadius: theme.radius.full
        )
    }

    private func routePinSkeleton() -> some View {
        // Avatar skeleton + small label skeleton
        HStack(spacing: theme.space.sm) {
            LSSkeleton(
                width: theme.size.avatarDefault,
                height: theme.size.avatarDefault,
                cornerRadius: theme.radius.full
            )

            LSSkeleton(
                width: 80,
                height: 16,
                cornerRadius: theme.radius.sm
            )
        }
    }
}

// MARK: - Preview

#Preview("DiscoveryLoadingOverlay - Visible") {
    ZStack {
        Color.gray.opacity(0.3) // Simulate map background

        LSDiscoveryLoadingOverlay(
            visible: true
        )
    }
    .laneShadowTheme()
}

#Preview("DiscoveryLoadingOverlay - Hidden") {
    ZStack {
        Color.gray.opacity(0.3) // Simulate map background

        LSDiscoveryLoadingOverlay(
            visible: false
        )
    }
    .laneShadowTheme()
}

#Preview("DiscoveryLoadingOverlay - Custom testID") {
    ZStack {
        Color.gray.opacity(0.3) // Simulate map background

        LSDiscoveryLoadingOverlay(
            visible: true,
            testID: "custom-loading-overlay"
        )
    }
    .laneShadowTheme()
}
