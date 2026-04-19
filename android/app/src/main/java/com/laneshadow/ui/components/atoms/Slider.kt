package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import kotlin.math.roundToInt

/**
 * Slider dimension constants
 *
 * Documented against Slider.md matrix values:
 * - Container height: 20dp (touch target)
 * - Track height: 8dp
 * - Thumb size: 20×20dp
 * - Thumb border: 2dp
 * - Thumb shadow: 2dp elevation
 * - Thumb offset y: -6dp (centered on track)
 */
private val SLIDER_CONTAINER_HEIGHT = 20.dp
private val SLIDER_TRACK_HEIGHT = 8.dp
private val SLIDER_THUMB_SIZE = 20.dp
private val SLIDER_THUMB_BORDER_WIDTH = 2.dp
private val SLIDER_THUMB_SHADOW_ELEVATION = 2.dp
private val SLIDER_THUMB_Y_OFFSET = (-6).dp

/**
 * Disabled opacity constant
 *
 * Following RN wrapper behavior: disabled sliders have 0.5 opacity
 */
private const val SLIDER_DISABLED_OPACITY = 0.5f

/**
 * Slider component
 *
 * A horizontal slider with draggable thumb for selecting a value within a range.
 *
 * @param value Current value of the slider
 * @param onValueChange Callback when value changes
 * @param min Minimum value
 * @param max Maximum value
 * @param step Step increment (snap to step)
 * @param disabled Whether slider is disabled (adds opacity and prevents interaction)
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the slider container
 */
@Composable
fun Slider(
    value: Float,
    onValueChange: (Float) -> Unit,
    min: Float = 0f,
    max: Float = 100f,
    step: Float = 1f,
    disabled: Boolean = false,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Track the width of the slider for gesture calculations
    var sliderWidth by remember { mutableFloatStateOf(0f) }
    var sliderStartX by remember { mutableFloatStateOf(0f) }

    // Ensure value is within bounds
    val clampedValue = value.coerceIn(min, max)

    // Calculate thumb position as percentage
    val percentage = (clampedValue - min) / (max - min)

    // Apply disabled opacity
    val appliedModifier = modifier
        .alpha(if (disabled) SLIDER_DISABLED_OPACITY else 1.0f)
        .semantics {
            progressBarRangeInfo = ProgressBarRangeInfo(
                current = clampedValue.coerceIn(min, max),
                range = min..max,
            )
        }
        .onGloballyPositioned { coordinates ->
            sliderWidth = coordinates.size.width.toFloat()
            sliderStartX = coordinates.positionInWindow().x
        }
        .then(
            if (!disabled) {
                Modifier.pointerInput(Unit) {
                    detectTapGestures { tapOffset ->
                        // Calculate value from tap position
                        val relativeX = tapOffset.x
                        val newValue = min + (relativeX / sliderWidth) * (max - min)
                        val snappedValue = snapToStep(newValue, min, max, step)
                        onValueChange(snappedValue)
                    }
                }.pointerInput(Unit) {
                    detectDragGestures { change, _ ->
                        val relativeX = change.position.x
                        val newValue = min + (relativeX / sliderWidth) * (max - min)
                        val snappedValue = snapToStep(newValue, min, max, step)
                        onValueChange(snappedValue)
                        change.consume()
                    }
                }
            } else {
                Modifier
            }
        )

    Box(
        modifier = appliedModifier
            .fillMaxWidth()
            .height(SLIDER_CONTAINER_HEIGHT),
    ) {
        // Track (inactive portion)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(SLIDER_TRACK_HEIGHT)
                .then(
                    Modifier.background(
                        color = theme.colors.secondary.default,
                        shape = CircleShape,
                    ),
                ),
        )

        // Range fill (active portion)
        val density = LocalDensity.current
        val fillWidthDp = with(density) { (sliderWidth * percentage).toDp() }
        Box(
            modifier = Modifier
                .width(fillWidthDp)
                .height(SLIDER_TRACK_HEIGHT)
                .background(
                    color = theme.colors.primary.default,
                    shape = CircleShape,
                ),
        )

        // Thumb
        val thumbX = (sliderWidth * percentage) - (with(density) { SLIDER_THUMB_SIZE.toPx() }) / 2
        val thumbBorderWidthPx = with(density) { SLIDER_THUMB_BORDER_WIDTH.toPx() }
        Box(
            modifier = Modifier
                .size(SLIDER_THUMB_SIZE)
                .offset {
                    IntOffset(
                        x = thumbX.toInt(),
                        y = with(density) {
                            SLIDER_THUMB_Y_OFFSET.roundToPx()
                        },
                    )
                }
                .shadow(
                    elevation = SLIDER_THUMB_SHADOW_ELEVATION,
                    shape = CircleShape,
                    ambientColor = Color.Black,
                    spotColor = Color.Black,
                )
                .background(
                    color = theme.colors.background.default,
                    shape = CircleShape,
                )
                .drawBehind {
                    // Draw thumb border
                    drawRoundRect(
                        color = theme.colors.primary.default,
                        style = Stroke(width = thumbBorderWidthPx),
                        cornerRadius = CornerRadius(size.width / 2, size.height / 2),
                    )
                },
        )
    }
}

/**
 * Snap a value to the nearest step increment within the range
 */
private fun snapToStep(
    value: Float,
    min: Float,
    max: Float,
    step: Float,
): Float {
    if (step <= 0f) return value.coerceIn(min, max)

    val steppedValue = kotlin.math.round((value - min) / step) * step + min
    return steppedValue.coerceIn(min, max)
}
