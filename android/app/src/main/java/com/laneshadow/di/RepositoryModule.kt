package com.laneshadow.di

import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.ChatRepositoryImpl
import com.laneshadow.data.favorites.FavoritesRepository
import com.laneshadow.data.favorites.FavoritesRepositoryImpl
import com.laneshadow.data.location.FusedLocationProvider
import com.laneshadow.data.location.FusedLocationProviderImpl
import com.laneshadow.data.location.LocationRepository
import com.laneshadow.data.location.LocationRepositoryImpl
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.route.RouteRepositoryImpl
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.session.SessionRepositoryImpl
import com.laneshadow.data.user.UserRepository
import com.laneshadow.data.user.UserRepositoryImpl
import com.laneshadow.data.weather.WeatherRepository
import com.laneshadow.data.weather.WeatherRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.serialization.json.Json

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    @Provides
    @Singleton
    fun provideJson(): Json =
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
            explicitNulls = false
        }
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryBindingsModule {
    @Binds
    @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository

    @Binds
    @Singleton
    abstract fun bindSessionRepository(impl: SessionRepositoryImpl): SessionRepository

    @Binds
    @Singleton
    abstract fun bindChatRepository(impl: ChatRepositoryImpl): ChatRepository

    @Binds
    @Singleton
    abstract fun bindRouteRepository(impl: RouteRepositoryImpl): RouteRepository

    @Binds
    @Singleton
    abstract fun bindWeatherRepository(impl: WeatherRepositoryImpl): WeatherRepository

    @Binds
    @Singleton
    abstract fun bindFavoritesRepository(impl: FavoritesRepositoryImpl): FavoritesRepository

    @Binds
    @Singleton
    abstract fun bindLocationRepository(impl: LocationRepositoryImpl): LocationRepository

    @Binds
    @Singleton
    abstract fun bindFusedLocationProvider(impl: FusedLocationProviderImpl): FusedLocationProvider
}
