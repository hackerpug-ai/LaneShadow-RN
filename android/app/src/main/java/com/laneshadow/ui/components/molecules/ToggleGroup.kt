package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * ToggleGroup selection type
 *
 * Following RN wrapper API from react-native/components/ui/toggle-group.tsx
 */
enum class ToggleGroupType {
    Single,
    Multiple,
}

/**
 * ToggleGroup size variants
 *
 * Following RN wrapper API from react-native/components/ui/toggle-group.tsx
 */
enum class ToggleSize {
    Sm,
    Default,
    Lg,
}

/**
 * ToggleGroup visual variants
 *
 * Following RN wrapper API from react-native/components/ui/toggle-group.tsx
 */
enum class ToggleVariant {
    Default,
    Outline,
}

/**
 * Internal data class to hold toggle group state for child items
 */
@Immutable
internal data class ToggleGroupState(
    val type: ToggleGroupType,
    val value: Any,
    val onValueChange: (Any) -> Unit,
    val variant: ToggleVariant,
    val size: ToggleSize,
    val disabled: Boolean,
)

/**
 * CompositionLocal to provide toggle group state to child items
 */
internal val LocalToggleGroupState = compositionLocalOf<ToggleGroupState?> { null }

/**
 * ToggleGroup molecule component
 *
 * Group of toggle buttons supporting single/multiple selection.
 * Following React Native wrapper patterns from react-native/components/ui/toggle-group.tsx
 *
 * ## Usage
 *
 * ```kotlin
 * // Single selection
 * var selected by remember { mutableStateOf("option1") }
 * ToggleGroup(
 *     type = ToggleGroupType.Single,
 *     value = selected,
 *     onValueChange = { selected = it },
 * ) {
 *     ToggleGroupItem(value = "option1") { Text("Option 1") }
 *     ToggleGroupItem(value = "option2") { Text("Option 2") }
 *     ToggleGroupItem(value = "option3") { Text("Option 3") }
 * }
 *
 * // Multiple selection
 * var selected by remember { mutableStateOf(listOf("option1", "option2")) }
 * ToggleGroup(
 *     type = ToggleGroupType.Multiple,
 *     value = selected,
 *     onValueChange = { selected = it as List<String> },
 * ) {
 *     ToggleGroupItem(value = "option1") { Text("Option 1") }
 *     ToggleGroupItem(value = "option2") { Text("Option 2") }
 *     ToggleGroupItem(value = "option3") { Text("Option 3") }
 * }
 * ```
 *
 * @param type Selection type (Single or Multiple)
 * @param value Current selected value(s) - String for Single, List<String> for Multiple
 * @param onValueChange Callback when selection changes
 * @param variant Visual variant (Default or Outline)
 * @param size Size variant (Sm, Default, or Lg)
 * @param disabled Whether the entire group is disabled
 * @param modifier Modifier for the group container
 * @param content Child ToggleGroupItem composables
 */
@Composable
fun ToggleGroup(
    type: ToggleGroupType = ToggleGroupType.Single,
    value: Any = "",
    onValueChange: (Any) -> Unit = {},
    variant: ToggleVariant = ToggleVariant.Default,
    size: ToggleSize = ToggleSize.Default,
    disabled: Boolean = false,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    // Create group state
    val groupState = ToggleGroupState(
        type = type,
        value = value,
        onValueChange = onValueChange,
        variant = variant,
        size = size,
        disabled = disabled,
    )

    // Container: Row with gap xs (4dp)
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Provide group state to children
        CompositionLocalProvider(LocalToggleGroupState provides groupState) {
            content()
        }
    }
}

/**
 * ToggleGroupItem component
 *
 * Individual toggle button within a ToggleGroup.
 * Must be a direct child of ToggleGroup.
 *
 * @param value Unique identifier for this item
 * @param modifier Modifier for the item
 * @param icon Optional icon composable to display before content
 * @param accessibilityLabel Optional accessibility label for screen readers
 * @param children Content composable for the item
 */
@Composable
fun ToggleGroupItem(
    value: String,
    modifier: Modifier = Modifier,
    icon: (@Composable () -> Unit)? = null,
    accessibilityLabel: String? = null,
    children: @Composable () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val groupState = LocalToggleGroupState.current

    // Ensure this item is used within a ToggleGroup
    if (groupState == null) {
        throw IllegalStateException("ToggleGroupItem must be a direct child of ToggleGroup")
    }

    // Determine if this item is selected
    val isSelected = when (groupState.type) {
        ToggleGroupType.Single -> groupState.value == value
        ToggleGroupType.Multiple -> {
            @Suppress("UNCHECKED_CAST")
            (groupState.value as? List<String>)?.contains(value) == true
        }
    }

    // Item heights: sm=36dp, default=40dp, lg=44dp
    val itemHeight: Dp = when (groupState.size) {
        ToggleSize.Sm -> 36.dp
        ToggleSize.Default -> 40.dp
        ToggleSize.Lg -> 44.dp
    }

    // Item padding: px md (12dp)
    val horizontalPadding = theme.space.md
    val verticalPadding = 4.dp

    // Item radius: md (8dp)
    val cornerRadius = theme.radius.md

    // Background color based on selection state
    val backgroundColor: Color = when {
        groupState.disabled -> theme.colors.muted.default.copy(alpha = 0.3f)
        isSelected -> theme.colors.accent.default
        else -> Color.Transparent
    }

    // Text color based on selection and disabled state
    val textColor: Color = when {
        groupState.disabled -> theme.colors.onSurface.default.copy(alpha = 0.5f)
        isSelected -> theme.colors.onSurface.default
        else -> theme.colors.onSurface.default
    }

    // Border for outline variant
    val border = when (groupState.variant) {
        ToggleVariant.Outline -> BorderStroke(
            width = 1.dp,
            color = if (groupState.disabled) {
                theme.colors.border.default.copy(alpha = 0.5f)
            } else {
                theme.colors.border.default
            }
        )
        ToggleVariant.Default -> null
    }

    // Opacity for disabled state
    val itemAlpha = if (groupState.disabled) 0.5f else 1.0f

    // Font size based on size variant
    val fontSize: TextStyle = when (groupState.size) {
        ToggleSize.Sm -> TextStyle(fontSize = 13.sp)
        ToggleSize.Default -> TextStyle(fontSize = 14.sp)
        ToggleSize.Lg -> TextStyle(fontSize = 15.sp)
    }

    // Build accessibility description
    val itemAccessibilityLabel = accessibilityLabel ?: value
    val interactionSource = remember { MutableInteractionSource() }

    // Clickable Surface
    Surface(
        modifier = modifier
            .semantics {
                contentDescription = itemAccessibilityLabel
            }
            .then(
                if (!groupState.disabled) {
                    Modifier.clickable(
                        interactionSource = interactionSource,
                        indication = null,
                        onClick = {
                            when (groupState.type) {
                                ToggleGroupType.Single -> {
                                    groupState.onValueChange(value)
                                }
                                ToggleGroupType.Multiple -> {
                                    @Suppress("UNCHECKED_CAST")
                                    val currentList = (groupState.value as? List<String>) ?: emptyList()
                                    val newList = if (currentList.contains(value)) {
                                        currentList - value
                                    } else {
                                        currentList + value
                                    }
                                    groupState.onValueChange(newList)
                                }
                            }
                        }
                    )
                } else {
                    Modifier
                }
            ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(cornerRadius),
        color = backgroundColor.copy(alpha = backgroundColor.alpha * itemAlpha),
        border = border,
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = horizontalPadding, vertical = verticalPadding),
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Optional icon
            if (icon != null) {
                Row(
                    modifier = Modifier.size(16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    icon()
                }
            }

            // Content text
            Text(
                text = value,
                style = fontSize,
                color = textColor.copy(alpha = textColor.alpha * itemAlpha),
            )
        }
    }
}
