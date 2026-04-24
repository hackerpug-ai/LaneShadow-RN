import LaneShadowTheme
import SwiftUI

public struct WeatherConditionResolvedStyle {
    public let backgroundToken: String
    public let foregroundToken: String
    public let borderToken: String
    public let backgroundColor: Color
    public let foregroundColor: Color
    public let borderColor: Color
    public let icon: IconName
}

public enum WeatherCondition: String, CaseIterable, Sendable {
    case sun
    case rain
    case wind
    case storm
    case hot
    case cold

    var resolvedStyle: WeatherConditionResolvedStyle {
        switch self {
        case .sun:
            weatherStyle(
                key: "sun",
                background: LaneShadowTheme.color.weather.clear.tint,
                foreground: LaneShadowTheme.color.weather.clear.default,
                icon: .sun
            )
        case .rain:
            weatherStyle(
                key: "rain",
                background: LaneShadowTheme.color.weather.rain.tint,
                foreground: LaneShadowTheme.color.weather.rain.default,
                icon: .rain
            )
        case .wind:
            weatherStyle(
                key: "wind",
                background: LaneShadowTheme.color.weather.wind.tint,
                foreground: LaneShadowTheme.color.weather.wind.default,
                icon: .wind
            )
        case .storm:
            weatherStyle(
                key: "storm",
                background: LaneShadowTheme.color.weather.storm.tint,
                foreground: LaneShadowTheme.color.weather.storm.default,
                icon: .storm
            )
        case .hot:
            weatherStyle(
                key: "hot",
                background: LaneShadowTheme.color.weather.hot.tint,
                foreground: LaneShadowTheme.color.weather.hot.default,
                icon: .therm
            )
        case .cold:
            weatherStyle(
                key: "cold",
                background: LaneShadowTheme.color.weather.cold.tint,
                foreground: LaneShadowTheme.color.weather.cold.default,
                icon: .therm
            )
        }
    }

    private func weatherStyle(
        key: String,
        background: Color,
        foreground: Color,
        icon: IconName
    ) -> WeatherConditionResolvedStyle {
        WeatherConditionResolvedStyle(
            backgroundToken: "color.weather.\(key).tint",
            foregroundToken: "color.weather.\(key).default",
            borderToken: "color.weather.\(key).default",
            backgroundColor: background,
            foregroundColor: foreground,
            borderColor: foreground,
            icon: icon
        )
    }
}

public struct LSWeatherBadge: View {
    @Environment(\.theme) private var theme

    let condition: WeatherCondition
    let label: String
    let size: PillSize

    public init(
        condition: WeatherCondition,
        label: String,
        size: PillSize = .md
    ) {
        self.condition = condition
        self.label = label
        self.size = size
    }

    public var body: some View {
        let style = condition.resolvedStyle

        LSPill(size: size) {
            HStack(spacing: theme.space.xs) {
                LSIcon(name: style.icon, size: .xs, resolvedColorOverride: style.foregroundColor)
                LSText(label, variant: .label.sm, color: .secondary)
                    .foregroundStyle(style.foregroundColor)
            }
            .padding(.horizontal, theme.space.xs)
            .background(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .fill(style.backgroundColor)
            )
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
            )
        }
    }
}
