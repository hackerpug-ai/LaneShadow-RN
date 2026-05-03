import SwiftUI

struct ErrorScreenContainer: View {
    @Bindable private var viewModel: ErrorScreenViewModel

    init(viewModel: ErrorScreenViewModel) {
        self.viewModel = viewModel
    }

    var body: some View {
        let liveState = viewModel.liveState

        ErrorScreen(
            liveState: liveState,
            onMenuTap: {},
            onSuggestionTap: { chip in
                viewModel.handleSuggestionTap(chip)
            },
            onSend: { message in
                viewModel.handleSend(message)
            }
        )
    }
}
