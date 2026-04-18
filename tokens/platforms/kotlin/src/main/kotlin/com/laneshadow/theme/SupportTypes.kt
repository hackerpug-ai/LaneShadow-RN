package com.laneshadow.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

data class ColorSet(
    val default: Color,
    val hover: Color? = null,
    val pressed: Color? = null,
    val disabled: Color? = null,
    val focus: Color? = null,
)

data class ElevationStyle(
    val elevation: Dp,
    val offsetX: Dp,
    val offsetY: Dp,
    val opacity: Float,
    val radius: Dp,
)
