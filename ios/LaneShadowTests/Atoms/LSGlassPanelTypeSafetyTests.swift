import XCTest
@testable import LaneShadow

final class LSGlassPanelTypeSafetyTests: XCTestCase {
    func test_accent_param_rejects_raw_Color() throws {
        let accentCases = AccentColor.allCases

        XCTAssertEqual(Set(accentCases.map(\.self)), Set([.signal, .warning]))

        let source = try sourceFileContents()
        XCTAssertTrue(source.contains("case callout(accent: AccentColor)"))
        XCTAssertFalse(source.contains("callout(accent: Color"))
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
