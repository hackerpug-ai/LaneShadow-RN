package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

val LSDividerThicknessKey = SemanticsPropertyKey<Float>("LSDividerThickness")
val LSDividerColorKey = SemanticsPropertyKey<Color>("LSDividerColor")
val LSDividerOrientationKey = SemanticsPropertyKey<String>("LSDividerOrientation")

private var SemanticsPropertyReceiver.lsDividerThickness by LSDividerThicknessKey
private var SemanticsPropertyReceiver.lsDividerColor by LSDividerColorKey
private var SemanticsPropertyReceiver.lsDividerOrientation by LSDividerOrientationKey

@Composable
fun LSDivider(
    orientation: DividerOrientation = DividerOrientation.Horizontal,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val thickness = 1.dp
    val color = theme.colors.divider.default

    when (orientation) {
        DividerOrientation.Horizontal -> {
            Box(
                modifier = modifier
                    .fillMaxWidth()
                    .height(thickness)
                    .background(color)
                    .semantics {
                        lsDividerThickness = thickness.value
                        lsDividerColor = color
                        lsDividerOrientation = orientation.name
                        contentDescription = "Divider"
                    },
            )
        }
        DividerOrientation.Vertical -> {
            Box(
                modifier = modifier
                    .width(thickness)
                    .fillMaxHeight()
                    .background(color)
                    .semantics {
                        lsDividerThickness = thickness.value
                        lsDividerColor = color
                        lsDividerOrientation = orientation.name
                        contentDescription = "Divider"
                    },
            )
        }
    }
}
