import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class LSIconTypeSafetyTests: XCTestCase {
    func test_color_param_rejects_raw_Color() {
        let expectedCases: [IconContentColor] = [.primary, .secondary, .tertiary, .subtle, .onSignal, .signal]
        XCTAssertEqual(IconContentColor.allCases, expectedCases)
        XCTAssertNotNil(LSIcon(name: .star, size: .sm, color: .signal))
    }

    func test_authscreen_glyphs_render_via_ios_symbol_adapter() {
        let view = HStack(spacing: Theme.shared.space.sm) {
            LSIconSymbolIOS(name: "mail", testID: "mail")
            LSIconSymbolIOS(name: "lock", testID: "lock")
            LSIconSymbolIOS(name: "eye", testID: "eye")
            LSIconSymbolIOS(name: "check", testID: "check")
        }
        .padding(Theme.shared.space.lg)
        .laneShadowTheme()

        assertSnapshot(matching: view, as: .image(precision: 0.95, traits: .init(userInterfaceStyle: .light)))
    }
}
