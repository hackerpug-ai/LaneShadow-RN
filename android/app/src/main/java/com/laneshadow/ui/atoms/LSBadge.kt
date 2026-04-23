package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import java.util.Locale

val LSBadgeBackgroundColorKey = SemanticsPropertyKey<Color>("LSBadgeBackgroundColor")
val LSBadgeForegroundColorKey = SemanticsPropertyKey<Color>("LSBadgeForegroundColor")
val LSBadgeBorderColorKey = SemanticsPropertyKey<Color>("LSBadgeBorderColor")
val LSBadgeBorderWidthKey = SemanticsPropertyKey<Dp>("LSBadgeBorderWidth")

private var SemanticsPropertyReceiver.lsBadgeBackgroundColor by LSBadgeBackgroundColorKey
private var SemanticsPropertyReceiver.lsBadgeForegroundColor by LSBadgeForegroundColorKey
private var SemanticsPropertyReceiver.lsBadgeBorderColor by LSBadgeBorderColorKey
private var SemanticsPropertyReceiver.lsBadgeBorderWidth by LSBadgeBorderWidthKey

internal val BadgeBorderWidth = Dp.Hairline

internal data class LSBadgeResolvedStyle(
    val backgroundColor: Color,
    val foregroundColor: Color,
    val borderColor: Color? = null,
    val borderWidth: Dp? = null,
    val leadingIcon: IconName? = null,
    val leadingIconColor: IconColor? = null,
    val iconSize: IconSize = IconSize.Xs,
)

@Composable
fun LSBadge(
    count: Int? = null,
    label: String? = null,
    variant: BadgeVariant,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val style = variant.resolveStyle(theme)
    val contentText = label?.takeIf { it.isNotBlank() } ?: count?.toString()
    val isCountOnly = count != null && label.isNullOrBlank()

    LSPill(
        size = PillSize.Sm,
        modifier = modifier.badgeSurface(
            theme = theme,
            backgroundColor = style.backgroundColor,
            foregroundColor = style.foregroundColor,
            borderColor = style.borderColor,
            borderWidth = style.borderWidth,
        ),
    ) {
        Row(
            modifier = Modifier
                .then(if (isCountOnly) Modifier.widthIn(min = 20.dp) else Modifier)
                .then(if (isCountOnly) Modifier else Modifier.padding(horizontal = theme.space.xs)),
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            if (style.leadingIcon != null && style.leadingIconColor != null) {
                LSIcon(
                    name = style.leadingIcon,
                    size = style.iconSize,
                    color = style.leadingIconColor,
                )
            }

            if (contentText != null) {
                Text(
                    text = contentText.uppercase(Locale.US),
                    style = TypographyVariant.Ui.Label.Sm.resolveTextStyle(theme),
                    color = style.foregroundColor,
                )
            }
        }
    }
}

internal fun Modifier.badgeSurface(
    theme: LaneShadowThemeValues,
    backgroundColor: Color,
    foregroundColor: Color,
    borderColor: Color? = null,
    borderWidth: Dp? = null,
): Modifier {
    val shape = RoundedCornerShape(theme.radius.full)

    return this
        .background(backgroundColor, shape)
        .then(
            if (borderColor != null && borderWidth != null) {
                Modifier.border(borderWidth, borderColor, shape)
            } else {
                Modifier
            }
        )
        .semantics {
            lsBadgeBackgroundColor = backgroundColor
            lsBadgeForegroundColor = foregroundColor
            if (borderColor != null && borderWidth != null) {
                lsBadgeBorderColor = borderColor
                lsBadgeBorderWidth = borderWidth
            }
        }
}

internal fun weatherBorderAlpha(theme: LaneShadowThemeValues): Float {
    val fifty = theme.opacity.values["50"] ?: 0.5f
    val sixty = theme.opacity.values["60"] ?: 0.6f
    return (fifty + sixty) / 2f
}
