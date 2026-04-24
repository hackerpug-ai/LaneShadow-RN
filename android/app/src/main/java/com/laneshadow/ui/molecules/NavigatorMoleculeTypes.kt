package com.laneshadow.ui.molecules

import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

/**
 * Planning phase for LSPhaseIndicator molecule
 *
 * @param label Step label text (e.g., "Understanding your request")
 * @param state Current phase state (Pending, Active, Done)
 */
data class PlanningPhase(
    val label: String,
    val state: PhaseDotState,
)

/**
 * Weather condition sealed interface for LSWeatherTimeline molecule
 * Reused from UC-MOL-05 PillSemanticsTypes pattern
 */
sealed interface WeatherCondition {
    data object Clear : WeatherCondition
    data object Rain : WeatherCondition
    data object Wind : WeatherCondition
    data object Storm : WeatherCondition
    data object Hot : WeatherCondition
    data object Cold : WeatherCondition

    companion object {
        /**
         * Get the icon name for a weather condition
         */
        fun icon(condition: WeatherCondition): IconName =
            when (condition) {
                Clear -> IconName.Sun
                Rain -> IconName.Rain
                Wind -> IconName.Wind
                Storm -> IconName.Storm
                Hot -> IconName.Therm
                Cold -> IconName.Therm
            }
    }
}

/**
 * Weather timeline entry for LSWeatherTimeline molecule
 *
 * @param hour Hour label (e.g., "9 AM")
 * @param condition Weather condition for this hour
 * @param temperature Temperature string (e.g., "68°")
 */
data class WeatherTimelineEntry(
    val hour: String,
    val condition: WeatherCondition,
    val temperature: String,
)

/**
 * Instrument metric for LSInstrumentReadout molecule
 *
 * @param label Metric label (e.g., "Dist", "Time", "Climb", "Scenic")
 * @param value Metric value (e.g., "64 mi", "2h 10m", "2,400ft", "9.2")
 * @param isAccent Whether to use signal color for value (default: false, used for scenic score)
 */
data class InstrumentMetric(
    val label: String,
    val value: String,
    val isAccent: Boolean = false,
)
