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
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LaneShadowSizing
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

val LSListRowMinHeightKey = SemanticsPropertyKey<Dp>("LSListRowMinHeight")
val LSListRowGapKey = SemanticsPropertyKey<Dp>("LSListRowGap")
val LSListRowVerticalPaddingKey = SemanticsPropertyKey<Dp>("LSListRowVerticalPadding")
val LSListRowSubtitleVariantKey = SemanticsPropertyKey<String>("LSListRowSubtitleVariant")
val LSListRowChevronSizeKey = SemanticsPropertyKey<Dp>("LSListRowChevronSize")
val LSListRowLeadingTypeKey = SemanticsPropertyKey<String>("LSListRowLeadingType")
val LSListRowTrailingTypeKey = SemanticsPropertyKey<String>("LSListRowTrailingType")

private var SemanticsPropertyReceiver.lsListRowMinHeight by LSListRowMinHeightKey
private var SemanticsPropertyReceiver.lsListRowGap by LSListRowGapKey
private var SemanticsPropertyReceiver.lsListRowVerticalPadding by LSListRowVerticalPaddingKey
private var SemanticsPropertyReceiver.lsListRowSubtitleVariant by LSListRowSubtitleVariantKey
private var SemanticsPropertyReceiver.lsListRowChevronSize by LSListRowChevronSizeKey
private var SemanticsPropertyReceiver.lsListRowLeadingType by LSListRowLeadingTypeKey
private var SemanticsPropertyReceiver.lsListRowTrailingType by LSListRowTrailingTypeKey

@Immutable
sealed interface LSListRowLeading {
    @Immutable
    data class Avatar(
        val initials: String,
        val size: AvatarSize = AvatarSize.Sm,
    ) : LSListRowLeading

    @Immutable
    data class Icon(
        val name: IconName,
        val contentDescription: String? = null,
    ) : LSListRowLeading
}

@Immutable
sealed interface LSListRowTrailing {
    @Immutable
    data object Chevron : LSListRowTrailing
    @Immutable
    data class Label(val text: String) : LSListRowTrailing
    @Immutable
    data class Button(val label: String) : LSListRowTrailing
    @Immutable
    data class Icon(
        val name: IconName,
        val contentDescription: String? = null,
    ) : LSListRowTrailing
    @Immutable
    data class Toggle(val checked: Boolean) : LSListRowTrailing
}

@Immutable
data class LSListRowStyle(
    val minHeight: Dp,
    val horizontalPadding: Dp,
    val verticalPadding: Dp,
    val rowGap: Dp,
    val titleVariant: TypographyVariant,
    val subtitleVariant: TypographyVariant,
    val chevronSize: IconSize,
    val trailingButtonBackgroundColor: Color,
    val trailingButtonBorderColor: Color,
    val trailingButtonBorderWidth: Dp,
)

fun resolveLSListRowStyle(theme: LaneShadowThemeValues): LSListRowStyle =
    LSListRowStyle(
        minHeight = theme.sizing.touchTarget,
        horizontalPadding = theme.space.lg,
        verticalPadding = theme.space.xs,
        rowGap = theme.space.sm,
        titleVariant = TypographyVariant.Ui.Body.Md,
        subtitleVariant = TypographyVariant.Ui.Body.Md,
        chevronSize = IconSize.Md,
        trailingButtonBackgroundColor = theme.colors.surfaceVariant.default,
        trailingButtonBorderColor = theme.colors.border.default,
        trailingButtonBorderWidth = GeneratedTokens.sizing.stroke.sm,
    )

internal val LaneShadowSizing.touchTarget: Dp
    get() = 48.dp

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
    val style = resolveLSListRowStyle(theme)

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = style.minHeight)
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
                .padding(horizontal = style.horizontalPadding, vertical = style.verticalPadding)
                .semantics {
                    lsListRowMinHeight = style.minHeight
                    lsListRowGap = style.rowGap
                    lsListRowVerticalPadding = style.verticalPadding
                    lsListRowSubtitleVariant = "Ui.Body.Md"
                    lsListRowChevronSize = style.chevronSize.resolve(theme)
                    lsListRowLeadingType = leading::class.simpleName.orEmpty()
                    lsListRowTrailingType = trailing::class.simpleName.orEmpty()
                },
            horizontalArrangement = Arrangement.spacedBy(style.rowGap),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            LeadingSlot(leading)

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                LSLabel(
                    text = title,
                    variant = style.titleVariant,
                    color = ContentColor.Primary,
                )
                subtitle?.let {
                    LSLabel(
                        text = it,
                        variant = style.subtitleVariant,
                        color = ContentColor.Secondary,
                    )
                }
            }

            TrailingSlot(trailing = trailing, style = style)
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
private fun TrailingSlot(
    trailing: LSListRowTrailing,
    style: LSListRowStyle,
) {
    when (trailing) {
        LSListRowTrailing.Chevron -> LSIcon(
            name = IconName.ChevR,
            size = IconSize.Md,
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
                backgroundColor = style.trailingButtonBackgroundColor,
                cornerRadius = theme.radius.full,
                shadowElevation = theme.elevation.light.level0,
                contentPadding = theme.space.sm,
                border = BorderStroke(style.trailingButtonBorderWidth, style.trailingButtonBorderColor),
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
