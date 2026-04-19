package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Separator orientation enum
 *
 * Following RN wrapper API from react-native/components/ui/separator.tsx
 */
enum class SeparatorOrientation {
    Horizontal,
    Vertical,
}

/**
 * Separator component props
 *
 * Following RN wrapper API from react-native/components/ui/separator.tsx
 *
 * @param orientation Orientation of the separator line (horizontal or vertical)
 * @param modifier Modifier for the separator container
 * @param testID Test ID for UI testing
 */
@Composable
fun Separator(
    orientation: SeparatorOrientation = SeparatorOrientation.Horizontal,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Get divider color from theme
    val dividerColor: Color = theme.colors.divider.default

    // Build modifier based on orientation
    val separatorModifier = when (orientation) {
        SeparatorOrientation.Horizontal -> modifier
            .fillMaxWidth()
            .height(1.dp)
        SeparatorOrientation.Vertical -> modifier
            .fillMaxHeight()
            .width(1.dp)
    }

    Box(
        modifier = separatorModifier.drawBehind {
            drawRect(dividerColor)
        },
    )
}
