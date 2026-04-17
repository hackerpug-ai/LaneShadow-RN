'use node'

import { retryOnce, withTimeout } from '../lib/reliability'
import { traceableToolAsync } from '../lib/tracing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const OVERPASS_TIMEOUT_MS = 8_000
const MAX_MATCHES = 5

// ---------------------------------------------------------------------------
// Highway class priority (lower index = higher priority)
// ---------------------------------------------------------------------------

const HIGHWAY_PRIORITY: Record<string, number> = {
  motorway: 0,
  trunk: 1,
  primary: 2,
  secondary: 3,
  tertiary: 4,
  unclassified: 5,
}

const HIGHWAY_TYPES = 'primary|secondary|tertiary|trunk|motorway|unclassified'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BoundingBox = {
  south: number
  west: number
  north: number
  east: number
}

export type RoadMatch = {
  name: string
  highway: string
  surface: string | null
  geometry: { lat: number; lng: number }[]
}

export type LookupRoadResult =
  | {
      exists: true
      status: 'found'
      matches: RoadMatch[]
    }
  | {
      exists: false
      status: 'not_found'
      suggestions: string[]
    }
  | {
      exists: null
      status: 'unverified'
      reason: 'overpass_timeout'
    }

type OverpassWay = {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

type OverpassResponse = {
  elements: OverpassWay[]
}

// ---------------------------------------------------------------------------
// Overpass query builders
// ---------------------------------------------------------------------------

const buildExactQuery = (roadName: string, bbox: BoundingBox): string => {
  const { south, west, north, east } = bbox
  const escaped = roadName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `[out:json][timeout:8];
way["name"~"^${escaped}$",i]["highway"~"${HIGHWAY_TYPES}"](${south},${west},${north},${east});
out body geom;`
}

const buildBroadQuery = (firstWord: string, bbox: BoundingBox): string => {
  const { south, west, north, east } = bbox
  const escaped = firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `[out:json][timeout:8];
way["name"~"${escaped}",i]["highway"~"${HIGHWAY_TYPES}"](${south},${west},${north},${east});
out body;`
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
    const body = await response.text().catch(() => '(no body)')
    // Extract the actual error from the HTML — look for the error message between <p> tags
    const errorMatch = body.match(/<p[^>]*>.*?<strong[^>]*>(.*?)<\/strong>/s)
    const errorDetail = errorMatch?.[1] ?? body.slice(0, 500)

    throw new Error(`Overpass HTTP ${response.status}: ${errorDetail.slice(0, 200)}`)
  }

  return response.json() as Promise<OverpassResponse>
}

const runOverpassQuery = (query: string): Promise<OverpassResponse> => {
  const runOnce = () =>
    withTimeout((signal) => fetchOverpass(query, signal), {
      ms: OVERPASS_TIMEOUT_MS,
      label: 'overpass',
    })
  return retryOnce(runOnce)
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

const simplifyGeometry = (
  geometry: { lat: number; lon: number }[] | undefined,
): { lat: number; lng: number }[] => {
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

const parseWays = (elements: OverpassWay[]): RoadMatch[] => {
  const matches: RoadMatch[] = []

  for (const el of elements) {
    if (el.type !== 'way') continue
    const tags = el.tags ?? {}
    const name = tags.name
    if (!name || name.trim() === '') continue
    const highway = tags.highway
    if (!highway) continue

    matches.push({
      name: name.trim(),
      highway,
      surface: tags.surface ?? null,
      geometry: simplifyGeometry(el.geometry),
    })
  }

  // Sort by highway class priority
  matches.sort((a, b) => {
    const rankA = HIGHWAY_PRIORITY[a.highway] ?? 99
    const rankB = HIGHWAY_PRIORITY[b.highway] ?? 99
    return rankA - rankB
  })

  return matches.slice(0, MAX_MATCHES)
}

const extractSuggestions = (elements: OverpassWay[]): string[] => {
  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const el of elements) {
    if (el.type !== 'way') continue
    const name = el.tags?.name
    if (!name || name.trim() === '') continue
    const trimmed = name.trim()
    if (!seen.has(trimmed)) {
      seen.add(trimmed)
      suggestions.push(trimmed)
    }
  }

  return suggestions.slice(0, 5)
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const lookupRoadImpl = async (params: {
  roadName: string
  bbox: BoundingBox
}): Promise<LookupRoadResult> => {
  const { roadName, bbox } = params

  try {
    // Step 1: exact name match query
    const exactQuery = buildExactQuery(roadName, bbox)
    const exactData = await runOverpassQuery(exactQuery)
    const matches = parseWays(exactData.elements ?? [])

    if (matches.length > 0) {
      return {
        exists: true,
        status: 'found',
        matches,
      }
    }

    // Step 2: no exact match — query with first word for suggestions
    const firstWord = roadName.split(/\s+/)[0] ?? roadName
    const broadQuery = buildBroadQuery(firstWord, bbox)
    const broadData = await runOverpassQuery(broadQuery)
    const suggestions = extractSuggestions(broadData.elements ?? [])

    return {
      exists: false,
      status: 'not_found',
      suggestions,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('TIMEOUT')) {
      return {
        exists: null,
        status: 'unverified',
        reason: 'overpass_timeout',
      }
    }
    // Re-throw unexpected errors
    throw error
  }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const lookupRoad = traceableToolAsync(lookupRoadImpl, {
  name: 'lookupRoad',
  runType: 'tool',
  tags: ['planRide', 'routing', 'overpass', 'osm'],
})
