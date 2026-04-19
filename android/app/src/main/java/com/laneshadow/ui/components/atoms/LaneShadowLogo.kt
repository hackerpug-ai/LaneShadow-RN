package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LocalLaneShadowTheme
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * LaneShadowLogo - Stylized "route" glyph logo
 *
 * Renders an S-curve path with two filled circle endpoints:
 * - S-curve path (stroke, no fill)
 * - Top circle endpoint at (8, 6)
 * - Bottom circle endpoint at (16, 18)
 *
 * @param size Logo dimensions in density-independent pixels (required)
 * @param modifier Modifier for the logo container
 * @param testID Test ID for UI testing
 */
@Composable
fun LaneShadowLogo(
    size: Dp,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    val density = LocalDensity.current
    val sizePx = with(density) { size.toPx() }

    Canvas(
        modifier = modifier
            .size(size)
            .semantics {
                this.role = Role.Image
                contentDescription = "LaneShadow Logo"
                testID?.let {
                    testTag = it
                }
            },
        onDraw = {
            drawLaneShadowLogo(
                size = sizePx,
                onPrimaryColor = theme.colors.onPrimary.default,
                strokeWidth = max(2f, (theme.space.sm.value / 3f).roundToInt().toFloat()),
                circleRadius = max(2f, (theme.space.xs.value / 1.5f).roundToInt().toFloat()),
            )
        },
    )
}

/**
 * Draw the LaneShadow logo on the canvas
 *
 * @param size Total size of the canvas in pixels
 * @param onPrimaryColor Color for stroke and fills (from theme.colors.onPrimary.default)
 * @param strokeWidth Stroke width for the S-curve path (calculated from space.sm / 3)
 * @param circleRadius Radius for endpoint circles (calculated from space.xs / 1.5)
 */
private fun DrawScope.drawLaneShadowLogo(
    size: Float,
    onPrimaryColor: Color,
    strokeWidth: Float,
    circleRadius: Float,
) {
    // Scale factor to map 24x24 viewBox to actual size
    val scale = size / 24f

    // Scale all drawing operations
    withTransform({
        scale(scale, scale)
    }) {
        // Draw S-curve path (stroke, no fill)
        // Path data: "M8 6 V12 C8 15 12 15 12 12 V10 C12 7 16 7 16 10 V18"
        val path = Path().apply {
            // Move to start point (8, 6)
            moveTo(8f, 6f)

            // Vertical line down to (8, 12)
            lineTo(8f, 12f)

            // Cubic bezier curve: control1=(8,15), control2=(12,15), end=(12,12)
            cubicTo(
                x1 = 8f, y1 = 15f,
                x2 = 12f, y2 = 15f,
                x3 = 12f, y3 = 12f,
            )

            // Vertical line down to (12, 10)
            lineTo(12f, 10f)

            // Cubic bezier curve: control1=(12,7), control2=(16,7), end=(16,10)
            cubicTo(
                x1 = 12f, y1 = 7f,
                x2 = 16f, y2 = 7f,
                x3 = 16f, y3 = 10f,
            )

            // Vertical line down to (16, 18)
            lineTo(16f, 18f)
        }

        drawPath(
            path = path,
            color = onPrimaryColor,
            style = Stroke(
                width = strokeWidth,
                pathEffect = null,
            ),
        )

        // Draw top circle endpoint at (8, 6)
        drawCircle(
            color = onPrimaryColor,
            radius = circleRadius,
            center = Offset(8f, 6f),
        )

        // Draw bottom circle endpoint at (16, 18)
        drawCircle(
            color = onPrimaryColor,
            radius = circleRadius,
            center = Offset(16f, 18f),
        )
    }
}
