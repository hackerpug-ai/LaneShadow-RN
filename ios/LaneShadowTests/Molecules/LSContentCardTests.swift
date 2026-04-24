import XCTest
@testable import LaneShadow

@MainActor
final class LSContentCardTests: XCTestCase {
    func test_default_render_routes_surface_and_typography_through_atoms() throws {
        let card = LSContentCard(
            title: "Route X",
            subtitle: "42 mi · 1h 12m"
        )

        XCTAssertEqual(card.title, "Route X")
        XCTAssertEqual(card.subtitle, "42 mi · 1h 12m")

        let source = try moleculeSource(named: "LSContentCard.swift")
        XCTAssertTrue(source.contains("LSCard("))
        XCTAssertTrue(source.contains("LSText(title, variant: .title.md"))
        XCTAssertTrue(source.contains("LSText(subtitle, variant: .body.md"))
        XCTAssertTrue(source.contains("LSDivider()"))
    }

    func test_action_footer_renders_after_metadata_and_absent_footer_adds_no_extra_gap() {
        let noActions = LSContentCard(
            title: "Route X",
            subtitle: "42 mi · 1h 12m",
            metadata: ["3,400 ft gain"]
        )
        let withActions = LSContentCard(
            title: "Route X",
            subtitle: "42 mi · 1h 12m",
            metadata: ["3,400 ft gain"]
        ) {
            LSButton("Ride This", variant: .primary, action: {})
        }

        XCTAssertFalse(noActions.hasActionsFooter)
        XCTAssertTrue(withActions.hasActionsFooter)
        XCTAssertEqual(noActions.bodyBottomPaddingWhenFooterMissing, 0)
    }

    func test_no_forbidden_literal_style_or_deprecated_apis_in_content_card() throws {
        let source = try moleculeSource(named: "LSContentCard.swift")

        XCTAssertFalse(source.contains("Color(red:"))
        XCTAssertFalse(source.contains("Color(hex:"))
        XCTAssertFalse(source.contains("Font.system"))
        XCTAssertFalse(source.contains("foregroundColor("))
    }

    func test_content_card_stories_registered() throws {
        let storyFile = try storySource(named: "LSContentCardStory.swift")
        let molecules = try storySource(named: "MoleculesStories.swift")

        XCTAssertTrue(molecules.contains("LSContentCardStory.all"))
        XCTAssertTrue(storyFile.contains("molecules.contentCard.withImageHeader"))
        XCTAssertTrue(storyFile.contains("molecules.contentCard.titleOnly"))
        XCTAssertTrue(storyFile.contains("molecules.contentCard.titleSubtitleChips"))
        XCTAssertTrue(storyFile.contains("molecules.contentCard.withActions"))
        XCTAssertTrue(storyFile.contains("component: \"LSContentCard\""))
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios/LaneShadow/Views/Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }

    private func storySource(named fileName: String) throws -> String {
        let root = repoRoot()
        let candidateURLs = [
            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/Molecules/\(fileName)"),
            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/\(fileName)"),
        ]

        for url in candidateURLs where FileManager.default.fileExists(atPath: url.path) {
            return try String(contentsOf: url, encoding: .utf8)
        }

        XCTFail("Missing story source: \(fileName)")
        return ""
    }

    private func repoRoot() -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }
}
