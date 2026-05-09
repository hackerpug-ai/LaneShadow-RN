package com.laneshadow.ui.atoms

import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Paint
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.platform.rememberNestedScrollInteropConnection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.laneshadow.R
import com.laneshadow.data.favorites.FavoriteLocation
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationManager
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.createPointAnnotationManager
import com.mapbox.maps.plugin.gestures.gestures

/**
 * LSMap — LaneShadow map composable using Mapbox Maps SDK.
 *
 * Mapbox SDK types stay inside the AndroidView host path so the public composable
 * remains contract-compatible with the shared map atom.
 */
@Composable
fun LSMap(
    mode: MapMode,
    camera: CameraPosition,
    cameraFit: CameraFit = CameraFit.Static,
    polylines: List<PolylineData> = emptyList(),
    annotations: List<Annotation> = emptyList(),
    showFavorites: Boolean = false,
    favoriteLocations: List<FavoriteLocation> = emptyList(),
    onTap: ((LatLng) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val isInspectionMode = LocalInspectionMode.current
    val isDarkTheme = isSystemInDarkTheme()
    val accessToken = remember(context) { resolveMapboxAccessToken(context) }
    val renderModel = remember(
        mode,
        camera,
        cameraFit,
        polylines,
        annotations,
        accessToken,
        isDarkTheme,
    ) {
        resolveLSMapRenderModel(
            mode = mode,
            camera = camera,
            cameraFit = cameraFit,
            polylines = polylines,
            annotations = annotations,
            isDarkTheme = isDarkTheme,
            hasAccessToken = accessToken.isNotBlank(),
        )
    }
    val hostModifier = modifier
        .fillMaxSize()
        .nestedScroll(rememberNestedScrollInteropConnection())

    when {
        renderModel.fallback != null ->
            LSMapFallbackSurface(
                fallback = renderModel.fallback,
                showFavorites = showFavorites,
                onTap = onTap,
                modifier = hostModifier,
            )

        isInspectionMode ->
            LSMapPreviewSurface(
                renderModel = renderModel,
                modifier = hostModifier,
            )

        else -> {
            // Remember annotation manager to avoid recreating on every update
            var annotationManager by remember { mutableStateOf<PointAnnotationManager?>(null) }

            Box(modifier = hostModifier.background(mapPaperColor(renderModel.styleUri))) {
                AndroidView(
                    modifier = Modifier.fillMaxSize().then(
                        if (favoriteLocations.isNotEmpty()) {
                            Modifier.semantics {
                                this.contentDescription = "Map showing ${favoriteLocations.size} favorite locations"
                            }
                        } else {
                            Modifier
                        }
                    ),
                    factory = { mapContext ->
                        MapView(mapContext).also { mapView ->
                            configureMapView(mapView, renderModel, onTap)
                            val manager = mapView.annotations.createPointAnnotationManager()
                            annotationManager = manager
                            applyFavoritePinAnnotations(mapContext, manager, favoriteLocations, isDarkTheme)
                        }
                    },
                    update = { mapView ->
                        configureMapView(mapView, renderModel, onTap)
                    },
                )

                // Apply favorite pin annotations when favoriteLocations or theme changes
                LaunchedEffect(favoriteLocations, isDarkTheme) {
                    val manager = annotationManager
                    if (manager != null) {
                        applyFavoritePinAnnotations(context, manager, favoriteLocations, isDarkTheme)
                    }
                }

                // Canvas overlay for animated polyline rendering with drawProgress
                if (renderModel.polylines.isNotEmpty()) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        // Render animated polylines with drawProgress applied
                        renderModel.polylines.forEach { polyline ->
                            val drawProgress = polyline.drawProgress
                            if (drawProgress <= 0f) return@forEach

                            // Convert LatLng coordinates to screen offsets
                            // Note: This is a simplified version. In production, you'd need to
                            // properly project LatLng to screen coordinates using the map's projection
                            val path = Path()
                            val coordinates = polyline.coordinates
                            if (coordinates.isNotEmpty()) {
                                // Calculate how many points to draw based on drawProgress
                                val totalPoints = coordinates.size
                                val pointsToDraw = (totalPoints * drawProgress).toInt().coerceAtLeast(1)

                                // Start the path at the first coordinate
                                // Using a simple projection for demo - in production, use map projection
                                val start = coordinates[0]
                                val startX = size.width * 0.3f  // Simplified projection
                                val startY = size.height * 0.5f
                                path.moveTo(startX, startY)

                                // Draw line segments up to the progress point
                                for (i in 1 until pointsToDraw) {
                                    val coord = coordinates[i]
                                    // Simple projection: spread coordinates across the canvas
                                    val x = startX + (coord.lon - start.lon).toFloat() * 10000f
                                    val y = startY - (coord.lat - start.lat).toFloat() * 10000f
                                    path.lineTo(x, y)
                                }

                                // If we're drawing a partial segment, interpolate the last point
                                if (pointsToDraw < totalPoints && pointsToDraw > 0) {
                                    val progressFraction = (totalPoints * drawProgress) - pointsToDraw
                                    if (progressFraction > 0f && pointsToDraw < coordinates.size) {
                                        val prevCoord = coordinates[pointsToDraw - 1]
                                        val nextCoord = coordinates[pointsToDraw]

                                        val prevX = startX + (prevCoord.lon - start.lon).toFloat() * 10000f
                                        val prevY = startY - (prevCoord.lat - start.lat).toFloat() * 10000f
                                        val nextX = startX + (nextCoord.lon - start.lon).toFloat() * 10000f
                                        val nextY = startY - (nextCoord.lat - start.lat).toFloat() * 10000f

                                        val interpX = prevX + (nextX - prevX) * progressFraction
                                        val interpY = prevY + (nextY - prevY) * progressFraction
                                        path.lineTo(interpX, interpY)
                                    }
                                }

                                // Draw the path with the polyline's stroke width and color
                                drawPath(
                                    path = path,
                                    color = polyline.color,
                                    style = Stroke(
                                        width = polyline.strokeWidth.value
                                    )
                                )
                            }
                        }
                    }
                }
                if (renderModel.polylines.isNotEmpty() || renderModel.annotations.isNotEmpty()) {
                    LSMapLegendOverlay(
                        renderModel = renderModel,
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(12.dp),
                    )
                }
            }
        }
    }
}

private fun configureMapView(
    mapView: MapView,
    renderModel: LSMapRenderModel,
    onTap: ((LatLng) -> Unit)?,
) {
    val styleUri = renderModel.styleUri ?: return
    if (mapView.tag != styleUri) {
        mapView.mapboxMap.loadStyle(styleUri)
        mapView.tag = styleUri
    }

    mapView.mapboxMap.setCamera(
        CameraOptions.Builder()
            .center(Point.fromLngLat(renderModel.camera.center.lon, renderModel.camera.center.lat))
            .zoom(renderModel.camera.zoom)
            .bearing(renderModel.camera.bearing ?: 0.0)
            .pitch(renderModel.camera.pitch ?: 0.0)
            .build(),
    )

    // Honor `mode` parameter so MapMode.Preview actually disables user gestures
    // (parity with iOS resolveLSMapInteraction). Without this the `mode` arg
    // silently lies and any preview-mode use site allows unwanted user pan/zoom.
    mapView.gestures.apply {
        val enabled = renderModel.interaction.gesturesEnabled
        pinchToZoomEnabled = enabled
        scrollEnabled = enabled
        rotateEnabled = enabled
        pitchEnabled = enabled
        doubleTapToZoomInEnabled = enabled
        doubleTouchToZoomOutEnabled = enabled
        quickZoomEnabled = enabled
    }

    mapView.setOnClickListener {
        onTap?.invoke(renderModel.camera.center)
    }
}

private fun applyFavoritePinAnnotations(
    context: Context,
    annotationManager: PointAnnotationManager,
    favorites: List<FavoriteLocation>,
    isDarkTheme: Boolean,
) {
    // Clear existing annotations
    annotationManager.deleteAll()

    // Create pin specs for favorites
    val pinSpecs = resolveLSMapFavoritePinSpecs(favorites, isDarkTheme)

    // Create and add point annotations for each favorite
    pinSpecs.forEach { pinSpec ->
        val pointAnnotationOptions = PointAnnotationOptions()
            .withPoint(Point.fromLngLat(pinSpec.coordinate.lon, pinSpec.coordinate.lat))
            .withIconImage(createFavoritePinBitmap(context, pinSpec))
            .withIconSize(1.0)

        annotationManager.create(pointAnnotationOptions)
    }
}

private fun createFavoritePinBitmap(
    context: Context,
    pinSpec: LSMapFavoritePinSpec,
): Bitmap {
    val density = context.resources.displayMetrics.density
    val outerDiameterPx = (GeneratedTokens.sizing.stroke.lg.value * 8f * density).toInt()
    val ringWidthPx = GeneratedTokens.sizing.stroke.md.value * density
    val fillRadiusPx = (outerDiameterPx / 2f) - ringWidthPx
    val center = outerDiameterPx / 2f

    val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = pinSpec.ringColor.toArgb()
        style = Paint.Style.FILL
    }
    val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = pinSpec.fillColor.toArgb()
        style = Paint.Style.FILL
    }

    return Bitmap.createBitmap(outerDiameterPx, outerDiameterPx, Bitmap.Config.ARGB_8888).also { bitmap ->
        val canvas = AndroidCanvas(bitmap)
        canvas.drawCircle(center, center, center, ringPaint)
        canvas.drawCircle(center, center, fillRadiusPx, fillPaint)
    }
}

@Composable
private fun LSMapFallbackSurface(
    fallback: LSMapFallbackSpec,
    showFavorites: Boolean,
    onTap: ((LatLng) -> Unit)?,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.background(mapPaperColor(null)),
        contentAlignment = Alignment.Center,
    ) {
        LSGlassPanel(
            variant = GlassVariant.Chrome,
            modifier = Modifier.padding(16.dp),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    LSIcon(
                        name = GeneratedTokens.IconName.Map,
                        size = IconSize.Sm,
                        color = IconColor.Status(StatusColor.Warning),
                        contentDescription = fallback.title,
                    )
                    LSText(
                        text = fallback.title,
                        variant = TypographyVariant.Ui.Title.Md,
                        color = ContentColor.Error,
                    )
                }
                LSText(
                    text = fallback.message,
                    variant = TypographyVariant.Ui.Body.Md,
                    color = ContentColor.Primary,
                )
                LSText(
                    text = buildFallbackSummary(showFavorites = showFavorites, onTap = onTap),
                    variant = TypographyVariant.Ui.Label.Sm,
                    color = ContentColor.Secondary,
                )
            }
        }
    }
}

@Composable
private fun LSMapPreviewSurface(
    renderModel: LSMapRenderModel,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.background(mapPaperColor(renderModel.styleUri)),
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .padding(12.dp)
                .border(1.dp, contourColor(renderModel.styleUri)),
        )
        if (renderModel.polylines.isNotEmpty() || renderModel.annotations.isNotEmpty()) {
            LSMapLegendOverlay(
                renderModel = renderModel,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(12.dp),
            )
        }
    }
}

@Composable
private fun LSMapLegendOverlay(
    renderModel: LSMapRenderModel,
    modifier: Modifier = Modifier,
) {
    LSGlassPanel(
        variant = GlassVariant.Chrome,
        modifier = modifier,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            renderModel.polylines.forEachIndexed { index, polyline ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(24.dp, polyline.strokeWidth)
                            .background(polyline.color)
                            .testTag("ls-polyline-${index}"),
                    )
                    LSText(
                        text = "${polyline.coordinates.size} points",
                        variant = TypographyVariant.Ui.Label.Sm,
                        color = ContentColor.Secondary,
                    )
                }
            }

            renderModel.annotations.forEach { annotation ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(annotation.visual.outerDiameter)
                            .clip(CircleShape)
                            .background(annotation.color)
                            .then(
                                if (annotation.visual.borderWidth > 0.dp) {
                                    Modifier.border(annotation.visual.borderWidth, Color.White, CircleShape)
                                } else {
                                    Modifier
                                },
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        annotation.visual.innerDiameter?.let { inner ->
                            Box(
                                modifier = Modifier
                                    .size(inner)
                                    .clip(CircleShape)
                                    .background(Color.White),
                            )
                        }
                    }
                    LSText(
                        text = annotation.label ?: annotation.kind.name.lowercase(),
                        variant = TypographyVariant.Ui.Label.Sm,
                        color = ContentColor.Secondary,
                    )
                }
            }
        }
    }
}

private fun resolveMapboxAccessToken(context: Context): String =
    runCatching { context.getString(R.string.mapbox_access_token).trim() }.getOrDefault("")

private fun mapPaperColor(styleUri: String?): Color =
    if (styleUri == GeneratedTokens.map.style.dark) {
        GeneratedTokens.map.dark.paper
    } else {
        GeneratedTokens.map.paper
    }

private fun contourColor(styleUri: String?): Color =
    if (styleUri == GeneratedTokens.map.style.dark) {
        GeneratedTokens.map.dark.contour
    } else {
        GeneratedTokens.map.contour
    }

private fun buildFallbackSummary(
    showFavorites: Boolean,
    onTap: ((LatLng) -> Unit)?,
): String {
    val favorites = if (showFavorites) "favorites on" else "favorites off"
    val tap = if (onTap != null) "tap wired" else "tap idle"
    return "$favorites • $tap"
}
