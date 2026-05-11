import LaneShadowTheme
import SwiftUI

/// IdleScreen — the dormant Navigator welcome screen.
///
/// Composes `LSMapLayer`, `LSTopBar`, and `LSChatInput`
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
        self.onZoomIn = onZoomIn ?? {}
        self.onZoomOut = onZoomOut ?? {}
        self.onRecenter = onRecenter ?? {}
    }

    public var body: some View {
        ZStack(alignment: .trailing) {
            LSMapLayer(
                map: {
                    mapView
                },
                topOverlays: [],
                bottomOverlays: [
                    GlassOverlaySlot(
                        id: "chatinput",
                        content: { chatInputView }
                    ),
                ],
                topBar: {
                    LSTopBar(
                        capsule: topBarCapsuleState,
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
        LSMap(
            mode: .preview,
            camera: LSMapPresentationDefaults.santaCruzCamera,
            favoriteLocations: state.showFavoritePins ? LSMapPresentationDefaults.idleFavoriteLocations : []
        )
        .accessibilityIdentifier("idlescreen-map")
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
            onLayers: nil,
            onToggleView: nil
        )
        .accessibilityIdentifier("idle-map-controls")
    }

    // MARK: - Helper Methods

    private var topBarCapsuleState: LSContextCapsule.CapsuleState {
        let headline = topBarHeadline
        // Parse meta string (e.g., "FRIDAY · 68°F · CLEAR") into individual components
        let metaItems = state.greeting.meta.split(separator: "·")
            .map { String($0).trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        return .idle(headline: headline, metaItems: metaItems)
    }

    private var topBarHeadline: AttributedString {
        if state.weatherAdvisory != nil {
            return emphasizedHeadline("Not the prettiest day for it.", emphasis: "prettiest")
        }

        if state.locationContext.mode == "needed" {
            return emphasizedHeadline("Where are we starting from?", emphasis: "starting")
        }

        if let displayName = greetingDisplayName {
            let scope = state.greeting.emphasis ?? "today"
            return emphasizedHeadline("Where are we riding \(scope), \(displayName)?", emphasis: scope)
        }

        return emphasizedHeadline(state.greeting.headline, emphasis: state.greeting.emphasis)
    }

    private func emphasizedHeadline(_ string: String, emphasis: String?) -> AttributedString {
        var headline = AttributedString(string)
        guard let emphasis,
              let range = headline.range(of: emphasis)
        else {
            return headline
        }

        var attrs = AttributeContainer()
        attrs.inlinePresentationIntent = .emphasized
        headline[range].setAttributes(attrs)
        return headline
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

// MARK: - Preview

#Preview {
    IdleScreen()
}
