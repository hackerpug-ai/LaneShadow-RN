package com.laneshadow.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class HourlyForecastDto(
    val hour: String = "",
    val temperature: String = "",
    val condition: String = "",
)
