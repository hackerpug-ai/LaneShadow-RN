import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class LSBadgeTests: XCTestCase {
    func test_status_recording_resolves_tokens() {
        let theme = Theme.shared
        let badge = LSBadge(label: "REC", variant: .status(.recording))
        let style = BadgeVariant.status(.recording).resolvedStyle(in: theme)

        XCTAssertNotNil(badge)
        XCTAssertEqual(style.backgroundToken, "color.status.recording.tint")
        XCTAssertEqual(style.foregroundToken, "color.status.recording.default")
        XCTAssertEqual(style.foregroundColor, theme.colors.danger.default)
        XCTAssertNil(style.borderColor)
        XCTAssertNil(style.leadingIcon)
        XCTAssertEqual(style.pillHeight(in: theme), PillSize.sm.height(in: theme))
    }

    func test_status_variants_resolve_color_tokens() {
        let theme = Theme.shared
        let variants: [(BadgeVariant, String, Color)] = [
            (.status(.info), "info", theme.colors.info.default),
            (.status(.success), "success", theme.colors.success.default),
            (.status(.warning), "warning", theme.colors.warning.default),
            (.status(.error), "error", theme.colors.danger.default),
        ]

        for (variant, name, expectedForeground) in variants {
            let style = variant.resolvedStyle(in: theme)
            XCTAssertEqual(style.backgroundToken, "color.status.\(name).tint")
            XCTAssertEqual(style.foregroundToken, "color.status.\(name).default")
            XCTAssertEqual(style.foregroundColor, expectedForeground)
            XCTAssertNil(style.leadingIcon)
        }
    }

    func test_weather_rain_resolves_tokens_and_icon() {
        let theme = Theme.shared
        let badge = LSBadge(label: "RAIN", variant: .weather(.rain))
        let style = BadgeVariant.weather(.rain).resolvedStyle(in: theme)

        XCTAssertNotNil(badge)
        XCTAssertEqual(style.backgroundToken, "color.weather.rain.tint")
        XCTAssertEqual(style.foregroundToken, "color.weather.rain.default")
        XCTAssertEqual(style.borderToken, "color.weather.rain.default")
        XCTAssertEqual(style.borderColor, style.foregroundColor)
        XCTAssertEqual(style.borderOpacity, LSBadge.weatherBorderOpacity(in: theme))
        XCTAssertEqual(style.leadingIcon, .rain)
        XCTAssertEqual(style.iconSize, .xs)
    }

    func test_weather_wind_resolves_tokens_and_icon() {
        let theme = Theme.shared
        let badge = LSBadge(label: "WIND", variant: .weather(.wind))
        let style = BadgeVariant.weather(.wind).resolvedStyle(in: theme)

        XCTAssertNotNil(badge)
        XCTAssertEqual(style.backgroundToken, "color.weather.wind.tint")
        XCTAssertEqual(style.foregroundToken, "color.weather.wind.default")
        XCTAssertEqual(style.borderToken, "color.weather.wind.default")
        XCTAssertEqual(style.borderColor, style.foregroundColor)
        XCTAssertEqual(style.leadingIcon, .wind)
        XCTAssertEqual(style.iconSize, .xs)
    }
}
