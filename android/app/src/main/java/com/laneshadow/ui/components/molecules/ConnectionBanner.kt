package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * ConnectionBanner molecule component
 *
 * Network status banner displayed when connection is required or limited.
 * Following React Native wrapper patterns from react-native/components/ui/connection-banner.tsx
 *
 * @param message Banner message text (default: "Connection Required - Some features may be limited")
 * @param isVisible Whether to show the banner (default: true)
 * @param modifier Modifier for the banner container
 */
@Composable
fun ConnectionBanner(
    message: String = "Connection Required - Some features may be limited",
    isVisible: Boolean = true,
    modifier: Modifier = Modifier,
) {
    if (!isVisible) {
        return
    }

    val theme = LocalLaneShadowTheme.current

    // Background color from theme warning token
    val backgroundColor = theme.colors.warning.default

    // Text color from theme onPrimary token with fallback to white
    val textColor = theme.colors.onPrimary.default

    // Build semantics with accessibility description
    val bannerModifier = modifier.semantics {
        this.contentDescription = "Network status warning"
    }

    Surface(
        modifier = bannerModifier,
        color = backgroundColor,
    ) {
        Row(
            modifier = Modifier
                .padding(all = theme.space.md),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Warning icon
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null, // Decorative icon, description is on parent
                tint = textColor,
                modifier = Modifier.size(18.dp),
            )

            // Message text
            Text(
                text = message,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 14.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
                ),
                color = textColor,
                modifier = Modifier.padding(start = 8.dp),
            )
        }
    }
}
