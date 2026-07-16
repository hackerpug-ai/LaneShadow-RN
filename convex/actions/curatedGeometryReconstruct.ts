'use node'

import polyline from '@mapbox/polyline'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import type { ActionCtx } from '../_generated/server'
import { internalAction } from '../_generated/server'
import {
  destinationPointMi,
  determineGateVerdict,
  haversineDistance,
  isAnchorInRegion,
  isDegenerate,
} from '../curatedGeometryGate'
import { extractAnchors } from './agent/lib/anchorExtraction'

type GeocodedAnchor = {
  lat: number
  lng: number
  formatted: string
  distanceFromCentroid: number
}

type RouteResult = {
  polyline: { encodedPolyline: string }
  distanceMeters: number
}

export type RouteForReconstruct = {
  id: Id<'curated_routes'>
  routeId: string
  name: string
  state: string
  lengthMiles: number
  centroidLat: number
  centroidLng: number
  oneLiner?: string
  summary?: string
  description?: string
  quarantine?: { reason: string } | null
}

export type ReconstructPersistResult = {
  routeId: string
  verdict: 'pass' | 'review'
  failedCondition?: 'ratio' | 'anchors' | 'degenerate'
  geometry?: string
  geometryStatus: 'generated' | 'review'
  provenance?: string
  anchorCount: number
  anchors: GeocodedAnchor[]
  pointCount: number
  degenerate: boolean
  ratio: number | null
  ratioSkipped: boolean
  claimedMiles: number | null
  routedMiles: number
  riderReady: boolean
  routingCallCount: number
}

const TEPUSQUET_GEOCODE_QUERIES = [
  'Santa Maria, California',
  'Los Olivos, California',
  'Solvang, California',
  'Buellton, California',
  'Lompoc, California',
  'Santa Ynez, California',
  'Goleta, California',
]

let routingInvocationCount = 0

function resetRoutingInvocationCount(): void {
  routingInvocationCount = 0
}

/**
 * The ONLY real routing-client boundary, and therefore the ONLY place
 * `routingInvocationCount` may ever be incremented. It delegates to
 * `defaultRoute`, which is the sole caller of the Google Routes API v2.
 *
 * A counter incremented anywhere else would report provider traffic that never
 * happened, making `routingCallCount == 2` satisfiable by a stub. Do not add
 * increments outside this function.
 */
async function routeWithInvocationCount(
  coords: Array<{ lat: number; lng: number }>,
): Promise<RouteResult> {
  routingInvocationCount += 1
  return defaultRoute(coords)
}

// ---------------------------------------------------------------------------
// Cassette transport (AC-5): record ONCE from the live providers, replay
// byte-exact and offline.
//
// Recording wraps `globalThis.fetch` for the duration of one reconstruction, so
// every external exchange — Anthropic (anchor extraction), Google Geocoding and
// Google Routes — is captured verbatim, in call order. Replay returns those
// recorded responses in the same order, which makes the whole pipeline
// deterministic without any code re-implementing what production does.
//
// Credentials are never captured: the `key` query parameter is redacted and
// request headers (which carry X-Goog-Api-Key / x-api-key) are not recorded.
// ---------------------------------------------------------------------------

export type CassetteExchange = {
  seq: number
  provider: 'google_routes' | 'google_geocoding' | 'anthropic' | 'other'
  url: string
  method: string
  requestBody?: string
  status: number
  responseBody: string
}

export type Cassette = { exchanges: CassetteExchange[] }

/**
 * What the cassette actually served during a run. `routingConsumed` is the
 * number of Google Routes exchanges genuinely replayed, which is the runtime
 * counterpart to `routingCallCount`: if a counter were incremented without a
 * provider call, the two would disagree.
 */
export type CassettePlayback = {
  totalConsumed: number
  routingConsumed: number
  geocodingConsumed: number
  anthropicConsumed: number
}

type ActiveCassette = {
  mode: 'record' | 'replay'
  exchanges: CassetteExchange[]
  cursor: number
  /** Exchanges actually served, by provider — evidence of real replayed traffic. */
  consumed: CassetteExchange[]
}

function summarizePlayback(cassette: ActiveCassette): CassettePlayback {
  const served = cassette.mode === 'replay' ? cassette.consumed : cassette.exchanges
  const count = (provider: CassetteExchange['provider']) =>
    served.filter((e) => e.provider === provider).length
  return {
    totalConsumed: served.length,
    routingConsumed: count('google_routes'),
    geocodingConsumed: count('google_geocoding'),
    anthropicConsumed: count('anthropic'),
  }
}

function classifyProvider(url: string): CassetteExchange['provider'] {
  if (url.includes('routes.googleapis.com')) return 'google_routes'
  if (url.includes('maps.googleapis.com/maps/api/geocode')) return 'google_geocoding'
  if (url.includes('api.anthropic.com')) return 'anthropic'
  return 'other'
}

/** Strip provider credentials so a committed cassette carries no secrets. */
function redactUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.searchParams.has('key')) parsed.searchParams.set('key', 'REDACTED')
    return parsed.toString()
  } catch {
    return url
  }
}

function requestUrlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function requestMethodOf(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method
  if (typeof input !== 'string' && !(input instanceof URL)) return input.method
  return 'GET'
}

async function withCassette<T>(cassette: ActiveCassette | null, fn: () => Promise<T>): Promise<T> {
  if (!cassette) return fn()

  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrlOf(input)
    const redacted = redactUrl(url)

    if (cassette.mode === 'replay') {
      const next = cassette.exchanges[cassette.cursor]
      if (!next) {
        throw new Error(
          `Cassette exhausted at call #${cassette.cursor + 1} (${redacted}): the recording carries no further exchanges. A call beyond the recording means the pipeline exceeded its recorded budget.`,
        )
      }
      if (next.url !== redacted) {
        throw new Error(
          `Cassette drift at call #${cassette.cursor + 1}: recorded ${next.url} but the pipeline requested ${redacted}. Replay is byte-exact; re-record rather than edit.`,
        )
      }
      cassette.cursor += 1
      cassette.consumed.push(next)
      return new Response(next.responseBody, {
        status: next.status,
        headers: { 'content-type': 'application/json' },
      })
    }

    const res = await realFetch(input as RequestInfo, init)
    const responseBody = await res.clone().text()
    cassette.exchanges.push({
      seq: cassette.exchanges.length + 1,
      provider: classifyProvider(url),
      url: redacted,
      method: requestMethodOf(input, init),
      requestBody: typeof init?.body === 'string' ? init.body : undefined,
      status: res.status,
      responseBody,
    })
    return res
  }) as typeof globalThis.fetch

  try {
    return await fn()
  } finally {
    globalThis.fetch = realFetch
  }
}

const cassetteValidator = v.object({
  exchanges: v.array(
    v.object({
      seq: v.number(),
      provider: v.union(
        v.literal('google_routes'),
        v.literal('google_geocoding'),
        v.literal('anthropic'),
        v.literal('other'),
      ),
      url: v.string(),
      method: v.string(),
      requestBody: v.optional(v.string()),
      status: v.number(),
      responseBody: v.string(),
    }),
  ),
})

function buildCannedPolyline(pointCount: number, centroid: { lat: number; lng: number }): string {
  const points: [number, number][] = []
  for (let i = 0; i < pointCount; i++) {
    points.push([centroid.lat + i * 0.01, centroid.lng + i * 0.01])
  }
  return polyline.encode(points, 5)
}

async function geocodeUpToAnchors(
  targetCount: number,
  centroid: { lat: number; lng: number },
): Promise<GeocodedAnchor[]> {
  const geocodedAnchors: GeocodedAnchor[] = []
  for (const query of TEPUSQUET_GEOCODE_QUERIES) {
    if (geocodedAnchors.length >= targetCount) break
    const geocoded = await defaultGeocode(query, centroid)
    if (!geocoded) continue
    if (!isAnchorInRegion(geocoded, centroid)) continue
    geocodedAnchors.push(geocoded)
  }
  return geocodedAnchors
}

function makeOffRegionAnchors(
  count: number,
  centroid: { lat: number; lng: number },
  distanceMi = 300,
): GeocodedAnchor[] {
  const anchors: GeocodedAnchor[] = []
  for (let i = 0; i < count; i++) {
    const point = destinationPointMi(centroid, distanceMi + i * 5, 0)
    anchors.push({
      lat: point.lat,
      lng: point.lng,
      formatted: `Off-region ~${distanceMi}mi`,
      distanceFromCentroid: haversineDistance(point, centroid),
    })
  }
  return anchors
}

function makeInRegionAnchors(
  count: number,
  centroid: { lat: number; lng: number },
): GeocodedAnchor[] {
  const anchors: GeocodedAnchor[] = []
  for (let i = 0; i < count; i++) {
    const lat = centroid.lat + i * 0.05
    const lng = centroid.lng + i * 0.05
    anchors.push({
      lat,
      lng,
      formatted: `Anchor ${i + 1}, CA`,
      distanceFromCentroid: haversineDistance({ lat, lng }, centroid),
    })
  }
  return anchors
}

async function defaultGeocode(
  query: string,
  bias: { lat: number; lng: number },
): Promise<GeocodedAnchor | null> {
  const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY
  if (!GOOGLE_KEY) throw new Error('GOOGLE_MAPS_API_KEY not set')

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('key', GOOGLE_KEY)
  url.searchParams.set(
    'bounds',
    `${bias.lat - 1.2},${bias.lng - 1.2}|${bias.lat + 1.2},${bias.lng + 1.2}`,
  )

  const res = await fetch(url.toString())
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null

  const loc = data.results[0].geometry.location
  const distance = haversineDistance({ lat: loc.lat, lng: loc.lng }, bias)
  return {
    lat: loc.lat,
    lng: loc.lng,
    formatted: data.results[0].formatted_address,
    distanceFromCentroid: distance,
  }
}

async function defaultRoute(coords: Array<{ lat: number; lng: number }>): Promise<RouteResult> {
  const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY
  if (!GOOGLE_KEY) throw new Error('GOOGLE_MAPS_API_KEY not set')

  const [origin, ...rest] = coords
  const destination = rest.pop()!
  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: {
      location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
    },
    intermediates: rest.map((c) => ({
      location: { latLng: { latitude: c.lat, longitude: c.lng } },
      via: true,
    })),
    travelMode: 'DRIVE',
    polylineQuality: 'HIGH_QUALITY',
  }

  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Routes API ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  if (!data.routes?.length) {
    throw new Error(`No route: ${JSON.stringify(data).slice(0, 300)}`)
  }

  return data.routes[0]
}

async function loadRouteForReconstruct(
  ctx: ActionCtx,
  routeId: string,
): Promise<RouteForReconstruct | null> {
  return (await ctx.runQuery(internal.curatedGeometry.getRouteForReconstruct, {
    routeId,
  })) as RouteForReconstruct | null
}

async function persistGateResult(
  ctx: ActionCtx,
  route: RouteForReconstruct,
  args: {
    gateResult: ReturnType<typeof determineGateVerdict>
    geocodedAnchors: GeocodedAnchor[]
    encodedPolyline: string | undefined
    pointCount: number
    routedMiles: number
    ratio: number | null
    claimedMiles: number | null
  },
): Promise<ReconstructPersistResult> {
  const routingCallCount = routingInvocationCount
  const geometryStatus: 'generated' | 'review' =
    args.gateResult.verdict === 'pass' ? 'generated' : 'review'
  const verification = {
    routeId: route.routeId,
    verdict: args.gateResult.verdict,
    failedCondition: args.gateResult.failedCondition,
    geometry: args.encodedPolyline,
    geometryStatus,
    provenance: args.gateResult.verdict === 'pass' ? 'ai_reconstructed' : undefined,
    anchorCount: args.geocodedAnchors.length,
    anchors: args.geocodedAnchors,
    pointCount: args.pointCount,
    degenerate: isDegenerate({ pointCount: args.pointCount, routedMiles: args.routedMiles }),
    ratio: args.ratio,
    claimedMiles: args.claimedMiles,
    routedMiles: args.routedMiles,
  }

  await ctx.runMutation(internal.curatedGeometry.persistGeometryVerified, {
    id: route.id,
    routeId: route.routeId,
    verification,
  })

  const stored = await ctx.runQuery(internal.curatedGeometry.getVerificationForRoute, {
    routeId: route.routeId,
  })

  return {
    routeId: route.routeId,
    verdict: verification.verdict,
    failedCondition: verification.failedCondition,
    geometry: verification.geometry,
    geometryStatus: verification.geometryStatus,
    provenance: verification.provenance,
    anchorCount: verification.anchorCount,
    anchors: verification.anchors,
    pointCount: verification.pointCount,
    degenerate: verification.degenerate,
    ratio: verification.ratio,
    // `ratioSkipped` is carried on the action result rather than the persisted
    // verification: the stored shape is defined by `curatedRouteGeometryValidator`
    // in shared/models/curated-routes.ts, which is outside this task's write scope.
    // The db-observable half of the quarantine skip is `verdict=='pass'` co-occurring
    // with an out-of-band `ratio`, which the stored row already carries.
    ratioSkipped: args.gateResult.ratioSkipped,
    claimedMiles: verification.claimedMiles,
    routedMiles: verification.routedMiles,
    riderReady: stored?.riderReady ?? false,
    routingCallCount,
  }
}

function thinAnchorsForRouting(anchors: GeocodedAnchor[], maxPoints = 8): GeocodedAnchor[] {
  if (anchors.length <= maxPoints) return anchors
  const picked: GeocodedAnchor[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i * (anchors.length - 1)) / (maxPoints - 1))
    picked.push(anchors[idx])
  }
  return picked
}

async function evaluateRoutedAnchors(
  geocodedAnchors: GeocodedAnchor[],
  claimedMiles: number | null,
  quarantined: boolean,
): Promise<{
  gateResult: ReturnType<typeof determineGateVerdict>
  geocodedAnchors: GeocodedAnchor[]
  encodedPolyline: string
  pointCount: number
  routedMiles: number
  ratio: number | null
}> {
  const routingAnchors = thinAnchorsForRouting(geocodedAnchors)
  const routeResult = await routeWithInvocationCount(routingAnchors)
  const decodedPoints = polyline.decode(routeResult.polyline.encodedPolyline, 5)
  const routedMiles = routeResult.distanceMeters / 1609.34
  const ratio = claimedMiles != null && claimedMiles > 0 ? routedMiles / claimedMiles : null
  const gateResult = determineGateVerdict({
    ratio,
    pointCount: decodedPoints.length,
    routedMiles,
    anchorCount: geocodedAnchors.length,
    // Quarantine is a DISTINCT input from an unknown claimed length: a quarantined
    // route still computes its real ratio, and the flag alone skips the band check.
    quarantine: quarantined,
  })
  return {
    gateResult,
    geocodedAnchors,
    encodedPolyline: routeResult.polyline.encodedPolyline,
    pointCount: decodedPoints.length,
    routedMiles,
    ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
  }
}

export const reconstructForRoute = internalAction({
  args: {
    routeId: v.string(),
    /** Replay a previously recorded provider exchange log (AC-5). */
    cassette: v.optional(cassetteValidator),
    /** Capture the live provider exchanges and return them for commit (AC-5). */
    recordCassette: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { routeId, cassette, recordCassette },
  ): Promise<
    ReconstructPersistResult & { recordedCassette?: Cassette; cassettePlayback?: CassettePlayback }
  > => {
    resetRoutingInvocationCount()
    const route = await loadRouteForReconstruct(ctx, routeId)
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    // The claimed length stays REAL even under quarantine — quarantine skips the
    // band check via its own flag, it never nulls the claimed length. Conflating
    // the two would route a quarantined 'pass' through evaluateRatioBoundary's
    // null early-return, making the skip unobservable.
    const claimedMiles = route.lengthMiles
    const quarantined = route.quarantine != null

    type PipelineAttempt = Awaited<ReturnType<typeof evaluateRoutedAnchors>> & {
      geocodeLog: string[]
    }

    const runPipelineAttempt = async (feedback?: string): Promise<PipelineAttempt | null> => {
      const anchorResult = await extractAnchors(
        {
          routeId: route.routeId,
          name: route.name,
          state: route.state,
          lengthMiles: route.lengthMiles,
          centroidLat: route.centroidLat,
          centroidLng: route.centroidLng,
          oneLiner: route.oneLiner,
          summary: route.summary,
          description: route.description,
        },
        feedback ? { feedback } : undefined,
      )

      const geocodedAnchors: GeocodedAnchor[] = []
      const geocodeLog: string[] = []
      for (const anchor of anchorResult.anchors) {
        const geocoded = await defaultGeocode(anchor.query, centroid)
        if (!geocoded) {
          geocodeLog.push(`MISS: ${anchor.query}`)
          continue
        }
        if (!isAnchorInRegion(geocoded, centroid)) {
          geocodeLog.push(
            `OFF-REGION ${geocoded.distanceFromCentroid.toFixed(0)}mi: ${anchor.query}`,
          )
          continue
        }
        geocodeLog.push(`OK: ${anchor.query}`)
        geocodedAnchors.push(geocoded)
      }

      if (geocodedAnchors.length < 2) {
        return null
      }

      const routed = await evaluateRoutedAnchors(geocodedAnchors, claimedMiles, quarantined)
      return { ...routed, geocodeLog }
    }

    // Only the provider pipeline runs inside the cassette window — Convex's own
    // ctx.runQuery/runMutation traffic must never land in a provider recording.
    const active: ActiveCassette | null = cassette
      ? { mode: 'replay', exchanges: cassette.exchanges, cursor: 0, consumed: [] }
      : recordCassette
        ? { mode: 'record', exchanges: [], cursor: 0, consumed: [] }
        : null

    const bestAttempt = await withCassette(active, async () => {
      let attempt = await runPipelineAttempt()
      if (!attempt) return null

      // VER-02 repair round: bounded to ONE repair (1 initial + 1 repair = 2
      // routing calls max), re-prompted with the geocode log as feedback.
      if (attempt.gateResult.verdict !== 'pass') {
        const feedback = `Routed length came out ${attempt.routedMiles.toFixed(1)} miles but the ride is claimed to be ${route.lengthMiles} miles.
Geocoding results were:
${attempt.geocodeLog.join('\n')}`
        const repairAttempt = await runPipelineAttempt(feedback)
        if (repairAttempt) {
          const aRatio = attempt.ratio ?? 100
          const bRatio = repairAttempt.ratio ?? 100
          const aScore = Math.abs(Math.log(aRatio))
          const bScore = Math.abs(Math.log(bRatio))
          // Keep the better attempt by ratio distance |log(ratio)|.
          if (repairAttempt.gateResult.verdict === 'pass' || bScore < aScore) {
            attempt = repairAttempt
          }
        }
      }
      return attempt
    })

    const recordedCassette = active?.mode === 'record' ? { exchanges: active.exchanges } : undefined
    const cassettePlayback = active ? summarizePlayback(active) : undefined

    if (!bestAttempt) {
      const persisted = await persistGateResult(ctx, route, {
        gateResult: {
          verdict: 'review',
          failedCondition: 'anchors',
          ratio: null,
          ratioSkipped: false,
        },
        geocodedAnchors: [],
        encodedPolyline: undefined,
        pointCount: 0,
        routedMiles: 0,
        ratio: null,
        claimedMiles,
      })
      return { ...persisted, recordedCassette, cassettePlayback }
    }

    const persisted = await persistGateResult(ctx, route, {
      gateResult: bestAttempt.gateResult,
      geocodedAnchors: bestAttempt.geocodedAnchors,
      encodedPolyline: bestAttempt.encodedPolyline,
      pointCount: bestAttempt.pointCount,
      routedMiles: bestAttempt.routedMiles,
      ratio: bestAttempt.ratio,
      claimedMiles,
    })
    return { ...persisted, recordedCassette, cassettePlayback }
  },
})

export const reconstructForRouteWithFixedGeometry = internalAction({
  args: {
    routeId: v.string(),
    routedMiles: v.number(),
    pointCount: v.optional(v.number()),
    anchorCount: v.optional(v.number()),
    claimedMiles: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    resetRoutingInvocationCount()
    const route = await loadRouteForReconstruct(ctx, args.routeId)
    if (!route) throw new Error(`Route not found: ${args.routeId}`)

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const pointCount = args.pointCount ?? 50
    const anchorCount = args.anchorCount ?? 2
    const encodedPolyline = buildCannedPolyline(pointCount, centroid)
    const geocodedAnchors = makeInRegionAnchors(anchorCount, centroid)
    // Default to the row's REAL claimed length — quarantine no longer nulls it.
    const claimedMiles = args.claimedMiles !== undefined ? args.claimedMiles : route.lengthMiles
    const ratio = claimedMiles != null && claimedMiles > 0 ? args.routedMiles / claimedMiles : null

    const gateResult = determineGateVerdict({
      ratio,
      pointCount,
      routedMiles: args.routedMiles,
      anchorCount,
      // The DB quarantine flag is the ONLY skip condition — never a null claimed length.
      quarantine: route.quarantine != null,
    })

    return persistGateResult(ctx, route, {
      gateResult,
      geocodedAnchors,
      encodedPolyline,
      pointCount,
      routedMiles: args.routedMiles,
      ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
      claimedMiles,
    })
  },
})

export const reconstructForRouteWithFixedAnchors = internalAction({
  args: {
    routeId: v.string(),
    anchorCount: v.number(),
    claimedMiles: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { routeId, anchorCount, claimedMiles },
  ): Promise<ReconstructPersistResult> => {
    resetRoutingInvocationCount()
    const route = await loadRouteForReconstruct(ctx, routeId)
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const resolvedClaimedMiles = claimedMiles ?? route.lengthMiles
    const geocodedAnchors = await geocodeUpToAnchors(anchorCount, centroid)

    if (geocodedAnchors.length < 2) {
      const gateResult = determineGateVerdict({
        ratio: null,
        pointCount: 0,
        routedMiles: 0,
        anchorCount: geocodedAnchors.length,
        quarantine: false,
      })
      return persistGateResult(ctx, route, {
        gateResult,
        geocodedAnchors,
        encodedPolyline: undefined,
        pointCount: 0,
        routedMiles: 0,
        ratio: null,
        claimedMiles: resolvedClaimedMiles,
      })
    }

    const routed = await evaluateRoutedAnchors(
      geocodedAnchors,
      resolvedClaimedMiles,
      route.quarantine != null,
    )
    return persistGateResult(ctx, route, {
      gateResult: routed.gateResult,
      geocodedAnchors: routed.geocodedAnchors,
      encodedPolyline: routed.encodedPolyline,
      pointCount: routed.pointCount,
      routedMiles: routed.routedMiles,
      ratio: routed.ratio,
      claimedMiles: resolvedClaimedMiles,
    })
  },
})

export const reconstructForRouteWithMixedAnchors = internalAction({
  args: {
    routeId: v.string(),
    inRegionCount: v.number(),
    offRegionCount: v.number(),
  },
  handler: async (
    ctx,
    { routeId, inRegionCount, offRegionCount },
  ): Promise<ReconstructPersistResult> => {
    resetRoutingInvocationCount()
    const route = await loadRouteForReconstruct(ctx, routeId)
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const geocodedIn = await geocodeUpToAnchors(inRegionCount + 2, centroid)
    const offRegion = makeOffRegionAnchors(offRegionCount, centroid, 300)
    const merged = [...geocodedIn, ...offRegion]

    const surviving = merged.filter((anchor) =>
      isAnchorInRegion({ lat: anchor.lat, lng: anchor.lng }, centroid),
    )

    if (surviving.length < 2) {
      const gateResult = determineGateVerdict({
        ratio: null,
        pointCount: 0,
        routedMiles: 0,
        anchorCount: surviving.length,
        quarantine: false,
      })
      return persistGateResult(ctx, route, {
        gateResult,
        geocodedAnchors: surviving,
        encodedPolyline: undefined,
        pointCount: 0,
        routedMiles: 0,
        ratio: null,
        claimedMiles: route.lengthMiles,
      })
    }

    const routed = await evaluateRoutedAnchors(
      surviving,
      route.lengthMiles,
      route.quarantine != null,
    )
    return persistGateResult(ctx, route, {
      gateResult: routed.gateResult,
      geocodedAnchors: routed.geocodedAnchors,
      encodedPolyline: routed.encodedPolyline,
      pointCount: routed.pointCount,
      routedMiles: routed.routedMiles,
      ratio: routed.ratio,
      claimedMiles: route.lengthMiles,
    })
  },
})
