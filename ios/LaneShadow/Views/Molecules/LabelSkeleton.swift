import LaneShadowTheme
import SwiftUI

// MARK: - Skeleton Width Enum

/**
 * Label skeleton width variants
 *
 * Following RN API from react-native/components/skeleton/label-skeleton.tsx
 * - short: 80pt
 * - medium: 160pt
 * - long: 240pt
 */
public enum LSSkeletonWidth {
    case short
    case medium
    case long

    var value: CGFloat {
        switch self {
        case .short: 80
        case .medium: 160
        case .long: 240
        }
    }
}

// MARK: - Label Skeleton Component

/**
 * Label skeleton loading placeholder molecule
 *
 * Shimmer effect for text placeholders with short/medium/long width variants.
 * Uses left-to-right shimmer sweep animation (1500ms cycle) with easeInOut.
 * Falls back to static placeholder on reduce-motion preference.
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.surfaceVariant.default` (background)
 * - Layout:
 *   - Default height: 28pt
 *   - Default corner radius: `theme.radius.md`
 *   - Width variants: short (80pt), medium (160pt), long (240pt)
 * - Animation:
 *   - Shimmer duration: 1500ms
 *   - Shimmer overlay: white at 10% opacity
 *
 * ## Parameters
 * - width: Width variant (short, medium, long) - defaults to medium
 * - height: Custom height in points - defaults to 28pt
 * - borderRadius: Custom corner radius - defaults to theme.radius.md
 * - testID: Test identifier for UI testing
 *
 * ## Accessibility
 * - Screen reader announces "Loading" via accessibilityLabel
 * - Respects accessibilityReduceMotion environment value
 * - Uses progressbar role for loading indication
 */
public struct LSLabelSkeleton: View {
    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let width: LSSkeletonWidth
    private let height: CGFloat
    private let borderRadius: CGFloat
    private let testID: String?

    @State private var shimmerPosition: CGFloat = -1

    public init(
        width: LSSkeletonWidth = .medium,
        height: CGFloat = 28,
        borderRadius: CGFloat? = nil,
        testID: String? = nil
    ) {
        self.width = width
        self.height = height
        // Use provided borderRadius or defer to theme in body
        self.borderRadius = 0 // Placeholder, will use theme in body
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        let resolvedRadius = borderRadius != 0 ? borderRadius : theme.radius.md

        RoundedRectangle(cornerRadius: resolvedRadius, style: .continuous)
            .fill(theme.colors.surfaceVariant.default)
            .frame(width: width.value, height: height)
            .overlay(shimmerOverlay(cornerRadius: resolvedRadius))
            .clipped()
            .accessibilityLabel("Loading")
            .accessibilityElement(children: .ignore)
            .accessibilityRole(.progressBar)
            .accessibilityIdentifier(testID ?? "label-skeleton")
    }

    // MARK: - Shimmer Overlay

    @ViewBuilder
    private func shimmerOverlay(cornerRadius: CGFloat) -> some View {
        if !reduceMotion {
            GeometryReader { geometry in
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.white.opacity(0),
                                Color.white.opacity(0.1),
                                Color.white.opacity(0)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * 0.5)
                    .offset(x: shimmerPosition * geometry.size.width * 1.5)
                    .onAppear {
                        // Animate shimmer from left to right
                        withAnimation(
                            .easeInOut(duration: 1.5)
                                .repeatForever(autoreverses: false)
                        ) {
                            shimmerPosition = 1
                        }
                    }
            }
        }
    }
}

// MARK: - Preview

#Preview("LabelSkeleton - Width Variants") {
    VStack(spacing: 16) {
        LSLabelSkeleton(width: .short)
            .accessibilityIdentifier("label-skeleton-short")

        LSLabelSkeleton(width: .medium)
            .accessibilityIdentifier("label-skeleton-medium")

        LSLabelSkeleton(width: .long)
            .accessibilityIdentifier("label-skeleton-long")
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
}

#Preview("LabelSkeleton - Custom Height") {
    VStack(spacing: 16) {
        LSLabelSkeleton(width: .medium, height: 20)
            .accessibilityIdentifier("label-skeleton-height-20")

        LSLabelSkeleton(width: .medium, height: 28)
            .accessibilityIdentifier("label-skeleton-height-28")

        LSLabelSkeleton(width: .medium, height: 36)
            .accessibilityIdentifier("label-skeleton-height-36")
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
}

#Preview("LabelSkeleton - Reduce Motion") {
    VStack(spacing: 16) {
        LSLabelSkeleton(width: .short)
            .accessibilityIdentifier("label-skeleton-reduce-motion-short")

        LSLabelSkeleton(width: .medium)
            .accessibilityIdentifier("label-skeleton-reduce-motion-medium")

        LSLabelSkeleton(width: .long)
            .accessibilityIdentifier("label-skeleton-reduce-motion-long")
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
    .accessibilityReduceMotion(true)
}
