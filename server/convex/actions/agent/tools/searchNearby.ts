'use node'

import { traceableToolAsync } from '../lib/tracing'
import {
  createPlacesProvider,
  type PlaceResult,
  type SearchNearbyResult,
} from '../providers/placesProvider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { PlaceResult, SearchNearbyResult }

type SearchNearbyParams = {
  query: string
  location: { lat: number; lng: number }
  radiusMeters?: number | null
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const searchNearbyImpl = async (params: SearchNearbyParams): Promise<SearchNearbyResult> => {
  try {
    const provider = createPlacesProvider()
    return await provider.searchNearby({
      query: params.query,
      location: params.location,
      radiusMeters: params.radiusMeters,
    })
  } catch (error) {
    return { status: 'error', reason: String(error) }
  }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const searchNearby = traceableToolAsync(searchNearbyImpl, {
  name: 'searchNearby',
  runType: 'tool',
  tags: ['planRide', 'places', 'searchNearby'],
})
