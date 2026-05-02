import LaneShadowTheme
import SwiftUI

struct PlanningScreenContainer: View {
    @Bindable private var viewModel: PlanningViewModel

    init(viewModel: PlanningViewModel) {
        self.viewModel = viewModel
    }

    var body: some View {
        let liveState = PlanningScreenLiveState(
            messages: viewModel.messages,
            phases: viewModel.phases,
            errorMessage: viewModel.errorMessage,
            isThinking: viewModel.isThinking,
            shouldRenderMap: viewModel.shouldRenderMap
        )

        PlanningScreen(
            liveState: liveState,
            onCollapse: {
                Task {
                    await viewModel.cancelPlanning()
                }
            }
        )
        .task {
            await viewModel.observe()
        }
        .onDisappear {
            viewModel.stopObserving()
        }
    }
}
