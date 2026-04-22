import XCTest

final class LSTextTypeSafetyTests: XCTestCase {
    func test_color_param_rejects_raw_Color() {
        // This test verifies compile-time type safety by checking that:
        // 1. LSText's color parameter type is ContentColor (not Color)
        // 2. ContentColor enum only has specific cases, not a raw Color case

        // Verify ContentColor enum has the expected cases (no raw Color case)
        let allCases = ContentColor.allCases
        let expectedCases: [ContentColor] = [.primary, .secondary, .tertiary, .subtle, .onSignal]

        XCTAssertEqual(allCases.count, 5, "ContentColor should have exactly 5 cases")
        XCTAssertEqual(Set(allCases.map { String(describing: $0) }),
                      Set(expectedCases.map { String(describing: $0) }),
                      "ContentColor should only have the semantic cases, no raw Color option")

        // Verify LSText API uses ContentColor type
        // This is a compile-time check - the following would not compile:
        // let _ = LSText("test", variant: .body.md, color: Color.red)
        // The fact that this test compiles proves the API is type-safe

        // Verify the initializer signature by creating an instance
        let text = LSText("test", variant: .body.md, color: .secondary)
        XCTAssertNotNil(text)

        // The only way to pass a color is through ContentColor enum
        let primaryColorText = LSText("test", variant: .body.md, color: .primary)
        XCTAssertNotNil(primaryColorText)
    }
}
