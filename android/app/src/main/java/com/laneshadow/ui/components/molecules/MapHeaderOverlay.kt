package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.Button
import com.laneshadow.ui.components.atoms.ButtonSize
import com.laneshadow.ui.components.atoms.ButtonVariant
import com.laneshadow.ui.components.atoms.IconSymbol

/**
 * Action data class for MapHeaderOverlay buttons
 *
 * Following RN wrapper API from react-native/components/map/map-header-overlay.tsx
 *
 * @param icon Icon name (MaterialCommunityIcons glyph name)
 * @param onPress Callback when button is pressed
 * @param testID Test ID for UI testing
 * @param accessibilityLabel Accessibility label for screen readers
 */
data class Action(
    val icon: String,
    val onPress: () -> Unit,
    val testID: String? = null,
    val accessibilityLabel: String? = null,
)

/**
 * MapHeaderOverlay molecule component
 *
 * Glass-morphic header overlay for map screens.
 * Following RN wrapper API from react-native/components/map/map-header-overlay.tsx
 *
 * @param title Center title text
 * @param leftAction Optional left button action
 * @param rightAction Optional right button action
 * @param showBackground Toggle gradient visibility (default: true)
 * @param modifier Modifier for the component
 * @param testID Test ID for UI testing
 */
@Composable
fun MapHeaderOverlay(
    title: String,
    leftAction: Action? = null,
    rightAction: Action? = null,
    showBackground: Boolean = true,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Gradient colors: surface.default at 95% alpha → 50% alpha → transparent
    val gradientColors = if (showBackground) {
        listOf(
            theme.colors.surface.default.copy(alpha = 0.95f),
            theme.colors.surface.default.copy(alpha = 0.5f),
            Color.Transparent,
        )
    } else {
        listOf(
            Color.Transparent,
            Color.Transparent,
            Color.Transparent,
        )
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(Brush.verticalGradient(colors = gradientColors))
            .padding(bottom = theme.space.xl)
            .statusBarsPadding()
            .testTag(testID ?: "map-header-overlay"),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = theme.space.lg)
                .padding(bottom = theme.space.xxl),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Left section: min-width 3xl
            Box(
                modifier = Modifier.width(theme.space.xxxl),
                contentAlignment = Alignment.CenterStart,
            ) {
                if (leftAction != null) {
                    Button(
                        variant = ButtonVariant.Glass,
                        size = ButtonSize.Icon,
                        onPress = leftAction.onPress,
                        accessibilityLabel = leftAction.accessibilityLabel,
                        testID = if (leftAction.testID != null) "${leftAction.testID}-left-button" else "map-header-left-button",
                    ) {
                        IconSymbol(
                            name = leftAction.icon,
                            size = 24.dp,
                            color = theme.colors.onSurface.default,
                        )
                    }
                }
            }

            // Center section: title
            Text(
                text = title,
                style = theme.type.heading.md,
                color = theme.colors.onSurface.default,
                modifier = Modifier.testTag(testID?.let { "$it-title" } ?: "map-header-title"),
            )

            // Right section: min-width 3xl
            Box(
                modifier = Modifier.width(theme.space.xxxl),
                contentAlignment = Alignment.CenterEnd,
            ) {
                if (rightAction != null) {
                    Button(
                        variant = ButtonVariant.Glass,
                        size = ButtonSize.Icon,
                        onPress = rightAction.onPress,
                        accessibilityLabel = rightAction.accessibilityLabel,
                        testID = if (rightAction.testID != null) "${rightAction.testID}-right-button" else "map-header-right-button",
                    ) {
                        IconSymbol(
                            name = rightAction.icon,
                            size = 24.dp,
                            color = theme.colors.onSurface.default,
                        )
                    }
                }
            }
        }
    }
}
