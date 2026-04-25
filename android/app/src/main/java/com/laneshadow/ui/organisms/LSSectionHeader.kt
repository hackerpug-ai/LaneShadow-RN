package com.laneshadow.ui.organisms

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

// Test tags
const val LSSECTIONHEADER_TAG = "ls-section-header"
const val LSSECTIONHEADER_TITLE_TAG = "ls-section-header-title"
const val LSSECTIONHEADER_TRAILING_TAG = "ls-section-header-trailing"

/**
 * LSSectionHeader organism - section title with optional trailing action.
 *
 * @param title Section title text
 * @param trailing Optional trailing slot (None or Link)
 * @param insetOverride Optional custom inset (defaults to theme.space.md = 12pt/spacing.3)
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSSectionHeader(
    title: String,
    trailing: SectionHeaderTrailing = SectionHeaderTrailing.None,
    insetOverride: Dp? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val inset = insetOverride ?: theme.space.md // Default to spacing.3 (12pt)

    Row(
        modifier = modifier
            .padding(start = inset)
            .testTag(LSSECTIONHEADER_TAG),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        // Leading title
        LSText(
            text = title,
            variant = TypographyVariant.Ui.Title.Md,
            color = ContentColor.Primary,
            modifier = Modifier
                .testTag(LSSECTIONHEADER_TITLE_TAG)
                .semantics { contentDescription = "Section: $title" },
        )

        // Optional trailing slot
        when (trailing) {
            SectionHeaderTrailing.None -> {
                // No trailing content
            }
            is SectionHeaderTrailing.Link -> {
                TrailingLink(
                    label = trailing.label,
                    onTap = trailing.onTap,
                    modifier = Modifier.testTag(LSSECTIONHEADER_TRAILING_TAG),
                )
            }
        }
    }
}

/**
 * Convenience overload for caps-label style (used in drawers).
 *
 * @param title Section title in ALL CAPS
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSSectionHeader(
    title: String,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .padding(start = theme.space.md) // Default to spacing.3 (12pt)
            .testTag(LSSECTIONHEADER_TAG),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        // Leading title in caps style
        LSText(
            text = title,
            variant = TypographyVariant.Ui.Label.Sm,
            color = ContentColor.Subtle,
            modifier = Modifier
                .testTag(LSSECTIONHEADER_TITLE_TAG)
                .semantics { contentDescription = "Section: $title" },
        )
    }
}

/**
 * Trailing "See all" link with chevron icon.
 */
@Composable
private fun TrailingLink(
    label: String,
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .clickable(onClick = onTap)
            .semantics { contentDescription = "View all: $label" },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        LSText(
            text = label,
            variant = TypographyVariant.Ui.Body.Sm,
            color = TextColor.Signal, // Signal color (copper)
        )

        LSIcon(
            name = IconName.ChevR,
            size = IconSize.Xs,
            color = IconColor.Signal,
            modifier = Modifier.semantics { contentDescription = "Chevron right" },
        )
    }
}
