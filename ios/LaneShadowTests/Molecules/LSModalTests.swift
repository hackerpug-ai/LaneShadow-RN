import XCTest
@testable import LaneShadow

@MainActor
final class LSModalTests: XCTestCase {
    func test_modal_composes_button_atoms_and_secondary_dismisses() throws {
        let source = try moleculeSource(named: "LSModal.swift")
        let secondary = LSModalAction.ghost("Cancel") {}
        var secondaryTapCount = 0
        var dismissCount = 0
        var isPresented = true

        LSModal.dispatch(
            action: LSModalAction.ghost("Cancel") {
                secondaryTapCount += 1
            },
            isPresented: &isPresented,
            onDismiss: {
                dismissCount += 1
            }
        )

        XCTAssertEqual(secondary.variant, .ghost)
        XCTAssertEqual(LSModalAction.destructive("Delete") {}.variant, .destructive)
        XCTAssertFalse(isPresented)
        XCTAssertEqual(secondaryTapCount, 1)
        XCTAssertEqual(dismissCount, 1)
        XCTAssertTrue(source.contains("LSText(title, variant: .ui.title.md)"))
        XCTAssertTrue(source.contains("LSText(body, variant: .body.md, color: .secondary)"))
        XCTAssertTrue(source.contains("LSButton(secondary.title, variant: secondary.variant"))
        XCTAssertTrue(source.contains("LSButton(primary.title, variant: primary.variant"))
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
