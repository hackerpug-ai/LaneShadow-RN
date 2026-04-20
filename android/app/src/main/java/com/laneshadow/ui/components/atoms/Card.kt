package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Card variant types
 *
 * Following design system tokens for card states
 */
enum class CardVariant {
    Default,
    Primary,
    Success,
    Warning,
    Danger,
}

/**
 * Disabled opacity constant
 *
 * Following RN wrapper behavior: disabled cards have 0.5 opacity
 */
private const val CARD_DISABLED_OPACITY = 0.5f

/**
 * Card dimension constants
 *
 * Following design system specifications:
 * - Elevation: 2dp default
 * - Border width: 1dp
 */
private val CARD_ELEVATION_DEFAULT = 2.dp
private val CARD_BORDER_WIDTH = 1.dp

/**
 * Card component
 *
 * Following design system specifications for card containers
 *
 * @param variant Card color variant (default, primary, success, warning, danger)
 * @param onPress Callback when card is pressed (null makes card non-interactive)
 * @param disabled Whether card is disabled (adds opacity and prevents interaction)
 * @param showBorder Whether to show a border around the card
 * @param modifier Modifier for the card container
 * @param testID Test ID for UI testing
 * @param content Card content composable
 */
@Composable
fun Card(
    variant: CardVariant = CardVariant.Default,
    onPress: (() -> Unit)? = null,
    disabled: Boolean = false,
    showBorder: Boolean = false,
    modifier: Modifier = Modifier,
    testID: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    // Determine if card should be disabled
    val isDisabled = disabled || (onPress == null)

    // Get background color based on variant
    val backgroundColor: Color = when (variant) {
        CardVariant.Default -> theme.colors.card.default
        CardVariant.Primary -> theme.colors.primary.default
        CardVariant.Success -> theme.colors.success.default
        CardVariant.Warning -> theme.colors.warning.default
        CardVariant.Danger -> theme.colors.danger.default
    }

    // Get border style
    val border: BorderStroke? = when {
        showBorder -> BorderStroke(
            width = CARD_BORDER_WIDTH,
            color = theme.colors.border.default
        )
        else -> null
    }

    // Get elevation based on state
    val elevation: Dp = CARD_ELEVATION_DEFAULT

    // Build base modifier
    val baseModifier = modifier
        .fillMaxWidth()
        .semantics {
            if (onPress != null) {
                role = Role.Button
            }
            if (isDisabled) {
                disabled()
            }
            if (testID != null) {
                testTag = testID
            }
        }

    // Add click handling if not disabled
    val interactiveModifier = if (!disabled && onPress != null) {
        baseModifier.clickable(onClick = onPress)
    } else {
        baseModifier
    }

    // Apply disabled opacity
    val appliedModifier = if (isDisabled) {
        interactiveModifier.alpha(CARD_DISABLED_OPACITY)
    } else {
        interactiveModifier
    }

    Surface(
        modifier = appliedModifier,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.lg),
        color = backgroundColor,
        border = border,
        tonalElevation = elevation,
        shadowElevation = elevation,
    ) {
        Column(
            modifier = Modifier
                .padding(theme.space.lg),
            content = content,
        )
    }
}

/**
 * CardHeader component
 *
 * Header row for card with space-between layout
 *
 * @param modifier Modifier for the header
 * @param content Header content composable
 */
@Composable
fun CardHeader(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = theme.space.md),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        content = content,
    )
}

/**
 * CardTitle component
 *
 * Title text for card content
 *
 * @param text Title text to display
 * @param variant Card variant to determine text color
 * @param modifier Modifier for the title
 */
@Composable
fun CardTitle(
    text: String,
    variant: CardVariant = CardVariant.Default,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    val textColor: Color = when (variant) {
        CardVariant.Default -> theme.colors.onSurface.default
        CardVariant.Primary -> theme.colors.onPrimary.default
        CardVariant.Success -> theme.colors.onPrimary.default
        CardVariant.Warning -> theme.colors.onPrimary.default
        CardVariant.Danger -> theme.colors.onPrimary.default
    }

    Text(
        text = text,
        modifier = modifier,
        style = theme.type.title.md,
        color = textColor,
    )
}

/**
 * CardContent component
 *
 * Flexible content area for card
 *
 * @param modifier Modifier for the content area
 * @param content Content composable
 */
@Composable
fun CardContent(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier,
        content = content,
    )
}

/**
 * CardDescription component
 *
 * Description text for card content
 *
 * @param text Description text to display
 * @param variant Card variant to determine text color
 * @param modifier Modifier for the description
 */
@Composable
fun CardDescription(
    text: String,
    variant: CardVariant = CardVariant.Default,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    val textColor: Color = when (variant) {
        CardVariant.Default -> theme.colors.onSurface.default.copy(alpha = 0.6f)
        CardVariant.Primary -> theme.colors.onPrimary.default
        CardVariant.Success -> theme.colors.onPrimary.default
        CardVariant.Warning -> theme.colors.onPrimary.default
        CardVariant.Danger -> theme.colors.onPrimary.default
    }

    Text(
        text = text,
        modifier = modifier,
        style = theme.type.body.md,
        color = textColor,
    )
}
