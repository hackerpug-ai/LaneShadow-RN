#!/usr/bin/env tsx

/**
 * OSM Data Import Script (Overpass API)
 *
 * Imports OpenStreetMap data using Overpass API instead of PBF files.
 * Simpler and more reliable for small regions.
 *
 * Usage:
 *   npx tsx scripts/import-osm-overpass.ts --region="Seattle" --bbox="47.5,-122.5,47.7,-122.3"
 */

import { execSync } from 'node:child_process'
import { S2CellId, S2LatLng } from 'nodes2ts'

interface ImportOptions {
  region: string
  bbox: string // "south,west,north,east"
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
 * Fetch OSM data from Overpass API
 */
async function fetchOverpassData(bbox: BoundingBox): Promise<any> {
  const [south, west, north, east] = [bbox.south, bbox.west, bbox.north, bbox.east]

  // Query for scenic nodes and road ways
  const query = `
    [out:json][timeout:60];
    (
      node["tourism"="viewpoint"](${south},${west},${north},${east});
      node["natural"="peak"](${south},${west},${north},${east});
      node["mountain_pass"="yes"](${south},${west},${north},${east});
      way["highway"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Extract scenic nodes from Overpass JSON
 */
function extractScenicNodes(data: any): any[] {
  const nodes: any[] = []

  for (const element of data.elements) {
    if (element.type !== 'node') continue

    const { id, lat, lon, tags } = element

    // Classify node type
    let nodeType: string | null = null
    if (tags?.tourism === 'viewpoint') {
      nodeType = 'viewpoint'
    } else if (tags?.mountain_pass === 'yes') {
      nodeType = 'mountain_pass'
    } else if (tags?.natural === 'peak' && tags?.name) {
      nodeType = 'peak'
    }

    if (nodeType) {
      nodes.push({
        osmId: id,
        type: nodeType,
        name: tags?.name,
        lat,
        lon,
        tags,
        s2Token: generateS2Token(lat, lon),
        importedAt: Date.now(),
      })
    }
  }

  return nodes
}

/**
 * Extract road ways from Overpass JSON
 */
function extractRoadWays(data: any): any[] {
  const ways: any[] = []
  const nodes = new Map<number, { lat: number; lon: number }>()

  // Build node lookup map
  for (const element of data.elements) {
    if (element.type === 'node') {
      nodes.set(element.id, { lat: element.lat, lon: element.lon })
    }
  }

  // Extract ways
  for (const element of data.elements) {
    if (element.type !== 'way') continue

    const { id, tags, nodes: nodeRefs } = element

    // Skip unnamed ways or ways without highway tag
    if (!tags?.highway) continue

    // Build geometry from node references
    const geometry: number[][] = []
    for (const nodeId of nodeRefs) {
      const node = nodes.get(nodeId)
      if (node) {
        geometry.push([node.lon, node.lat])
      }
    }

    // Skip if geometry is too small
    if (geometry.length < 2) continue

    const bounds = calculateBounds(geometry)

    // Generate S2 tokens for bbox coverage
    const s2Tokens = [
      generateS2Token(bounds.south, bounds.west),
      generateS2Token(bounds.north, bounds.east),
    ]

    ways.push({
      osmId: id,
      name: tags?.name,
      highwayClass: tags?.highway,
      surface: tags?.surface,
      geometry,
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
  const [south, west, north, east] = options.bbox.split(',').map(Number)

  try {
    // Step 1: Fetch OSM data from Overpass
    const overpassData = await fetchOverpassData({ south, west, north, east })

    const nodes = extractScenicNodes(overpassData)

    const ways = extractRoadWays(overpassData)

    // Step 3: Import to Convex in batches
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
  } catch (error: any) {
    throw error
  }
}

/**
 * CLI entry point
 */
async function cli() {
  const args = process.argv.slice(2)
  const regionArg = args.find((a) => a.startsWith('--region='))
  const bboxArg = args.find((a) => a.startsWith('--bbox='))

  if (!regionArg || !bboxArg) {
    process.exit(1)
  }

  const region = regionArg.split('=')[1]
  const bbox = bboxArg.split('=')[1]

  await main({ region, bbox })
}

if (require.main === module) {
  cli().catch((error) => {
    process.exit(1)
  })
}

export { main }
