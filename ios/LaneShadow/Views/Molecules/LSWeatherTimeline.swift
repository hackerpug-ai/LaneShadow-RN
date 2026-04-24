import LaneShadowTheme
import SwiftUI

/// Weather timeline molecule showing per-hour forecast
///
/// Renders horizontal grid of tinted condition cells with hour, icon, and temp.
/// Uses theme weather color tokens for per-condition semantics.
///
/// ## Design Tokens Used
/// - Colors:
///   - Cell bg: `theme.colors.weather.{condition}.tint`
///   - Cell border: `theme.colors.weather.{condition}.default` at 33% alpha
///   - Header title: `theme.colors.content.primary`
///   - Range text: `theme.colors.content.tertiary`
///   - Hour label: `theme.colors.content.secondary`
///   - Temp value: `theme.colors.content.primary`
/// - Typography:
///   - Header title: `theme.typography.label.md`
///   - Range: `theme.typography.label.sm`
///   - Hour: `theme.typography.label.sm`
///   - Temp: `theme.typography.instrument.sm` (tabular mono)
/// - Spacing:
///   - Container padding: `theme.space.md` / `theme.space.lg`
///   - Grid gap: `theme.space.sm`
///   - Cell padding: `theme.space.sm`
///
/// ## Parameters
/// - entries: Array of weather entries with hour, condition, and temp
/// - from: Start time label (e.g., "9 AM")
/// - to: End time label (e.g., "2 PM")
public struct LSWeatherTimeline: View {
    @Environment(\.theme) private var theme

    public typealias Entry = WeatherEntry

    private let entries: [Entry]
    private let from: String
    private let to: String

    public init(
        entries: [Entry],
        from: String,
        to: String
    ) {
        self.entries = entries
        self.from = from
        self.to = to
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            // Header row
            headerSection

            // Cell grid (scrollable for 12h/24h variants)
            cellGrid
        }
        .padding(theme.space.md)
        .background(theme.colors.surface.card)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.lg)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.hairline)
        }
        .shadow(
            color: theme.colors.scrim.opacity(0.1),
            radius: theme.elevation.level2.radius,
            x: theme.elevation.level2.offsetX,
            y: theme.elevation.level2.offsetY
        )
        .accessibilityLabel("Weather along the way, \(from) to \(to)")
    }

    // MARK: - Private Views

    private var headerSection: some View {
        HStack {
            LSText("Weather along the way", variant: .labelMd, color: .primary)

            Spacer()

            LSText("\(from) — \(to)", variant: .labelSm, color: .tertiary)
        }
    }

    private var cellGrid: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: theme.space.sm) {
                ForEach(entries) { entry in
                    weatherCell(for: entry)
                }
            }
            .accessibilityLabel("Weather conditions")
        }
    }

    private func weatherCell(for entry: Entry) -> some View {
        let conditionColors = colors(for: entry.condition)

        return VStack(spacing: theme.space.xs) {
            // Hour label
            LSText(entry.hour, variant: .labelSm, color: .secondary)

            // Weather icon
            LSIcon(
                name: iconName(for: entry.condition),
                size: .md,
                resolvedColorOverride: conditionColors.defaultColor
            )
            .accessibilityHidden(true)

            // Temperature value
            LSText(entry.temp, variant: .instrumentSm, color: .primary)
        }
        .padding(.vertical, theme.space.sm)
        .padding(.horizontal, theme.space.md)
        .background(conditionColors.tint)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.md)
                .stroke(conditionColors.defaultColor.opacity(0.33), lineWidth: theme.borderWidth.thin)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(entry.hour), \(entry.condition.accessibilityName), \(entry.temp)")
    }

    // MARK: - Helper Methods

    private func colors(for condition: WeatherCondition) -> WeatherColors {
        switch condition {
        case .clear:
            WeatherColors(
                defaultColor: LaneShadowTheme.color.weather.clear.default,
                tint: LaneShadowTheme.color.weather.clear.tint
            )
        case .rain:
            WeatherColors(
                defaultColor: LaneShadowTheme.color.weather.rain.default,
                tint: LaneShadowTheme.color.weather.rain.tint
            )
        case .wind:
            WeatherColors(
                defaultColor: LaneShadowTheme.color.weather.wind.default,
                tint: LaneShadowTheme.color.weather.wind.tint
            )
        case .storm:
            WeatherColors(
                defaultColor: LaneShadowTheme.color.weather.storm.default,
                tint: LaneShadowTheme.color.weather.storm.tint
            )
        case .hot:
            WeatherColors(
                defaultColor: LaneShadowTheme.color.weather.hot.default,
                tint: LaneShadowTheme.color.weather.hot.tint
            )
        case .cold:
            WeatherColors(
                defaultColor: LaneShadowTheme.color.weather.cold.default,
                tint: LaneShadowTheme.color.weather.cold.tint
            )
        }
    }

    private func iconName(for condition: WeatherCondition) -> IconName {
        switch condition {
        case .clear:
            .sun
        case .rain:
            .rain
        case .wind:
            .wind
        case .storm:
            .storm
        case .hot:
            .therm
        case .cold:
            .therm
        }
    }
}

// MARK: - Weather Entry Model

/// Weather entry with hour, condition, and temperature
public struct WeatherEntry: Identifiable, Equatable {
    public let id = UUID()
    public let hour: String
    public let condition: WeatherCondition
    public let temp: String

    public init(
        hour: String,
        condition: WeatherCondition,
        temp: String
    ) {
        self.hour = hour
        self.condition = condition
        self.temp = temp
    }
}

/// Weather condition types
public enum WeatherCondition: Equatable, Sendable {
    case clear
    case rain
    case wind
    case storm
    case hot
    case cold
}

// MARK: - Supporting Types

private struct WeatherColors {
    let defaultColor: Color
    let tint: Color
}

private extension WeatherCondition {
    var accessibilityName: String {
        switch self {
        case .clear:
            "clear"
        case .rain:
            "rain"
        case .wind:
            "windy"
        case .storm:
            "storm"
        case .hot:
            "hot"
        case .cold:
            "cold"
        }
    }
}

// MARK: - Preview

#Preview("Weather Timeline - 6 Hours") {
    LSWeatherTimeline(
        entries: [
            WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
            WeatherEntry(hour: "10 AM", condition: .clear, temp: "70°"),
            WeatherEntry(hour: "11 AM", condition: .rain, temp: "65°"),
            WeatherEntry(hour: "12 PM", condition: .rain, temp: "63°"),
            WeatherEntry(hour: "1 PM", condition: .wind, temp: "64°"),
            WeatherEntry(hour: "2 PM", condition: .clear, temp: "67°"),
        ],
        from: "9 AM",
        to: "2 PM"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Weather Timeline - Mixed Weather") {
    LSWeatherTimeline(
        entries: [
            WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
            WeatherEntry(hour: "10 AM", condition: .rain, temp: "65°"),
            WeatherEntry(hour: "11 AM", condition: .wind, temp: "63°"),
            WeatherEntry(hour: "12 PM", condition: .storm, temp: "60°"),
            WeatherEntry(hour: "1 PM", condition: .hot, temp: "75°"),
            WeatherEntry(hour: "2 PM", condition: .cold, temp: "55°"),
        ],
        from: "9 AM",
        to: "2 PM"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Weather Timeline - All Clear") {
    LSWeatherTimeline(
        entries: [
            WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
            WeatherEntry(hour: "10 AM", condition: .clear, temp: "70°"),
            WeatherEntry(hour: "11 AM", condition: .clear, temp: "72°"),
            WeatherEntry(hour: "12 PM", condition: .clear, temp: "74°"),
            WeatherEntry(hour: "1 PM", condition: .clear, temp: "75°"),
            WeatherEntry(hour: "2 PM", condition: .clear, temp: "73°"),
        ],
        from: "9 AM",
        to: "2 PM"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Dark Theme") {
    LSWeatherTimeline(
        entries: [
            WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
            WeatherEntry(hour: "10 AM", condition: .rain, temp: "65°"),
            WeatherEntry(hour: "11 AM", condition: .wind, temp: "63°"),
            WeatherEntry(hour: "12 PM", condition: .storm, temp: "60°"),
            WeatherEntry(hour: "1 PM", condition: .hot, temp: "75°"),
            WeatherEntry(hour: "2 PM", condition: .cold, temp: "55°"),
        ],
        from: "9 AM",
        to: "2 PM"
    )
    .laneShadowTheme()
    .padding()
    .preferredColorScheme(.dark)
}
