package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Separator orientation enum
 *
 * Following RN wrapper API from react-native/components/ui/separator.tsx
 */
enum class SeparatorOrientation {
    Horizontal,
    Vertical,
}

/**
 * Separator molecule component
 *
 * Visual divider line with semantic theme styling.
 * Following React Native wrapper patterns from react-native/components/ui/separator.tsx
 *
 * Horizontal: 1dp height, full width, color from border.default
 * Vertical: 1dp width, full height, color from border.default
 *
 * @param orientation Separator orientation (horizontal or vertical, default: horizontal)
 * @param modifier Modifier for the separator
 */
@Composable
fun Separator(
    orientation: SeparatorOrientation = SeparatorOrientation.Horizontal,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    when (orientation) {
        SeparatorOrientation.Horizontal -> {
            Box(
                modifier = modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(theme.colors.border.default)
                    .semantics {
                        contentDescription = "Separator"
                    },
            )
        }
        SeparatorOrientation.Vertical -> {
            Box(
                modifier = modifier
                    .width(1.dp)
                    .fillMaxHeight()
                    .background(theme.colors.border.default)
                    .semantics {
                        contentDescription = "Separator"
                    },
            )
        }
    }
}
