package com.laneshadow.ui.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

/**
 * LSEmptyState molecule component
 *
 * Empty state molecule composing LSIcon, LSText title/body, and optional LSButton action.
 * Follows the design spec at .spec/design/system/molecules/empty-state/
 *
 * @param icon Optional icon for the empty state
 * @param title Title text
 * @param body Body text
 * @param actionText Optional action button text
 * @param onAction Optional callback when action button is clicked
 * @param modifier Modifier for the empty state container
 */
@Composable
fun LSEmptyState(
    icon: IconName? = null,
    title: String,
    body: String,
    actionText: String? = null,
    onAction: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        // Optional icon
        icon?.let { iconName ->
            LSIcon(
                name = iconName,
                size = IconSize.Xl,
                color = IconColor.Content(ContentColor.Subtle),
            )
        }

        // Title
        LSText(
            text = title,
            variant = TypographyVariant.Ui.Title.Md,
            color = ContentColor.Primary,
        )

        // Body
        LSText(
            text = body,
            variant = TypographyVariant.Ui.Body.Md,
            color = ContentColor.Secondary,
        )

        // Optional action button
        if (actionText != null && onAction != null) {
            LSButton(
                label = actionText,
                variant = ButtonVariant.Primary,
                onClick = onAction,
            )
        }
    }
}
