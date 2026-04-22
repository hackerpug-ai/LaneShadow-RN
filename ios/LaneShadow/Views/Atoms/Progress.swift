import LaneShadowTheme
import SwiftUI

/// Progress component - Linear progress indicator with determinate and indeterminate modes
///
/// Following the translation matrix specification:
/// - Height: 16pt for both container and indicator
/// - Shape: Capsule (full rounded corners)
/// - Container background: theme.colors.secondary.default
/// - Indicator color: theme.colors.primary.default
/// - Determinate: 300ms easeInOut animation
/// - Indeterminate: 30% width sliding animation (1500ms cycle)
public struct LSProgress: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme

    private let value: CGFloat
    private let max: CGFloat
    private let indeterminate: Bool

    @State private var indeterminateOffset: CGFloat = -1.0

    // MARK: - Initialization

    /// Creates a Progress indicator
    /// - Parameters:
    ///   - value: Current progress value (0-100, default 0)
    ///   - max: Maximum value (default 100)
    ///   - indeterminate: Whether to show indeterminate animation (default false)
    public init(
        value: CGFloat = 0,
        max: CGFloat = 100,
        indeterminate: Bool = false
    ) {
        self.value = value
        self.max = max
        self.indeterminate = indeterminate
    }

    // MARK: - Body

    public var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Container background
                capsuleContainer
                    .foregroundStyle(theme.colors.secondary.default)

                // Progress indicator
                if indeterminate {
                    indeterminateIndicator(containerWidth: geometry.size.width)
                } else {
                    determinateIndicator
                }
            }
        }
        .frame(height: 16)
        .clipShape(Capsule(style: .continuous))
        .accessibilityElement(children: .ignore)
        .accessibilityValue("\(Int(fraction * 100))%")
        .onAppear {
            if indeterminate {
                startIndeterminateAnimation()
            }
        }
    }

    // MARK: - Subviews

    private var capsuleContainer: some View {
        Capsule(style: .continuous)
    }

    private var determinateIndicator: some View {
        Capsule(style: .continuous)
            .foregroundStyle(theme.colors.primary.default)
            .frame(maxWidth: .infinity)
            .mask(
                // Use frame to control the visible portion
                Capsule(style: .continuous)
                    .fill(Color.black)
                    .frame(width: fraction * 100, alignment: .leading)
            )
            .animation(.easeInOut(duration: 0.3), value: fraction)
    }

    private func indeterminateIndicator(containerWidth: CGFloat) -> some View {
        let indicatorWidth: CGFloat = containerWidth * 0.3
        let maxOffset: CGFloat = 1.0 + (indicatorWidth / containerWidth)

        return Capsule(style: .continuous)
            .foregroundStyle(theme.colors.primary.default)
            .frame(width: indicatorWidth)
            .offset(x: indeterminateOffset * containerWidth)
            .onAppear {
                // Animate from left (-100%) to right (+100% + indicator width)
                withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                    indeterminateOffset = maxOffset
                }
            }
    }

    // MARK: - Private Helpers

    private var fraction: CGFloat {
        let rawFraction = value / max
        return Swift.min(1.0, Swift.max(0.0, rawFraction))
    }

    private func startIndeterminateAnimation() {
        // Animation is triggered in onAppear of indeterminateIndicator
    }
}

// MARK: - Preview

#Preview("Determinate - 0%") {
    LSProgress(value: 0)
        .laneShadowTheme()
        .padding()
}

#Preview("Determinate - 25%") {
    LSProgress(value: 25)
        .laneShadowTheme()
        .padding()
}

#Preview("Determinate - 50%") {
    LSProgress(value: 50)
        .laneShadowTheme()
        .padding()
}

#Preview("Determinate - 75%") {
    LSProgress(value: 75)
        .laneShadowTheme()
        .padding()
}

#Preview("Determinate - 100%") {
    LSProgress(value: 100)
        .laneShadowTheme()
        .padding()
}

#Preview("Indeterminate") {
    LSProgress(indeterminate: true)
        .laneShadowTheme()
        .padding()
}

#Preview("Custom max value") {
    VStack(spacing: 16) {
        LSProgress(value: 5, max: 10)
        LSProgress(value: 50, max: 200)
        LSProgress(value: 150, max: 300)
    }
    .laneShadowTheme()
    .padding()
}

#Preview("All variants") {
    VStack(spacing: 24) {
        LSProgress(value: 0)
        LSProgress(value: 25)
        LSProgress(value: 50)
        LSProgress(value: 75)
        LSProgress(value: 100)
        LSProgress(indeterminate: true)
    }
    .laneShadowTheme()
    .padding()
}
