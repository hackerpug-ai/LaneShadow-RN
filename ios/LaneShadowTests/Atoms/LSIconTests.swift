import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSIconTests: XCTestCase {
    func test_compass_md_resolves_size_and_stroke_tokens() {
        let theme = Theme.shared
        let icon = LSIcon(name: .compass, size: .md)

        XCTAssertNotNil(icon)
        XCTAssertEqual(LSIcon.resolvedSize(.md, in: theme), theme.iconSize.medium)
        XCTAssertEqual(LSIcon.strokeWidth(in: theme), theme.strokeWidth.normal)
        XCTAssertNotNil(LSIcon.resolvedColor(.primary, in: theme))
    }

    func test_color_signal_resolves_token() {
        let theme = Theme.shared
        let icon = LSIcon(name: .star, size: .sm, color: .signal)

        XCTAssertNotNil(icon)
        XCTAssertEqual(LSIcon.resolvedColor(.signal, in: theme), theme.colors.primary.default)
    }

    func test_all_canonical_icons_render_without_crash() {
        XCTAssertEqual(IconName.canonicalCases.count, 31)

        for name in IconName.canonicalCases {
            let icon = LSIcon(name: name, size: .md)
            XCTAssertNotNil(icon)
            XCTAssertTrue(LSIcon.hasDrawable(for: name), "\(name.rawValue) should have a drawable")
        }
    }
}
