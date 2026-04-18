import XCTest
import SwiftUI
@testable import LaneShadowTheme

final class ThemeTests: XCTestCase {
    func testSharedThemeExposesAllTokenCategories() {
        let theme = Theme.shared
        XCTAssertNotNil(theme.colors.primary.default)
        XCTAssertNotNil(theme.colors.surface.default)
        XCTAssertEqual(theme.space.md, 12)
        XCTAssertEqual(theme.radius.md, 8)
        XCTAssertEqual(theme.type.body.md.fontSize, 16)
        XCTAssertNotNil(theme.elevation.level1)
        XCTAssertNotNil(theme.domain.waypointOnRoute.default)
    }

    func testColorSetExposesStateVariants() {
        let primary = Theme.shared.colors.primary
        XCTAssertNotNil(primary.default)
        XCTAssertNotNil(primary.hover)
        XCTAssertNotNil(primary.pressed)
        XCTAssertNotNil(primary.disabled)
    }

    func testEnvironmentDefaultIsSharedTheme() {
        var env = EnvironmentValues()
        XCTAssertEqual(env.theme.space.md, Theme.shared.space.md)
        env.theme = Theme.shared
        XCTAssertEqual(env.theme.space.lg, 16)
    }
}
