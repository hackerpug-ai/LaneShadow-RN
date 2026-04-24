package com.laneshadow.ui.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.DividerOrientation
import com.laneshadow.ui.atoms.LSDivider
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

/**
 * LSInstrumentReadout molecule component
 *
 * Instrument readout grid showing numeric metrics with mono typography.
 * Follows the design spec at .spec/design/system/molecules/instrument-readout/
 *
 * @param metrics List of instrument metrics (label, value, optional accent)
 * @param modifier Modifier for the readout container
 */
@Composable
fun LSInstrumentReadout(
    metrics: List<InstrumentMetric>,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.padding(horizontal = theme.space.md),
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        // Top divider
        LSDivider(orientation = DividerOrientation.Horizontal)

        // Metric grid row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
        ) {
            metrics.forEach { metric ->
                MetricCell(
                    label = metric.label,
                    value = metric.value,
                    isAccent = metric.isAccent,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // Bottom divider
        LSDivider(orientation = DividerOrientation.Horizontal)
    }
}

/**
 * Individual metric cell with label and value
 */
@Composable
private fun MetricCell(
    label: String,
    value: String,
    isAccent: Boolean,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.padding(horizontal = theme.space.xs),
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        // Label
        LSText(
            text = label,
            variant = TypographyVariant.Ui.Label.Sm,
            color = ContentColor.Subtle,
        )

        // Value (with optional accent color)
        val valueColor =
            if (isAccent) {
                ContentColor.Primary
            } else {
                ContentColor.Primary
            }

        LSText(
            text = value,
            variant = TypographyVariant.Instrument.Lg,
            color = valueColor,
        )
    }
}
