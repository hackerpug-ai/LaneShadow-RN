package com.laneshadow.ui.molecules

import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

data class PlanningPhase(
    val label: String,
    val state: PhaseDotState,
)

data class WeatherTimelineEntry(
    val hour: String,
    val condition: WeatherCondition,
    val temperature: String,
)

data class InstrumentMetric(
    val label: String,
    val value: String,
    val isAccent: Boolean = false,
)
