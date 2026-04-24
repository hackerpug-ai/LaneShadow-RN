package com.laneshadow.ui.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

const val LSLocationContextBarTag = "ls-location-context-bar"
const val LSLocationContextBarLocationPillTag = "ls-location-context-bar-location-pill"
const val LSLocationContextBarModePillTag = "ls-location-context-bar-mode-pill"

val LSLocationContextBarArrangementKey = SemanticsPropertyKey<String>("LSLocationContextBarArrangement")
val LSLocationContextBarHorizontalPaddingKey = SemanticsPropertyKey<Dp>("LSLocationContextBarHorizontalPadding")

private var SemanticsPropertyReceiver.lsLocationContextBarArrangement by LSLocationContextBarArrangementKey
private var SemanticsPropertyReceiver.lsLocationContextBarHorizontalPadding by LSLocationContextBarHorizontalPaddingKey

private const val SpaceBetweenValue = "SpaceBetween"
private val LocationPillMaxWidth = 260.dp

private val LocationMode.label: String
    get() = if (this == LocationMode.Auto) "AUTO" else "MANUAL"

private val LocationMode.accentColor: AccentColor
    get() = if (this == LocationMode.Manual) AccentColor.Signal else AccentColor.Muted

@Composable
fun LSLocationContextBar(
    location: String,
    mode: LocationMode,
    onModeChange: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = theme.space.sm)
            .semantics {
                lsLocationContextBarArrangement = SpaceBetweenValue
                lsLocationContextBarHorizontalPadding = theme.space.sm
            }
            .testTag(LSLocationContextBarTag),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        LSTagPill(
            label = location,
            modifier = Modifier
                .widthIn(max = LocationPillMaxWidth)
                .testTag(LSLocationContextBarLocationPillTag),
        )

        LSTagPill(
            label = mode.label,
            icon = null,
            accent = mode.accentColor,
            modifier = Modifier
                .testTag(LSLocationContextBarModePillTag)
                .semantics {
                    role = Role.Button
                    contentDescription = "Location mode: ${mode.label}"
                }
                .clickable(onClick = onModeChange),
        )
    }
}
