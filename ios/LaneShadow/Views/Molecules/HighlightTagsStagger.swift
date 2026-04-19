import LaneShadowTheme
import SwiftUI

// MARK: - Highlight Tag Model

/**
 * Highlight tag model
 *
 * Represents a single highlight tag with optional emoji icon.
 */
public struct LSHighlightTag: Sendable, Identifiable, Equatable {
    public let id: String
    public let label: String
    public let icon: String?

    public init(
        id: String = UUID().uuidString,
        label: String,
        icon: String? = nil
    ) {
        self.id = id
        self.label = label
        self.icon = icon
    }
}

// MARK: - Highlight Tags Stagger Component

/**
 * Highlight tags stagger molecule component
 *
 * Staggered fade-in animation for highlight tags in a wrapping layout.
 * Following React Native component from react-native/components/enrichment/highlight-tags-stagger.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Tag background: `theme.colors.primary.default` at 10% opacity
 *   - Tag border: `theme.colors.primary.default` at 30% opacity (1pt)
 *   - Tag text: `theme.colors.primary.default`
 * - Layout:
 *   - Container gap: 8pt
 *   - Tag padding: horizontal `theme.space.md`, vertical `theme.space.xs`
 *   - Tag corner radius: `theme.radius.full` (capsule/pill)
 *   - Tag icon gap: 4pt
 * - Typography:
 *   - Tag text: `theme.type.label.md`
 *   - Tag icon: 14pt
 *
 * ## Behavior
 * - Staggered fade-in animation with configurable delay (default 100ms)
 * - Scale animation from 0.95 to 1.0 (subtle pop)
 * - Shows EmptyView when not visible or highlights array is empty
 * - Respects reduce-motion preference (instant reveal when enabled)
 * - Tags wrap in FlowLayout when space runs out
 *
 * ## Parameters
 * - highlights: Array of highlight tags to display
 * - visible: Whether the tags are ready to show
 * - staggerDelay: Stagger delay between each tag in ms (default 100)
 * - fadeDuration: Fade-in duration per tag in ms (default 300)
 * - scaleDuration: Scale pop animation duration in ms (default 300)
 * - testID: Optional testing identifier for UI tests
 *
 * ## Accessibility
 * - Container announces "{count} route highlights"
 * - Each tag has accessibility label
 */
public struct LSHighlightTagsStagger: View {
    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var tagsVisible: [Bool] = []

    private let highlights: [LSHighlightTag]
    private let visible: Bool
    private let staggerDelay: Int
    private let fadeDuration: Int
    private let scaleDuration: Int
    private let testID: String

    public init(
        highlights: [LSHighlightTag],
        visible: Bool,
        staggerDelay: Int = 100,
        fadeDuration: Int = 300,
        scaleDuration: Int = 300,
        testID: String = "highlight-tags"
    ) {
        self.highlights = highlights
        self.visible = visible
        self.staggerDelay = staggerDelay
        self.fadeDuration = fadeDuration
        self.scaleDuration = scaleDuration
        self.testID = testID
        _tagsVisible = State(initialValue: Array(repeating: false, count: highlights.count))
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if visible, !highlights.isEmpty {
                FlowLayout(spacing: 8) {
                    ForEach(Array(highlights.enumerated()), id: \.element.id) { index, tag in
                        TagChip(
                            tag: tag,
                            isVisible: tagsVisible.indices.contains(index) ? tagsVisible[index] : false,
                            delay: index * staggerDelay,
                            fadeDuration: fadeDuration,
                            scaleDuration: scaleDuration,
                            reduceMotion: reduceMotion,
                            testID: "\(testID)-\(index)"
                        )
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel("\(highlights.count) route highlights")
                .accessibilityIdentifier(testID)
                .onAppear {
                    showTags()
                }
                .onChange(of: visible) { _, newValue in
                    if newValue {
                        showTags()
                    } else {
                        hideTags()
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func showTags() {
        if reduceMotion {
            // Instant reveal for reduce motion
            tagsVisible = Array(repeating: true, count: highlights.count)
        } else {
            // Staggered animation
            for index in 0 ..< highlights.count {
                DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(index * staggerDelay)) {
                    if index < tagsVisible.count {
                        tagsVisible[index] = true
                    }
                }
            }
        }
    }

    private func hideTags() {
        tagsVisible = Array(repeating: false, count: highlights.count)
    }
}

// MARK: - Tag Chip View

private struct TagChip: View {
    @Environment(\.theme) private var theme

    let tag: LSHighlightTag
    let isVisible: Bool
    let delay: Int
    let fadeDuration: Int
    let scaleDuration: Int
    let reduceMotion: Bool
    let testID: String

    @State private var scale: CGFloat = 0.95

    var body: some View {
        HStack(spacing: 4) {
            if let icon = tag.icon {
                Text(icon)
                    .font(.system(size: 14))
            }

            Text(tag.label)
                .font(theme.type.label.md.font)
        }
        .foregroundStyle(tagTextColor)
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.xs)
        .background(tagBackground)
        .overlay(
            Capsule()
                .stroke(tagBorderColor, lineWidth: 1)
        )
        .clipShape(Capsule())
        .scaleEffect(scale)
        .opacity(isVisible ? 1 : 0)
        .animation(.easeOut(duration: reduceMotion ? 0 : Double(fadeDuration) / 1000), value: isVisible)
        .onAppear {
            if !reduceMotion {
                DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(delay)) {
                    withAnimation(.easeOut(duration: Double(scaleDuration) / 1000)) {
                        scale = 1.0
                    }
                }
            } else {
                scale = 1.0
            }
        }
        .accessibilityLabel(tag.label)
        .accessibilityIdentifier(testID)
    }

    private var tagTextColor: Color {
        theme.colors.primary.default
    }

    private var tagBackground: some View {
        theme.colors.primary.default.opacity(0.1)
    }

    private var tagBorderColor: Color {
        theme.colors.primary.default.opacity(0.3)
    }
}

// MARK: - Flow Layout (Vertical Wrapping)

/**
 * Simple flow layout for wrapping tags
 *
 * Arranges children in rows, wrapping to the next line when space runs out.
 * Reused from SuggestionChips.swift to maintain consistency.
 */
private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(
                at: CGPoint(x: bounds.minX + result.positions[index].x, y: bounds.minY + result.positions[index].y),
                proposal: .unspecified
            )
        }
    }

    struct FlowResult {
        var size: CGSize
        var positions: [CGPoint]

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var positions: [CGPoint] = []
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var rowHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > maxWidth, currentX > 0 {
                    // Move to next row
                    currentX = 0
                    currentY += rowHeight + spacing
                    rowHeight = 0
                }

                positions.append(CGPoint(x: currentX, y: currentY))
                currentX += size.width + spacing
                rowHeight = max(rowHeight, size.height)
            }

            size = CGSize(width: maxWidth, height: currentY + rowHeight)
            self.positions = positions
        }
    }
}

// MARK: - Preview

#Preview("HighlightTagsStagger - Visible") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Route Highlights")
            .font(.headline)
            .padding(.horizontal)

        LSHighlightTagsStagger(
            highlights: [
                LSHighlightTag(label: "Scenic", icon: "🛣️"),
                LSHighlightTag(label: "Coastal", icon: "🌊"),
                LSHighlightTag(label: "Mountains", icon: "⛰️"),
                LSHighlightTag(label: "Wine country", icon: "🍇"),
                LSHighlightTag(label: "Historic"),
                LSHighlightTag(label: "Day trip"),
            ],
            visible: true
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("HighlightTagsStagger - Skeleton") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Route Highlights")
            .font(.headline)
            .padding(.horizontal)

        LSHighlightTagsStagger(
            highlights: [
                LSHighlightTag(label: "Scenic", icon: "🛣️"),
                LSHighlightTag(label: "Coastal", icon: "🌊"),
            ],
            visible: false
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("HighlightTagsStagger - Empty") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Route Highlights")
            .font(.headline)
            .padding(.horizontal)

        LSHighlightTagsStagger(
            highlights: [],
            visible: true
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("HighlightTagsStagger - Transition") {
    struct TransitionDemo: View {
        @State private var visible = false

        var body: some View {
            VStack(alignment: .leading, spacing: 24) {
                LSHighlightTagsStagger(
                    highlights: [
                        LSHighlightTag(label: "Scenic", icon: "🛣️"),
                        LSHighlightTag(label: "Coastal", icon: "🌊"),
                        LSHighlightTag(label: "Mountains", icon: "⛰️"),
                        LSHighlightTag(label: "Wine country", icon: "🍇"),
                    ],
                    visible: visible
                )

                Button("Toggle Visibility") {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        visible.toggle()
                    }
                }
                .buttonStyle(.bordered)
                .padding(.horizontal)
            }
            .padding(.vertical)
            .laneShadowTheme()
        }
    }

    return TransitionDemo()
}

#Preview("HighlightTagsStagger - Custom Timing") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Custom Stagger (200ms)")
            .font(.headline)
            .padding(.horizontal)

        LSHighlightTagsStagger(
            highlights: [
                LSHighlightTag(label: "Scenic", icon: "🛣️"),
                LSHighlightTag(label: "Coastal", icon: "🌊"),
                LSHighlightTag(label: "Mountains", icon: "⛰️"),
            ],
            visible: true,
            staggerDelay: 200,
            fadeDuration: 500,
            scaleDuration: 400
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("HighlightTagsStagger - Reduce Motion") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Reduce Motion")
            .font(.headline)
            .padding(.horizontal)

        LSHighlightTagsStagger(
            highlights: [
                LSHighlightTag(label: "Scenic", icon: "🛣️"),
                LSHighlightTag(label: "Coastal", icon: "🌊"),
                LSHighlightTag(label: "Mountains", icon: "⛰️"),
            ],
            visible: true
        )

        Spacer()
    }
    .laneShadowTheme()
    .accessibilityReduceMotion(true)
}

#Preview("HighlightTagsStagger - Without Icons") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Without Icons")
            .font(.headline)
            .padding(.horizontal)

        LSHighlightTagsStagger(
            highlights: [
                LSHighlightTag(label: "Scenic"),
                LSHighlightTag(label: "Coastal"),
                LSHighlightTag(label: "Mountains"),
                LSHighlightTag(label: "Wine country"),
            ],
            visible: true
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("HighlightTagsStagger - Complete") {
    VStack(alignment: .leading, spacing: 24) {
        Text("Highlight Tags Stagger Showcase")
            .font(.title)
            .fontWeight(.bold)
            .padding(.horizontal)

        VStack(alignment: .leading, spacing: 8) {
            Text("With Icons")
                .font(.headline)
                .padding(.horizontal)

            LSHighlightTagsStagger(
                highlights: [
                    LSHighlightTag(label: "Scenic", icon: "🛣️"),
                    LSHighlightTag(label: "Coastal", icon: "🌊"),
                    LSHighlightTag(label: "Mountains", icon: "⛰️"),
                    LSHighlightTag(label: "Wine country", icon: "🍇"),
                ],
                visible: true
            )
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Without Icons")
                .font(.headline)
                .padding(.horizontal)

            LSHighlightTagsStagger(
                highlights: [
                    LSHighlightTag(label: "Scenic"),
                    LSHighlightTag(label: "Coastal"),
                    LSHighlightTag(label: "Mountains"),
                ],
                visible: true
            )
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Mixed")
                .font(.headline)
                .padding(.horizontal)

            LSHighlightTagsStagger(
                highlights: [
                    LSHighlightTag(label: "Scenic", icon: "🛣️"),
                    LSHighlightTag(label: "Coastal"),
                    LSHighlightTag(label: "Mountains", icon: "⛰️"),
                ],
                visible: true
            )
        }

        Spacer()
    }
    .laneShadowTheme()
}
