import LaneShadowTheme
import SwiftUI

// MARK: - Route Attachment Card Component

/**
 * Route attachment card molecule component
 *
 * Compact route card for chat transcript display.
 * Following React Native component from react-native/components/ui/route-attachment-card.tsx
 *
 * ## Design Principles
 * - Horizontal layout maximizes space efficiency
 * - Single row prevents overlap issues with chat content
 * - Iconography reduces redundancy
 * - Progressive disclosure: summary by default, details on press
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.card.default`
 *   - Border: `theme.colors.border.default`
 *   - Text: `theme.colors.onSurface.default`, `theme.colors.onSurface.subtle`, `theme.colors.onSurface.muted`
 *   - Primary: `theme.colors.primary.default` (best badge, scenic score)
 *   - Danger: `theme.colors.danger.default` (rain weather)
 *   - Warning: `theme.colors.warning.default` (wind weather)
 * - Layout:
 *   - Padding: `theme.space.md` (container)
 *   - Gap: `theme.space.sm` (between items)
 *   - Border width: `theme.borderWidth.thin` (hairline)
 * - Typography:
 *   - Label: `theme.type.label.md` (14pt semibold)
 *   - Stats: `theme.type.body.xs` (12pt medium)
 * - Radius:
 *   - Card: `theme.radius.md`
 *   - Badge: `theme.radius.sm`
 *
 * ## Behavior
 * - Horizontal row with best badge, label, stats (distance, duration, weather), scenic score
 * - Press state changes opacity to 0.8
 * - Weather badge shows icon + text with type-based coloring
 * - "Best" badge shows star icon when isBest=true
 * - Scenic score shows leaf icon + value
 *
 * ## Parameters
 * - route: LSRouteAttachment model with all route data
 * - onRoutePress: Callback when card is pressed (optional)
 * - testID: Test identifier for UI testing
 */
public struct LSRouteAttachmentCard: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let route: LSRouteAttachment
    private let onRoutePress: ((String) -> Void)?
    private let testID: String

    // MARK: - Initialization

    /// Creates a RouteAttachmentCard with the given route
    /// - Parameters:
    ///   - route: Route attachment model with all route data
    ///   - onRoutePress: Callback when card is pressed
    ///   - testID: Test identifier for UI testing
    public init(
        route: LSRouteAttachment,
        onRoutePress: ((String) -> Void)? = nil,
        testID: String = "route-attachment-card"
    ) {
        self.route = route
        self.onRoutePress = onRoutePress
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if let onRoutePress {
                // Interactive card
                Button { onRoutePress(route.id) } label: {
                    cardContent
                }
                .buttonStyle(.plain)
                .simultaneousGesture(DragGesture(minimumDistance: 0)
                    .onChanged { _ in
                        isPressed = true
                    }
                    .onEnded { _ in
                        isPressed = false
                    })

            } else {
                // Static card
                cardContent
            }
        }
        .accessibilityLabel("Route: \(route.label)")
        .accessibilityAddTraits(onRoutePress != nil ? .isButton : [])
        .accessibilityIdentifier(testID)
    }

    // MARK: - Card Content

    private var cardContent: some View {
        HStack(alignment: .center, spacing: theme.space.md) {
            // Left: Best badge + Label
            HStack(alignment: .center, spacing: theme.space.sm) {
                // Best badge
                if route.isBest {
                    bestBadge
                }

                // Route label
                Text(route.label)
                    .font(.system(size: theme.type.label.md.fontSize, weight: .semibold))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .lineLimit(1)
            }
            .layoutPriority(1)

            Spacer()

            // Center: Stats (distance, duration, weather)
            HStack(alignment: .center, spacing: theme.space.sm) {
                // Distance
                statItem(icon: "map-marker-distance", value: route.distance)

                // Duration
                statItem(icon: "clock-outline", value: route.duration)

                // Weather badge (if present)
                if let weatherBadge = route.weatherBadge {
                    weatherBadgeView(weatherBadge)
                }
            }

            // Right: Scenic score
            HStack(alignment: .center, spacing: 3) {
                LSIconSymbol(
                    name: "leaf",
                    size: 12,
                    color: theme.colors.primary.default
                )
                Text(String(format: "%.1f", route.scenicScore))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(theme.colors.primary.default)
            }
        }
        .padding(.init(top: 10, leading: 12, bottom: 10, trailing: 12))
        .background(theme.colors.card.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.md)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.thin)
        )
        .opacity(isPressed ? 0.8 : 1.0)
    }

    // MARK: - Best Badge

    private var bestBadge: some View {
        HStack(spacing: 3) {
            Text("⭐")
                .font(.system(size: 11, weight: .bold))
        }
        .foregroundStyle(theme.colors.primary.default)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.sm)
                .fill(theme.colors.primary.default.opacity(0.2))
        )
    }

    // MARK: - Stat Item

    private func statItem(icon: String, value: String) -> some View {
        HStack(alignment: .center, spacing: 3) {
            LSIconSymbol(
                name: icon,
                size: 12,
                color: theme.colors.onSurface.muted
            )
            Text(value)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(theme.colors.onSurface.subtle)
        }
    }

    // MARK: - Weather Badge

    private func weatherBadgeView(_ weatherBadge: LSWeatherBadge) -> some View {
        let iconName = weatherIconName(for: weatherBadge.type)
        let color = weatherColor(for: weatherBadge.type)

        return HStack(alignment: .center, spacing: 3) {
            LSIconSymbol(
                name: iconName,
                size: 12,
                color: color
            )
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.sm)
                .fill(color.opacity(0.2))
        )
    }

    // MARK: - Weather Helpers

    private func weatherIconName(for type: LSWeatherBadgeType) -> String {
        switch type {
        case .clear:
            return "weather-sunny"
        case .rain:
            return "weather-rainy"
        case .wind:
            return "weather-windy"
        case .cloudy:
            return "weather-cloudy"
        }
    }

    private func weatherColor(for type: LSWeatherBadgeType) -> Color {
        switch type {
        case .rain:
            return theme.colors.danger.default
        case .wind:
            return theme.colors.warning.default
        default:
            return theme.colors.onSurface.muted
        }
    }
}

// MARK: - Preview

#Preview("RouteAttachmentCard - Standard") {
    LSRouteAttachmentCard(
        route: LSRouteAttachment(
            id: "route-1",
            label: "Pacific Coast Highway",
            description: "Scenic coastal route",
            distance: "125 mi",
            duration: "2h 45m",
            scenicScore: 8.5,
            weatherBadge: LSWeatherBadge(type: .clear, text: "Clear"),
            isBest: false
        ),
        onRoutePress: { id in
            print("Pressed route: \(id)")
        },
        testID: "preview-route"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("RouteAttachmentCard - Best Route") {
    LSRouteAttachmentCard(
        route: LSRouteAttachment(
            id: "route-2",
            label: "Twisty Mountain Pass",
            description: "Best scenic route",
            distance: "85 mi",
            duration: "2h 15m",
            scenicScore: 9.5,
            weatherBadge: LSWeatherBadge(type: .clear, text: "Clear"),
            isBest: true
        ),
        testID: "best-route-preview"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("RouteAttachmentCard - Rainy Weather") {
    LSRouteAttachmentCard(
        route: LSRouteAttachment(
            id: "route-3",
            label: "Coastal Rain Route",
            description: "Wet weather expected",
            distance: "50 mi",
            duration: "1h 30m",
            scenicScore: 7.0,
            weatherBadge: LSWeatherBadge(type: .rain, text: "Rain expected"),
            isBest: false
        ),
        testID: "rainy-route-preview"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("RouteAttachmentCard - Windy Weather") {
    LSRouteAttachmentCard(
        route: LSRouteAttachment(
            id: "route-4",
            label: "Windy Canyon Run",
            description: "High winds",
            distance: "60 mi",
            duration: "1h 45m",
            scenicScore: 7.5,
            weatherBadge: LSWeatherBadge(type: .wind, text: "Windy"),
            isBest: false
        ),
        testID: "windy-route-preview"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("RouteAttachmentCard - Multiple Cards") {
    VStack(spacing: 12) {
        LSRouteAttachmentCard(
            route: LSRouteAttachment(
                id: "route-a",
                label: "Pacific Coast Highway",
                description: "Scenic coastal route",
                distance: "125 mi",
                duration: "2h 45m",
                scenicScore: 8.5,
                weatherBadge: nil,
                isBest: true
            )
        )

        LSRouteAttachmentCard(
            route: LSRouteAttachment(
                id: "route-b",
                label: "Mountain Pass",
                description: "Twisty roads",
                distance: "85 mi",
                duration: "2h 15m",
                scenicScore: 9.0,
                weatherBadge: LSWeatherBadge(type: .rain, text: "Rain"),
                isBest: false
            )
        )

        LSRouteAttachmentCard(
            route: LSRouteAttachment(
                id: "route-c",
                label: "Valley Run",
                description: "Flat and fast",
                distance: "50 mi",
                duration: "1h 15m",
                scenicScore: 6.5,
                weatherBadge: LSWeatherBadge(type: .wind, text: "Windy"),
                isBest: false
            )
        )
    }
    .laneShadowTheme()
    .padding()
}

#Preview("RouteAttachmentCard - Dark Mode") {
    VStack(spacing: 12) {
        LSRouteAttachmentCard(
            route: LSRouteAttachment(
                id: "route-dark-1",
                label: "Night Coast Run",
                description: "Evening ride",
                distance: "125 mi",
                duration: "2h 45m",
                scenicScore: 8.5,
                weatherBadge: LSWeatherBadge(type: .cloudy, text: "Cloudy"),
                isBest: true
            )
        )

        LSRouteAttachmentCard(
            route: LSRouteAttachment(
                id: "route-dark-2",
                label: "Midnight Canyon",
                description: "Dark twisty roads",
                distance: "60 mi",
                duration: "1h 45m",
                scenicScore: 7.5,
                weatherBadge: nil,
                isBest: false
            )
        )
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
    .padding()
}
