package com.laneshadow.di

import com.laneshadow.services.ConvexClientProvider
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ConvexModule {
    @Provides
    @Singleton
    fun provideConvexClientProvider(
        convexClientProvider: ConvexClientProvider,
    ): ConvexClientProvider {
        return convexClientProvider
    }
}
