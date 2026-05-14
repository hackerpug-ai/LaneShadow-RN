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
            isSending: viewModel.isSending,
            shouldRenderMap: viewModel.shouldRenderMap,
            capsuleHeadline: viewModel.capsuleHeadline
        )

        PlanningScreen(
            liveState: liveState,
            onCollapse: {
                Task {
                    await viewModel.cancelPlanning()
                }
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
