import LaneShadowTheme
import SwiftUI

// MARK: - Suggestion Chip Model

/**
 * Suggestion chip model
 *
 * Represents a single suggestion chip with optional emoji icon.
 */
public struct LSSuggestionChip: Sendable, Identifiable, Equatable {
    public let id: String
    public let label: String
    public let icon: String?

    public init(
        id: String,
        label: String,
        icon: String? = nil
    ) {
        self.id = id
        self.label = label
        self.icon = icon
    }
}

// MARK: - Suggestion Chips Component

/**
 * Suggestion chips molecule component
 *
 * Horizontal or vertical flow of suggestion chips that users can tap.
 * Following React Native component from react-native/components/ui/suggestion-chips.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Chip background: `theme.colors.surfaceVariant.default`
 *   - Chip pressed: `theme.colors.primary.pressed`
 *   - Chip border: `theme.colors.border.default` (1pt)
 *   - Chip text: `theme.colors.onSurface.default` with 0.6 opacity (muted)
 *   - Chip icon: `theme.colors.primary.default`
 * - Layout:
 *   - Container padding: horizontal 16pt (`theme.space.md`), vertical 12pt
 *   - Chip padding: horizontal 14pt, vertical 8pt
 *   - Chip corner radius: 20pt (`theme.radius.full`)
 *   - Spacing between chips: 8pt
 *   - Chip min height: 36pt
 * - Typography:
 *   - Chip text: 14pt, weight 600
 *   - Icon: 14pt
 *
 * ## Behavior
 * - Horizontal mode: chips scroll horizontally in a ScrollView
 * - Vertical mode: chips wrap in a flow layout
 * - Disabled state: 0.5 opacity
 * - Pressed state: primary.pressed background
 *
 * ## Parameters
 * - suggestions: Array of suggestion chips to display
 * - onPress: Callback when a chip is tapped
 * - disabled: Whether all chips are disabled (default: false)
 * - horizontal: Whether to use horizontal scrolling (default: false)
 * - testID: Optional testing identifier for UI tests
 */
public struct LSSuggestionChips: View {
    @Environment(\.theme) private var theme

    private let suggestions: [LSSuggestionChip]
    private let onPress: (LSSuggestionChip) -> Void
    private let disabled: Bool
    private let horizontal: Bool
    private let testID: String

    public init(
        suggestions: [LSSuggestionChip],
        onPress: @escaping (LSSuggestionChip) -> Void,
        disabled: Bool = false,
        horizontal: Bool = false,
        testID: String = "suggestion-chips"
    ) {
        self.suggestions = suggestions
        self.onPress = onPress
        self.disabled = disabled
        self.horizontal = horizontal
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if horizontal {
                horizontalLayout
            } else {
                verticalLayout
            }
        }
        .background(theme.colors.surface.default)
    }

    // MARK: - Horizontal Layout

    private var horizontalLayout: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(suggestions) { suggestion in
                    chipButton(for: suggestion)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Suggestion chips")
    }

    // MARK: - Vertical Layout

    private var verticalLayout: some View {
        FlowLayout(spacing: 8) {
            ForEach(suggestions) { suggestion in
                chipButton(for: suggestion)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Suggestion chips")
    }

    // MARK: - Chip Button

    private func chipButton(for suggestion: LSSuggestionChip) -> some View {
        Button(action: {
            onPress(suggestion)
        }) {
            HStack(spacing: 6) {
                if let icon = suggestion.icon {
                    Text(icon)
                        .font(.system(size: 14))
                        .foregroundStyle(theme.colors.primary.default)
                }

                Text(suggestion.label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(chipTextColor)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .frame(minHeight: 36)
            .background(chipBackground)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(theme.colors.border.default, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .opacity(disabled ? 0.5 : 1)
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(disabled)
        .accessibilityLabel(suggestion.label)
        .accessibilityIdentifier("\(testID)-\(suggestion.id)")
    }

    // MARK: - Computed Properties

    private var chipTextColor: Color {
        theme.colors.onSurface.default.opacity(0.6)
    }

    private var chipBackground: some View {
        RoundedRectangle(cornerRadius: 20)
            .fill(theme.colors.surfaceVariant.default)
    }
}

// MARK: - Flow Layout (Vertical Wrapping)

/**
 * Simple flow layout for wrapping chips
 *
 * Arranges children in rows, wrapping to the next line when space runs out.
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

#Preview("Suggestion Chips - Horizontal") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Horizontal Layout")
            .font(.headline)
            .padding(.horizontal)

        LSSuggestionChips(
            suggestions: [
                LSSuggestionChip(id: "1", label: "Scenic routes", icon: "🛣️"),
                LSSuggestionChip(id: "2", label: "Coastal", icon: "🌊"),
                LSSuggestionChip(id: "3", label: "Mountains", icon: "⛰️"),
                LSSuggestionChip(id: "4", label: "Wine country", icon: "🍇"),
                LSSuggestionChip(id: "5", label: "Historic"),
                LSSuggestionChip(id: "6", label: "Short ride"),
            ],
            onPress: { chip in
                print("Tapped: \(chip.label)")
            },
            horizontal: true
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("Suggestion Chips - Vertical") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Vertical Layout")
            .font(.headline)
            .padding(.horizontal)

        LSSuggestionChips(
            suggestions: [
                LSSuggestionChip(id: "1", label: "Scenic routes", icon: "🛣️"),
                LSSuggestionChip(id: "2", label: "Coastal", icon: "🌊"),
                LSSuggestionChip(id: "3", label: "Mountains", icon: "⛰️"),
                LSSuggestionChip(id: "4", label: "Wine country", icon: "🍇"),
                LSSuggestionChip(id: "5", label: "Historic"),
                LSSuggestionChip(id: "6", label: "Short ride"),
                LSSuggestionChip(id: "7", label: "Day trip"),
            ],
            onPress: { chip in
                print("Tapped: \(chip.label)")
            },
            horizontal: false
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("Suggestion Chips - Disabled") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Disabled State")
            .font(.headline)
            .padding(.horizontal)

        LSSuggestionChips(
            suggestions: [
                LSSuggestionChip(id: "1", label: "Scenic routes", icon: "🛣️"),
                LSSuggestionChip(id: "2", label: "Coastal", icon: "🌊"),
                LSSuggestionChip(id: "3", label: "Mountains", icon: "⛰️"),
            ],
            onPress: { _ in },
            disabled: true,
            horizontal: true
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("Suggestion Chips - Without Icons") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Without Icons")
            .font(.headline)
            .padding(.horizontal)

        LSSuggestionChips(
            suggestions: [
                LSSuggestionChip(id: "1", label: "Scenic routes"),
                LSSuggestionChip(id: "2", label: "Coastal"),
                LSSuggestionChip(id: "3", label: "Mountains"),
                LSSuggestionChip(id: "4", label: "Wine country"),
            ],
            onPress: { chip in
                print("Tapped: \(chip.label)")
            },
            horizontal: true
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("Suggestion Chips - Complete") {
    VStack(alignment: .leading, spacing: 24) {
        Text("Suggestion Chips Showcase")
            .font(.title)
            .fontWeight(.bold)
            .padding(.horizontal)

        VStack(alignment: .leading, spacing: 8) {
            Text("Horizontal Scroll")
                .font(.headline)
                .padding(.horizontal)

            LSSuggestionChips(
                suggestions: [
                    LSSuggestionChip(id: "1", label: "Scenic routes", icon: "🛣️"),
                    LSSuggestionChip(id: "2", label: "Coastal", icon: "🌊"),
                    LSSuggestionChip(id: "3", label: "Mountains", icon: "⛰️"),
                    LSSuggestionChip(id: "4", label: "Wine country", icon: "🍇"),
                    LSSuggestionChip(id: "5", label: "Historic"),
                ],
                onPress: { print("Horizontal: \($0.label)") },
                horizontal: true
            )
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Vertical Wrap")
                .font(.headline)
                .padding(.horizontal)

            LSSuggestionChips(
                suggestions: [
                    LSSuggestionChip(id: "1", label: "Scenic routes", icon: "🛣️"),
                    LSSuggestionChip(id: "2", label: "Coastal", icon: "🌊"),
                    LSSuggestionChip(id: "3", label: "Mountains", icon: "⛰️"),
                    LSSuggestionChip(id: "4", label: "Wine country", icon: "🍇"),
                    LSSuggestionChip(id: "5", label: "Historic"),
                ],
                onPress: { print("Vertical: \($0.label)") },
                horizontal: false
            )
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Disabled")
                .font(.headline)
                .padding(.horizontal)

            LSSuggestionChips(
                suggestions: [
                    LSSuggestionChip(id: "1", label: "Scenic routes", icon: "🛣️"),
                    LSSuggestionChip(id: "2", label: "Coastal", icon: "🌊"),
                ],
                onPress: { _ in },
                disabled: true,
                horizontal: true
            )
        }

        Spacer()
    }
    .laneShadowTheme()
}
