import LaneShadowTheme
import SwiftUI

/// SessionsScreen — left-anchored drawer over dimmed map showing ride history.
///
/// Composes `LSMapLayer` with scrim at 0.35 opacity and `LSSessionsDrawer`
/// in the leadingDrawer slot. Data sourced entirely from `SessionsMockProvider`.
public struct SessionsScreen: View {
    @Environment(\.theme) private var theme
    @State private var isDrawerPresented: Bool = true

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
        ZStack {
            LSMapLayer(
                map: { mapView },
                scrim: nil, // Manual scrim rendering required for tap gesture support (AC-4)
                leadingDrawer: isDrawerPresented ? DrawerSpec(
                    content: {
                        drawerContent
                    },
                    onDismiss: {}
                ) : nil
            )
            .accessibilityIdentifier("sessionsscreen")

            // Scrim with tap gesture for dismiss (AC-4 requirement)
            // Note: LSMapLayer scrim slot doesn't support tap handlers, so we render manually
            if isDrawerPresented {
                LSScrim(
                    opacity: 0.35,
                    blocking: true,
                    onTap: handleDismiss
                )
                .accessibilityIdentifier("sessionsscreen-scrim")
                .transition(.opacity)
            }
        }
    }

    // MARK: - Drawer Content with Animation

    private var drawerContent: some View {
        LSSessionsDrawer(
            sessions: state.sessions,
            activeSessionId: state.activeSessionId,
            groupLabel: "THIS WEEK",
            onSelect: onSelect,
            onNew: onNew,
            onDismiss: onDismiss
        )
        .transition(sidebarSlideInTransition)
        .animation(sidebarSlideInAnimation, value: isDrawerPresented)
    }

    // MARK: - Motion Recipes

    private var sidebarSlideInAnimation: Animation {
        let duration = theme.motion.duration["standard"] ?? 240
        let easing = theme.motion.easing["decelerated"] ?? [0, 0, 0.2, 1]
        return Animation.timingCurve(
            easing[0],
            easing[1],
            easing[2],
            easing[3],
            duration: Double(duration) / 1000
        )
    }

    private var sidebarSlideInTransition: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .leading).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }

    // MARK: - Dismiss Handler

    private func handleDismiss() {
        withAnimation(sidebarSlideInAnimation) {
            isDrawerPresented = false
        }
        // Call onDismiss immediately (scrim tap is user action)
        onDismiss()
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
