import SwiftUI

struct SignInView: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState

    var body: some View {
        SignInScreen(appState: appState, viewModel: SignInViewModel(auth: appEnvironment.clerkAuth))
    }
}
