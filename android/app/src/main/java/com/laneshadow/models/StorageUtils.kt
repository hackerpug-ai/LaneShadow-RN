package com.laneshadow.models

import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.pow

/**
 * Storage estimation and limit detection for offline map downloads.
 *
 * Estimates region download size based on zoom levels and bounds.
 * Validates against device storage limits before download.
 */
data class StorageInfo(
    val totalBytes: Long,
    val freeBytes: Long
)

/**
 * Provider interface for device storage information.
 *
 * Allows runtime injection of platform-specific storage info implementation.
 */
interface StorageInfoProvider {
    suspend fun getStorageInfo(): StorageInfo
}

/**
 * Default implementation using Android StatFs for storage information.
 *
 * @param documentsDir The documents directory to check storage for
 */
class DefaultStorageInfoProvider(private val documentsDir: java.io.File) : StorageInfoProvider {
    override suspend fun getStorageInfo(): StorageInfo {
        val stat = android.os.StatFs(documentsDir.absolutePath)
        val totalBytes = stat.blockCountLong * stat.blockSizeLong
        val freeBytes = stat.availableBlocksLong * stat.blockSizeLong
        return StorageInfo(totalBytes, freeBytes)
    }
}

/**
 * Storage utilities for offline map download estimation.
 *
 * Provides tile-count estimation for region downloads and storage validation.
 */
object StorageUtils {
    private var provider: StorageInfoProvider? = null

    /**
     * Configure the storage info provider.
     *
     * @param provider The storage info provider to use
     */
    fun configure(provider: StorageInfoProvider) {
        this.provider = provider
    }

    /**
     * Get current device storage info.
     *
     * @return Storage information
     * @throws IllegalStateException if provider not configured
     */
    suspend fun getStorageInfo(): StorageInfo {
        return provider?.getStorageInfo()
            ?: throw IllegalStateException("StorageInfoProvider not configured")
    }

    /**
     * Estimate download size for a region based on zoom levels and bounds.
     *
     * Uses a tile-count heuristic: estimate tiles needed at each zoom level,
     * multiply by average tile size (~15KB for vector tiles).
     *
     * @param bounds Region bounds as [[swLng, swLat], [neLng, neLat]]
     * @param minZoom Minimum zoom level
     * @param maxZoom Maximum zoom level
     * @return Estimated download size in bytes
     */
    fun estimateRegionSize(
        bounds: List<List<Double>>,
        minZoom: Int,
        maxZoom: Int
    ): Long {
        val swLng = bounds[0][0]
        val swLat = bounds[0][1]
        val neLng = bounds[1][0]
        val neLat = bounds[1][1]
        val avgTileSizeBytes = 15 * 1024L // 15KB average for vector tiles

        var totalTiles = 0L
        for (zoom in minZoom..maxZoom) {
            val tilesX = lngToTileCount(swLng, neLng, zoom)
            val tilesY = latToTileCount(swLat, neLat, zoom)
            totalTiles += tilesX * tilesY
        }

        return totalTiles * avgTileSizeBytes
    }

    /**
     * Check if device has enough storage for a download.
     *
     * @param requiredBytes Required storage in bytes
     * @return true if enough storage is available
     */
    suspend fun hasEnoughStorage(requiredBytes: Long): Boolean {
        val info = getStorageInfo()
        // Leave 500MB buffer for system operations
        val bufferBytes = 500 * 1024 * 1024L
        return info.freeBytes - bufferBytes >= requiredBytes
    }

    /**
     * Format bytes as human-readable string.
     *
     * @param bytes Number of bytes
     * @return Formatted string (B, KB, MB, or GB)
     */
    fun formatBytes(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "%.1f KB".format(bytes / 1024.0)
            bytes < 1024 * 1024 * 1024 -> "%.0f MB".format(bytes / (1024.0 * 1024))
            else -> "%.1f GB".format(bytes / (1024.0 * 1024 * 1024))
        }
    }

    /** Convert longitude range to tile count at a zoom level */
    private fun lngToTileCount(west: Double, east: Double, zoom: Int): Long {
        val n = 2.0.pow(zoom)
        val tileWest = floor(((west + 180.0) / 360.0) * n).toLong()
        val tileEast = ceil(((east + 180.0) / 360.0) * n).toLong()
        return maxOf(tileEast - tileWest, 1)
    }

    /** Convert latitude range to tile count at a zoom level */
    private fun latToTileCount(south: Double, north: Double, zoom: Int): Long {
        val n = 2.0.pow(zoom)
        val tileSouth = floor(latToTileY(south, n)).toLong()
        val tileNorth = ceil(latToTileY(north, n)).toLong()
        return maxOf(tileNorth - tileSouth, 1)
    }

    /** Convert latitude to tile Y coordinate */
    private fun latToTileY(lat: Double, n: Double): Double {
        val latRad = Math.toRadians(lat)
        return ((1.0 - ln(kotlin.math.tan(latRad) + 1.0 / kotlin.math.cos(latRad)) / Math.PI) / 2.0) * n
    }
}
