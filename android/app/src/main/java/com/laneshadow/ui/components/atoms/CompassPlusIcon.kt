package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import kotlin.math.max
import kotlin.math.min

/**
 * CompassPlusIcon - SVG compass icon with plus badge
 *
 * Renders a compass with:
 * - Filled circle with primary color and onPrimary stroke
 * - Diamond needle pointing up in onPrimary color
 * - North/South marks as vertical lines
 * - Plus badge in bottom-right quadrant
 *
 * @param size Icon size in density-independent pixels (default: 28dp)
 * @param label Accessibility label for screen readers
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the icon container
 */
@Composable
fun CompassPlusIcon(
    size: Dp = 28.dp,
    label: String? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier
            .semantics {
                this.role = Role.Image
                label?.let {
                    contentDescription = it
                }
                testID?.let {
                    testTag = it
                }
            }
    ) {
        val density = LocalDensity.current
        val sizePx = with(density) { size.toPx() }

        androidx.compose.foundation.Canvas(
            modifier = Modifier.size(size),
            onDraw = {
                drawCompassPlusIcon(
                    size = sizePx,
                    primaryColor = theme.colors.primary.default,
                    onPrimaryColor = theme.colors.onPrimary.default,
                    onSurfaceColor = theme.colors.onSurface.default,
                    surfaceColor = theme.colors.surface.default,
                    strokeWidth = max(1.5f, theme.space.xs.toPx() / 3f),
                    badgeRadius = max(6f, theme.space.md.toPx()) / 2f,
                )
            },
        )
    }
}

/**
 * Draw the compass plus icon on the canvas
 */
private fun DrawScope.drawCompassPlusIcon(
    size: Float,
    primaryColor: Color,
    onPrimaryColor: Color,
    onSurfaceColor: Color,
    surfaceColor: Color,
    strokeWidth: Float,
    badgeRadius: Float,
) {
    val center = size / 2f
    val radius = (size - strokeWidth * 2) / 2f

    // Draw compass circle (filled with primary, stroked with onPrimary)
    drawCircle(
        color = primaryColor,
        radius = radius,
        center = Offset(center, center),
        style = Stroke(width = strokeWidth),
    )

    // Draw diamond needle (pointing up)
    val needlePath = Path().apply {
        val needleHeight = radius * 0.7f
        val needleWidth = radius * 0.4f

        // Diamond shape pointing up
        moveTo(center, center - needleHeight) // Top point
        lineTo(center + needleWidth, center) // Right point
        lineTo(center, center + needleHeight * 0.5f) // Bottom point (shorter)
        lineTo(center - needleWidth, center) // Left point
        close()
    }

    drawPath(
        path = needlePath,
        color = onPrimaryColor,
    )

    // Draw north/south marks (vertical lines)
    val markHeight = radius * 0.15f
    val markWidth = radius * 0.08f
    val markDistance = radius * 0.6f

    // North mark
    drawLine(
        color = onPrimaryColor,
        start = Offset(center, center - markDistance),
        end = Offset(center, center - markDistance + markHeight),
        strokeWidth = markWidth,
    )

    // South mark
    drawLine(
        color = onPrimaryColor,
        start = Offset(center, center + markDistance - markHeight),
        end = Offset(center, center + markDistance),
        strokeWidth = markWidth,
    )

    // Draw plus badge in bottom-right quadrant
    val badgeCenterX = center + radius * 0.5f
    val badgeCenterY = center + radius * 0.5f

    // Badge circle (filled with onSurface)
    drawCircle(
        color = onSurfaceColor,
        radius = badgeRadius,
        center = Offset(badgeCenterX, badgeCenterY),
    )

    // Plus sign (in surface color)
    val plusSize = badgeRadius * 0.6f
    val plusStroke = badgeRadius * 0.25f

    // Horizontal line of plus
    drawLine(
        color = surfaceColor,
        start = Offset(badgeCenterX - plusSize, badgeCenterY),
        end = Offset(badgeCenterX + plusSize, badgeCenterY),
        strokeWidth = plusStroke,
    )

    // Vertical line of plus
    drawLine(
        color = surfaceColor,
        start = Offset(badgeCenterX, badgeCenterY - plusSize),
        end = Offset(badgeCenterX, badgeCenterY + plusSize),
        strokeWidth = plusStroke,
    )
}
