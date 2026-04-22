import XCTest

final class LSTextTypeSafetyTests: XCTestCase {
    func test_lstext_color_param_uses_content_color_enum() {
        // AC-6: Verify LSText initializer uses ContentColor enum type (not raw Color)
        // Swift's type system enforces compile-time safety — passing Color.red will fail to compile

        // Verify ContentColor enum has the expected cases
        let allCases = ContentColor.allCases
        let expectedCases: [ContentColor] = [.primary, .secondary, .tertiary, .subtle, .onSignal]

        XCTAssertEqual(allCases.count, 5, "ContentColor should have exactly 5 semantic cases")
        XCTAssertEqual(Set(allCases.map { String(describing: $0) }),
                       Set(expectedCases.map { String(describing: $0) }),
                       "ContentColor should only have semantic color cases, no raw Color option")

        // Verify LSText API accepts ContentColor by creating instances
        let secondaryText = LSText("test", variant: .body.md, color: .secondary)
        XCTAssertNotNil(secondaryText)

        let primaryText = LSText("test", variant: .body.md, color: .primary)
        XCTAssertNotNil(primaryText)

        // Note: The following would NOT compile — enforced by Swift's type system:
        // let invalid = LSText("test", variant: .body.md, color: Color.red)
        // This is compile-time safety and cannot be verified in runtime tests
    }
}
