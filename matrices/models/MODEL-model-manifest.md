# MODEL-model-manifest.md - Version Management Translation Plan

**Source File**: `react-native/lib/ai/model-manifest.ts`
**Classification**: PORT
**Priority**: P1 (model updates)

---

## SOURCE ANALYSIS

### Purpose
Manages remote model manifest checking and version management. Fetches from CDN, compares versions, queues background downloads, implements rollback for failed updates.

### Exports
- `ModelManifestService` class with:
  - `fetchManifest(forceRefresh)` → `Promise<ModelManifest>`
  - `getLocalModelMetadata(modelId)` → `Promise<LocalModelMetadata | null>`
  - `saveLocalModelMetadata(metadata)` → `Promise<void>`
  - `checkForUpdates(modelId)` → `Promise<ModelUpdateCheck>`
  - `getModelEntry(modelId)` → `Promise<ModelManifestEntry>`
  - `validateModelChecksum(modelId, filePath)` → `Promise<boolean>`
  - `clearCache()` → `Promise<void>`
  - `getAvailableModels()` → `Promise<ModelManifestEntry[]>`
  - `checkMinAppVersion(modelId, appVersion)` → `Promise<boolean>`
  - `prepareUpdate(modelId)` → `Promise<void>`
  - `commitUpdate(modelId)` → `Promise<void>`
  - `rollbackUpdate(modelId)` → `Promise<LocalModelMetadata | null>`

### Dependencies
- `@react-native-async-storage/async-storage` (AsyncStorage) - Persistence
- `./checksum.ts` (PORT) - Checksum validation
- Dynamic import of checksum module

### Key Behaviors
- In-memory caching with 24-hour AsyncStorage cache duration
- Version comparison using semver parsing
- Rollback support via backup metadata keys
- Checksum validation with lastValidated timestamp update
- Min app version validation (semver comparison)

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// model/ModelManifestService.kt
import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.URL
import java.time.Instant

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

@Serializable
data class ModelManifest(
    val models: List<ModelManifestEntry>,
    val lastUpdated: Long
)

@Serializable
data class LocalModelMetadata(
    val id: String,
    val version: String,
    val checksum: String,
    val downloadDate: Long,
    val sizeBytes: Long,
    val lastValidated: Long
)

@Serializable
data class ModelUpdateCheck(
    val hasUpdate: Boolean,
    val currentVersion: String? = null,
    val availableVersion: String? = null,
    val updateSize: Long? = null,
    val changelog: List<String>? = null
)

class ModelManifestService(
    private val context: Context,
    private val manifestUrl: String = DEFAULT_MANIFEST_URL,
    private val checksumValidator: ChecksumValidator
) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private var cachedManifest: ModelManifest? = null

    suspend fun fetchManifest(forceRefresh: Boolean = false): ModelManifest = withContext(Dispatchers.IO) {
        // Check in-memory cache
        if (!forceRefresh && cachedManifest != null) {
            return@withContext cachedManifest!!
        }

        // Check SharedPreferences cache
        val cachedJson = prefs.getString(CACHE_KEY, null)
        if (cachedJson != null && !forceRefresh) {
            val cached = Json.decodeFromString<CacheEntry>(cachedJson)
            val age = System.currentTimeMillis() - cached.timestamp

            if (age < CACHE_DURATION) {
                cachedManifest = cached.manifest
                return@withContext cached.manifest
            }
        }

        // Fetch from remote
        val response = try {
            URL(manifestUrl).readText()
        } catch (e: Exception) {
            // Return cached manifest if available
            cachedManifest?.let { return@withContext it }
            throw e
        }

        val manifest = Json.decodeFromString<ModelManifest>(response)

        // Cache in memory
        cachedManifest = manifest

        // Cache in SharedPreferences
        val cacheEntry = CacheEntry(manifest, System.currentTimeMillis())
        prefs.edit()
            .putString(CACHE_KEY, Json.encodeToString(cacheEntry))
            .apply()

        manifest
    }

    suspend fun getLocalModelMetadata(modelId: String): LocalModelMetadata? = withContext(Dispatchers.IO) {
        val json = prefs.getString("model-metadata-$modelId", null) ?: return@withContext null
        try {
            Json.decodeFromString(json)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun saveLocalModelMetadata(metadata: LocalModelMetadata) = withContext(Dispatchers.IO) {
        val json = Json.encodeToString(metadata)
        prefs.edit()
            .putString("model-metadata-${metadata.id}", json)
            .apply()
    }

    suspend fun checkForUpdates(modelId: String): ModelUpdateCheck = withContext(Dispatchers.IO) {
        val manifest = fetchManifest()
        val localMetadata = getLocalModelMetadata(modelId)

        if (localMetadata == null) {
            // No local model - first download needed
            val remoteModel = manifest.models.find { it.id == modelId }
                ?: throw IllegalStateException("Model $modelId not found in manifest")

            return@withContext ModelUpdateCheck(
                hasUpdate = true,
                availableVersion = remoteModel.version,
                updateSize = remoteModel.sizeBytes,
                changelog = remoteModel.changelog
            )
        }

        // Compare versions
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

        // Up to date
        ModelUpdateCheck(
            hasUpdate = false,
            currentVersion = localMetadata.version
        )
    }

    suspend fun getModelEntry(modelId: String): ModelManifestEntry {
        val manifest = fetchManifest()
        return manifest.models.find { it.id == modelId }
            ?: throw IllegalStateException("Model $modelId not found in manifest")
    }

    suspend fun validateModelChecksum(modelId: String, filePath: String): Boolean = withContext(Dispatchers.IO) {
        val localMetadata = getLocalModelMetadata(modelId) ?: return@withContext false

        val result = checksumValidator.validate(filePath, localMetadata.checksum)

        if (result.valid) {
            // Update last validated timestamp
            localMetadata.copy(lastValidated = System.currentTimeMillis())
                .also { saveLocalModelMetadata(it) }
        }

        result.valid
    }

    suspend fun clearCache() = withContext(Dispatchers.IO) {
        prefs.edit().remove(CACHE_KEY).apply()
        cachedManifest = null
    }

    suspend fun getAvailableModels(): List<ModelManifestEntry> {
        return fetchManifest().models
    }

    suspend fun checkMinAppVersion(modelId: String, appVersion: String): Boolean = withContext(Dispatchers.IO) {
        val entry = getModelEntry(modelId)

        // Simple semver comparison
        val minVersion = entry.minAppVersion.split(".").mapNotNull { it.toIntOrNull() }
        val currentVersion = appVersion.split(".").mapNotNull { it.toIntOrNull() }

        if (minVersion.size < 3 || currentVersion.size < 3) return@withContext false

        val (minMajor, minMinor, minPatch) = Triple(minVersion[0], minVersion[1], minVersion[2])
        val (currMajor, currMinor, currPatch) = Triple(currentVersion[0], currentVersion[1], currentVersion[2])

        when {
            currMajor > minMajor -> true
            currMajor < minMajor -> false
            currMinor > minMinor -> true
            currMinor < minMinor -> false
            else -> currPatch >= minPatch
        }
    }

    suspend fun prepareUpdate(modelId: String) = withContext(Dispatchers.IO) {
        val localMetadata = getLocalModelMetadata(modelId) ?: return@withContext

        // Save current model metadata for rollback
        val backupJson = Json.encodeToString(localMetadata)
        prefs.edit()
            .putString("model-backup-$modelId", backupJson)
            .apply()
    }

    suspend fun commitUpdate(modelId: String) = withContext(Dispatchers.IO) {
        prefs.edit().remove("model-backup-$modelId").apply()
    }

    suspend fun rollbackUpdate(modelId: String): LocalModelMetadata? = withContext(Dispatchers.IO) {
        val backupJson = prefs.getString("model-backup-$modelId", null)
            ?: return@withContext null

        val backup = Json.decodeFromString<LocalModelMetadata>(backupJson)

        // Restore metadata
        saveLocalModelMetadata(backup)

        // Remove backup
        prefs.edit().remove("model-backup-$modelId").apply()

        backup
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
```

### iOS (Swift)

```swift
// model/ModelManifestService.swift
import Foundation

struct ModelManifestEntry: Codable {
    let id: String
    let version: String
    let url: String
    let checksum: String
    let sizeBytes: Int
    let minAppVersion: String
    let releaseDate: String
    let changelog: [String]?
}

struct ModelManifest: Codable {
    let models: [ModelManifestEntry]
    let lastUpdated: TimeInterval
}

struct LocalModelMetadata: Codable {
    let id: String
    let version: String
    let checksum: String
    let downloadDate: TimeInterval
    let sizeBytes: Int
    var lastValidated: TimeInterval
}

struct ModelUpdateCheck {
    let hasUpdate: Bool
    let currentVersion: String?
    let availableVersion: String?
    let updateSize: Int?
    let changelog: [String]?
}

class ModelManifestService {
    private let manifestUrl: String
    private let checksumValidator: ChecksumValidator
    private var cachedManifest: ModelManifest?
    private let userDefaults: UserDefaults

    init(
        manifestUrl: String = DEFAULT_MANIFEST_URL,
        checksumValidator: ChecksumValidator,
        userDefaults: UserDefaults = .standard
    ) {
        self.manifestUrl = manifestUrl
        self.checksumValidator = checksumValidator
        self.userDefaults = userDefaults
    }

    func fetchManifest(forceRefresh: Bool = false) async throws -> ModelManifest {
        // Check in-memory cache
        if !forceRefresh, let cached = cachedManifest {
            return cached
        }

        // Check UserDefaults cache
        if !forceRefresh,
           let cachedData = userDefaults.data(forKey: CACHE_KEY),
           let cached = try? JSONDecoder().decode(CacheEntry.self, from: cachedData) {
            let age = Date().timeIntervalSince1970 - cached.timestamp

            if age < CACHE_DURATION {
                cachedManifest = cached.manifest
                return cached.manifest
            }
        }

        // Fetch from remote
        let url = URL(string: manifestUrl)!
        let (data, _) = try await URLSession.shared.data(from: url)

        let manifest = try JSONDecoder().decode(ModelManifest.self, from: data)

        // Cache in memory
        cachedManifest = manifest

        // Cache in UserDefaults
        let cacheEntry = CacheEntry(manifest: manifest, timestamp: Date().timeIntervalSince1970)
        if let encoded = try? JSONEncoder().encode(cacheEntry) {
            userDefaults.set(encoded, forKey: CACHE_KEY)
        }

        return manifest
    }

    func getLocalModelMetadata(modelId: String) async -> LocalModelMetadata? {
        guard let data = userDefaults.data(forKey: "model-metadata-\(modelId)") else {
            return nil
        }

        return try? JSONDecoder().decode(LocalModelMetadata.self, from: data)
    }

    func saveLocalModelMetadata(_ metadata: LocalModelMetadata) async {
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(metadata) else { return }

        userDefaults.set(data, forKey: "model-metadata-\(metadata.id)")
    }

    func checkForUpdates(modelId: String) async throws -> ModelUpdateCheck {
        let manifest = try await fetchManifest()
        guard let localMetadata = await getLocalModelMetadata(modelId: modelId) else {
            // No local model - first download needed
            guard let remoteModel = manifest.models.first(where: { $0.id == modelId }) else {
                throw NSError(domain: "ModelManifest", code: -1, userInfo: [NSLocalizedDescriptionKey: "Model not found"])
            }

            return ModelUpdateCheck(
                hasUpdate: true,
                availableVersion: remoteModel.version,
                updateSize: remoteModel.sizeBytes,
                changelog: remoteModel.changelog
            )
        }

        // Compare versions
        guard let remoteModel = manifest.models.first(where: { $0.id == modelId }) else {
            return ModelUpdateCheck(hasUpdate: false, currentVersion: localMetadata.version)
        }

        if remoteModel.version != localMetadata.version {
            return ModelUpdateCheck(
                hasUpdate: true,
                currentVersion: localMetadata.version,
                availableVersion: remoteModel.version,
                updateSize: remoteModel.sizeBytes,
                changelog: remoteModel.changelog
            )
        }

        // Up to date
        return ModelUpdateCheck(hasUpdate: false, currentVersion: localMetadata.version)
    }

    func getModelEntry(modelId: String) async throws -> ModelManifestEntry {
        let manifest = try await fetchManifest()

        guard let entry = manifest.models.first(where: { $0.id == modelId }) else {
            throw NSError(domain: "ModelManifest", code: -1, userInfo: [NSLocalizedDescriptionKey: "Model not found"])
        }

        return entry
    }

    func validateModelChecksum(modelId: String, filePath: String) async -> Bool {
        guard var metadata = await getLocalModelMetadata(modelId: modelId) else {
            return false
        }

        let result = await checksumValidator.validate(filePath: filePath, expectedChecksum: metadata.checksum)

        if result.valid {
            // Update last validated timestamp
            metadata.lastValidated = Date().timeIntervalSince1970
            await saveLocalModelMetadata(metadata)
        }

        return result.valid
    }

    func clearCache() async {
        userDefaults.removeObject(forKey: CACHE_KEY)
        cachedManifest = nil
    }

    func getAvailableModels() async throws -> [ModelManifestEntry] {
        let manifest = try await fetchManifest()
        return manifest.models
    }

    func checkMinAppVersion(modelId: String, appVersion: String) async throws -> Bool {
        let entry = try await getModelEntry(modelId: modelId)

        // Simple semver comparison
        let minParts = entry.minAppVersion.split(separator: ".").compactMap { Int($0) }
        let currParts = appVersion.split(separator: ".").compactMap { Int($0) }

        guard minParts.count >= 3, currParts.count >= 3 else {
            return false
        }

        let (minMajor, minMinor, minPatch) = (minParts[0], minParts[1], minParts[2])
        let (currMajor, currMinor, currPatch) = (currParts[0], currParts[1], currParts[2])

        if currMajor > minMajor { return true }
        if currMajor < minMajor { return false }
        if currMinor > minMinor { return true }
        if currMinor < minMinor { return false }
        return currPatch >= minPatch
    }

    func prepareUpdate(modelId: String) async {
        guard let metadata = await getLocalModelMetadata(modelId: modelId) else {
            return
        }

        // Save current model metadata for rollback
        let encoder = JSONEncoder()
        if let encoded = try? encoder.encode(metadata) {
            userDefaults.set(encoded, forKey: "model-backup-\(modelId)")
        }
    }

    func commitUpdate(modelId: String) async {
        userDefaults.removeObject(forKey: "model-backup-\(modelId)")
    }

    func rollbackUpdate(modelId: String) async -> LocalModelMetadata? {
        guard let data = userDefaults.data(forKey: "model-backup-\(modelId)") else {
            return nil
        }

        guard let backup = try? JSONDecoder().decode(LocalModelMetadata.self, from: data) else {
            return nil
        }

        // Restore metadata
        await saveLocalModelMetadata(backup)

        // Remove backup
        userDefaults.removeObject(forKey: "model-backup-\(modelId)")

        return backup
    }

    private struct CacheEntry: Codable {
        let manifest: ModelManifest
        let timestamp: TimeInterval
    }

    private static let DEFAULT_MANIFEST_URL = "https://cdn.example.com/models/manifest.json"
    private static let CACHE_KEY = "model-manifest-cache"
    private static let CACHE_DURATION: TimeInterval = 24 * 60 * 60 // 24 hours
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **Caching**: MUST cache manifest for 24 hours (in-memory + SharedPreferences/UserDefaults)
2. **Version Comparison**: MUST use semver comparison (major.minor.patch)
3. **Rollback**: MUST preserve backup metadata before update, restore on rollback
4. **Checksum Validation**: MUST update lastValidated timestamp on successful validation
5. **Min App Version**: MUST compare using semver rules
6. **Singleton**: Service MUST be singleton (cached instance)

### Edge Cases
- Remote fetch fails → return cached manifest if available
- Model not in manifest → throw error
- No local metadata → treat as first download needed
- Backup metadata missing → return null from rollback

### Storage Keys
- Manifest cache: `model-manifest-cache`
- Model metadata: `model-metadata-{modelId}`
- Backup metadata: `model-backup-{modelId}`

---

## DEPENDENCIES

### Translation Order
- MUST translate AFTER `lib/ai/checksum.ts` (PORT) - uses ChecksumValidator
- MUST translate AFTER `lib/ai/types.ts` (SHARED-TS) - uses types

### Integration Points
- Used by `lib/ai/local-model.ts` (NATIVE-OWNED) for version management
- Used by `lib/model/gatekeeper.ts` (NATIVE-OWNED) for update checks
- Used by UI components for update prompts

### Test Porting
- Port tests from `lib/ai/__tests__/model-manifest.test.ts` (if exists) to platform tests
- Test semver comparison logic
- Test rollback flow
