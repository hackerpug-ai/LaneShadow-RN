import LaneShadowTheme
import OSLog
import SwiftUI

struct IdleScreenContainer: View {
    @Environment(\.theme) private var theme
    @Bindable private var viewModel: IdleViewModel
    @State private var mapCameraController = LSMapCameraController()

    init(
        viewModel: IdleViewModel,
        mapCameraController: LSMapCameraController = LSMapCameraController()
    ) {
        self.viewModel = viewModel
        _mapCameraController = State(initialValue: mapCameraController)
    }

    var body: some View {
        ZStack(alignment: .trailing) {
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .preview,
                        camera: Self.defaultCamera,
                        favoriteLocations: viewModel.favoriteLocations,
                        cameraController: mapCameraController
                    )
                    .accessibilityElement(children: .ignore)
                    .accessibilityIdentifier("idlescreen-map")
                    .accessibilityLabel("Idle map camera state")
                    .accessibilityValue(mapCameraController.debugAccessibilityValue)
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
                        trailing: .none,
                        onMenuTap: {},
                        onNewTap: {}
                    )
                }
            )
            .accessibilityIdentifier("idlescreen")
            .accessibilityValue(mapCameraController.debugAccessibilityValue)

            // Map controls positioned at vertical center of right edge
            VStack {
                Spacer()
                mapControlsView
                Spacer()
            }
            .padding(.trailing, theme.space.md)
        }
        .task {
            // Skip observation during direct UI testing (variant state is pre-configured)
            #if DEBUG
                let isDirectTest = ProcessInfo.processInfo.arguments.contains("-DirectIdleScreenUITest")
                if !isDirectTest {
                    await viewModel.observe()
                }
            #else
                await viewModel.observe()
            #endif
        }
        .onChange(of: chatInputValue, initial: false) { _, newValue in
            viewModel.updateChatInputQuery(newValue)
        }
        .onChange(of: viewModel.autocompletePrimedInputValue, initial: false) { _, newValue in
            guard let newValue else {
                return
            }

            chatInputValue = newValue
            viewModel.consumeAutocompletePrimedInputValue()
        }
        .onDisappear {
            viewModel.stopObserving()
        }
    }

    private static let defaultCamera = CameraPosition(
        center: LatLng(lat: 36.97, lon: -122.03),
        zoom: 12
    )

    // MARK: - Capsule View

    private var capsuleView: some View {
        LSContextCapsule(
            state: viewModel.capsuleState,
            isWarning: viewModel.weatherAdvisory != nil,
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
            onZoomIn: { mapCameraController.zoomIn() },
            onZoomOut: { mapCameraController.zoomOut() },
            onRecenter: { mapCameraController.recenterToUserLocation() },
            onLayers: {
                Logger(subsystem: "com.laneshadow.app", category: "IdleScreen")
                    .info("[STUB] Layers toggle - Sprint 09")
            },
            onToggleView: {
                Logger(subsystem: "com.laneshadow.app", category: "IdleScreen")
                    .info("[STUB] Mode toggle - Sprint 08")
            }
        )
        .accessibilityIdentifier("idle-map-controls")
    }

    // MARK: - Chat Input

    @State private var chatInputValue: String = ""

    private var chatInputView: some View {
        let suggestions = viewModel.showsStaticRideSuggestions
            ? viewModel.suggestionLabels.map { SuggestionChip(label: $0) }
            : []

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
            },
            autocompleteSuggestions: autocompleteSuggestions,
            onAutocompleteSuggestionTap: { suggestion in
                Task { @MainActor in
                    await viewModel.selectPlaceSuggestion(suggestion.placeSuggestion)

                    if let primedInputValue = viewModel.autocompletePrimedInputValue {
                        chatInputValue = primedInputValue
                        viewModel.consumeAutocompletePrimedInputValue()
                    }
                }
            },
            isAutocompleteLoading: viewModel.isPlaceAutocompleteLoading,
            autocompleteErrorMessage: viewModel.placeAutocompleteErrorMessage,
            showsSendAction: viewModel.selectedPlace != nil,
            isThinking: viewModel.isSubmitting,
            isEnabled: !viewModel.isSubmitting
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

    private var autocompleteSuggestions: [LSChatAutocompleteSuggestion] {
        viewModel.placeAutocompleteSuggestions.map { suggestion in
            LSChatAutocompleteSuggestion(
                placeSuggestion: suggestion,
                accessibilityLabel: "\(suggestion.name), \(suggestion.label)"
            )
        }
    }
}
