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
        assertPillSurfaceModifiersAttachToContainer(
            in: source,
            pillSignature: "LSPill(size: size)"
        )
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
