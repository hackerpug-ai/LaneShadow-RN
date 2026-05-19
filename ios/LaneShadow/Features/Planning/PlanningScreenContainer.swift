import SwiftUI

struct PlanningScreenContainer: View {
    @Bindable private var viewModel: PlanningViewModel
    @State private var mapCameraController = LSMapCameraController()
    @State private var mapControlsMode: LSMapControlsMode = .map
    @State private var planningLayersVisible = true

    init(viewModel: PlanningViewModel) {
        self.viewModel = viewModel
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
                mode: mapControlsMode,
                onZoomIn: { mapCameraController.zoomIn() },
                onZoomOut: { mapCameraController.zoomOut() },
                onRecenter: { mapCameraController.recenterToUserLocation() },
                onLayers: {
                    planningLayersVisible.toggle()
                },
                onToggleView: {
                    mapControlsMode = mapControlsMode == .map ? .chat : .map
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
        let modeValue = mapControlsMode == .map ? "map" : "chat"
        let layersValue = planningLayersVisible ? "visible" : "hidden"
        return "\(mapCameraController.debugAccessibilityValue);mode=\(modeValue);layers=\(layersValue)"
    }
}
