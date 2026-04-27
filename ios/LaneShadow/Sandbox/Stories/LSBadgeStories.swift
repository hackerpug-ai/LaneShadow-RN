import LaneShadowTheme
import NativeSandbox
import SwiftUI

// Story IDs:
// atoms.badge.status.info
// atoms.badge.status.success
// atoms.badge.status.warning
// atoms.badge.status.error
// atoms.badge.status.recording
// atoms.badge.weather.clear
// atoms.badge.weather.rain
// atoms.badge.weather.wind
// atoms.badge.weather.storm
// atoms.badge.weather.hot
// atoms.badge.weather.cold
// atoms.best-badge.default

@MainActor
enum LSBadgeStories {
    static let all: [Story] =
        BadgeStatusVariant.allCases.map { statusStory($0) } +
        BadgeWeatherVariant.allCases.map { weatherStory($0) } +
        [
            Story(
                id: "atoms.best-badge.default",
                tier: .atom,
                component: "LSBestBadge",
                name: "Best Badge",
                summary: "BEST FOR TODAY badge with filled star icon."
            ) { _ in
                LSBestBadge()
                    .padding(Theme.shared.space.lg)
            },
        ]

    private static func statusStory(_ status: BadgeStatusVariant) -> Story {
        Story(
            id: "atoms.badge.status.\(status.rawValue)",
            tier: .atom,
            component: "LSBadge",
            name: "Status \(status.rawValue.capitalized)",
            summary: "Status badge for \(status.rawValue)."
        ) { _ in
            LSBadge(
                count: status == .recording ? 3 : nil,
                label: status == .recording ? nil : status.rawValue.uppercased(),
                variant: .status(status)
            )
            .padding(Theme.shared.space.lg)
        }
    }

    private static func weatherStory(_ weather: BadgeWeatherVariant) -> Story {
        let labels: [BadgeWeatherVariant: String] = [
            .clear: "Clear",
            .rain: "Rain 3pm",
            .wind: "18mph NW",
            .storm: "Storm",
            .hot: "92F",
            .cold: "38F",
        ]

        return Story(
            id: "atoms.badge.weather.\(weather.rawValue)",
            tier: .atom,
            component: "LSBadge",
            name: "Weather \(weather.rawValue.capitalized)",
            summary: "Weather badge for \(weather.rawValue)."
        ) { _ in
            LSBadge(
                label: labels[weather],
                variant: .weather(weather)
            )
            .padding(Theme.shared.space.lg)
        }
    }
}
