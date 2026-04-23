import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSDividerTests: XCTestCase {
    func test_divider_renders_1pt_color_border_subtle() throws {
        let theme = Theme.shared
        let divider = LSDivider()

        XCTAssertNotNil(divider)
        XCTAssertEqual(LSDivider.thickness(in: theme), 1)
        XCTAssertEqual(LSDivider.ruleFill(in: theme), theme.colors.divider.default)

        let source = try sourceFileContents()
        XCTAssertTrue(source.contains(".frame(maxWidth: .infinity)"))
    }

    private func sourceFileContents() throws -> String {
        let testsURL = URL(fileURLWithPath: #filePath)
        let sourceURL = testsURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/Views/Atoms/LSDivider.swift")
        return try String(contentsOf: sourceURL, encoding: .utf8)
    }
}
