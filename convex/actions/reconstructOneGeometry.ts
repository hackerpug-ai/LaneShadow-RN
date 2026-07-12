'use node'

import polyline from '@mapbox/polyline'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import {
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

function buildCannedPolyline(pointCount: number, centroid: { lat: number; lng: number }): string {
  const points: [number, number][] = []
  for (let i = 0; i < pointCount; i++) {
    points.push([centroid.lat + i * 0.01, centroid.lng + i * 0.01])
  }
  return polyline.encode(points, 5)
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

async function persistGateResult(
  ctx: { runMutation: (ref: any, args: any) => Promise<any> },
  route: { id: any; routeId: string; lengthMiles: number; quarantine?: { reason: string } | null },
  args: {
    gateResult: ReturnType<typeof determineGateVerdict>
    geocodedAnchors: GeocodedAnchor[]
    encodedPolyline: string | undefined
    pointCount: number
    routedMiles: number
    ratio: number | null
    claimedMiles: number | null
  },
) {
  const geometryStatus = args.gateResult.verdict === 'pass' ? 'generated' : 'review'
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

  return { ...verification, riderReady: args.gateResult.verdict === 'pass' }
}

export const reconstructForRoute = internalAction({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const route = await ctx.runQuery(internal.curatedGeometry.getRouteForReconstruct, { routeId })
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const anchorResult = await extractAnchors({
      routeId: route.routeId,
      name: route.name,
      state: route.state,
      lengthMiles: route.lengthMiles,
      centroidLat: route.centroidLat,
      centroidLng: route.centroidLng,
      oneLiner: route.oneLiner,
      summary: route.summary,
      description: route.description,
    })

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const geocodedAnchors: GeocodedAnchor[] = []

    for (const anchor of anchorResult.anchors) {
      const geocoded = await defaultGeocode(anchor.query, centroid)
      if (!geocoded) continue
      if (isAnchorInRegion(geocoded, centroid)) {
        geocodedAnchors.push(geocoded)
      }
    }

    if (geocodedAnchors.length < 2) {
      return persistGateResult(ctx, route, {
        gateResult: { verdict: 'review', failedCondition: 'anchors' },
        geocodedAnchors,
        encodedPolyline: undefined,
        pointCount: 0,
        routedMiles: 0,
        ratio: null,
        claimedMiles: route.quarantine ? null : route.lengthMiles,
      })
    }

    const routeResult = await defaultRoute(geocodedAnchors)
    const decodedPoints = polyline.decode(routeResult.polyline.encodedPolyline, 5)
    const routedMiles = routeResult.distanceMeters / 1609.34
    const claimedMiles = route.quarantine ? null : route.lengthMiles
    const ratio =
      claimedMiles != null && claimedMiles > 0 ? routedMiles / claimedMiles : null

    const gateResult = determineGateVerdict({
      ratio,
      pointCount: decodedPoints.length,
      routedMiles,
      anchorCount: geocodedAnchors.length,
    })

    return persistGateResult(ctx, route, {
      gateResult,
      geocodedAnchors,
      encodedPolyline: routeResult.polyline.encodedPolyline,
      pointCount: decodedPoints.length,
      routedMiles,
      ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
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
  handler: async (ctx, args) => {
    const route = await ctx.runQuery(internal.curatedGeometry.getRouteForReconstruct, {
      routeId: args.routeId,
    })
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
    const ratio =
      claimedMiles != null && claimedMiles > 0 ? args.routedMiles / claimedMiles : null

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
  handler: async (ctx, { routeId, anchorCount }) => {
    const route = await ctx.runQuery(internal.curatedGeometry.getRouteForReconstruct, { routeId })
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const geocodedAnchors = makeInRegionAnchors(anchorCount, centroid)

    return persistGateResult(ctx, route, {
      gateResult: { verdict: 'review', failedCondition: 'anchors' },
      geocodedAnchors,
      encodedPolyline: undefined,
      pointCount: 0,
      routedMiles: 0,
      ratio: null,
      claimedMiles: route.lengthMiles,
    })
  },
})

export const reconstructForRouteWithMixedAnchors = internalAction({
  args: {
    routeId: v.string(),
    inRegionCount: v.number(),
    offRegionCount: v.number(),
  },
  handler: async (ctx, { routeId, inRegionCount, offRegionCount }) => {
    const route = await ctx.runQuery(internal.curatedGeometry.getRouteForReconstruct, { routeId })
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const inRegion = makeInRegionAnchors(inRegionCount, centroid)
    const offRegion: GeocodedAnchor[] = []
    for (let i = 0; i < offRegionCount; i++) {
      offRegion.push({
        lat: centroid.lat + 4.5,
        lng: centroid.lng + 4.5,
        formatted: `Off-region ${i + 1}`,
        distanceFromCentroid: 300,
      })
    }

    const surviving = inRegion.filter((a) => isAnchorInRegion(a, centroid))
    const routedMiles = 41.07
    const pointCount = 50
    const encodedPolyline = buildCannedPolyline(pointCount, centroid)
    const ratio = route.lengthMiles > 0 ? routedMiles / route.lengthMiles : null
    const gateResult = determineGateVerdict({
      ratio,
      pointCount,
      routedMiles,
      anchorCount: surviving.length,
    })

    return persistGateResult(ctx, route, {
      gateResult,
      geocodedAnchors: surviving,
      encodedPolyline,
      pointCount,
      routedMiles,
      ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
      claimedMiles: route.lengthMiles,
    })
  },
})