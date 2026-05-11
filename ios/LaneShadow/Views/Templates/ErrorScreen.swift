import LaneShadowTheme
import SwiftUI

/// ErrorScreen — Navigator error recovery screen with inline callout + recovery chat.
///
/// Composes `LSMapLayer`, `LSTopBar`, `LSInlineErrorCallout`, and `LSChatInput`
/// with data sourced from `ErrorMockProvider` or a live error state.
public struct ErrorScreen: View {
    @Environment(\.theme) private var theme

    private let provider: any MockProvider.Type
    private let state: ErrorScreenState
    private let liveState: ErrorScreenLiveState?

    @State private var chatInputValue: String = ""
    private let onMenuTap: () -> Void
    private let onSuggestionTap: (MockSuggestionChip) -> Void
    private let onSend: (String) -> Void

    public init(
        provider: (any MockProvider.Type) = ErrorMockProvider.self,
        variant: String = "default",
        onMenuTap: @escaping () -> Void = {},
        onSuggestionTap: @escaping (MockSuggestionChip) -> Void = { _ in }
    ) {
        self.provider = provider
        if let errorProvider = provider as? ErrorMockProvider.Type {
            state = errorProvider.value(variant: variant)
        } else {
            state = ErrorMockProvider.value(variant: variant)
        }
        liveState = nil
        self.onMenuTap = onMenuTap
        self.onSuggestionTap = onSuggestionTap
        onSend = { _ in }
    }

    init(
        liveState: ErrorScreenLiveState,
        onMenuTap: @escaping () -> Void = {},
        onSuggestionTap: @escaping (MockSuggestionChip) -> Void = { _ in },
        onSend: @escaping (String) -> Void = { _ in }
    ) {
        provider = ErrorMockProvider.self
        state = ErrorMockProvider.value(variant: "default")
        self.liveState = liveState
        self.onMenuTap = onMenuTap
        self.onSuggestionTap = onSuggestionTap
        self.onSend = onSend
    }

    public var body: some View {
        if let liveState {
            screenBody(
                errorBody: liveState.body,
                detail: liveState.detail,
                suggestions: liveState.suggestions,
                isRecovered: liveState.isRecovered,
                chatPlaceholder: liveState.chatPlaceholder,
                isChatEnabled: liveState.isChatEnabled,
                onSuggestionTap: { tappedLabel in
                    handleSuggestionTap(tappedLabel, suggestions: liveState.suggestions)
                },
                onSend: onSend
            )
        } else {
            screenBody(
                errorBody: state.error.body,
                detail: state.error.detail,
                suggestions: state.suggestions,
                isRecovered: state.error.body.contains("workaround") || state.error.body.contains("found a"),
                chatPlaceholder: "Try again, or let me know what to change…",
                isChatEnabled: !state.error.body.contains("offline") && !state.error.body.contains("connection"),
                onSuggestionTap: { tappedLabel in
                    handleSuggestionTap(tappedLabel, suggestions: state.suggestions)
                },
                onSend: { _ in }
            )
        }
    }

    private func screenBody(
        errorBody: String,
        detail: String?,
        suggestions: [MockSuggestionChip],
        isRecovered: Bool,
        chatPlaceholder: String,
        isChatEnabled: Bool,
        onSuggestionTap: @escaping (String) -> Void,
        onSend: @escaping (String) -> Void
    ) -> some View {
        LSMapLayer(
            map: {
                mapView(errorBody: errorBody)
            },
            topOverlays: [
                GlassOverlaySlot(
                    id: "error-callout",
                    content: {
                        errorCalloutView(
                            body: errorBody,
                            detail: detail,
                            suggestions: suggestions,
                            isRecovered: isRecovered,
                            onSuggestionTap: onSuggestionTap
                        )
                    }
                ),
            ],
            bottomOverlays: [
                GlassOverlaySlot(
                    id: "chatinput",
                    content: {
                        chatInputView(
                            placeholder: chatPlaceholder,
                            isEnabled: isChatEnabled,
                            onSend: onSend
                        )
                    }
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

    private func mapView(errorBody: String) -> some View {
        ZStack {
            LSMap(
                mode: .preview,
                camera: LSMapPresentationDefaults.errorCamera,
                cameraFit: .polyline(padding: .spacing5),
                polylines: [LSMapPresentationDefaults.errorPolyline]
            )
            .accessibilityIdentifier("errorscreen-map")

            if errorBody.contains("offline") || errorBody.contains("connection") {
                LSWifiOffWatermark(opacity: 0.25)
                    .accessibilityIdentifier("errorscreen-wifioff")
            }
        }
    }

    // MARK: - Error Callout

    private func errorCalloutView(
        body: String,
        detail: String?,
        suggestions: [MockSuggestionChip],
        isRecovered: Bool,
        onSuggestionTap: @escaping (String) -> Void
    ) -> some View {
        LSInlineErrorCallout(
            body: body,
            detail: detail,
            suggestions: suggestions.map(\.label),
            isRecovered: isRecovered,
            onSuggestionTap: { tappedLabel in
                onSuggestionTap(tappedLabel)
                chatInputValue = tappedLabel
            }
        )
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("errorscreen-callout")
    }

    // MARK: - Chat Input

    private func chatInputView(
        placeholder: String,
        isEnabled: Bool,
        onSend: @escaping (String) -> Void
    ) -> some View {
        LSChatInput(
            value: $chatInputValue,
            placeholder: placeholder,
            onSend: onSend,
            onCollapse: {},
            onFilter: {},
            suggestions: [],
            onSuggestionTap: { _ in },
            isEnabled: isEnabled
        )
        .opacity(isEnabled ? 1.0 : 0.7)
        .padding(.horizontal, theme.space.md)
        .accessibilityIdentifier("errorscreen-chatinput")
    }

    // MARK: - Helpers

    private func handleSuggestionTap(_ tappedLabel: String, suggestions: [MockSuggestionChip]) {
        if let chip = suggestions.first(where: { $0.label == tappedLabel }) {
            onSuggestionTap(chip)
        }
    }
}
