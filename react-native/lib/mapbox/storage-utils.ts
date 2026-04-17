/**
 * Storage estimation and limit detection for offline map downloads.
 *
 * Estimates region download size based on zoom levels and bounds.
 * Validates against device storage limits before download.
 */

export interface StorageInfo {
  totalBytes: number
  freeBytes: number
}

/**
 * Get device storage info.
 * Default implementation returns a large number — override at app startup.
 */
let getStorageInfoFn: () => Promise<StorageInfo> = async () => ({
  totalBytes: 64 * 1024 * 1024 * 1024, // 64GB default
  freeBytes: 32 * 1024 * 1024 * 1024, // 32GB free default
})

export const StorageUtils = {
  /**
   * Configure the storage info provider.
   */
  configure(opts: { getStorageInfo: () => Promise<StorageInfo> }) {
    getStorageInfoFn = opts.getStorageInfo
  },

  /**
   * Get current device storage info.
   */
  async getStorageInfo(): Promise<StorageInfo> {
    return getStorageInfoFn()
  },

  /**
   * Estimate download size for a region based on zoom levels and bounds.
   *
   * Uses a tile-count heuristic: estimate tiles needed at each zoom level,
   * multiply by average tile size (~15KB for vector tiles).
   */
  estimateRegionSize(
    bounds: [[number, number], [number, number]],
    minZoom: number,
    maxZoom: number,
  ): number {
    const [[swLng, swLat], [neLng, neLat]] = bounds
    const avgTileSizeBytes = 15 * 1024 // 15KB average for vector tiles

    let totalTiles = 0
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      const tilesX = lngToTileCount(swLng, neLng, zoom)
      const tilesY = latToTileCount(swLat, neLat, zoom)
      totalTiles += tilesX * tilesY
    }

    return totalTiles * avgTileSizeBytes
  },

  /**
   * Check if device has enough storage for a download.
   */
  async hasEnoughStorage(requiredBytes: number): Promise<boolean> {
    const info = await getStorageInfoFn()
    // Leave 500MB buffer for system operations
    const bufferBytes = 500 * 1024 * 1024
    return info.freeBytes - bufferBytes >= requiredBytes
  },

  /**
   * Format bytes as human-readable string.
   */
  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  },
}

/** Convert longitude range to tile count at a zoom level */
function lngToTileCount(west: number, east: number, zoom: number): number {
  const n = 2 ** zoom
  const tileWest = Math.floor(((west + 180) / 360) * n)
  const tileEast = Math.ceil(((east + 180) / 360) * n)
  return Math.max(tileEast - tileWest, 1)
}

/** Convert latitude range to tile count at a zoom level */
function latToTileCount(south: number, north: number, zoom: number): number {
  const n = 2 ** zoom
  const tileSouth = Math.floor(latToTileY(south, n))
  const tileNorth = Math.ceil(latToTileY(north, n))
  return Math.max(tileSouth - tileNorth, 1)
}

/** Convert latitude to tile Y coordinate */
function latToTileY(lat: number, n: number): number {
  const latRad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
}
