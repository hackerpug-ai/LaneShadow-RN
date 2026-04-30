import XCTest
@testable import LaneShadow

final class LSIconTypeSafetyTests: XCTestCase {
    func test_color_param_rejects_raw_Color() {
        let expectedCases: [IconContentColor] = [
            .primary,
            .secondary,
            .tertiary,
            .subtle,
            .onSignal,
            .signal,
        ]

        XCTAssertEqual(IconContentColor.allCases, expectedCases)

        let icon = LSIcon(name: .star, size: .sm, color: .signal)
        XCTAssertNotNil(icon)

        // Compile-time gate: this intentionally remains commented because it must not compile.
        // let _ = LSIcon(name: .star, size: .sm, color: Color.red)
    }

    func test_authscreen_glyphs_supported_by_icon_layers() throws {
        let lsIconSource = try String(
            contentsOfFile: sourceFilePath("LaneShadow/Views/Atoms/LSIcon.swift"),
            encoding: .utf8
        )
        let adapterSource = try String(
            contentsOfFile: sourceFilePath("LaneShadow/Views/Atoms/IconSymbolIOS.swift"),
            encoding: .utf8
        )

        XCTAssertTrue(lsIconSource.contains("case .compass"))
        XCTAssertTrue(lsIconSource.contains("case .chevL"))
        XCTAssertTrue(lsIconSource.contains("case .sparkle"))
        XCTAssertTrue(adapterSource.contains("\"mail\""))
        XCTAssertTrue(adapterSource.contains("\"lock\""))
        XCTAssertTrue(adapterSource.contains("\"eye\""))
        XCTAssertTrue(adapterSource.contains("\"check\""))
    }

    private func sourceFilePath(_ relativePath: String) -> String {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
            .path
    }
}
