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
        assertPillSurfaceModifiersAttachToContainer(
            in: source,
            pillSignature: "LSPill(size: size)"
        )
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

    private func assertPillSurfaceModifiersAttachToContainer(
        in source: String,
        pillSignature: String,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let segments = pillSourceSegments(in: source, pillSignature: pillSignature)

        XCTAssertNotNil(segments, "Expected to find \(pillSignature)", file: file, line: line)
        guard let segments else { return }

        XCTAssertEqual(occurrences(of: ".background(", in: source), 1, file: file, line: line)
        XCTAssertEqual(occurrences(of: ".overlay(", in: source), 1, file: file, line: line)
        XCTAssertFalse(segments.closureBody.contains(".background("), file: file, line: line)
        XCTAssertFalse(segments.closureBody.contains(".overlay("), file: file, line: line)
        XCTAssertFalse(segments.closureBody.contains(".padding(.horizontal"), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".background("), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".overlay("), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".fill(style.backgroundColor)"), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".stroke(style.borderColor"), file: file, line: line)
    }

    private func pillSourceSegments(
        in source: String,
        pillSignature: String
    ) -> (closureBody: String, trailingModifiers: String)? {
        guard let pillRange = source.range(of: pillSignature),
              let openBrace = source[pillRange.upperBound...].firstIndex(of: "{")
        else {
            return nil
        }

        var depth = 0
        var closeBrace: String.Index?

        for index in source[openBrace...].indices {
            switch source[index] {
            case "{":
                depth += 1
            case "}":
                depth -= 1
                if depth == 0 {
                    closeBrace = index
                    break
                }
            default:
                break
            }
        }

        guard let closeBrace else {
            return nil
        }

        let closureBody = String(source[source.index(after: openBrace) ..< closeBrace])
        let trailingModifiers = String(source[closeBrace...])
        return (closureBody, trailingModifiers)
    }

    private func occurrences(of needle: String, in source: String) -> Int {
        source.components(separatedBy: needle).count - 1
    }
}
