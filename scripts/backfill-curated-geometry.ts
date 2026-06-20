#!/usr/bin/env tsx

/**
 * Backfill Curated Routes Geometry
 *
 * Fetches line geometry from Nominatim (OSM geocoding) for curated routes
 * using their name and state, then encodes as polyline and patches the DB.
 *
 * Usage:
 *   npx tsx scripts/backfill-curated-geometry.ts --sample=25
 *   npx tsx scripts/backfill-curated-geometry.ts --all
 *
 * Features:
 *   - Paginated fetch with cursor support
 *   - Rate limiting (≥1100ms between Nominatim calls)
 *   - Resumable (skips already-generated routes)
 *   - Validates LineString/MultiLineString from polygon_geojson
 *   - Encodes to polyline (precision 5) via @mapbox/polyline
 *   - Reports summary to .tmp/DATA-011/sample-report.json
 */

import fs from 'node:fs'
import path from 'node:path'
import polyline from '@mapbox/polyline'
import { ConvexHttpClient } from 'convex/browser'

// ============================================================================
// Types
// ============================================================================

interface GeometryBackfillRow {
  routeId: string
  name: string
  state: string
  geometryStatus?: 'generated' | 'unresolved' | 'failed'
}

interface NominatimResult {
  geojson?: {
    type: string
    coordinates?: number[][] | number[][][]
  }
}

interface SampleRoute {
  routeId: string
  name: string
  state: string
  geometryStatus?: string
  decodedCoordCount?: number
}

interface SampleReport {
  routes: SampleRoute[]
  resolved: number
  unresolved: number
}

// ============================================================================
// Configuration
// ============================================================================

const CONVEX_URL = process.env.CONVEX_URL || 'http://localhost:8000'
const NOMINATIM_RATE_LIMIT_MS = 1100 // ≥1100ms between Nominatim calls per policy
const NOMINATIM_USER_AGENT = 'LaneShadow/1.0 (geometry backfill)'
const PAGE_SIZE = 50

// Parse command-line arguments
const args = process.argv.slice(2)
const sampleArg = args.find((a) => a.startsWith('--sample='))
const sampleSize = sampleArg ? parseInt(sampleArg.split('=')[1], 10) : 25
const runAll = args.includes('--all')
const mode = runAll ? 'all' : `sample:${sampleSize}`

// ============================================================================
// Main Backfill Logic
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractLineStringCoords(geojson: any): number[][] | null {
  if (!geojson?.type) {
    return null
  }

  if (geojson.type === 'LineString' && Array.isArray(geojson.coordinates)) {
    // LineString: [[lng, lat], [lng, lat], ...]
    return geojson.coordinates.map((coord: number[]) => [coord[1], coord[0]])
  }

  if (geojson.type === 'MultiLineString' && Array.isArray(geojson.coordinates)) {
    // MultiLineString: [[[lng, lat], ...], ...]
    // Flatten to single array
    const flattened: number[][] = []
    for (const lineString of geojson.coordinates) {
      if (Array.isArray(lineString)) {
        for (const coord of lineString) {
          if (Array.isArray(coord) && coord.length >= 2) {
            flattened.push([coord[1], coord[0]])
          }
        }
      }
    }
    return flattened.length > 0 ? flattened : null
  }

  return null
}

async function fetchNominatimGeometry(
  name: string,
  state: string,
): Promise<NominatimResult | null> {
  try {
    const query = `${name}, ${state}`
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('polygon_geojson', '1')
    url.searchParams.set('limit', '1')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': NOMINATIM_USER_AGENT,
      },
      timeout: 10000,
    })

    if (!response.ok) {
      // biome-ignore lint/suspicious/noConsole: CLI tool logging
      console.error(`Nominatim error for "${query}": ${response.status}`)
      return null
    }

    const results = await response.json()
    if (!Array.isArray(results) || results.length === 0) {
      return null
    }

    return results[0]
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    // biome-ignore lint/suspicious/noConsole: CLI tool logging
    console.error(`Nominatim fetch error: ${msg}`)
    return null
  }
}

async function backfillGeometry(): Promise<void> {
  const client = new ConvexHttpClient(CONVEX_URL)

  let cursor: string | null = null
  let processed = 0
  let generated = 0
  let unresolved = 0
  let skipped = 0
  let stopped = false

  const sampleReport: SampleReport = {
    routes: [],
    resolved: 0,
    unresolved: 0,
  }

  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log(`Starting geometry backfill (mode: ${mode})`)
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log(`CONVEX_URL: ${CONVEX_URL}`)
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log('')

  // Paginate through routes
  while (!stopped) {
    try {
      const result = await client.query('curatedRoutes:listForGeometryBackfill', {
        paginationOpts: {
          cursor,
          numItems: PAGE_SIZE,
        },
      })

      const page = result.page as GeometryBackfillRow[]

      for (const row of page) {
        // Skip if already generated
        if (row.geometryStatus === 'generated') {
          skipped++
          continue
        }

        processed++

        // Fetch from Nominatim
        await sleep(NOMINATIM_RATE_LIMIT_MS)
        const nominatimResult = await fetchNominatimGeometry(row.name, row.state)

        let status: 'generated' | 'unresolved' | 'failed' = 'unresolved'
        let encodedPolyline: string | null = null
        let decodedCoordCount = 0

        if (nominatimResult?.geojson) {
          const coords = extractLineStringCoords(nominatimResult.geojson)
          if (coords && coords.length > 0) {
            try {
              encodedPolyline = polyline.encode(coords, 5)
              status = 'generated'
              generated++
              decodedCoordCount = coords.length
            } catch (error) {
              // biome-ignore lint/suspicious/noConsole: CLI tool logging
              console.error(`Failed to encode polyline for ${row.routeId}: ${error}`)
              status = 'failed'
            }
          } else {
            unresolved++
          }
        } else {
          unresolved++
        }

        // Patch the database
        try {
          const patchArgs: Record<string, any> = {
            routeId: row.routeId,
            geometryStatus: status,
          }

          if (encodedPolyline) {
            patchArgs.routeGeometry = {
              format: 'polyline' as const,
              encoding: 'polyline',
              precision: 5,
              value: encodedPolyline,
            }
          }

          await client.mutation('curatedRoutes:patchRouteGeometry', patchArgs)

          // biome-ignore lint/suspicious/noConsole: CLI tool logging
          console.log(`[${processed}] ${row.routeId} (${row.name}, ${row.state}): ${status}`)

          // Track for sample report
          if (!runAll && sampleReport.routes.length < sampleSize) {
            sampleReport.routes.push({
              routeId: row.routeId,
              name: row.name,
              state: row.state,
              geometryStatus: status,
              decodedCoordCount,
            })

            if (status === 'generated') {
              sampleReport.resolved++
            } else {
              sampleReport.unresolved++
            }
          }

          // Stop if we've reached sample limit
          if (!runAll && processed >= sampleSize) {
            stopped = true
            break
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error)
          // biome-ignore lint/suspicious/noConsole: CLI tool logging
          console.error(`Failed to patch ${row.routeId}: ${msg}`)
        }
      }

      // Check if done
      if (result.isDone) {
        // biome-ignore lint/suspicious/noConsole: CLI tool logging
        console.log('\nPagination complete')
        stopped = true
      } else {
        cursor = result.continueCursor
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      // biome-ignore lint/suspicious/noConsole: CLI tool logging
      console.error(`Query error: ${msg}`)
      stopped = true
    }
  }

  // Write sample report
  if (!runAll) {
    const reportDir = '.tmp/DATA-011'
    fs.mkdirSync(reportDir, { recursive: true })

    const reportPath = path.join(reportDir, 'sample-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(sampleReport, null, 2))
    // biome-ignore lint/suspicious/noConsole: CLI tool logging
    console.log(`\nSample report written to ${reportPath}`)
  }

  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log('')
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log('='.repeat(60))
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log(`Mode: ${mode}`)
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log(`Processed: ${processed}`)
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log(`Generated: ${generated}`)
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log(`Unresolved: ${unresolved}`)
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log(`Skipped (already done): ${skipped}`)
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.log('='.repeat(60))
}

// ============================================================================
// Entry Point
// ============================================================================

backfillGeometry().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: CLI tool logging
  console.error('Fatal error:', error)
  process.exit(1)
})
