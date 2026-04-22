package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSTextStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.text.swatch",
            tier = ComponentTier.Atom,
            component = "LSText",
            name = "Typography Swatch",
            summary = "Cross-family typography matrix rendered through LSText token variants.",
            content = { LSTextSwatchStory() },
        ),
    )
}

@Composable
private fun LSTextSwatchStory() {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.xl),
    ) {
        TextFamilySection(
            title = "Opinion",
            rows = listOf(
                TypographyVariant.Opinion.Xl to "Where are we riding today?",
                TypographyVariant.Opinion.Lg to "Scenic routes and quiet roads",
                TypographyVariant.Opinion.Md to "A calmer planning voice",
                TypographyVariant.Opinion.Sm to "Small editorial supporting copy",
            ),
        )
        TextFamilySection(
            title = "UI",
            rows = listOf(
                TypographyVariant.Ui.Title.Lg to "Route details",
                TypographyVariant.Ui.Title.Md to "Saved rides",
                TypographyVariant.Ui.Title.Sm to "Nearby loops",
                TypographyVariant.Ui.Body.Lg to "Plan a day ride through canyon roads.",
                TypographyVariant.Ui.Body.Md to "Continue",
                TypographyVariant.Ui.Body.Sm to "Last updated just now",
                TypographyVariant.Ui.Label.Lg to "BEST ROUTE",
                TypographyVariant.Ui.Label.Md to "WEATHER",
                TypographyVariant.Ui.Label.Sm to "ETA",
            ),
        )
        TextFamilySection(
            title = "Instrument",
            rows = listOf(
                TypographyVariant.Instrument.Lg to "64 mi",
                TypographyVariant.Instrument.Md to "2h 10m",
                TypographyVariant.Instrument.Sm to "8:45 AM",
                TypographyVariant.Instrument.Xs to "+1,240 ft",
            ),
        )
    }
}

@Composable
private fun TextFamilySection(
    title: String,
    rows: List<Pair<TypographyVariant, String>>,
) {
    val theme = LocalLaneShadowTheme.current

    Column(verticalArrangement = Arrangement.spacedBy(theme.space.sm)) {
        LSText(
            text = title,
            variant = TypographyVariant.Ui.Label.Md,
            color = ContentColor.Secondary,
        )
        rows.forEach { (variant, sample) ->
            LSText(
                text = sample,
                variant = variant,
            )
        }
    }
}
