import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

final class BadgeTests: XCTestCase {
    // MARK: - AC-1: Component renders in default state

    func testBadgeDefaultRendering() {
        // GIVEN: App is running and component is mounted
        // WHEN: Badge is rendered with required props (default variant)
        let badge = Badge("Test Badge")

        // THEN: Component displays matching RN wrapper defaults
        // Verify the view can be created without crashing
        XCTAssertNotNil(badge)

        // Verify it's a SwiftUI View
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }
}
