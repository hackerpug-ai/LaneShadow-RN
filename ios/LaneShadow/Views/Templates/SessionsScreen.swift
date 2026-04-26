import LaneShadowTheme
import SwiftUI

/// SessionsScreen — left-anchored drawer over dimmed map showing ride history.
///
/// Composes `LSMapLayer` with scrim at 0.35 opacity and `LSSessionsDrawer`
/// in the leadingDrawer slot. Data sourced entirely from `SessionsMockProvider`.
public struct SessionsScreen: View {
    @Environment(\.theme) private var theme

    private let provider: SessionsMockProvider.Type
    private let state: SessionsScreenState
    let onSelect: @Sendable (String) -> Void
    let onNew: @Sendable () -> Void
    let onDismiss: @Sendable () -> Void

    public init(
        provider: SessionsMockProvider.Type = SessionsMockProvider.self,
        onSelect: @escaping @Sendable (String) -> Void = { _ in },
        onNew: @escaping @Sendable () -> Void = {},
        onDismiss: @escaping @Sendable () -> Void = {}
    ) {
        self.provider = provider
        state = provider.value(variant: "default")
        self.onSelect = onSelect
        self.onNew = onNew
        self.onDismiss = onDismiss
    }

    public var body: some View {
        LSMapLayer(
            map: { mapView },
            scrim: ScrimSpec(opacity: 0.35),
            leadingDrawer: DrawerSpec(
                content: {
                    LSSessionsDrawer(
                        sessions: state.sessions,
                        activeSessionId: state.activeSessionId,
                        groupLabel: "THIS WEEK",
                        onSelect: onSelect,
                        onNew: onNew,
                        onDismiss: onDismiss
                    )
                },
                onDismiss: onDismiss
            )
        )
        .accessibilityIdentifier("sessionsscreen")
    }

    // MARK: - Map

    private var mapView: some View {
        ZStack {
            // Placeholder map background
            LinearGradient(
                gradient: Gradient(colors: [
                    theme.colors.surface.default,
                    theme.colors.background.default
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Map content (using neutral placeholder)
            Text("Map Layer")
                .foregroundStyle(theme.colors.onSurface.default)
                .font(.body)
        }
        .accessibilityIdentifier("sessionsscreen-map")
    }
}

// MARK: - Preview

#Preview {
    SessionsScreen()
}
