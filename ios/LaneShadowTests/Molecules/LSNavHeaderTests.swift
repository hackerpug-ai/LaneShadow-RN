import XCTest
@testable import LaneShadow

@MainActor
final class LSNavHeaderTests: XCTestCase {
    func test_large_title_uses_opinion_lg_typography() throws {
        let navHeader = LSNavHeader(variant: .largeTitle, title: "Chat")

        XCTAssertEqual(navHeader.titleText, "Chat")
        XCTAssertEqual(navHeader.resolvedTitleVariant, .opinion.lg)

        let source = try moleculeSource(named: "LSNavHeader.swift")
        XCTAssertTrue(source.contains("LSText(title, variant: .opinion.lg)"))
        XCTAssertTrue(source.contains("VStack(alignment: .leading"))
    }

    func test_default_variant_uses_ui_title_md() throws {
        let navHeader = LSNavHeader(variant: .default, title: "Routes")

        XCTAssertEqual(navHeader.titleText, "Routes")
        XCTAssertEqual(navHeader.resolvedTitleVariant, .ui.title.md)

        let source = try moleculeSource(named: "LSNavHeader.swift")
        XCTAssertTrue(source.contains("LSText(title, variant: .ui.title.md)"))
        XCTAssertFalse(source.contains("NavigationView"))
        XCTAssertFalse(source.contains("NavigationStack"))
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
