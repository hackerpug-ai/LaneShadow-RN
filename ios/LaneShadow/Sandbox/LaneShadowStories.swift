import LaneShadowTheme
import NativeSandbox
import NativeTheme
import SwiftUI

@MainActor
enum LaneShadowStories {
    static let all: [Story] = [
        // MARK: - Token Swatch Stories

        Story(
            id: "tokens/color-swatches/all",
            tier: .atom,
            component: "ColorTokens",
            name: "All Colors",
            summary: "Every semantic color swatch: surface, content, signal, action, border, domain"
        ) { _ in
            ColorSwatchStory()
        },

        Story(
            id: "tokens/typography/all-families",
            tier: .atom,
            component: "TypographyTokens",
            name: "All Families & Sizes",
            summary: "Opinion (Newsreader), UI (Geist), Instrument (JetBrains Mono) — all size/weight variants"
        ) { _ in
            TypographyStory()
        },

        Story(
            id: "tokens/spacing/rungs",
            tier: .atom,
            component: "SpacingTokens",
            name: "Spacing Scale",
            summary: "xs through 4xl — every spacing rung visualized"
        ) { _ in
            SpacingStory()
        },

        Story(
            id: "tokens/radius/shapes",
            tier: .atom,
            component: "RadiusTokens",
            name: "Corner Radii",
            summary: "none through full — corner radius scale"
        ) { _ in
            RadiusStory()
        },

        Story(
            id: "tokens/elevation/levels",
            tier: .atom,
            component: "ElevationTokens",
            name: "Elevation Levels",
            summary: "Level 0 through 8 — shadow depth progression"
        ) { _ in
            ElevationStory()
        },

    ] + AtomsStories.all
        + LSSurfaceStories.all
        + LSDisplayStories.all
        + LSButtonStories.all
        + LSInputStories.all
        + LSScrimStories.all
        + LSPhaseDotStories.all
}

@MainActor
enum LSPhaseDotStories {
    static let all: [Story] = [
        Story(
            id: "atoms.phaseDot.pending",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Pending",
            summary: "Hollow phase dot with the pending border treatment."
        ) { _ in
            LSPhaseDotStory(state: .pending)
        },

        Story(
            id: "atoms.phaseDot.active",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Active",
            summary: "Signal-filled phase dot with the recipe-driven pulse ring."
        ) { _ in
            LSPhaseDotStory(state: .active)
        },

        Story(
            id: "atoms.phaseDot.done",
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
                    swatchRow("primary", theme.colors.surface.default)
                    swatchRow("card", theme.colors.card.default)
                    swatchRow("variant", theme.colors.surfaceVariant.default)
                    swatchRow("background", theme.colors.background.default)
                    swatchRow("muted", theme.colors.muted.default)
                    swatchRow("input", theme.colors.input.default)
                }

                section("Content") {
                    swatchRow("onSurface", theme.colors.onSurface.default)
                    swatchRow("onPrimary", theme.colors.onPrimary.default)
                    swatchRow("onSecondary", theme.colors.onSecondary.default)
                    swatchRow("secondary", theme.colors.secondary.default)
                    swatchRow("tertiary", theme.colors.tertiary.default)
                }

                section("Signal & Action") {
                    swatchRow("primary (signal)", theme.colors.primary.default)
                    swatchRow("accent", theme.colors.accent.default)
                    swatchRow("secondaryContainer", theme.colors.secondaryContainer.default)
                    swatchRow("warningContainer", theme.colors.warningContainer.default)
                    swatchRow("onWarningContainer", theme.colors.onWarningContainer.default)
                }

                section("Status") {
                    swatchRow("info", theme.colors.info.default)
                    swatchRow("success", theme.colors.success.default)
                    swatchRow("warning", theme.colors.warning.default)
                    swatchRow("danger", theme.colors.danger.default)
                }

                section("Route") {
                    swatchRow("routeSelected", theme.colors.routeSelected.default)
                    swatchRow("routeAlternate", theme.colors.routeAlternate.default)
                }

                section("Border & Scrim") {
                    swatchRow("border", theme.colors.border.default)
                    swatchRow("divider", theme.colors.divider.default)
                    swatchRow("ring", theme.colors.ring.default)
                    swatchRow("scrim", theme.colors.scrim.default)
                    swatchRow("popover", theme.colors.popover.default)
                }

                section("Domain") {
                    swatchRow("orange", theme.domain.orange.default)
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
                    .font(.system(size: 18, weight: .medium, design: .monospaced))
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.lg — 18pt / medium")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.5))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("3:42:15 PM  ·  68°F  ·  12 mph")
                    .font(.system(size: 13, weight: .medium, design: .monospaced))
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("instrument.md — 13pt / medium")
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
