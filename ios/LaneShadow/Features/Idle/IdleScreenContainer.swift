import LaneShadowTheme
import SwiftUI

struct IdleScreenContainer: View {
    @Environment(\.theme) private var theme
    @Bindable private var viewModel: IdleViewModel

    init(viewModel: IdleViewModel) {
        self.viewModel = viewModel
    }

    var body: some View {
        LSMapLayer(
            map: {
                LSMap(
                    mode: .preview,
                    camera: Self.defaultCamera,
                    favoriteLocations: viewModel.favoriteLocations
                )
                .accessibilityIdentifier("idlescreen-map")
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
                    onMenuTap: {},
                    onNewTap: {}
                )
            }
        )
        .accessibilityIdentifier("idlescreen")
        .task {
            await viewModel.observe()
        }
        .onDisappear {
            viewModel.stopObserving()
        }
    }

    private static let defaultCamera = CameraPosition(
        center: LatLng(lat: 36.97, lon: -122.03),
        zoom: 12
    )

    // MARK: - Greeting Overlay

    private var greetingOverlay: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text(
                "Good \(viewModel.greetingScope == .tonight ? "evening" : "morning"), \(viewModel.greetingDisplayName)"
            )
            .font(theme.type.opinion.xl.font)
            .foregroundStyle(LaneShadowTheme.color.content.primary)
            .accessibilityIdentifier("idlescreen-current-user-greeting")

            if let locationLabel = viewModel.locationLabel {
                HStack(spacing: theme.space.xs) {
                    Image(systemName: "location.fill")
                        .font(theme.type.label.sm.font)
                        .foregroundStyle(LaneShadowTheme.color.signal.default)

                    Text(locationLabel)
                        .font(theme.type.label.sm.font)
                        .foregroundStyle(LaneShadowTheme.color.signal.default)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Location: \(locationLabel)")
                .accessibilityIdentifier("idlescreen-location-pill")
            }

            if !viewModel.metaRow.isEmpty {
                Text(viewModel.metaRow)
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(metaColor)
                    .accessibilityIdentifier("idlescreen-greeting-meta")
            }

            if let advisory = viewModel.weatherAdvisory {
                HStack(alignment: .top, spacing: 0) {
                    Rectangle()
                        .fill(LaneShadowTheme.color.status.warning.default.opacity(0.6))
                        .frame(width: 4)

                    VStack(alignment: .leading, spacing: theme.space.sm) {
                        Text(advisory.label)
                            .font(theme.type.label.sm.font)
                            .foregroundStyle(LaneShadowTheme.color.status.warning.default.opacity(0.8))

                        Text(advisory.body)
                            .font(theme.type.opinion.sm.font)
                            .italic()
                            .foregroundStyle(LaneShadowTheme.color.content.primary)
                    }
                    .padding(theme.space.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(LaneShadowTheme.color.status.warning.tint)
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

    private var metaColor: Color {
        if viewModel.weatherAdvisory != nil {
            return LaneShadowTheme.color.status.warning.default
        }
        return LaneShadowTheme.color.signal.default
    }

    // MARK: - Chat Input

    @State private var chatInputValue: String = ""

    private var chatInputView: some View {
        let suggestions = viewModel.suggestionLabels.map { SuggestionChip(label: $0) }

        return LSChatInput(
            value: $chatInputValue,
            placeholder: "Plan a ride…",
            onSend: { message in
                Task { await viewModel.submitSuggestion(message) }
            },
            onCollapse: {},
            onFilter: {},
            suggestions: suggestions,
            onSuggestionTap: { chip in
                chatInputValue = chip.label
                Task { await viewModel.submitSuggestion(chip.label) }
            },
            isThinking: viewModel.isSubmitting,
            isEnabled: viewModel.isLocationEnabled && !viewModel.isSubmitting
        )
        .opacity(viewModel.isSubmitting ? theme.opacity.disabled : 1.0)
        .padding(.horizontal, theme.space.md)
        .overlay(alignment: .bottomLeading) {
            if let errorMessage = viewModel.errorMessage {
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
