package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.Chip

/**
 * Draw a bottom border on the modifier
 */
private fun Modifier.drawBottomBorder(color: Color, thickness: Dp) = this.drawBehind {
    val strokeWidth = thickness.toPx()
    val y = size.height - strokeWidth / 2
    drawLine(
        color = color,
        start = Offset(0f, y),
        end = Offset(size.width, y),
        strokeWidth = strokeWidth,
    )
}

/**
 * Route archetype enum
 *
 * Represents different types of motorcycle routes.
 * Following RN contract from react-native/components/ui/discovery-filter-bar.tsx
 */
enum class RouteArchetype {
    All,
    Twisties,
    Scenic,
    Technical,
    Cruising,
    Sport,
    Adventure,
}

/**
 * DiscoveryFilterBar molecule component
 *
 * Horizontal scrollable chip bar with glassmorphic design for filtering routes by archetype.
 * Following RN wrapper API from react-native/components/ui/discovery-filter-bar.tsx
 *
 * Design tokens (from spec):
 * - Surface background: theme.colors.surface.default with 0.8f alpha (80% opacity)
 * - Border bottom: theme.colors.border.default with 0.13f alpha (20% of 0.65 base opacity)
 * - Padding: theme.space.md top/bottom, theme.space.lg horizontal
 * - Spacing: theme.space.sm between chips
 * - Uses existing Chip component from atoms package
 *
 * Behavior:
 * - "All" chip clears selection (when selected, no other archetypes are selected)
 * - Other archetypes toggle (multiple can be selected)
 * - Count displayed next to each label: "Scenic (12)"
 *
 * @param selectedArchetypes List of currently selected route archetypes
 * @param onArchetypeChange Callback when archetype selection changes
 * @param counts Map of archetype to count (for display labels)
 * @param testID Optional test ID for UI testing
 * @param modifier Modifier for the container
 */
@Composable
fun DiscoveryFilterBar(
    selectedArchetypes: List<RouteArchetype>,
    onArchetypeChange: (List<RouteArchetype>) -> Unit,
    counts: Map<RouteArchetype, Int>,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Glassmorphic surface background: 80% opacity
    val surfaceColor = theme.colors.surface.default.copy(alpha = 0.8f)

    // Border color: 20% opacity of base border (0.13f)
    val borderColor = theme.colors.border.default.copy(alpha = 0.13f)

    // Container with glassmorphic styling
    val containerModifier = modifier
        .background(color = surfaceColor)
        .drawBottomBorder(borderColor, 1.dp)
        .padding(
            horizontal = theme.space.lg,
            vertical = theme.space.md,
        )

    // Horizontal scrolling row of chips
    LazyRow(
        modifier = containerModifier,
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        // Get all archetype values in order
        val allArchetypes = RouteArchetype.entries

        // Add chip for each archetype
        for (archetype in allArchetypes) {
            item(key = archetype.name) {
                val isSelected = selectedArchetypes.contains(archetype)
                val count = counts[archetype] ?: 0
                val label = when (archetype) {
                    RouteArchetype.All -> "All"
                    else -> "${archetype.name} ($count)"
                }

                Chip(
                    label = label,
                    selected = isSelected,
                    onPress = {
                        handleArchetypePress(
                            archetype = archetype,
                            currentSelection = selectedArchetypes,
                            onArchetypeChange = onArchetypeChange,
                        )
                    },
                    testID = testID?.let { "$it-${archetype.name}" },
                )
            }
        }
    }
}

/**
 * Handle archetype chip press
 *
 * - "All" clears selection (selects only All)
 * - Selecting another archetype deselects "All"
 * - Toggling an archetype adds/removes it from selection
 * - If all specific archetypes are deselected, "All" becomes selected
 */
private fun handleArchetypePress(
    archetype: RouteArchetype,
    currentSelection: List<RouteArchetype>,
    onArchetypeChange: (List<RouteArchetype>) -> Unit,
) {
    when (archetype) {
        RouteArchetype.All -> {
            // "All" clears selection - only select All
            onArchetypeChange(listOf(RouteArchetype.All))
        }
        else -> {
            // Toggle the archetype
            val newSelection = if (currentSelection.contains(archetype)) {
                // Remove the archetype
                currentSelection - archetype
            } else {
                // Add the archetype and remove "All" if present
                (currentSelection - RouteArchetype.All) + archetype
            }

            // If no specific archetypes selected, default to "All"
            if (newSelection.isEmpty()) {
                onArchetypeChange(listOf(RouteArchetype.All))
            } else {
                onArchetypeChange(newSelection)
            }
        }
    }
}
