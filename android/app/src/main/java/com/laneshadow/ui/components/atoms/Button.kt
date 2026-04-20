package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.BorderStroke as ComposeBorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Button size variants
 *
 * Following RN wrapper API from react-native/components/ui/button.tsx
 */
enum class ButtonSize {
    Small,
    Default,
    Large,
    XL,
    XXL,
    Icon,
}

/**
 * Button variant types
 *
 * Following RN wrapper API from react-native/components/ui/button.tsx
 */
enum class ButtonVariant {
    Default,
    Secondary,
    Outline,
    Ghost,
    Destructive,
    Link,
    Glass,
}

/**
 * Icon position for button content
 *
 * Following RN wrapper API from react-native/components/ui/button.tsx
 */
enum class IconPosition {
    Left,
    Right,
}

/**
 * Button dimension constants
 *
 * Documented against Button.md matrix values:
 * - sm: 36dp height, 12dp h-padding, 8dp radius
 * - default: 40dp height, 16dp h-padding, 8dp radius
 * - lg: 44dp height, 32dp h-padding, 8dp radius
 * - xl: 48dp height, 16dp h-padding, 16dp radius
 * - 2xl: 56dp height, 16dp h-padding, 24dp radius
 * - icon: 40×40dp, 0 padding, CircleShape radius
 */
private val BUTTON_HEIGHT_SMALL = 36.dp
private val BUTTON_HEIGHT_DEFAULT = 40.dp
private val BUTTON_HEIGHT_LARGE = 44.dp
private val BUTTON_HEIGHT_XL = 48.dp
private val BUTTON_HEIGHT_XXL = 56.dp
private val BUTTON_HEIGHT_ICON = 40.dp

private val BUTTON_PADDING_HORIZONTAL_SMALL = 12.dp
private val BUTTON_PADDING_HORIZONTAL_DEFAULT = 16.dp
private val BUTTON_PADDING_HORIZONTAL_LARGE = 32.dp
private val BUTTON_PADDING_HORIZONTAL_XL = 16.dp
private val BUTTON_PADDING_HORIZONTAL_XXL = 16.dp
private val BUTTON_PADDING_HORIZONTAL_ICON = 0.dp

/**
 * Disabled opacity constant
 *
 * Following RN wrapper behavior: disabled buttons have 0.5 opacity
 */
private const val BUTTON_DISABLED_OPACITY = 0.5f

/**
 * Button component
 *
 * Following RN wrapper API from react-native/components/ui/button.tsx
 *
 * @param variant Button color variant (default, secondary, outline, ghost, destructive, link, glass)
 * @param size Button size variant (small, default, large, xl, xxl, icon)
 * @param onPress Callback when button is pressed (null makes button non-interactive)
 * @param disabled Whether button is disabled (adds opacity and prevents interaction)
 * @param loading Whether button is in loading state (shows progress indicator)
 * @param icon Optional icon composable to display
 * @param iconPosition Position of icon relative to text (left or right)
 * @param accessibilityLabel Accessibility label for screen readers
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the button container
 * @param content Text content composable (optional for icon-only buttons)
 */
@Suppress("UNUSED_PARAMETER")
@Composable
fun Button(
    variant: ButtonVariant = ButtonVariant.Default,
    size: ButtonSize = ButtonSize.Default,
    onPress: (() -> Unit)? = null,
    disabled: Boolean = false,
    loading: Boolean = false,
    icon: @Composable (() -> Unit)? = null,
    iconPosition: IconPosition = IconPosition.Left,
    accessibilityLabel: String? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
    content: @Composable (() -> Unit)? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Determine if button should be disabled (loading also disables)
    val isDisabled = disabled || loading || onPress == null

    // Get button dimensions based on size
    val buttonHeight: Dp = when (size) {
        ButtonSize.Small -> BUTTON_HEIGHT_SMALL
        ButtonSize.Default -> BUTTON_HEIGHT_DEFAULT
        ButtonSize.Large -> BUTTON_HEIGHT_LARGE
        ButtonSize.XL -> BUTTON_HEIGHT_XL
        ButtonSize.XXL -> BUTTON_HEIGHT_XXL
        ButtonSize.Icon -> BUTTON_HEIGHT_ICON
    }

    val horizontalPadding: Dp = when (size) {
        ButtonSize.Small -> BUTTON_PADDING_HORIZONTAL_SMALL
        ButtonSize.Default -> BUTTON_PADDING_HORIZONTAL_DEFAULT
        ButtonSize.Large -> BUTTON_PADDING_HORIZONTAL_LARGE
        ButtonSize.XL -> BUTTON_PADDING_HORIZONTAL_XL
        ButtonSize.XXL -> BUTTON_PADDING_HORIZONTAL_XXL
        ButtonSize.Icon -> BUTTON_PADDING_HORIZONTAL_ICON
    }

    val buttonRadius: Shape = when (size) {
        ButtonSize.Small -> androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.sm)
        ButtonSize.Default -> androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.md)
        ButtonSize.Large -> androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.md)
        ButtonSize.XL -> androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.xl)
        ButtonSize.XXL -> androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.xxl)
        ButtonSize.Icon -> CircleShape
    }

    // Get colors based on variant
    val backgroundColor = when (variant) {
        ButtonVariant.Default -> theme.colors.primary.default
        ButtonVariant.Secondary -> theme.colors.secondary.default
        ButtonVariant.Destructive -> theme.colors.danger.default
        ButtonVariant.Outline -> Color.Transparent
        ButtonVariant.Ghost -> Color.Transparent
        ButtonVariant.Link -> Color.Transparent
        ButtonVariant.Glass -> theme.colors.surfaceVariant.default
    }

    val textColor = when (variant) {
        ButtonVariant.Default -> theme.colors.onSurface.default
        ButtonVariant.Secondary -> theme.colors.onSecondary.default
        ButtonVariant.Destructive -> theme.colors.onSurface.default
        ButtonVariant.Outline -> theme.colors.onSurface.default
        ButtonVariant.Ghost -> theme.colors.onSurface.default
        ButtonVariant.Link -> theme.colors.primary.default
        ButtonVariant.Glass -> theme.colors.onSurface.default
    }

    val border: BorderStroke? = when (variant) {
        ButtonVariant.Outline -> BorderStroke(1.dp, theme.colors.border.default)
        ButtonVariant.Glass -> BorderStroke(1.dp, theme.colors.border.default)
        else -> null
    }

    // Build semantics
    val buttonModifier = modifier
        .semantics {
            role = Role.Button
            if (isDisabled) {
                disabled()
            }
        }
        .then(
            if (!isDisabled && onPress != null) {
                Modifier.clickable(onClick = onPress)
            } else {
                Modifier
            }
        )

    // Apply disabled opacity
    val appliedModifier = if (isDisabled) {
        buttonModifier.alpha(BUTTON_DISABLED_OPACITY)
    } else {
        buttonModifier
    }

    Surface(
        modifier = appliedModifier,
        shape = buttonRadius,
        color = backgroundColor,
        border = border,
    ) {
        Box(
            modifier = Modifier
                .height(buttonHeight)
                .padding(horizontal = horizontalPadding),
        ) {
            when {
                loading -> {
                    // Show loading indicator
                    Box(
                        modifier = Modifier,
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.width(20.dp).height(20.dp),
                            strokeWidth = 2.dp,
                            color = textColor,
                        )
                    }
                }
                icon != null && content == null -> {
                    // Icon-only button
                    Box(
                        modifier = Modifier,
                    ) {
                        icon()
                    }
                }
                else -> {
                    // Button with text and optional icon
                    Row(
                        modifier = Modifier,
                        horizontalArrangement = Arrangement.Center,
                    ) {
                        if (icon != null && iconPosition == IconPosition.Left) {
                            icon()
                            Spacer(modifier = Modifier.width(theme.space.sm))
                        }

                        if (content != null) {
                            val textStyle = theme.type.label.sm
                            Text(
                                text = buildTextContent { content() },
                                style = textStyle,
                                color = textColor,
                                textDecoration = if (variant == ButtonVariant.Link) {
                                    TextDecoration.Underline
                                } else {
                                    null
                                },
                            )
                        }

                        if (icon != null && iconPosition == IconPosition.Right) {
                            Spacer(modifier = Modifier.width(theme.space.sm))
                            icon()
                        }
                    }
                }
            }
        }
    }
}

/**
 * Helper to extract text string from content composable
 * This is a simplified version that works with basic Text composables
 */
private fun buildTextContent(content: @Composable () -> Unit): String {
    // For now, return empty string as we can't extract text from arbitrary composables
    // In a real implementation, you might use a different approach
    return ""
}

/**
 * Button with text content
 *
 * Convenience overload that accepts a String for text content
 *
 * @param variant Button color variant
 * @param size Button size variant
 * @param text Button text content
 * @param onPress Callback when button is pressed
 * @param disabled Whether button is disabled
 * @param loading Whether button is in loading state
 * @param icon Optional icon composable to display
 * @param iconPosition Position of icon relative to text
 * @param accessibilityLabel Accessibility label for screen readers (defaults to text if null)
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the button container
 */
@Composable
fun Button(
    variant: ButtonVariant = ButtonVariant.Default,
    size: ButtonSize = ButtonSize.Default,
    text: String,
    onPress: (() -> Unit)? = null,
    disabled: Boolean = false,
    loading: Boolean = false,
    icon: @Composable (() -> Unit)? = null,
    iconPosition: IconPosition = IconPosition.Left,
    accessibilityLabel: String? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    Button(
        variant = variant,
        size = size,
        onPress = onPress,
        disabled = disabled,
        loading = loading,
        icon = icon,
        iconPosition = iconPosition,
        accessibilityLabel = accessibilityLabel ?: text,
        testID = testID,
        modifier = modifier,
    ) {
        Text(text)
    }
}
