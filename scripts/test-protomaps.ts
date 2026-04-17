#!/usr/bin/env tsx
/**
 * Test Protomaps US Integration
 *
 * Tests PMTiles queries for roads and scenic waypoints.
 *
 * Usage:
 *   npx tsx scripts/test-protomaps.ts
 *
 * With custom URL:
 *   PROTOMAPS_URL="https://your-bucket.r2.dev/us-west.pmtiles" npx tsx scripts/test-protomaps.ts
 */

async function main() {
  // Test PMTiles URL - use environment variable or fallback to sample
  const PMTILES_URL =
    process.env.PROTOMAPS_URL || 'https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles'

  if (!process.env.PROTOMAPS_URL) {
  }

  try {
    // Dynamic import for PMTiles
    const { PMTiles } = await import('pmtiles')

    const pmtiles = new PMTiles(PMTILES_URL)

    // Get header to verify connection
    const header = await pmtiles.getHeader()

    // Test a tile in the map's center
    const z = 14
    const x = lonToTile(header.centerLon, z)
    const y = latToTile(header.centerLat, z)

    const tileData = await pmtiles.getZxy(z, x, y)

    if (!tileData?.data) {
      return
    }

    const byteLength = tileData.data.byteLength

    if (byteLength === 0) {
    } else {
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
      } else if (error.message.includes('404')) {
      }
    }

    process.exit(1)
  }
}

// Helper functions for tile conversion
function lonToTile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom)
}

function latToTile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      2 ** zoom,
  )
}

main().catch((error) => {
  process.exit(1)
})
