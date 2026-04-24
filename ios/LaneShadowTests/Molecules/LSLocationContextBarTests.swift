import XCTest
@testable import LaneShadow

@MainActor
final class LSLocationContextBarTests: XCTestCase {
    func test_two_tagpill_atoms_space_between_with_pin_icon() throws {
        let bar = LSLocationContextBar(
            location: "Near Santa Cruz, CA",
            mode: .manual,
            onModeChange: {}
        )

        XCTAssertEqual(bar.location, "Near Santa Cruz, CA")
        XCTAssertEqual(bar.mode, .manual)
        XCTAssertEqual(bar.mode.pillLabel, "MANUAL")

        let source = try moleculeSource(named: "LSLocationContextBar.swift")
        XCTAssertEqual(source.components(separatedBy: "LSTagPill(").count - 1, 2)
        XCTAssertTrue(source.contains("LSTagPill(icon: .pin, label: location)"))
        XCTAssertTrue(source.contains("Spacer(minLength: theme.space.xs)"))
        XCTAssertTrue(source.contains(".padding(.horizontal, theme.space.xs)"))
    }

    func test_mode_pill_tap_fires_onmodechange_once() {
        var fireCount = 0
        let bar = LSLocationContextBar(
            location: "Near Santa Cruz, CA",
            mode: .manual
        ) {
            fireCount += 1
        }

        bar.handleModeTap()

        XCTAssertEqual(fireCount, 1)
    }

    func test_location_context_stories_registered() throws {
        let stories = try storySource(named: "LSLocationContextBarStory.swift")
        let moleculesAggregator = try storySource(named: "MoleculesStories.swift")

        XCTAssertTrue(moleculesAggregator.contains("LSLocationContextBarStory.all"))
        XCTAssertTrue(stories.contains("molecules.locationContextBar.default"))
        XCTAssertTrue(stories.contains("molecules.locationContextBar.manualMode"))
        XCTAssertTrue(stories.contains("molecules.locationContextBar.longLocationLabel"))
        XCTAssertTrue(stories.contains("component: \"LocationContextBar\""))
        XCTAssertTrue(stories.contains("name: \"Default (Auto)\""))
        XCTAssertTrue(stories.contains("name: \"Manual Mode\""))
        XCTAssertTrue(stories.contains("name: \"Long Location Label\""))
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
