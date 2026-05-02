package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

@OptIn(ExperimentalCoroutinesApi::class)
class AppStateRepositoryTest {
    @get:Rule
    val temporaryFolder = TemporaryFolder()

    @Test
    fun setSessionCamera_persistsAndEmitsViaAppStateFlow() = runTest {
        val dataStore = createAppStateDataStore()
        val repository = AppStateRepositoryImpl(dataStore)
        val camera = CameraPosition(lat = 37.7, lng = -122.4, zoom = 12f)

        repository.setSessionCamera("sess-1", camera)

        val appState = repository.appState.first()
        assertThat(appState.sessionCameras).containsKey("sess-1")
        assertThat(appState.sessionCameras["sess-1"]).isEqualTo(camera)
    }

    @Test
    fun setLastViewedSessionId_updatesPersistedAppState() = runTest {
        val dataStore = createAppStateDataStore()
        val repository = AppStateRepositoryImpl(dataStore)

        repository.setLastViewedSessionId("sess-1")

        val appState = repository.appState.first()
        assertThat(appState.lastViewedSessionId).isEqualTo("sess-1")
    }

    private fun createAppStateDataStore() =
        androidx.datastore.preferences.core.PreferenceDataStoreFactory.create(
            scope = CoroutineScope(SupervisorJob() + Dispatchers.Unconfined),
            produceFile = { File(temporaryFolder.root, "app_state.preferences_pb") },
        )
}
