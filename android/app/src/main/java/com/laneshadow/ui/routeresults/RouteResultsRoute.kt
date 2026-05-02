package com.laneshadow.ui.routeresults

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.navigation.Route
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.CameraFit
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.atoms.SpacingToken
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.RouteAttachment
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSNavigatorMessage
import com.laneshadow.ui.organisms.LSTopBar
import kotlinx.coroutines.Dispatchers

@Composable
fun RouteResultsRoute(
    navController: NavHostController,
    sessionId: String,
    stateOverride: RouteResultsUiState? = null,
    viewModel: RouteResultsViewModel? = null,
    onRouteCardTap: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val resolvedRouteCardTap = onRouteCardTap ?: defaultRouteCardTap(
        sessionId = sessionId,
        navController = navController,
    )

    if (stateOverride != null) {
        RouteResultsContent(
            state = stateOverride,
            navController = navController,
            onRouteCardTap = resolvedRouteCardTap,
            onDismissAttachments = {},
            onRecallAttachments = {},
            onRefineSend = {},
            modifier = modifier,
        )
        return
    }

    val resolvedViewModel = viewModel ?: hiltViewModel<RouteResultsViewModel, RouteResultsViewModelFactory>(
        creationCallback = { factory -> factory.create(sessionId, Dispatchers.Default) },
    )
    val uiState by resolvedViewModel.state.collectAsStateWithLifecycle()

    RouteResultsContent(
        state = uiState,
        navController = navController,
        onRouteCardTap = { routeOptionId ->
            resolvedViewModel.selectRoute(routeOptionId)
            resolvedRouteCardTap(routeOptionId)
        },
        onDismissAttachments = resolvedViewModel::dismissAttachments,
        onRecallAttachments = resolvedViewModel::recallAttachments,
        onRefineSend = resolvedViewModel::refine,
        modifier = modifier,
    )
}

@Composable
private fun RouteResultsContent(
    state: RouteResultsUiState,
    navController: NavHostController,
    onRouteCardTap: (String) -> Unit,
    onDismissAttachments: () -> Unit,
    onRecallAttachments: () -> Unit,
    onRefineSend: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (state) {
        RouteResultsUiState.Loading -> RouteResultsLoading(modifier = modifier)
        is RouteResultsUiState.Empty -> RouteResultsPlaceholder(
            title = "Route planning in progress",
            body = state.message,
            modifier = modifier,
        )
        is RouteResultsUiState.Error -> RouteResultsPlaceholder(
            title = "Route results unavailable",
            body = state.message,
            modifier = modifier,
        )
        is RouteResultsUiState.Loaded -> RouteResultsLoaded(
            state = state,
            navController = navController,
            onRouteCardTap = onRouteCardTap,
            onDismissAttachments = onDismissAttachments,
            onRecallAttachments = onRecallAttachments,
            onRefineSend = onRefineSend,
            modifier = modifier,
        )
    }
}

@Composable
private fun RouteResultsLoading(
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        LSText(
            text = "Loading route results…",
            variant = TypographyVariant.Ui.Body.Md,
        )
    }
}

@Composable
private fun RouteResultsPlaceholder(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(theme.space.md),
    ) {
        Column(
            modifier = Modifier.align(Alignment.Center),
            verticalArrangement = Arrangement.spacedBy(theme.space.sm),
        ) {
            LSText(
                text = title,
                variant = TypographyVariant.Ui.Title.Lg,
            )
            LSText(
                text = body,
                variant = TypographyVariant.Ui.Body.Md,
            )
        }
    }
}

@Composable
private fun RouteResultsLoaded(
    state: RouteResultsUiState.Loaded,
    navController: NavHostController,
    onRouteCardTap: (String) -> Unit,
    onDismissAttachments: () -> Unit,
    onRecallAttachments: () -> Unit,
    onRefineSend: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    var refineValue by rememberSaveable(state.sessionId) { mutableStateOf("") }
    val visibleAttachments = remember(state.attachmentCards, state.attachmentsDismissed) {
        if (state.attachmentsDismissed) emptyList() else state.attachmentCards
    }

    LSMapLayer(
        map = {
            RouteResultsMap(
                polylineEntries = state.polylineEntries,
                modifier = Modifier.fillMaxSize(),
            )
        },
        topOverlays = listOf(
            GlassOverlaySlot(
                id = "navigator-message",
                content = {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
                    ) {
                        LSNavigatorMessage(
                            body = state.navigatorBody,
                            attachments = visibleAttachments.map { it.toRouteAttachment() },
                            selectedAttachmentId = state.selectedRouteId,
                            onAttachmentTap = onRouteCardTap,
                            pinned = true,
                            onPin = null,
                            onDismiss = onDismissAttachments,
                            modifier = Modifier.testTag("route-results-navigator-message"),
                        )

                        if (state.showRecallChip) {
                            RecallAttachmentsChip(
                                onRecallAttachments = onRecallAttachments,
                                modifier = Modifier.align(Alignment.CenterHorizontally),
                            )
                        }
                    }
                },
            ),
        ),
        bottomOverlays = listOf(
            GlassOverlaySlot(
                id = "chat-input",
                content = {
                    LSChatInput(
                        value = refineValue,
                        onValueChange = { refineValue = it },
                        placeholder = "Refine — 'make it shorter' / 'avoid Hwy 1'",
                        onSend = { content ->
                            onRefineSend(content)
                            refineValue = ""
                        },
                        onCollapse = { navController.popBackStack() },
                        onFilter = { navController.navigate(Route.Sessions) },
                        modifier = Modifier.testTag("route-results-chat-input"),
                    )
                },
            ),
        ),
        topBar = {
            LSTopBar(
                onMenuTap = { navController.navigate(Route.Sessions) },
                modifier = Modifier.testTag("route-results-topbar"),
            )
        },
        modifier = modifier.fillMaxSize(),
    )
}

@Composable
private fun RouteResultsMap(
    polylineEntries: List<PolylineEntry>,
    modifier: Modifier = Modifier,
) {
    val coordinateKey = polylineEntries.map { it.routeOptionId to it.coordinates }
    val currentPolylineEntriesState = rememberUpdatedState(polylineEntries)
    val camera = remember(coordinateKey) { routeResultsCamera(polylineEntries) }
    val renderedPolylines by remember(coordinateKey) {
        derivedStateOf {
            currentPolylineEntriesState.value.map { entry ->
                entry.toRenderPolylineSpec()
            }
        }
    }
    val allCoordinates = remember(renderedPolylines) {
        renderedPolylines.flatMap { it.coordinates }
    }
    val routeStateDescription = remember(renderedPolylines) {
        renderedPolylines.joinToString(separator = ",") { polyline ->
            "${polyline.routeOptionId}:${polyline.style.name}"
        }
    }

    Box(
        modifier = modifier
            .testTag("route-results-map")
            .semantics {
                stateDescription = routeStateDescription
            },
    ) {
        LSMap(
            mode = MapMode.Preview,
            camera = camera,
            cameraFit = CameraFit.Polylines(padding = SpacingToken.Spacing4),
            polylines = emptyList(),
        )

        Canvas(
            modifier = Modifier.fillMaxSize(),
        ) {
            renderedPolylines.forEach { polyline ->
                drawRoutePolyline(
                    coordinates = polyline.coordinates,
                    allCoordinates = allCoordinates,
                    color = routeVariantColor(polyline.variant),
                    style = polyline.style,
                    drawProgress = polyline.drawProgress,
                )
            }
        }
    }
}

@Composable
private fun RecallAttachmentsChip(
    onRecallAttachments: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSPill(
        size = PillSize.Sm,
        modifier = modifier
            .clickable(
                role = Role.Button,
                onClick = onRecallAttachments,
            )
            .background(
                color = GeneratedTokens.color.Signal.whisper,
                shape = RoundedCornerShape(theme.radius.full),
            )
            .padding(horizontal = theme.space.md, vertical = theme.space.xs)
            .semantics {
                contentDescription = "Recall attachments"
            },
        ) {
        LSText(
            text = "Recall attachments",
            variant = TypographyVariant.Ui.Label.Sm,
            color = TextColor.Signal,
        )
    }
}

private data class RenderedPolyline(
    val routeOptionId: String,
    val coordinates: List<LatLng>,
    val variant: RouteVariant,
    val style: PolylineStyle,
    val drawProgress: Float,
)

private fun PolylineEntry.toRenderPolylineSpec(): RenderedPolyline =
    RenderedPolyline(
        routeOptionId = routeOptionId,
        coordinates = coordinates,
        variant = variant,
        style = style,
        drawProgress = drawProgress,
    )

private fun AttachmentCard.toRouteAttachment(): RouteAttachment =
    RouteAttachment(
        id = routeOptionId,
        title = title,
        via = via,
        distance = distanceLabel,
        duration = durationLabel,
        scenicScore = scenicScore,
        variant = variant,
        isBest = isBest,
    )

private fun routeResultsCamera(polylineEntries: List<PolylineEntry>): CameraPosition {
    val coordinates = polylineEntries.flatMap { it.coordinates }
    if (coordinates.isEmpty()) {
        return CameraPosition(
            center = LatLng(37.8104, -122.4752),
            zoom = 11.0,
        )
    }

    val minLat = coordinates.minOf { it.lat }
    val maxLat = coordinates.maxOf { it.lat }
    val minLon = coordinates.minOf { it.lon }
    val maxLon = coordinates.maxOf { it.lon }

    return CameraPosition(
        center = LatLng(
            lat = (minLat + maxLat) / 2.0,
            lon = (minLon + maxLon) / 2.0,
        ),
        zoom = 11.0,
    )
}

private fun DrawScope.drawRoutePolyline(
    coordinates: List<LatLng>,
    allCoordinates: List<LatLng>,
    color: Color,
    style: PolylineStyle,
    drawProgress: Float,
) {
    if (coordinates.size < 2 || allCoordinates.isEmpty()) {
        return
    }

    val path = Path()
    val totalPoints = coordinates.size
    val clampedProgress = drawProgress.coerceIn(0f, 1f)
    val pointsToDraw = (totalPoints * clampedProgress).toInt().coerceAtLeast(1)
    val strokeWidthPx = GeneratedTokens.sizing.stroke.lg.toPx()
    val padding = strokeWidthPx * 3f

    val firstOffset = latLngToOffset(
        point = coordinates.first(),
        allPoints = allCoordinates,
        canvasWidth = size.width,
        canvasHeight = size.height,
        padding = padding,
    )
    path.moveTo(firstOffset.x, firstOffset.y)

    for (index in 1 until pointsToDraw) {
        val offset = latLngToOffset(
            point = coordinates[index],
            allPoints = allCoordinates,
            canvasWidth = size.width,
            canvasHeight = size.height,
            padding = padding,
        )
        path.lineTo(offset.x, offset.y)
    }

    if (pointsToDraw < totalPoints) {
        val lastVisiblePoint = coordinates[pointsToDraw - 1]
        val nextPoint = coordinates[pointsToDraw]
        val progressFraction = (totalPoints * clampedProgress) - pointsToDraw
        if (progressFraction > 0f) {
            val prevOffset = latLngToOffset(
                point = lastVisiblePoint,
                allPoints = allCoordinates,
                canvasWidth = size.width,
                canvasHeight = size.height,
                padding = padding,
            )
            val nextOffset = latLngToOffset(
                point = nextPoint,
                allPoints = allCoordinates,
                canvasWidth = size.width,
                canvasHeight = size.height,
                padding = padding,
            )
            path.lineTo(
                prevOffset.x + (nextOffset.x - prevOffset.x) * progressFraction,
                prevOffset.y + (nextOffset.y - prevOffset.y) * progressFraction,
            )
        }
    }

    val pathEffect = if (style == PolylineStyle.Dashed) {
        PathEffect.dashPathEffect(
            floatArrayOf(strokeWidthPx * 2.5f, strokeWidthPx * 1.8f),
            0f,
        )
    } else {
        null
    }

    drawPath(
        path = path,
        color = color,
        style = Stroke(
            width = strokeWidthPx,
            pathEffect = pathEffect,
        ),
    )
}

private fun routeVariantColor(variant: RouteVariant): Color =
    when (variant) {
        RouteVariant.Best -> GeneratedTokens.color.Route.best
        RouteVariant.Alt1 -> GeneratedTokens.color.Route.alt1
        RouteVariant.Alt2 -> GeneratedTokens.color.Route.alt2
        is RouteVariant.Custom -> GeneratedTokens.color.Route.best
    }

private fun latLngToOffset(
    point: LatLng,
    allPoints: List<LatLng>,
    canvasWidth: Float,
    canvasHeight: Float,
    padding: Float,
): Offset {
    if (allPoints.isEmpty()) {
        return Offset(canvasWidth / 2f, canvasHeight / 2f)
    }

    val minLat = allPoints.minOf { it.lat }
    val maxLat = allPoints.maxOf { it.lat }
    val minLon = allPoints.minOf { it.lon }
    val maxLon = allPoints.maxOf { it.lon }
    val latRange = maxLat - minLat
    val lonRange = maxLon - minLon
    val usableWidth = (canvasWidth - 2f * padding).coerceAtLeast(1f)
    val usableHeight = (canvasHeight - 2f * padding).coerceAtLeast(1f)

    val x = if (lonRange > 0.0) {
        padding + ((point.lon - minLon) / lonRange).toFloat() * usableWidth
    } else {
        canvasWidth / 2f
    }

    val y = if (latRange > 0.0) {
        padding + (1f - ((point.lat - minLat) / latRange).toFloat()) * usableHeight
    } else {
        canvasHeight / 2f
    }

    return Offset(x, y)
}

private fun defaultRouteCardTap(
    sessionId: String,
    navController: NavHostController,
): (String) -> Unit = { routeOptionId ->
    navController.navigate(Route.RouteDetails(sessionId, routeOptionId))
}
