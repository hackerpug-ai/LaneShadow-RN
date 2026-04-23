package com.laneshadow.ui.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

val LSButtonBackgroundColorKey = SemanticsPropertyKey<Color>("LSButtonBackgroundColor")
val LSButtonContentColorKey = SemanticsPropertyKey<Color>("LSButtonContentColor")
val LSButtonBorderColorKey = SemanticsPropertyKey<Color>("LSButtonBorderColor")
val LSButtonHeightKey = SemanticsPropertyKey<Dp>("LSButtonHeight")
val LSButtonTouchTargetKey = SemanticsPropertyKey<Dp>("LSButtonTouchTarget")
val LSButtonCornerRadiusKey = SemanticsPropertyKey<Dp>("LSButtonCornerRadius")
val LSButtonHorizontalPaddingKey = SemanticsPropertyKey<Dp>("LSButtonHorizontalPadding")
val LSButtonIconGapKey = SemanticsPropertyKey<Dp>("LSButtonIconGap")
val LSButtonVisualStateKey = SemanticsPropertyKey<String>("LSButtonVisualState")
val LSButtonLeadingIconNameKey = SemanticsPropertyKey<String>("LSButtonLeadingIconName")
val LSButtonTrailingIconNameKey = SemanticsPropertyKey<String>("LSButtonTrailingIconName")

private var SemanticsPropertyReceiver.lsButtonBackgroundColor by LSButtonBackgroundColorKey
private var SemanticsPropertyReceiver.lsButtonContentColor by LSButtonContentColorKey
private var SemanticsPropertyReceiver.lsButtonBorderColor by LSButtonBorderColorKey
private var SemanticsPropertyReceiver.lsButtonHeight by LSButtonHeightKey
private var SemanticsPropertyReceiver.lsButtonTouchTarget by LSButtonTouchTargetKey
private var SemanticsPropertyReceiver.lsButtonCornerRadius by LSButtonCornerRadiusKey
private var SemanticsPropertyReceiver.lsButtonHorizontalPadding by LSButtonHorizontalPaddingKey
private var SemanticsPropertyReceiver.lsButtonIconGap by LSButtonIconGapKey
private var SemanticsPropertyReceiver.lsButtonVisualState by LSButtonVisualStateKey
private var SemanticsPropertyReceiver.lsButtonLeadingIconName by LSButtonLeadingIconNameKey
private var SemanticsPropertyReceiver.lsButtonTrailingIconName by LSButtonTrailingIconNameKey

// The current theme module does not expose control/button sizing yet, so these mirror the
// live semantic token values used by the Android theme asset and concept reference.
internal val LaneShadowButtonHeight = 44.dp
internal val LaneShadowButtonMinTouchTarget = 44.dp
private val LaneShadowButtonBorderWidth = 1.dp

internal data class LSButtonVisualStyle(
    val backgroundColor: Color,
    val contentColor: ContentColor,
    val borderColor: Color = Color.Transparent,
    val borderWidth: Dp = 0.dp,
)

@Composable
fun LSButton(
    label: String,
    variant: ButtonVariant,
    state: ButtonState = ButtonState.Default,
    leadingIcon: IconName? = null,
    trailingIcon: IconName? = null,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val visualState = resolveLSButtonVisualState(state, isPressed)
    val style = resolveLSButtonVisualStyle(theme, variant, visualState)
    val horizontalPadding = theme.space.lg
    val iconGap = theme.space.sm
    val contentColor = style.contentColor.resolve(theme)
    val isInteractive = state != ButtonState.Disabled && state != ButtonState.Loading

    Surface(
        modifier = modifier
            .defaultMinSize(
                minWidth = LaneShadowButtonMinTouchTarget,
                minHeight = LaneShadowButtonMinTouchTarget,
            )
            .height(LaneShadowButtonHeight)
            .then(
                if (isInteractive) {
                    Modifier.clickable(
                        onClick = onClick,
                        interactionSource = interactionSource,
                        indication = null,
                    )
                } else {
                    Modifier
                }
            )
            .semantics {
                role = androidx.compose.ui.semantics.Role.Button
                if (state == ButtonState.Disabled) {
                    disabled()
                }
                lsButtonBackgroundColor = style.backgroundColor
                lsButtonContentColor = contentColor
                lsButtonBorderColor = style.borderColor
                lsButtonHeight = LaneShadowButtonHeight
                lsButtonTouchTarget = LaneShadowButtonMinTouchTarget
                lsButtonCornerRadius = theme.radius.md
                lsButtonHorizontalPadding = horizontalPadding
                lsButtonIconGap = iconGap
                lsButtonVisualState = visualState.name
                lsButtonLeadingIconName = leadingIcon?.value.orEmpty()
                lsButtonTrailingIconName = trailingIcon?.value.orEmpty()
            },
        shape = RoundedCornerShape(theme.radius.md),
        color = style.backgroundColor,
        border = style.borderWidth.takeIf { it > 0.dp }?.let { BorderStroke(it, style.borderColor) },
    ) {
        Row(
            modifier = Modifier.padding(horizontal = horizontalPadding),
            horizontalArrangement = Arrangement.spacedBy(iconGap, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            leadingIcon?.let { iconName ->
                LSIcon(
                    name = iconName,
                    size = IconSize.Sm,
                    color = IconColor.Content(style.contentColor),
                )
            }

            if (state == ButtonState.Loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(GeneratedTokens.sizing.icon.sm),
                    color = contentColor,
                    strokeWidth = theme.icon.stroke.width,
                )
            }

            LSText(
                text = label,
                variant = TypographyVariant.Ui.Title.Md,
                color = style.contentColor,
            )

            trailingIcon?.let { iconName ->
                LSIcon(
                    name = iconName,
                    size = IconSize.Sm,
                    color = IconColor.Content(style.contentColor),
                )
            }
        }
    }
}

internal fun resolveLSButtonVisualState(
    requestedState: ButtonState,
    isPressed: Boolean,
): ButtonState =
    when {
        requestedState == ButtonState.Disabled -> ButtonState.Disabled
        requestedState == ButtonState.Loading -> ButtonState.Loading
        isPressed -> ButtonState.Pressed
        requestedState == ButtonState.Hover -> ButtonState.Hover
        requestedState == ButtonState.Pressed -> ButtonState.Pressed
        else -> ButtonState.Default
    }

internal fun resolveLSButtonVisualStyle(
    theme: LaneShadowThemeValues,
    variant: ButtonVariant,
    state: ButtonState,
): LSButtonVisualStyle {
    val disabledAlpha = theme.opacity.values["disabled"] ?: 0.38f
    val hoverOverlayAlpha = theme.opacity.values["actionIdle"] ?: 0.2f
    val pressedOverlayAlpha = theme.opacity.values["actionPressed"] ?: 0.3f
    val effectiveState = if (state == ButtonState.Loading) ButtonState.Default else state

    return when (variant) {
        ButtonVariant.Primary -> {
            val background = when (effectiveState) {
                ButtonState.Default -> GeneratedTokens.color.Action.Primary.default
                ButtonState.Hover -> GeneratedTokens.color.Action.Primary.hover
                ButtonState.Pressed -> GeneratedTokens.color.Action.Primary.pressed
                ButtonState.Disabled -> GeneratedTokens.color.Action.Primary.default.copy(alpha = disabledAlpha)
                ButtonState.Loading -> GeneratedTokens.color.Action.Primary.default
            }
            LSButtonVisualStyle(
                backgroundColor = background,
                contentColor = if (effectiveState == ButtonState.Disabled) ContentColor.Subtle else ContentColor.OnSignal,
            )
        }
        ButtonVariant.Secondary -> {
            val background = when (effectiveState) {
                ButtonState.Default -> GeneratedTokens.color.Action.Secondary.default
                ButtonState.Hover -> GeneratedTokens.color.Action.Secondary.hover
                ButtonState.Pressed -> GeneratedTokens.color.Action.Secondary.pressed
                ButtonState.Disabled -> GeneratedTokens.color.Action.Secondary.default.copy(alpha = disabledAlpha)
                ButtonState.Loading -> GeneratedTokens.color.Action.Secondary.default
            }
            LSButtonVisualStyle(
                backgroundColor = background,
                contentColor = if (effectiveState == ButtonState.Disabled) ContentColor.Subtle else ContentColor.Primary,
                borderColor = theme.colors.border.default.copy(
                    alpha = if (effectiveState == ButtonState.Disabled) disabledAlpha else 1f,
                ),
                borderWidth = LaneShadowButtonBorderWidth,
            )
        }
        ButtonVariant.Tertiary -> {
            val background = when (effectiveState) {
                ButtonState.Default -> theme.colors.tertiary.default
                ButtonState.Hover -> overlayColor(theme.colors.tertiary.default, theme.colors.onSurface.default, hoverOverlayAlpha)
                ButtonState.Pressed -> overlayColor(theme.colors.tertiary.default, theme.colors.onSurface.default, pressedOverlayAlpha)
                ButtonState.Disabled -> theme.colors.tertiary.default.copy(alpha = disabledAlpha)
                ButtonState.Loading -> theme.colors.tertiary.default
            }
            LSButtonVisualStyle(
                backgroundColor = background,
                contentColor = if (effectiveState == ButtonState.Disabled) ContentColor.Subtle else ContentColor.OnSignal,
            )
        }
        ButtonVariant.Outline -> {
            val background = when (effectiveState) {
                ButtonState.Default, ButtonState.Disabled -> Color.Transparent
                ButtonState.Hover -> theme.colors.surfaceVariant.default.copy(alpha = hoverOverlayAlpha)
                ButtonState.Pressed -> theme.colors.surfaceVariant.default
                ButtonState.Loading -> Color.Transparent
            }
            LSButtonVisualStyle(
                backgroundColor = background,
                contentColor = if (effectiveState == ButtonState.Disabled) ContentColor.Subtle else ContentColor.Primary,
                borderColor = theme.colors.border.default.copy(
                    alpha = if (effectiveState == ButtonState.Disabled) disabledAlpha else 1f,
                ),
                borderWidth = LaneShadowButtonBorderWidth,
            )
        }
        ButtonVariant.Ghost -> {
            val background = when (effectiveState) {
                ButtonState.Default, ButtonState.Disabled -> Color.Transparent
                ButtonState.Hover -> theme.colors.surfaceVariant.default.copy(alpha = hoverOverlayAlpha)
                ButtonState.Pressed -> theme.colors.surfaceVariant.default
                ButtonState.Loading -> Color.Transparent
            }
            LSButtonVisualStyle(
                backgroundColor = background,
                contentColor = if (effectiveState == ButtonState.Disabled) ContentColor.Subtle else ContentColor.Primary,
            )
        }
        ButtonVariant.Destructive -> {
            val background = when (effectiveState) {
                ButtonState.Default -> theme.colors.danger.default
                ButtonState.Hover -> overlayColor(theme.colors.danger.default, theme.colors.onSurface.default, hoverOverlayAlpha)
                ButtonState.Pressed -> overlayColor(theme.colors.danger.default, theme.colors.onSurface.default, pressedOverlayAlpha)
                ButtonState.Disabled -> theme.colors.danger.default.copy(alpha = disabledAlpha)
                ButtonState.Loading -> theme.colors.danger.default
            }
            LSButtonVisualStyle(
                backgroundColor = background,
                contentColor = if (effectiveState == ButtonState.Disabled) ContentColor.Subtle else ContentColor.OnSignal,
            )
        }
    }
}

private fun overlayColor(
    base: Color,
    overlay: Color,
    alpha: Float,
): Color = overlay.copy(alpha = alpha).compositeOver(base)
