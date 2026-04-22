import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSTextTests: XCTestCase {
    func test_opinion_xl_resolves_newsreader_token() {
        let variant = TypographyVariant.opinion.xl
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.display.lg

        XCTAssertEqual(variant.family, .opinion)
        XCTAssertEqual(variant.tokenPath, "typography.opinion.xl")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_ui_body_md_resolves_geist_token() {
        let variant = TypographyVariant.ui.body.md
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.body.md

        XCTAssertEqual(variant.family, .ui)
        XCTAssertEqual(variant.tokenPath, "typography.ui.body.md")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_instrument_lg_resolves_mono_token() {
        let variant = TypographyVariant.instrument.lg
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.body.lg

        XCTAssertEqual(variant.family, .instrument)
        XCTAssertEqual(variant.tokenPath, "typography.instrument.lg")
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
