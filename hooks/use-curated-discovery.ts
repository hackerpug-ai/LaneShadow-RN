import { useQuery } from 'convex/react'
import { useMemo } from 'react'
import { api } from '../server/convex/_generated/api'
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

export function useCuratedDiscovery(
  params: UseCuratedDiscoveryParams = {},
): UseCuratedDiscoveryResult {
  const { location } = useCurrentLocation()

  const derivedCenter =
    params.center ?? (location ? { lat: location.lat, lng: location.lng } : undefined)

  const queryArgs = useMemo(() => {
    const args: Record<string, unknown> = {}

    if (params.bbox) args.bbox = params.bbox
    if (params.state) args.state = params.state
    if (derivedCenter && params.sort === 'nearest') args.center = derivedCenter
    if (params.archetypes && params.archetypes.length > 0) args.archetypes = params.archetypes
    args.sort = params.sort ?? 'best'
    args.limit = params.limit ?? 50

    return args
  }, [params.bbox, params.state, params.archetypes, params.sort, params.limit, derivedCenter])

  const data = useQuery(api.curatedRoutes.listCuratedRoutes, queryArgs)

  const routes = useMemo(() => {
    if (data === undefined) return undefined

    return data.map((route) => ({
      id: route.routeId,
      name: route.name,
      lat: route.centroidLat,
      lng: route.centroidLng,
      archetype: route.primaryArchetype as DiscoveryArchetype,
      score: route.compositeScore,
      distanceMi: route.distanceMi,
    }))
  }, [data])

  return {
    routes,
    isLoading: data === undefined,
    isEmpty: routes !== undefined && routes.length === 0,
  }
}
