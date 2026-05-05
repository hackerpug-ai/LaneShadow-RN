package com.laneshadow.data.dto

import com.laneshadow.data.weather.WeatherSummary
import com.laneshadow.data.weather.WeatherSeverity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.DayOfWeek
import java.time.LocalDate

/**
 * Convex DTO for weather action response
 * Matches: server/convex/actions/weather.ts getCurrentWeather returns
 */
@Serializable
data class WeatherDto(
    @SerialName("tempF") val tempFahrenheit: Double,
    val condition: String,
    val severity: String,
) {
    fun toDomain(): WeatherSummary {
        val today = LocalDate.now()
        val dayOfWeek = today.dayOfWeek

        return WeatherSummary(
            tempFahrenheit = tempFahrenheit,
            conditionLabel = condition.lowercase().replaceFirstChar { it.uppercase() },
            dayOfWeek = dayOfWeek,
            severity = when (severity.lowercase()) {
                "warning" -> WeatherSeverity.WARNING
                "advisory" -> WeatherSeverity.ADVISORY
                else -> WeatherSeverity.NONE
            },
        )
    }
}
