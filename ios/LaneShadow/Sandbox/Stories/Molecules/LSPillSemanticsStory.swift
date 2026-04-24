import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSPillSemanticsStory {
    static let all: [Story] = [
        Story(
            id: "molecules.pillSemantics.tagPill.default",
            tier: .molecule,
            component: "Pill Semantics",
            name: "TagPill Default",
            summary: "LSTagPill with glass surface, pin icon, and label."
        ) { _ in
            LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")
                .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.pillSemantics.filterChip.unselected",
            tier: .molecule,
            component: "Pill Semantics",
            name: "FilterChip Unselected",
            summary: "LSFilterChip with unselected card/border semantics."
        ) { _ in
            LSFilterChip(label: "Scenic", selected: false, onToggle: {})
                .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.pillSemantics.filterChip.selected",
            tier: .molecule,
            component: "Pill Semantics",
            name: "FilterChip Selected",
            summary: "LSFilterChip with selected signal semantics."
        ) { _ in
            LSFilterChip(label: "Scenic", selected: true, onToggle: {})
                .padding(Theme.shared.space.lg)
        },

        Story(
            id: "molecules.pillSemantics.suggestionChip.default",
            tier: .molecule,
            component: "Pill Semantics",
            name: "SuggestionChip Default",
            summary: "LSSuggestionChip card semantic with single-tap action."
        ) { _ in
            LSSuggestionChip(label: "Twisty back roads", onTap: {})
                .padding(Theme.shared.space.lg)
        },
    ] + [
        weatherStory(id: "molecules.pillSemantics.weatherBadge.sun.sm", condition: .sun, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.sun.md", condition: .sun, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.rain.sm", condition: .rain, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.rain.md", condition: .rain, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.wind.sm", condition: .wind, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.wind.md", condition: .wind, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.storm.sm", condition: .storm, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.storm.md", condition: .storm, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.hot.sm", condition: .hot, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.hot.md", condition: .hot, size: .md),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.cold.sm", condition: .cold, size: .sm),
        weatherStory(id: "molecules.pillSemantics.weatherBadge.cold.md", condition: .cold, size: .md),
    ]

    private static func weatherStory(
        id: String,
        condition: WeatherCondition,
        size: PillSize
    ) -> Story {
        Story(
            id: id,
            tier: .molecule,
            component: "Pill Semantics",
            name: "WeatherBadge \(condition.storyLabel) \(size.storyLabel)",
            summary: "LSWeatherBadge weather semantic for \(condition.storyLabel) at \(size.storyLabel)."
        ) { _ in
            LSWeatherBadge(condition: condition, label: condition.defaultLabel, size: size)
                .padding(Theme.shared.space.lg)
        }
    }
}

private extension PillSize {
    var storyLabel: String {
        switch self {
        case .sm:
            "SM"
        case .md:
            "MD"
        case .lg:
            "LG"
        }
    }
}

private extension WeatherCondition {
    var storyLabel: String {
        rawValue.capitalized
    }

    var defaultLabel: String {
        switch self {
        case .sun:
            "Clear"
        case .rain:
            "Rain 3pm"
        case .wind:
            "18mph NW"
        case .storm:
            "Storm"
        case .hot:
            "92F"
        case .cold:
            "38F"
        }
    }
}
