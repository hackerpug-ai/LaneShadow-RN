import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSWeatherBadgeTests: XCTestCase {
    func test_all_six_conditions_resolve_weather_color_tokens() {
        let expected: [(WeatherCondition, String, IconName)] = [
            (.sun, "sun", .sun),
            (.rain, "rain", .rain),
            (.wind, "wind", .wind),
            (.storm, "storm", .storm),
            (.hot, "hot", .therm),
            (.cold, "cold", .therm),
        ]

        for (condition, key, icon) in expected {
            let style = condition.resolvedStyle
            XCTAssertEqual(style.backgroundToken, "color.weather.\(key).tint")
            XCTAssertEqual(style.foregroundToken, "color.weather.\(key).default")
            XCTAssertEqual(style.borderToken, "color.weather.\(key).default")
            XCTAssertEqual(style.icon, icon)
        }
    }

    func test_sm_and_md_size_heights_from_pill_atom() throws {
        let badgeSmall = LSWeatherBadge(condition: .rain, label: "Rain", size: .sm)
        let badgeMedium = LSWeatherBadge(condition: .rain, label: "Rain", size: .md)

        XCTAssertEqual(badgeSmall.size, .sm)
        XCTAssertEqual(badgeMedium.size, .md)

        let source = try moleculeSource(named: "LSWeatherBadge.swift")
        XCTAssertTrue(source.contains("LSPill(size: size"))
        XCTAssertFalse(source.contains("frame(height:"))
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }
}
