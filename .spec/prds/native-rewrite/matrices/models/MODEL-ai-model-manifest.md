# MODEL-ai-model-manifest.md - Model Manifest Service Translation Plan

**Document ID**: MAT-MODEL-AI-MODEL-MANIFEST
**Status**: Draft
**Source File**: `react-native/lib/ai/model-manifest.ts`
**Classification**: PORT
**Priority**: P0 (Model version management)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Model manifest service managing remote model manifest checking and version management. Fetches remote manifest from CDN, compares local vs remote versions, queues background downloads for updates, and implements rollback for failed updates.

---

## Platform Translation Strategy

### Android (Kotlin)

**Storage**: DataStore (Proto) for metadata, cache for manifest

```kotlin
// ModelManifestService.kt
class ModelManifestService(
    private val manifestUrl: String = DEFAULT_MANIFEST_URL,
    private val context: Context
) {
    private val metadataDataStore: DataStore<ModelMetadata> by lazy {
        context.createDataStore("model_metadata.pb")
    }

    suspend fun fetchManifest(forceRefresh: Boolean = false): ModelManifest = withContext(Dispatchers.IO) {
        // Check cache
        if (!forceRefresh && cachedManifest != null) {
            return@withContext cachedManifest!!
        }

        // Check DataStore cache
        if (!forceRefresh) {
            val cached = context.getSharedPreferences("model_manifest", Context.MODE_PRIVATE)
                .getString("manifest_cache", null)
            if (cached != null) {
                val data = JSONObject(cached)
                val timestamp = data.getLong("timestamp", 0)
                val age = System.currentTimeMillis() - timestamp

                if (age < MANIFEST_CACHE_DURATION) {
                    val manifest = parseManifest(data.getJSONObject("manifest"))
                    cachedManifest = manifest
                    return@withContext manifest
                }
            }
        }

        // Fetch from remote
        val client = OkHttpClient()
        val request = Request.Builder()
            .url(manifestUrl)
            .header("Accept", "application/json")
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            throw IOException("Manifest fetch failed: ${response.code}")
        }

        val manifestJson = JSONObject(response.body?.string() ?: "")
        val manifest = parseManifest(manifestJson)

        // Cache
        cachedManifest = manifest
        context.getSharedPreferences("model_manifest", Context.MODE_PRIVATE)
            .edit()
            .putString("manifest_cache", JSONObject()
                .put("manifest", manifestJson)
                .put("timestamp", System.currentTimeMillis())
                .toString())
            .apply()

        return@withContext manifest
    }

    suspend fun getLocalModelMetadata(modelId: String): LocalModelMetadata? = withContext(Dispatchers.IO) {
        try {
            metadataDataStore.data.first()[PreferencesKeys.modelMetadata[modelId]]
        } catch (e: Exception) {
            null
        }
    }

    suspend fun saveLocalModelMetadata(metadata: LocalModelMetadata) = withContext(Dispatchers.IO) {
        metadataDataStore.updateData { prefs ->
            prefs.toBuilder()
                .putModelMetadata(metadata.id, metadata.toProto())
                .build()
        }
    }

    suspend fun checkForUpdates(modelId: String): ModelUpdateCheck = withContext(Dispatchers.IO) {
        val manifest = fetchManifest()
        val localMetadata = getLocalModelMetadata(modelId)

        if (localMetadata == null) {
            val remoteModel = manifest.models.find { it.id == modelId }
                ?: throw IllegalArgumentException("Model $modelId not found in manifest")

            return@withContext ModelUpdateCheck(
                hasUpdate = true,
                availableVersion = remoteModel.version,
                updateSize = remoteModel.sizeBytes,
                changelog = remoteModel.changelog
            )
        }

        val remoteModel = manifest.models.find { it.id == modelId }
            ?: return@withContext ModelUpdateCheck(
                hasUpdate = false,
                currentVersion = localMetadata.version
            )

        if (remoteModel.version != localMetadata.version) {
            return@withContext ModelUpdateCheck(
                hasUpdate = true,
                currentVersion = localMetadata.version,
                availableVersion = remoteModel.version,
                updateSize = remoteModel.sizeBytes,
                changelog = remoteModel.changelog
            )
        }

        return@withContext ModelUpdateCheck(
            hasUpdate = false,
            currentVersion = localMetadata.version
        )
    }

    companion object {
        private const val DEFAULT_MANIFEST_URL = "https://cdn.example.com/models/manifest.json"
        private const val MANIFEST_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
        private var cachedManifest: ModelManifest? = null
    }
}

// Data classes
data class ModelManifest(
    val models: List<ModelManifestEntry>,
    val lastUpdated: Long
)

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

data class LocalModelMetadata(
    val id: String,
    val version: String,
    val checksum: String,
    val downloadDate: Long,
    val sizeBytes: Long,
    val lastValidated: Long
)

data class ModelUpdateCheck(
    val hasUpdate: Boolean,
    val currentVersion: String? = null,
    val availableVersion: String? = null,
    val updateSize: Long? = null,
    val changelog: List<String>? = null
)
```

### iOS (Swift)

**Storage**: SwiftData for metadata, UserDefaults for manifest cache

```swift
// ModelManifestService.swift
class ModelManifestService {
    private let manifestUrl: String
    private var cachedManifest: ModelManifest?

    init(manifestUrl: String = DEFAULT_MANIFEST_URL) {
        self.manifestUrl = manifestUrl
    }

    func fetchManifest(forceRefresh: Bool = false) async throws -> ModelManifest {
        // Check cache
        if !forceRefresh, let cached = cachedManifest {
            return cached
        }

        // Check UserDefaults cache
        if !forceRefresh,
           let cachedData = UserDefaults.standard.data(forKey: "model_manifest_cache"),
           let cached = try? JSONDecoder().decode(CachedManifest.self, from: cachedData) {
            let age = Date().timeIntervalSince1970 - cached.timestamp
            if age < Double(MANIFEST_CACHE_DURATION) {
                cachedManifest = cached.manifest
                return cached.manifest
            }
        }

        // Fetch from remote
        guard let url = URL(string: manifestUrl) else {
            throw ManifestError.invalidURL
        }

        let (data, _) = try await URLSession.shared.data(from: url)

        let manifest = try JSONDecoder().decode(ModelManifest.self, from: data)

        // Cache
        cachedManifest = manifest
        let cached = CachedManifest(manifest: manifest, timestamp: Date().timeIntervalSince1970)
        if let encoded = try? JSONEncoder().encode(cached) {
            UserDefaults.standard.set(encoded, forKey: "model_manifest_cache")
        }

        return manifest
    }

    func getLocalModelMetadata(modelId: String) async -> LocalModelMetadata? {
        guard let data = UserDefaults.standard.data(forKey: "model_metadata_\(modelId)"),
              let metadata = try? JSONDecoder().decode(LocalModelMetadata.self, from: data) else {
            return nil
        }
        return metadata
    }

    func saveLocalModelMetadata(_ metadata: LocalModelMetadata) async throws {
        let data = try JSONEncoder().encode(metadata)
        UserDefaults.standard.set(data, forKey: "model_metadata_\(metadata.id)")
    }

    func checkForUpdates(modelId: String) async throws -> ModelUpdateCheck {
        let manifest = try await fetchManifest()
        let localMetadata = await getLocalModelMetadata(modelId: modelId)

        if localMetadata == nil {
            guard let remoteModel = manifest.models.first(where: { $0.id == modelId }) else {
                throw ManifestError.modelNotFound(modelId)
            }

            return ModelUpdateCheck(
                hasUpdate: true,
                availableVersion: remoteModel.version,
                updateSize: remoteModel.sizeBytes,
                changelog: remoteModel.changelog
            )
        }

        guard let remoteModel = manifest.models.first(where: { $0.id == modelId }) else {
            return ModelUpdateCheck(hasUpdate: false, currentVersion: localMetadata!.version)
        }

        if remoteModel.version != localMetadata!.version {
            return ModelUpdateCheck(
                hasUpdate: true,
                currentVersion: localMetadata!.version,
                availableVersion: remoteModel.version,
                updateSize: remoteModel.sizeBytes,
                changelog: remoteModel.changelog
            )
        }

        return ModelUpdateCheck(hasUpdate: false, currentVersion: localMetadata!.version)
    }

    private static let DEFAULT_MANIFEST_URL = "https://cdn.example.com/models/manifest.json"
    private static let MANIFEST_CACHE_DURATION: TimeInterval = 24 * 60 * 60 // 24 hours
}

// Data structures
struct ModelManifest: Codable {
    let models: [ModelManifestEntry]
    let lastUpdated: Int64
}

struct ModelManifestEntry: Codable {
    let id: String
    let version: String
    let url: String
    let checksum: String
    let sizeBytes: Int64
    let minAppVersion: String
    let releaseDate: String
    let changelog: [String]?
}

struct LocalModelMetadata: Codable {
    let id: String
    let version: String
    let checksum: String
    let downloadDate: Int64
    let sizeBytes: Int64
    let lastValidated: Int64
}

struct ModelUpdateCheck {
    let hasUpdate: Bool
    let currentVersion: String?
    let availableVersion: String?
    let updateSize: Int64?
    let changelog: [String]?
}

struct CachedManifest: Codable {
    let manifest: ModelManifest
    let timestamp: TimeInterval
}

enum ManifestError: LocalizedError {
    case invalidURL
    case modelNotFound(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid manifest URL"
        case .modelNotFound(let id):
            return "Model \(id) not found in manifest"
        }
    }
}
```

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- React Native source: `react-native/lib/ai/model-manifest.ts`

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
