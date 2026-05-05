package com.laneshadow.data.weather

import com.laneshadow.services.ConvexClientProvider
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlin.time.Duration.Companion.minutes

/**
 * Repository interface for weather data from Convex
 */
interface WeatherRepository {
    /**
     * Subscribe to current weather updates from Convex action `weather.getCurrentWeather`
     *
     * Since weather is an action (not a query), this polls the action every 15 minutes.
     * The action is single-shot and requires lat/lng arguments.
     */
    fun subscribeToCurrentWeather(): Flow<WeatherSummary?>
}

@Singleton
class WeatherRepositoryImpl @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : WeatherRepository {
    override fun subscribeToCurrentWeather(): Flow<WeatherSummary?> = flow {
        // Default to Santa Cruz coordinates until location is wired in IDLE-S06-AND-T03
        val defaultLat = 36.97
        val defaultLng = -122.03

        while (true) {
            val result = convexClientProvider.getCurrentWeather(defaultLat, defaultLng)
            emit(
                result
                    .map { it.toDomain() }
                    .getOrNull(),
            )

            // Poll every 15 minutes
            delay(15.minutes)
        }
    }
}
