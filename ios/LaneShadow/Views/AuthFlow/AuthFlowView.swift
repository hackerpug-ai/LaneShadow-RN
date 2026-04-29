import SwiftUI

struct AuthFlowView: View {
    var body: some View {
        NavigationStack {
            SignInView()
                .toolbar {
                    NavigationLink("Create Account") {
                        SignUpView()
                    }
                }
        }
    }
}
