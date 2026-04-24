package com.laneshadow.ui.atoms

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSMapTest {
    @Test
    fun latLng_data_class_exists() {
        val latLng = LatLng(37.7749, -122.4194)
        assertEquals(37.7749, latLng.lat, 0.0)
        assertEquals(-122.4194, latLng.lon, 0.0)
    }

    @Test
    fun colorToken_data_class_exists() {
        val colorToken = ColorToken("color.route.best")
        assertEquals("color.route.best", colorToken.path)
    }

    @Test
    fun strokeSize_enum_has_all_cases() {
        val sizes = StrokeSize.entries
        assertEquals(3, sizes.size)
        assertTrue(sizes.contains(StrokeSize.Sm))
        assertTrue(sizes.contains(StrokeSize.Md))
        assertTrue(sizes.contains(StrokeSize.Lg))
    }

    @Test
    fun spacingToken_enum_has_all_cases() {
        val tokens = SpacingToken.entries
        assertEquals(3, tokens.size)
        assertTrue(tokens.contains(SpacingToken.Spacing3))
        assertTrue(tokens.contains(SpacingToken.Spacing4))
        assertTrue(tokens.contains(SpacingToken.Spacing5))
    }

    @Test
    fun cameraPosition_data_class_exists_with_optional_params() {
        val full = CameraPosition(
            center = LatLng(37.7749, -122.4194),
            zoom = 10.0,
            pitch = 45.0,
            bearing = 90.0,
        )
        assertEquals(37.7749, full.center.lat, 0.0)
        assertEquals(10.0, full.zoom, 0.0)
        assertEquals(45.0, full.pitch!!, 0.0)
        assertEquals(90.0, full.bearing!!, 0.0)

        val minimal = CameraPosition(
            center = LatLng(37.7749, -122.4194),
            zoom = 10.0,
        )
        assertEquals(37.7749, minimal.center.lat, 0.0)
        assertEquals(10.0, minimal.zoom, 0.0)
        assertEquals(null, minimal.pitch)
        assertEquals(null, minimal.bearing)
    }

    @Test
    fun annotationKind_enum_has_all_cases() {
        val kinds = AnnotationKind.entries
        assertEquals(3, kinds.size)
        assertTrue(kinds.contains(AnnotationKind.Start))
        assertTrue(kinds.contains(AnnotationKind.End))
        assertTrue(kinds.contains(AnnotationKind.Waypoint))
    }

    @Test
    fun annotation_data_class_exists_with_optional_label() {
        val withLabel = Annotation(
            kind = AnnotationKind.Start,
            coordinate = LatLng(37.7749, -122.4194),
            label = "Start",
        )
        assertEquals("Start", withLabel.label)

        val withoutLabel = Annotation(
            kind = AnnotationKind.End,
            coordinate = LatLng(37.8626, -122.4856),
        )
        assertEquals(null, withoutLabel.label)
    }

    @Test
    fun routeVariant_sealed_class_has_all_cases() {
        val best = RouteVariant.Best
        val alt1 = RouteVariant.Alt1
        val alt2 = RouteVariant.Alt2
        val custom = RouteVariant.Custom(ColorToken("color.route.custom"))

        assertTrue(best is RouteVariant)
        assertTrue(alt1 is RouteVariant)
        assertTrue(alt2 is RouteVariant)
        assertTrue(custom is RouteVariant)
    }

    @Test
    fun polylineData_data_class_exists_with_defaults() {
        val poly1 = PolylineData(
            coordinates = listOf(
                LatLng(37.7749, -122.4194),
                LatLng(37.8078, -122.4750),
            ),
            variant = RouteVariant.Best,
        )
        assertEquals(2, poly1.coordinates.size)
        assertEquals(RouteVariant.Best, poly1.variant)
        assertEquals(StrokeSize.Md, poly1.strokeWidth)

        val poly2 = PolylineData(
            coordinates = listOf(
                LatLng(37.7749, -122.4194),
                LatLng(37.8078, -122.4750),
            ),
            variant = RouteVariant.Alt1,
            strokeWidth = StrokeSize.Lg,
        )
        assertEquals(StrokeSize.Lg, poly2.strokeWidth)
    }

    @Test
    fun mapMode_enum_has_all_cases() {
        val modes = MapMode.entries
        assertEquals(2, modes.size)
        assertTrue(modes.contains(MapMode.Preview))
        assertTrue(modes.contains(MapMode.Interactive))
    }

    @Test
    fun cameraFit_sealed_class_has_all_cases() {
        val static = CameraFit.Static
        val polyline = CameraFit.Polyline(SpacingToken.Spacing4)
        val polylines = CameraFit.Polylines(SpacingToken.Spacing5)

        assertTrue(static is CameraFit)
        assertTrue(polyline is CameraFit)
        assertTrue(polylines is CameraFit)
        assertEquals(SpacingToken.Spacing4, (polyline as CameraFit.Polyline).padding)
        assertEquals(SpacingToken.Spacing5, (polylines as CameraFit.Polylines).padding)
    }

    @Test
    fun mapError_enum_has_all_cases() {
        val errors = MapError.entries
        assertEquals(3, errors.size)
        assertTrue(errors.contains(MapError.MissingToken))
        assertTrue(errors.contains(MapError.NetworkUnavailable))
        assertTrue(errors.contains(MapError.StyleLoadFailed))
    }

    @Test
    fun source_file_exists_and_contains_lsMap_function() {
        val source = File("src/main/java/com/laneshadow/ui/atoms/LSMap.kt")
        assertTrue("LSMap.kt source file should exist", source.exists())

        val content = source.readText()
        assertTrue("Source should contain LSMap function", content.contains("fun LSMap("))
        assertTrue("Source should contain mode parameter", content.contains("mode: MapMode"))
        assertTrue("Source should contain camera parameter", content.contains("camera: CameraPosition"))
        assertTrue("Source should contain polylines parameter", content.contains("polylines: List<PolylineData>"))
        assertTrue("Source should contain annotations parameter", content.contains("annotations: List<Annotation>"))
    }

}
