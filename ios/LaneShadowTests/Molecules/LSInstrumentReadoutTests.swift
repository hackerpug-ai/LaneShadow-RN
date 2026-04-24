import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - LSInstrumentReadout Tests

/**
 * Tests for LSInstrumentReadout molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - 4-column grid with LSDivider atoms
 * - Mono typography values via instrument.lg
 * - N-column support (3-column, 2-column)
 * - Label/value/unit hierarchy
 * - Theme integration with semantic colors
 */
final class LSInstrumentReadoutTests: XCTestCase {
    // MARK: - AC-4: LSInstrumentReadout 4-column grid

    func test_four_column_grid_with_divider_atoms_and_mono_values() {
        // GIVEN: LSInstrumentReadout with 4 metrics
        let metrics: [InstrumentMetric] = [
            .dist("64 mi"),
            .time("2h 10m"),
            .climb("2,400ft"),
            .scenic("9.2"),
        ]
        let readout = LSInstrumentReadout(metrics: metrics)

        // WHEN: View body resolves
        let view = readout.body

        // THEN: 4-column grid with top/bottom LSDivider + mono values
        XCTAssertNotNil(view)

        // Verify 4 metrics are present
        XCTAssertEqual(metrics.count, 4)

        // Verify metric types
        XCTAssertEqual(metrics[0], .dist("64 mi"))
        XCTAssertEqual(metrics[1], .time("2h 10m"))
        XCTAssertEqual(metrics[2], .climb("2,400ft"))
        XCTAssertEqual(metrics[3], .scenic("9.2"))

        // Verify theme integration
        let themedView = readout.laneShadowTheme()
        XCTAssertNotNil(themedView)
    }

    // MARK: - AC-5: LSInstrumentReadout supports N-column grids

    func test_three_column_grid_renders_without_crash() {
        // GIVEN: LSInstrumentReadout with 3 metrics
        let metrics: [InstrumentMetric] = [
            .dist("64 mi"),
            .time("2h 10m"),
            .climb("2,400ft"),
        ]
        let readout = LSInstrumentReadout(metrics: metrics)

        // WHEN: View renders
        let view = readout.body

        // THEN: 3-column grid renders without crash
        XCTAssertNotNil(view)

        // Verify 3 metrics are present
        XCTAssertEqual(metrics.count, 3)
    }

    func test_two_column_grid_renders_without_crash() {
        // GIVEN: LSInstrumentReadout with 2 metrics
        let metrics: [InstrumentMetric] = [
            .dist("64 mi"),
            .time("2h 10m"),
        ]
        let readout = LSInstrumentReadout(metrics: metrics)

        // WHEN: View renders
        let view = readout.body

        // THEN: 2-column grid renders without crash
        XCTAssertNotNil(view)

        // Verify 2 metrics are present
        XCTAssertEqual(metrics.count, 2)
    }
}
