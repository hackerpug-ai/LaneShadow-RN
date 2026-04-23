package com.laneshadow.ui.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.editableText
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

typealias LSIconAsset = IconName

val LSInputBorderColorKey = SemanticsPropertyKey<Color>("LSInputBorderColor")
val LSInputCornerRadiusKey = SemanticsPropertyKey<Dp>("LSInputCornerRadius")
val LSInputHorizontalPaddingKey = SemanticsPropertyKey<Dp>("LSInputHorizontalPadding")
val LSInputVerticalPaddingKey = SemanticsPropertyKey<Dp>("LSInputVerticalPadding")
val LSInputVisualStateKey = SemanticsPropertyKey<String>("LSInputVisualState")
val LSTextFieldSingleLineKey = SemanticsPropertyKey<Boolean>("LSTextFieldSingleLine")

internal var SemanticsPropertyReceiver.lsInputBorderColor by LSInputBorderColorKey
internal var SemanticsPropertyReceiver.lsInputCornerRadius by LSInputCornerRadiusKey
internal var SemanticsPropertyReceiver.lsInputHorizontalPadding by LSInputHorizontalPaddingKey
internal var SemanticsPropertyReceiver.lsInputVerticalPadding by LSInputVerticalPaddingKey
internal var SemanticsPropertyReceiver.lsInputVisualState by LSInputVisualStateKey
internal var SemanticsPropertyReceiver.lsTextFieldSingleLine by LSTextFieldSingleLineKey

internal val LaneShadowInputMinHeight = 48.dp
private val LaneShadowInputBorderWidth = 1.dp

@Composable
fun LSTextField(
    value: String,
    onValueChange: (String) -> Unit,
    state: InputState = InputState.Default,
    placeholder: String? = null,
    leadingIcon: LSIconAsset? = null,
    trailingIcon: LSIconAsset? = null,
    modifier: Modifier = Modifier,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val theme = LocalLaneShadowTheme.current
    val padding = resolveLSInputPadding(theme)
    val cornerRadius = resolveLSInputCornerRadius(theme)
    val contentColor = ContentColor.Primary.resolve(theme)
    val placeholderColor = ContentColor.Subtle.resolve(theme)
    var isFocused by remember { mutableStateOf(state == InputState.Focused) }
    val visualState = resolveLSInputVisualState(state, isFocused)
    val borderColor = resolveLSInputBorderColor(theme, visualState)
    val isEnabled = visualState != InputState.Disabled

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = LaneShadowInputMinHeight)
            .semantics(mergeDescendants = true) {
                contentDescription = placeholder ?: "Text field"
                editableText = AnnotatedString(value)
                stateDescription = visualState.name
                if (!isEnabled) {
                    disabled()
                }
                lsInputBorderColor = borderColor
                lsInputCornerRadius = cornerRadius
                lsInputHorizontalPadding = padding.calculateLeftPadding(LayoutDirection.Ltr)
                lsInputVerticalPadding = padding.calculateTopPadding()
                lsInputVisualState = visualState.name
                lsTextFieldSingleLine = true
            },
        color = theme.colors.input.default,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(cornerRadius),
        border = BorderStroke(LaneShadowInputBorderWidth, borderColor),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(padding),
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            leadingIcon?.let { icon ->
                LSIcon(
                    name = icon,
                    size = IconSize.Sm,
                    color = IconColor.Content(
                        if (visualState == InputState.Error) ContentColor.Error else ContentColor.Secondary,
                    ),
                )
            }

            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.CenterStart,
            ) {
                if (value.isEmpty() && placeholder != null) {
                    LSText(
                        text = placeholder,
                        variant = TypographyVariant.Ui.Body.Md,
                        color = ContentColor.Subtle,
                    )
                }

                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { isFocused = it.isFocused },
                    enabled = isEnabled,
                    singleLine = true,
                    textStyle = theme.typography.ui.body.md.copy(color = contentColor),
                    cursorBrush = SolidColor(if (visualState == InputState.Error) borderColor else placeholderColor),
                    keyboardOptions = keyboardOptions,
                    keyboardActions = keyboardActions,
                    visualTransformation = visualTransformation,
                )
            }

            trailingIcon?.let { icon ->
                LSIcon(
                    name = icon,
                    size = IconSize.Sm,
                    color = IconColor.Content(
                        if (visualState == InputState.Error) ContentColor.Error else ContentColor.Secondary,
                    ),
                    modifier = Modifier.size(theme.sizing.icon.sm),
                )
            }
        }
    }
}

internal fun resolveLSInputPadding(theme: LaneShadowThemeValues): PaddingValues =
    PaddingValues(horizontal = theme.space.md, vertical = theme.space.md)

internal fun resolveLSInputCornerRadius(theme: LaneShadowThemeValues): Dp = theme.radius.sm

internal fun resolveLSInputVisualState(
    requestedState: InputState,
    isFocused: Boolean,
): InputState =
    when {
        requestedState == InputState.Disabled -> InputState.Disabled
        requestedState == InputState.Error -> InputState.Error
        requestedState == InputState.Focused || isFocused -> InputState.Focused
        else -> InputState.Default
    }

internal fun resolveLSInputBorderColor(
    theme: LaneShadowThemeValues,
    state: InputState,
): Color =
    when (state) {
        InputState.Default -> theme.colors.border.default
        InputState.Focused -> theme.colors.border.focus ?: theme.colors.ring.default
        InputState.Error -> theme.colors.danger.default
        InputState.Disabled -> theme.colors.border.disabled ?: theme.colors.border.default
    }
