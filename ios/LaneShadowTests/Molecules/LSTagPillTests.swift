import XCTest
@testable import LaneShadow

final class LSTagPillTests: XCTestCase {
    func test_glass_surface_and_icon_atom_composition() throws {
        let pill = LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")

        XCTAssertEqual(pill.resolvedStyle.backgroundToken, "color.surface.glass")
        XCTAssertEqual(pill.resolvedStyle.borderToken, "color.border.default")
        XCTAssertEqual(pill.resolvedStyle.iconColor, .signal)
        XCTAssertEqual(pill.labelText, "Near Santa Cruz, CA")

        let source = try moleculeSource(named: "LSTagPill.swift")
        XCTAssertTrue(source.contains("LSPill("))
        XCTAssertTrue(source.contains("LSIcon("))
        XCTAssertTrue(source.contains("LSText("))
        XCTAssertFalse(source.contains("Image(systemName:"))
        XCTAssertFalse(containsRawTextCall(source))
    }

    func test_pill_semantics_stories_registered() throws {
        let stories = try storySource(named: "LSPillSemanticsStory.swift")
        let moleculesAggregator = try storySource(named: "MoleculesStories.swift")
        let laneShadowStories = try sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertTrue(moleculesAggregator.contains("LSPillSemanticsStory.all"))
        XCTAssertTrue(laneShadowStories.contains("+ MoleculesStories.all"))

        XCTAssertTrue(stories.contains("molecules.pillSemantics.tagPill.default"))
        XCTAssertTrue(stories.contains("molecules.pillSemantics.filterChip.unselected"))
        XCTAssertTrue(stories.contains("molecules.pillSemantics.filterChip.selected"))
        XCTAssertTrue(stories.contains("molecules.pillSemantics.suggestionChip.default"))

        for condition in ["sun", "rain", "wind", "storm", "hot", "cold"] {
            for size in ["sm", "md"] {
                XCTAssertTrue(stories.contains("molecules.pillSemantics.weatherBadge.\(condition).\(size)"))
            }
        }
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Molecules")
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

    private func sandboxSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Sandbox")
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

    private func containsRawTextCall(_ source: String) -> Bool {
        source
            .replacingOccurrences(of: "LSText(", with: "")
            .contains("Text(")
    }
}
