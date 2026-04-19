package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Sort mode for Discovery screen
 *
 * Following RN wrapper API from react-native/components/discovery/discovery-sort-toggle.tsx
 */
enum class SortMode {
    Best,
    Nearest,
}

/**
 * DiscoverySortToggle molecule component
 *
 * Glassmorphic segmented control for switching between Best and Nearest sort modes.
 * Following React Native wrapper patterns from react-native/components/discovery/discovery-sort-toggle.tsx
 *
 * ## Usage
 *
 * ```kotlin
 * var sortMode by remember { mutableStateOf(SortMode.Best) }
 * DiscoverySortToggle(
 *     mode = sortMode,
 *     onModeChange = { sortMode = it },
 * )
 * ```
 *
 * @param mode Current sort mode (Best or Nearest)
 * @param onModeChange Callback when sort mode changes
 * @param modifier Modifier for the container
 * @param testID Optional test ID for testing
 */
@Composable
fun DiscoverySortToggle(
    mode: SortMode,
    onModeChange: (SortMode) -> Unit,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Glassmorphic container: surface with 80% opacity
    val backgroundColor = theme.colors.surface.default.copy(alpha = 0.8f)

    // Border with 20% opacity (0.13f approximately 20%)
    val borderColor = theme.colors.border.default.copy(alpha = 0.13f)

    // Container padding: space xs (4dp)
    val containerPadding = theme.space.xs

    // Self-align to start (flex-start in RN)
    val containerModifier = modifier

    // Surface with glassmorphic styling
    Surface(
        modifier = containerModifier,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.md),
        color = backgroundColor,
        border = BorderStroke(1.dp, borderColor),
    ) {
        // Inner container with padding
        Row(
            modifier = Modifier.padding(containerPadding),
        ) {
            // ToggleGroup for segmented control
            ToggleGroup(
                type = ToggleGroupType.Single,
                value = mode.name.lowercase(),
                onValueChange = { newValue ->
                    val mode = when (newValue) {
                        "best" -> SortMode.Best
                        "nearest" -> SortMode.Nearest
                        else -> SortMode.Best
                    }
                    onModeChange(mode)
                },
                variant = ToggleVariant.Outline,
                size = ToggleSize.Sm,
            ) {
                ToggleGroupItem(
                    value = "best",
                    accessibilityLabel = "Sort by best score",
                ) {
                    Text(
                        text = "Best",
                        style = androidx.compose.ui.text.TextStyle(
                            fontSize = 13.sp,
                        ),
                    )
                }
                ToggleGroupItem(
                    value = "nearest",
                    accessibilityLabel = "Sort by nearest distance",
                ) {
                    Text(
                        text = "Nearest",
                        style = androidx.compose.ui.text.TextStyle(
                            fontSize = 13.sp,
                        ),
                    )
                }
            }
        }
    }
}
