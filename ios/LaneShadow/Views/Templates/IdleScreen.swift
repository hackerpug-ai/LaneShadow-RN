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

    @State private var chatInputValue: String = ""
    private let onMenuTap: () -> Void
    private let onSuggestionTap: (MockSuggestionChip) -> Void

    public init(
        provider: IdleMockProvider.Type = IdleMockProvider.self,
        chatInputValue: Binding<String>? = nil,
        onMenuTap: @escaping () -> Void = {},
        onSuggestionTap: @escaping (MockSuggestionChip) -> Void = { _ in }
    ) {
        self.provider = provider
        state = provider.value(variant: "default")
        _chatInputValue = State(initialValue: chatInputValue?.wrappedValue ?? "")
        self.onMenuTap = onMenuTap
        self.onSuggestionTap = onSuggestionTap
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
                )
            ],
            bottomOverlays: [
                GlassOverlaySlot(
                    id: "chatinput",
                    content: { chatInputView }
                )
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
        ZStack {
            // Placeholder map background
            LinearGradient(
                gradient: Gradient(colors: [
                    theme.colors.surface.default,
                    theme.colors.background.default
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Map content (using neutral placeholder)
            Text("Map Layer")
                .foregroundStyle(theme.colors.onSurface.default)
                .font(.body)
        }
        .accessibilityIdentifier("idlescreen-map")
    }

    // MARK: - Greeting Overlay

    private var greetingOverlay: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            // Meta label (e.g., "FRIDAY · 68°F · CLEAR")
            Text(state.greeting.meta)
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)
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
            .font(theme.type.heading.md.font)
            .foregroundStyle(theme.colors.onSurface.default)
            .accessibilityIdentifier("idlescreen-greeting-headline")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.md)
        .accessibilityIdentifier("idlescreen-greeting")
    }

    // MARK: - Chat Input

    private var chatInputView: some View {
        let suggestions = state.suggestions.map { chip in
            SuggestionChip(label: chip.label)
        }

        let locationContext = LocationContext(
            label: state.locationContext.label,
            mode: state.locationContext.mode == "auto" ? .auto : .manual
        )

        return LSChatInput(
            value: $chatInputValue,
            placeholder: "Plan a ride…",
            onSend: { _ in },
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
            locationBadge: locationContext
        )
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("idlescreen-chatinput")
    }
}

// MARK: - Preview

#Preview {
    IdleScreen()
}
