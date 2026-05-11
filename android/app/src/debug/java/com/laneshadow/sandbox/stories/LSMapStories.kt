package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.Annotation
import com.laneshadow.ui.atoms.AnnotationKind
import com.laneshadow.ui.atoms.CameraFit
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.atoms.SpacingToken
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSMapStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.map.preview",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Preview Mode",
            summary = "Live preview map with gestures disabled, showing a single best route.",
            content = { PreviewModeStory() },
        ),
        Story(
            id = "atoms.map.interactive",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Interactive Mode",
            summary = "Interactive map with pan and zoom enabled.",
            content = { InteractiveModeStory() },
        ),
        Story(
            id = "atoms.map.one-polyline",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Single Polyline",
            summary = "Map displaying a single best route polyline.",
            content = { SinglePolylineStory() },
        ),
        Story(
            id = "atoms.map.three-alt-polylines",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Three Alternate Polylines",
            summary = "Map displaying best, alt1, and alt2 route variants.",
            content = { ThreeAltPolylinesStory() },
        ),
        Story(
            id = "atoms.map.start-end-markers",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Start/End Markers",
            summary = "Map with start and end annotation markers.",
            content = { StartEndMarkersStory() },
        ),
        Story(
            id = "atoms.map.auto-fit",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Auto-Fit Camera",
            summary = "Map with camera auto-fitted to polyline bounds.",
            content = { AutoFitStory() },
        ),
        Story(
            id = "atoms.map.dark-style",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Dark Style",
            summary = "Map using dark theme style URL.",
            content = { DarkStyleStory() },
        ),
        Story(
            id = "atoms.map.error-no-token",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Error: No Token",
            summary = "Map fallback UI when Mapbox access token is missing.",
            content = { ErrorNoTokenStory() },
        ),
        Story(
            id = "atoms.map.error-no-network",
            tier = ComponentTier.Atom,
            component = "LSMap",
            name = "Error: No Network",
            summary = "Map error state when network is unavailable.",
            content = { ErrorNoNetworkStory() },
        ),
    )
}

@Composable
private fun MapStoryContainer(
    content: @Composable () -> Unit,
) {
    LaneShadowTheme {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .height(400.dp),
        ) {
            content()
        }
    }
}

@Composable
private fun PreviewModeStory() {
    MapStoryContainer {
        LSMap(
            mode = MapMode.Preview,
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
        )
    }
}

@Composable
private fun InteractiveModeStory() {
    MapStoryContainer {
        LSMap(
            mode = MapMode.Interactive,
            camera = CameraPosition(
                center = LatLng(37.8205, -122.4048),
                zoom = 10.6,
            ),
        )
    }
}

@Composable
private fun SinglePolylineStory() {
    MapStoryContainer {
        LSMap(
            mode = MapMode.Preview,
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
            cameraFit = CameraFit.Polyline(SpacingToken.Spacing4),
            polylines = listOf(
                PolylineData(
                    coordinates = listOf(
                        LatLng(37.7749, -122.4194),
                        LatLng(37.8078, -122.4750),
                        LatLng(37.8324, -122.4803),
                        LatLng(37.8626, -122.4856),
                    ),
                    variant = RouteVariant.Best,
                ),
            ),
        )
    }
}

@Composable
private fun ThreeAltPolylinesStory() {
    MapStoryContainer {
        LSMap(
            mode = MapMode.Interactive,
            camera = CameraPosition(
                center = LatLng(37.8205, -122.4048),
                zoom = 10.6,
            ),
            cameraFit = CameraFit.Polylines(SpacingToken.Spacing4),
            polylines = listOf(
                PolylineData(
                    coordinates = listOf(
                        LatLng(37.7749, -122.4194),
                        LatLng(37.7927, -122.3930),
                        LatLng(37.8070, -122.4028),
                        LatLng(37.8267, -122.4230),
                        LatLng(37.8715, -122.2730),
                    ),
                    variant = RouteVariant.Best,
                ),
                PolylineData(
                    coordinates = listOf(
                        LatLng(37.7749, -122.4194),
                        LatLng(37.7897, -122.3902),
                        LatLng(37.8068, -122.3777),
                        LatLng(37.8354, -122.2912),
                        LatLng(37.8715, -122.2730),
                    ),
                    variant = RouteVariant.Alt1,
                ),
                PolylineData(
                    coordinates = listOf(
                        LatLng(37.7749, -122.4194),
                        LatLng(37.7818, -122.4043),
                        LatLng(37.7989, -122.3884),
                        LatLng(37.8165, -122.3605),
                        LatLng(37.8715, -122.2730),
                    ),
                    variant = RouteVariant.Alt2,
                ),
            ),
        )
    }
}

@Composable
private fun StartEndMarkersStory() {
    MapStoryContainer {
        LSMap(
            mode = MapMode.Preview,
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
            polylines = listOf(
                PolylineData(
                    coordinates = listOf(
                        LatLng(37.7749, -122.4194),
                        LatLng(37.8078, -122.4750),
                        LatLng(37.8324, -122.4803),
                        LatLng(37.8626, -122.4856),
                    ),
                    variant = RouteVariant.Best,
                ),
            ),
            annotations = listOf(
                Annotation(
                    kind = AnnotationKind.Start,
                    coordinate = LatLng(37.7749, -122.4194),
                    label = "San Francisco",
                ),
                Annotation(
                    kind = AnnotationKind.End,
                    coordinate = LatLng(37.8626, -122.4856),
                    label = "Muir Beach",
                ),
            ),
        )
    }
}

@Composable
private fun AutoFitStory() {
    MapStoryContainer {
        LSMap(
            mode = MapMode.Preview,
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
            cameraFit = CameraFit.Polyline(SpacingToken.Spacing4),
            polylines = listOf(
                PolylineData(
                    coordinates = listOf(
                        LatLng(37.7749, -122.4194),
                        LatLng(37.8078, -122.4750),
                        LatLng(37.8324, -122.4803),
                        LatLng(37.8626, -122.4856),
                    ),
                    variant = RouteVariant.Best,
                ),
            ),
        )
    }
}

@Composable
private fun DarkStyleStory() {
    MapStoryContainer {
        LaneShadowTheme(darkTheme = true) {
            LSMap(
                mode = MapMode.Preview,
                camera = CameraPosition(
                    center = LatLng(37.8104, -122.4752),
                    zoom = 10.8,
                ),
            )
        }
    }
}

@Composable
private fun ErrorNoTokenStory() {
    MapStoryContainer {
        // This story demonstrates the error fallback UI
        // When MAPBOX_ACCESS_TOKEN is missing, LSMap shows an error panel
        LSMap(
            mode = MapMode.Preview,
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
        )
    }
}

@Composable
private fun ErrorNoNetworkStory() {
    MapStoryContainer {
        // This story demonstrates the network error fallback UI
        // When network is unavailable, LSMap shows an error panel
        LSMap(
            mode = MapMode.Preview,
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
        )
    }
}
