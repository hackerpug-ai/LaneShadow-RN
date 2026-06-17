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
 * NOTE: This function now returns deterministic variants with different routing
 * preferences. It does NOT query external APIs (Overpass, Protomaps) because:
 * 1. Overpass API is unreliable and slow (timeouts, rate limits)
 * 2. Protomaps is for tile rendering, not feature search
 *
 * Instead, we generate 3 route variants purely through routing preferences:
 * - scenic-coastal: high scenic bias, avoid highways
 * - balanced: default preferences
 * - efficient: avoid tolls, fewer waypoints
 *
 * The Google Routes API will generate meaningfully different routes based on
 * these preferences even with the same (empty) waypoint list.
 */
const findScenicWaypointsImpl = async (params: {
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
  preferences?: { scenicBias?: string }
}): Promise<RouteVariant[]> => {
  // Generate 3 deterministic variants with different routing preferences
  // No waypoints needed - Google Routes API will create diverse routes based on preferences alone
  return [
    {
      id: 'scenic-coastal',
      waypoints: [],
      preferences: {
        scenicBias: 'high',
        avoidHighways: true,
        avoidTolls: false,
      },
    },
    {
      id: 'balanced',
      waypoints: [],
      preferences: {
        scenicBias: 'default',
        avoidHighways: false,
        avoidTolls: false,
      },
    },
    {
      id: 'efficient',
      waypoints: [],
      preferences: {
        scenicBias: 'default',
        avoidHighways: false,
        avoidTolls: true,
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
