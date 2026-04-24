import LaneShadowTheme
import XCTest
@testable import LaneShadow

@MainActor
final class LSListRowTests: XCTestCase {
    func test_layout_tokens_and_minimum_touch_target() {
        let row = LSListRow(
            leading: .avatar(initials: "LS"),
            title: "Name",
            subtitle: "Detail",
            trailing: .chevron
        )

        XCTAssertEqual(LSListRow.rowSpacing(in: Theme.shared), Theme.shared.space.sm)
        XCTAssertEqual(LSListRow.verticalPadding(in: Theme.shared), Theme.shared.space.xs)
        XCTAssertEqual(LSListRow.minimumTouchTarget(in: Theme.shared), Theme.shared.touchTarget.minTouchTarget)

        XCTAssertEqual(LSListRow.trailingIconName(for: .chevron), .chevR)
        XCTAssertEqual(row.title, "Name")
        XCTAssertEqual(row.subtitle, "Detail")
    }

    func test_ontap_fires_once_and_no_highlight_without_handler() {
        var tapCount = 0
        let interactive = LSListRow(
            leading: .icon(.pin),
            title: "Notifications",
            trailing: .chevron,
            onTap: {
                tapCount += 1
            }
        )

        interactive.performPrimaryAction()
        XCTAssertEqual(tapCount, 1)

        let staticRow = LSListRow(
            leading: .icon(.pin),
            title: "Static",
            trailing: .none,
            onTap: nil
        )
        XCTAssertFalse(staticRow.isInteractive)
        XCTAssertTrue(LSListRow.hasSemanticToggle(for: .toggle(isOn: true)))
        XCTAssertEqual(
            LSListRow.backgroundToken(isInteractive: false, isPressed: true),
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
