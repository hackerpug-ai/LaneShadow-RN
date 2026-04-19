package com.laneshadow.ui.components.atoms

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Themed text variant options
 *
 * - Default: 16sp, normal weight (bodyMedium equivalent)
 * - DefaultSemiBold: 14sp, semibold weight
 */
enum class ThemedTextVariant {
    Default,
    DefaultSemiBold,
}

/**
 * ThemedText atom component
 *
 * Lightweight themed text wrapper that applies LaneShadow theme tokens.
 * Use this component for consistent typography throughout the app.
 *
 * @param text The text content to display
 * @param variant Typography variant (Default or DefaultSemiBold)
 * @param color Optional color override (defaults to onSurface)
 * @param modifier Modifier for the text
 * @param testID Optional test identifier for UI testing
 */
@Composable
fun ThemedText(
    text: String,
    variant: ThemedTextVariant = ThemedTextVariant.Default,
    color: Color? = null,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Default color from theme
    val textColor = color ?: theme.colors.onSurface.default

    // Typography style based on variant
    val textStyle = when (variant) {
        ThemedTextVariant.Default -> androidx.compose.ui.text.TextStyle(
            fontSize = theme.type.body.md.fontSize,
            fontWeight = theme.type.body.md.fontWeight,
            letterSpacing = 0.sp,
        )
        ThemedTextVariant.DefaultSemiBold -> androidx.compose.ui.text.TextStyle(
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.sp,
        )
    }

    Text(
        text = text,
        style = textStyle,
        color = textColor,
        modifier = modifier,
    )
}
