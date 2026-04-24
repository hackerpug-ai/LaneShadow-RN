import XCTest
@testable import LaneShadow

@MainActor
final class LSSuggestionChipTests: XCTestCase {
    func test_ontap_fires_once_and_resolves_card_surface() throws {
        var tapCount = 0
        let chip = LSSuggestionChip(label: "Twisty back roads") {
            tapCount += 1
        }

        XCTAssertEqual(chip.resolvedStyle.backgroundToken, "color.surface.card")
        XCTAssertEqual(chip.resolvedStyle.borderToken, "color.border.default")
        XCTAssertEqual(chip.size, .md)

        LSSuggestionChip.dispatch { tapCount += 1 }
        XCTAssertEqual(tapCount, 1)

        let source = try moleculeSource(named: "LSSuggestionChip.swift")
        XCTAssertTrue(source.contains("LSPill(size: .md"))
        XCTAssertTrue(source.contains("LSText("))
        XCTAssertFalse(source.contains("frame(height: 32"))
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
}
