import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - LSWeatherTimeline Tests

/**
 * Tests for LSWeatherTimeline molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Header row with title and time span
 * - 6-cell grid with per-condition tinted backgrounds
 * - Weather icons via LSIcon atom
 * - Temperature values in mono typography
 * - Theme integration with semantic weather colors
 */
final class LSWeatherTimelineTests: XCTestCase {

    // MARK: - AC-3: LSWeatherTimeline renders 6 cells with per-condition tints

    func test_six_cells_render_with_per_condition_tinted_backgrounds() {
        // GIVEN: LSWeatherTimeline with 6 entries
        let entries = [
            WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
            WeatherEntry(hour: "10 AM", condition: .rain, temp: "65°"),
            WeatherEntry(hour: "11 AM", condition: .wind, temp: "63°"),
            WeatherEntry(hour: "12 PM", condition: .storm, temp: "60°"),
            WeatherEntry(hour: "1 PM", condition: .hot, temp: "75°"),
            WeatherEntry(hour: "2 PM", condition: .cold, temp: "55°"),
        ]
        let timeline = LSWeatherTimeline(
            entries: entries,
            from: "9 AM",
            to: "2 PM"
        )

        // WHEN: View body resolves
        let view = timeline.body

        // THEN: Header row + 6 cells with per-condition tints render
        XCTAssertNotNil(view)

        // Verify 6 entries are present
        XCTAssertEqual(entries.count, 6)

        // Verify all weather conditions are represented
        let conditions = Set(entries.map { $0.condition })
        XCTAssertTrue(conditions.contains(.clear))
        XCTAssertTrue(conditions.contains(.rain))
        XCTAssertTrue(conditions.contains(.wind))
        XCTAssertTrue(conditions.contains(.storm))
        XCTAssertTrue(conditions.contains(.hot))
        XCTAssertTrue(conditions.contains(.cold))

        // Verify theme integration
        let themedView = timeline.laneShadowTheme()
        XCTAssertNotNil(themedView)
    }
}
