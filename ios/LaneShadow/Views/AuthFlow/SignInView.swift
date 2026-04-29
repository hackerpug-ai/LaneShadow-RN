import SwiftUI

struct SignInView: View {
    @Environment(\.appEnvironment) private var appEnvironment

    var body: some View {
        SignInScreen(viewModel: SignInViewModel(auth: appEnvironment.clerkAuth))
    }
}
