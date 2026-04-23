import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSGlassPanelTests: XCTestCase {
    func test_glasspanel_chrome_uses_ultrathinmaterial_backdrop() throws {
        let theme = Theme.shared

        XCTAssertEqual(LSGlassPanel<LSText>.surfaceTokenPath, "color.surface.glass")
        XCTAssertEqual(LSGlassPanel<LSText>.cornerRadius(in: theme), theme.radius.xl)
        XCTAssertEqual(LSGlassPanel<LSText>.elevation(in: theme).radius, theme.elevation.level8.radius)
        XCTAssertEqual(LSGlassPanel<LSText>.elevation(in: theme).offsetY, theme.elevation.level8.offsetY)
        XCTAssertEqual(LSGlassPanel<LSText>.resolvedPadding(.spacing4, in: theme), theme.space.lg)
        XCTAssertEqual(LSGlassPanel<LSText>.backdropMaterialName, "ultraThinMaterial")
        XCTAssertTrue(try sourceFileContents().contains(".background(.ultraThinMaterial"))
    }

    func test_glasspanel_callout_signal_adds_3pt_stripe_signal_default() throws {
        let theme = Theme.shared

        XCTAssertEqual(LSGlassPanel<LSText>.stripeWidth(in: theme), 3)
        XCTAssertEqual(AccentColor.signal.tokenPath, "color.signal.default")
        XCTAssertTrue(try sourceFileContents().contains("Rectangle()"))
        XCTAssertNotNil(
            LSGlassPanel(variant: .callout(accent: .signal)) {
                LSText("Note", variant: .body.md)
            }
        )
    }

    func test_glasspanel_callout_warning_adds_3pt_stripe_status_warning_default() throws {
        let theme = Theme.shared

        XCTAssertEqual(LSGlassPanel<LSText>.stripeWidth(in: theme), 3)
        XCTAssertEqual(AccentColor.warning.tokenPath, "color.status.warning.default")
        XCTAssertTrue(try sourceFileContents().contains("fill(accent.resolved(in: theme))"))
        XCTAssertNotNil(
            LSGlassPanel(variant: .callout(accent: .warning)) {
                LSText("Heads up", variant: .body.md)
            }
        )
    }

    private func sourceFileContents() throws -> String {
        let testsURL = URL(fileURLWithPath: #filePath)
        let sourceURL = testsURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/Views/Atoms/LSGlassPanel.swift")
        return try String(contentsOf: sourceURL, encoding: .utf8)
    }
}
