'use node'

import { traceableToolAsync } from '../lib/tracing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const _MAX_WAYPOINTS_PER_VARIANT = 4

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type ScenicWaypoint = {
  lat: number
  lng: number
  name: string
  type: 'viewpoint' | 'peak' | 'pass' | 'scenic_road'
  score: number // 1-3: pass=3, peak=2, viewpoint=1
}

export type RouteVariant = {
  id: string
  waypoints: ScenicWaypoint[]
  preferences: {
    scenicBias: 'default' | 'high'
    avoidHighways: boolean
    avoidTolls: boolean
  }
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

/**
 * Find scenic waypoints for route planning.
 *
 * NOTE: This function now returns a single scenic route variant with high scenic
 * bias. It does NOT query external APIs (Overpass, Protomaps) because:
 * 1. Overpass API is unreliable and slow (timeouts, rate limits)
 * 2. Protomaps is for tile rendering, not feature search
 *
 * Instead, we generate 1 route variant purely through routing preferences:
 * - scenic: high scenic bias, avoid highways
 *
 * The Google Routes API will generate a single route based on these preferences
 * even with an empty waypoint list. This eliminates the duplicate-card bug
 * where metric-based variants (balanced/efficient) returned visually identical
 * geometry but with different labels.
 */
const findScenicWaypointsImpl = async (params: {
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
  preferences?: { scenicBias?: string }
}): Promise<RouteVariant[]> => {
  // Generate 1 deterministic scenic variant
  // No waypoints needed - Google Routes API will create the route based on preferences alone
  return [
    {
      id: 'scenic',
      waypoints: [],
      preferences: {
        scenicBias: 'high',
        avoidHighways: true,
        avoidTolls: false,
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const findScenicWaypoints = traceableToolAsync(findScenicWaypointsImpl, {
  name: 'findScenicWaypoints',
  runType: 'tool',
  tags: ['planRide', 'routing'],
})
