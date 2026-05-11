import LaneShadowTheme
import SwiftUI

struct AuthMapBackdrop: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            LSMap(
                mode: .preview,
                camera: LSMapPresentationDefaults.authCamera
            )
            .ignoresSafeArea()
            .accessibilityIdentifier("authscreen-map-background")

            LinearGradient(
                colors: [
                    LaneShadowTheme.color.surface.overlay.opacity(colorScheme == .dark ? 0.72 : 0.54),
                    LaneShadowTheme.color.surface.overlay.opacity(colorScheme == .dark ? 0.62 : 0.42),
                    LaneShadowTheme.color.surface.glass.opacity(colorScheme == .dark ? 0.72 : 0.76),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        }
        .accessibilityIdentifier("authscreen-map-background-container")
    }
}

struct AuthBackgroundContainer<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        ZStack {
            AuthMapBackdrop()
            content
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
