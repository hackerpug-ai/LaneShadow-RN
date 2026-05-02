package com.laneshadow.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import com.laneshadow.services.AppStateRepository
import com.laneshadow.services.AppStateRepositoryImpl
import com.laneshadow.services.ChatRepository
import com.laneshadow.services.SessionRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

@Module
@InstallIn(SingletonComponent::class)
abstract class AppStateBindingsModule {
    @Binds
    @Singleton
    abstract fun bindAppStateRepository(repository: AppStateRepositoryImpl): AppStateRepository
}

@Module
@InstallIn(SingletonComponent::class)
object AppStateModule {
    @Provides
    @Singleton
    fun provideAppStateDataStore(
        @ApplicationContext context: Context,
    ): DataStore<Preferences> =
        PreferenceDataStoreFactory.create(
            scope = CoroutineScope(SupervisorJob() + Dispatchers.IO),
            produceFile = { context.preferencesDataStoreFile(APP_STATE_DATA_STORE_NAME) },
        )

    @Provides
    @Singleton
    fun provideChatRepository(): ChatRepository = object : ChatRepository {}

    @Provides
    @Singleton
    fun provideSessionRepository(): SessionRepository = object : SessionRepository {}

    private const val APP_STATE_DATA_STORE_NAME = "app_state"
}
