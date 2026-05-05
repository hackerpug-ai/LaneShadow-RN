package com.laneshadow.data.dto

import com.laneshadow.data.weather.WeatherSummary
import com.laneshadow.data.weather.WeatherSeverity
import kotlinx.serialization.Serializable
import java.time.DayOfWeek
import kotlinx.serialization.SerialName

/**
 * Convex DTO for weather action response
 * Matches: server/convex/actions/weather.ts getCurrentWeather returns
 */
@Serializable
data class WeatherDto(
    @SerialName("tempF") val tempFahrenheit: Double,
    val condition: String,
    val severity: String,
    val dayOfWeek: String,
) {
    fun toDomain(): WeatherSummary {
        return WeatherSummary(
            tempFahrenheit = tempFahrenheit,
            conditionLabel = condition.lowercase().replaceFirstChar { it.uppercase() },
            dayOfWeek = DayOfWeek.valueOf(dayOfWeek.uppercase()),
            severity = when (severity.lowercase()) {
                "warning" -> WeatherSeverity.WARNING
                "advisory" -> WeatherSeverity.ADVISORY
                else -> WeatherSeverity.NONE
            },
        )
    }
}
