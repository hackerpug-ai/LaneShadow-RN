import SwiftUI

struct RouteResultsContainer: View {
    @Bindable private var viewModel: RouteResultsViewModel
    private let inspection: (any RouteResultsScreenInspectionSeam)?

    init(
        viewModel: RouteResultsViewModel,
        inspection: (any RouteResultsScreenInspectionSeam)? = nil
    ) {
        self.viewModel = viewModel
        self.inspection = inspection
    }

    var body: some View {
        let liveState = viewModel.viewState

        ZStack(alignment: .top) {
            RouteResultsScreen(
                state: liveState.screenState,
                camera: liveState.routeCamera,
                onPin: {},
                onDismiss: {},
                onRouteCardTap: { routeId in
                    viewModel.handleRouteCardTap(routeId)
                },
                inspection: inspection
            )

            if let error = liveState.error {
                LSToast(
                    message: "Route results unavailable",
                    detail: error.localizedDescription,
                    variant: .error,
                    isPresented: .constant(true)
                )
                .accessibilityIdentifier("routeresultsscreen-error-toast")
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
