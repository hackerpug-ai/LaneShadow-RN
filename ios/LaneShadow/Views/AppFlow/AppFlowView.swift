import SwiftUI

struct AppFlowView: View {
    let route: AppState.AppRoute?

    init(route: AppState.AppRoute? = nil) {
        self.route = route
    }

    var body: some View {
        NavigationStack {
            AppHomeView()
        }
    }
}
