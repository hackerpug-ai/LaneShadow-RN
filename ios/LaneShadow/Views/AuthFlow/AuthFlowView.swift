import SwiftUI

struct AuthFlowView: View {
    let route: AppState.AuthRoute?

    init(route: AppState.AuthRoute? = nil) {
        self.route = route
    }

    var body: some View {
        NavigationStack {
            if route == .signUp {
                SignUpView()
            } else if route == .oauthCallback {
                OAuthCallbackScreen(callbackURL: nil)
            } else {
                SignInView()
                    .toolbar {
                        NavigationLink("Create Account") {
                            SignUpView()
                        }
                    }
            }
        }
    }
}
