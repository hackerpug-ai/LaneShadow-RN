package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.sandbox.mockproviders.SessionsScreenState
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.organisms.DrawerSpec
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSSessionsDrawer
import com.laneshadow.ui.organisms.Session
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
 * @param modifier Modifier for the root composable
 */
@Composable
fun SessionsScreen(
    state: SessionsScreenState,
    onSelect: (String) -> Unit,
    onNew: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
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
                    groupLabel = "THIS WEEK",
                    onSelect = onSelect,
                    onNew = onNew,
                    onDismiss = onDismiss,
                )
            },
            onDismiss = onDismiss,
        ),
        modifier = modifier.fillMaxSize(),
    )
}
