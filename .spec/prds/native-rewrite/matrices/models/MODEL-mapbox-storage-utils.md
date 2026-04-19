# MODEL-mapbox-storage-utils.md - Storage Estimation Utilities Translation Plan

**Document ID**: MAT-MODEL-MAPBOX-STORAGE-UTILS
**Status**: Draft
**Source File**: `react-native/lib/mapbox/storage-utils.ts`
**Classification**: PORT
**Priority**: P0 (Storage validation)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Storage estimation and limit detection for offline map downloads. Estimates region download size based on zoom levels and bounds. Validates against device storage limits before download. Pure math with configurable storage info provider.

---

## Platform Translation Strategy

### Android (Kotlin)

**Storage API**: StatFs for storage info

```kotlin
// StorageUtils.kt
import android.os.Environment
import android.os.StatFs
import java.io.File

data class StorageInfo(val totalBytes: Long, val freeBytes: Long)

object StorageUtils {
    private var getStorageInfoFn: suspend () -> StorageInfo = { getDefaultStorageInfo() }

    fun configure(block: StorageConfig.() -> Unit) {
        val config = StorageConfig().apply(block)
        getStorageInfoFn = config.getStorageInfo
    }

    suspend fun getStorageInfo(): StorageInfo = getStorageInfoFn()

    fun estimateRegionSize(
        bounds: List<List<Double>>, // [[swLng, swLat], [neLng, neLat]]
        minZoom: Int,
        maxZoom: Int
    ): Long {
        val avgTileSizeBytes = 15 * 1024 // 15KB for vector tiles
        val [[swLng, swLat], [neLng, neLat]] = bounds

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
        val bufferBytes = 500L * 1024 * 1024 // 500MB buffer
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
        val tileWest = floor(((west + 180) / 360) * n).toLong()
        val tileEast = ceil(((east + 180) / 360) * n).toLong()
        return maxOf(tileEast - tileWest, 1)
    }

    private fun latToTileCount(south: Double, north: Double, zoom: Int): Long {
        val n = 2.0.pow(zoom)
        val tileSouth = floor(latToTileY(south, n)).toLong()
        val tileNorth = ceil(latToTileY(north, n)).toLong()
        return maxOf(tileSouth - tileNorth, 1)
    }

    private fun latToTileY(lat: Double, n: Double): Double {
        val latRad = Math.toRadians(lat)
        return ((1 - ln(tan(latRad) + 1 / cos(latRad)) / PI) / 2) * n
    }

    private suspend fun getDefaultStorageInfo(): StorageInfo = withContext(Dispatchers.IO) {
        val stat = StatFs(Environment.getDataDirectory().absolutePath)
        StorageInfo(
            totalBytes = stat.blockCountLong * stat.blockSizeLong,
            freeBytes = stat.availableBlocksLong * stat.blockSizeLong
        )
    }
}

class StorageConfig {
    var getStorageInfo: suspend () -> StorageInfo = { getDefaultStorageInfo() }
}
```

### iOS (Swift)

**Storage API**: URL resource values for storage info

```swift
// StorageUtils.swift
import Foundation

struct StorageInfo {
    let totalBytes: Int64
    let freeBytes: Int64
}

class StorageUtils {
    private var getStorageInfoFn: () async -> StorageInfo = { await getDefaultStorageInfo() }

    func configure(config: StorageConfig) {
        getStorageInfoFn = config.getStorageInfo
    }

    func getStorageInfo() async -> StorageInfo {
        await getStorageInfoFn()
    }

    func estimateRegionSize(
        bounds: [[Double]], // [[swLng, swLat], [neLng, neLat]]
        minZoom: Int,
        maxZoom: Int
    ) -> Int64 {
        let avgTileSizeBytes = 15 * 1024 // 15KB for vector tiles
        let [[swLng, swLat], [neLng, neLat]] = bounds

        var totalTiles: Int64 = 0
        for zoom in minZoom...maxZoom {
            let tilesX = lngToTileCount(west: swLng, east: neLng, zoom: zoom)
            let tilesY = latToTileCount(south: swLat, north: neLat, zoom: zoom)
            totalTiles += tilesX * tilesY
        }

        return totalTiles * Int64(avgTileSizeBytes)
    }

    func hasEnoughStorage(requiredBytes: Int64) async -> Bool {
        let info = await getStorageInfo()
        let bufferBytes: Int64 = 500 * 1024 * 1024 // 500MB buffer
        return info.freeBytes - bufferBytes >= requiredBytes
    }

    func formatBytes(_ bytes: Int64) -> String {
        switch bytes {
        case 0..<1024:
            return "\(bytes) B"
        case 0..<(1024 * 1024):
            return String(format: "%.1f KB", Double(bytes) / 1024)
        case 0..<(1024 * 1024 * 1024):
            return String(format: "%.0f MB", Double(bytes) / (1024 * 1024))
        default:
            return String(format: "%.1f GB", Double(bytes) / (1024 * 1024 * 1024))
        }
    }

    private func lngToTileCount(west: Double, east: Double, zoom: Int) -> Int64 {
        let n = pow(2.0, Double(zoom))
        let tileWest = Int64(floor(((west + 180) / 360) * n))
        let tileEast = Int64(ceil(((east + 180) / 360) * n)))
        return max(tileEast - tileWest, 1)
    }

    private func latToTileCount(south: Double, north: Double, zoom: Int) -> Int64 {
        let n = pow(2.0, Double(zoom))
        let tileSouth = Int64(floor(latToTileY(south, n)))
        let tileNorth = Int64(ceil(latToTileY(north, n)))
        return max(tileSouth - tileNorth, 1)
    }

    private func latToTileY(_ lat: Double, _ n: Double) -> Double {
        let latRad = lat * .pi / 180
        return ((1 - log(tan(latRad) + 1 / cos(latRad)) / .pi) / 2) * n
    }

    private func getDefaultStorageInfo() async -> StorageInfo {
        if let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            do {
                let values = try url.resourceValues(forKeys: [.volumeTotalCapacityKey, .volumeAvailableCapacityKey])
                let totalBytes = values.volumeTotalCapacity ?? 0
                let freeBytes = values.volumeAvailableCapacity ?? 0
                return StorageInfo(totalBytes: Int64(totalBytes), freeBytes: Int64(freeBytes))
            } catch {
                // Fallback to default values
                return StorageInfo(totalBytes: 64 * 1024 * 1024 * 1024, freeBytes: 32 * 1024 * 1024 * 1024)
            }
        }
        return StorageInfo(totalBytes: 64 * 1024 * 1024 * 1024, freeBytes: 32 * 1024 * 1024 * 1024)
    }
}

struct StorageConfig {
    var getStorageInfo: () async -> StorageInfo = { await getDefaultStorageInfo() }
}
```

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- React Native source: `react-native/lib/mapbox/storage-utils.ts`

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
