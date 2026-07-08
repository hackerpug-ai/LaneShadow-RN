import { useQuery } from 'convex/react'
import { useMemo } from 'react'
import { api } from '../convex/_generated/api'
import { useCurrentLocation } from './use-current-location'

export type DiscoveryArchetype =
  | 'twisties'
  | 'scenic'
  | 'technical'
  | 'cruising'
  | 'sport'
  | 'adventure'

export interface UseCuratedDiscoveryParams {
  center?: { lat: number; lng: number }
  bbox?: { north: number; south: number; east: number; west: number }
  state?: string
  archetypes?: DiscoveryArchetype[]
  sort?: 'best' | 'nearest'
  limit?: number
}

export interface DiscoveryRoute {
  id: string
  name: string
  lat: number
  lng: number
  archetype: DiscoveryArchetype
  score: number
  distanceMi?: number
}

export interface UseCuratedDiscoveryResult {
  routes: DiscoveryRoute[] | undefined
  isLoading: boolean
  isEmpty: boolean
}

// Validate that a value is a valid DiscoveryArchetype
function isValidArchetype(value: unknown): value is DiscoveryArchetype {
  const validArchetypes: DiscoveryArchetype[] = [
    'twisties',
    'scenic',
    'technical',
    'cruising',
    'sport',
    'adventure',
  ]
  return typeof value === 'string' && validArchetypes.includes(value as DiscoveryArchetype)
}

export function useCuratedDiscovery(
  params: UseCuratedDiscoveryParams = {},
): UseCuratedDiscoveryResult {
  const { location, loading: locationLoading } = useCurrentLocation()
  const requestedLimit = params.limit ?? 50

  const derivedCenter =
    params.center ?? (location ? { lat: location.lat, lng: location.lng } : undefined)

  // Graceful degradation (DISC-007 STEP 2 fix): if the caller asked for
  // 'nearest' but location is unavailable AFTER both retry windows have
  // closed (loading false, no fix), fall back to 'best' so the user still
  // sees curated suggestion pills — the PRD intent is "curated-route
  // suggestion cards over the chat input", not specifically "nearest".
  // While location is still loading, keep the query skipped (loading state)
  // so the UI shows a loading affordance rather than flashing empty.
  const locationFailed = !locationLoading && !derivedCenter
  const fellBackToBest = params.sort === 'nearest' && locationFailed
  const effectiveSort: 'best' | 'nearest' = fellBackToBest ? 'best' : (params.sort ?? 'best')

  const nearestNeedsCenter = effectiveSort === 'nearest' && !derivedCenter
  const waitingForNearestCenter = nearestNeedsCenter && locationLoading

  const queryArgs = useMemo(() => {
    if (nearestNeedsCenter) return 'skip' as const

    const args: Record<string, unknown> = {}

    if (params.bbox) args.bbox = params.bbox
    if (params.state) args.state = params.state
    if (derivedCenter && effectiveSort === 'nearest') args.center = derivedCenter
    if (params.archetypes && params.archetypes.length > 0) args.archetypes = params.archetypes
    args.sort = effectiveSort
    // Over-fetch headroom for the client-side geometryStatus filter.
    // The 'nearest' mode over-fetches 4x because the geo index returns
    // rows that may lack generated geometry. The 'best' mode (Mode 4 in
    // convex/curatedRoutes.ts) reads only `effectiveLimit` rows from the
    // by_composite_score index — if none of those have geometryStatus ===
    // 'generated', the client filter kills them all → empty pills. When we
    // FALL BACK from nearest to best, apply the same 4x over-fetch so the
    // geometry filter has a pool to draw from (bounded to Convex's 200 cap).
    // An explicit sort='best' call is unchanged (callers that don't use
    // nearest don't expect over-fetch overhead).
    args.limit =
      effectiveSort === 'nearest' || fellBackToBest
        ? Math.min(Math.max(requestedLimit * 4, requestedLimit), 200)
        : requestedLimit

    return args
  }, [
    params.bbox,
    params.state,
    params.archetypes,
    effectiveSort,
    fellBackToBest,
    requestedLimit,
    derivedCenter,
    nearestNeedsCenter,
  ])

  const data = useQuery(api.curatedRoutes.listCuratedRoutes, queryArgs)

  const routes = useMemo(() => {
    if (waitingForNearestCenter) return undefined
    if (nearestNeedsCenter) return []
    if (data === undefined) return undefined

    return data
      .filter((route) => route.geometryStatus === 'generated')
      .slice(0, requestedLimit)
      .map((route) => {
        // Validate archetype to ensure it's a valid UI enum (hardening against backend changes)
        const validatedArchetype: DiscoveryArchetype = isValidArchetype(route.primaryArchetype)
          ? route.primaryArchetype
          : 'scenic'

        return {
          id: route.routeId,
          name: route.name,
          lat: route.centroidLat,
          lng: route.centroidLng,
          archetype: validatedArchetype,
          score: route.compositeScore,
          distanceMi: route.distanceMi,
        }
      })
  }, [data, nearestNeedsCenter, requestedLimit, waitingForNearestCenter])

  return {
    routes,
    isLoading: waitingForNearestCenter || (!nearestNeedsCenter && data === undefined),
    isEmpty: routes !== undefined && routes.length === 0,
  }
}
