import LaneShadowTheme
import SwiftUI

/// Brand-tasteful loading screen shown during auth bootstrap.
///
/// Displays while `RootView` resolves the Clerk session. Visible <1s in
/// normal launches; up to a few seconds on slow networks. Replaces the
/// bare `ProgressView()` placeholder that was causing the auth-screen
/// flash when `hasBootstrappedAuth` flipped before `synchronizeAuthentication`
/// had a chance to populate `appState.hasClerkSession`.
///
/// Composition per RULES.md brand philosophy: paper substrate, ink logo,
/// surgical copper accent. No gradients. No glows. All theme-token-driven.
struct BootstrapSplashView: View {
    @Environment(\.theme) private var theme
    @State private var dotOpacity: Double = 0.3

    var body: some View {
        ZStack {
            theme.colors.background.default
                .ignoresSafeArea()
            VStack(spacing: theme.space.lg) {
                LSLaneShadowLogo(
                    size: 80,
                    label: "LaneShadow",
                    testID: "auth.bootstrap.logo"
                )
                Circle()
                    .fill(theme.colors.accent.default)
                    .frame(width: 8, height: 8)
                    .opacity(dotOpacity)
            }
        }
        .accessibilityIdentifier("auth.bootstrap.loading")
        .accessibilityLabel("Loading LaneShadow")
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                dotOpacity = 1.0
            }
        }
    }
}
