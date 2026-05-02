import LaneShadowTheme
import SwiftUI

struct IdleScreenContainer: View {
    @Bindable private var viewModel: IdleViewModel

    init(viewModel: IdleViewModel) {
        self.viewModel = viewModel
    }

    var body: some View {
        IdleScreen(
            greetingDisplayName: viewModel.greetingDisplayName,
            suggestionLabels: viewModel.suggestionLabels,
            errorMessage: viewModel.errorMessage,
            isSubmitting: viewModel.isSubmitting,
            onSuggestionTap: { chip in
                Task {
                    await viewModel.submitSuggestion(chip.label)
                }
            },
            onSend: { message in
                Task {
                    await viewModel.submitSuggestion(message)
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
