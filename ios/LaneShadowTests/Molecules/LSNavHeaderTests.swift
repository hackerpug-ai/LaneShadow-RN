import XCTest
@testable import LaneShadow

@MainActor
final class LSNavHeaderTests: XCTestCase {
    func test_large_title_uses_opinion_lg_typography() throws {
        let expectedHeight = try toolbarHeightTokenValue()
        let navHeader = LSNavHeader(variant: .largeTitle, title: "Chat")
        let source = try moleculeSource(named: "LSNavHeader.swift")

        XCTAssertEqual(navHeader.titleText, "Chat")
        XCTAssertEqual(navHeader.resolvedTitleVariant, .opinion.lg)
        XCTAssertEqual(navHeader.toolbarHeight, expectedHeight)

        XCTAssertTrue(source.contains("LSText(title, variant: .opinion.lg)"))
        XCTAssertTrue(source.contains(".padding(.horizontal, theme.space.lg)"))
        XCTAssertTrue(source.contains(".padding(.bottom, variant == .largeTitle ? theme.space.lg"))
        XCTAssertTrue(source.contains(".frame(height: toolbarHeight)"))
        XCTAssertFalse(source.contains(".frame(height: theme.control.minHeight)"))
        XCTAssertFalse(source.contains("NavigationView"))
        XCTAssertFalse(source.contains("NavigationStack"))
    }

    func test_default_variant_uses_ui_title_md() throws {
        let expectedHeight = try toolbarHeightTokenValue()
        let navHeader = LSNavHeader(variant: .default, title: "Routes")
        let source = try moleculeSource(named: "LSNavHeader.swift")

        XCTAssertEqual(navHeader.titleText, "Routes")
        XCTAssertEqual(navHeader.resolvedTitleVariant, .ui.title.md)
        XCTAssertEqual(navHeader.toolbarHeight, expectedHeight)

        XCTAssertTrue(source.contains("LSText(title, variant: .ui.title.md)"))
        XCTAssertTrue(source.contains(".padding(.horizontal, theme.space.lg)"))
    }

    private func toolbarHeightTokenValue() throws -> CGFloat {
        let url = repoRoot().appendingPathComponent("tokens/semantic/dimensions.tokens.json")
        let data = try Data(contentsOf: url)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let dimensions = try XCTUnwrap(json?["dimensions"] as? [String: Any])
        let sizing = try XCTUnwrap(dimensions["sizing"] as? [String: Any])
        let component = try XCTUnwrap(sizing["component"] as? [String: Any])
        let toolbarHeight = try XCTUnwrap(component["toolbarHeight"] as? [String: Any])
        let value = try XCTUnwrap(toolbarHeight["$value"] as? Double)
        return CGFloat(value)
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios/LaneShadow/Views/Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }

    private func repoRoot() -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }
}
