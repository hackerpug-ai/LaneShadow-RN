package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
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
import kotlin.math.roundToInt

/**
 * MotorcyclePlusIcon - Motorbike icon with plus badge overlay
 *
 * Composite icon consisting of:
 * - Base icon: Custom motorcycle drawing at full size
 * - Overlay: AddCircle badge in bottom-right corner at ~55% of base size
 *
 * @param size Base icon size in density-independent pixels (default: 22.dp)
 * @param baseColor Base icon color (default: theme.onSurface.default)
 * @param modifier Modifier for the icon container
 * @param testID Test ID for UI testing
 */
@Composable
fun MotorcyclePlusIcon(
    size: Dp = 22.dp,
    baseColor: Color? = null,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Calculate overlay size (~55% of base) and offset (20% of overlay)
    val overlaySize = (size.value * 0.55f).roundToInt().dp
    val offset = (overlaySize.value * 0.2f).roundToInt().dp

    Box(
        modifier = modifier
            .semantics {
                this.role = Role.Image
                contentDescription = "Motorcycle with add badge"
                testID?.let {
                    testTag = it
                }
            }
    ) {
        // Base motorcycle icon (custom drawing)
        val density = LocalDensity.current
        val sizePx = with(density) { size.toPx() }

        Canvas(
            modifier = Modifier.size(size),
            onDraw = {
                drawMotorcycleIcon(
                    size = sizePx,
                    color = baseColor ?: theme.colors.onSurface.default,
                    strokeWidth = max(1.5f, sizePx * 0.08f),
                )
            },
        )

        // Plus badge overlay at bottom-right
        Icon(
            imageVector = Icons.Filled.AddCircle,
            contentDescription = null, // Handled by parent Box
            modifier = Modifier
                .size(overlaySize)
                .offset(x = offset, y = offset),
            tint = theme.colors.primary.default,
        )
    }
}

/**
 * Draw a simplified motorcycle icon on the canvas
 *
 * Motorcycle shape consists of:
 * - Two wheels (circles)
 * - Frame connecting the wheels
 * - Seat and handlebars
 */
private fun DrawScope.drawMotorcycleIcon(
    size: Float,
    color: Color,
    strokeWidth: Float,
) {
    val padding = strokeWidth * 2
    val availableSize = size - padding * 2

    // Wheel positions
    val wheelRadius = availableSize * 0.22f
    val rearWheelCenter = Offset(padding + wheelRadius, size / 2f)
    val frontWheelCenter = Offset(size - padding - wheelRadius, size / 2f)

    // Draw wheels
    drawCircle(
        color = color,
        radius = wheelRadius,
        center = rearWheelCenter,
        style = Stroke(width = strokeWidth),
    )
    drawCircle(
        color = color,
        radius = wheelRadius,
        center = frontWheelCenter,
        style = Stroke(width = strokeWidth),
    )

    // Calculate common dimensions
    val seatHeight = rearWheelCenter.y - availableSize * 0.35f
    val seatX = rearWheelCenter.x + availableSize * 0.25f

    // Frame path
    val framePath = Path().apply {
        // Start from rear wheel hub
        moveTo(rearWheelCenter.x, rearWheelCenter.y)

        // Frame goes up and forward to seat area
        lineTo(seatX, seatHeight)

        // Seat (horizontal line)
        val seatEndX = seatX + availableSize * 0.25f
        lineTo(seatEndX, seatHeight)

        // Frame goes down to front wheel hub
        lineTo(frontWheelCenter.x, frontWheelCenter.y)

        // Close path back to rear wheel
        lineTo(rearWheelCenter.x, rearWheelCenter.y)
    }

    drawPath(
        path = framePath,
        color = color,
        style = Stroke(width = strokeWidth),
    )

    // Handlebars
    val handlebarPath = Path().apply {
        val handlebarHeight = seatHeight - availableSize * 0.15f
        val handlebarX = frontWheelCenter.x - availableSize * 0.15f

        // Fork from front wheel up to handlebars
        moveTo(frontWheelCenter.x, frontWheelCenter.y)
        lineTo(handlebarX, handlebarHeight)

        // Handlebar (horizontal line)
        val handlebarWidth = availableSize * 0.12f
        moveTo(handlebarX - handlebarWidth, handlebarHeight)
        lineTo(handlebarX + handlebarWidth / 2, handlebarHeight)
    }

    drawPath(
        path = handlebarPath,
        color = color,
        style = Stroke(width = strokeWidth),
    )

    // Engine block (filled area between wheels)
    val enginePath = Path().apply {
        val engineX = rearWheelCenter.x + availableSize * 0.35f
        val engineY = rearWheelCenter.y - availableSize * 0.15f
        val engineWidth = availableSize * 0.2f
        val engineHeight = availableSize * 0.18f

        moveTo(engineX, engineY)
        lineTo(engineX + engineWidth, engineY)
        lineTo(engineX + engineWidth, engineY + engineHeight)
        lineTo(engineX, engineY + engineHeight)
        close()
    }

    drawPath(
        path = enginePath,
        color = color,
        style = Stroke(width = strokeWidth),
    )
}
