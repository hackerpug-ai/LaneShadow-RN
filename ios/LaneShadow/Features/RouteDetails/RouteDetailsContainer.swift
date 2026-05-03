import LaneShadowTheme
import SwiftUI

/// RouteDetailsScreenContainer — mounted by the conversation planning flow.
///
/// Wraps RouteDetailsScreen with ViewModel, observes real enrichments and fingerprints,
/// and manages the SaveFavoriteSheet presentation state.
@MainActor
struct RouteDetailsScreenContainer: View {
    @Bindable private var viewModel: RouteDetailsViewModel

    init(viewModel: RouteDetailsViewModel) {
        self.viewModel = viewModel
    }

    var body: some View {
        RouteDetailsScreen(
            viewState: viewModel.viewState,
            onSave: {
                viewModel.handleSaveTap()
            },
            onRide: {
                viewModel.handleRideThisTap()
            },
            onDismiss: {
                viewModel.handleDismiss()
            }
        )
        .sheet(isPresented: $viewModel.presentingSaveFavoriteSheet) {
            SaveFavoriteSheetPlaceholder()
        }
        .task {
            await viewModel.observe()
        }
        .onDisappear {
            viewModel.stopObserving()
        }
    }
}
