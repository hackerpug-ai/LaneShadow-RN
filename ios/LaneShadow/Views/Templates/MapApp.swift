import LaneShadowTheme
import SwiftUI

/// Unified MapApp screen that manages state-driven composition of map overlays.
/// The persistent map atom (LSMapLayer + LSMap) stays mounted across all states.
/// State transitions (idle ↔ planning ↔ routeResults) are mutations, never NavigationLink.
///
/// Cycle 1 (this task): Renders idle composition only. PlanningScreenContainer is left
/// untouched for Cycle 2-4 backwards compatibility. The legacy AppFlowView path remains
/// alive and will be deleted in Cycle 4.
struct MapApp: View {
    @Environment(\.appEnvironment) private var appEnvironment
    @Environment(\.theme) private var theme

    @Bindable var viewModel: MapAppViewModel
    @State private var mapCameraController = LSMapCameraController()
    @State private var isMenuOpen: Bool = false
    private let debugFrameObserver: ((String, CGRect) -> Void)?

    init(
        viewModel: MapAppViewModel,
        mapCameraController: LSMapCameraController = LSMapCameraController(),
        debugFrameObserver: ((String, CGRect) -> Void)? = nil
    ) {
        self.viewModel = viewModel
        _mapCameraController = State(initialValue: mapCameraController)
        self.debugFrameObserver = debugFrameObserver
    }

    var body: some View {
        // The map stays mounted across all states. State-driven overlays swap below.
        ZStack(alignment: .trailing) {
            LSMapLayer(
                map: {
                    LSMap(
                        mode: .interactive,
                        camera: Self.defaultCamera,
                        favoriteLocations: viewModel.idleViewModel.favoriteLocations,
                        cameraController: mapCameraController
                    )
                    .accessibilityElement(children: .ignore)
                    .accessibilityIdentifier("mapapp-map")
                    .accessibilityLabel("MapApp map camera state")
                    .accessibilityValue(mapCameraController.debugAccessibilityValue)
                },
                topOverlays: topOverlays,
                bottomOverlays: bottomOverlays,
                leadingDrawer: isMenuOpen ? DrawerSpec(
                    content: { menuDrawerContent },
                    onDismiss: { Task { @MainActor in closeMenu() } }
                ) : nil,
                topBar: {
                    LSTopBar(
                        onMenuTap: toggleMenu,
                        onNewTap: handleNewTap,
                        centerContent: { idleCapsuleView }
                    )
                }
            )
            .accessibilityIdentifier("idlescreen")  // Preserve for E2E tests
            .accessibilityValue(mapCameraController.debugAccessibilityValue)
            .reportFrame(as: "idlescreen-map-canvas", to: debugFrameObserver)

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
                let isFocusLatencyProbe = ProcessInfo.processInfo.arguments.contains("-IdleFocusLatencyProbe")
                if !isDirectTest, !isFocusLatencyProbe {
                    await viewModel.idleViewModel.observe()
                }
            #else
                await viewModel.idleViewModel.observe()
            #endif
        }
        .onChange(of: viewModel.idleViewModel.locationFixCount, initial: false) { oldValue, newValue in
            // First-fix auto-recenter: when CoreLocation yields its first real
            // location, animate the map from the Santa-Cruz fallback camera to
            // the user puck. Subsequent fixes don't recenter (user may have panned).
            if oldValue == 0, newValue > 0 {
                mapCameraController.recenterToUserLocation()
            }
        }
        .onChange(of: chatInputValue, initial: false) { _, newValue in
            viewModel.idleViewModel.updateChatInputQuery(newValue)
        }
        .onChange(of: viewModel.idleViewModel.autocompletePrimedInputValue, initial: false) { _, newValue in
            guard let newValue else {
                return
            }

            chatInputValue = newValue
            viewModel.idleViewModel.consumeAutocompletePrimedInputValue()
        }
        .onDisappear {
            viewModel.idleViewModel.stopObserving()
        }
    }

    private static let defaultCamera = LSMapPresentationDefaults.santaCruzCamera

    // MARK: - State-Driven Overlays (Cycle 1: idle only)

    private var topOverlays: [GlassOverlaySlot] {
        // Cycle 1: idle state has no top overlays.
        // Cycle 2: planning state will add LSPhaseIndicator + planning capsule.
        switch viewModel.currentState {
        case .idle:
            return []
        case .planning:
            return []  // Cycle 2 wires planning overlays
        case .routeResults:
            return []  // Sprint 09 wires route-results overlays
        }
    }

    private var bottomOverlays: [GlassOverlaySlot] {
        // Cycle 1: idle state shows the unlocked chat input.
        // Cycle 2: planning state swaps to the locked-thinking chat input.
        [
            GlassOverlaySlot(
                id: "chatinput",
                content: { AnyView(chatInputView) }
            ),
        ]
    }

    // MARK: - Menu Drawer

    private func toggleMenu() {
        isMenuOpen.toggle()
    }

    private func closeMenu() {
        isMenuOpen = false
    }

    private func handleNewTap() {
        viewModel.idleViewModel.startNewSession()
        chatInputValue = ""
        closeMenu()
    }

    private var menuDrawerContent: some View {
        LSSessionsDrawer(
            sessions: viewModel.idleViewModel.recentSessions,
            activeSessionId: nil,
            groupLabel: "RIDES",
            onSelect: { sessionId in
                Task { @MainActor in
                    closeMenu()
                    viewModel.idleViewModel.loadSession(sessionId: sessionId)
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

    // MARK: - Idle State Components

    private var idleCapsuleView: some View {
        LSContextCapsule(
            state: viewModel.idleViewModel.capsuleState,
            isWarning: viewModel.idleViewModel.weatherAdvisory != nil,
            isSaved: false,
            appearance: .chip
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Idle context capsule")
        .accessibilityIdentifier("idle-context-capsule")
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.md)
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
        .reportFrame(as: "idle-map-controls", to: debugFrameObserver)
    }

    // MARK: - Chat Input

    @State private var chatInputValue: String = ""

    private var chatInputView: some View {
        let suggestions = viewModel.idleViewModel.showsStaticRideSuggestions
            ? viewModel.idleViewModel.suggestionLabels.map { SuggestionChip(label: $0) }
            : []

        return LSChatInput(
            value: $chatInputValue,
            placeholder: viewModel.idleViewModel.chatPlaceholder,
            onSend: { message in
                Task { await viewModel.idleViewModel.submitSuggestion(message) }
            },
            onCollapse: {},
            onFilter: {},
            suggestions: suggestions,
            onSuggestionTap: { chip in
                // Tap-to-submit per idle-screen design spec — chip tap
                // transitions to PlanningScreen, not just text priming.
                chatInputValue = chip.label
                Task { await viewModel.idleViewModel.submitSuggestion(chip.label) }
            },
            autocompleteSuggestions: autocompleteSuggestions,
            onAutocompleteSuggestionTap: { suggestion in
                Task { @MainActor in
                    await viewModel.idleViewModel.selectPlaceSuggestion(suggestion.placeSuggestion)

                    if let primedInputValue = viewModel.idleViewModel.autocompletePrimedInputValue {
                        chatInputValue = primedInputValue
                        viewModel.idleViewModel.consumeAutocompletePrimedInputValue()
                    }
                }
            },
            isAutocompleteLoading: viewModel.idleViewModel.isPlaceAutocompleteLoading,
            autocompleteErrorMessage: viewModel.idleViewModel.placeAutocompleteErrorMessage,
            locationBadge: viewModel.idleViewModel.locationBadge,
            showsSendAction: viewModel.idleViewModel.selectedPlace != nil,
            isThinking: viewModel.idleViewModel.isSubmitting,
            isEnabled: !viewModel.idleViewModel.isSubmitting
        )
        .opacity(viewModel.idleViewModel.isSubmitting ? theme.opacity.disabled : 1.0)
        .padding(.horizontal, theme.space.md)
        .overlay(alignment: .bottomLeading) {
            if let errorMessage = viewModel.idleViewModel.errorMessage {
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
        viewModel.idleViewModel.placeAutocompleteSuggestions.map { suggestion in
            LSChatAutocompleteSuggestion(
                placeSuggestion: suggestion,
                accessibilityLabel: "\(suggestion.name), \(suggestion.label)"
            )
        }
    }
}

private struct FrameReportingModifier: ViewModifier {
    let identifier: String
    let observer: ((String, CGRect) -> Void)?

    func body(content: Content) -> some View {
        content.background {
            GeometryReader { proxy in
                Color.clear
                    .onAppear {
                        report(proxy.frame(in: .global))
                    }
                    .onChange(of: proxy.frame(in: .global), initial: true) { _, newFrame in
                        report(newFrame)
                    }
            }
        }
    }

    private func report(_ frame: CGRect) {
        guard frame != .zero else {
            return
        }

        observer?(identifier, frame)
    }
}

private extension View {
    func reportFrame(as identifier: String, to observer: ((String, CGRect) -> Void)?) -> some View {
        modifier(FrameReportingModifier(identifier: identifier, observer: observer))
    }
}
