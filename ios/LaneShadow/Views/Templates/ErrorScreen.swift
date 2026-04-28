import LaneShadowTheme
import SwiftUI

/// ErrorScreen — Navigator error recovery screen with inline callout + recovery chat.
///
/// Composes `LSMapLayer`, `LSTopBar`, `LSInlineErrorCallout`, and `LSChatInput`
/// with data sourced entirely from `ErrorMockProvider`.
public struct ErrorScreen: View {
    @Environment(\.theme) private var theme

    private let provider: any MockProvider.Type
    private let state: ErrorScreenState

    @State private var chatInputValue: String = ""
    private let onMenuTap: () -> Void
    private let onSuggestionTap: (MockSuggestionChip) -> Void

    public init(
        provider: (any MockProvider.Type) = ErrorMockProvider.self,
        variant: String = "default",
        onMenuTap: @escaping () -> Void = {},
        onSuggestionTap: @escaping (MockSuggestionChip) -> Void = { _ in }
    ) {
        self.provider = provider
        // Cast provider to ErrorMockProvider.Type to access value(variant:)
        if let errorProvider = provider as? ErrorMockProvider.Type {
            state = errorProvider.value(variant: variant)
        } else {
            // Fallback to default ErrorMockProvider if wrong type passed
            state = ErrorMockProvider.value(variant: variant)
        }
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
        .accessibilityIdentifier("errorscreen")
    }

    // MARK: - Map

    private var mapView: some View {
        ZStack {
            LSPaperMap(overlayStyle: .brokenPolyline)
                .accessibilityIdentifier("errorscreen-map")

            // Wifi-off watermark for offline state (AC-4)
            if state.error.body.contains("offline") || state.error.body.contains("connection") {
                LSWifiOffWatermark(opacity: 0.25)
                    .accessibilityIdentifier("errorscreen-wifioff")
            }
        }
    }

    // MARK: - Error Callout

    private var errorCalloutView: some View {
        let isRecovered = state.error.body.contains("workaround") || state.error.body.contains("found a")

        return LSInlineErrorCallout(
            body: state.error.body,
            detail: state.error.detail,
            suggestions: state.suggestions.map(\.label),
            isRecovered: isRecovered,
            onSuggestionTap: { tappedLabel in
                // Find matching MockSuggestionChip to pass to callback
                if let chip = state.suggestions.first(where: { $0.label == tappedLabel }) {
                    onSuggestionTap(chip)
                    // Prime chat input with the suggestion (AC-3)
                    chatInputValue = tappedLabel
                }
            }
        )
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("errorscreen-callout")
    }

    // MARK: - Chat Input

    private var chatInputView: some View {
        let isOffline = state.error.body.contains("offline") || state.error.body.contains("connection")

        return LSChatInput(
            value: $chatInputValue,
            placeholder: "Try again, or let me know what to change…",
            onSend: { _ in },
            onCollapse: {},
            onFilter: {},
            suggestions: [], // Suggestions are in the callout, not the chat input
            onSuggestionTap: { _ in },
            isEnabled: !isOffline
        )
        .opacity(isOffline ? 0.7 : 1.0)
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("errorscreen-chatinput")
    }
}

// MARK: - Preview

#Preview {
    ErrorScreen()
}
