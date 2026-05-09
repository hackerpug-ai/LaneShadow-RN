import LaneShadowTheme
import OSLog
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
    private let onNewTap: () -> Void
    private let onSuggestionTap: (MockSuggestionChip) -> Void
    private let onSend: (String) -> Void
    private let onZoomIn: () -> Void
    private let onZoomOut: () -> Void
    private let onRecenter: () -> Void
    private let onLayers: () -> Void
    private let onToggleView: () -> Void

    public init(
        provider: IdleMockProvider.Type = IdleMockProvider.self,
        variant: String = "default",
        greetingDisplayName: String? = nil,
        suggestionLabels: [String]? = nil,
        errorMessage: String? = nil,
        isSubmitting: Bool = false,
        chatInputValue: Binding<String>? = nil,
        onMenuTap: @escaping () -> Void = {},
        onNewTap: @escaping () -> Void = {},
        onSuggestionTap: @escaping (MockSuggestionChip) -> Void = { _ in },
        onSend: @escaping (String) -> Void = { _ in },
        onZoomIn: (() -> Void)? = nil,
        onZoomOut: (() -> Void)? = nil,
        onRecenter: (() -> Void)? = nil,
        onLayers: (() -> Void)? = nil,
        onToggleView: (() -> Void)? = nil
    ) {
        self.provider = provider
        state = provider.value(variant: variant)
        self.greetingDisplayName = greetingDisplayName
        self.suggestionLabels = suggestionLabels
        self.errorMessage = errorMessage
        self.isSubmitting = isSubmitting
        _chatInputValue = State(initialValue: chatInputValue?.wrappedValue ?? "")
        self.onMenuTap = onMenuTap
        self.onNewTap = onNewTap
        self.onSuggestionTap = onSuggestionTap
        self.onSend = onSend
        self.onZoomIn = onZoomIn ?? IdleScreenMapControlDefaults.logZoomInStub
        self.onZoomOut = onZoomOut ?? IdleScreenMapControlDefaults.logZoomOutStub
        self.onRecenter = onRecenter ?? IdleScreenMapControlDefaults.logRecenterStub
        self.onLayers = onLayers ?? IdleScreenMapControlDefaults.logLayersStub
        self.onToggleView = onToggleView ?? IdleScreenMapControlDefaults.logToggleViewStub
    }

    public var body: some View {
        ZStack(alignment: .trailing) {
            LSMapLayer(
                map: {
                    mapView
                },
                topOverlays: [
                    GlassOverlaySlot(
                        id: "context-capsule",
                        content: { capsuleView }
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
                        trailing: .newChip(action: onNewTap),
                        onMenuTap: onMenuTap,
                        onNewTap: onNewTap
                    )
                }
            )
            .accessibilityIdentifier("idlescreen")

            // Map controls positioned at vertical center of right edge
            VStack {
                Spacer()
                mapControlsView
                Spacer()
            }
            .padding(.trailing, theme.space.md)
        }
    }

    // MARK: - Map

    private var mapView: some View {
        LSPaperMap(
            overlayStyle: .contours,
            showPins: state.showFavoritePins
        )
        .accessibilityIdentifier("idlescreen-map")
    }

    // MARK: - Capsule View

    private var capsuleView: some View {
        let capsuleState = buildCapsuleState()
        return LSContextCapsule(
            state: capsuleState,
            isWarning: state.weatherAdvisory != nil,
            isSaved: false
        )
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.md)
        .accessibilityIdentifier("idle-context-capsule")
    }

    // MARK: - Map Controls View

    private var mapControlsView: some View {
        LSMapControls(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: onZoomIn,
            onZoomOut: onZoomOut,
            onRecenter: onRecenter,
            onLayers: onLayers,
            onToggleView: onToggleView
        )
        .accessibilityIdentifier("idle-map-controls")
    }

    // MARK: - Helper Methods

    private func buildCapsuleState() -> LSContextCapsule.CapsuleState {
        let metaItems = state.greeting.meta.split(separator: "·")
            .map { String($0).trimmingCharacters(in: .whitespaces) }

        // If weather advisory, use warning variant
        if state.weatherAdvisory != nil {
            var headline = AttributedString("Not the ")
            var prettiesPart = AttributedString("prettiest")
            var attrs = AttributeContainer()
            attrs.inlinePresentationIntent = .emphasized
            prettiesPart.setAttributes(attrs)
            headline.append(prettiesPart)
            headline.append(AttributedString(" day for it."))
            return .idle(headline: headline, metaItems: metaItems)
        }

        // Default: Use greeting state
        var headline = AttributedString("Where are we riding ")
        var scopePart = AttributedString(state.greeting.emphasis ?? "today")
        var attrs = AttributeContainer()
        attrs.inlinePresentationIntent = .emphasized
        scopePart.setAttributes(attrs)
        headline.append(scopePart)
        if let displayName = greetingDisplayName {
            headline.append(AttributedString(", \(displayName)?"))
        } else {
            headline.append(AttributedString("?"))
        }
        return .idle(headline: headline, metaItems: metaItems)
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
                // Preserve sandbox chip identity when available, but keep the
                // live label-backed submit path working even when the label is
                // not present in the mock provider suggestions.
                let mockChip = state.suggestions.first(where: { $0.label == chip.label })
                    ?? MockSuggestionChip(id: chip.label, label: chip.label)
                onSuggestionTap(mockChip)
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

private enum IdleScreenMapControlDefaults {
    private static let logger = Logger(subsystem: "com.laneshadow.app", category: "IdleScreen")

    static func logZoomInStub() {
        logger.info("Zoom in tapped in template idle screen; live camera host is provided by IdleScreenContainer")
    }

    static func logZoomOutStub() {
        logger.info("Zoom out tapped in template idle screen; live camera host is provided by IdleScreenContainer")
    }

    static func logRecenterStub() {
        logger
            .info(
                "[STUB] Recenter - template idle screen has no LSMapHost camera; Sprint 08 live path uses IdleScreenContainer"
            )
    }

    static func logLayersStub() {
        logger.info("[STUB] Layers toggle - Sprint 09")
    }

    static func logToggleViewStub() {
        logger.info("[STUB] Mode toggle - Sprint 08")
    }
}

// MARK: - Preview

#Preview {
    IdleScreen()
}
