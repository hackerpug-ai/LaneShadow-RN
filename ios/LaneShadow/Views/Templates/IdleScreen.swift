import LaneShadowTheme
import SwiftUI

/// IdleScreen — the dormant Navigator welcome screen.
///
/// Composes `LSMapLayer`, `LSTopBar`, greeting overlay, and `LSChatInput`
/// with data sourced entirely from `IdleMockProvider`.
public struct IdleScreen: View {
    @Environment(\.theme) private var theme

    private let provider: IdleMockProvider.Type
    private let state: IdleScreenState
    private let greetingDisplayName: String?
    private let suggestionLabels: [String]?
    private let errorMessage: String?
    private let isSubmitting: Bool

    @State private var chatInputValue: String = ""
    private let onMenuTap: () -> Void
    private let onSuggestionTap: (MockSuggestionChip) -> Void
    private let onSend: (String) -> Void

    public init(
        provider: IdleMockProvider.Type = IdleMockProvider.self,
        variant: String = "default",
        greetingDisplayName: String? = nil,
        suggestionLabels: [String]? = nil,
        errorMessage: String? = nil,
        isSubmitting: Bool = false,
        chatInputValue: Binding<String>? = nil,
        onMenuTap: @escaping () -> Void = {},
        onSuggestionTap: @escaping (MockSuggestionChip) -> Void = { _ in },
        onSend: @escaping (String) -> Void = { _ in }
    ) {
        self.provider = provider
        state = provider.value(variant: variant)
        self.greetingDisplayName = greetingDisplayName
        self.suggestionLabels = suggestionLabels
        self.errorMessage = errorMessage
        self.isSubmitting = isSubmitting
        _chatInputValue = State(initialValue: chatInputValue?.wrappedValue ?? "")
        self.onMenuTap = onMenuTap
        self.onSuggestionTap = onSuggestionTap
        self.onSend = onSend
    }

    public var body: some View {
        LSMapLayer(
            map: {
                mapView
            },
            topOverlays: [
                GlassOverlaySlot(
                    id: "greeting",
                    content: { greetingOverlay }
                ),
            ],
            bottomOverlays: [
                GlassOverlaySlot(
                    id: "chatinput",
                    content: { chatInputView }
                ),
            ],
            topBar: {
                LSTopBar(
                    trailing: .none,
                    onMenuTap: onMenuTap,
                    onNewTap: {}
                )
            }
        )
        .accessibilityIdentifier("idlescreen")
    }

    // MARK: - Map

    private var mapView: some View {
        LSPaperMap(
            overlayStyle: .contours,
            showPins: state.showFavoritePins
        )
        .accessibilityIdentifier("idlescreen-map")
    }

    // MARK: - Greeting Overlay

    private var greetingOverlay: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            if let greetingDisplayName {
                Text("Good morning, \(greetingDisplayName)")
                    .font(theme.type.opinion.xl.font)
                    .foregroundStyle(LaneShadowTheme.color.content.primary)
                    .accessibilityIdentifier("idlescreen-current-user-greeting")
            }

            // Meta label (e.g., "FRIDAY · 68°F · CLEAR")
            Text(state.greeting.meta)
                .font(theme.type.label.sm.font)
                .foregroundStyle(metaColor)
                .accessibilityIdentifier("idlescreen-greeting-meta")

            // Headline with italicized emphasis word
            HStack(spacing: 0) {
                let parts = state.greeting.headline.split(
                    separator: " ",
                    omittingEmptySubsequences: false
                )
                let emphasisWord = state.greeting.emphasis ?? ""

                ForEach(Array(parts.enumerated()), id: \.offset) { index, part in
                    if String(part) == emphasisWord {
                        Text(part)
                            .italic()
                    } else {
                        Text(part)
                    }
                    if index < parts.count - 1 {
                        Text(" ")
                    }
                }
            }
            .font(theme.type.opinion.xl.font)
            .foregroundStyle(theme.colors.onSurface.default)
            .accessibilityIdentifier("idlescreen-greeting-headline")

            // Weather advisory card (V03 only)
            if let advisory = state.weatherAdvisory {
                HStack(alignment: .top, spacing: 0) {
                    // Left border stripe (rain color)
                    Rectangle()
                        .fill(Color.blue.opacity(0.6)) // Fallback for wx.rain
                        .frame(width: 4) // Fallback for borderWidth.lg

                    // Content area
                    VStack(alignment: .leading, spacing: theme.space.sm) {
                        // Label
                        Text(advisory.label)
                            .font(theme.type.label.sm.font)
                            .foregroundStyle(Color.blue.opacity(0.8)) // Fallback for wx.rain

                        // Body
                        Text(advisory.body)
                            .font(theme.type.opinion.sm.font)
                            .italic()
                            .foregroundStyle(LaneShadowTheme.color.content.primary)
                    }
                    .padding(theme.space.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        Color.blue.opacity(0.1) // Fallback for wx.rain.tint
                    )
                }
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Advisory: \(advisory.label)")
                .accessibilityValue(advisory.body)
                .accessibilityIdentifier("idlescreen-advisory-card")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.md)
        .accessibilityIdentifier("idlescreen-greeting")
    }

    // MARK: - Helper Properties

    private var metaColor: Color {
        // V03: Use warning color for weather advisory
        if state.weatherAdvisory != nil {
            return LaneShadowTheme.color.status.warning.default
        }
        return LaneShadowTheme.color.signal.default
    }

    // MARK: - Chat Input

    private var chatInputView: some View {
        let suggestions = (suggestionLabels ?? state.suggestions.map(\.label)).map { chip in
            SuggestionChip(label: chip)
        }

        let locationContext = LocationContext(
            label: state.locationContext.label,
            mode: state.locationContext.mode == "auto" ? .auto : .manual
        )

        let isLocationNeeded = state.locationContext.mode == "needed"

        return LSChatInput(
            value: $chatInputValue,
            placeholder: isLocationNeeded ? "Set a start point to begin…" : "Plan a ride…",
            onSend: onSend,
            onCollapse: {},
            onFilter: {},
            suggestions: suggestions,
            onSuggestionTap: { chip in
                chatInputValue = chip.label
                // Find matching MockSuggestionChip to pass to callback
                if let mockChip = state.suggestions.first(where: { $0.label == chip.label }) {
                    onSuggestionTap(mockChip)
                }
            },
            locationBadge: locationContext,
            isThinking: isSubmitting,
            isEnabled: !isLocationNeeded && !isSubmitting
        )
        .opacity(isLocationNeeded || isSubmitting ? theme.opacity.disabled : 1.0)
        .padding(.horizontal, theme.space.md)
        .overlay(alignment: .bottomLeading) {
            if let errorMessage {
                Text(errorMessage)
                    .font(theme.type.body.sm.font)
                    .foregroundStyle(LaneShadowTheme.color.content.primary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(theme.space.md)
                    .background(LaneShadowTheme.color.surface.card)
                    .overlay(
                        RoundedRectangle(cornerRadius: theme.radius.lg)
                            .stroke(
                                LaneShadowTheme.color.status.warning.default,
                                lineWidth: theme.borderWidth.thin
                            )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
                    .padding(.top, theme.space.sm)
                    .accessibilityIdentifier("idlescreen-inline-error")
            }
        }
        .accessibilityIdentifier("idlescreen-chatinput")
    }
}

// MARK: - Preview

#Preview {
    IdleScreen()
}
