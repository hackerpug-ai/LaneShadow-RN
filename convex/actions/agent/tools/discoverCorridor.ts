'use node'

import { findScenicWaypoints } from './findScenicWaypoints'
import { retryOnce, withTimeout } from '../lib/reliability'
import { traceableToolAsync } from '../lib/tracing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const OVERPASS_TIMEOUT_MS = 8_000
const MAX_ROADS = 15

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type RoadInfo = {
  name: string
  highway: string // 'primary', 'secondary', 'trunk', etc.
  surface: string | null // 'asphalt', 'unpaved', etc.
  endpoints: Array<{ lat: number; lng: number }> // 2-3 points (start, mid, end)
}

export type PoiInfo = {
  name: string
  type: 'viewpoint' | 'peak' | 'pass' | 'scenic_road'
  lat: number
  lng: number
  score: number // 1-3
}

export type DiscoverCorridorResult = {
  roads: RoadInfo[]
  pois: PoiInfo[]
}

// ---------------------------------------------------------------------------
// Highway class priority (lower index = higher priority)
// ---------------------------------------------------------------------------

const HIGHWAY_PRIORITY: Record<string, number> = {
  trunk: 0,
  primary: 1,
  secondary: 2,
  tertiary: 3,
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type BoundingBox = {
  south: number
  west: number
  north: number
  east: number
}

type OverpassWay = {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: Array<{ lat: number; lon: number }>
}

type OverpassResponse = {
  elements: OverpassWay[]
}

// ---------------------------------------------------------------------------
// Bbox computation (reused from findScenicWaypoints)
// ---------------------------------------------------------------------------

const BBOX_PADDING_DEGREES = 0.5 // ~55km at mid-latitudes

const computeBbox = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): BoundingBox => {
  const minLat = Math.min(start.lat, end.lat)
  const maxLat = Math.max(start.lat, end.lat)
  const minLng = Math.min(start.lng, end.lng)
  const maxLng = Math.max(start.lng, end.lng)

  return {
    south: minLat - BBOX_PADDING_DEGREES,
    west: minLng - BBOX_PADDING_DEGREES,
    north: maxLat + BBOX_PADDING_DEGREES,
    east: maxLng + BBOX_PADDING_DEGREES,
  }
}

// ---------------------------------------------------------------------------
// Overpass query builder for roads
// ---------------------------------------------------------------------------

const buildRoadQuery = (bbox: BoundingBox): string => {
  const { south, west, north, east } = bbox
  return `[out:json][timeout:8];
(
  way["highway"~"^(primary|secondary|tertiary|trunk)"]["name"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;`
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const fetchOverpass = async (query: string, signal: AbortSignal): Promise<OverpassResponse> => {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  })

  if (!response.ok) {
    throw new Error(`Overpass HTTP ${response.status}`)
  }

  return response.json() as Promise<OverpassResponse>
}

// ---------------------------------------------------------------------------
// Geometry simplification
// ---------------------------------------------------------------------------

const simplifyGeometry = (
  geometry: Array<{ lat: number; lon: number }> | undefined
): Array<{ lat: number; lng: number }> => {
  if (!geometry || geometry.length === 0) return []

  // Return first, last, and at most one midpoint to keep geometry lightweight
  if (geometry.length <= 3) {
    return geometry.map((p) => ({ lat: p.lat, lng: p.lon }))
  }

  const mid = Math.floor(geometry.length / 2)
  return [
    { lat: geometry[0].lat, lng: geometry[0].lon },
    { lat: geometry[mid].lat, lng: geometry[mid].lon },
    { lat: geometry[geometry.length - 1].lat, lng: geometry[geometry.length - 1].lon },
  ]
}

// ---------------------------------------------------------------------------
// Road parsing
// ---------------------------------------------------------------------------

const parseRoads = (elements: OverpassWay[]): RoadInfo[] => {
  const roads = new Map<string, RoadInfo>()

  for (const el of elements) {
    if (el.type !== 'way') continue

    const tags = el.tags ?? {}
    const name = tags['name']
    if (!name || name.trim() === '') continue

    const highway = tags['highway']
    if (!highway || !HIGHWAY_PRIORITY.hasOwnProperty(highway)) continue

    // Deduplicate by name (keep the highest class version)
    const trimmedName = name.trim()
    const existing = roads.get(trimmedName)

    if (existing) {
      // Keep the version with higher priority (lower number)
      if (HIGHWAY_PRIORITY[highway] < HIGHWAY_PRIORITY[existing.highway]) {
        roads.set(trimmedName, {
          name: trimmedName,
          highway,
          surface: tags['surface'] ?? null,
          endpoints: simplifyGeometry(el.geometry),
        })
      }
    } else {
      roads.set(trimmedName, {
        name: trimmedName,
        highway,
        surface: tags['surface'] ?? null,
        endpoints: simplifyGeometry(el.geometry),
      })
    }
  }

  // Sort by highway class priority and limit
  return Array.from(roads.values())
    .sort((a, b) => {
      const rankA = HIGHWAY_PRIORITY[a.highway] ?? 99
      const rankB = HIGHWAY_PRIORITY[b.highway] ?? 99
      return rankA - rankB
    })
    .slice(0, MAX_ROADS)
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const discoverCorridorImpl = async (params: {
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
  preferences?: {
    scenicBias?: 'default' | 'high'
    avoidHighways?: boolean
  }
}): Promise<DiscoverCorridorResult> => {
  // Run queries in parallel
  const [variants, roadData] = await Promise.allSettled([
    findScenicWaypoints(params),
    (async () => {
      const bbox = computeBbox(params.start, params.end)
      const query = buildRoadQuery(bbox)

      const runOnce = () =>
        withTimeout((signal) => fetchOverpass(query, signal), {
          ms: OVERPASS_TIMEOUT_MS,
          label: 'overpass',
        })

      return retryOnce(runOnce)
    })(),
  ])

  // Extract POIs from scenic waypoints
  let pois: PoiInfo[] = []
  if (variants.status === 'fulfilled' && variants.value.length > 0) {
    // Use the first variant's waypoints (usually direct-scenic)
    pois = variants.value[0].waypoints.map((wp) => ({
      name: wp.name,
      type: wp.type,
      lat: wp.lat,
      lng: wp.lng,
      score: wp.score,
    }))
  }

  // Extract roads from Overpass
  let roads: RoadInfo[] = []
  if (roadData.status === 'fulfilled') {
    roads = parseRoads(roadData.value.elements ?? [])
  } else {
    console.warn('discoverCorridor: Road query failed, returning empty roads list')
  }

  console.info(
    `discoverCorridor: found ${roads.length} roads, ${pois.length} POIs between ${params.start.lat},${params.start.lng} and ${params.end.lat},${params.end.lng}`
  )

  return { roads, pois }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const discoverCorridor = traceableToolAsync(discoverCorridorImpl, {
  name: 'discoverCorridor',
  runType: 'tool',
  tags: ['planRide', 'routing', 'overpass', 'discovery'],
})
