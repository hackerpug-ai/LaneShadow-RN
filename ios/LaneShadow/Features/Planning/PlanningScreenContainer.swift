import SwiftUI

@MainActor
@Observable
final class PlanningLiveControlsState {
    var mapControlsMode: LSMapControlsMode
    var layersVisible: Bool

    init(
        mapControlsMode: LSMapControlsMode = .map,
        layersVisible: Bool = true
    ) {
        self.mapControlsMode = mapControlsMode
        self.layersVisible = layersVisible
    }

    func toggleLayers() {
        layersVisible.toggle()
    }

    func toggleViewMode() {
        mapControlsMode = mapControlsMode == .map ? .chat : .map
    }
}

struct PlanningScreenContainer: View {
    @Bindable private var viewModel: PlanningViewModel
    @State private var mapCameraController = LSMapCameraController()
    @State private var controlsState: PlanningLiveControlsState

    init(
        viewModel: PlanningViewModel,
        controlsState: PlanningLiveControlsState = PlanningLiveControlsState()
    ) {
        self.viewModel = viewModel
        _controlsState = State(initialValue: controlsState)
    }

    var body: some View {
        let liveState = PlanningScreenLiveState(
            messages: viewModel.messages,
            phases: viewModel.phases,
            errorMessage: viewModel.errorMessage,
            isThinking: viewModel.isThinking,
            isSending: viewModel.isSending,
            shouldRenderMap: viewModel.shouldRenderMap,
            capsuleHeadline: viewModel.capsuleHeadline,
            cancelConfirmationVisible: viewModel.cancelConfirmationVisible
        )

        PlanningScreen(
            liveState: liveState,
            liveMapConfiguration: PlanningLiveMapConfiguration(
                accessibilityValue: planningMapAccessibilityValue
            ) {
                LSMap(
                    mode: .interactive,
                    camera: PlanningScreen.defaultCamera,
                    cameraController: mapCameraController
                )
            },
            liveMapControlsConfiguration: PlanningMapControlsConfiguration(
                mode: controlsState.mapControlsMode,
                layersVisible: controlsState.layersVisible,
                onZoomIn: { mapCameraController.zoomIn() },
                onZoomOut: { mapCameraController.zoomOut() },
                onRecenter: { mapCameraController.recenterToUserLocation() },
                onLayers: {
                    controlsState.toggleLayers()
                },
                onToggleView: {
                    controlsState.toggleViewMode()
                }
            ),
            onCollapse: {
                viewModel.requestCancelConfirmation()
            },
            onSend: { message in
                Task {
                    await viewModel.submitRefinement(message)
                }
            },
            onRetry: { messageId in
                Task {
                    await viewModel.retryPending(id: messageId)
                }
            },
            onRequestCancelConfirmation: {
                viewModel.requestCancelConfirmation()
            }
        )
        .task {
            await viewModel.observe()
        }
        .onDisappear {
            viewModel.stopObserving()
        }
    }

    private var planningMapAccessibilityValue: String {
        let modeValue = controlsState.mapControlsMode == .map ? "map" : "chat"
        let layersValue = controlsState.layersVisible ? "visible" : "hidden"
        return "\(mapCameraController.debugAccessibilityValue);mode=\(modeValue);layers=\(layersValue)"
    }
}
