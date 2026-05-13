import LaneShadowTheme
import SwiftUI

struct IdleScreenContainer: View {
    @Environment(\.theme) private var theme
    @Bindable private var viewModel: IdleViewModel
    @State private var mapCameraController = LSMapCameraController()
    @State private var isMenuOpen: Bool = false

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
                        mode: .interactive,
                        camera: Self.defaultCamera,
                        favoriteLocations: viewModel.favoriteLocations,
                        cameraController: mapCameraController
                    )
                    .accessibilityElement(children: .ignore)
                    .accessibilityIdentifier("idlescreen-map")
                    .accessibilityLabel("Idle map camera state")
                    .accessibilityValue(mapCameraController.debugAccessibilityValue)
                },
                topOverlays: [],
                bottomOverlays: [
                    GlassOverlaySlot(
                        id: "chatinput",
                        content: { chatInputView }
                    ),
                ],
                leadingDrawer: isMenuOpen ? DrawerSpec(
                    content: { menuDrawerContent },
                    onDismiss: { Task { @MainActor in closeMenu() } }
                ) : nil,
                topBar: {
                    LSTopBar(
                        capsule: viewModel.capsuleState,
                        trailing: .newChip(action: handleNewTap),
                        onMenuTap: toggleMenu,
                        onNewTap: handleNewTap
                    )
                }
            )
            .accessibilityIdentifier("idlescreen")
            .accessibilityValue(mapCameraController.debugAccessibilityValue)

            // Scrim with tap-to-dismiss when menu drawer is open
            if isMenuOpen {
                LSScrim(
                    opacity: 0.35,
                    blocking: true,
                    onTap: closeMenu
                )
                .accessibilityIdentifier("idlescreen-menu-scrim")
                .transition(.opacity)
            }

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
        .onChange(of: viewModel.locationFixCount, initial: false) { oldValue, newValue in
            // First-fix auto-recenter: when CoreLocation yields its first real
            // location, animate the map from the Santa-Cruz fallback camera to
            // the user puck. Subsequent fixes don't recenter (user may have panned).
            if oldValue == 0, newValue > 0 {
                mapCameraController.recenterToUserLocation()
            }
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

    private static let defaultCamera = LSMapPresentationDefaults.santaCruzCamera

    // MARK: - Menu Drawer

    private func toggleMenu() {
        isMenuOpen.toggle()
    }

    private func closeMenu() {
        isMenuOpen = false
    }

    private func handleNewTap() {
        viewModel.startNewSession()
        chatInputValue = ""
        closeMenu()
    }

    private var menuDrawerContent: some View {
        LSSessionsDrawer(
            sessions: viewModel.recentSessions,
            activeSessionId: nil,
            groupLabel: "RIDES",
            onSelect: { sessionId in
                Task { @MainActor in
                    closeMenu()
                    viewModel.loadSession(sessionId: sessionId)
                }
            },
            onNew: {
                Task { @MainActor in
                    handleNewTap()
                }
            },
            onDismiss: {
                Task { @MainActor in
                    closeMenu()
                }
            }
        )
        .accessibilityIdentifier("idlescreen-menu-drawer")
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
            onLayers: nil,
            onToggleView: nil
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
            placeholder: viewModel.chatPlaceholder,
            onSend: { message in
                Task { await viewModel.submitSuggestion(message) }
            },
            onCollapse: {},
            onFilter: {},
            suggestions: suggestions,
            onSuggestionTap: { chip in
                // Tap-to-submit per idle-screen design spec — chip tap
                // transitions to PlanningScreen, not just text priming.
                chatInputValue = chip.label
                Task { await viewModel.submitSuggestion(chip.label) }
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
            locationBadge: viewModel.locationBadge,
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
        // .contain so the parent id remains queryable from XCUITest alongside
        // child `lschatinput*` ids; without this, SwiftUI collapses the
        // outer id when the inner LSChatInput sets its own identifier.
        .accessibilityElement(children: .contain)
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
