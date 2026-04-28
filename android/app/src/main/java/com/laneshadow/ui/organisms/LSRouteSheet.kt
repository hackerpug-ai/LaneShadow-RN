package com.laneshadow.ui.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSBestBadge
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.BottomSheetDetent
import com.laneshadow.ui.molecules.InstrumentMetric
import com.laneshadow.ui.molecules.LSBottomSheet
import com.laneshadow.ui.molecules.WeatherTimelineEntry

// Test tags for LSRouteSheet
const val LS_ROUTE_SHEET_TAG = "ls-route-sheet"
private const val ROUTE_SHEET_HANDLE_TAG = "route-sheet-handle"
private const val ROUTE_SHEET_BADGE_TAG = "route-sheet-badge"
private const val ROUTE_SHEET_TITLE_TAG = "route-sheet-title"
private const val ROUTE_SHEET_SUBTITLE_TAG = "route-sheet-subtitle"
private const val ROUTE_SHEET_INSTRUMENT_TAG = "ls-instrument-readout"
private const val ROUTE_SHEET_WEATHER_TAG = "ls-weather-timeline"
private const val ROUTE_SHEET_ACTIONS_TAG = "route-sheet-actions"
private const val ROUTE_SHEET_SAVE_BUTTON_TAG = "route-sheet-save-button"
private const val ROUTE_SHEET_RIDE_BUTTON_TAG = "route-sheet-ride-button"

// Semantics keys
val LSRouteSheetTitleKey = SemanticsPropertyKey<String>("LSRouteSheetTitle")
val LSRouteSheetViaKey = SemanticsPropertyKey<String>("LSRouteSheetVia")

private var SemanticsPropertyReceiver.lsRouteSheetTitle by LSRouteSheetTitleKey
private var SemanticsPropertyReceiver.lsRouteSheetVia by LSRouteSheetViaKey

// Data class for route details
data class RouteDetails(
    val id: String,
    val title: String,
    val via: String,
    val isBest: Boolean,
    val distance: String,
    val time: String,
    val climb: String,
    val scenicScore: String,
)

/**
 * LSRouteSheet - Route details bottom sheet organism
 *
 * Composed from LSBottomSheet with drag handle, optional LSBestBadge,
 * opinion-serif title, instrument readout, weather timeline, and sticky action row.
 *
 * @param route Route details including title, via, isBest flag, and metrics
 * @param weatherTimeline List of weather timeline entries for the route
 * @param timeRange Time range for the weather timeline header as Pair<from, to>
 * @param onSave Callback when Save button is tapped
 * @param onRide Callback when Ride this button is tapped
 * @param onDismiss Callback when sheet is dismissed (drag-down or backdrop tap)
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSRouteSheet(
    route: RouteDetails,
    weatherTimeline: List<WeatherTimelineEntry>,
    timeRange: Pair<String, String>,
    onSave: () -> Unit,
    onRide: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSBottomSheet(
        detent = BottomSheetDetent.Large,
        onDismiss = onDismiss,
        modifier = modifier.testTag(LS_ROUTE_SHEET_TAG),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(theme.space.md),
        ) {
            // Header row: best badge (optional) + title + subtitle
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(ROUTE_SHEET_HEADER_TAG),
                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                // Best badge (only when route.isBest == true)
                if (route.isBest) {
                    Box(
                        modifier = Modifier.testTag(ROUTE_SHEET_BADGE_TAG),
                        contentAlignment = Alignment.CenterStart,
                    ) {
                        LSBestBadge()
                    }
                }

                // Title (opinion.lg)
                LSText(
                    text = route.title,
                    variant = TypographyVariant.Opinion.Lg,
                    color = ContentColor.Primary,
                    modifier = Modifier
                        .testTag(ROUTE_SHEET_TITLE_TAG)
                        .semantics { lsRouteSheetTitle = route.title },
                )

                // Via subtitle (ui.body.md, textMuted)
                LSText(
                    text = route.via,
                    variant = TypographyVariant.Ui.Body.Md,
                    color = ContentColor.Subtle,
                    modifier = Modifier
                        .testTag(ROUTE_SHEET_SUBTITLE_TAG)
                        .semantics { lsRouteSheetVia = route.via },
                )
            }

            // Instrument readout (4 metrics: dist, time, climb, scenic)
            com.laneshadow.ui.molecules.LSInstrumentReadout(
                metrics = listOf(
                    InstrumentMetric(label = "Dist", value = route.distance),
                    InstrumentMetric(label = "Time", value = route.time),
                    InstrumentMetric(label = "Climb", value = route.climb),
                    InstrumentMetric(label = "Scenic", value = route.scenicScore, isAccent = route.isBest),
                ),
                modifier = Modifier.testTag(ROUTE_SHEET_INSTRUMENT_TAG),
            )

            // Weather timeline
            com.laneshadow.ui.molecules.LSWeatherTimeline(
                entries = weatherTimeline,
                from = timeRange.first,
                to = timeRange.second,
                modifier = Modifier.testTag(ROUTE_SHEET_WEATHER_TAG),
            )

            // Sticky action row: Save (outline, flex 1) + Ride this (primary, flex 2)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(ROUTE_SHEET_ACTIONS_TAG),
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                // Save button (outline, flex 1)
                LSButton(
                    label = "Save",
                    variant = ButtonVariant.Outline,
                    leadingIcon = IconName.Bookmark,
                    onClick = onSave,
                    modifier = Modifier
                        .weight(1f)
                        .testTag(ROUTE_SHEET_SAVE_BUTTON_TAG),
                )

                // Ride this button (primary, flex 2)
                LSButton(
                    label = "Ride this",
                    variant = ButtonVariant.Primary,
                    trailingIcon = IconName.ChevR,
                    onClick = onRide,
                    modifier = Modifier
                        .weight(2f)
                        .testTag(ROUTE_SHEET_RIDE_BUTTON_TAG),
                )
            }
        }
    }
}

private const val ROUTE_SHEET_HEADER_TAG = "route-sheet-header"
