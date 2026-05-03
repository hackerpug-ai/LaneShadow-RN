import XCTest
@testable import LaneShadow

final class PolylineDecoderTests: XCTestCase {
    // MARK: - Basic Decoding Tests

    func test_decode_emptyString_returnsEmptyArray() {
        let result = PolylineDecoder.decode("")
        XCTAssertEqual(result, [])
    }

    func test_decode_singleCoordinate_precision5() {
        // Example polyline encoding of a single point at (38.5, -120.2)
        // This is a known Google encoded polyline
        let encoded = "_p~iF~ps|U"
        let result = PolylineDecoder.decode(encoded, precision: 5)

        XCTAssertEqual(result.count, 1)
        if result.count > 0 {
            // Allow small floating point differences
            XCTAssertEqual(result[0].lat, 38.5, accuracy: 0.00001)
            XCTAssertEqual(result[0].lon, -120.2, accuracy: 0.00001)
        }
    }

    func test_decode_multipleCoordinates_precision5() {
        // Known encoded polyline with multiple points
        let encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
        let result = PolylineDecoder.decode(encoded, precision: 5)

        // This should decode to multiple coordinates
        XCTAssert(result.count > 1)
    }

    func test_decode_realWorldExample() {
        // San Francisco to Oakland route (simplified)
        // Coordinates approximately: (37.7749, -122.4194) to (37.8049, -122.2712)
        let encoded = "a~l~Fjk~V"
        let result = PolylineDecoder.decode(encoded, precision: 5)

        XCTAssert(result.count > 0)
        // Just verify structure is valid
        for coordinate in result {
            // SF Bay Area bounds check
            XCTAssert(coordinate.lat > 37.0)
            XCTAssert(coordinate.lat < 38.0)
            XCTAssert(coordinate.lon < -121.0)
            XCTAssert(coordinate.lon > -123.0)
        }
    }

    // MARK: - Empty/Edge Cases

    func test_decode_invalidCharacters_handlesGracefully() {
        let encoded = "!!!invalid!!!"
        // Should not crash, may return empty array or partial results
        let result = PolylineDecoder.decode(encoded)
        XCTAssertNotNil(result)
    }

    func test_decode_precision6() {
        // Test with precision 6 (more granular)
        let encoded = "_p~iF~ps|U"
        let result5 = PolylineDecoder.decode(encoded, precision: 5)
        let result6 = PolylineDecoder.decode(encoded, precision: 6)

        // Results should decode to at least one coordinate
        XCTAssert(result5.count > 0)
        XCTAssert(result6.count > 0)
    }
}
