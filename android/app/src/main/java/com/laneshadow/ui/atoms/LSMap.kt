package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalInspectionMode

/**
 * LSMap — LaneShadow map composable using Mapbox Maps SDK.
 *
 * This is the Android implementation of the cross-platform LSMap contract.
 * Mapbox SDK types are hidden inside the AndroidView factory/update lambdas
 * to maintain SDK-agnostic public API.
 *
 * NOTE: Full Mapbox integration requires:
 * 1. MAPBOX_DOWNLOADS_TOKEN in gradle.properties or environment
 * 2. Uncomment Mapbox dependency in build.gradle.kts
 * 3. Uncomment AndroidView block below for runtime implementation
 *
 * @param mode Map interaction mode (Preview or Interactive).
 * @param camera Initial camera position.
 * @param cameraFit Camera fit mode (Static, Polyline, or Polylines).
 * @param polylines List of polylines to render on the map.
 * @param annotations List of annotation markers to render.
 * @param showFavorites Whether to show favorite locations (not yet implemented).
 * @param onTap Optional callback when user taps the map.
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
    val isPreview = LocalInspectionMode.current

    if (isPreview) {
        // Preview mode: render placeholder box
        Box(modifier = Modifier.fillMaxSize())
    } else {
        // Runtime mode: render MapView (requires Mapbox SDK)
        // Uncomment when Mapbox dependency is available:
        /*
        AndroidView(
            factory = { context ->
                MapView(context).also { mapView ->
                    // Configure initial camera and style
                    mapView.getMapboxMap().loadStyleUri(Style.MAPBOX_STREETS)
                }
            },
            update = { mapView ->
                // Update map state when params change
                // TODO: Apply camera, polylines, annotations based on params
            },
            modifier = Modifier.fillMaxSize(),
        )
        */
        Box(modifier = Modifier.fillMaxSize())
    }
}
