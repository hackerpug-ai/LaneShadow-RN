import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSTextTests: XCTestCase {
    func test_display_lg_resolves_token() {
        let variant = TypographyVariant.display.lg
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.display.lg

        XCTAssertEqual(variant.category, .display)
        XCTAssertEqual(variant.tokenPath, "type.display.lg")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_body_md_resolves_token() {
        let variant = TypographyVariant.body.md
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.body.md

        XCTAssertEqual(variant.category, .body)
        XCTAssertEqual(variant.tokenPath, "type.body.md")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_label_sm_resolves_token() {
        let variant = TypographyVariant.label.sm
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.label.sm

        XCTAssertEqual(variant.category, .label)
        XCTAssertEqual(variant.tokenPath, "type.label.sm")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_dynamic_type_scaling_propagates() throws {
        let source = try atomsSource(named: "LSText.swift")

        XCTAssertTrue(source.contains("variant.style(in: theme)"))
        XCTAssertTrue(source.contains(".lineSpacing(max(0, style.lineHeight - style.fontSize))"))
    }

    func test_content_color_secondary_resolves_token() {
        let theme = Theme.shared

        XCTAssertEqual(ContentColor.secondary.resolved(in: theme), theme.colors.onSecondary.default)
    }

    private func atomsSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Atoms")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }
}
