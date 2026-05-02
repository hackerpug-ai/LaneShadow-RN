package com.laneshadow.services

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

interface AppStateRepository {
    val appState: Flow<AppPreferences>

    suspend fun setLastViewedSessionId(sessionId: String?)
    suspend fun setSessionCamera(sessionId: String, camera: CameraPosition)
    suspend fun setDefaultCamera(camera: CameraPosition?)
    suspend fun setThemeMode(themeMode: ThemeMode)
    suspend fun setHasCompletedOnboarding(hasCompletedOnboarding: Boolean)
    suspend fun clearSessionLocalState()
}

@Serializable
data class CameraPosition(
    val lat: Double,
    val lng: Double,
    val zoom: Float,
)

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK,
}

data class AppPreferences(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val hasCompletedOnboarding: Boolean = false,
    val lastViewedSessionId: String? = null,
    val defaultCamera: CameraPosition? = null,
    val sessionCameras: Map<String, CameraPosition> = emptyMap(),
)

@Singleton
class AppStateRepositoryImpl @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) : AppStateRepository {
    override val appState: Flow<AppPreferences> =
        dataStore.data
            .catch { exception ->
                if (exception is IOException) {
                    emit(emptyPreferences())
                } else {
                    throw exception
                }
            }
            .map { preferences -> preferences.toAppPreferences() }

    override suspend fun setLastViewedSessionId(sessionId: String?) {
        dataStore.edit { preferences ->
            if (sessionId == null) {
                preferences.remove(Keys.lastViewedSessionId)
            } else {
                preferences[Keys.lastViewedSessionId] = sessionId
            }
        }
    }

    override suspend fun setSessionCamera(sessionId: String, camera: CameraPosition) {
        dataStore.edit { preferences ->
            val current = preferences.decodeSessionCameras()
            preferences[Keys.sessionCameras] = encodeSessionCameras(
                current + (sessionId to camera),
            )
        }
    }

    override suspend fun setDefaultCamera(camera: CameraPosition?) {
        dataStore.edit { preferences ->
            if (camera == null) {
                preferences.remove(Keys.defaultCamera)
            } else {
                preferences[Keys.defaultCamera] = json.encodeToString(CameraPosition.serializer(), camera)
            }
        }
    }

    override suspend fun setThemeMode(themeMode: ThemeMode) {
        dataStore.edit { preferences ->
            preferences[Keys.themeMode] = themeMode.name
        }
    }

    override suspend fun setHasCompletedOnboarding(hasCompletedOnboarding: Boolean) {
        dataStore.edit { preferences ->
            preferences[Keys.hasCompletedOnboarding] = hasCompletedOnboarding
        }
    }

    override suspend fun clearSessionLocalState() {
        dataStore.edit { preferences ->
            preferences.remove(Keys.lastViewedSessionId)
            preferences.remove(Keys.defaultCamera)
            preferences.remove(Keys.sessionCameras)
        }
    }

    private fun Preferences.toAppPreferences(): AppPreferences =
        AppPreferences(
            themeMode = this[Keys.themeMode]
                ?.let { runCatching { ThemeMode.valueOf(it) }.getOrDefault(ThemeMode.SYSTEM) }
                ?: ThemeMode.SYSTEM,
            hasCompletedOnboarding = this[Keys.hasCompletedOnboarding] ?: false,
            lastViewedSessionId = this[Keys.lastViewedSessionId],
            defaultCamera = this[Keys.defaultCamera]?.let { decodeCamera(it) },
            sessionCameras = decodeSessionCameras(),
        )

    private fun Preferences.decodeSessionCameras(): Map<String, CameraPosition> =
        this[Keys.sessionCameras]
            ?.let { serialized -> runCatching { json.decodeFromString(sessionCameraMapSerializer, serialized) }.getOrElse { emptyMap() } }
            ?: emptyMap()

    private fun encodeSessionCameras(cameras: Map<String, CameraPosition>): String =
        json.encodeToString(sessionCameraMapSerializer, cameras)

    private fun decodeCamera(serialized: String): CameraPosition? =
        runCatching { json.decodeFromString(CameraPosition.serializer(), serialized) }.getOrNull()

    private companion object {
        object Keys {
            val themeMode = stringPreferencesKey("theme_mode")
            val hasCompletedOnboarding = booleanPreferencesKey("has_completed_onboarding")
            val lastViewedSessionId = stringPreferencesKey("last_viewed_session_id")
            val defaultCamera = stringPreferencesKey("default_camera")
            val sessionCameras = stringPreferencesKey("session_cameras")
        }

        val json = Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }

        val sessionCameraMapSerializer = MapSerializer(String.serializer(), CameraPosition.serializer())
    }
}
