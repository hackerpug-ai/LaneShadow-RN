import LaneShadowTheme
import NativeTheme
import SwiftUI

/// Route sheet organism showing route details with instrument readout and weather timeline
///
/// Composes from LSBestBadge, LSInstrumentReadout, LSWeatherTimeline, and LSButton.
/// Presented via LSBottomSheet with .large detent.
public struct LSRouteSheet: View {
    @Environment(\.theme) private var theme

    public typealias Route = RouteDetails

    private let route: Route
    private let weatherTimeline: [WeatherEntry]
    private let timeRange: (String, String)
    private let onSave: () -> Void
    private let onRide: () -> Void
    private let onDismiss: () -> Void

    public init(
        route: Route,
        weatherTimeline: [WeatherEntry],
        timeRange: (String, String),
        onSave: @escaping () -> Void,
        onRide: @escaping () -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.route = route
        self.weatherTimeline = weatherTimeline
        self.timeRange = timeRange
        self.onSave = onSave
        self.onRide = onRide
        self.onDismiss = onDismiss
    }

    public var body: some View {
        VStack(spacing: 0) {
            // Scrollable content
            ScrollView {
                VStack(spacing: theme.space.md) {
                    headerSection
                    instrumentSection
                    weatherSection
                }
                .padding(.horizontal, theme.space.md)
                .padding(.top, theme.space.sm)
            }

            // Sticky action row
            actionRow
        }
        .background(LaneShadowTheme.color.surface.card)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Route details")
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            // Best badge (if applicable)
            if route.isBest {
                LSBestBadge()
            }

            // Title
            LSText(route.title, variant: .opinion.lg, color: .primary)
                .lineLimit(2)

            // Subtitle
            LSText(route.subtitle, variant: .body.md, color: .secondary)
                .lineLimit(2)
        }
    }

    // MARK: - Instrument Section

    private var instrumentSection: some View {
        LSInstrumentReadout(metrics: [
            .dist(route.distance),
            .time(route.time),
            .climb(route.climb),
            .scenic(route.scenic),
        ])
    }

    // MARK: - Weather Section

    private var weatherSection: some View {
        LSWeatherTimeline(
            entries: weatherTimeline,
            from: timeRange.0,
            to: timeRange.1
        )
    }

    // MARK: - Action Row

    private var actionRow: some View {
        HStack(spacing: theme.space.sm) {
            // Save button (flex 1)
            LSButton(
                "Save",
                variant: .outline,
                size: .md,
                leadingIcon: .bookmark,
                action: onSave
            )
            .frame(maxWidth: .infinity)

            // Ride this button (flex 2)
            LSButton(
                "Ride this",
                variant: .primary,
                size: .md,
                trailingIcon: .chevR,
                action: onRide
            )
            .frame(maxWidth: .infinity)
        }
        .padding(theme.space.md)
        .background(LaneShadowTheme.color.surface.card)
    }
}

// MARK: - Route Details Model

public struct RouteDetails: Equatable, Sendable {
    public let id: String
    public let title: String
    public let subtitle: String
    public let isBest: Bool
    public let distance: String
    public let time: String
    public let climb: String
    public let scenic: String

    public init(
        id: String,
        title: String,
        subtitle: String,
        isBest: Bool,
        distance: String,
        time: String,
        climb: String,
        scenic: String
    ) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.isBest = isBest
        self.distance = distance
        self.time = time
        self.climb = climb
        self.scenic = scenic
    }
}

// MARK: - Preview

#Preview("Best Route") {
    LSRouteSheet(
        route: RouteDetails(
            id: "route-1",
            title: "The Skyline Spine",
            subtitle: "via Kings Mountain Rd · Kings Mountain to Woodside",
            isBest: true,
            distance: "47",
            time: "1:22",
            climb: "3.2k",
            scenic: "4.8"
        ),
        weatherTimeline: [
            WeatherEntry(hour: "9A", condition: .clear, temp: "62°"),
            WeatherEntry(hour: "10A", condition: .clear, temp: "65°"),
            WeatherEntry(hour: "11A", condition: .clear, temp: "67°"),
            WeatherEntry(hour: "12P", condition: .wind, temp: "68°"),
            WeatherEntry(hour: "1P", condition: .wind, temp: "66°"),
            WeatherEntry(hour: "2P", condition: .clear, temp: "64°"),
        ],
        timeRange: ("9am", "3pm"),
        onSave: {},
        onRide: {},
        onDismiss: {}
    )
    .laneShadowTheme()
}

#Preview("Alt Route") {
    LSRouteSheet(
        route: RouteDetails(
            id: "route-2",
            title: "Old La Honda Road",
            subtitle: "via Page Mill Rd · Palo Alto to Woodside",
            isBest: false,
            distance: "38",
            time: "1:05",
            climb: "2.1k",
            scenic: "3.6"
        ),
        weatherTimeline: [
            WeatherEntry(hour: "9A", condition: .clear, temp: "61°"),
            WeatherEntry(hour: "10A", condition: .clear, temp: "64°"),
            WeatherEntry(hour: "11A", condition: .clear, temp: "66°"),
            WeatherEntry(hour: "12P", condition: .clear, temp: "67°"),
            WeatherEntry(hour: "1P", condition: .clear, temp: "65°"),
            WeatherEntry(hour: "2P", condition: .clear, temp: "63°"),
        ],
        timeRange: ("9am", "2pm"),
        onSave: {},
        onRide: {},
        onDismiss: {}
    )
    .laneShadowTheme()
}

#Preview("Dark Mode") {
    LSRouteSheet(
        route: RouteDetails(
            id: "route-1",
            title: "The Skyline Spine",
            subtitle: "via Kings Mountain Rd",
            isBest: true,
            distance: "47",
            time: "1:22",
            climb: "3.2k",
            scenic: "4.8"
        ),
        weatherTimeline: [],
        timeRange: ("9am", "3pm"),
        onSave: {},
        onRide: {},
        onDismiss: {}
    )
    .laneShadowTheme()
    .preferredColorScheme(.dark)
}
