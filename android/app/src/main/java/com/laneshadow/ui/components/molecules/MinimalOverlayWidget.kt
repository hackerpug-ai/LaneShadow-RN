package com.laneshadow.ui.components.molecules

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol
import kotlin.math.cos
import kotlin.math.sin

/**
 * Overlay type enum
 *
 * Following RN wrapper API from react-native/components/map/minimal-overlay-widget.tsx
 */
enum class OverlayType {
    WIND,
    RAIN,
    TEMPERATURE,
}

/**
 * Overlay availability data class
 *
 * Following RN wrapper API from react-native/components/map/minimal-overlay-widget.tsx
 */
data class OverlayAvailability(
    val wind: Boolean,
    val rain: Boolean,
    val temperature: Boolean,
)

/**
 * Minimal Overlay Widget molecule component
 *
 * A compact, single-icon weather overlay control that expands into a radial menu.
 * Inspired by motorcycle instrument dials and compass navigation.
 *
 * States:
 * - Collapsed: Single icon showing active overlay (or stack icon when none)
 * - Expanded: Three icons arc outward (wind, rain, temp)
 * - Selected: Active overlay glows with copper accent
 *
 * Following RN wrapper API from react-native/components/map/minimal-overlay-widget.tsx
 *
 * @param value Current selected overlay type (null for none)
 * @param onValueChange Callback when overlay selection changes
 * @param availability Which overlays have data available
 * @param testID Test ID for UI testing
 */
@Composable
fun MinimalOverlayWidget(
    value: OverlayType?,
    onValueChange: (OverlayType?) -> Unit,
    availability: OverlayAvailability,
    testID: String = "overlay-widget",
) {
    val theme = LocalLaneShadowTheme.current
    var expanded by remember { mutableStateOf(false) }

    // Icon configurations
    val overlayConfig = remember {
        mapOf(
            OverlayType.WIND to "weather-windy",
            OverlayType.RAIN to "water-outline",
            OverlayType.TEMPERATURE to "thermometer",
        )
    }

    // Radial positions (angles in degrees, radius in dp)
    data class RadialPosition(val angle: Double, val overlay: OverlayType)

    val radialPositions = remember {
        listOf(
            RadialPosition(-30.0, OverlayType.WIND),
            RadialPosition(0.0, OverlayType.RAIN),
            RadialPosition(30.0, OverlayType.TEMPERATURE),
        )
    }

    val radius = 36.dp

    // Get current icon to display
    val currentIcon = remember(value) {
        if (value != null) {
            overlayConfig[value] ?: "layers"
        } else {
            "layers"
        }
    }

    // Animation for expand/collapse
    val expandedScale: Float by animateFloatAsState(
        targetValue = if (expanded) 1f else 0f,
        animationSpec = spring(
            dampingRatio = 0.7f,
            stiffness = 150f,
        ),
        label = "expanded_scale",
    )

    Box(
        modifier = Modifier
            .size(120.dp)
            .testTag(testID),
        contentAlignment = Alignment.Center,
    ) {
        // Expanded radial icons
        radialPositions.forEach { position ->
            val isAvailable = when (position.overlay) {
                OverlayType.WIND -> availability.wind
                OverlayType.RAIN -> availability.rain
                OverlayType.TEMPERATURE -> availability.temperature
            }
            val isActive = value == position.overlay
            val iconName = overlayConfig[position.overlay] ?: "layers"

            // Calculate radial position
            val radians = Math.toRadians(position.angle)
            val offsetX = (sin(radians) * radius.value * expandedScale).dp
            val offsetY = (-cos(radians) * radius.value * expandedScale).dp

            // Animate opacity and scale
            val iconAlpha: Float by animateFloatAsState(
                targetValue = if (expanded) {
                    if (isAvailable) 1f else 0.3f
                } else {
                    0f
                },
                animationSpec = tween(durationMillis = 150),
                label = "icon_alpha_${position.overlay.name}",
            )

            val iconScale: Float by animateFloatAsState(
                targetValue = if (expanded) 1f else 0f,
                animationSpec = tween(durationMillis = 200),
                label = "icon_scale_${position.overlay.name}",
            )

            val iconSize: Dp by animateDpAsState(
                targetValue = if (expanded) 36.dp else 0.dp,
                animationSpec = tween(durationMillis = 200),
                label = "icon_size_${position.overlay.name}",
            )

            Box(
                modifier = Modifier
                    .offset(x = offsetX, y = offsetY)
                    .size(iconSize)
                    .scale(iconScale)
                    .alpha(iconAlpha),
                contentAlignment = Alignment.Center,
            ) {
                val backgroundColor = if (isActive) {
                    theme.colors.primary.default.copy(alpha = 0.2f)
                } else {
                    theme.colors.surfaceVariant.default
                }
                val borderColor = if (isActive) {
                    theme.colors.primary.default
                } else {
                    theme.colors.border.default
                }
                val iconColor = if (isActive) {
                    theme.colors.primary.default
                } else {
                    theme.colors.onSurface.default.copy(alpha = 0.6f)
                }
                val buttonAlpha = if (isAvailable) 1f else 0.4f

                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .alpha(buttonAlpha)
                        .background(backgroundColor, CircleShape)
                        .border(BorderStroke(1.dp, borderColor), CircleShape)
                        .clickable(
                            enabled = isAvailable,
                            onClick = {
                                val newValue = if (value == position.overlay) null else position.overlay
                                onValueChange(newValue)
                                expanded = false
                            },
                        )
                        .semantics {
                            contentDescription = "${position.overlay.name.lowercase()} overlay"
                        },
                    contentAlignment = Alignment.Center,
                ) {
                    IconSymbol(
                        name = iconName,
                        size = 18.dp,
                        color = iconColor,
                    )
                }
            }
        }

        // Center toggle button
        val centerButtonSize: Dp by animateDpAsState(
            targetValue = 40.dp,
            animationSpec = tween(durationMillis = 200),
            label = "center_button_size",
        )

        val centerBackgroundColor = theme.colors.surfaceVariant.default
        val centerBorderColor = if (value != null) {
            theme.colors.primary.default
        } else {
            theme.colors.border.default
        }
        val centerIconColor = if (value != null) {
            theme.colors.primary.default
        } else {
            theme.colors.onSurface.default
        }

        Box(
            modifier = Modifier
                .size(centerButtonSize)
                .background(centerBackgroundColor, CircleShape)
                .border(BorderStroke(1.5.dp, centerBorderColor), CircleShape)
                .clickable(
                    onClick = { expanded = !expanded },
                )
                .semantics {
                    contentDescription = "Weather overlays"
                }
                .testTag("${testID}-center"),
            contentAlignment = Alignment.Center,
        ) {
            // Active indicator ring
            if (value != null) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .offset(x = (-4).dp, y = (-4).dp)
                        .background(Color.Transparent, CircleShape)
                        .border(BorderStroke(2.dp, theme.colors.primary.default), CircleShape),
                )
            }

            IconSymbol(
                name = currentIcon,
                size = 20.dp,
                color = centerIconColor,
            )
        }
    }
}
