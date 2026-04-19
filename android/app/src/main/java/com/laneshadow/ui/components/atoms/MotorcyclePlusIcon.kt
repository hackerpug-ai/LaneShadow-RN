package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import kotlin.math.roundToInt

/**
 * MotorcyclePlusIcon - Motorbike icon with plus badge overlay
 *
 * Composite icon consisting of:
 * - Base icon: Material Star (representing motorcycle/motorbike) at full size
 * - Overlay: AddCircle badge in bottom-right corner at ~55% of base size
 *
 * Note: Using Star as placeholder since motorcycle icon is not available in
 * standard Material Icons. This should be replaced with a custom SVG path
 * drawing similar to CompassPlusIcon for production use.
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
        // Base motorbike icon (using Star as placeholder)
        Icon(
            imageVector = Icons.Outlined.Star,
            contentDescription = null, // Handled by parent Box
            modifier = Modifier.size(size),
            tint = baseColor ?: theme.colors.onSurface.default,
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
