package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.laneshadow.sandbox.mockproviders.RouteResultsScreenState
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.CameraFit
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.atoms.SpacingToken
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.LSRouteAttachmentCard
import com.laneshadow.ui.molecules.RouteAttachment
import com.laneshadow.ui.molecules.RouteAttachmentWeather
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSNavigatorMessage
import com.laneshadow.ui.organisms.LSTopBar

/**
 * RouteResultsScreen template — three polylines + NavigatorMessage + refine chat.
 *
 * Renders the RouteResults screen with:
 * - Three concurrent polylines (best, alt1, alt2) with route-variant colors
 * - Pinned NavigatorMessage with three route attachment cards
 * - Camera auto-framing to union bounds with spacing.4 padding
 * - Refine chat input with placeholder
 *
 * Driven entirely by mock data from RouteResultsMockProvider — no live data fetching.
 *
 * @param state Screen state from RouteResultsMockProvider
 * @param onMenuTap Callback when hamburger menu is tapped
 * @param onRouteCardTap Callback when a route card is tapped
 * @param onPinTap Callback when pin icon is tapped
 * @param onDismissTap Callback when close icon is tapped
 * @param onRefineChange Callback when chat input value changes
 * @param onRefineSend Callback when send button is tapped
 * @param onCollapseTap Callback when collapse button is tapped
 * @param onFilterTap Callback when filter button is tapped
 * @param modifier Modifier for the root composable
 */
@Composable
fun RouteResultsScreen(
    state: RouteResultsScreenState,
    onMenuTap: () -> Unit,
    onRouteCardTap: (String) -> Unit,
    onPinTap: () -> Unit,
    onDismissTap: () -> Unit,
    onRefineChange: (String) -> Unit,
    onRefineSend: (String) -> Unit,
    onCollapseTap: () -> Unit,
    onFilterTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Convert mock routes to PolylineData list
    val polylines = state.routes.mapIndexed { index, route ->
        val variant = when (index) {
            0 -> RouteVariant.Best
            1 -> RouteVariant.Alt1
            else -> RouteVariant.Alt2
        }
        PolylineData(
            coordinates = emptyList(), // Mock data doesn't have real coordinates
            variant = variant,
        )
    }

    // Convert mock attachments to UI RouteAttachment list
    val attachments = state.message.attachments?.mapIndexed { index, mockAttachment ->
        val route = state.routes.find { it.id == mockAttachment.routeId }
        com.laneshadow.ui.molecules.RouteAttachment(
            id = mockAttachment.routeId,
            title = route?.name ?: "Route",
            via = route?.via ?: "",
            distance = formatDistance(route?.distance ?: 0),
            duration = formatDuration(route?.estimatedTime ?: 0),
            scenicScore = mockAttachment.scenic ?: 0,
            variant = when (mockAttachment.variant) {
                "best" -> RouteVariant.Best
                "alt1" -> RouteVariant.Alt1
                "alt2" -> RouteVariant.Alt2
                else -> RouteVariant.Best
            },
            weatherBadge = mockAttachment.weather?.let {
                RouteAttachmentWeather(
                    condition = when (it.condition) {
                        "clear" -> WeatherCondition.Clear
                        "rain" -> WeatherCondition.Rain
                        "wind" -> WeatherCondition.Wind
                        else -> WeatherCondition.Clear
                    },
                    label = it.label,
                )
            },
            isBest = mockAttachment.isBest == true,
        )
    } ?: emptyList()

    LSMapLayer(
        map = {
            LSMap(
                mode = MapMode.Preview,
                camera = CameraPosition(
                    center = LatLng(37.8104, -122.4752),
                    zoom = 11.0,
                ),
                cameraFit = CameraFit.Polylines(padding = SpacingToken.Spacing4),
                polylines = polylines,
            )
        },
        topOverlays = listOf(
            GlassOverlaySlot(
                id = "navigator-message",
                content = {
                    LSNavigatorMessage(
                        body = state.message.body,
                        attachments = attachments,
                        pinned = state.message.pinned == true,
                        onPin = onPinTap,
                        onDismiss = onDismissTap,
                        modifier = Modifier.testTag("route-results-navigator-message"),
                    )
                }
            )
        ),
        bottomOverlays = listOf(
            GlassOverlaySlot(
                id = "chat-input",
                content = {
                    LSChatInput(
                        value = "",
                        onValueChange = onRefineChange,
                        placeholder = "Refine — 'make it shorter' / 'avoid Hwy 1'",
                        onSend = onRefineSend,
                        onCollapse = onCollapseTap,
                        onFilter = onFilterTap,
                        modifier = Modifier.testTag("route-results-chat-input"),
                    )
                }
            )
        ),
        topBar = {
            LSTopBar(
                onMenuTap = onMenuTap,
                modifier = Modifier.testTag("route-results-topbar"),
            )
        },
        modifier = modifier.fillMaxSize(),
    )
}

private fun formatDistance(meters: Int): String {
    val miles = (meters / 1609.34).toInt()
    return "${miles} mi"
}

private fun formatDuration(seconds: Int): String {
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    return if (hours > 0) {
        "${hours}h ${minutes}m"
    } else {
        "${minutes}m"
    }
}
