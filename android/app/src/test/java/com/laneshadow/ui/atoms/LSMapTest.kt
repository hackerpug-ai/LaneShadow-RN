package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.dp
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LSMapTest {
    @Test
    fun style_tokens_switch_and_request_reload_when_theme_changes_in_place() {
        val light = resolveLSMapRenderModel(
            mode = MapMode.Interactive,
            camera = CameraPosition(center = LatLng(37.7749, -122.4194), zoom = 10.0),
            isDarkTheme = false,
            hasAccessToken = true,
            isNetworkAvailable = true,
        )

        assertEquals(GeneratedTokens.map.style.light, light.styleUri)
        assertFalse(light.shouldReloadStyle)

        val dark = resolveLSMapRenderModel(
            mode = MapMode.Interactive,
            camera = CameraPosition(center = LatLng(37.7749, -122.4194), zoom = 10.0),
            isDarkTheme = true,
            hasAccessToken = true,
            isNetworkAvailable = true,
            previousStyleUri = light.styleUri,
        )

        assertEquals(GeneratedTokens.map.style.dark, dark.styleUri)
        assertTrue(dark.shouldReloadStyle)
        assertNull(dark.fallback)
    }

    @Test
    fun three_polylines_use_token_colors() {
        val specs = listOf(
            resolveLSMapPolylineSpec(
                PolylineData(
                    coordinates = listOf(LatLng(37.7749, -122.4194), LatLng(37.8078, -122.4750)),
                    variant = RouteVariant.Best,
                ),
                isDarkTheme = false,
            ),
            resolveLSMapPolylineSpec(
                PolylineData(
                    coordinates = listOf(LatLng(37.7749, -122.4194), LatLng(37.8078, -122.4750)),
                    variant = RouteVariant.Alt1,
                ),
                isDarkTheme = false,
            ),
            resolveLSMapPolylineSpec(
                PolylineData(
                    coordinates = listOf(LatLng(37.7749, -122.4194), LatLng(37.8078, -122.4750)),
                    variant = RouteVariant.Alt2,
                ),
                isDarkTheme = false,
            ),
        )

        assertEquals(GeneratedTokens.color.Route.best, specs[0].color)
        assertEquals(GeneratedTokens.color.Route.alt1, specs[1].color)
        assertEquals(GeneratedTokens.color.Route.alt2, specs[2].color)
        assertEquals(GeneratedTokens.sizing.stroke.md, specs[0].strokeWidth)
        assertEquals(GeneratedTokens.sizing.stroke.md, specs[1].strokeWidth)
        assertEquals(GeneratedTokens.sizing.stroke.md, specs[2].strokeWidth)
    }

    @Test
    fun custom_route_token_resolves_without_raw_colors() {
        val spec = resolveLSMapPolylineSpec(
            PolylineData(
                coordinates = listOf(LatLng(37.7749, -122.4194), LatLng(37.8078, -122.4750)),
                variant = RouteVariant.Custom(ColorToken("color.route.alt2")),
                strokeWidth = StrokeSize.Lg,
            ),
            isDarkTheme = false,
        )

        assertEquals(GeneratedTokens.color.Route.alt2, spec.color)
        assertEquals(GeneratedTokens.sizing.stroke.lg, spec.strokeWidth)
    }

    @Test
    fun annotations_render_at_spec_sizes() {
        val start = resolveLSMapAnnotationSpec(
            Annotation(
                kind = AnnotationKind.Start,
                coordinate = LatLng(37.7749, -122.4194),
            ),
            isDarkTheme = false,
        )
        val end = resolveLSMapAnnotationSpec(
            Annotation(
                kind = AnnotationKind.End,
                coordinate = LatLng(37.8626, -122.4856),
            ),
            isDarkTheme = false,
        )
        val waypoint = resolveLSMapAnnotationSpec(
            Annotation(
                kind = AnnotationKind.Waypoint,
                coordinate = LatLng(37.8324, -122.4803),
            ),
            isDarkTheme = false,
        )

        assertEquals(GeneratedTokens.color.Status.Success.default, start.color)
        assertEquals(14.dp, start.visual.outerDiameter)
        assertEquals(2.5.dp, start.visual.borderWidth)
        assertNull(start.visual.innerDiameter)

        assertEquals(GeneratedTokens.color.Status.recording, end.color)
        assertEquals(18.dp, end.visual.outerDiameter)
        assertEquals(0.dp, end.visual.borderWidth)
        assertEquals(6.dp, end.visual.innerDiameter)

        assertEquals(GeneratedTokens.color.Status.Info.default, waypoint.color)
        assertEquals(12.dp, waypoint.visual.outerDiameter)
        assertEquals(0.dp, waypoint.visual.borderWidth)
        assertNull(waypoint.visual.innerDiameter)
    }

    @Test
    fun camera_fit_polylines_uses_token_padding() {
        val staticFit = resolveLSMapCameraFitSpec(CameraFit.Static)
        val polylineFit = resolveLSMapCameraFitSpec(CameraFit.Polyline(SpacingToken.Spacing4))
        val polylinesFit = resolveLSMapCameraFitSpec(CameraFit.Polylines(SpacingToken.Spacing4))

        assertEquals("static", staticFit.kind)
        assertNull(staticFit.padding)
        assertNull(staticFit.durationMs)

        assertEquals("polyline", polylineFit.kind)
        assertEquals(16.dp, polylineFit.padding)
        assertEquals(LSMapCameraEaseDurationMs, polylineFit.durationMs)

        assertEquals("polylines", polylinesFit.kind)
        assertEquals(16.dp, polylinesFit.padding)
        assertEquals(LSMapCameraEaseDurationMs, polylinesFit.durationMs)
    }

    @Test
    fun missing_token_shows_glass_panel_fallback() {
        val model = resolveLSMapRenderModel(
            mode = MapMode.Interactive,
            camera = CameraPosition(center = LatLng(37.7749, -122.4194), zoom = 10.0),
            hasAccessToken = false,
            isNetworkAvailable = true,
        )

        assertEquals(MapError.MissingToken, model.fallback?.error)
        assertEquals("Map unavailable", model.fallback?.title)
        assertNull(model.styleUri)
        assertTrue(model.polylines.isEmpty())
        assertTrue(model.annotations.isEmpty())
    }

    @Test
    fun network_unavailable_shows_glass_panel_fallback() {
        val model = resolveLSMapRenderModel(
            mode = MapMode.Interactive,
            camera = CameraPosition(center = LatLng(37.7749, -122.4194), zoom = 10.0),
            hasAccessToken = true,
            isNetworkAvailable = false,
        )

        assertEquals(MapError.NetworkUnavailable, model.fallback?.error)
        assertEquals("Network unavailable", model.fallback?.title)
        assertNull(model.styleUri)
        assertTrue(model.polylines.isEmpty())
        assertTrue(model.annotations.isEmpty())
    }

    @Test
    fun scroll_isolation_stays_enabled_while_preview_disables_gestures() {
        val preview = resolveLSMapInteractionSpec(MapMode.Preview)
        val interactive = resolveLSMapInteractionSpec(MapMode.Interactive)

        assertFalse(preview.gesturesEnabled)
        assertTrue(preview.nestedScrollEnabled)
        assertTrue(interactive.gesturesEnabled)
        assertTrue(interactive.nestedScrollEnabled)
    }

    @Test
    fun favorite_pin_specs_match_input_count_and_use_token_colors() {
        val favorites = listOf(
            com.laneshadow.data.favorites.FavoriteLocation(
                id = "fav-001",
                lat = 37.7749,
                lon = -122.4194,
                label = "SF Start"
            ),
            com.laneshadow.data.favorites.FavoriteLocation(
                id = "fav-002",
                lat = 37.8078,
                lon = -122.4750,
                label = "Richmond"
            ),
            com.laneshadow.data.favorites.FavoriteLocation(
                id = "fav-003",
                lat = 37.8324,
                lon = -122.4803,
                label = "Marin Headlands"
            )
        )

        val pinSpecs = resolveLSMapFavoritePinSpecs(favorites, isDarkTheme = false)

        // Verify count matches input
        assertEquals(3, pinSpecs.size)

        // Verify copper fill color (Signal.default)
        assertEquals(GeneratedTokens.color.Signal.default, pinSpecs[0].fillColor)
        assertEquals(GeneratedTokens.color.Signal.default, pinSpecs[1].fillColor)
        assertEquals(GeneratedTokens.color.Signal.default, pinSpecs[2].fillColor)

        // Verify white ring color (Surface.card)
        assertEquals(GeneratedTokens.color.Surface.card, pinSpecs[0].ringColor)
        assertEquals(GeneratedTokens.color.Surface.card, pinSpecs[1].ringColor)
        assertEquals(GeneratedTokens.color.Surface.card, pinSpecs[2].ringColor)

        // Verify coordinates match
        assertEquals(37.7749, pinSpecs[0].coordinate.lat, 0.0)
        assertEquals(-122.4194, pinSpecs[0].coordinate.lon, 0.0)
        assertEquals(37.8078, pinSpecs[1].coordinate.lat, 0.0)
        assertEquals(-122.4750, pinSpecs[1].coordinate.lon, 0.0)
        assertEquals(37.8324, pinSpecs[2].coordinate.lat, 0.0)
        assertEquals(-122.4803, pinSpecs[2].coordinate.lon, 0.0)

        // Verify labels match
        assertEquals("SF Start", pinSpecs[0].label)
        assertEquals("Richmond", pinSpecs[1].label)
        assertEquals("Marin Headlands", pinSpecs[2].label)
    }

    @Test
    fun favorite_pin_specs_empty_when_no_favorites() {
        val pinSpecs = resolveLSMapFavoritePinSpecs(emptyList(), isDarkTheme = false)
        assertTrue(pinSpecs.isEmpty())
    }

    @Test
    fun favoritePins_useCopperDotSpecs() {
        val favorites = listOf(
            com.laneshadow.data.favorites.FavoriteLocation(
                id = "fav-001",
                lat = 37.7749,
                lon = -122.4194,
                label = "SF Start",
            ),
        )

        val pinSpecs = resolveLSMapFavoritePinSpecs(favorites, isDarkTheme = false)
        val source = File("src/main/java/com/laneshadow/ui/atoms/LSMap.kt").readText()

        assertEquals(1, pinSpecs.size)
        assertEquals(GeneratedTokens.color.Signal.default, pinSpecs.single().fillColor)
        assertFalse(source.contains("withIconImage(\"default-marker\")"))
    }

    @Test
    fun lsmap_backward_compatible_with_default_empty_favorites() {
        // Test that the render model resolves correctly without favoriteLocations parameter
        val model = resolveLSMapRenderModel(
            mode = MapMode.Interactive,
            camera = CameraPosition(center = LatLng(37.7749, -122.4194), zoom = 10.0),
            polylines = emptyList(),
            annotations = emptyList(),
            isDarkTheme = false,
            hasAccessToken = true,
        )

        // Should not have fallback, should have style URI
        assertNull(model.fallback)
        assertEquals(GeneratedTokens.map.style.light, model.styleUri)
        assertTrue(model.polylines.isEmpty())
        assertTrue(model.annotations.isEmpty())
    }
}
