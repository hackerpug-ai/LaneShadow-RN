import LaneShadowTheme
import SwiftUI

struct PlanningScreenContainer: View {
    @Environment(\.theme) private var theme
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

        ZStack {
            PlanningScreen(
                liveState: liveState,
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

            // Cancel confirm overlay (scrim + sheet)
            if viewModel.cancelConfirmationVisible {
                ZStack {
                    LSScrim(blocking: true)
                        .ignoresSafeArea()
                        .accessibilityIdentifier("planningscreen-scrim")

                    PlanningCancelConfirmSheet(
                        onConfirm: {
                            Task {
                                await viewModel.confirmCancellation()
                            }
                        },
                        onDismiss: {
                            viewModel.dismissCancelConfirmation()
                        }
                    )
                }
            }
        }
        .task {
            await viewModel.observe()
        }
        .onDisappear {
            viewModel.stopObserving()
        }
    }
}
