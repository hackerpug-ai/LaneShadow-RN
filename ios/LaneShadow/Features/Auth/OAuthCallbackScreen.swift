import LaneShadowTheme
import SwiftUI

struct OAuthCallbackScreen: View {
    @Environment(\.theme) private var theme

    let callbackURL: URL?
    let onAuthenticated: (String) async -> Void

    @State private var statusMessage = "Completing sign in..."

    init(callbackURL: URL?, onAuthenticated: @escaping (String) async -> Void = { _ in }) {
        self.callbackURL = callbackURL
        self.onAuthenticated = onAuthenticated
    }

    var body: some View {
        AuthBackgroundContainer {
            VStack(spacing: theme.space.md) {
                LSSpinner()
                LSText(statusMessage, variant: .body.md)
            }
            .padding(theme.space.lg)
            .task {
                await completeAuth()
            }
        }
        .navigationTitle("OAuth")
    }

    private func completeAuth() async {
        guard let token = Self.parseToken(from: callbackURL) else {
            statusMessage = "Missing auth token."
            return
        }

        await onAuthenticated(token)
        statusMessage = "Signed in"
    }

    static func parseToken(from url: URL?) -> String? {
        guard let url else { return nil }

        if let tokenQuery = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first(where: { $0.name == "token" })?
            .value,
            !tokenQuery.isEmpty {
            return tokenQuery
        }

        if let fragment = URLComponents(url: url, resolvingAgainstBaseURL: false)?.fragment,
           fragment.contains("token=") {
            let fragmentComponents = URLComponents(string: "https://laneshadow.app?\(fragment)")
            return fragmentComponents?.queryItems?.first(where: { $0.name == "token" })?.value
        }

        return nil
    }
}
