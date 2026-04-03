'use node'

import { retryOnce, withTimeout } from '../lib/reliability'
import { traceableToolAsync } from '../lib/tracing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const OVERPASS_TIMEOUT_MS = 8_000
const BBOX_PADDING_DEGREES = 0.5 // ~55km at mid-latitudes
const MAX_TOP_NODES = 8
const MAX_WAYPOINTS_PER_VARIANT = 4
const MIN_VALID_NODES = 2

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
}

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

const FALLBACK: RouteVariant[] = [{ id: 'direct-scenic', waypoints: [] }]

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type BoundingBox = {
  south: number
  west: number
  north: number
  east: number
}

type OverpassNode = {
  type: string
  id: number
  lat: number
  lon: number
  tags?: Record<string, string>
}

type OverpassResponse = {
  elements: OverpassNode[]
}

// ---------------------------------------------------------------------------
// Bbox computation
// ---------------------------------------------------------------------------

export const computeBbox = (
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
// Overpass query builder
// ---------------------------------------------------------------------------

const buildOverpassQuery = (bbox: BoundingBox): string => {
  const { south, west, north, east } = bbox
  return `[out:json][timeout:8];
(
  node["tourism"="viewpoint"](${south},${west},${north},${east});
  node["mountain_pass"="yes"](${south},${west},${north},${east});
  node["natural"="peak"]["name"](${south},${west},${north},${east});
);
out body;`
}

// ---------------------------------------------------------------------------
// Node scoring
// ---------------------------------------------------------------------------

const scoreNode = (tags: Record<string, string>): { score: number; type: ScenicWaypoint['type'] } | null => {
  if (tags['mountain_pass'] === 'yes') {
    return { score: 3, type: 'pass' }
  }
  if (tags['natural'] === 'peak') {
    return { score: 2, type: 'peak' }
  }
  if (tags['tourism'] === 'viewpoint') {
    return { score: 1, type: 'viewpoint' }
  }
  return null
}

// ---------------------------------------------------------------------------
// Node parsing
// ---------------------------------------------------------------------------

const parseNodes = (elements: OverpassNode[]): ScenicWaypoint[] => {
  const waypoints: ScenicWaypoint[] = []

  for (const element of elements) {
    if (element.type !== 'node') continue

    const tags = element.tags ?? {}
    const name = tags['name']
    if (!name || name.trim() === '') continue

    if (!Number.isFinite(element.lat) || !Number.isFinite(element.lon)) continue

    const scored = scoreNode(tags)
    if (!scored) continue

    waypoints.push({
      lat: element.lat,
      lng: element.lon,
      name: name.trim(),
      type: scored.type,
      score: scored.score,
    })
  }

  // Sort by score descending, take top N
  return waypoints.sort((a, b) => b.score - a.score).slice(0, MAX_TOP_NODES)
}

// ---------------------------------------------------------------------------
// Clustering
// ---------------------------------------------------------------------------

const clusterVariants = (
  waypoints: ScenicWaypoint[],
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): RouteVariant[] => {
  if (waypoints.length < MIN_VALID_NODES) {
    return FALLBACK
  }

  if (waypoints.length < 4) {
    const sorted = sortByCorridorProximity(waypoints, start, end)
    return [{ id: 'direct-scenic', waypoints: sorted.slice(0, MAX_WAYPOINTS_PER_VARIANT) }]
  }

  const midLat = (start.lat + end.lat) / 2

  const northNodes = waypoints.filter((w) => w.lat >= midLat)
  const southNodes = waypoints.filter((w) => w.lat < midLat)

  const variants: RouteVariant[] = []

  if (northNodes.length > 0) {
    const sorted = sortByCorridorProximity(northNodes, start, end)
    variants.push({ id: 'scenic-north', waypoints: sorted.slice(0, MAX_WAYPOINTS_PER_VARIANT) })
  }

  if (southNodes.length > 0) {
    const sorted = sortByCorridorProximity(southNodes, start, end)
    variants.push({ id: 'scenic-south', waypoints: sorted.slice(0, MAX_WAYPOINTS_PER_VARIANT) })
  }

  // Balanced: top nodes regardless of lat
  const balanced = sortByCorridorProximity(waypoints, start, end)
  variants.push({ id: 'direct-scenic', waypoints: balanced.slice(0, MAX_WAYPOINTS_PER_VARIANT) })

  return variants
}

// ---------------------------------------------------------------------------
// Proximity sorting along corridor
// ---------------------------------------------------------------------------

/**
 * Sort waypoints by their proximity along the route corridor.
 * Uses parametric projection onto the start→end line segment.
 */
const sortByCorridorProximity = (
  waypoints: ScenicWaypoint[],
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): ScenicWaypoint[] => {
  const dLat = end.lat - start.lat
  const dLng = end.lng - start.lng
  const lenSq = dLat * dLat + dLng * dLng

  return [...waypoints].sort((a, b) => {
    const tA = lenSq === 0 ? 0 : ((a.lat - start.lat) * dLat + (a.lng - start.lng) * dLng) / lenSq
    const tB = lenSq === 0 ? 0 : ((b.lat - start.lat) * dLat + (b.lng - start.lng) * dLng) / lenSq
    return tA - tB
  })
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const findScenicWaypointsImpl = async (params: {
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
  preferences?: { scenicBias?: string }
}): Promise<RouteVariant[]> => {
  try {
    const bbox = computeBbox(params.start, params.end)
    const query = buildOverpassQuery(bbox)

    const fetchOverpass = async (signal: AbortSignal): Promise<OverpassResponse> => {
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

    const runOnce = () => withTimeout(fetchOverpass, { ms: OVERPASS_TIMEOUT_MS, label: 'overpass' })

    const data = await retryOnce(runOnce)

    const waypoints = parseNodes(data.elements ?? [])

    if (waypoints.length < MIN_VALID_NODES) {
      console.warn('findScenicWaypoints: Overpass failed, using fallback')
      return FALLBACK
    }

    const variants = clusterVariants(waypoints, params.start, params.end)

    console.info(`findScenicWaypoints: found ${waypoints.length} nodes, returning ${variants.length} variants`)

    return variants
  } catch (_error) {
    console.warn('findScenicWaypoints: Overpass failed, using fallback')
    return FALLBACK
  }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const findScenicWaypoints = traceableToolAsync(findScenicWaypointsImpl, {
  name: 'findScenicWaypoints',
  runType: 'tool',
  tags: ['planRide', 'routing', 'overpass'],
})
