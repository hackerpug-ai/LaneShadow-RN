import LaneShadowTheme
import SwiftUI

// MARK: - Card Skeleton Component

/**
 * Card skeleton loading placeholder molecule
 *
 * Shimmer effect for card content placeholders.
 * Mimics the layout of RouteAttachmentCard: badge row, title, description, stats.
 * Uses pulse opacity animation (1.5s cycle) with easeInOut.
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.surface.default` (card background)
 *   - `theme.colors.muted.default` (skeleton fill)
 *   - `theme.colors.border.default` (border)
 * - Layout:
 *   - Card corner radius: 16pt
 *   - Padding: 16pt (default), 12pt (compact)
 *   - Gap between elements: 10pt (default), 6pt (compact)
 * - Skeleton elements:
 *   - Corner radius: 8pt
 *   - Badge width: 60pt, height: 20pt
 *   - Title height: 16pt (default), 14pt (compact)
 *   - Description height: 14pt
 *   - Stats height: 13pt (default), 11pt (compact)
 *
 * ## Parameters
 * - compact: Show compact variant with reduced padding and gaps
 * - showBestBadge: Show best badge placeholder
 * - showWeatherBadge: Show weather badge placeholder
 *
 * ## Accessibility
 * - Screen reader announces "Loading" via accessibilityLabel
 */
public struct LSCardSkeleton: View {
    @Environment(\.theme) private var theme
    @State private var isPulsing = false

    private let compact: Bool
    private let showBestBadge: Bool
    private let showWeatherBadge: Bool

    public init(
        compact: Bool = false,
        showBestBadge: Bool = true,
        showWeatherBadge: Bool = true
    ) {
        self.compact = compact
        self.showBestBadge = showBestBadge
        self.showWeatherBadge = showWeatherBadge
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: compact ? 6 : 10) {
            // Badge row
            if showBestBadge || showWeatherBadge {
                HStack(spacing: 8) {
                    if showBestBadge {
                        bestBadgeSkeleton
                    }

                    if showWeatherBadge {
                        weatherBadgeSkeleton
                    }

                    Spacer()
                    statBar(width: 40, height: compact ? 11 : 13)
                }
            }

            // Title placeholder
            skeletonBar(width: 0.6, height: compact ? 14 : 16)

            // Description placeholders (only in non-compact)
            if !compact {
                VStack(alignment: .leading, spacing: 6) {
                    skeletonBar(width: 0.9, height: 14)
                    skeletonBar(width: 0.6, height: 14)
                }
            }

            // Stats placeholder
            statBar(width: 0.85, height: compact ? 11 : 13)
        }
        .padding(compact ? 12 : 16)
        .background(theme.colors.surface.default)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(theme.colors.border.default, lineWidth: 1)
        }
        .opacity(isPulsing ? 0.4 : 1.0)
        .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: isPulsing)
        .onAppear {
            isPulsing = true
        }
        .accessibilityLabel("Loading")
        .accessibilityElement(children: .ignore)
    }

    // MARK: - Private Views

    private var bestBadgeSkeleton: some View {
        HStack(spacing: 4) {
            skeletonBar(width: 40, height: 12)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .fill(theme.colors.muted.default)
        )
    }

    private var weatherBadgeSkeleton: some View {
        HStack(spacing: 4) {
            // Weather icon circle
            Circle()
                .fill(theme.colors.surfaceVariant.pressed)
                .frame(width: 14, height: 14)

            // Weather text bar
            skeletonBar(width: 40, height: 12)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .fill(theme.colors.muted.default)
        )
    }

    private func skeletonBar(width: CGFloat, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(theme.colors.muted.default)
            .frame(width: width, height: height)
    }

    private func statBar(width: CGFloat, height: CGFloat) -> some View {
        skeletonBar(width: width, height: height)
    }
}

// MARK: - Width Extension for Fractional Widths

private extension CGFloat {
    /// Converts a fractional value (0.0-1.0) to actual width based on a base width
    static func fractional(_ fraction: CGFloat, base: CGFloat = 300) -> CGFloat {
        base * fraction
    }
}

// MARK: - Preview

#Preview("CardSkeleton - Default") {
    VStack(spacing: 16) {
        LSCardSkeleton()
            .frame(width: 320)

        LSCardSkeleton(compact: true)
            .frame(width: 320)

        LSCardSkeleton(showBestBadge: false, showWeatherBadge: false)
            .frame(width: 320)
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
}

#Preview("CardSkeleton - Compact") {
    VStack(spacing: 16) {
        LSCardSkeleton(compact: true)
            .frame(width: 320)

        LSCardSkeleton(compact: true, showBestBadge: false)
            .frame(width: 320)
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
}

#Preview("CardSkeleton - No Badges") {
    LSCardSkeleton(showBestBadge: false, showWeatherBadge: false)
        .frame(width: 320)
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.gray.opacity(0.1))
        .laneShadowTheme()
}
