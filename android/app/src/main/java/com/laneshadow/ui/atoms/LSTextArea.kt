package com.laneshadow.ui.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.editableText
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import kotlin.math.max
import kotlin.math.min

val LSTextAreaVisibleRowsKey = SemanticsPropertyKey<Int>("LSTextAreaVisibleRows")
val LSTextAreaMaxRowsKey = SemanticsPropertyKey<Int>("LSTextAreaMaxRows")
val LSTextAreaScrollEnabledKey = SemanticsPropertyKey<Boolean>("LSTextAreaScrollEnabled")
val LSTextAreaSingleLineKey = SemanticsPropertyKey<Boolean>("LSTextAreaSingleLine")

private var SemanticsPropertyReceiver.lsTextAreaVisibleRows by LSTextAreaVisibleRowsKey
private var SemanticsPropertyReceiver.lsTextAreaMaxRows by LSTextAreaMaxRowsKey
private var SemanticsPropertyReceiver.lsTextAreaScrollEnabled by LSTextAreaScrollEnabledKey
private var SemanticsPropertyReceiver.lsTextAreaSingleLine by LSTextAreaSingleLineKey

@Composable
fun LSTextArea(
    value: String,
    onValueChange: (String) -> Unit,
    state: InputState = InputState.Default,
    maxRows: Int = 6,
    placeholder: String? = null,
    modifier: Modifier = Modifier,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
) {
    val theme = LocalLaneShadowTheme.current
    val padding = resolveLSInputPadding(theme)
    val cornerRadius = resolveLSInputCornerRadius(theme)
    val effectiveMaxRows = resolveLSTextAreaMaxRows(maxRows)
    val visibleRows = resolveLSTextAreaVisibleRows(value, effectiveMaxRows)
    val scrollEnabled = lsTextAreaIsScrollable(value, effectiveMaxRows)
    val textStyle = theme.typography.ui.body.md
    val density = LocalDensity.current
    val rowHeight = resolveLSTextAreaRowHeight(textStyle)
    val maxHeight = with(density) {
        rowHeight.toDp() * effectiveMaxRows + padding.calculateTopPadding() + padding.calculateBottomPadding()
    }
    val scrollState = rememberScrollState()
    var isFocused by remember { mutableStateOf(state == InputState.Focused) }
    val visualState = resolveLSInputVisualState(state, isFocused)
    val borderColor = resolveLSInputBorderColor(theme, visualState)
    val isEnabled = visualState != InputState.Disabled

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = LaneShadowInputMinHeight, max = maxHeight)
            .semantics(mergeDescendants = true) {
                contentDescription = placeholder ?: "Text area"
                editableText = AnnotatedString(value)
                stateDescription = visualState.name
                if (!isEnabled) {
                    disabled()
                }
                lsInputBorderColor = borderColor
                lsInputCornerRadius = cornerRadius
                lsInputHorizontalPadding = padding.calculateLeftPadding(androidx.compose.ui.unit.LayoutDirection.Ltr)
                lsInputVerticalPadding = padding.calculateTopPadding()
                lsInputVisualState = visualState.name
                lsTextAreaVisibleRows = visibleRows
                lsTextAreaMaxRows = effectiveMaxRows
                lsTextAreaScrollEnabled = scrollEnabled
                lsTextAreaSingleLine = lsTextAreaIsSingleLine()
            },
        color = theme.colors.input.default,
        shape = RoundedCornerShape(cornerRadius),
        border = BorderStroke(1.dp, borderColor),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = LaneShadowInputMinHeight, max = maxHeight)
                .verticalScroll(scrollState)
                .padding(padding),
            contentAlignment = Alignment.TopStart,
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
                singleLine = false,
                minLines = 1,
                maxLines = effectiveMaxRows,
                textStyle = textStyle.copy(color = ContentColor.Primary.resolve(theme)),
                cursorBrush = SolidColor(borderColor),
                keyboardOptions = keyboardOptions,
                keyboardActions = keyboardActions,
            )
        }
    }
}

internal fun resolveLSTextAreaMaxRows(maxRows: Int): Int = maxRows.coerceAtLeast(1)

internal fun lsTextAreaIsSingleLine(): Boolean = false

internal fun resolveLSTextAreaVisibleRows(
    value: String,
    maxRows: Int,
): Int = min(max(lsTextAreaLineCount(value), 1), resolveLSTextAreaMaxRows(maxRows))

internal fun lsTextAreaIsScrollable(
    value: String,
    maxRows: Int,
): Boolean = lsTextAreaLineCount(value) > resolveLSTextAreaMaxRows(maxRows)

private fun lsTextAreaLineCount(value: String): Int = if (value.isEmpty()) 1 else value.lineSequence().count()

private fun resolveLSTextAreaRowHeight(textStyle: TextStyle) =
    textStyle.lineHeight.takeIf { it.value > 0f } ?: textStyle.fontSize
