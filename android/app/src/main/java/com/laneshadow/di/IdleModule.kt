package com.laneshadow.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import java.time.LocalTime
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object IdleModule {
    @Provides
    @Singleton
    fun provideTimeProvider(): () -> LocalTime = { LocalTime.now() }
}
