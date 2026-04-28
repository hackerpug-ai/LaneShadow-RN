package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

/**
 * LSWifiOffWatermark - Wifi-off watermark for offline error state.
 *
 * Renders a large, semi-transparent wifi-off icon on the map
 * to indicate offline state.
 *
 * TODO: Add wifi-off icon to theme and use LSIcon here
 *
 * @param modifier Modifier for the watermark
 */
@Composable
fun LSWifiOffWatermark(
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Placeholder: Use a simple icon for now
    // In production, this would use theme.icons.wifiOff or similar
    // Using Compass as a placeholder since WifiOff may not exist in the theme
    LSIcon(
        name = IconName.Compass,
        size = IconSize.Xl,
        color = IconColor.Status(StatusColor.Warning),
        modifier = modifier
            .fillMaxSize()
            .alpha(0.25f),
    )
}
