import Combine
import LaneShadowTheme
import SwiftUI

struct IdleScreenContainer: View {
    @Environment(\.theme) private var theme
    @Bindable private var viewModel: IdleViewModel
    @State private var mapCameraController = LSMapCameraController()
    @State private var isMenuOpen: Bool = false
    @State private var isKeyboardVisible: Bool = false
    private let debugFrameObserver: ((String, CGRect) -> Void)?

    init(
        viewModel: IdleViewModel,
        mapCameraController: LSMapCameraController = LSMapCameraController(),
        debugFrameObserver: ((String, CGRect) -> Void)? = nil
    ) {
        self.viewModel = viewModel
        _mapCameraController = State(initialValue: mapCameraController)
        self.debugFrameObserver = debugFrameObserver
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
                // swiftlint:disable trailing_comma
                bottomOverlays: [
                    GlassOverlaySlot(
                        id: "chatinput",
                        content: { chatInputView }
                    ),
                ],
                // swiftlint:enable trailing_comma
                leadingDrawer: isMenuOpen ? DrawerSpec(
                    content: { menuDrawerContent },
                    onDismiss: { Task { @MainActor in closeMenu() } }
                ) : nil,
                topBar: {
                    LSIdleHeader(
                        capsuleState: viewModel.capsuleState,
                        isWarning: viewModel.weatherAdvisory != nil,
                        onMenuTap: toggleMenu,
                        onNewTap: handleNewTap
                    )
                    .padding(.horizontal, theme.space.md)
                    .opacity(isKeyboardVisible ? 0 : 1)
                    .allowsHitTesting(!isKeyboardVisible)
                    .animation(.easeInOut(duration: 0.22), value: isKeyboardVisible)
                }
            )
            .accessibilityIdentifier("idlescreen")
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

            // Map controls positioned at vertical center of right edge —
            // suppressed while typing so the input owns the screen
            VStack {
                Spacer()
                mapControlsView
                Spacer()
            }
            .padding(.trailing, theme.space.md)
            .opacity(isKeyboardVisible ? 0 : 1)
            .allowsHitTesting(!isKeyboardVisible)
            .animation(.easeInOut(duration: 0.22), value: isKeyboardVisible)
        }
        .onReceive(Self.keyboardVisibilityPublisher) { visible in
            isKeyboardVisible = visible
        }
        .task {
            // Skip observation during direct UI testing (variant state is pre-configured)
            #if DEBUG
                let isDirectTest = ProcessInfo.processInfo.arguments.contains("-DirectIdleScreenUITest")
                let isFocusLatencyProbe = ProcessInfo.processInfo.arguments.contains("-IdleFocusLatencyProbe")
                if !isDirectTest, !isFocusLatencyProbe {
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

    private static let keyboardVisibilityPublisher: AnyPublisher<Bool, Never> = {
        let show = NotificationCenter.default
            .publisher(for: UIResponder.keyboardWillShowNotification)
            .map { _ in true }
        let hide = NotificationCenter.default
            .publisher(for: UIResponder.keyboardWillHideNotification)
            .map { _ in false }
        return Publishers.Merge(show, hide).eraseToAnyPublisher()
    }()

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
        .reportFrame(as: "idle-map-controls", to: debugFrameObserver)
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
