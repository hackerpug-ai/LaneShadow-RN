package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Create
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * NewSessionButton variant types
 *
 * Following RN wrapper API from react-native/components/ui/new-session-button.tsx
 */
enum class NewSessionVariant {
    Header,
    Fab,
    Text,
}

/**
 * NewSessionButton size variants
 *
 * Following RN wrapper API from react-native/components/ui/new-session-button.tsx
 */
enum class NewSessionSize {
    Sm,
    Md,
    Lg,
}

/**
 * NewSessionButton molecule component
 *
 * Button with 3 variants for creating new chat sessions.
 * Following React Native wrapper patterns from react-native/components/ui/new-session-button.tsx
 *
 * ## Usage
 *
 * ```kotlin
 * // Header variant (default)
 * NewSessionButton(
 *     onPress = { /* handle press */ },
 *     variant = NewSessionVariant.Header,
 *     label = "Session",
 *     size = NewSessionSize.Md,
 * )
 *
 * // FAB variant
 * NewSessionButton(
 *     onPress = { /* handle press */ },
 *     variant = NewSessionVariant.Fab,
 *     size = NewSessionSize.Md,
 * )
 *
 * // Text variant
 * NewSessionButton(
 *     onPress = { /* handle press */ },
 *     variant = NewSessionVariant.Text,
 *     label = "New Session",
 *     size = NewSessionSize.Md,
 * )
 * ```
 *
 * @param onPress Callback when button is pressed (null makes button non-interactive)
 * @param disabled Whether button is disabled (adds opacity and prevents interaction)
 * @param variant Button variant (header, fab, text)
 * @param label Optional text label for header and text variants (default: "Session")
 * @param size Button size variant (sm, md, lg) - affects icon size, font size, and padding
 * @param modifier Modifier for the button container
 * @param testID Test ID for UI testing
 */
@Composable
fun NewSessionButton(
    onPress: (() -> Unit)? = null,
    disabled: Boolean = false,
    variant: NewSessionVariant = NewSessionVariant.Header,
    label: String = "Session",
    size: NewSessionSize = NewSessionSize.Md,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Get size configuration
    val sizeConfig = getSizeConfig(size)

    // Track pressed state
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // Calculate opacity
    val opacity = when {
        disabled -> 0.5f
        isPressed -> 0.8f
        else -> 1f
    }

    // Determine if button is disabled (no onPress also disables)
    val isDisabled = disabled || onPress == null

    when (variant) {
        NewSessionVariant.Fab -> {
            FabVariant(
                onPress = onPress,
                disabled = isDisabled,
                isPressed = isPressed,
                size = size,
                sizeConfig = sizeConfig,
                opacity = opacity,
                modifier = modifier,
                testID = testID,
            )
        }
        NewSessionVariant.Text -> {
            TextVariant(
                onPress = onPress,
                disabled = isDisabled,
                isPressed = isPressed,
                label = label,
                sizeConfig = sizeConfig,
                opacity = opacity,
                modifier = modifier,
                testID = testID,
            )
        }
        NewSessionVariant.Header -> {
            HeaderVariant(
                onPress = onPress,
                disabled = isDisabled,
                isPressed = isPressed,
                label = label,
                sizeConfig = sizeConfig,
                opacity = opacity,
                modifier = modifier,
                testID = testID,
            )
        }
    }
}

/**
 * Size configuration data class
 *
 * Contains icon size, font size, and padding for each size variant
 */
private data class SizeConfig(
    val iconSize: Dp,
    val fontSize: Float,
    val padding: Dp,
)

/**
 * Get size configuration based on size variant
 *
 * Following RN wrapper behavior:
 * - sm: icon 20dp, font 13sp, padding 4dp
 * - md: icon 24dp, font 14sp, padding 6dp
 * - lg: icon 28dp, font 16sp, padding 8dp
 */
@Composable
private fun getSizeConfig(size: NewSessionSize): SizeConfig {
    val density = LocalDensity.current
    return when (size) {
        NewSessionSize.Sm -> SizeConfig(
            iconSize = with(density) { 20.dp },
            fontSize = 13f,
            padding = with(density) { 4.dp },
        )
        NewSessionSize.Lg -> SizeConfig(
            iconSize = with(density) { 28.dp },
            fontSize = 16f,
            padding = with(density) { 8.dp },
        )
        NewSessionSize.Md -> SizeConfig(
            iconSize = with(density) { 24.dp },
            fontSize = 14f,
            padding = with(density) { 6.dp },
        )
    }
}

/**
 * FAB variant implementation
 *
 * Circular floating action button with:
 * - Primary.default bg (pressed: primary.pressed, disabled: surfaceVariant.default)
 * - Plus icon in onPrimary.default (disabled: onSurface.subtle)
 * - Sizes: sm=48dp, md=56dp, lg=64dp (radius = size/2)
 * - Elevation: level 4
 */
@Composable
private fun FabVariant(
    onPress: (() -> Unit)?,
    disabled: Boolean,
    isPressed: Boolean,
    size: NewSessionSize,
    sizeConfig: SizeConfig,
    opacity: Float,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // FAB size based on size variant
    val fabSize = when (size) {
        NewSessionSize.Sm -> 48.dp
        NewSessionSize.Lg -> 64.dp
        NewSessionSize.Md -> 56.dp
    }

    // Background color
    val backgroundColor = when {
        disabled -> theme.colors.surfaceVariant.default
        isPressed -> theme.colors.primary.pressed ?: theme.colors.primary.default
        else -> theme.colors.primary.default
    }

    // Icon color (use disabled color for subtle state)
    val iconColor = when {
        disabled -> theme.colors.onSurface.disabled ?: theme.colors.onSurface.default
        else -> theme.colors.onPrimary.default
    }

    // Elevation
    val elevation = theme.elevation.light.level4

    Surface(
        onClick = { onPress?.invoke() },
        modifier = modifier
            .size(fabSize)
            .alpha(opacity)
            .semantics {
                role = Role.Button
                contentDescription = "New session"
            },
        shape = CircleShape,
        color = backgroundColor,
        tonalElevation = elevation,
        shadowElevation = elevation,
        enabled = !disabled,
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = "New session",
            tint = iconColor,
            modifier = Modifier.size(sizeConfig.iconSize),
        )
    }
}

/**
 * Text variant implementation
 *
 * Row with plus-circle-outline icon + label text:
 * - Icon: primary.default (disabled: onSurface.subtle)
 * - Text: primary.default, fontWeight 700
 * - Gap: 8dp
 */
@Composable
private fun TextVariant(
    onPress: (() -> Unit)?,
    disabled: Boolean,
    isPressed: Boolean,
    label: String,
    sizeConfig: SizeConfig,
    opacity: Float,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Icon color (use disabled color for subtle state)
    val iconColor = when {
        disabled -> theme.colors.onSurface.disabled ?: theme.colors.onSurface.default
        else -> theme.colors.primary.default
    }

    // Text color
    val textColor = when {
        disabled -> theme.colors.onSurface.disabled ?: theme.colors.onSurface.default
        else -> theme.colors.primary.default
    }

    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = modifier
            .clickable(
                onClick = { onPress?.invoke() },
                enabled = !disabled,
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
            )
            .alpha(opacity)
            .semantics {
                role = Role.Button
                contentDescription = "New $label"
            },
    ) {
            // Use Create icon as closest to "plus-circle-outline"
            Icon(
                imageVector = Icons.Default.Create,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(sizeConfig.iconSize),
            )

            Text(
                text = label,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = with(LocalDensity.current) { sizeConfig.fontSize.toSp() },
                    fontWeight = FontWeight.Bold,
                ),
                color = textColor,
            )
    }
}

/**
 * Header variant implementation (default)
 *
 * Row with plus-circle-outline icon + label text:
 * - Icon: onSurface.subtle (disabled) or primary.default
 * - Text: onSurface.muted, fontWeight 600
 * - Gap: 6dp
 */
@Composable
private fun HeaderVariant(
    onPress: (() -> Unit)?,
    disabled: Boolean,
    isPressed: Boolean,
    label: String,
    sizeConfig: SizeConfig,
    opacity: Float,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Icon color (use disabled color for subtle state)
    val iconColor = when {
        disabled -> theme.colors.onSurface.disabled ?: theme.colors.onSurface.default
        else -> theme.colors.primary.default
    }

    // Text color - use default onSurface color (muted is not available in ColorSet)
    val textColor = theme.colors.onSurface.default

    Row(
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = modifier
            .clickable(
                onClick = { onPress?.invoke() },
                enabled = !disabled,
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
            )
            .alpha(opacity)
            .semantics {
                role = Role.Button
                contentDescription = "New $label"
            },
    ) {
            // Use Create icon as closest to "plus-circle-outline"
            Icon(
                imageVector = Icons.Default.Create,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(sizeConfig.iconSize),
            )

            Text(
                text = label,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = with(LocalDensity.current) { sizeConfig.fontSize.toSp() },
                    fontWeight = FontWeight.SemiBold,
                ),
                color = textColor,
            )
    }
}
