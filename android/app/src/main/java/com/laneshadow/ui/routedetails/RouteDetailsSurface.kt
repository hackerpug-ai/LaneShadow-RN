package com.laneshadow.ui.routedetails

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.laneshadow.ui.atoms.CameraFit
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.SpacingToken
import com.laneshadow.ui.molecules.WeatherTimelineEntry
import com.laneshadow.ui.organisms.BottomSheetSpec
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSRouteSheet
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.RouteDetails
import com.laneshadow.ui.organisms.SheetDetent

internal const val ROUTE_DETAILS_SHEET_TAG = "route-details-sheet"
internal const val ROUTE_DETAILS_TOPBAR_TAG = "route-details-topbar"

private val RouteDetailsMapCenter = LatLng(37.8104, -122.4752)
private const val RouteDetailsMapZoom = 11.0

@Composable
internal fun RouteDetailsSurface(
    route: RouteDetails,
    weatherTimeline: List<WeatherTimelineEntry>,
    timeRange: Pair<String, String>,
    mapContent: @Composable () -> Unit,
    onSave: () -> Unit,
    onRide: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LSMapLayer(
        map = mapContent,
        bottomSheet = BottomSheetSpec(
            content = {
                LSRouteSheet(
                    route = route,
                    weatherTimeline = weatherTimeline,
                    timeRange = timeRange,
                    onSave = onSave,
                    onRide = onRide,
                    onDismiss = onDismiss,
                    modifier = Modifier.testTag(ROUTE_DETAILS_SHEET_TAG),
                )
            },
            detent = SheetDetent.Large,
            onDismiss = onDismiss,
        ),
        topBar = {
            LSTopBar(
                onMenuTap = {},
                modifier = Modifier.testTag(ROUTE_DETAILS_TOPBAR_TAG),
            )
        },
        modifier = modifier.fillMaxSize(),
    )
}

@Composable
internal fun RouteDetailsMap(
    polylines: List<PolylineData>,
    modifier: Modifier = Modifier,
) {
    LSMap(
        mode = MapMode.Preview,
        camera = CameraPosition(
            center = RouteDetailsMapCenter,
            zoom = RouteDetailsMapZoom,
        ),
        cameraFit = CameraFit.Polyline(padding = SpacingToken.Spacing4),
        polylines = polylines,
    )
}
