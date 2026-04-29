import LaneShadowTheme
import SwiftUI

enum LSAuthProvider: CaseIterable {
    case apple
    case google

    var title: String {
        switch self {
        case .apple:
            "Continue with Apple"
        case .google:
            "Continue with Google"
        }
    }

    var icon: IconName {
        switch self {
        case .apple:
            .star
        case .google:
            .circle
        }
    }

    var accessibilityIdentifier: String {
        switch self {
        case .apple:
            "auth.signIn.apple"
        case .google:
            "auth.signIn.google"
        }
    }
}

struct LSAuthProviderButton: View {
    let provider: LSAuthProvider
    let action: () -> Void

    var body: some View {
        LSButton(
            provider.title,
            variant: .secondary,
            size: .md,
            leadingIcon: provider.icon,
            action: action
        )
        .accessibilityIdentifier(provider.accessibilityIdentifier)
    }
}
