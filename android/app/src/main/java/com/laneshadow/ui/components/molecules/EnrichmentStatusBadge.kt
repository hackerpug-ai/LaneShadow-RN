package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol

/**
 * Enrichment status enum
 *
 * Represents the enrichment state of a route or waypoint.
 * Following RN wrapper API from react-native/components/enrichment/enrichment-status-badge.tsx
 */
enum class EnrichmentStatus {
    Draft,
    Partial,
    Complete,
    Failed,
}

/**
 * Enrichment status badge size enum
 *
 * Size variants for the badge.
 */
enum class EnrichmentStatusBadgeSize {
    Small,
    Medium,
}

/**
 * Status configuration data class
 *
 * Defines the label, icon, and color for each enrichment status.
 */
private data class StatusConfig(
    val label: String,
    val iconName: String,
    val getColor: @Composable () -> Color,
)

/**
 * Status configuration map
 *
 * Maps each enrichment status to its configuration.
 */
private val STATUS_CONFIG: Map<EnrichmentStatus, StatusConfig> = mapOf(
    EnrichmentStatus.Draft to StatusConfig(
        label = "Draft",
        iconName = "clock-outline",
        getColor = {
            // Use onSurface with subtle opacity for draft status
            val theme = LocalLaneShadowTheme.current
            theme.colors.onSurface.default.copy(alpha = 0.6f)
        }
    ),
    EnrichmentStatus.Partial to StatusConfig(
        label = "Partial",
        iconName = "check-circle-outline",
        getColor = {
            // Use enrichmentFast domain color for partial status
            val theme = LocalLaneShadowTheme.current
            theme.domain.enrichmentFast.default
        }
    ),
    EnrichmentStatus.Complete to StatusConfig(
        label = "Complete",
        iconName = "star-outline",
        getColor = {
            // Use enrichmentExtended domain color for complete status
            val theme = LocalLaneShadowTheme.current
            theme.domain.enrichmentExtended.default
        }
    ),
    EnrichmentStatus.Failed to StatusConfig(
        label = "Failed",
        iconName = "alert-circle-outline",
        getColor = {
            // Use danger color for failed status
            val theme = LocalLaneShadowTheme.current
            theme.colors.danger.default
        }
    ),
)

/**
 * EnrichmentStatusBadge molecule component
 *
 * Badge showing enrichment status with color-coded indicator.
 * Status variants: draft, partial, complete, failed.
 * Following RN wrapper API from react-native/components/enrichment/enrichment-status-badge.tsx
 *
 * @param status Current enrichment status (Draft, Partial, Complete, Failed)
 * @param size Compact size variant (Small or Medium, default: Small)
 * @param modifier Modifier for the component container
 * @param testID Optional test identifier for UI testing
 */
@Composable
fun EnrichmentStatusBadge(
    status: EnrichmentStatus,
    size: EnrichmentStatusBadgeSize = EnrichmentStatusBadgeSize.Small,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val config = STATUS_CONFIG[status] ?: return
    val color = config.getColor()
    val isSmall = size == EnrichmentStatusBadgeSize.Small

    // Background at 10% opacity of status color
    val backgroundColor = color.copy(alpha = 0.1f)

    // Border at 30% opacity of status color
    val borderColor = color.copy(alpha = 0.3f)

    // Padding based on size
    val verticalPadding = if (isSmall) theme.space.xs else theme.space.sm
    val horizontalPadding = if (isSmall) theme.space.sm else theme.space.md

    // Icon size based on size variant
    val iconSize: Dp = if (isSmall) 14.dp else 16.dp

    // Typography based on size variant
    val textStyle = if (isSmall) theme.type.label.sm else theme.type.label.md

    Surface(
        modifier = modifier
            .testTag(testID ?: "enrichment-status-badge-${status.name.lowercase()}")
            .semantics {
                contentDescription = "Enrichment status: ${config.label}"
            },
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.lg),
        color = backgroundColor,
        border = BorderStroke(
            width = 1.dp,
            color = borderColor,
        ),
    ) {
        Row(
            modifier = Modifier
                .padding(
                    vertical = verticalPadding,
                    horizontal = horizontalPadding,
                ),
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconSymbol(
                name = config.iconName,
                size = iconSize,
                color = color,
                modifier = Modifier.testTag(
                    testID?.let { "$it-icon" } ?: "enrichment-status-badge-icon"
                ),
            )

            Text(
                text = config.label,
                style = textStyle,
                color = color,
                modifier = Modifier.testTag(
                    testID?.let { "$it-label" } ?: "enrichment-status-badge-label"
                ),
            )
        }
    }
}
