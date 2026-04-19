package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * SheetHandle component props
 *
 * Visual affordance for bottom sheet drag indication. A horizontal pill shape
 * centered at the top of a bottom sheet.
 *
 * @param modifier Modifier for the container
 * @param testID Optional test identifier for UI testing (default: "sheet-handle")
 */
@Composable
fun SheetHandle(
    modifier: Modifier = Modifier,
    testID: String = "sheet-handle",
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier
            .fillMaxWidth()
            .testTag(testID),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .width(48.dp)
                .height(5.dp)
                .background(
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    shape = CircleShape,
                )
                .padding(vertical = theme.space.sm)
        )
    }
}
