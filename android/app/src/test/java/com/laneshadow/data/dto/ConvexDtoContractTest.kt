package com.laneshadow.data.dto

import com.google.common.truth.Truth.assertThat
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import org.junit.Assert.assertThrows
import org.junit.Test
import java.time.DayOfWeek

class ConvexDtoContractTest {
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    @Test
    fun favoriteLocationDto_decodesRepairedServerShape() {
        val payload = """
            {
              "id": "fav-123",
              "lat": 36.9741,
              "lng": -122.0308,
              "label": "West Cliff",
              "bounds": {
                "north": 37.0,
                "south": 36.9,
                "east": -121.9,
                "west": -122.1
              }
            }
        """.trimIndent()

        val dto = json.decodeFromString(FavoriteLocationDto.serializer(), payload)
        val domain = dto.toDomain()

        assertThat(domain.id).isEqualTo("fav-123")
        assertThat(domain.lat).isEqualTo(36.9741)
        assertThat(domain.lon).isEqualTo(-122.0308)
        assertThat(domain.label).isEqualTo("West Cliff")
    }

    @Test
    fun weatherDto_toDomain_usesServerDayOfWeek() {
        val payload = """
            {
              "tempF": 61.5,
              "condition": "cloudy",
              "severity": "warning",
              "dayOfWeek": "MONDAY"
            }
        """.trimIndent()

        val dto = json.decodeFromString(WeatherDto.serializer(), payload)
        val domain = dto.toDomain()

        assertThat(domain.tempFahrenheit).isEqualTo(61.5)
        assertThat(domain.conditionLabel).isEqualTo("Cloudy")
        assertThat(domain.severity.name).isEqualTo("WARNING")
        assertThat(domain.dayOfWeek).isEqualTo(DayOfWeek.MONDAY)
    }

    @Test
    fun favoriteLocationDto_rejectsLegacyPayloadWithoutLatLngAndLabel() {
        val legacyPayload = """
            {
              "_id": "fav-legacy",
              "name": "Legacy Favorite",
              "geometry": "{\"type\":\"Point\",\"coordinates\":[-122.03,36.97]}"
            }
        """.trimIndent()

        assertThrows(SerializationException::class.java) {
            json.decodeFromString(FavoriteLocationDto.serializer(), legacyPayload)
        }
    }
}
