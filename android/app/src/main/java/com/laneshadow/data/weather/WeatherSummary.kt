package com.laneshadow.data.weather

import java.time.DayOfWeek

/**
 * Weather summary data from Convex action `weather.getCurrentWeather`
 */
data class WeatherSummary(
    val tempFahrenheit: Double,
    val conditionLabel: String,
    val dayOfWeek: DayOfWeek,
    val severity: WeatherSeverity = WeatherSeverity.NONE,
)

/**
 * Weather severity levels for advisory card gating
 */
enum class WeatherSeverity {
    NONE,
    ADVISORY,
    WARNING,
}
