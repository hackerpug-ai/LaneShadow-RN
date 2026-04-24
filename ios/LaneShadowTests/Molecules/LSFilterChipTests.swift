import XCTest
@testable import LaneShadow

@MainActor
final class LSFilterChipTests: XCTestCase {
    func test_selected_uses_signal_default_unselected_uses_card_surface() throws {
        let selected = LSFilterChip(label: "Scenic", selected: true, onToggle: {})
        let unselected = LSFilterChip(label: "Scenic", selected: false, onToggle: {})

        XCTAssertEqual(selected.resolvedStyle.backgroundToken, "color.signal.default")
        XCTAssertEqual(selected.resolvedStyle.borderToken, "color.signal.default")
        XCTAssertEqual(unselected.resolvedStyle.backgroundToken, "color.surface.card")
        XCTAssertEqual(unselected.resolvedStyle.borderToken, "color.border.default")

        let source = try moleculeSource(named: "LSFilterChip.swift")
        XCTAssertTrue(source.contains("LSPill("))
        XCTAssertTrue(source.contains("LSText("))
    }

    func test_ontoggle_fires_exactly_once() {
        var tapCount = 0
        LSFilterChip.dispatch { tapCount += 1 }
        XCTAssertEqual(tapCount, 1)
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
