# MODEL-storage-utils.md - Storage Estimation Translation Plan

**Source File**: `react-native/lib/mapbox/storage-utils.ts`
**Classification**: PORT
**Priority**: P1 (offline download validation)

---

## SOURCE ANALYSIS

### Purpose
Estimates region download size based on zoom levels and bounds. Validates against device storage limits before download. Uses tile-count heuristic with average tile size (~15KB for vector tiles).

### Exports
- `StorageUtils` object with:
  - `configure(opts)` → `void` (inject storage info provider)
  - `getStorageInfo()` → `Promise<StorageInfo>`
  - `estimateRegionSize(bounds, minZoom, maxZoom)` → `number`
  - `hasEnoughStorage(requiredBytes)` → `Promise<boolean>`
  - `formatBytes(bytes)` → `string`

### Dependencies
- None (storage info provider injected at runtime)

### Key Behaviors
- Tile count estimation per zoom level using mercator projection
- Average tile size: 15KB for vector tiles
- 500MB buffer for system operations
- Human-readable byte formatting (B, KB, MB, GB)

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// storage/StorageUtils.kt
import android.os.StatFs
import java.io.File

data class StorageInfo(
    val totalBytes: Long,
    val freeBytes: Long
)

interface StorageInfoProvider {
    suspend fun getStorageInfo(): StorageInfo
}

class DefaultStorageInfoProvider(private val documentsDir: File) : StorageInfoProvider {
    override suspend fun getStorageInfo(): StorageInfo {
        val stat = StatFs(documentsDir.absolutePath)
        val totalBytes = stat.blockCountLong * stat.blockSizeLong
        val freeBytes = stat.availableBlocksLong * stat.blockSizeLong
        return StorageInfo(totalBytes, freeBytes)
    }
}

object StorageUtils {
    private var provider: StorageInfoProvider? = null

    fun configure(provider: StorageInfoProvider) {
        this.provider = provider
    }

    suspend fun getStorageInfo(): StorageInfo {
        return provider?.getStorageInfo()
            ?: throw IllegalStateException("StorageInfoProvider not configured")
    }

    fun estimateRegionSize(
        bounds: List<List<Double>>, // [[swLng, swLat], [neLng, neLat]]
        minZoom: Int,
        maxZoom: Int
    ): Long {
        val [[swLng, swLat], [neLng, neLat]] = bounds
        val avgTileSizeBytes = 15 * 1024L // 15KB average for vector tiles

        var totalTiles = 0L
        for (zoom in minZoom..maxZoom) {
            val tilesX = lngToTileCount(swLng, neLng, zoom)
            val tilesY = latToTileCount(swLat, neLat, zoom)
            totalTiles += tilesX * tilesY
        }

        return totalTiles * avgTileSizeBytes
    }

    suspend fun hasEnoughStorage(requiredBytes: Long): Boolean {
        val info = getStorageInfo()
        // Leave 500MB buffer for system operations
        val bufferBytes = 500 * 1024 * 1024L
        return info.freeBytes - bufferBytes >= requiredBytes
    }

    fun formatBytes(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "%.1f KB".format(bytes / 1024.0)
            bytes < 1024 * 1024 * 1024 -> "%.0f MB".format(bytes / (1024.0 * 1024))
            else -> "%.1f GB".format(bytes / (1024.0 * 1024 * 1024))
        }
    }

    private fun lngToTileCount(west: Double, east: Double, zoom: Int): Long {
        val n = 2.0.pow(zoom)
        val tileWest = floor(((west + 180.0) / 360.0) * n).toLong()
        val tileEast = ceil(((east + 180.0) / 360.0) * n).toLong()
        return maxOf(tileEast - tileWest, 1)
    }

    private fun latToTileCount(south: Double, north: Double, zoom: Int): Long {
        val n = 2.0.pow(zoom)
        val tileSouth = floor(latToTileY(south, n)).toLong()
        val tileNorth = ceil(latToTileY(north, n)).toLong()
        return maxOf(tileNorth - tileSouth, 1)
    }

    private fun latToTileY(lat: Double, n: Double): Double {
        val latRad = Math.toRadians(lat)
        return ((1.0 - ln(tan(latRad) + 1.0 / cos(latRad)) / Math.PI) / 2.0) * n
    }
}
```

### iOS (Swift)

```swift
// storage/StorageUtils.swift
import Foundation

struct StorageInfo {
    let totalBytes: Int
    let freeBytes: Int
}

protocol StorageInfoProvider {
    func getStorageInfo() async throws -> StorageInfo
}

class DefaultStorageInfoProvider: StorageInfoProvider {
    private let documentsURL: URL

    init(documentsURL: URL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]) {
        self.documentsURL = documentsURL
    }

    func getStorageInfo() async throws -> StorageInfo {
        let values = try await documentsURL.resourceValues(forKeys: [
            .totalFileSizeKey,
            .volumeAvailableCapacityForImportantUsageKey,
            .volumeTotalCapacityKey
        ])

        guard let totalCapacity = values.volumeTotalCapacity,
              let availableCapacity = values.volumeAvailableCapacityForImportantUsage else {
            throw NSError(domain: "Storage", code: -1, userInfo: [NSLocalizedDescriptionKey: "Cannot get storage info"])
        }

        return StorageInfo(totalBytes: totalCapacity, freeBytes: availableCapacity)
    }
}

class StorageUtils {
    static var provider: StorageInfoProvider?

    static func configure(provider: StorageInfoProvider) {
        self.provider = provider
    }

    static func getStorageInfo() async throws -> StorageInfo {
        guard let provider = provider else {
            throw NSError(domain: "Storage", code: -1, userInfo: [NSLocalizedDescriptionKey: "StorageInfoProvider not configured"])
        }

        return try await provider.getStorageInfo()
    }

    static func estimateRegionSize(
        bounds: [[Double]], // [[swLng, swLat], [neLng, neLat]]
        minZoom: Int,
        maxZoom: Int
    ) -> Int {
        let [swLng, swLat] = bounds[0]
        let [neLng, neLat] = bounds[1]
        let avgTileSizeBytes = 15 * 1024 // 15KB average for vector tiles

        var totalTiles = 0
        for zoom in minZoom...maxZoom {
            let tilesX = lngToTileCount(west: swLng, east: neLng, zoom: zoom)
            let tilesY = latToTileCount(south: swLat, north: neLat, zoom: zoom)
            totalTiles += tilesX * tilesY
        }

        return totalTiles * avgTileSizeBytes
    }

    static func hasEnoughStorage(requiredBytes: Int) async throws -> Bool {
        let info = try await getStorageInfo()
        // Leave 500MB buffer for system operations
        let bufferBytes = 500 * 1024 * 1024
        return info.freeBytes - bufferBytes >= requiredBytes
    }

    static func formatBytes(_ bytes: Int) -> String {
        switch bytes {
        case 0..<1024:
            return "\(bytes) B"
        case 0..<(1024 * 1024):
            return String(format: "%.1f KB", Double(bytes) / 1024.0)
        case 0..<(1024 * 1024 * 1024):
            return String(format: "%.0f MB", Double(bytes) / (1024.0 * 1024))
        default:
            return String(format: "%.1f GB", Double(bytes) / (1024.0 * 1024 * 1024))
        }
    }

    private static func lngToTileCount(west: Double, east: Double, zoom: Int) -> Int {
        let n = pow(2.0, Double(zoom))
        let tileWest = Int(floor(((west + 180.0) / 360.0) * n))
        let tileEast = Int(ceil(((east + 180.0) / 360.0) * n))
        return max(tileEast - tileWest, 1)
    }

    private static func latToTileCount(south: Double, north: Double, zoom: Int) -> Int {
        let n = pow(2.0, Double(zoom))
        let tileSouth = Int(floor(latToTileY(south, n)))
        let tileNorth = Int(ceil(latToTileY(north, n)))
        return max(tileNorth - tileSouth, 1)
    }

    private static func latToTileY(_ lat: Double, _ n: Double) -> Double {
        let latRad = lat * .pi / 180.0
        return ((1.0 - log(tan(latRad) + 1.0 / cos(latRad)) / .pi) / 2.0) * n
    }
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **Tile Count Algorithm**: MUST use mercator projection formulas exactly
2. **Average Tile Size**: MUST use 15KB for vector tiles
3. **System Buffer**: MUST leave 500MB buffer for system operations
4. **Byte Formatting**: MUST use B/KB/MB/GB with exact formatting rules
5. **Provider Injection**: MUST support runtime injection of storage info provider

### Edge Cases
- Invalid bounds → returns minimum tile count (1x1 per zoom)
- Zoom level 0-22 → supports full range
- Empty bounds → returns 0 bytes
- Storage provider not configured → throws error

### Mercator Projection Formulas
```
lngToTileCount(west, east, zoom):
  n = 2^zoom
  tileWest = floor(((west + 180) / 360) * n)
  tileEast = ceil(((east + 180) / 360) * n)
  return max(tileEast - tileWest, 1)

latToTileY(lat, n):
  latRad = (lat * π) / 180
  return ((1 - ln(tan(latRad) + 1/cos(latRad)) / π) / 2) * n
```

---

## DEPENDENCIES

### Translation Order
- No dependencies on other business logic files
- Can be translated independently

### Integration Points
- Used by `lib/mapbox/offline-manager.ts` (NATIVE-OWNED) for download validation
- Used by UI components for storage warnings

### Test Porting
- Port tests from `lib/mapbox/__tests__/storage-utils.test.ts` (if exists) to platform tests
- Test tile count estimation accuracy
- Test storage buffer calculation
