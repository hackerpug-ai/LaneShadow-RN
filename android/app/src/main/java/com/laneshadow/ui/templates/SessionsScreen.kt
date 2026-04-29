package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.sandbox.mockproviders.SessionsScreenState
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.organisms.DrawerSpec
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSSessionsDrawer
import com.laneshadow.ui.organisms.Session
import com.laneshadow.ui.organisms.SessionSection
import com.laneshadow.ui.organisms.ScrimSpec

/**
 * Map mock provider Session to UI layer Session.
 */
private fun toUiSession(mockSession: com.laneshadow.sandbox.mockproviders.Session): Session {
    return Session(
        id = mockSession.id,
        title = mockSession.title,
        preview = mockSession.preview,
        meta = mockSession.meta,
        whenLabel = mockSession.`when`,
        isActive = mockSession.active,
        routeIds = mockSession.routeIds,
        createdAt = mockSession.createdAt
    )
}

/**
 * Release builds can compile against state variants without grouped sections.
 * Resolve grouped sections reflectively when the property exists.
 */
private fun resolveSections(state: SessionsScreenState): List<SessionSection>? {
    val rawSections = runCatching {
        state.javaClass.methods.firstOrNull { it.name == "getSections" }?.invoke(state)
    }.getOrNull() as? List<*> ?: return null

    val mappedSections = rawSections.mapNotNull { section ->
        val label = runCatching {
            section?.javaClass?.methods?.firstOrNull { it.name == "getLabel" }?.invoke(section)
        }.getOrNull() as? String ?: return@mapNotNull null

        val rawSessions = runCatching {
            section?.javaClass?.methods?.firstOrNull { it.name == "getSessions" }?.invoke(section)
        }.getOrNull() as? List<*> ?: return@mapNotNull null

        val sessions = rawSessions
            .mapNotNull { it as? com.laneshadow.sandbox.mockproviders.Session }
            .map(::toUiSession)

        SessionSection(label = label, sessions = sessions)
    }

    return mappedSections.ifEmpty { null }
}

private fun resolveShowConfirmDialog(state: SessionsScreenState): Boolean {
    val getter = state.javaClass.methods.firstOrNull { method ->
        method.name == "getShowConfirmDialog" || method.name == "isShowConfirmDialog"
    } ?: return false

    return (runCatching { getter.invoke(state) }.getOrNull() as? Boolean) == true
}

/**
 * SessionsScreen template — scrimmed map backdrop with left-anchored LSSessionsDrawer.
 *
 * Renders a non-interactive map preview with 0.35 opacity scrim and a left-anchored
 * drawer showing ride sessions grouped by recency. The active session is highlighted
 * with a signal stripe and tinted background.
 *
 * Driven entirely by mock data from SessionsMockProvider — no live data fetching.
 *
 * Motion: Drawer slides in from left via sidebarSlideIn (handled by LSMapLayer's
 * AnimatedVisibility). Scrim tap dismisses the drawer with reverse animation.
 *
 * @param state Screen state from SessionsMockProvider
 * @param onSelect Callback when a session row is tapped
 * @param onNew Callback when NEW button is tapped
 * @param onDismiss Callback when scrim is tapped (dismisses drawer)
 * @param onConfirmNew Callback when user confirms starting a new ride
 * @param onCancelNew Callback when user cancels starting a new ride
 * @param modifier Modifier for the root composable
 */
@Composable
fun SessionsScreen(
    state: SessionsScreenState,
    onSelect: (String) -> Unit,
    onNew: () -> Unit,
    onDismiss: () -> Unit,
    onConfirmNew: () -> Unit = {},
    onCancelNew: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSMapLayer(
        map = {
            // Non-interactive map preview (static camera, no user gestures)
            LSMap(
                mode = MapMode.Preview,
                camera = CameraPosition(
                    center = LatLng(37.8104, -122.4752),
                    zoom = 11.0,
                ),
                polylines = emptyList(), // No routes in sessions screen
            )
        },
        scrim = ScrimSpec(
            opacity = 0.35f,
        ),
        leadingDrawer = DrawerSpec(
            content = {
                LSSessionsDrawer(
                    sessions = state.sessions.map { toUiSession(it) },
                    activeSessionId = state.activeSessionId,
                    groupLabel = state.groupLabel ?: "THIS WEEK",
                    sections = resolveSections(state),
                    onSelect = onSelect,
                    onNew = onNew,
                    onDismiss = onDismiss,
                )
            },
            onDismiss = onDismiss,
        ),
        modifier = modifier.fillMaxSize(),
    )

    // S05: Show confirm dialog if requested
    if (resolveShowConfirmDialog(state)) {
        com.laneshadow.ui.molecules.LSConfirmDialog(
            title = "Start a new ride?",
            onConfirm = onConfirmNew,
            onDismiss = onCancelNew,
            confirmText = "Start new",
            cancelText = "Cancel",
        )
    }
}
