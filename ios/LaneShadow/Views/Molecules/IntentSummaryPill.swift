import LaneShadowTheme
import SwiftUI

// MARK: - Intent Summary Pill Component

/**
 * Intent summary pill molecule component
 *
 * Compact pill showing the active search intent with dismiss button.
 * Appears above search results when a cache hit or search completes.
 * Following React Native component from react-native/components/discovery/intent-summary-pill.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Pill background: `theme.colors.primary.default` at 10% opacity
 *   - Pill border: `theme.colors.primary.default` at 30% opacity (1pt)
 *   - Accent dot: `theme.colors.primary.default` (8x8pt, circular)
 *   - Text: `theme.colors.primary.default`
 *   - Dismiss button background: `theme.colors.primary.default` at 20% opacity (20x20pt, circular)
 *   - Dismiss icon: `theme.colors.primary.default` (16pt)
 * - Layout:
 *   - Padding: horizontal 12pt, vertical 8pt
 *   - Gap: 8pt between elements
 *   - Corner radius: `theme.radius.full` (capsule/pill shape)
 *   - Self-aligning (not full width)
 * - Typography:
 *   - Text: `theme.type.label.md`
 *   - Single line with truncation
 *
 * ## Behavior
 * - Self-aligns to flex-start (not full width)
 * - Text truncates with ellipsis if too long
 * - Dismiss button triggers onDismiss callback
 *
 * ## Parameters
 * - text: The search intent text to display (e.g., "Twisty mountain roads near you")
 * - onDismiss: Callback when user taps the dismiss button
 * - testID: Optional testing identifier for UI tests
 *
 * ## Accessibility
 * - Announces "{text}, tap dismiss button to close"
 * - Dismiss button has accessibility label "Dismiss"
 */
public struct LSIntentSummaryPill: View {
    @Environment(\.theme) private var theme

    private let text: String
    private let onDismiss: () -> Void
    private let testID: String

    public init(
        text: String,
        onDismiss: @escaping () -> Void,
        testID: String = "intent-summary-pill"
    ) {
        self.text = text
        self.onDismiss = onDismiss
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        HStack(spacing: 8) {
            // Copper/primary accent dot (8x8pt, circular)
            accentDot

            // Intent text (flex=1, single line)
            Text(text)
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.primary.default)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Dismiss button (20x20pt, circular)
            dismissButton
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(pillBackground)
        .overlay(
            Capsule()
                .stroke(pillBorderColor, lineWidth: 1)
        )
        .clipShape(Capsule())
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(text), tap dismiss button to close")
        .accessibilityIdentifier(testID)
    }

    // MARK: - Accent Dot

    private var accentDot: some View {
        Circle()
            .fill(theme.colors.primary.default)
            .frame(width: 8, height: 8)
    }

    // MARK: - Dismiss Button

    private var dismissButton: some View {
        Button(action: onDismiss) {
            ZStack {
                Circle()
                    .fill(dismissButtonBackground)

                LSIconSymbol(
                    name: "close",
                    size: 16,
                    color: theme.colors.primary.default
                )
            }
            .frame(width: 20, height: 20)
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel("Dismiss")
        .accessibilityIdentifier("\(testID)-dismiss")
    }

    // MARK: - Computed Properties

    private var pillBackground: Color {
        theme.colors.primary.default.opacity(0.1)
    }

    private var pillBorderColor: Color {
        theme.colors.primary.default.opacity(0.3)
    }

    private var dismissButtonBackground: Color {
        theme.colors.primary.default.opacity(0.2)
    }
}

// MARK: - Preview

#Preview("Intent Summary Pill") {
    VStack(alignment: .leading, spacing: 24) {
        Text("Intent Summary Pill")
            .font(.title)
            .fontWeight(.bold)
            .padding(.horizontal)

        VStack(alignment: .leading, spacing: 16) {
            Text("Short Text")
                .font(.headline)
                .padding(.horizontal)

            LSIntentSummaryPill(
                text: "Scenic routes",
                onDismiss: {
                    print("Dismissed")
                }
            )
            .padding(.horizontal)
        }

        VStack(alignment: .leading, spacing: 16) {
            Text("Long Text (should truncate)")
                .font(.headline)
                .padding(.horizontal)

            LSIntentSummaryPill(
                text: "Twisty mountain roads with scenic coastal views near your location",
                onDismiss: {
                    print("Dismissed")
                }
            )
            .padding(.horizontal)
            .frame(width: 350)
        }

        VStack(alignment: .leading, spacing: 16) {
            Text("With Context")
                .font(.headline)
                .padding(.horizontal)

            VStack(alignment: .leading, spacing: 8) {
                LSIntentSummaryPill(
                    text: "Twisty mountain roads near you",
                    onDismiss: {
                        print("Dismissed")
                    }
                )

                Text("Showing 12 results")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)
        }

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("Intent Summary Pill - Interactive") {
    struct InteractiveDemo: View {
        @State private var showPill = true

        var body: some View {
            VStack(alignment: .leading, spacing: 24) {
                if showPill {
                    LSIntentSummaryPill(
                        text: "Twisty mountain roads near you",
                        onDismiss: {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                showPill = false
                            }
                        }
                    )
                    .padding(.horizontal)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                Button("Show Pill") {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        showPill = true
                    }
                }
                .buttonStyle(.bordered)
                .padding(.horizontal)

                Spacer()
            }
            .laneShadowTheme()
        }
    }

    return InteractiveDemo()
}

#Preview("Intent Summary Pill - Complete") {
    VStack(alignment: .leading, spacing: 24) {
        Text("Intent Summary Pill Showcase")
            .font(.title)
            .fontWeight(.bold)
            .padding(.horizontal)

        VStack(alignment: .leading, spacing: 8) {
            Text("Short Intent")
                .font(.headline)
                .padding(.horizontal)

            LSIntentSummaryPill(
                text: "Scenic routes",
                onDismiss: { print("Dismissed: Scenic") }
            )
            .padding(.horizontal)
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Medium Intent")
                .font(.headline)
                .padding(.horizontal)

            LSIntentSummaryPill(
                text: "Twisty mountain roads near you",
                onDismiss: { print("Dismissed: Twisty") }
            )
            .padding(.horizontal)
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Long Intent (truncated)")
                .font(.headline)
                .padding(.horizontal)

            LSIntentSummaryPill(
                text: "Technical sport routes with elevation gain and scenic coastal views in wine country",
                onDismiss: { print("Dismissed: Long") }
            )
            .padding(.horizontal)
            .frame(width: 350, alignment: .leading)
        }

        Spacer()
    }
    .laneShadowTheme()
}
