import LaneShadowTheme
import NativeSandbox
import NativeTheme
import SwiftUI

/// Token swatch stories — design-system documentation at the infrastructure tier.
@MainActor
enum LSTokenStories {
    static let all: [Story] = [
        Story(
            id: "tokens.color-swatches.all",
            tier: .infrastructure,
            component: "ColorTokens",
            name: "All Colors",
            summary: "Every semantic color swatch: surface, content, signal, action, border, domain"
        ) { _ in
            ColorSwatchStory()
        },

        Story(
            id: "tokens.typography.all-families",
            tier: .infrastructure,
            component: "TypographyTokens",
            name: "All Families & Sizes",
            summary: "Opinion (Newsreader), UI (Geist), Instrument (JetBrains Mono) — all size/weight variants"
        ) { _ in
            TypographyStory()
        },

        Story(
            id: "tokens.spacing.rungs",
            tier: .infrastructure,
            component: "SpacingTokens",
            name: "Spacing Scale",
            summary: "xs through 4xl — every spacing rung visualized"
        ) { _ in
            SpacingStory()
        },

        Story(
            id: "tokens.radius.shapes",
            tier: .infrastructure,
            component: "RadiusTokens",
            name: "Corner Radii",
            summary: "none through full — corner radius scale"
        ) { _ in
            RadiusStory()
        },

        Story(
            id: "tokens.elevation.levels",
            tier: .infrastructure,
            component: "ElevationTokens",
            name: "Elevation Levels",
            summary: "Level 0 through 8 — shadow depth progression"
        ) { _ in
            ElevationStory()
        },
    ]
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
