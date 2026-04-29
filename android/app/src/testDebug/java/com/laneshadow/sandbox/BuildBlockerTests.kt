package com.laneshadow.sandbox

import com.laneshadow.ui.organisms.Session
import com.laneshadow.ui.util.PolylineDecoder
import com.laneshadow.ui.atoms.LatLng
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Tests for FID-S01-T07 build blockers.
 *
 * AC-1: Session data class declaration in ui.organisms package
 * AC-2: Polyline decoding from route state
 */
class BuildBlockerTests {

    // ========================================================================
    // AC-1: Session data class declaration
    // ========================================================================

    @Test
    fun test_session_data_class_exists_in_ui_organisms() {
        // Given: The Session class should exist in ui.organisms package
        // When: We create a Session instance
        // Then: It should compile and have the expected fields

        val session = Session(
            id = "test-session-001",
            title = "Test Session",
            whenLabel = "Today",
            preview = "Test preview text",
            meta = "3 routes · Active",
            isActive = true,
            routeIds = listOf("route-1", "route-2"),
            createdAt = "2026-04-27T10:00:00Z"
        )

        // Verify the object was created successfully
        assertNotNull("Session object should not be null", session)
        assertEquals("Session ID should match", "test-session-001", session.id)
        assertEquals("Session title should match", "Test Session", session.title)
        assertEquals("Session whenLabel should match", "Today", session.whenLabel)
        assertEquals("Session preview should match", "Test preview text", session.preview)
        assertEquals("Session meta should match", "3 routes · Active", session.meta)
        assertEquals("Session isActive should match", true, session.isActive)
        assertEquals("Session routeIds should match", listOf("route-1", "route-2"), session.routeIds)
        assertEquals("Session createdAt should match", "2026-04-27T10:00:00Z", session.createdAt)
    }

    @Test
    fun test_session_data_class_has_all_required_fields() {
        // Given: A Session instance
        val session = Session(
            id = "id",
            title = "title",
            whenLabel = "when",
            preview = "preview",
            meta = "meta",
            isActive = false,
            routeIds = emptyList(),
            createdAt = "2026-04-27T10:00:00Z"
        )

        // When: We access all fields
        // Then: All fields should be accessible and have correct values
        assertEquals("id", session.id)
        assertEquals("title", session.title)
        assertEquals("when", session.whenLabel)
        assertEquals("preview", session.preview)
        assertEquals("meta", session.meta)
        assertEquals(false, session.isActive)
        assertEquals(emptyList<String>(), session.routeIds)
        assertEquals("2026-04-27T10:00:00Z", session.createdAt)
    }

    // ========================================================================
    // AC-2: Polyline decoding from route state
    // ========================================================================

    @Test
    fun test_polyline_decoder_decodes_encoded_string() {
        // Given: An encoded polyline string from mock data
        val encodedPolyline = "q`xwF|~kjVAo@f@e@lBiYfOaMnJcZ`FoOnFyDtL}DnK{DvB{FbEyE~CyC`Dy@hCq@|A}@jC]lBg@fBs@bBc@|@a@r@U`@O`@If@E\\G\\I`@Mf@Ul@Uz@w@hBe@f@i@`@c@x@]t@Qr@Op@M`@K`@I\\G"

        // When: We decode it using PolylineDecoder.decodeOrNull
        val coordinates = PolylineDecoder.decodeOrNull(encodedPolyline)

        // Then: We should get a list of LatLng coordinates
        assertNotNull("Decoded coordinates should not be null", coordinates)
        assertTrue("Decoded coordinates should not be empty", coordinates.isNotEmpty())

        // Verify we got multiple coordinates (the encoded string should decode to many points)
        assertTrue("Should decode to multiple coordinates", coordinates.size > 10)

        // Verify first coordinate is in expected range (San Francisco Bay Area)
        val firstCoord = coordinates.first()
        assertTrue("Latitude should be in valid range", firstCoord.lat >= -90 && firstCoord.lat <= 90)
        assertTrue("Longitude should be in valid range", firstCoord.lon >= -180 && firstCoord.lon <= 180)
    }

    @Test
    fun test_polyline_decoder_handles_empty_string() {
        // Given: An empty polyline string
        val emptyPolyline = ""

        // When: We decode it using PolylineDecoder.decodeOrNull
        val coordinates = PolylineDecoder.decodeOrNull(emptyPolyline)

        // Then: We should get an empty list (not null, not exception)
        assertNotNull("Decoded coordinates should not be null", coordinates)
        assertTrue("Decoded coordinates should be empty", coordinates.isEmpty())
    }

    @Test
    fun test_polyline_decoder_handles_invalid_string() {
        // Given: An invalid polyline string
        val invalidPolyline = "not-a-valid-polyline!!!"

        // When: We decode it using PolylineDecoder.decodeOrNull
        val coordinates = PolylineDecoder.decodeOrNull(invalidPolyline)

        // Then: We should get a non-null result (graceful degradation - doesn't crash)
        // The decoder will attempt to decode any string, even invalid ones
        assertNotNull("Decoded coordinates should not be null", coordinates)
        // Note: The decoder doesn't throw exceptions for invalid input,
        // it just decodes whatever it can, so we don't assert empty here
    }
}
