import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSRouteAttachmentCardRoute: Equatable, Sendable {
    public enum Variant: String, CaseIterable, Sendable {
        case best
        case alt1
        case alt2
    }

    public struct Weather: Equatable, Sendable {
        public let condition: WeatherCondition
        public let label: String

        public init(condition: WeatherCondition, label: String) {
            self.condition = condition
            self.label = label
        }
    }

    public let variant: Variant
    public let title: String
    public let subtitle: String
    public let distance: String
    public let duration: String
    public let elevation: String
    public let scenicRating: Int
    public let weather: Weather?
    public let favoriteLabel: String?

    public init(
        variant: Variant,
        title: String,
        subtitle: String,
        distance: String,
        duration: String,
        elevation: String,
        scenicRating: Int,
        weather: Weather? = nil,
        favoriteLabel: String? = nil
    ) {
        self.variant = variant
        self.title = title
        self.subtitle = subtitle
        self.distance = distance
        self.duration = duration
        self.elevation = elevation
        self.scenicRating = scenicRating
        self.weather = weather
        self.favoriteLabel = favoriteLabel
    }
}

struct LSRouteAttachmentCardResolvedStyle: Equatable {
    let backgroundToken: String
    let borderToken: String
    let stripeToken: String
    let scenicFilledToken: String
    let scenicEmptyToken: String
    let backgroundColor: Color
    let borderColor: Color
    let stripeColor: Color
    let scenicFilledColor: Color
    let scenicEmptyColor: Color
}

struct LSRouteAttachmentCardContentPadding: Equatable {
    let vertical: CGFloat
    let horizontal: CGFloat
}

public struct LSRouteAttachmentCard: View {
    @Environment(\.theme) private var theme

    private static let scenicMeterCount = 5
    private static let scenicDotScale: CGFloat = 0.5

    let route: LSRouteAttachmentCardRoute
    let selected: Bool
    let compact: Bool
    let onTap: (() -> Void)?

    public init(
        route: LSRouteAttachmentCardRoute,
        selected: Bool = false,
        compact: Bool = false,
        onTap: (() -> Void)? = nil
    ) {
        self.route = route
        self.selected = selected
        self.compact = compact
        self.onTap = onTap
    }

    public var body: some View {
        Group {
            if onTap != nil {
                Button(action: handleTap) {
                    cardBody
                }
                .buttonStyle(.plain)
            } else {
                cardBody
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(onTap == nil ? [] : .isButton)
        .accessibilityIdentifier("lsrouteattachmentcard")
    }

    var showsBestBadge: Bool {
        !compact && route.variant == .best
    }

    var showsWeatherBadge: Bool {
        !compact && route.weather != nil
    }

    var contentPadding: LSRouteAttachmentCardContentPadding {
        Self.contentPadding(compact: compact)
    }

    func handleTap() {
        onTap?()
    }

    private var cardBody: some View {
        let shape = RoundedRectangle(
            cornerRadius: theme.radius.lg,
            style: .continuous
        )
        let style = Self.resolvedStyle(
            variant: route.variant,
            selected: selected,
            in: theme
        )
        let padding = contentPadding

        return LSCard(padding: compact ? .spacing3 : .spacing4) {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                headerRow

                VStack(alignment: .leading, spacing: theme.space.xs) {
                    LSText(route.title, variant: .title.md)
                        .accessibilityIdentifier("lsrouteattachmentcard-title")

                    LSText(route.subtitle, variant: .body.sm, color: .secondary)
                        .accessibilityIdentifier("lsrouteattachmentcard-subtitle")
                }

                metricsRow(style: style)

                if let favoriteLabel = route.favoriteLabel {
                    favoriteRow(favoriteLabel)
                }
            }
            .padding(.vertical, padding.vertical)
            .padding(.horizontal, padding.horizontal)
        }
        .overlay {
            HStack(spacing: 0) {
                Rectangle()
                    .fill(style.stripeColor)
                    .frame(width: Self.stripeWidth)
                    .frame(maxHeight: .infinity)

                Spacer(minLength: 0)
            }
            .clipShape(shape)
        }
        .overlay {
            shape
                .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
        }
        .contentShape(shape)
    }

    private var headerRow: some View {
        HStack(alignment: .top, spacing: theme.space.sm) {
            if showsBestBadge {
                LSBestBadge()
            }

            Spacer(minLength: 0)

            if let weather = route.weather, showsWeatherBadge {
                LSWeatherBadge(
                    condition: weather.condition,
                    label: weather.label,
                    size: .sm
                )
            }
        }
    }

    private func metricsRow(style: LSRouteAttachmentCardResolvedStyle) -> some View {
        HStack(spacing: theme.space.sm) {
            metricText(route.distance)
            metricDivider(style: style)
            metricText(route.duration)
            metricDivider(style: style)
            metricText(route.elevation)
            metricDivider(style: style)
            scenicMeter(style: style)
        }
        .accessibilityIdentifier("lsrouteattachmentcard-metrics")
    }

    private func metricText(_ value: String) -> some View {
        Text(value)
            .font(LaneShadowTheme.typography.instrumentSm.font)
            .foregroundStyle(LaneShadowTheme.color.content.primary)
            .accessibilityIdentifier("lsrouteattachmentcard-metric-\(value)")
    }

    private func metricDivider(style: LSRouteAttachmentCardResolvedStyle) -> some View {
        Rectangle()
            .fill(style.borderColor)
            .frame(width: theme.borderWidth.hairline, height: theme.space.sm)
            .accessibilityHidden(true)
    }

    private func scenicMeter(style: LSRouteAttachmentCardResolvedStyle) -> some View {
        let scenicRating = Self.clampedScenicRating(route.scenicRating)
        let icons = Self.scenicMeterIcons(for: scenicRating)

        return HStack(spacing: theme.space.xs) {
            ForEach(Array(icons.enumerated()), id: \.offset) { index, iconName in
                let filled = iconName == .circleFill
                LSIcon(
                    name: iconName,
                    size: .xs,
                    resolvedColorOverride: filled ? style.scenicFilledColor : style.scenicEmptyColor
                )
                .scaleEffect(Self.scenicDotScale)
                .accessibilityIdentifier("lsrouteattachmentcard-scenic-\(index)")
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            "Scenic rating: \(scenicRating) out of \(Self.scenicMeterCount)"
        )
    }

    private func favoriteRow(_ label: String) -> some View {
        HStack(spacing: theme.space.xs) {
            LSIcon(
                name: .heartFill,
                size: .xs,
                resolvedColorOverride: LaneShadowTheme.color.signal.default
            )

            Text(label)
                .font(theme.type.label.sm.font)
                .foregroundStyle(LaneShadowTheme.color.signal.default)
        }
        .accessibilityIdentifier("lsrouteattachmentcard-favorite")
    }
}

extension LSRouteAttachmentCard {
    static let stripeWidth: CGFloat = 3

    static func contentPadding(compact: Bool) -> LSRouteAttachmentCardContentPadding {
        if compact {
            return LSRouteAttachmentCardContentPadding(vertical: 10, horizontal: 12)
        }

        return LSRouteAttachmentCardContentPadding(vertical: 0, horizontal: 4)
    }

    static func clampedScenicRating(_ scenicRating: Int) -> Int {
        max(0, min(scenicRating, scenicMeterCount))
    }

    static func scenicMeterIcons(for scenicRating: Int) -> [IconName] {
        let clampedRating = clampedScenicRating(scenicRating)

        return (0 ..< scenicMeterCount).map { index in
            index < clampedRating ? .circleFill : .circle
        }
    }

    static func resolvedStyle(
        variant: LSRouteAttachmentCardRoute.Variant,
        selected: Bool,
        in theme: Theme = .shared
    ) -> LSRouteAttachmentCardResolvedStyle {
        let borderToken = selected ? "color.signal.default" : "color.border.default"
        let borderColor = selected ? LaneShadowTheme.color.signal.default : LaneShadowTheme.color.border.default

        return LSRouteAttachmentCardResolvedStyle(
            backgroundToken: "color.surface.card",
            borderToken: borderToken,
            stripeToken: variant.stripeToken,
            scenicFilledToken: "color.signal.default",
            scenicEmptyToken: "color.border.strong",
            backgroundColor: LSSurfaceColorToken.card.resolved(in: theme),
            borderColor: borderColor,
            stripeColor: variant.stripeColor,
            scenicFilledColor: LaneShadowTheme.color.signal.default,
            scenicEmptyColor: LaneShadowTheme.color.border.strong
        )
    }
}

private extension LSRouteAttachmentCardRoute.Variant {
    var stripeToken: String {
        switch self {
        case .best:
            "color.route.best"
        case .alt1:
            "color.route.alt1"
        case .alt2:
            "color.route.alt2"
        }
    }

    var stripeColor: Color {
        switch self {
        case .best:
            LaneShadowTheme.color.route.best
        case .alt1:
            LaneShadowTheme.color.route.alt1
        case .alt2:
            LaneShadowTheme.color.route.alt2
        }
    }
}
