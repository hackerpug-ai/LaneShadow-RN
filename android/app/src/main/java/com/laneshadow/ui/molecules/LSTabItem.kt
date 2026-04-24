package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.atoms.resolve

/**
 * LSTabItem molecule component
 *
 * Tab item molecule composing LSIcon, LSText label, and optional indicator bar.
 * Follows the design spec at .spec/design/system/molecules/tab-item/
 *
 * @param icon Tab icon
 * @param label Tab label text
 * @param selected Whether this tab is selected
 * @param modifier Modifier for the tab item container
 */
@Composable
fun LSTabItem(
    icon: IconName,
    label: String,
    selected: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val contentColor = if (selected) ContentColor.Signal else ContentColor.Tertiary

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        // Icon + label row
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            LSIcon(
                name = icon,
                size = IconSize.Md,
                color = IconColor.Content(contentColor),
            )

            LSText(
                text = label,
                variant = TypographyVariant.Ui.Label.Sm,
                color = contentColor,
            )
        }

        // Selected indicator bar (only when selected)
        if (selected) {
            val indicatorColor = contentColor.resolve(theme)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp)
                    .background(
                        color = indicatorColor,
                        shape = RoundedCornerShape(1.dp),
                    ),
            )
        }
    }
}
