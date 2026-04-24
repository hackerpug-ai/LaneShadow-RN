import XCTest
@testable import LaneShadow

@MainActor
final class LSListRowTests: XCTestCase {
    func test_list_row_uses_touch_target_and_spacing_tokens() throws {
        let row = LSListRow(
            leading: .avatar(initials: "LS"),
            title: "Name",
            subtitle: "Detail",
            trailing: .chevron
        )

        XCTAssertEqual(row.title, "Name")
        XCTAssertEqual(row.subtitle, "Detail")

        let source = try moleculeSource(named: "LSListRow.swift")
        XCTAssertTrue(source.contains("frame(minHeight: theme.touchTarget.minTouchTarget"))
        XCTAssertTrue(source.contains("HStack(spacing: theme.space.sm)"))
        XCTAssertTrue(source.contains(".padding(.vertical, theme.space.xs)"))
    }

    func test_interactive_ontap_fires_exactly_once() {
        var count = 0
        let row = LSListRow(
            leading: .icon(.pin),
            title: "Notifications",
            trailing: .chevron,
            onTap: {
                count += 1
            }
        )

        row.handleTap()

        XCTAssertEqual(count, 1)
    }

    func test_noninteractive_row_has_no_pressed_highlight() {
        let row = LSListRow(
            leading: .icon(.pin),
            title: "Static",
            trailing: .none,
            onTap: nil
        )

        XCTAssertFalse(row.isInteractive)
        XCTAssertEqual(
            row.backgroundToken(isPressed: true),
            "color.surface.card"
        )
    }

    func test_no_forbidden_literal_style_or_deprecated_apis_in_list_row() throws {
        let source = try moleculeSource(named: "LSListRow.swift")

        XCTAssertFalse(source.contains("Color(red:"))
        XCTAssertFalse(source.contains("Color(hex:"))
        XCTAssertFalse(source.contains("Font.system"))
        XCTAssertFalse(source.contains("foregroundColor("))
    }

    func test_list_row_stories_registered_and_molecules_index_contains_all_10_new_story_variants() throws {
        let listRowStory = try storySource(named: "LSListRowStory.swift")
        let contentCardStory = try storySource(named: "LSContentCardStory.swift")
        let molecules = try storySource(named: "MoleculesStories.swift")

        XCTAssertTrue(molecules.contains("LSContentCardStory.all"))
        XCTAssertTrue(molecules.contains("LSListRowStory.all"))

        XCTAssertTrue(listRowStory.contains("molecules.listRow.leadingIcon"))
        XCTAssertTrue(listRowStory.contains("molecules.listRow.leadingAvatar"))
        XCTAssertTrue(listRowStory.contains("molecules.listRow.withSubtitle"))
        XCTAssertTrue(listRowStory.contains("molecules.listRow.withToggle"))
        XCTAssertTrue(listRowStory.contains("molecules.listRow.withChevron"))
        XCTAssertTrue(listRowStory.contains("molecules.listRow.withTrailingButton"))
        XCTAssertTrue(listRowStory.contains("component: \"LSListRow\""))

        XCTAssertTrue(contentCardStory.contains("molecules.contentCard.withImageHeader"))
        XCTAssertTrue(contentCardStory.contains("molecules.contentCard.titleOnly"))
        XCTAssertTrue(contentCardStory.contains("molecules.contentCard.titleSubtitleChips"))
        XCTAssertTrue(contentCardStory.contains("molecules.contentCard.withActions"))
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
