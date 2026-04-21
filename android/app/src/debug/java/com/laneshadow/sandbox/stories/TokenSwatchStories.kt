package com.laneshadow.sandbox.stories

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object TokenSwatchStories {
    val all: List<Story> = listOf(
        Story(
            id = "tokens/color-swatches/all",
            tier = ComponentTier.Atom,
            component = "ColorTokens",
            name = "All Colors",
            summary = "Every semantic color swatch: surface, content, signal, action, border, domain",
            content = { ColorSwatchStory() },
        ),
        Story(
            id = "tokens/typography/all-families",
            tier = ComponentTier.Atom,
            component = "TypographyTokens",
            name = "All Families & Sizes",
            summary = "Opinion (Newsreader), UI (Geist), Instrument (JetBrains Mono) — all size variants",
            content = { TypographyStory() },
        ),
        Story(
            id = "tokens/spacing/rungs",
            tier = ComponentTier.Atom,
            component = "SpacingTokens",
            name = "Spacing Scale",
            summary = "xs through 4xl — every spacing rung visualized",
            content = { SpacingStory() },
        ),
        Story(
            id = "tokens/radius/shapes",
            tier = ComponentTier.Atom,
            component = "RadiusTokens",
            name = "Corner Radii",
            summary = "none through full — corner radius scale",
            content = { RadiusStory() },
        ),
        Story(
            id = "tokens/elevation/levels",
            tier = ComponentTier.Atom,
            component = "ElevationTokens",
            name = "Elevation Levels",
            summary = "Level 0 through 8 — shadow depth progression",
            content = { ElevationStory() },
        ),
    )
}

// ----------------------------------------------------------------------------
// Color swatches
// ----------------------------------------------------------------------------

@Composable
private fun ColorSwatchStory() {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.lg),
    ) {
        ColorSection("Surface", listOf(
            "primary" to theme.colors.surface.default,
            "card" to theme.colors.card.default,
            "variant" to theme.colors.surfaceVariant.default,
            "background" to theme.colors.background.default,
            "muted" to theme.colors.muted.default,
            "input" to theme.colors.input.default,
        ))
        ColorSection("Content", listOf(
            "onSurface" to theme.colors.onSurface.default,
            "onPrimary" to theme.colors.onPrimary.default,
            "onSecondary" to theme.colors.onSecondary.default,
            "secondary" to theme.colors.secondary.default,
            "tertiary" to theme.colors.tertiary.default,
        ))
        ColorSection("Signal & Action", listOf(
            "primary (signal)" to theme.colors.primary.default,
            "accent" to theme.colors.accent.default,
            "secondaryContainer" to theme.colors.secondaryContainer.default,
            "warningContainer" to theme.colors.warningContainer.default,
            "onWarningContainer" to theme.colors.onWarningContainer.default,
        ))
        ColorSection("Status", listOf(
            "info" to theme.colors.info.default,
            "success" to theme.colors.success.default,
            "warning" to theme.colors.warning.default,
            "danger" to theme.colors.danger.default,
        ))
        ColorSection("Route", listOf(
            "routeSelected" to theme.colors.routeSelected.default,
            "routeAlternate" to theme.colors.routeAlternate.default,
        ))
        ColorSection("Border & Scrim", listOf(
            "border" to theme.colors.border.default,
            "divider" to theme.colors.divider.default,
            "ring" to theme.colors.ring.default,
            "scrim" to theme.colors.scrim.default,
            "popover" to theme.colors.popover.default,
        ))
        ColorSection("Domain", listOf(
            "orange" to theme.domain.orange.default,
        ))
    }
}

@Composable
private fun ColorSection(title: String, entries: List<Pair<String, Color>>) {
    val theme = LocalLaneShadowTheme.current
    Column(verticalArrangement = Arrangement.spacedBy(theme.space.sm)) {
        Text(
            text = title,
            style = theme.type.label.md,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
        )
        entries.forEach { (name, color) ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(theme.radius.sm))
                        .background(color)
                        .border(0.5.dp, theme.colors.border.default, RoundedCornerShape(theme.radius.sm)),
                )
                Spacer(Modifier.width(theme.space.md))
                Text(name, style = theme.type.body.md, color = theme.colors.onSurface.default)
            }
        }
    }
}

// ----------------------------------------------------------------------------
// Typography
// ----------------------------------------------------------------------------

@Composable
private fun TypographyStory() {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.xl),
    ) {
        TypographyFamily("Opinion — Newsreader", listOf(
            "display.lg" to theme.type.display.lg,
            "display.md" to theme.type.display.md,
            "display.sm" to theme.type.display.sm,
            "heading.lg" to theme.type.heading.lg,
            "heading.md" to theme.type.heading.md,
            "heading.sm" to theme.type.heading.sm,
        ))
        TypographyFamily("UI — Geist", listOf(
            "title.lg" to theme.type.title.lg,
            "title.md" to theme.type.title.md,
            "title.sm" to theme.type.title.sm,
            "body.lg" to theme.type.body.lg,
            "body.md" to theme.type.body.md,
            "body.sm" to theme.type.body.sm,
            "label.lg" to theme.type.label.lg,
            "label.md" to theme.type.label.md,
            "label.sm" to theme.type.label.sm,
        ))
    }
}

@Composable
private fun TypographyFamily(title: String, variants: List<Pair<String, TextStyle>>) {
    val theme = LocalLaneShadowTheme.current
    Column(verticalArrangement = Arrangement.spacedBy(theme.space.sm)) {
        Text(
            text = title,
            style = theme.type.label.md,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
        )
        variants.forEach { (name, style) ->
            Column {
                Text(
                    "The quick brown fox jumps over the lazy dog",
                    style = style,
                    color = theme.colors.onSurface.default,
                )
                Text(
                    "$name — ${style.fontSize.value.toInt()}sp",
                    style = theme.type.label.sm,
                    color = theme.colors.onSurface.default.copy(alpha = 0.5f),
                )
            }
        }
    }
}

// ----------------------------------------------------------------------------
// Spacing
// ----------------------------------------------------------------------------

@Composable
private fun SpacingStory() {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.lg),
    ) {
        Text(
            "Spacing Scale (dp)",
            style = theme.type.label.md,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
        )
        SpacingBar("xs", theme.space.xs)
        SpacingBar("sm", theme.space.sm)
        SpacingBar("md", theme.space.md)
        SpacingBar("lg", theme.space.lg)
        SpacingBar("xl", theme.space.xl)
        SpacingBar("xxl (2xl)", theme.space.xxl)
        SpacingBar("xxxl (3xl)", theme.space.xxxl)
        SpacingBar("xxxxl (4xl)", theme.space.xxxxl)
    }
}

@Composable
private fun SpacingBar(label: String, value: Dp) {
    val theme = LocalLaneShadowTheme.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            label,
            style = theme.type.label.sm,
            color = theme.colors.onSurface.default,
            modifier = Modifier.width(96.dp),
            textAlign = TextAlign.End,
        )
        Spacer(Modifier.width(theme.space.md))
        Box(
            modifier = Modifier
                .height(12.dp)
                .width(value)
                .clip(RoundedCornerShape(2.dp))
                .background(theme.colors.accent.default),
        )
        Spacer(Modifier.width(theme.space.md))
        Text(
            "${value.value.toInt()}dp",
            style = theme.type.label.sm,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
        )
    }
}

// ----------------------------------------------------------------------------
// Radius
// ----------------------------------------------------------------------------

@Composable
private fun RadiusStory() {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.lg),
    ) {
        Text(
            "Corner Radius Scale",
            style = theme.type.label.md,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(theme.space.md)) {
            RadiusBox("none", theme.radius.none)
            RadiusBox("sm", theme.radius.sm)
            RadiusBox("md", theme.radius.md)
            RadiusBox("lg", theme.radius.lg)
            RadiusBox("xl", theme.radius.xl)
            RadiusBox("2xl", theme.radius.xxl)
            RadiusBox("full", theme.radius.full)
        }
    }
}

@Composable
private fun RadiusBox(label: String, value: Dp) {
    val theme = LocalLaneShadowTheme.current
    val shape = if (value.value >= 9999f) CircleShape else RoundedCornerShape(value)
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(shape)
                .background(theme.colors.accent.default.copy(alpha = 0.15f))
                .border(1.dp, theme.colors.accent.default, shape),
        )
        Spacer(Modifier.height(4.dp))
        Text(label, style = theme.type.label.sm, color = theme.colors.onSurface.default)
        Text(
            "${value.value.toInt()}dp",
            style = theme.type.label.sm,
            color = theme.colors.onSurface.default.copy(alpha = 0.5f),
        )
    }
}

// ----------------------------------------------------------------------------
// Elevation
// ----------------------------------------------------------------------------

@Composable
private fun ElevationStory() {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.lg),
    ) {
        Text(
            "Elevation Levels",
            style = theme.type.label.md,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(theme.space.md)) {
            ElevationCard("0", theme.elevation.light.level0)
            ElevationCard("1", theme.elevation.light.level1)
            ElevationCard("2", theme.elevation.light.level2)
            ElevationCard("3", theme.elevation.light.level3)
            ElevationCard("4", theme.elevation.light.level4)
            ElevationCard("5", theme.elevation.light.level5)
            ElevationCard("8", theme.elevation.light.level8)
        }
    }
}

@Composable
private fun ElevationCard(level: String, elevation: Dp) {
    val theme = LocalLaneShadowTheme.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Card(
            modifier = Modifier.size(56.dp),
            shape = RoundedCornerShape(theme.radius.md),
            elevation = CardDefaults.cardElevation(defaultElevation = elevation),
            colors = CardDefaults.cardColors(containerColor = theme.colors.surface.default),
        ) {}
        Spacer(Modifier.height(4.dp))
        Text("L$level", style = theme.type.label.sm, color = theme.colors.onSurface.default)
    }
}
