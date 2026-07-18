import { useQuery } from 'convex/react'
import type { Infer } from 'convex/values'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../convex/_generated/api'
import type { listCuratedRoutesReturnValidator } from '../convex/curatedRoutes'
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

/**
 * The slice of `api.curatedRoutes.listCuratedRoutes` rows this hook consumes.
 *
 * DERIVED from the server's own return validator, not hand-copied: `Pick<...>`
 * over `Infer<typeof listCuratedRoutesReturnValidator>` means this type IS the
 * server contract, narrowed to the fields read below.
 *
 * What that actually catches, precisely: renames/removals of any picked field
 * are a compile error universally (the `Pick` constraint fails, TS2344). Type
 * changes are caught only for the fields that flow into `DiscoveryRoute` (the
 * mapping fails, TS2322) — NOT for `state`, which is picked but never read, nor
 * for `primaryArchetype`, which reaches the mapping only through
 * `isValidArchetype`'s `unknown` param; retyping either of those compiles clean.
 * (All four cases verified by mutating the validator and measuring `tsc`.)
 * Adding new server fields stays compatible, which is the intended asymmetry.
 *
 * The import is `import type`, so it is erased at build time — no server module
 * is pulled into the RN bundle.
 *
 * LIMIT — the annotation on `useQuery` below is NOT checked by this. The
 * generated Convex api degrades this query's `FunctionReturnType` to `any`, and
 * `any` satisfies any annotation, so a wrong annotation there would still
 * compile. The safety here comes from deriving the type, never from the act of
 * annotating. Do not read that annotation as a verified server contract.
 */
type CuratedRouteListRow = Pick<
  Infer<typeof listCuratedRoutesReturnValidator>[number],
  | 'routeId'
  | 'name'
  | 'state'
  | 'primaryArchetype'
  | 'centroidLat'
  | 'centroidLng'
  | 'compositeScore'
  | 'distanceMi'
  | 'geometryStatus'
>

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
  const fellBackToBestFromLocation = params.sort === 'nearest' && locationFailed

  // DISC-007 STEP 2 final fix (remediation cycle 2): ALSO fall back to
  // 'best' when the nearest query returns EMPTY. The server's Mode 2
  // (nearest) applies a 20-mile distance cap (MAX_NEAREST_CURATED_ROUTE_
  // DISTANCE_MI in convex/curatedRoutes.ts:125). Many simulated/test
  // locations (e.g. SLC 40.76,-111.89) have ZERO curated routes within
  // 20mi. Without this fallback, the user sees "No nearby routes" instead
  // of the curated suggestion pills the PRD requires. Falling back to
  // 'best' surfaces the catalog's top-quality routes (Cherohala Skyway,
  // Wasatch Ridge Traverse, etc.) — which is exactly what the capstone
  // ACs expect to observe.
  const [fellBackToBestFromEmptyNearest, setFellBackToBestFromEmptyNearest] = useState(false)

  const fellBackToBest = fellBackToBestFromLocation || fellBackToBestFromEmptyNearest
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

  // Annotated (not cast): useQuery's inferred type is `any` here, so this
  // annotation is what gives the filter/map callbacks below a type. It is NOT
  // itself a contract check — `any` would accept any annotation written here.
  // The server bond lives in CuratedRouteListRow's derivation above.
  const data: CuratedRouteListRow[] | undefined = useQuery(
    api.curatedRoutes.listCuratedRoutes,
    queryArgs,
  )

  const routes = useMemo(() => {
    if (waitingForNearestCenter) return undefined
    if (nearestNeedsCenter) return []
    if (data === undefined) return undefined

    return (
      data
        // DISC-007 STEP 2 final fix: the catalog's top-quality routes
        // (Cherohala Skyway, Wasatch Ridge Traverse, etc. — the exact routes
        // the capstone ACs expect to see) have geometryStatus === undefined
        // because they predate the Sprint 02 geometry-backfill feature (see
        // convex/curatedGeometry.ts:162 comment). A strict `=== 'generated'`
        // filter excluded them all, leaving zero suggestion pills.
        //
        // Relaxed semantics (matches PRD intent + AC-4 graceful degradation):
        //   ✅ SHOW 'generated'  — backfill completed, has polyline
        //   ✅ SHOW absent/null  — original catalog routes (polyline OR centroid
        //                          pin per AC-4)
        //   ❌ HIDE 'unresolved' — backfill pending, may not have geometry yet
        //   ❌ HIDE 'failed'     — backfill tried and failed, known-bad
        .filter(
          (route) => route.geometryStatus !== 'unresolved' && route.geometryStatus !== 'failed',
        )
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
    )
  }, [data, nearestNeedsCenter, requestedLimit, waitingForNearestCenter])

  // Detect when the nearest query returns 0 passable routes and trigger
  // the best-fallback. Checks `routes` (the final filtered result) so it
  // also catches the case where the server returned rows within 20mi but
  // ALL were filtered out by geometryStatus (e.g. all 'unresolved').
  // Guards: only fires once (state latches), only for explicit sort='nearest'
  // callers, and only when not already fallen back from location failure.
  useEffect(() => {
    if (
      params.sort === 'nearest' &&
      !fellBackToBestFromLocation &&
      !fellBackToBestFromEmptyNearest &&
      !waitingForNearestCenter &&
      !nearestNeedsCenter &&
      routes !== undefined &&
      routes.length === 0
    ) {
      setFellBackToBestFromEmptyNearest(true)
    }
  }, [
    routes,
    params.sort,
    fellBackToBestFromLocation,
    fellBackToBestFromEmptyNearest,
    waitingForNearestCenter,
    nearestNeedsCenter,
  ])

  return {
    routes,
    isLoading: waitingForNearestCenter || (!nearestNeedsCenter && data === undefined),
    isEmpty: routes !== undefined && routes.length === 0,
  }
}
