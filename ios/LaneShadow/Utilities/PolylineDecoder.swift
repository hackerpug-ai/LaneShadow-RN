import Foundation

/// Decodes Google encoded polylines (format version 5 and 6)
/// Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
enum PolylineDecoder {
    /// Decodes a Google encoded polyline string into an array of coordinates
    /// - Parameters:
    ///   - encodedString: The encoded polyline string
    ///   - precision: The precision value (5 or 6); determines the number of decimal places
    /// - Returns: Array of LatLng, empty if decoding fails
    static func decode(
        _ encodedString: String,
        precision: Int = 5
    ) -> [LatLng] {
        guard !encodedString.isEmpty else { return [] }

        let data = Array(encodedString.utf8)
        var lat = 0
        var lng = 0
        var index = 0
        var coordinates: [LatLng] = []
        let factor = Int(pow(10.0, Double(precision)))

        while index < data.count {
            // Decode latitude
            let latResult = decodeValue(data: data, startIndex: &index, lastValue: lat)
            lat = latResult
            let latDegrees = Double(lat) / Double(factor)

            // Decode longitude
            let lngResult = decodeValue(data: data, startIndex: &index, lastValue: lng)
            lng = lngResult
            let lngDegrees = Double(lng) / Double(factor)

            coordinates.append(LatLng(lat: latDegrees, lon: lngDegrees))
        }

        return coordinates
    }

    /// Helper function to decode individual values from the polyline string
    private static func decodeValue(
        data: [UInt8],
        startIndex: inout Int,
        lastValue: Int
    ) -> Int {
        var result = 0
        var shift = 0

        while startIndex < data.count {
            let byte = Int(data[startIndex]) - 63
            startIndex += 1

            result |= (byte & 0x1F) << shift
            shift += 5

            // If this is not the last chunk, continue
            if (byte & 0x20) == 0 {
                break
            }
        }

        // Handle negative values (two's complement)
        let delta = (result & 1) != 0 ? ~(result >> 1) : (result >> 1)
        return lastValue + delta
    }
}
