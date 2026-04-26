import LaneShadowTheme
import SwiftUI

/// ErrorScreen — Navigator error recovery screen with inline callout + recovery chat.
///
/// Composes `LSMapLayer`, `LSTopBar`, `LSInlineErrorCallout`, and `LSChatInput`
/// with data sourced entirely from `ErrorMockProvider`.
public struct ErrorScreen: View {
    @Environment(\.theme) private var theme

    private let provider: (any MockProvider.Type)
    private let state: ErrorScreenState

    @State private var chatInputValue: String = ""
    private let onMenuTap: () -> Void
    private let onSuggestionTap: (MockSuggestionChip) -> Void

    public init(
        provider: (any MockProvider.Type) = ErrorMockProvider.self,
        chatInputValue: Binding<String>? = nil,
        onMenuTap: @escaping () -> Void = {},
        onSuggestionTap: @escaping (MockSuggestionChip) -> Void = { _ in }
    ) {
        self.provider = provider
        // Cast provider to ErrorMockProvider.Type to access value(variant:)
        if let errorProvider = provider as? ErrorMockProvider.Type {
            state = errorProvider.value(variant: "default")
        } else {
            // Fallback to default ErrorMockProvider if wrong type passed
            state = ErrorMockProvider.value(variant: "default")
        }
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
                    id: "error-callout",
                    content: { errorCalloutView }
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
        .accessibilityIdentifier("errorscreen")
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
        .accessibilityIdentifier("errorscreen-map")
    }

    // MARK: - Error Callout

    private var errorCalloutView: some View {
        LSInlineErrorCallout(
            body: state.error.body,
            detail: state.error.detail,
            suggestions: state.suggestions.map { $0.label },
            onSuggestionTap: { tappedLabel in
                // Find matching MockSuggestionChip to pass to callback
                if let chip = state.suggestions.first(where: { $0.label == tappedLabel }) {
                    onSuggestionTap(chip)
                    // Prime chat input with the suggestion
                    chatInputValue = tappedLabel
                }
            }
        )
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("errorscreen-callout")
    }

    // MARK: - Chat Input

    private var chatInputView: some View {
        LSChatInput(
            value: $chatInputValue,
            placeholder: "Try again, or let me know what to change…",
            onSend: { _ in },
            onCollapse: {},
            onFilter: {},
            suggestions: [], // Suggestions are in the callout, not the chat input
            onSuggestionTap: { _ in }
        )
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("errorscreen-chatinput")
    }
}

// MARK: - Preview

#Preview {
    ErrorScreen()
}
