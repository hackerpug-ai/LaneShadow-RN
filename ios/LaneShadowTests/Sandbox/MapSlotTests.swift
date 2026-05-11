import XCTest
@testable import LaneShadow

/// Map slot tests for the real-map-only contract.
@MainActor
final class MapSlotTests: XCTestCase {
    func testTemplateMapSlotsUseLiveLSMap() throws {
        let idleSource = try source(named: "IdleScreen.swift", in: "Templates")
        let errorSource = try source(named: "ErrorScreen.swift", in: "Templates")

        XCTAssertTrue(idleSource.contains("LSMap("))
        XCTAssertTrue(errorSource.contains("LSMap("))
        XCTAssertTrue(errorSource.contains("LSMapPresentationDefaults.errorPolyline"))
        XCTAssertFalse(idleSource.contains("LSPaper" + "Map"))
        XCTAssertFalse(errorSource.contains("LSPaper" + "Map"))
    }

    func testRemovedStaticMapComponentIsNotInProjectSpec() throws {
        let projectSpec = try String(
            contentsOfFile: "/Users/justinrich/Projects/LaneShadow/ios/project.yml",
            encoding: .utf8
        )

        XCTAssertFalse(projectSpec.contains("LSPaper" + "Map"))
    }

    func testFavoritePinDotUsesThemeToken() throws {
        // GIVEN: LSFavoritePinDot component renders pin dots
        // WHEN: Source code is checked
        // THEN: Should NOT have hardcoded CGFloat = 16, should use theme token

        let source = try source(named: "LSFavoritePinDot.swift", in: "Molecules")

        // MUST NOT have hardcoded CGFloat literal
        XCTAssertFalse(
            source.contains("CGFloat = 16") && source.contains("let pinSize: CGFloat = 16"),
            "LSFavoritePinDot MUST NOT use hardcoded CGFloat = 16 — should use theme.iconSize.small"
        )

        // SHOULD use theme token for pin size
        XCTAssertTrue(
            source.contains("theme.iconSize") || source.contains("pinSize"),
            "LSFavoritePinDot SHOULD use theme token for pin size"
        )
    }

    func testScenicDotStripUsesThemeToken() throws {
        // GIVEN: LSScenicDotStrip component renders scenic rating dots
        // WHEN: Source code is checked
        // THEN: Should NOT have hardcoded CGFloat = 8, should use theme token

        let source = try source(named: "LSScenicDotStrip.swift", in: "Molecules")

        // MUST NOT have hardcoded CGFloat literal
        XCTAssertFalse(
            source.contains("CGFloat = 8") && source.contains("let dotSize: CGFloat = 8"),
            "LSScenicDotStrip MUST NOT use hardcoded CGFloat = 8 — should use theme token"
        )

        // SHOULD use theme token for dot size
        XCTAssertTrue(
            source.contains("theme.iconSize") || source.contains("dotSize"),
            "LSScenicDotStrip SHOULD use theme token for dot size"
        )
    }

    // MARK: - Helpers

    private func source(named name: String, in directory: String = "Molecules") throws -> String {
        let path = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/\(directory)/\(name)"
        return try String(contentsOfFile: path, encoding: .utf8)
    }
}
