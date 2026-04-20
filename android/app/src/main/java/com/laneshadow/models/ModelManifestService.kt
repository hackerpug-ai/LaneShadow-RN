package com.laneshadow.models

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.net.URL

/**
 * Model Manifest Service
 *
 * Manages remote model manifest checking and version management.
 * Fetches from CDN, compares versions, queues background downloads, implements rollback for failed updates.
 *
 * Translated from: react-native/lib/ai/model-manifest.ts
 */

/**
 * Model manifest entry
 */
@Serializable
data class ModelManifestEntry(
    val id: String,
    val version: String,
    val url: String,
    val checksum: String,
    val sizeBytes: Long,
    val minAppVersion: String,
    val releaseDate: String,
    val changelog: List<String>? = null
)

/**
 * Model manifest response
 */
@Serializable
data class ModelManifest(
    val models: List<ModelManifestEntry>,
    val lastUpdated: Long
)

/**
 * Local model metadata
 */
@Serializable
data class LocalModelMetadata(
    val id: String,
    val version: String,
    val checksum: String,
    val downloadDate: Long,
    val sizeBytes: Long,
    val lastValidated: Long
)

/**
 * Model update check result
 */
@Serializable
data class ModelUpdateCheck(
    val hasUpdate: Boolean,
    val currentVersion: String? = null,
    val availableVersion: String? = null,
    val updateSize: Long? = null,
    val changelog: List<String>? = null
)

/**
 * Model manifest service
 */
class ModelManifestService(
    private val context: Context,
    private val manifestUrl: String = DEFAULT_MANIFEST_URL,
    private val checksumValidator: ChecksumValidator
) {
    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private var cachedManifest: ModelManifest? = null

    /**
     * Fetch remote manifest from CDN
     */
    suspend fun fetchManifest(forceRefresh: Boolean = false): ModelManifest = withContext(Dispatchers.IO) {
        try {
            // Check in-memory cache
            if (!forceRefresh && cachedManifest != null) {
                return@withContext cachedManifest!!
            }

            // Check SharedPreferences cache
            val cachedJson = prefs.getString(CACHE_KEY, null)
            if (cachedJson != null && !forceRefresh) {
                try {
                    val cached = Json.decodeFromString<CacheEntry>(cachedJson)
                    val age = System.currentTimeMillis() - cached.timestamp

                    if (age < CACHE_DURATION) {
                        cachedManifest = cached.manifest
                        return@withContext cached.manifest
                    }
                } catch (e: Exception) {
                    // Cache corrupted, ignore and fetch from remote
                }
            }

            // Fetch from remote
            val response = URL(manifestUrl).readText()

            val manifest = Json.decodeFromString<ModelManifest>(response)

            // Cache in memory
            cachedManifest = manifest

            // Cache in SharedPreferences
            val cacheEntry = CacheEntry(manifest, System.currentTimeMillis())
            prefs.edit()
                .putString(CACHE_KEY, Json.encodeToString(cacheEntry))
                .apply()

            manifest
        } catch (error: Throwable) {
            // Return cached manifest if available
            cachedManifest?.let { return@withContext it }
            throw error
        }
    }

    /**
     * Get local model metadata
     */
    suspend fun getLocalModelMetadata(modelId: String): LocalModelMetadata? = withContext(Dispatchers.IO) {
        try {
            val key = "model-metadata-$modelId"
            val data = prefs.getString(key, null) ?: return@withContext null

            Json.decodeFromString(data)
        } catch (error: Throwable) {
            null
        }
    }

    /**
     * Save local model metadata
     */
    suspend fun saveLocalModelMetadata(metadata: LocalModelMetadata) = withContext(Dispatchers.IO) {
        try {
            val key = "model-metadata-${metadata.id}"
            val json = Json.encodeToString(metadata)
            prefs.edit().putString(key, json).apply()
        } catch (error: Throwable) {
            throw error
        }
    }

    /**
     * Check for model updates
     */
    suspend fun checkForUpdates(modelId: String): ModelUpdateCheck = withContext(Dispatchers.IO) {
        try {
            val manifest = fetchManifest()
            val localMetadata = getLocalModelMetadata(modelId)

            if (localMetadata == null) {
                // No local model - first download needed
                val remoteModel = manifest.models.find { it.id == modelId }

                if (remoteModel == null) {
                    throw IllegalStateException("Model $modelId not found in manifest")
                }

                return@withContext ModelUpdateCheck(
                    hasUpdate = true,
                    availableVersion = remoteModel.version,
                    updateSize = remoteModel.sizeBytes,
                    changelog = remoteModel.changelog
                )
            }

            // Compare versions
            val remoteModel = manifest.models.find { it.id == modelId }

            if (remoteModel == null) {
                return@withContext ModelUpdateCheck(
                    hasUpdate = false,
                    currentVersion = localMetadata.version
                )
            }

            if (remoteModel.version != localMetadata.version) {
                // Update available
                return@withContext ModelUpdateCheck(
                    hasUpdate = true,
                    currentVersion = localMetadata.version,
                    availableVersion = remoteModel.version,
                    updateSize = remoteModel.sizeBytes,
                    changelog = remoteModel.changelog
                )
            }

            // Up to date
            ModelUpdateCheck(
                hasUpdate = false,
                currentVersion = localMetadata.version
            )
        } catch (error: Throwable) {
            throw error
        }
    }

    /**
     * Get model manifest entry by ID
     */
    suspend fun getModelEntry(modelId: String): ModelManifestEntry = withContext(Dispatchers.IO) {
        val manifest = fetchManifest()
        val entry = manifest.models.find { it.id == modelId }

        if (entry == null) {
            throw IllegalStateException("Model $modelId not found in manifest")
        }

        entry
    }

    /**
     * Validate model checksum
     */
    suspend fun validateModelChecksum(modelId: String, filePath: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val localMetadata = getLocalModelMetadata(modelId) ?: return@withContext false

            val result = checksumValidator.validate(filePath, localMetadata.checksum)

            if (result.valid) {
                // Update last validated timestamp
                localMetadata.copy(lastValidated = System.currentTimeMillis())
                    .also { saveLocalModelMetadata(it) }
            }

            result.valid
        } catch (error: Throwable) {
            false
        }
    }

    /**
     * Clear manifest cache
     */
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        try {
            prefs.edit().remove(CACHE_KEY).apply()
            cachedManifest = null
        } catch (error: Throwable) {
            // Ignore
        }
    }

    /**
     * Get all available models from manifest
     */
    suspend fun getAvailableModels(): List<ModelManifestEntry> = withContext(Dispatchers.IO) {
        fetchManifest().models
    }

    /**
     * Check if app version meets minimum requirement
     */
    suspend fun checkMinAppVersion(modelId: String, appVersion: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val entry = getModelEntry(modelId)

            // Simple version comparison (assumes semver)
            val minVersion = entry.minAppVersion
            val currentVersion = appVersion

            // Parse versions
            val minParts = minVersion.split(".").mapNotNull { it.toIntOrNull() }
            val currParts = currentVersion.split(".").mapNotNull { it.toIntOrNull() }

            if (minParts.size < 3 || currParts.size < 3) {
                return@withContext false
            }

            val (minMajor, minMinor, minPatch) = Triple(minParts[0], minParts[1], minParts[2])
            val (currMajor, currMinor, currPatch) = Triple(currParts[0], currParts[1], currParts[2])

            // Compare
            when {
                currMajor > minMajor -> true
                currMajor < minMajor -> false
                currMinor > minMinor -> true
                currMinor < minMinor -> false
                else -> currPatch >= minPatch
            }
        } catch (error: Throwable) {
            false
        }
    }

    /**
     * Prepare for model update (backup current model)
     */
    suspend fun prepareUpdate(modelId: String) = withContext(Dispatchers.IO) {
        try {
            val localMetadata = getLocalModelMetadata(modelId)

            if (localMetadata != null) {
                // Save current model metadata for rollback
                val backupJson = Json.encodeToString(localMetadata)
                prefs.edit().putString("model-backup-$modelId", backupJson).apply()
            }
        } catch (error: Throwable) {
            // Ignore
        }
    }

    /**
     * Commit update (remove backup)
     */
    suspend fun commitUpdate(modelId: String) = withContext(Dispatchers.IO) {
        try {
            prefs.edit().remove("model-backup-$modelId").apply()
        } catch (error: Throwable) {
            // Ignore
        }
    }

    /**
     * Rollback update (restore from backup)
     */
    suspend fun rollbackUpdate(modelId: String): LocalModelMetadata? = withContext(Dispatchers.IO) {
        try {
            val backupKey = "model-backup-$modelId"
            val backupData = prefs.getString(backupKey, null)

            if (backupData == null) {
                return@withContext null
            }

            val backup = Json.decodeFromString<LocalModelMetadata>(backupData)

            // Restore metadata
            saveLocalModelMetadata(backup)

            // Remove backup
            prefs.edit().remove(backupKey).apply()

            backup
        } catch (error: Throwable) {
            null
        }
    }

    companion object {
        private const val DEFAULT_MANIFEST_URL = "https://cdn.example.com/models/manifest.json"
        private const val PREFS_NAME = "model-manifest"
        private const val CACHE_KEY = "model-manifest-cache"
        private const val CACHE_DURATION = 24 * 60 * 60 * 1000L // 24 hours
    }

    @Serializable
    private data class CacheEntry(
        val manifest: ModelManifest,
        val timestamp: Long
    )
}
