package com.laneshadow.ui.util

import com.laneshadow.ui.atoms.LatLng

/**
 * Google Maps encoded polyline decoder.
 *
 * Decodes the encoded polyline string format used by Google Maps and other mapping services.
 * See: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * The encoding format uses signed latitude/longitude values represented as a string,
 * where each coordinate is encoded as a series of ASCII characters.
 */
object PolylineDecoder {

    /**
     * Decode an encoded polyline string into a list of LatLng coordinates.
     *
     * @param encoded The encoded polyline string
     * @return List of LatLng coordinates
     */
    fun decode(encoded: String): List<LatLng> {
        if (encoded.isBlank()) return emptyList()

        val coordinates = mutableListOf<LatLng>()
        val len = encoded.length
        var index = 0
        var lat = 0
        var lng = 0

        while (index < len) {
            // Decode latitude
            var result = 1
            var shift = 0
            var b: Int
            do {
                b = encoded[index++].code - 63
                result += (b and 0x1F) shl shift
                shift += 5
            } while (b >= 0x20)
            lat += if (result and 1 != 0) (result shr 1).inv() else result shr 1

            // Decode longitude
            result = 1
            shift = 0
            do {
                b = encoded[index++].code - 63
                result += (b and 0x1F) shl shift
                shift += 5
            } while (b >= 0x20)
            lng += if (result and 1 != 0) (result shr 1).inv() else result shr 1

            coordinates.add(LatLng(lat = lat / 1e5, lon = lng / 1e5))
        }

        return coordinates
    }

    /**
     * Decode an encoded polyline string into a list of LatLng coordinates,
     * returning an empty list if the input is blank or decoding fails.
     *
     * @param encoded The encoded polyline string
     * @return List of LatLng coordinates, or empty list if decoding fails
     */
    fun decodeOrNull(encoded: String): List<LatLng> = try {
        decode(encoded)
    } catch (e: Exception) {
        emptyList()
    }
}
