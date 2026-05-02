package com.laneshadow.data.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

@Serializable
data class RouteEnrichmentDto(
    val routePlanId: String = "",
    val enrichments: List<RouteEnrichmentEntryDto> = emptyList(),
) {
    fun weatherTimeline(routeOptionId: String, maxHours: Int = 6): List<HourlyForecastDto> =
        enrichments.firstOrNull { it.routeOptionId == routeOptionId }
            ?.weather
            .toHourlyForecasts(maxHours)
}

@Serializable
data class RouteEnrichmentEntryDto(
    val routeOptionId: String = "",
    val label: String = "",
    val rationale: String = "",
    val highlights: List<String> = emptyList(),
    val weather: JsonElement? = null,
)

private fun JsonElement?.toHourlyForecasts(maxHours: Int): List<HourlyForecastDto> {
    val array = this as? JsonArray ?: return emptyList()
    return array.mapNotNull { element ->
        val entry = element.jsonObject
        val hour = entry["hour"]?.jsonPrimitive?.contentOrNull.orEmpty()
        val temperature = entry["temperature"]?.jsonPrimitive?.contentOrNull.orEmpty()
        val condition = entry["condition"]?.jsonPrimitive?.contentOrNull.orEmpty()
        if (hour.isBlank() && temperature.isBlank() && condition.isBlank()) {
            null
        } else {
            HourlyForecastDto(
                hour = hour,
                temperature = temperature,
                condition = condition,
            )
        }
    }.take(maxHours)
}
