import LaneShadowTheme
import SwiftUI

// MARK: - Creative Label Fade In Component

/**
 * Fade-in animation for creative route labels
 *
 * Staggered reveal for multi-line labels with smooth transition from skeleton state.
 * Mimics the React Native component behavior from react-native/components/enrichment/creative-label-fade-in.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Label text: `theme.colors.onSurface.default`
 *   - Subtitle text: `theme.colors.onSurface.subtle` (with opacity)
 *   - Skeleton fill: `theme.colors.muted.default`
 * - Typography:
 *   - Label: `theme.type.display.md` (large display text)
 *   - Subtitle: `theme.type.body.md` (body text)
 *
 * ## Behavior
 * - When `visible` becomes true, fades in with opacity animation (0.3s default)
 * - If subtitle exists, staggers it by `staggerDelay` seconds (0.1s default)
 * - Shows skeleton placeholder when not visible
 * - Respects reduce-motion preference (instant reveal when enabled)
 *
 * ## Parameters
 * - label: The creative label text to display
 * - visible: Whether the label is loaded and ready to show
 * - subtitle: Optional secondary line
 * - staggerDelay: Delay between line animations in seconds (default 0.1)
 * - fadeDuration: Fade-in duration in seconds (default 0.3)
 *
 * ## Accessibility
 * - Screen reader announces "Route name: {label}" via accessibilityLabel
 */
public struct LSCreativeLabelFadeIn: View {
    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var labelVisible = false
    @State private var subtitleVisible = false

    private let label: String
    private let visible: Bool
    private let subtitle: String?
    private let staggerDelay: Double
    private let fadeDuration: Double

    public init(
        label: String,
        visible: Bool,
        subtitle: String? = nil,
        staggerDelay: Double = 0.1,
        fadeDuration: Double = 0.3
    ) {
        self.label = label
        self.visible = visible
        self.subtitle = subtitle
        self.staggerDelay = staggerDelay
        self.fadeDuration = fadeDuration
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            if visible {
                // Main label
                Text(label)
                    .font(theme.type.display.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                    .opacity(labelVisible ? 1 : 0)
                    .animation(.easeIn(duration: reduceMotion ? 0 : fadeDuration), value: labelVisible)
                    .accessibilityLabel("Route name: \(label)")
                    .accessibilityAddTraits(.isHeader)

                // Optional subtitle with stagger delay
                if let subtitle {
                    Text(subtitle)
                        .font(theme.type.body.md.font)
                        .foregroundStyle(
                            theme.colors.onSurface.subtle.opacity(0.7)
                        )
                        .opacity(subtitleVisible ? 1 : 0)
                        .animation(.easeIn(duration: reduceMotion ? 0 : fadeDuration), value: subtitleVisible)
                        .accessibilityLabel(subtitle)
                }
            } else {
                // Skeleton placeholder
                VStack(alignment: .leading, spacing: theme.space.xs) {
                    // Label skeleton (estimate width based on text length)
                    skeletonBar(width: estimatedLabelWidth, height: theme.type.display.md.fontSize)

                    // Subtitle skeleton
                    if subtitle != nil {
                        skeletonBar(width: estimatedSubtitleWidth, height: theme.type.body.md.fontSize)
                    }
                }
                .accessibilityLabel("Loading")
                .accessibilityElement(children: .ignore)
            }
        }
        .onAppear {
            if visible {
                showContent()
            }
        }
        .onChange(of: visible) { _, newValue in
            if newValue {
                showContent()
            } else {
                hideContent()
            }
        }
    }

    // MARK: - Private Views

    private func skeletonBar(width: CGFloat, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(theme.colors.muted.default)
            .frame(width: width, height: height)
    }

    // MARK: - Helpers

    private func showContent() {
        // Show label immediately
        if reduceMotion {
            labelVisible = true
            subtitleVisible = true
        } else {
            labelVisible = true

            // Show subtitle after stagger delay
            if subtitle != nil {
                DispatchQueue.main.asyncAfter(deadline: .now() + staggerDelay) {
                    subtitleVisible = true
                }
            } else {
                subtitleVisible = true
            }
        }
    }

    private func hideContent() {
        labelVisible = false
        subtitleVisible = false
    }

    /// Estimate label width based on character count (rough approximation)
    private var estimatedLabelWidth: CGFloat {
        let charWidth = theme.type.display.md.fontSize * 0.6
        let minWidth: CGFloat = 120
        let maxWidth: CGFloat = 280
        let estimated = CGFloat(label.count) * charWidth
        return min(max(estimated, minWidth), maxWidth)
    }

    /// Estimate subtitle width based on character count
    private var estimatedSubtitleWidth: CGFloat {
        let charWidth = theme.type.body.md.fontSize * 0.5
        let minWidth: CGFloat = 80
        let maxWidth: CGFloat = 200
        let estimated = CGFloat(subtitle?.count ?? 0) * charWidth
        return min(max(estimated, minWidth), maxWidth)
    }
}

// MARK: - Preview

#Preview("CreativeLabelFadeIn - Visible") {
    VStack(alignment: .leading, spacing: 24) {
        LSCreativeLabelFadeIn(
            label: "Sunset Coastal Route",
            visible: true
        )

        LSCreativeLabelFadeIn(
            label: "Mountain Pass Adventure",
            visible: true,
            subtitle: "45 miles • 2 hours"
        )

        LSCreativeLabelFadeIn(
            label: "Scenic Valley Loop",
            visible: true,
            subtitle: "Intermediate terrain",
            staggerDelay: 0.2,
            fadeDuration: 0.5
        )
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
}

#Preview("CreativeLabelFadeIn - Skeleton") {
    VStack(alignment: .leading, spacing: 24) {
        LSCreativeLabelFadeIn(
            label: "Sunset Coastal Route",
            visible: false
        )

        LSCreativeLabelFadeIn(
            label: "Mountain Pass Adventure",
            visible: false,
            subtitle: "45 miles • 2 hours"
        )
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
}

#Preview("CreativeLabelFadeIn - Transition") {
    struct TransitionDemo: View {
        @State private var visible = false

        var body: some View {
            VStack(alignment: .leading, spacing: 24) {
                LSCreativeLabelFadeIn(
                    label: "Sunset Coastal Route",
                    visible: visible,
                    subtitle: "45 miles • 2 hours"
                )

                Button("Toggle Visibility") {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        visible.toggle()
                    }
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
            .laneShadowTheme()
        }
    }

    return TransitionDemo()
}

#Preview("CreativeLabelFadeIn - Reduce Motion") {
    VStack(alignment: .leading, spacing: 24) {
        LSCreativeLabelFadeIn(
            label: "Sunset Coastal Route",
            visible: true,
            subtitle: "45 miles • 2 hours"
        )
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.gray.opacity(0.1))
    .laneShadowTheme()
    .accessibilityReduceMotion(true)
}
