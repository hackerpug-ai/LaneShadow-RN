import LaneShadowTheme
import NativeSandbox
import NativeTheme
import SwiftUI

@MainActor
enum LaneShadowStories {
    static let all: [Story] = [
        // MARK: - Token Swatch Stories (infrastructure tier for design-system documentation)

        Story(
            id: "infrastructure.tokens.color-swatches.all",
            tier: .infrastructure,
            component: "ColorTokens",
            name: "All Colors",
            summary: "Every semantic color swatch: surface, content, signal, action, border, domain"
        ) { _ in
            ColorSwatchStory()
        },

        Story(
            id: "infrastructure.tokens.typography.all-families",
            tier: .infrastructure,
            component: "TypographyTokens",
            name: "All Families & Sizes",
            summary: "Opinion (Newsreader), UI (Geist), Instrument (JetBrains Mono) — all size/weight variants"
        ) { _ in
            TypographyStory()
        },

        Story(
            id: "infrastructure.tokens.spacing.rungs",
            tier: .infrastructure,
            component: "SpacingTokens",
            name: "Spacing Scale",
            summary: "xs through 4xl — every spacing rung visualized"
        ) { _ in
            SpacingStory()
        },

        Story(
            id: "infrastructure.tokens.radius.shapes",
            tier: .infrastructure,
            component: "RadiusTokens",
            name: "Corner Radii",
            summary: "none through full — corner radius scale"
        ) { _ in
            RadiusStory()
        },

        Story(
            id: "infrastructure.tokens.elevation.levels",
            tier: .infrastructure,
            component: "ElevationTokens",
            name: "Elevation Levels",
            summary: "Level 0 through 8 — shadow depth progression"
        ) { _ in
            ElevationStory()
        },

    ] + AtomsStories.all
        + MoleculesStories.all
        + OrganismStories.all
        + TemplateStories.all
        + ModifierStories.all
        + InfrastructureStories.all
        + LSMapStories.all
        + LSBadgeStories.all
        + LSSurfaceStories.all
        + LSDisplayStories.all
        + LSButtonStories.all
        + LSInputStories.all
        + LSPillStories.all
        + LSScrimStories.all
        + LSPhaseDotStories.all
}

@MainActor
enum LSBadgeStories {
    static let all: [Story] =
        BadgeStatusVariant.allCases.map { status in statusStory(status) } +
        BadgeWeatherVariant.allCases.map { weather in weatherStory(weather) } +
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

@MainActor
enum LSPhaseDotStories {
    static let all: [Story] = [
        Story(
            id: "atoms.phase-dot.pending",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Pending",
            summary: "Hollow phase dot with the pending border treatment."
        ) { _ in
            LSPhaseDotStory(state: .pending)
        },

        Story(
            id: "atoms.phase-dot.active",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Active",
            summary: "Signal-filled phase dot with the recipe-driven pulse ring."
        ) { _ in
            LSPhaseDotStory(state: .active)
        },

        Story(
            id: "atoms.phase-dot.done",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Done",
            summary: "Success-filled phase dot without pulse animation."
        ) { _ in
            LSPhaseDotStory(state: .done)
        },
    ]
}

@MainActor
enum LSSurfaceStories {
    static let all: [Story] = [
        Story(
            id: "atoms.card.default",
            tier: .atom,
            component: "LSCard",
            name: "Card Default",
            summary: "Elevated card with the default surface tokens."
        ) { _ in
            SurfaceCardDefaultStory()
        },
        Story(
            id: "atoms.card.with-content",
            tier: .atom,
            component: "LSCard",
            name: "Card With Content",
            summary: "Elevated card with richer content composition."
        ) { _ in
            SurfaceCardContentStory()
        },
        Story(
            id: "atoms.panel.default",
            tier: .atom,
            component: "LSPanel",
            name: "Panel Default",
            summary: "Flat panel surface with compact padding."
        ) { _ in
            SurfacePanelDefaultStory()
        },
        Story(
            id: "atoms.panel.nested",
            tier: .atom,
            component: "LSPanel",
            name: "Panel Nested",
            summary: "Nested panel composition inside a card."
        ) { _ in
            SurfacePanelNestedStory()
        },
        Story(
            id: "atoms.glasspanel.chrome",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Chrome",
            summary: "Backdrop-blurred chrome surface."
        ) { _ in
            SurfaceGlassChromeStory()
        },
        Story(
            id: "atoms.glasspanel.callout-signal",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Callout Signal",
            summary: "Glass callout with the signal accent stripe."
        ) { _ in
            SurfaceGlassCalloutStory(accent: .signal)
        },
        Story(
            id: "atoms.glasspanel.callout-warning",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Callout Warning",
            summary: "Glass callout with the warning accent stripe."
        ) { _ in
            SurfaceGlassCalloutStory(accent: .warning)
        },
    ]
}

private struct LSPhaseDotStory: View {
    @Environment(\.theme) private var theme

    let state: PhaseState

    var body: some View {
        VStack(spacing: theme.space.sm) {
            LSPhaseDot(state: state)
            LSText(state.storyLabel, variant: .label.sm, color: .subtle)
        }
        .padding(theme.space.lg)
    }
}

private extension PhaseState {
    var storyLabel: String {
        switch self {
        case .pending:
            "Pending"
        case .active:
            "Active"
        case .done:
            "Done"
        }
    }
}

private struct SurfaceCardDefaultStory: View {
    var body: some View {
        LSCard {
            LSText("Ride Summary", variant: .title.md)
        }
        .padding(Theme.shared.space.lg)
    }
}

private struct SurfaceCardContentStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        LSCard {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                LSText("Favorite Route", variant: .title.md)
                LSText("64 mi  1h 42m  Scenic river loop", variant: .body.md, color: .secondary)
            }
        }
        .padding(theme.space.lg)
    }
}

private struct SurfacePanelDefaultStory: View {
    var body: some View {
        LSPanel {
            LSText("Panel Default", variant: .body.md)
        }
        .padding(Theme.shared.space.lg)
    }
}

private struct SurfacePanelNestedStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        LSCard {
            VStack(alignment: .leading, spacing: theme.space.md) {
                LSText("Nested Surface", variant: .title.md)
                LSPanel {
                    LSText("Panels stack cleanly inside cards.", variant: .body.md, color: .secondary)
                }
            }
        }
        .padding(theme.space.lg)
    }
}

private struct SurfaceGlassChromeStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .fill(theme.colors.surfaceVariant.default)
                .frame(height: 180)

            LSGlassPanel {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText("Chrome Surface", variant: .title.md)
                    LSText("Used for HUD and overlay chrome.", variant: .body.md, color: .secondary)
                }
            }
            .padding(theme.space.lg)
        }
        .padding(theme.space.lg)
    }
}

private struct SurfaceGlassCalloutStory: View {
    @Environment(\.theme) private var theme

    let accent: AccentColor

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .fill(theme.colors.surfaceVariant.default)
                .frame(height: 180)

            LSGlassPanel(variant: .callout(accent: accent)) {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText(title, variant: .title.md)
                    LSText(message, variant: .body.md, color: .secondary)
                }
            }
            .padding(theme.space.lg)
        }
        .padding(theme.space.lg)
    }

    private var title: String {
        switch accent {
        case .signal:
            "Signal Callout"
        case .warning:
            "Warning Callout"
        }
    }

    private var message: String {
        switch accent {
        case .signal:
            "Clear skies. Best conditions for a long ride."
        case .warning:
            "Watch the canyon gusts after 4 PM."
        }
    }
}

// MARK: - Color Swatch Story

private struct ColorSwatchStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.space.lg) {
                section("Surface") {
                    swatchRow("background", LaneShadowTheme.color.surface.primary)
                    swatchRow("surface", LaneShadowTheme.color.surface.primary)
                    swatchRow("card", LaneShadowTheme.color.surface.card)
                    swatchRow("inset", LaneShadowTheme.color.surface.inset)
                    swatchRow("overlay", LaneShadowTheme.color.surface.overlay)
                    swatchRow("glass", LaneShadowTheme.color.surface.glass)
                    swatchRow("scrim", LaneShadowTheme.color.surface.scrim)
                }

                section("Content") {
                    swatchRow("primary", LaneShadowTheme.color.content.primary)
                    swatchRow("secondary", LaneShadowTheme.color.content.secondary)
                    swatchRow("tertiary", LaneShadowTheme.color.content.tertiary)
                    swatchRow("subtle", LaneShadowTheme.color.content.subtle)
                }

                section("Signal") {
                    swatchRow("default", LaneShadowTheme.color.signal.default)
                    swatchRow("hover", LaneShadowTheme.color.signal.hover)
                    swatchRow("pressed", LaneShadowTheme.color.signal.pressed)
                    swatchRow("tint", LaneShadowTheme.color.signal.tint)
                    swatchRow("whisper", LaneShadowTheme.color.signal.whisper)
                }

                section("Action") {
                    swatchRow("primary", LaneShadowTheme.color.action.primary.default)
                    swatchRow("secondary", LaneShadowTheme.color.action.secondary.default)
                }

                section("Border") {
                    swatchRow("default", LaneShadowTheme.color.border.default)
                    swatchRow("subtle", LaneShadowTheme.color.border.subtle)
                    swatchRow("strong", LaneShadowTheme.color.border.strong)
                    swatchRow("focus", LaneShadowTheme.color.border.focus)
                    swatchRow("glass", LaneShadowTheme.color.border.glass)
                }

                section("Status") {
                    swatchRow("recording", LaneShadowTheme.color.status.recording)
                    swatchRow("info", LaneShadowTheme.color.status.info.default)
                    swatchRow("success", LaneShadowTheme.color.status.success.default)
                    swatchRow("warning", LaneShadowTheme.color.status.warning.default)
                }

                section("Weather") {
                    swatchRow("clear", LaneShadowTheme.color.weather.clear.default)
                    swatchRow("rain", LaneShadowTheme.color.weather.rain.default)
                    swatchRow("wind", LaneShadowTheme.color.weather.wind.default)
                    swatchRow("storm", LaneShadowTheme.color.weather.storm.default)
                    swatchRow("hot", LaneShadowTheme.color.weather.hot.default)
                    swatchRow("cold", LaneShadowTheme.color.weather.cold.default)
                }

                section("Route") {
                    swatchRow("best", LaneShadowTheme.color.route.best)
                    swatchRow("alt1", LaneShadowTheme.color.route.alt1)
                    swatchRow("alt2", LaneShadowTheme.color.route.alt2)
                }
            }
            .padding(theme.space.lg)
        }
    }

    private func section(_ title: String, @ViewBuilder content: @escaping () -> some View) -> some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text(title)
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
            content()
        }
    }

    private func swatchRow(_ name: String, _ color: Color) -> some View {
        HStack(spacing: theme.space.md) {
            RoundedRectangle(cornerRadius: theme.radius.sm)
                .fill(color)
                .frame(width: 40, height: 40)
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.sm)
                        .stroke(theme.colors.border.default, lineWidth: 0.5)
                )
            Text(name)
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
            Spacer()
        }
    }
}

// MARK: - Typography Story

private struct TypographyStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.space.xl) {
                familySection("Opinion — Newsreader", variants: [
                    ("display.lg", theme.type.display.lg),
                    ("display.md", theme.type.display.md),
                    ("display.sm", theme.type.display.sm),
                    ("heading.lg", theme.type.heading.lg),
                    ("heading.md", theme.type.heading.md),
                    ("heading.sm", theme.type.heading.sm),
                ])

                familySection("UI — Geist", variants: [
                    ("title.lg", theme.type.title.lg),
                    ("title.md", theme.type.title.md),
                    ("title.sm", theme.type.title.sm),
                    ("body.lg", theme.type.body.lg),
                    ("body.md", theme.type.body.md),
                    ("body.sm", theme.type.body.sm),
                    ("label.lg", theme.type.label.lg),
                    ("label.md", theme.type.label.md),
                    ("label.sm", theme.type.label.sm),
                ])

                instrumentSection()
            }
            .padding(theme.space.lg)
        }
    }

    private func familySection(_ title: String, variants: [(String, TypographyStyle)]) -> some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text(title)
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            ForEach(variants, id: \.0) { name, style in
                VStack(alignment: .leading, spacing: 2) {
                    Text("The quick brown fox jumps over the lazy dog")
                        .font(style.font)
                        .foregroundStyle(theme.colors.onSurface.default)
                    Text("\(name) — \(Int(style.fontSize))pt")
                        .font(theme.type.label.sm.font)
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
                }
            }
        }
    }

    private func instrumentSection() -> some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text("Instrument — JetBrains Mono")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            VStack(alignment: .leading, spacing: 2) {
                Text("42.7 mi  ·  1,204 ft  ·  14:32")
                    .font(LaneShadowTheme.typography.instrumentLg.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.lg — 18pt / medium")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("3:42:15 PM  ·  68°F  ·  12 mph")
                    .font(LaneShadowTheme.typography.instrumentMd.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.md — 13pt / medium")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("42.7mi")
                    .font(LaneShadowTheme.typography.instrumentSm.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.sm — 10pt / medium")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
            }
        }
    }
}

// MARK: - Spacing Story

private struct SpacingStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            Text("Spacing Scale (pt)")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            spacingBar("xs", theme.space.xs)
            spacingBar("sm", theme.space.sm)
            spacingBar("md", theme.space.md)
            spacingBar("lg", theme.space.lg)
            spacingBar("xl", theme.space.xl)
            spacingBar("xxl (2xl)", theme.space.xxl)
            spacingBar("xxxl (3xl)", theme.space.xxxl)
            spacingBar("xxxxl (4xl)", theme.space.xxxxl)
        }
        .padding(theme.space.lg)
    }

    private func spacingBar(_ label: String, _ value: CGFloat) -> some View {
        HStack(spacing: theme.space.md) {
            Text(label)
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .frame(width: 80, alignment: .trailing)

            RoundedRectangle(cornerRadius: 2)
                .fill(theme.colors.accent.default)
                .frame(width: value, height: 12)

            Text("\(Int(value))pt")
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
        }
    }
}

// MARK: - Radius Story

private struct RadiusStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            Text("Corner Radius Scale")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            HStack(spacing: theme.space.md) {
                radiusBox("none", theme.radius.none)
                radiusBox("sm", theme.radius.sm)
                radiusBox("md", theme.radius.md)
                radiusBox("lg", theme.radius.lg)
                radiusBox("xl", theme.radius.xl)
                radiusBox("2xl", theme.radius.xxl)
                radiusBox("full", theme.radius.full)
            }
        }
        .padding(theme.space.lg)
    }

    private func radiusBox(_ label: String, _ value: CGFloat) -> some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: value)
                .fill(theme.colors.accent.default.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: value)
                        .stroke(theme.colors.accent.default, lineWidth: 1)
                )
                .frame(width: 48, height: 48)
            Text(label)
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)
            Text("\(Int(value))pt")
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
        }
    }
}

// MARK: - Elevation Story

private struct ElevationStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            Text("Elevation Levels")
                .font(theme.type.label.md.font)
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))

            HStack(spacing: theme.space.md) {
                elevationCard("0", theme.elevation.level0)
                elevationCard("1", theme.elevation.level1)
                elevationCard("2", theme.elevation.level2)
                elevationCard("3", theme.elevation.level3)
                elevationCard("4", theme.elevation.level4)
                elevationCard("5", theme.elevation.level5)
                elevationCard("8", theme.elevation.level8)
            }
        }
        .padding(theme.space.lg)
    }

    private func elevationCard(_ level: String, _ elevation: ElevationStyle) -> some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: theme.radius.md)
                .fill(theme.colors.surface.default)
                .shadow(
                    color: elevation.shadowColor,
                    radius: elevation.radius,
                    x: elevation.offsetX,
                    y: elevation.offsetY
                )
                .frame(width: 56, height: 56)
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.md)
                        .stroke(theme.colors.border.default, lineWidth: 0.5)
                )
            Text("L\(level)")
                .font(theme.type.label.sm.font)
                .foregroundStyle(theme.colors.onSurface.default)
        }
    }
}
