import SwiftUI
import XCTest
@testable import LaneShadowTheme

final class ThemeTests: XCTestCase {
    func testSharedThemeExposesAllTokenCategories() {
        let theme = Theme.shared
        XCTAssertNotNil(theme.colors.primary.default)
        XCTAssertNotNil(theme.colors.surface.default)
        XCTAssertEqual(theme.space.md, 12)
        XCTAssertEqual(theme.radius.md, 10)
        XCTAssertEqual(theme.type.body.md.fontSize, 12)
        XCTAssertNotNil(theme.elevation.level1)
        XCTAssertNotNil(theme.domain.waypointOnRoute.default)
    }

    func testColorSetExposesStateVariants() {
        let accent = Theme.shared.colors.accent
        XCTAssertNotNil(accent.default)
        XCTAssertNotNil(accent.hover)
        XCTAssertNotNil(accent.pressed)
        XCTAssertNil(accent.disabled)
    }

    func testGeneratedIconCatalogExposesPathSpecs() {
        XCTAssertEqual(IconName.allCases.count, 31)

        let specs = IconCatalog.pathSpecs(for: .bike)
        XCTAssertFalse(specs.isEmpty)
        XCTAssertTrue(specs.allSatisfy { !$0.pathData.isEmpty })
        XCTAssertTrue(specs.contains { $0.stroke })
    }

    func testEnvironmentDefaultIsSharedTheme() {
        var env = EnvironmentValues()
        XCTAssertEqual(env.theme.space.md, Theme.shared.space.md)
        env.theme = Theme.shared
        XCTAssertEqual(env.theme.space.lg, 16)
    }
}
