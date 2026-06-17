// VALIDATION ONLY — remove before production migration
import { query } from './_generated/server'
import { geospatial } from './geospatialIndex'

/**
 * Regional slices for non-degenerate geospatial counting
 * Each slice is 45 degrees wide to avoid S2 cell-covering degenerate cases
 */
function countSlices() {
  return [
    { west: -180, east: -135, name: 'Western Pacific/Asia' },
    { west: -135, east: -90, name: 'Eastern Asia/Russia' },
    { west: -90, east: -45, name: 'Russia/Western Europe' },
    { west: -45, east: 0, name: 'Western Europe' },
    { west: 0, east: 45, name: 'Europe/Africa' },
    { west: 45, east: 90, name: 'Africa/Asia' },
    { west: 90, east: 135, name: 'Asia/Australia' },
    { west: 135, east: 180, name: 'Australia/Pacific' },
  ]
}

/**
 * Validation queries for geospatial index performance
 *
 * These queries validate that nearest-neighbor and rectangular range queries
 * perform within acceptable latency (< 500ms) on the Convex deployment.
 */

export const validateNearestNeighbor = query({
  args: {},
  handler: async (ctx) => {
    const start = Date.now()

    // Query for nearest 10 routes to Nashville, TN
    const results = await geospatial.nearest(ctx, {
      point: { latitude: 36.17, longitude: -86.78 },
      limit: 10,
    })

    const latency_ms = Date.now() - start
    const status = results.length >= 1 && latency_ms < 500 ? 'PASS' : 'FAIL'

    return {
      status,
      latency_ms,
      count: results.length,
      query: 'nearest-neighbor',
      target: 'Nashville, TN',
    }
  },
})

export const validateRectangularRange = query({
  args: {},
  handler: async (ctx) => {
    const start = Date.now()

    // Query for routes in a ~200mi x 200mi box over the Southeast US
    const results = await geospatial.query(ctx, {
      shape: {
        type: 'rectangle',
        rectangle: {
          west: -89.0, // Extended to include Tennessee
          south: 34.0, // Extended to include Tennessee/North Carolina
          east: -82.0, // Extended to include North Carolina
          north: 38.0, // Extended to include Tennessee
        },
      },
      limit: 100,
    })

    const latency_ms = Date.now() - start
    const status = results.results.length >= 1 && latency_ms < 500 ? 'PASS' : 'FAIL'

    return {
      status,
      latency_ms,
      count: results.results.length,
      query: 'rectangular-range',
      bounds: 'Southeast US box',
    }
  },
})

export const debugGeospatialData = query({
  args: {},
  handler: async (ctx) => {
    // Count how many routes are in the geospatial index using multiple regional slices
    const slices = countSlices()
    const sliceResults = []
    let total = 0

    for (const slice of slices) {
      let sliceTotal = 0
      let cursor: string | undefined

      // Query each slice with pagination to avoid S2 degenerate cases
      do {
        const sliceResults: {
          results: { key: string; coordinates: { latitude: number; longitude: number } }[]
          nextCursor?: string
        } = await (geospatial as any).query(
          ctx,
          {
            shape: {
              type: 'rectangle',
              rectangle: {
                west: slice.west,
                south: -90,
                east: slice.east,
                north: 90,
              },
            },
            limit: 1000,
          },
          cursor,
        )

        sliceTotal += sliceResults.results.length
        cursor = sliceResults.nextCursor
      } while (cursor !== undefined)

      sliceResults.push({
        box: `${slice.west}° to ${slice.east}°`,
        count: sliceTotal,
        name: slice.name,
      })
      total += sliceTotal
    }

    return {
      total_in_index: total,
      has_more: false, // We've paginated through all slices
      slices: sliceResults,
    }
  },
})
