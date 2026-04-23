import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum BadgeStatusVariant: String, CaseIterable, Hashable, Sendable {
    case info
    case success
    case warning
    case error
    case recording
}

public enum BadgeWeatherVariant: String, CaseIterable, Hashable, Sendable {
    case clear
    case rain
    case wind
    case storm
    case hot
    case cold
}

public enum BadgeVariant: Hashable, Sendable {
    case status(BadgeStatusVariant)
    case weather(BadgeWeatherVariant)

    func resolvedStyle(in theme: Theme) -> LSBadgeResolvedStyle {
        switch self {
        case let .status(status):
            status.resolvedStyle(in: theme)
        case let .weather(weather):
            weather.resolvedStyle(in: theme)
        }
    }
}

private extension BadgeStatusVariant {
    func resolvedStyle(in theme: Theme) -> LSBadgeResolvedStyle {
        switch self {
        case .info:
            LSBadgeResolvedStyle(
                backgroundToken: "color.status.info.tint",
                foregroundToken: "color.status.info.default",
                borderToken: nil,
                backgroundColor: badgeColor("#DBEAFE"),
                foregroundColor: theme.colors.info.default,
                borderColor: nil,
                borderOpacity: 0,
                leadingIcon: nil,
                iconSize: .xs
            )
        case .success:
            LSBadgeResolvedStyle(
                backgroundToken: "color.status.success.tint",
                foregroundToken: "color.status.success.default",
                borderToken: nil,
                backgroundColor: badgeColor("#DCFCE7"),
                foregroundColor: theme.colors.success.default,
                borderColor: nil,
                borderOpacity: 0,
                leadingIcon: nil,
                iconSize: .xs
            )
        case .warning:
            LSBadgeResolvedStyle(
                backgroundToken: "color.status.warning.tint",
                foregroundToken: "color.status.warning.default",
                borderToken: nil,
                backgroundColor: badgeColor("#FEF3C7"),
                foregroundColor: theme.colors.warning.default,
                borderColor: nil,
                borderOpacity: 0,
                leadingIcon: nil,
                iconSize: .xs
            )
        case .error:
            LSBadgeResolvedStyle(
                backgroundToken: "color.status.error.tint",
                foregroundToken: "color.status.error.default",
                borderToken: nil,
                backgroundColor: badgeColor("#FEE2E2"),
                foregroundColor: theme.colors.danger.default,
                borderColor: nil,
                borderOpacity: 0,
                leadingIcon: nil,
                iconSize: .xs
            )
        case .recording:
            LSBadgeResolvedStyle(
                backgroundToken: "color.status.recording.tint",
                foregroundToken: "color.status.recording.default",
                borderToken: nil,
                backgroundColor: badgeColor("#FEE2E2"),
                foregroundColor: theme.colors.danger.default,
                borderColor: nil,
                borderOpacity: 0,
                leadingIcon: nil,
                iconSize: .xs
            )
        }
    }
}

extension BadgeWeatherVariant {
    fileprivate func resolvedStyle(in theme: Theme) -> LSBadgeResolvedStyle {
        switch self {
        case .clear:
            weatherStyle(
                backgroundToken: "color.weather.clear.tint",
                foregroundToken: "color.weather.clear.default",
                borderToken: "color.weather.clear.default",
                backgroundColor: badgeColor("#FBEFCF"),
                foregroundColor: badgeColor("#E6A52A"),
                leadingIcon: .sun,
                theme: theme
            )
        case .rain:
            weatherStyle(
                backgroundToken: "color.weather.rain.tint",
                foregroundToken: "color.weather.rain.default",
                borderToken: "color.weather.rain.default",
                backgroundColor: badgeColor("#DBEAF4"),
                foregroundColor: badgeColor("#4A86BE"),
                leadingIcon: .rain,
                theme: theme
            )
        case .wind:
            weatherStyle(
                backgroundToken: "color.weather.wind.tint",
                foregroundToken: "color.weather.wind.default",
                borderToken: "color.weather.wind.default",
                backgroundColor: badgeColor("#E1E6EC"),
                foregroundColor: badgeColor("#6B7B8F"),
                leadingIcon: .wind,
                theme: theme
            )
        case .storm:
            weatherStyle(
                backgroundToken: "color.weather.storm.tint",
                foregroundToken: "color.weather.storm.default",
                borderToken: "color.weather.storm.default",
                backgroundColor: badgeColor("#E3DCF2"),
                foregroundColor: badgeColor("#5E3FAE"),
                leadingIcon: .storm,
                theme: theme
            )
        case .hot:
            weatherStyle(
                backgroundToken: "color.weather.hot.tint",
                foregroundToken: "color.weather.hot.default",
                borderToken: "color.weather.hot.default",
                backgroundColor: badgeColor("#F5D8D6"),
                foregroundColor: badgeColor("#C9423C"),
                leadingIcon: .therm,
                theme: theme
            )
        case .cold:
            weatherStyle(
                backgroundToken: "color.weather.cold.tint",
                foregroundToken: "color.weather.cold.default",
                borderToken: "color.weather.cold.default",
                backgroundColor: badgeColor("#D6E5F7"),
                foregroundColor: badgeColor("#3A8BE3"),
                leadingIcon: .wind,
                theme: theme
            )
        }
    }

    private func weatherStyle(
        backgroundToken: String,
        foregroundToken: String,
        borderToken: String,
        backgroundColor: Color,
        foregroundColor: Color,
        leadingIcon: IconName,
        theme: Theme
    ) -> LSBadgeResolvedStyle {
        LSBadgeResolvedStyle(
            backgroundToken: backgroundToken,
            foregroundToken: foregroundToken,
            borderToken: borderToken,
            backgroundColor: backgroundColor,
            foregroundColor: foregroundColor,
            borderColor: foregroundColor,
            borderOpacity: LSBadge.weatherBorderOpacity(in: theme),
            leadingIcon: leadingIcon,
            iconSize: .xs
        )
    }
}

private func badgeColor(_ hex: String) -> Color {
    dyn(parseColorString(hex), parseColorString(hex))
}
