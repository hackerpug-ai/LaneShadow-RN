import XCTest

final class LSTextTypeSafetyTests: XCTestCase {
    func test_color_param_rejects_raw_Color() throws {
        let source = try atomsSource(named: "LSText.swift")

        XCTAssertTrue(source.contains("color: ContentColor = .primary"))
        XCTAssertFalse(source.contains("color: Color"))
        XCTAssertFalse(source.contains("private let color: Color"))
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
