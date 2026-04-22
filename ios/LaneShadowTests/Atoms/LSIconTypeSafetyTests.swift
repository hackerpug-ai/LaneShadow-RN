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
}
