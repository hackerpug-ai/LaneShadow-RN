package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.testTag
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * DragHandle component props
 *
 * Visual affordance for draggable bottom sheets. A small horizontal pill shape.
 *
 * @param width Handle width (default: 36.dp)
 * @param height Handle height (default: 4.dp)
 * @param borderRadius Corner radius (default: 2.dp)
 * @param testID Optional test identifier for UI testing
 * @param modifier Modifier for the container
 */
@Composable
fun DragHandle(
    width: Dp = 36.dp,
    height: Dp = 4.dp,
    borderRadius: Dp = 2.dp,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    val handleModifier = modifier
        .then(
            if (testID != null) {
                Modifier.testTag(testID)
            } else {
                Modifier
            }
        )

    Box(
        modifier = handleModifier,
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .width(width)
                .height(height)
                .background(
                    color = theme.colors.onSurface.default.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(borderRadius),
                )
                .padding(vertical = theme.space.sm)
        )
    }
}
