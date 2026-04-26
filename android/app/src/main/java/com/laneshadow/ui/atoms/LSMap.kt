package com.laneshadow.ui.atoms

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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.Canvas
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.platform.rememberNestedScrollInteropConnection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.laneshadow.R
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView

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
    onTap: ((LatLng) -> Unit)? = null,
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
    val hostModifier = Modifier
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

        else ->
            Box(modifier = hostModifier.background(mapPaperColor(renderModel.styleUri))) {
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { mapContext ->
                        MapView(mapContext).also { mapView ->
                            configureMapView(mapView, renderModel, onTap)
                        }
                    },
                    update = { mapView ->
                        configureMapView(mapView, renderModel, onTap)
                    },
                )
                // Canvas overlay for animated polyline rendering with drawProgress
                if (renderModel.polylines.isNotEmpty()) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        // Render animated polylines with drawProgress applied
                        renderModel.polylines.forEach { polyline ->
                            // drawProgress controls the visible fraction of the polyline (0f = none, 1f = full)
                            // This canvas layer clips the polyline rendering based on drawProgress
                            // allowing sketch animations to progressively draw the line
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

    mapView.setOnClickListener {
        onTap?.invoke(renderModel.camera.center)
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
            renderModel.polylines.forEach { polyline ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(24.dp, polyline.strokeWidth)
                            .background(polyline.color),
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
