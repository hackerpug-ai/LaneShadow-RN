import LaneShadowTheme
import SwiftUI

/// Unified MapApp screen that manages state-driven composition of map overlays.
/// The persistent map atom (LSMapLayer + LSMap) stays mounted across all states.
/// State transitions (idle ↔ planning ↔ routeResults) are mutations, never NavigationLink.
///
/// Cycle 2: Adds planning state composition. Idle→Planning triggered by IdleViewModel's
/// onSessionStarted callback (wrapped in RootView). Planning overlays include:
/// - Top: LSPhaseIndicator + planning capsule
/// - Bottom: locked LSChatInput (isThinking, isEnabled=false)
/// - Map animation: MapSketchAnimationLayer overlay when planning state is active
/// - Cancel-confirm sheet wired to planningViewModel.cancelConfirmationVisible
struct MapApp: View {
    @Environment(\.appEnvironment) private var appEnvironment
    @Environment(\.theme) private var theme

    @Bindable var viewModel: MapAppViewModel
    @State private var mapCameraController = LSMapCameraController()
    @State private var isMenuOpen: Bool = false
    @State private var persistentMapHostID = UUID().uuidString
    @State private var chatInputValue: String = ""
    @FocusState private var isIdleChatInputFocused: Bool
    private let debugFrameObserver: ((String, CGRect) -> Void)?
    private static let defaultCamera = LSMapPresentationDefaults.santaCruzCamera

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
                    .accessibilityIdentifier(mapAppMapIdentifier)
                    .accessibilityLabel("MapApp map camera state")
                    .accessibilityValue(mapAppMapAccessibilityValue)
                },
                topOverlays: topOverlays,
                bottomOverlays: bottomOverlays,
                leadingDrawer: isMenuOpen && viewModel.currentState == .idle ? DrawerSpec(
                    content: { menuDrawerContent },
                    onDismiss: { Task { @MainActor in closeMenu() } }
                ) : nil,
                topBar: { topBarView }
            )
            .accessibilityIdentifier(mapAppScreenIdentifier)
            .accessibilityValue(mapAppScreenAccessibilityValue)
            .reportFrame(as: "mapapp-map-canvas", to: debugFrameObserver)

            // Scrim with tap-to-dismiss when menu drawer is open (idle state only)
            if isMenuOpen, viewModel.currentState == .idle {
                LSScrim(
                    opacity: 0.35,
                    blocking: true,
                    onTap: closeMenu
                )
                .accessibilityIdentifier("mapapp-menu-scrim")
                .transition(.opacity)
            }

            // Map controls positioned at vertical center of right edge
            VStack {
                Spacer()
                mapControlsView
                Spacer()
            }
            .padding(.trailing, theme.space.md)

            // Planning cancel-confirm sheet overlay
            if viewModel.currentState.isPlanning, let planningViewModel = viewModel.planningViewModel,
               planningViewModel.cancelConfirmationVisible
            {
                ZStack {
                    LSScrim(blocking: true)
                        .ignoresSafeArea()
                        .accessibilityIdentifier("planningscreen-scrim")

                    PlanningCancelConfirmSheet(
                        onConfirm: {
                            Task {
                                await viewModel.confirmPlanningCancellation()
                            }
                        },
                        onDismiss: {
                            planningViewModel.dismissCancelConfirmation()
                        }
                    )
                }
            }
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
}

private extension MapApp {
    var mapAppScreenIdentifier: String {
        switch viewModel.currentState {
        case .idle:
            "idlescreen"
        case .planning:
            "planningscreen"
        case .routeResults:
            "planningscreen"
        }
    }

    var mapAppMapIdentifier: String {
        switch viewModel.currentState {
        case .idle:
            "idlescreen-map"
        case .planning:
            "planningscreen-map"
        case .routeResults:
            "planningscreen-map"
        }
    }

    var mapAppMapAccessibilityValue: String {
        "host=\(persistentMapHostID);\(mapAppScreenAccessibilityValue)"
    }

    var mapAppScreenAccessibilityValue: String {
        var values = [mapCameraController.debugAccessibilityValue]

        if viewModel.currentState.isPlanning {
            values.append("mode=\(planningControlsModeValue)")
            values.append("layers=\(planningLayersValue)")
        }

        return values.joined(separator: ";")
    }

    var planningControlsModeValue: String {
        viewModel.planningMapControlsMode == .map ? "map" : "chat"
    }

    var planningLayersValue: String {
        viewModel.planningLayersVisible ? "visible" : "hidden"
    }
}

private extension MapApp {
    var topOverlays: [GlassOverlaySlot] {
        switch viewModel.currentState {
        case .idle:
            return []
        case .planning:
            guard let planningViewModel = viewModel.planningViewModel else {
                return []
            }
            return [
                GlassOverlaySlot(id: "planning-context-capsule") {
                    planningContextCapsuleView(for: planningViewModel)
                },
                GlassOverlaySlot(id: "planning-phase-indicator") {
                    planningPhaseIndicatorView(for: planningViewModel)
                },
            ]
        case .routeResults:
            return []
        }
    }

    var bottomOverlays: [GlassOverlaySlot] {
        var overlays = [
            GlassOverlaySlot(id: "chatinput") {
                chatInputView
            },
        ]

        if viewModel.currentState.isPlanning {
            overlays.insert(
                GlassOverlaySlot(id: "sketch") {
                    MapSketchAnimationLayer(pathPoints: [])
                        .accessibilityIdentifier("planningscreen-sketch-polyline")
                },
                at: 0
            )
        }

        return overlays
    }
}

private extension MapApp {
    @ViewBuilder
    var topBarView: some View {
        switch viewModel.currentState {
        case .idle:
            LSIdleHeader(
                capsuleState: viewModel.idleViewModel.capsuleState,
                isWarning: viewModel.idleViewModel.weatherAdvisory != nil,
                onMenuTap: toggleMenu,
                onNewTap: handleNewTap
            )
            .padding(.horizontal, theme.space.md)
        case .planning, .routeResults:
            planningTopBarView
        }
    }

    func toggleMenu() {
        isMenuOpen.toggle()
    }

    func closeMenu() {
        isMenuOpen = false
    }

    func handleNewTap() {
        viewModel.idleViewModel.startNewSession()
        chatInputValue = ""
        closeMenu()
    }

    var menuDrawerContent: some View {
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
}

private extension MapApp {
    var planningTopBarView: some View {
        LSTopBar(
            trailing: LSTopBarTrailing.none,
            onMenuTap: { viewModel.requestCancelPlanning() },
            onNewTap: {}
        )
    }

    func planningContextCapsuleView(for planningViewModel: PlanningViewModel) -> some View {
        LSContextCapsule(
            state: .planning(headline: planningViewModel.capsuleHeadline),
            isWarning: false,
            isSaved: false,
            appearance: .chip
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Planning context capsule")
        .accessibilityIdentifier("planningscreen-context-capsule")
    }

    func planningPhaseIndicatorView(for planningViewModel: PlanningViewModel) -> some View {
        LSPhaseIndicator(
            phases: planningViewModel.phaseSteps,
            header: planningViewModel.capsuleHeadline
        )
        .padding(.top, theme.space.xxxl)
        .accessibilityIdentifier("planningscreen-phase-indicator")
    }

    var mapControlsView: some View {
        Group {
            switch viewModel.currentState {
            case .idle:
                idleMapControlsView
            case .planning:
                planningMapControlsView
            case .routeResults:
                routeResultsMapControlsView
            }
        }
    }

    var idleMapControlsView: some View {
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

    var planningMapControlsView: some View {
        LSMapControls(
            mode: viewModel.planningMapControlsMode,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: { mapCameraController.zoomIn() },
            onZoomOut: { mapCameraController.zoomOut() },
            onRecenter: { mapCameraController.recenterToUserLocation() },
            onLayers: { viewModel.togglePlanningLayers() },
            onToggleView: { viewModel.togglePlanningControlsMode() }
        )
        .accessibilityIdentifier("planningscreen-controls")
        .accessibilityValue("mode=\(planningControlsModeValue);layers=\(planningLayersValue)")
        .reportFrame(as: "planningscreen-controls", to: debugFrameObserver)
    }

    var routeResultsMapControlsView: some View {
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
        .accessibilityIdentifier("routeresultsscreen-controls")
        .reportFrame(as: "routeresultsscreen-controls", to: debugFrameObserver)
    }
}

private extension MapApp {
    var chatInputView: some View {
        switch viewModel.currentState {
        case .idle:
            AnyView(idleChatInputView)
        case .planning, .routeResults:
            AnyView(planningChatInputView)
        }
    }

    var idleChatInputView: some View {
        let suggestions = viewModel.idleViewModel.showsStaticRideSuggestions
            ? viewModel.idleViewModel.suggestionLabels.map { SuggestionChip(label: $0) }
            : []

        return LSChatInput(
            value: $chatInputValue,
            placeholder: viewModel.idleViewModel.chatPlaceholder,
            onSend: { message in
                Task { await viewModel.idleViewModel.submitSuggestion(message) }
            },
            onFilter: {},
            suggestions: suggestions,
            onSuggestionTap: { chip in
                chatInputValue = chip.label
                isIdleChatInputFocused = true
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
            isEnabled: !viewModel.idleViewModel.isSubmitting,
            externalFocus: $isIdleChatInputFocused
        )
        .opacity(viewModel.idleViewModel.isSubmitting ? theme.opacity.disabled : 1.0)
        .padding(.horizontal, theme.space.md)
        .overlay(alignment: .bottomLeading) {
            if let errorMessage = viewModel.idleViewModel.errorMessage {
                inlineErrorView(
                    message: errorMessage,
                    identifier: "idlescreen-inline-error"
                )
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("idlescreen-chatinput")
    }

    var planningChatInputView: some View {
        guard let planningViewModel = viewModel.planningViewModel else {
            return AnyView(EmptyView())
        }

        return AnyView(
            LSChatInput(
                value: .constant(""),
                placeholder: "Ask a follow-up question...",
                onSend: { message in
                    Task {
                        await planningViewModel.submitRefinement(message)
                    }
                },
                onCollapse: {
                    viewModel.requestCancelPlanning()
                },
                onFilter: {},
                suggestions: [],
                onSuggestionTap: { _ in },
                autocompleteSuggestions: [],
                onAutocompleteSuggestionTap: { _ in },
                isAutocompleteLoading: false,
                autocompleteErrorMessage: nil,
                locationBadge: nil,
                showsSendAction: true,
                isThinking: planningViewModel.isThinking,
                isEnabled: !planningViewModel.isThinking
            )
            .opacity(planningViewModel.isThinking ? theme.opacity.disabled : 1.0)
            .padding(.horizontal, theme.space.md)
            .overlay(alignment: .bottomLeading) {
                if let errorMessage = planningViewModel.errorMessage {
                    inlineErrorView(
                        message: errorMessage,
                        identifier: "planningscreen-inline-error"
                    )
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("planningscreen-chat-input")
            .accessibilityValue(
                "thinking=\(String(planningViewModel.isThinking));enabled=\(String(!planningViewModel.isThinking))"
            )
        )
    }

    var autocompleteSuggestions: [LSChatAutocompleteSuggestion] {
        viewModel.idleViewModel.placeAutocompleteSuggestions.map { suggestion in
            LSChatAutocompleteSuggestion(
                placeSuggestion: suggestion,
                accessibilityLabel: "\(suggestion.name), \(suggestion.label)"
            )
        }
    }

    func inlineErrorView(message: String, identifier: String) -> some View {
        Text(message)
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
            .accessibilityIdentifier(identifier)
    }
}

// MARK: - State Extension

extension MapAppState {
    var isPlanning: Bool {
        if case .planning = self {
            return true
        }
        return false
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
