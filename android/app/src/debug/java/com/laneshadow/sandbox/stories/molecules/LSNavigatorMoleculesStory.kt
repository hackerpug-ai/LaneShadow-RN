package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.ui.molecules.InstrumentMetric
import com.laneshadow.ui.molecules.LSInstrumentReadout
import com.laneshadow.ui.molecules.LSPhaseIndicator
import com.laneshadow.ui.molecules.LSWeatherTimeline
import com.laneshadow.ui.molecules.PlanningPhase
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.molecules.WeatherTimelineEntry
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSNavigatorMoleculesStory {
    val all: List<Story> = listOf(
        // LSPhaseIndicator stories
        Story(
            id = "molecules.phase.default",
            tier = ComponentTier.Molecule,
            component = "LSPhaseIndicator",
            name = "Default",
            summary = "Phase indicator with one active step.",
            content = { PhaseIndicatorDefaultStory() },
        ),
        Story(
            id = "molecules.phase.all-done",
            tier = ComponentTier.Molecule,
            component = "LSPhaseIndicator",
            name = "All Done",
            summary = "Phase indicator with all steps complete.",
            content = { PhaseIndicatorAllDoneStory() },
        ),
        Story(
            id = "molecules.phase.all-pending",
            tier = ComponentTier.Molecule,
            component = "LSPhaseIndicator",
            name = "All Pending",
            summary = "Phase indicator with all steps pending.",
            content = { PhaseIndicatorAllPendingStory() },
        ),

        // LSWeatherTimeline stories
        Story(
            id = "molecules.weather.timeline.6-hours",
            tier = ComponentTier.Molecule,
            component = "LSWeatherTimeline",
            name = "6 Hours",
            summary = "Weather timeline with 6 hourly cells.",
            content = { WeatherTimeline6HoursStory() },
        ),
        Story(
            id = "molecules.weather.timeline.mixed",
            tier = ComponentTier.Molecule,
            component = "LSWeatherTimeline",
            name = "Mixed Weather",
            summary = "Weather timeline with mixed conditions.",
            content = { WeatherTimelineMixedStory() },
        ),
        Story(
            id = "molecules.weather.timeline.all-clear",
            tier = ComponentTier.Molecule,
            component = "LSWeatherTimeline",
            name = "All Clear",
            summary = "Weather timeline with all clear conditions.",
            content = { WeatherTimelineAllClearStory() },
        ),

        // LSInstrumentReadout stories
        Story(
            id = "molecules.instrument.4-metrics",
            tier = ComponentTier.Molecule,
            component = "LSInstrumentReadout",
            name = "4 Metrics",
            summary = "Instrument readout with 4 metrics.",
            content = { InstrumentReadout4MetricsStory() },
        ),
        Story(
            id = "molecules.instrument.3-metrics",
            tier = ComponentTier.Molecule,
            component = "LSInstrumentReadout",
            name = "3 Metrics",
            summary = "Instrument readout with 3 metrics.",
            content = { InstrumentReadout3MetricsStory() },
        ),
        Story(
            id = "molecules.instrument.long-values",
            tier = ComponentTier.Molecule,
            component = "LSInstrumentReadout",
            name = "Long Values",
            summary = "Instrument readout with long metric values.",
            content = { InstrumentReadoutLongValuesStory() },
        ),
    )
}

// LSPhaseIndicator stories

@Composable
private fun PhaseIndicatorDefaultStory() {
    LaneShadowTheme {
        StoryColumn {
            LSPhaseIndicator(
                phases = listOf(
                    PlanningPhase("Understanding your request", PhaseDotState.Done),
                    PlanningPhase("Searching routes", PhaseDotState.Active),
                    PlanningPhase("Checking conditions", PhaseDotState.Pending),
                    PlanningPhase("Evaluating options", PhaseDotState.Pending),
                    PlanningPhase("Finalizing plan", PhaseDotState.Pending),
                ),
                header = "Let me think on that…",
            )
        }
    }
}

@Composable
private fun PhaseIndicatorAllDoneStory() {
    LaneShadowTheme {
        StoryColumn {
            LSPhaseIndicator(
                phases = listOf(
                    PlanningPhase("Understanding your request", PhaseDotState.Done),
                    PlanningPhase("Searching routes", PhaseDotState.Done),
                    PlanningPhase("Checking conditions", PhaseDotState.Done),
                    PlanningPhase("Evaluating options", PhaseDotState.Done),
                    PlanningPhase("Finalizing plan", PhaseDotState.Done),
                ),
                header = "Route found!",
            )
        }
    }
}

@Composable
private fun PhaseIndicatorAllPendingStory() {
    LaneShadowTheme {
        StoryColumn {
            LSPhaseIndicator(
                phases = listOf(
                    PlanningPhase("Understanding your request", PhaseDotState.Pending),
                    PlanningPhase("Searching routes", PhaseDotState.Pending),
                    PlanningPhase("Checking conditions", PhaseDotState.Pending),
                    PlanningPhase("Evaluating options", PhaseDotState.Pending),
                    PlanningPhase("Finalizing plan", PhaseDotState.Pending),
                ),
                header = "Starting search…",
            )
        }
    }
}

// LSWeatherTimeline stories

@Composable
private fun WeatherTimeline6HoursStory() {
    LaneShadowTheme {
        StoryColumn {
            LSWeatherTimeline(
                entries = listOf(
                    WeatherTimelineEntry("9 AM", WeatherCondition.Clear, "68°"),
                    WeatherTimelineEntry("10 AM", WeatherCondition.Clear, "72°"),
                    WeatherTimelineEntry("11 AM", WeatherCondition.Clear, "75°"),
                    WeatherTimelineEntry("12 PM", WeatherCondition.Clear, "78°"),
                    WeatherTimelineEntry("1 PM", WeatherCondition.Clear, "76°"),
                    WeatherTimelineEntry("2 PM", WeatherCondition.Clear, "74°"),
                ),
                from = "9 AM",
                to = "2 PM",
            )
        }
    }
}

@Composable
private fun WeatherTimelineMixedStory() {
    LaneShadowTheme {
        StoryColumn {
            LSWeatherTimeline(
                entries = listOf(
                    WeatherTimelineEntry("9 AM", WeatherCondition.Clear, "68°"),
                    WeatherTimelineEntry("10 AM", WeatherCondition.Rain, "65°"),
                    WeatherTimelineEntry("11 AM", WeatherCondition.Rain, "63°"),
                    WeatherTimelineEntry("12 PM", WeatherCondition.Wind, "62°"),
                    WeatherTimelineEntry("1 PM", WeatherCondition.Clear, "70°"),
                    WeatherTimelineEntry("2 PM", WeatherCondition.Clear, "74°"),
                ),
                from = "9 AM",
                to = "2 PM",
            )
        }
    }
}

@Composable
private fun WeatherTimelineAllClearStory() {
    LaneShadowTheme {
        StoryColumn {
            LSWeatherTimeline(
                entries = listOf(
                    WeatherTimelineEntry("9 AM", WeatherCondition.Clear, "68°"),
                    WeatherTimelineEntry("10 AM", WeatherCondition.Clear, "72°"),
                    WeatherTimelineEntry("11 AM", WeatherCondition.Clear, "75°"),
                    WeatherTimelineEntry("12 PM", WeatherCondition.Clear, "78°"),
                    WeatherTimelineEntry("1 PM", WeatherCondition.Clear, "76°"),
                    WeatherTimelineEntry("2 PM", WeatherCondition.Clear, "74°"),
                    WeatherTimelineEntry("3 PM", WeatherCondition.Clear, "72°"),
                    WeatherTimelineEntry("4 PM", WeatherCondition.Clear, "70°"),
                ),
                from = "9 AM",
                to = "4 PM",
            )
        }
    }
}

// LSInstrumentReadout stories

@Composable
private fun InstrumentReadout4MetricsStory() {
    LaneShadowTheme {
        StoryColumn {
            LSInstrumentReadout(
                metrics = listOf(
                    InstrumentMetric("Dist", "64 mi"),
                    InstrumentMetric("Time", "2h 10m"),
                    InstrumentMetric("Climb", "2,400ft"),
                    InstrumentMetric("Scenic", "9.2", isAccent = true),
                ),
            )
        }
    }
}

@Composable
private fun InstrumentReadout3MetricsStory() {
    LaneShadowTheme {
        StoryColumn {
            LSInstrumentReadout(
                metrics = listOf(
                    InstrumentMetric("Dist", "42 mi"),
                    InstrumentMetric("Time", "1h 45m"),
                    InstrumentMetric("Climb", "1,800ft"),
                ),
            )
        }
    }
}

@Composable
private fun InstrumentReadoutLongValuesStory() {
    LaneShadowTheme {
        StoryColumn {
            LSInstrumentReadout(
                metrics = listOf(
                    InstrumentMetric("Distance", "124.5 miles"),
                    InstrumentMetric("Duration", "5h 32m"),
                    InstrumentMetric("Elevation", "8,450ft gain"),
                    InstrumentMetric("Scenic", "9.7", isAccent = true),
                ),
            )
        }
    }
}

@Composable
private fun StoryColumn(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.lg),
        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
    ) {
        content()
    }
}
