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

async function routeWithInvocationCount(
  coords: Array<{ lat: number; lng: number }>,
): Promise<RouteResult> {
  routingInvocationCount += 1
  return defaultRoute(coords)
}

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
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }): Promise<ReconstructPersistResult> => {
    resetRoutingInvocationCount()
    const route = await loadRouteForReconstruct(ctx, routeId)
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const claimedMiles = route.quarantine ? null : route.lengthMiles

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

      const routed = await evaluateRoutedAnchors(geocodedAnchors, claimedMiles)
      return { ...routed, geocodeLog }
    }

    let bestAttempt = await runPipelineAttempt()
    if (!bestAttempt) {
      return persistGateResult(ctx, route, {
        gateResult: { verdict: 'review', failedCondition: 'anchors' },
        geocodedAnchors: [],
        encodedPolyline: undefined,
        pointCount: 0,
        routedMiles: 0,
        ratio: null,
        claimedMiles,
      })
    }

    if (bestAttempt.gateResult.verdict !== 'pass') {
      const feedback = `Routed length came out ${bestAttempt.routedMiles.toFixed(1)} miles but the ride is claimed to be ${route.lengthMiles} miles.
Geocoding results were:
${bestAttempt.geocodeLog.join('\n')}`
      const repairAttempt = await runPipelineAttempt(feedback)
      if (repairAttempt) {
        const aRatio = bestAttempt.ratio ?? 100
        const bRatio = repairAttempt.ratio ?? 100
        const aScore = Math.abs(Math.log(aRatio))
        const bScore = Math.abs(Math.log(bRatio))
        if (repairAttempt.gateResult.verdict === 'pass' || bScore < aScore) {
          bestAttempt = repairAttempt
        }
      }
    }

    return persistGateResult(ctx, route, {
      gateResult: bestAttempt.gateResult,
      geocodedAnchors: bestAttempt.geocodedAnchors,
      encodedPolyline: bestAttempt.encodedPolyline,
      pointCount: bestAttempt.pointCount,
      routedMiles: bestAttempt.routedMiles,
      ratio: bestAttempt.ratio,
      claimedMiles,
    })
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
    const claimedMiles =
      args.claimedMiles !== undefined
        ? args.claimedMiles
        : route.quarantine
          ? null
          : route.lengthMiles
    const ratio = claimedMiles != null && claimedMiles > 0 ? args.routedMiles / claimedMiles : null

    const gateResult = determineGateVerdict({
      ratio,
      pointCount,
      routedMiles: args.routedMiles,
      anchorCount,
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

    const routed = await evaluateRoutedAnchors(geocodedAnchors, resolvedClaimedMiles)
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

    const routed = await evaluateRoutedAnchors(surviving, route.lengthMiles)
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
