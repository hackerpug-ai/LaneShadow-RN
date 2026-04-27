import LaneShadowTheme
import NativeTheme
import SwiftUI

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
                LSSuggestionChip(label: suggestion) {
                    onSuggestionTap(suggestion)
                }
            }
        }
    }
}
