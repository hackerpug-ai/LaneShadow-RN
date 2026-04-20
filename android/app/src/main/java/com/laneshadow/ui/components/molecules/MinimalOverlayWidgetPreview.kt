package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Demo scenario data class for preview
 *
 * Following RN wrapper API from react-native/components/map/minimal-overlay-widget-preview.tsx
 */
data class Scenario(
    val name: String,
    val description: String,
    val availability: OverlayAvailability,
)

/**
 * Minimal Overlay Widget Preview molecule component
 *
 * Standalone preview component with static data for visual testing.
 * Shows different scenarios of the MinimalOverlayWidget with varying availability states.
 *
 * Following RN wrapper API from react-native/components/map/minimal-overlay-widget-preview.tsx
 *
 * Scenarios:
 * - All Available: Full weather data - all overlays enabled
 * - Wind Only: Route has wind data but no rain/temp
 * - Rain + Temp: Rain and temp available, wind missing
 * - None Available: No overlay data - widget hidden
 */
@Composable
fun MinimalOverlayWidgetPreview() {
    val theme = LocalLaneShadowTheme.current

    // Demo scenarios with different availability states
    val scenarios = remember {
        listOf(
            Scenario(
                name = "All Available",
                description = "Full weather data - all overlays enabled",
                availability = OverlayAvailability(
                    wind = true,
                    rain = true,
                    temperature = true,
                ),
            ),
            Scenario(
                name = "Wind Only",
                description = "Route has wind data but no rain/temp",
                availability = OverlayAvailability(
                    wind = true,
                    rain = false,
                    temperature = false,
                ),
            ),
            Scenario(
                name = "Rain + Temp",
                description = "Rain and temp available, wind missing",
                availability = OverlayAvailability(
                    wind = false,
                    rain = true,
                    temperature = true,
                ),
            ),
            Scenario(
                name = "None Available",
                description = "No overlay data - widget hidden",
                availability = OverlayAvailability(
                    wind = false,
                    rain = false,
                    temperature = false,
                ),
            ),
        )
    }

    var selectedScenarioIndex by remember { mutableIntStateOf(0) }
    var activeOverlay by remember { mutableStateOf<OverlayType?>(null) }
    val currentScenario = scenarios[selectedScenarioIndex]

    // Check if any overlay data is available
    val hasAnyData = currentScenario.availability.wind ||
            currentScenario.availability.rain ||
            currentScenario.availability.temperature

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.background.default)
            .testTag("minimal-overlay-widget-preview"),
    ) {
        // Header
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    start = theme.space.lg,
                    end = theme.space.lg,
                    top = 60.dp,
                    bottom = theme.space.lg,
                )
                .testTag("preview-header"),
        ) {
            Text(
                text = "Minimal Overlay Widget",
                style = TextStyle(
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.sp,
                ),
                color = theme.colors.onSurface.default,
                modifier = Modifier.testTag("preview-title"),
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Press the center icon to expand",
                style = TextStyle(
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Normal,
                    letterSpacing = 0.sp,
                ),
                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                modifier = Modifier.testTag("preview-subtitle"),
            )
        }

        // Widget preview area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(theme.colors.surfaceVariant.default)
                .border(
                    BorderStroke(1.dp, theme.colors.border.default),
                    shape = RoundedCornerShape(0.dp),
                )
                .testTag("preview-area"),
            contentAlignment = Alignment.Center,
        ) {
            if (hasAnyData) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Widget
                    Box(
                        modifier = Modifier.testTag("preview-widget-container"),
                    ) {
                        MinimalOverlayWidget(
                            value = activeOverlay,
                            onValueChange = { activeOverlay = it },
                            availability = currentScenario.availability,
                            testID = "preview-widget",
                        )
                    }

                    // Current selection display
                    if (activeOverlay != null) {
                        Spacer(modifier = Modifier.height(16.dp))

                        Box(
                            modifier = Modifier
                                .border(
                                    BorderStroke(
                                        1.dp,
                                        theme.colors.primary.default,
                                    ),
                                    RoundedCornerShape(16.dp),
                                )
                                .background(
                                    theme.colors.primary.default.copy(alpha = 0.2f),
                                    RoundedCornerShape(16.dp),
                                )
                                .padding(
                                    horizontal = 16.dp,
                                    vertical = 8.dp,
                                )
                                .testTag("selection-badge"),
                        ) {
                            Text(
                                text = "Active: ${activeOverlay?.name?.lowercase()}",
                                style = TextStyle(
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    letterSpacing = 0.sp,
                                ),
                                color = theme.colors.primary.default,
                            )
                        }
                    }
                }
            } else {
                // Hidden state
                Box(
                    modifier = Modifier
                        .testTag("hidden-state"),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = "Widget hidden - no overlay data available",
                        style = TextStyle(
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Normal,
                            letterSpacing = 0.sp,
                        ),
                        color = theme.colors.onSurface.default.copy(alpha = 0.4f),
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }

        // Scenario selector
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = theme.space.xl)
                .testTag("scenarios-section"),
        ) {
            Text(
                text = "Scenarios",
                style = TextStyle(
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.sp,
                ),
                color = theme.colors.onSurface.default,
                modifier = Modifier
                    .padding(horizontal = theme.space.md)
                    .testTag("scenarios-title"),
            )

            Spacer(modifier = Modifier.height(16.dp))

            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("scenarios-list"),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    horizontal = theme.space.md,
                ),
            ) {
                items(scenarios.size) { index ->
                    val scenario = scenarios[index]
                    val isSelected = index == selectedScenarioIndex

                    ScenarioCard(
                        scenario = scenario,
                        isSelected = isSelected,
                        onClick = {
                            selectedScenarioIndex = index
                            activeOverlay = null
                        },
                        theme = theme,
                    )
                }
            }
        }

        // Instructions
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    horizontal = theme.space.lg,
                    vertical = theme.space.lg,
                )
                .background(
                    theme.colors.surfaceVariant.default,
                    RoundedCornerShape(12.dp),
                )
                .padding(theme.space.lg)
                .testTag("instructions"),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = "How it works:",
                    style = TextStyle(
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.sp,
                    ),
                    color = theme.colors.onSurface.default,
                    modifier = Modifier.testTag("instructions-title"),
                )

                Text(
                    text = "• Tap center icon to expand/collapse radial menu",
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        letterSpacing = 0.sp,
                    ),
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                )

                Text(
                    text = "• Tap an overlay icon to select it (tap again to deselect)",
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        letterSpacing = 0.sp,
                    ),
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                )

                Text(
                    text = "• Disabled icons show when data is unavailable",
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        letterSpacing = 0.sp,
                    ),
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                )

                Text(
                    text = "• Active overlay shows with copper glow ring",
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        letterSpacing = 0.sp,
                    ),
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                )
            }
        }
    }
}

/**
 * Scenario card component for the preview
 *
 * @param scenario Scenario data to display
 * @param isSelected Whether this scenario is currently selected
 * @param onClick Callback when card is clicked
 * @param theme LaneShadow theme
 */
@Composable
private fun ScenarioCard(
    scenario: Scenario,
    isSelected: Boolean,
    onClick: () -> Unit,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
) {
    val borderColor = if (isSelected) {
        theme.colors.primary.default
    } else {
        theme.colors.border.default
    }

    val backgroundColor = if (isSelected) {
        theme.colors.surfaceVariant.default
    } else {
        theme.colors.surfaceVariant.default.copy(alpha = 0.8f)
    }

    val nameColor = if (isSelected) {
        theme.colors.primary.default
    } else {
        theme.colors.onSurface.default
    }

    Box(
        modifier = Modifier
            .width(200.dp)
            .border(
                BorderStroke(1.dp, borderColor),
                RoundedCornerShape(12.dp),
            )
            .background(backgroundColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(16.dp)
            .semantics {
                contentDescription = "${scenario.name}: ${scenario.description}"
            }
            .testTag("scenario-card-${scenario.name.replace(" ", "-").lowercase()}"),
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Name
            Text(
                text = scenario.name,
                style = TextStyle(
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.sp,
                ),
                color = nameColor,
            )

            // Description
            Text(
                text = scenario.description,
                style = TextStyle(
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Normal,
                    letterSpacing = 0.sp,
                ),
                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
            )

            // Availability badges
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                // Wind badge
                AvailabilityBadge(
                    label = "Wind",
                    isAvailable = scenario.availability.wind,
                    theme = theme,
                )

                // Rain badge
                AvailabilityBadge(
                    label = "Rain",
                    isAvailable = scenario.availability.rain,
                    theme = theme,
                )

                // Temp badge
                AvailabilityBadge(
                    label = "Temp",
                    isAvailable = scenario.availability.temperature,
                    theme = theme,
                )
            }
        }
    }
}

/**
 * Availability badge component
 *
 * @param label Badge label
 * @param isAvailable Whether this overlay is available
 * @param theme LaneShadow theme
 */
@Composable
private fun AvailabilityBadge(
    label: String,
    isAvailable: Boolean,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
) {
    val badgeColor = when (label) {
        "Wind" -> theme.colors.success.default
        "Rain" -> theme.colors.info.default
        "Temp" -> theme.colors.warning.default
        else -> theme.colors.muted.default
    }

    val backgroundColor = if (isAvailable) {
        badgeColor
    } else {
        theme.colors.onSurface.default.copy(alpha = 0.2f)
    }

    Box(
        modifier = Modifier
            .border(
                BorderStroke(1.dp, backgroundColor),
                RoundedCornerShape(6.dp),
            )
            .background(
                backgroundColor.copy(alpha = if (isAvailable) 1f else 0.1f),
                RoundedCornerShape(6.dp),
            )
            .padding(
                horizontal = 8.dp,
                vertical = 4.dp,
            ),
    ) {
        Text(
            text = label,
            style = TextStyle(
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.sp,
            ),
            color = theme.colors.onSurface.default.copy(
                alpha = if (isAvailable) 1f else 0.4f
            ),
        )
    }
}
