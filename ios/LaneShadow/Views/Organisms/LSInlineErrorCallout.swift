import LaneShadowTheme
import NativeTheme
import SwiftUI

// MARK: - Animation Motion Extensions

extension Animation {

    /// Chat overlay enter animation: slide-up with fade
    ///
    /// Reads from theme.motion.chatOverlayEnter (uses "standard" duration and "decelerated" easing)
    static func chatOverlayEnter(theme: Theme) -> Animation {
        let duration = Double(theme.motion.duration["standard"] ?? 240) / 1000
        let easing = theme.motion.easing["decelerated"] ?? [0.0, 0.0, 0.2, 1.0]
        return Animation.timingCurve(
            easing[0],
            easing[1],
            easing[2],
            easing[3],
            duration: duration
        )
    }
}

public struct LSInlineErrorCallout: View {
    @Environment(\.theme) private var theme

    private let messageBody: String
    private let detail: String?
    private let suggestions: [String]
    private let onSuggestionTap: @Sendable (String) -> Void

    public init(
        body: String,
        detail: String? = nil,
        suggestions: [String] = [],
        onSuggestionTap: @Sendable @escaping (String) -> Void
    ) {
        messageBody = body
        self.detail = detail
        self.suggestions = suggestions
        self.onSuggestionTap = onSuggestionTap
    }

    public var body: some View {
        LSGlassPanel(variant: .callout(accent: .warning)) {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                headerRow

                if let detail {
                    LSText(detail, variant: .body.sm, color: .secondary)
                }

                if !suggestions.isEmpty {
                    suggestionsRow
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lsinlineerrorcallout")
    }
}

extension LSInlineErrorCallout {
    private var headerRow: some View {
        HStack(alignment: .top, spacing: theme.space.sm) {
            compassChip

            VStack(alignment: .leading, spacing: theme.space.xs) {
                LSText("THE NAVIGATOR", variant: .label.sm)
                    .foregroundStyle(LaneShadowTheme.color.status.warning.default)

                LSText(messageBody, variant: .opinion.md)
                    .foregroundStyle(LaneShadowTheme.color.content.primary)
            }
        }
    }

    private var compassChip: some View {
        LSPill(size: .sm) {
            LSIcon(
                name: .compass,
                size: .xs,
                resolvedColorOverride: LaneShadowTheme.color.status.warning.default
            )
        }
        .background(
            Circle()
                .fill(LaneShadowTheme.color.status.warning.default)
                .opacity(theme.opacity.values["20"]!)
        )
        .overlay(
            Circle()
                .stroke(LaneShadowTheme.color.status.warning.default, lineWidth: theme.borderWidth.hairline)
        )
    }

    private var suggestionsRow: some View {
        HStack(spacing: theme.space.sm) {
            ForEach(Array(suggestions.enumerated()), id: \.offset) { index, suggestion in
                SuggestionChipEnter(
                    label: suggestion,
                    delay: Double(index) * 0.05  // Stagger each chip by 50ms
                ) {
                    onSuggestionTap(suggestion)
                }
            }
        }
    }
}

// MARK: - Suggestion Chip with Enter Animation

struct SuggestionChipEnter: View {
    @Environment(\.theme) private var theme
    @State private var isAppeared = false

    private let label: String
    private let delay: TimeInterval
    private let action: () -> Void

    init(label: String, delay: TimeInterval, action: @escaping () -> Void) {
        self.label = label
        self.delay = delay
        self.action = action
    }

    var body: some View {
        LSSuggestionChip(label: label) {
            action()
        }
        .offset(y: isAppeared ? 0 : 8)  // Slide up 8pt
        .opacity(isAppeared ? 1.0 : 0.0)  // Fade in
        .animation(Animation.chatOverlayEnter(theme: theme).delay(delay), value: isAppeared)
        .onAppear {
            isAppeared = true
        }
    }
}
