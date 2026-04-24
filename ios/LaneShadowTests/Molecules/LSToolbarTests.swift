import XCTest
@testable import LaneShadow

@MainActor
final class LSToolbarTests: XCTestCase {
    func test_default_render_uses_surface_primary_and_slot_atoms() throws {
        let toolbar = LSToolbar(
            leading: .back(action: {}),
            title: "Details",
            trailing: .action(icon: .menu, action: {})
        )

        XCTAssertEqual(toolbar.titleText, "Details")
        XCTAssertEqual(toolbar.heightTokenPath, "sizing.component.toolbarHeight")
        XCTAssertEqual(toolbar.surfaceTokenPath, "color.surface.primary")

        let source = try moleculeSource(named: "LSToolbar.swift")
        XCTAssertTrue(source.contains("safeAreaInset(edge: .top"))
        XCTAssertTrue(source.contains("LaneShadowTheme.color.surface.primary"))
        XCTAssertTrue(source.contains("LSText(title, variant: .ui.title.md)"))
        XCTAssertTrue(source.contains("LSIcon(name: .chevL, size: .md"))
        XCTAssertTrue(source.contains("LSButton(\"\", variant: .ghost"))
    }

    func test_all_seven_toolbar_navheader_stories_registered() throws {
        let toolbarStories = try storySource(named: "LSToolbarStory.swift")
        let navHeaderStories = try storySource(named: "LSNavHeaderStory.swift")
        let moleculesAggregator = try storySource(named: "MoleculesStories.swift")

        XCTAssertTrue(moleculesAggregator.contains("LSToolbarStory.all"))
        XCTAssertTrue(moleculesAggregator.contains("LSNavHeaderStory.all"))

        let expectedIDs = [
            "molecules.toolbar.backTitleAction",
            "molecules.toolbar.titleOnly",
            "molecules.toolbar.titleTwoActions",
            "molecules.toolbar.noBackButton",
            "molecules.navHeader.default",
            "molecules.navHeader.largeTitle",
            "molecules.navHeader.largeTitleWithSubtitle",
        ]

        for id in expectedIDs {
            XCTAssertTrue(
                toolbarStories.contains(id) || navHeaderStories.contains(id),
                "Missing story id: \(id)"
            )
        }
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
