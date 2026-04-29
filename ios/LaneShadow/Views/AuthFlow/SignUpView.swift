import SwiftUI

struct SignUpView: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState

    var body: some View {
        SignUpScreen(appState: appState, viewModel: SignUpViewModel(auth: appEnvironment.clerkAuth))
    }
}
