package com.laneshadow.ui.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.AvatarSize
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSAvatar
import com.laneshadow.ui.atoms.LSCard
import com.laneshadow.ui.atoms.LSDivider
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.atoms.LSText as LSLabel

sealed interface LSListRowLeading {
    data class Avatar(
        val initials: String,
        val size: AvatarSize = AvatarSize.Sm,
    ) : LSListRowLeading

    data class Icon(
        val name: IconName,
        val contentDescription: String? = null,
    ) : LSListRowLeading
}

sealed interface LSListRowTrailing {
    data object Chevron : LSListRowTrailing
    data class Label(val text: String) : LSListRowTrailing
    data class Button(val label: String) : LSListRowTrailing
    data class Icon(
        val name: IconName,
        val contentDescription: String? = null,
    ) : LSListRowTrailing
    data class Toggle(val checked: Boolean) : LSListRowTrailing
}

private val LSListRowMinHeight = 44.dp

@Composable
fun LSListRow(
    title: String,
    subtitle: String? = null,
    leading: LSListRowLeading,
    trailing: LSListRowTrailing = LSListRowTrailing.Chevron,
    onTap: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    showDivider: Boolean = false,
) {
    val theme = LocalLaneShadowTheme.current

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = LSListRowMinHeight)
                .then(
                    if (onTap != null) {
                        Modifier
                            .clickable(onClick = onTap)
                            .semantics {
                                role = Role.Button
                                contentDescription = "$title row"
                            }
                    } else {
                        Modifier
                    },
                )
                .padding(horizontal = theme.space.lg, vertical = theme.space.xs),
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            LeadingSlot(leading)

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                LSLabel(
                    text = title,
                    variant = TypographyVariant.Ui.Body.Md,
                    color = ContentColor.Primary,
                )
                subtitle?.let {
                    LSLabel(
                        text = it,
                        variant = TypographyVariant.Ui.Label.Sm,
                        color = ContentColor.Secondary,
                    )
                }
            }

            TrailingSlot(trailing)
        }

        if (showDivider) {
            LSDivider()
        }
    }
}

@Composable
private fun LeadingSlot(leading: LSListRowLeading) {
    when (leading) {
        is LSListRowLeading.Avatar -> {
            LSAvatar(
                initials = leading.initials,
                size = leading.size,
            )
        }
        is LSListRowLeading.Icon -> {
            LSIcon(
                name = leading.name,
                size = IconSize.Sm,
                color = IconColor.Content(ContentColor.Secondary),
                contentDescription = leading.contentDescription,
            )
        }
    }
}

@Composable
private fun TrailingSlot(trailing: LSListRowTrailing) {
    when (trailing) {
        LSListRowTrailing.Chevron -> LSIcon(
            name = IconName.ChevR,
            size = IconSize.Sm,
            color = IconColor.Content(ContentColor.Subtle),
            contentDescription = "Open details",
        )
        is LSListRowTrailing.Label -> LSLabel(
            text = trailing.text,
            variant = TypographyVariant.Ui.Label.Sm,
            color = ContentColor.Subtle,
        )
        is LSListRowTrailing.Button -> {
            val theme = LocalLaneShadowTheme.current
            LSCard(
                backgroundColor = GeneratedTokens.color.Surface.inset,
                cornerRadius = theme.radius.full,
                shadowElevation = theme.elevation.light.level0,
                contentPadding = theme.space.sm,
                border = BorderStroke(GeneratedTokens.sizing.stroke.sm, theme.colors.border.default),
            ) {
                LSLabel(
                    text = trailing.label,
                    variant = TypographyVariant.Ui.Label.Sm,
                    color = ContentColor.Primary,
                )
            }
        }
        is LSListRowTrailing.Icon -> LSIcon(
            name = trailing.name,
            size = IconSize.Sm,
            color = IconColor.Content(ContentColor.Subtle),
            contentDescription = trailing.contentDescription,
        )
        is LSListRowTrailing.Toggle -> LSIcon(
            name = if (trailing.checked) IconName.CircleFill else IconName.Circle,
            size = IconSize.Sm,
            color = IconColor.Signal,
            contentDescription = "Toggle",
        )
    }
}
