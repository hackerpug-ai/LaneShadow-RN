package com.laneshadow.data.weather

import com.laneshadow.services.ConvexClientProvider
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for weather data from Convex
 */
interface WeatherRepository {
    /**
     * Subscribe to current weather updates from Convex action `weather.getCurrentWeather`
     */
    fun subscribeToCurrentWeather(): Flow<WeatherSummary?>
}

@Singleton
class WeatherRepositoryImpl @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : WeatherRepository {
    override fun subscribeToCurrentWeather(): Flow<WeatherSummary?> {
        // TODO: Implement Convex action call to weather.getCurrentWeather
        // For now, return a flow that emits null until the backend is ready
        return kotlinx.coroutines.flow.flowOf(null)
    }
}
