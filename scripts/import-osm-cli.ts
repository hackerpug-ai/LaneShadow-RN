#!/usr/bin/env tsx

/**
 * OSM Data Import Script (CLI-based)
 *
 * Imports OpenStreetMap data into Convex using npx convex run commands.
 * Works with local development deployment without requiring admin keys.
 *
 * Usage:
 *   npx tsx scripts/import-osm-cli.ts --region=district-of-columbia
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { S2CellId, S2LatLng } from 'nodes2ts'

interface ImportOptions {
  region: string
  sourceUrl?: string
}

interface BoundingBox {
  south: number
  west: number
  north: number
  east: number
}

// S2 level 10 ≈ 10km cells - balances query efficiency and precision
const S2_LEVEL = 10

/**
 * Generate S2 token for spatial indexing
 */
function generateS2Token(lat: number, lon: number): string {
  const cellId = S2CellId.fromPoint(S2LatLng.fromDegrees(lat, lon).toPoint()).parentL(S2_LEVEL)
  return cellId.toToken()
}

/**
 * Simplify geometry to first, last, and midpoint (reduces storage)
 */
function simplifyGeometry(coords: number[][]): number[][] {
  if (coords.length <= 3) return coords
  return [coords[0], coords[Math.floor(coords.length / 2)], coords[coords.length - 1]]
}

/**
 * Calculate bounding box from geometry coordinates
 */
function calculateBounds(coords: number[][]): BoundingBox {
  const lats = coords.map((c) => c[1])
  const lons = coords.map((c) => c[0])
  return {
    south: Math.min(...lats),
    west: Math.min(...lons),
    north: Math.max(...lats),
    east: Math.max(...lons),
  }
}

/**
 * Download OSM PBF file
 */
async function downloadOsmPbf(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  fs.writeFileSync(outputPath, Buffer.from(buffer))

  const _sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2)
}

/**
 * Extract scenic nodes from GeoJSON
 */
function extractScenicNodes(features: any[]): any[] {
  const nodes: any[] = []

  for (const feature of features) {
    const { type, geometry, properties } = feature

    // Only process node features with Point geometry
    if (type !== 'node' || geometry?.type !== 'Point') continue

    const [lon, lat] = geometry.coordinates

    // Classify node type
    let nodeType: string | null = null
    if (properties?.tourism === 'viewpoint') {
      nodeType = 'viewpoint'
    } else if (properties?.mountain_pass === 'yes') {
      nodeType = 'mountain_pass'
    } else if (properties?.natural === 'peak' && properties?.name) {
      nodeType = 'peak'
    }

    if (nodeType) {
      nodes.push({
        osmId: properties?.id,
        type: nodeType,
        name: properties?.name,
        lat,
        lon,
        tags: properties,
        s2Token: generateS2Token(lat, lon),
        importedAt: Date.now(),
      })
    }
  }

  return nodes
}

/**
 * Extract road ways from GeoJSON
 */
function extractRoadWays(features: any[]): any[] {
  const ways: any[] = []

  for (const feature of features) {
    const { type, geometry, properties } = feature

    // Only process way features with LineString geometry
    if (type !== 'way' || geometry?.type !== 'LineString') continue

    // Skip unnamed ways or ways without highway tag
    if (!properties?.highway) continue

    const coords = geometry.coordinates as number[][]
    const bounds = calculateBounds(coords)

    // Generate S2 tokens for bbox coverage (ways can span cells)
    const s2Tokens = [
      generateS2Token(bounds.south, bounds.west),
      generateS2Token(bounds.north, bounds.east),
    ]

    ways.push({
      osmId: properties?.id,
      name: properties?.name,
      highwayClass: properties?.highway,
      surface: properties?.surface,
      geometry: simplifyGeometry(coords),
      bounds,
      s2Tokens,
      importedAt: Date.now(),
    })
  }

  return ways
}

/**
 * Import batch to Convex via CLI
 */
function importBatchViaCli(
  action: string,
  data: any[],
): { inserted: number; updated: number; total: number } {
  const argsKey = action === 'importNodes' ? 'nodes' : 'ways'
  const argsJson = JSON.stringify({ [argsKey]: data })

  try {
    const result = execSync(
      `npx convex run actions/osm:${action} '${argsJson.replace(/'/g, "'\"'\"'")}'`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    return JSON.parse(result) as { inserted: number; updated: number; total: number }
  } catch (error: any) {
    throw new Error(`Import failed: ${error.message}`)
  }
}

/**
 * Main import function
 */
async function main(options: ImportOptions): Promise<void> {
  // Default Geofabrik URLs if not provided
  const sourceUrl =
    options.sourceUrl ||
    `https://download.geofabrik.de/north-america/us/${options.region}-latest.osm.pbf`

  const tmpDir = '/tmp'
  const pbfPath = path.join(tmpDir, `${options.region}.osm.pbf`)

  try {
    // Step 1: Download OSM PBF
    await downloadOsmPbf(sourceUrl, pbfPath)

    const geojsonPath = pbfPath.replace('.osm.pbf', '.geojson')
    execSync(`npx osmtogeojson "${pbfPath}" > "${geojsonPath}"`, { stdio: 'inherit' })
    const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'))

    const nodes = extractScenicNodes(geojson.features)

    const ways = extractRoadWays(geojson.features)

    // Step 4: Import to Convex in batches
    const BATCH_SIZE = 100

    if (nodes.length > 0) {
      let _nodesInserted = 0
      let _nodesUpdated = 0
      for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
        const batch = nodes.slice(i, i + BATCH_SIZE)
        const result = importBatchViaCli('importNodes', batch)
        _nodesInserted += result.inserted
        _nodesUpdated += result.updated
        process.stdout.write(
          `\r   Progress: ${Math.min(i + BATCH_SIZE, nodes.length)}/${nodes.length}`,
        )
      }
    } else {
    }

    if (ways.length > 0) {
      let _waysInserted = 0
      let _waysUpdated = 0
      for (let i = 0; i < ways.length; i += BATCH_SIZE) {
        const batch = ways.slice(i, i + BATCH_SIZE)
        const result = importBatchViaCli('importWays', batch)
        _waysInserted += result.inserted
        _waysUpdated += result.updated
        process.stdout.write(
          `\r   Progress: ${Math.min(i + BATCH_SIZE, ways.length)}/${ways.length}`,
        )
      }
    } else {
    }
  } finally {
    // Cleanup temp files
    if (fs.existsSync(pbfPath)) {
      fs.unlinkSync(pbfPath)
    }
    const geojsonPath = pbfPath.replace('.osm.pbf', '.geojson')
    if (fs.existsSync(geojsonPath)) {
      fs.unlinkSync(geojsonPath)
    }
  }
}

/**
 * CLI entry point
 */
async function cli() {
  const args = process.argv.slice(2)
  const regionArg = args.find((a) => a.startsWith('--region='))

  if (!regionArg) {
    process.exit(1)
  }

  const region = regionArg.split('=')[1]

  await main({ region })
}

if (require.main === module) {
  cli().catch((error) => {
    process.exit(1)
  })
}

export { main }
