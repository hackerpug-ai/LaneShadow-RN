/**
 * Public wrappers for geometry recovery levers + verification reads.
 *
 * - Lever 2 reconstruct: delegates to `'use node'` actions/curatedGeometryReconstruct.ts
 * - Lever 1 promote (UC-REC-01): zero-cost in-row polyline promote (this file, default rt)
 * - Lever 3 re-route (UC-REC-03): deterministic name parse → geocode → route → gate
 *
 * Gate is ALWAYS the shared curatedGeometryGate.determineGateVerdict — never reimplemented.
 */

import polyline from '@mapbox/polyline'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { action, internalMutation, internalQuery, mutation, query } from './_generated/server'
import type { ReconstructPersistResult } from './actions/curatedGeometryReconstruct'
import { determineGateVerdict, haversineDistance, isDegenerate } from './curatedGeometryGate'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'
import {
  geocodeBoundsForCentroid,
  type ParseRouteNameResult,
  parseRouteName,
} from './lib/endpointParser'

// ---------------------------------------------------------------------------
// Lever 2 public wrappers (existing)
// ---------------------------------------------------------------------------

export const reconstructForRoute = action({
  args: { routeId: v.string() },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(internal.actions.curatedGeometryReconstruct.reconstructForRoute, args)
  },
})

export const reconstructForRouteWithFixedGeometry = action({
  args: {
    routeId: v.string(),
    routedMiles: v.number(),
    pointCount: v.optional(v.number()),
    anchorCount: v.optional(v.number()),
    claimedMiles: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(
      internal.actions.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry,
      args,
    )
  },
})

export const reconstructForRouteWithFixedAnchors = action({
  args: {
    routeId: v.string(),
    anchorCount: v.number(),
    claimedMiles: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(
      internal.actions.curatedGeometryReconstruct.reconstructForRouteWithFixedAnchors,
      args,
    )
  },
})

export const reconstructForRouteWithMixedAnchors = action({
  args: {
    routeId: v.string(),
    inRegionCount: v.number(),
    offRegionCount: v.number(),
  },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(
      internal.actions.curatedGeometryReconstruct.reconstructForRouteWithMixedAnchors,
      args,
    )
  },
})

export const getVerificationForRoute = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    if (!geomRow?.verification) return null

    const sideProvenance = geomRow.provenance
    return {
      ...geomRow.verification,
      provenance: geomRow.verification.provenance ?? sideProvenance,
      riderReady: route?.riderReady ?? false,
      sideTableProvenance: sideProvenance ?? null,
    }
  },
})

export const getRouteForReading = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!doc) return null
    return {
      routeId: doc.routeId,
      riderReady: doc.riderReady ?? false,
      geometryStatus: doc.geometryStatus ?? null,
      name: doc.name,
      routePolyline: doc.routePolyline ?? null,
      lengthMiles: doc.lengthMiles,
    }
  },
})

// ---------------------------------------------------------------------------
// Shared types + helpers for Lever 1 / Lever 3
// ---------------------------------------------------------------------------

type Provenance = 'scraped_promoted' | 'name_routed' | 'ai_reconstructed'

type GeocodedAnchor = {
  lat: number
  lng: number
  formatted: string
  distanceFromCentroid: number
}

export type LeverResult = {
  routeId: string
  /** 'generated' = gate pass stored; 'next_lever' = L1 fail → L2; 'review' = terminal review */
  disposition: 'generated' | 'next_lever' | 'review' | 'failed'
  nextLever?: 2 | 3
  verdict: 'pass' | 'review'
  failedCondition?: 'ratio' | 'anchors' | 'degenerate'
  provenance?: Provenance
  geometryStatus: 'generated' | 'review' | 'unresolved' | 'failed'
  routedMiles: number
  claimedMiles: number | null
  ratio: number | null
  pointCount: number
  anchorCount: number
  anchors: GeocodedAnchor[]
  geometry?: string
  /** True only when disposition === 'next_lever' (Lever 1 fail path). */
  queuedForLever2: boolean
  /** True only when disposition === 'review' (Lever 3 terminal fail). */
  queuedForReview: boolean
  /** Geocode request URL(s) with key redacted — evidence for region bias (AC-6). */
  geocodeUrls?: string[]
  llmCallCount: number
}

function polylineLengthMiles(points: Array<[number, number]>): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      { lat: points[i - 1][0], lng: points[i - 1][1] },
      { lat: points[i][0], lng: points[i][1] },
    )
  }
  return total
}

function anchorsFromPolyline(
  points: Array<[number, number]>,
  centroid: { lat: number; lng: number },
): GeocodedAnchor[] {
  if (points.length === 0) return []
  const first = points[0]
  const last = points[points.length - 1]
  const a: GeocodedAnchor = {
    lat: first[0],
    lng: first[1],
    formatted: 'polyline-start',
    distanceFromCentroid: haversineDistance({ lat: first[0], lng: first[1] }, centroid),
  }
  if (points.length === 1) return [a]
  const b: GeocodedAnchor = {
    lat: last[0],
    lng: last[1],
    formatted: 'polyline-end',
    distanceFromCentroid: haversineDistance({ lat: last[0], lng: last[1] }, centroid),
  }
  return [a, b]
}

function redactKey(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.searchParams.has('key')) parsed.searchParams.set('key', 'REDACTED')
    return parsed.toString()
  } catch {
    return url.replace(/key=[^&]+/g, 'key=REDACTED')
  }
}

async function geocodePlace(
  query: string,
  bias: { lat: number; lng: number },
  state?: string,
): Promise<{ anchor: GeocodedAnchor | null; url: string }> {
  const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY
  if (!GOOGLE_KEY) throw new Error('GOOGLE_MAPS_API_KEY not set')

  const address = state ? `${query}, ${state}` : query
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', GOOGLE_KEY)
  url.searchParams.set('bounds', geocodeBoundsForCentroid(bias))

  const fullUrl = url.toString()
  const res = await fetch(fullUrl)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) {
    return { anchor: null, url: redactKey(fullUrl) }
  }

  // Prefer the candidate nearest the centroid (same-name town disambiguation).
  let best: GeocodedAnchor | null = null
  let bestD = Number.POSITIVE_INFINITY
  for (const result of data.results) {
    const loc = result.geometry.location
    const distance = haversineDistance({ lat: loc.lat, lng: loc.lng }, bias)
    if (distance < bestD) {
      bestD = distance
      best = {
        lat: loc.lat,
        lng: loc.lng,
        formatted: result.formatted_address,
        distanceFromCentroid: distance,
      }
    }
  }
  return { anchor: best, url: redactKey(fullUrl) }
}

async function routeBetween(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ encodedPolyline: string; distanceMeters: number }> {
  const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY
  if (!GOOGLE_KEY) throw new Error('GOOGLE_MAPS_API_KEY not set')

  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: {
      location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
    },
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

  return {
    encodedPolyline: data.routes[0].polyline.encodedPolyline,
    distanceMeters: data.routes[0].distanceMeters,
  }
}

// ---------------------------------------------------------------------------
// Persist mutation that stamps ANY lever provenance (not just ai_reconstructed)
// ---------------------------------------------------------------------------

export const persistLeverGeometry = internalMutation({
  args: {
    id: v.id('curated_routes'),
    routeId: v.string(),
    provenance: v.union(
      v.literal('scraped_promoted'),
      v.literal('name_routed'),
      v.literal('ai_reconstructed'),
    ),
    verification: v.object({
      routeId: v.string(),
      verdict: v.union(v.literal('pass'), v.literal('review')),
      failedCondition: v.optional(
        v.union(v.literal('ratio'), v.literal('anchors'), v.literal('degenerate')),
      ),
      provenance: v.optional(v.string()),
      geometry: v.optional(v.string()),
      geometryStatus: v.union(v.literal('generated'), v.literal('review')),
      anchorCount: v.number(),
      anchors: v.array(
        v.object({
          lat: v.number(),
          lng: v.number(),
          formatted: v.string(),
          distanceFromCentroid: v.number(),
        }),
      ),
      pointCount: v.number(),
      degenerate: v.boolean(),
      ratio: v.union(v.number(), v.null()),
      claimedMiles: v.union(v.number(), v.null()),
      routedMiles: v.number(),
    }),
  },
  handler: async (ctx, { id, routeId, provenance, verification }) => {
    const existing = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const geomDoc = {
      routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: verification.geometry,
      provenance: verification.geometryStatus === 'generated' ? provenance : undefined,
      verification: {
        ...verification,
        provenance:
          verification.geometryStatus === 'generated' ? provenance : verification.provenance,
      },
    }

    if (existing) {
      await ctx.db.replace(existing._id, geomDoc)
    } else {
      await ctx.db.insert('curated_route_geometry', geomDoc)
    }

    await ctx.db.patch(id, {
      geometryStatus: verification.geometryStatus,
      geometryProvenance: verification.geometryStatus === 'generated' ? provenance : undefined,
      riderReady: verification.geometryStatus === 'generated',
    })
  },
})

/** Mark a Lever-1 failure for the next lever without entering REVIEW. */
export const markNextLever = internalMutation({
  args: {
    id: v.id('curated_routes'),
    routeId: v.string(),
    nextLever: v.number(),
    failedCondition: v.optional(
      v.union(v.literal('ratio'), v.literal('anchors'), v.literal('degenerate')),
    ),
  },
  handler: async (ctx, { id, routeId, nextLever, failedCondition }) => {
    // Leave geometryStatus as unresolved (or clear a prior review) so Lever 2 can pick it up.
    // Do NOT set geometryStatus='review' — that is terminal for Lever 3 only.
    await ctx.db.patch(id, {
      geometryStatus: 'unresolved',
      // Keep geometryProvenance unset — no winning lever yet.
      geometryProvenance: undefined,
      riderReady: false,
    })
    // Delete any stale pass geometry so we don't leave a false pass around.
    const existing = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (existing?.verification?.verdict === 'pass') {
      await ctx.db.delete(existing._id)
    }
    return { nextLever, failedCondition: failedCondition ?? null }
  },
})

export const loadRouteForLever = internalQuery({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!doc) return null
    return {
      id: doc._id,
      routeId: doc.routeId,
      name: doc.name,
      state: doc.state,
      lengthMiles: doc.lengthMiles,
      centroidLat: doc.centroidLat,
      centroidLng: doc.centroidLng,
      routePolyline: doc.routePolyline ?? null,
      highwayNumber: doc.highwayNumber ?? null,
      geometryStatus: doc.geometryStatus ?? null,
      quarantine: doc.quarantine ?? null,
    }
  },
})

// ---------------------------------------------------------------------------
// AC-5: public deterministic parser surface (zero cost, no LLM, no network)
// ---------------------------------------------------------------------------

export const parseRouteNameStructure = query({
  args: { name: v.string() },
  handler: async (
    ctx,
    { name },
  ): Promise<{
    kind: 'ato_b' | 'highway' | null
    endpoints: [string, string] | null
    highwayNumber: string | null
    region: string | null
    usedLlm: false
    llmCallCount: number
  }> => {
    await requireIdentity(ctx)
    const parsed: ParseRouteNameResult = parseRouteName(name)
    if (!parsed) {
      return {
        kind: null,
        endpoints: null,
        highwayNumber: null,
        region: null,
        usedLlm: false,
        llmCallCount: 0,
      }
    }
    if (parsed.kind === 'highway') {
      return {
        kind: 'highway',
        endpoints: parsed.endpoints,
        highwayNumber: parsed.highwayNumber,
        region: parsed.region,
        usedLlm: false,
        llmCallCount: 0,
      }
    }
    return {
      kind: 'ato_b',
      endpoints: parsed.endpoints,
      highwayNumber: null,
      region: null,
      usedLlm: false,
      llmCallCount: 0,
    }
  },
})

// ---------------------------------------------------------------------------
// AC-6: geocode with region bias — returns redacted URL for evidence
// ---------------------------------------------------------------------------

export const geocodeWithRegionBias = action({
  args: {
    address: v.string(),
    centroidLat: v.number(),
    centroidLng: v.number(),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const bias = { lat: args.centroidLat, lng: args.centroidLng }
    const { anchor, url } = await geocodePlace(args.address, bias, args.state)
    const bounds = geocodeBoundsForCentroid(bias)
    return {
      geocodeUrl: url,
      bounds,
      boundsCenteredOn: bias,
      deltaDegrees: 1.2,
      result: anchor,
      containsBoundsParam: url.includes('bounds='),
    }
  },
})

// ---------------------------------------------------------------------------
// Lever 1 — promote in-row scraped polyline (scraped_promoted, $0)
// ---------------------------------------------------------------------------

export const promoteForRoute = action({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }): Promise<LeverResult> => {
    await requireIdentity(ctx)
    const route = await ctx.runQuery(internal.curatedGeometryReconstruct.loadRouteForLever, {
      routeId,
    })
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const claimedMiles = route.lengthMiles
    const centroid = { lat: route.centroidLat, lng: route.centroidLng }

    if (!route.routePolyline) {
      // No in-row line → skip to next lever (not REVIEW).
      await ctx.runMutation(internal.curatedGeometryReconstruct.markNextLever, {
        id: route.id,
        routeId,
        nextLever: 2,
        failedCondition: 'anchors',
      })
      return {
        routeId,
        disposition: 'next_lever',
        nextLever: 2,
        verdict: 'review',
        failedCondition: 'anchors',
        geometryStatus: 'unresolved',
        routedMiles: 0,
        claimedMiles,
        ratio: null,
        pointCount: 0,
        anchorCount: 0,
        anchors: [],
        queuedForLever2: true,
        queuedForReview: false,
        llmCallCount: 0,
      }
    }

    // Decode legacy in-row polyline — zero external calls.
    let points: Array<[number, number]>
    try {
      points = polyline.decode(route.routePolyline, 5) as Array<[number, number]>
    } catch {
      await ctx.runMutation(internal.curatedGeometryReconstruct.markNextLever, {
        id: route.id,
        routeId,
        nextLever: 2,
        failedCondition: 'degenerate',
      })
      return {
        routeId,
        disposition: 'next_lever',
        nextLever: 2,
        verdict: 'review',
        failedCondition: 'degenerate',
        geometryStatus: 'unresolved',
        routedMiles: 0,
        claimedMiles,
        ratio: null,
        pointCount: 0,
        anchorCount: 0,
        anchors: [],
        queuedForLever2: true,
        queuedForReview: false,
        llmCallCount: 0,
      }
    }

    const routedMiles = polylineLengthMiles(points)
    const anchors = anchorsFromPolyline(points, centroid)
    const ratio = claimedMiles != null && claimedMiles > 0 ? routedMiles / claimedMiles : null
    const roundedRatio = ratio == null ? null : Math.round(ratio * 100) / 100

    const gateResult = determineGateVerdict({
      ratio,
      pointCount: points.length,
      routedMiles,
      anchorCount: anchors.length,
      quarantine: route.quarantine != null,
    })

    if (gateResult.verdict !== 'pass') {
      // AC-2: Lever 1 failures go to next lever, NEVER the REVIEW queue.
      await ctx.runMutation(internal.curatedGeometryReconstruct.markNextLever, {
        id: route.id,
        routeId,
        nextLever: 2,
        failedCondition: gateResult.failedCondition,
      })
      return {
        routeId,
        disposition: 'next_lever',
        nextLever: 2,
        verdict: 'review',
        failedCondition: gateResult.failedCondition,
        geometryStatus: 'unresolved',
        routedMiles,
        claimedMiles,
        ratio: roundedRatio,
        pointCount: points.length,
        anchorCount: anchors.length,
        anchors,
        queuedForLever2: true,
        queuedForReview: false,
        llmCallCount: 0,
      }
    }

    // Gate pass → persist with scraped_promoted.
    const verification = {
      routeId,
      verdict: 'pass' as const,
      provenance: 'scraped_promoted',
      geometry: route.routePolyline,
      geometryStatus: 'generated' as const,
      anchorCount: anchors.length,
      anchors,
      pointCount: points.length,
      degenerate: isDegenerate({ pointCount: points.length, routedMiles }),
      ratio: roundedRatio,
      claimedMiles,
      routedMiles,
    }

    await ctx.runMutation(internal.curatedGeometryReconstruct.persistLeverGeometry, {
      id: route.id,
      routeId,
      provenance: 'scraped_promoted',
      verification,
    })

    return {
      routeId,
      disposition: 'generated',
      verdict: 'pass',
      provenance: 'scraped_promoted',
      geometryStatus: 'generated',
      routedMiles,
      claimedMiles,
      ratio: roundedRatio,
      pointCount: points.length,
      anchorCount: anchors.length,
      anchors,
      geometry: route.routePolyline,
      queuedForLever2: false,
      queuedForReview: false,
      llmCallCount: 0,
    }
  },
})

// ---------------------------------------------------------------------------
// Lever 3 — deterministic re-route (name_routed)
// ---------------------------------------------------------------------------

export const rerouteForRoute = action({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }): Promise<LeverResult> => {
    await requireIdentity(ctx)
    const route = await ctx.runQuery(internal.curatedGeometryReconstruct.loadRouteForLever, {
      routeId,
    })
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const claimedMiles = route.lengthMiles
    const centroid = { lat: route.centroidLat, lng: route.centroidLng }
    const geocodeUrls: string[] = []

    // Deterministic parse — zero LLM.
    let parsed = parseRouteName(route.name)
    // Fall back to highwayNumber field when the name alone has no structure.
    if (!parsed && route.highwayNumber) {
      parsed = {
        kind: 'highway',
        highwayNumber: route.highwayNumber,
        region: route.state,
        endpoints: [`Route ${route.highwayNumber}`, route.state],
        usedLlm: false,
      }
    }

    if (!parsed) {
      // No structure → REVIEW (Lever 3 is terminal).
      const verification = {
        routeId,
        verdict: 'review' as const,
        failedCondition: 'anchors' as const,
        geometryStatus: 'review' as const,
        anchorCount: 0,
        anchors: [] as GeocodedAnchor[],
        pointCount: 0,
        degenerate: true,
        ratio: null,
        claimedMiles,
        routedMiles: 0,
      }
      await ctx.runMutation(internal.curatedGeometryReconstruct.persistLeverGeometry, {
        id: route.id,
        routeId,
        provenance: 'name_routed',
        verification,
      })
      return {
        routeId,
        disposition: 'review',
        verdict: 'review',
        failedCondition: 'anchors',
        geometryStatus: 'review',
        routedMiles: 0,
        claimedMiles,
        ratio: null,
        pointCount: 0,
        anchorCount: 0,
        anchors: [],
        queuedForLever2: false,
        queuedForReview: true,
        geocodeUrls,
        llmCallCount: 0,
      }
    }

    // Geocode each endpoint with region bias (centroid ±1.2°).
    const geocoded: GeocodedAnchor[] = []
    for (const endpoint of parsed.endpoints) {
      const { anchor, url } = await geocodePlace(endpoint, centroid, route.state)
      geocodeUrls.push(url)
      if (!anchor) continue
      // 150mi region check — same gate input discipline as Lever 2.
      if (anchor.distanceFromCentroid > 150) continue
      geocoded.push(anchor)
    }

    if (geocoded.length < 2) {
      const verification = {
        routeId,
        verdict: 'review' as const,
        failedCondition: 'anchors' as const,
        geometryStatus: 'review' as const,
        anchorCount: geocoded.length,
        anchors: geocoded,
        pointCount: 0,
        degenerate: true,
        ratio: null,
        claimedMiles,
        routedMiles: 0,
      }
      await ctx.runMutation(internal.curatedGeometryReconstruct.persistLeverGeometry, {
        id: route.id,
        routeId,
        provenance: 'name_routed',
        verification,
      })
      return {
        routeId,
        disposition: 'review',
        verdict: 'review',
        failedCondition: 'anchors',
        geometryStatus: 'review',
        routedMiles: 0,
        claimedMiles,
        ratio: null,
        pointCount: 0,
        anchorCount: geocoded.length,
        anchors: geocoded,
        queuedForLever2: false,
        queuedForReview: true,
        geocodeUrls,
        llmCallCount: 0,
      }
    }

    // Route origin → destination via Google Routes.
    const origin = geocoded[0]
    const destination = geocoded[geocoded.length - 1]
    let routeResult: { encodedPolyline: string; distanceMeters: number }
    try {
      routeResult = await routeBetween(origin, destination)
    } catch {
      const verification = {
        routeId,
        verdict: 'review' as const,
        failedCondition: 'anchors' as const,
        geometryStatus: 'review' as const,
        anchorCount: geocoded.length,
        anchors: geocoded,
        pointCount: 0,
        degenerate: true,
        ratio: null,
        claimedMiles,
        routedMiles: 0,
      }
      await ctx.runMutation(internal.curatedGeometryReconstruct.persistLeverGeometry, {
        id: route.id,
        routeId,
        provenance: 'name_routed',
        verification,
      })
      return {
        routeId,
        disposition: 'review',
        verdict: 'review',
        failedCondition: 'anchors',
        geometryStatus: 'review',
        routedMiles: 0,
        claimedMiles,
        ratio: null,
        pointCount: 0,
        anchorCount: geocoded.length,
        anchors: geocoded,
        queuedForLever2: false,
        queuedForReview: true,
        geocodeUrls,
        llmCallCount: 0,
      }
    }

    const decodedPoints = polyline.decode(routeResult.encodedPolyline, 5) as Array<[number, number]>
    const routedMiles = routeResult.distanceMeters / 1609.34
    const ratio = claimedMiles != null && claimedMiles > 0 ? routedMiles / claimedMiles : null
    const roundedRatio = ratio == null ? null : Math.round(ratio * 100) / 100

    const gateResult = determineGateVerdict({
      ratio,
      pointCount: decodedPoints.length,
      routedMiles,
      anchorCount: geocoded.length,
      quarantine: route.quarantine != null,
    })

    if (gateResult.verdict !== 'pass') {
      // AC-4: Lever 3 failures go to REVIEW (terminal) — never next lever.
      const verification = {
        routeId,
        verdict: 'review' as const,
        failedCondition: gateResult.failedCondition,
        geometry: routeResult.encodedPolyline,
        geometryStatus: 'review' as const,
        anchorCount: geocoded.length,
        anchors: geocoded,
        pointCount: decodedPoints.length,
        degenerate: isDegenerate({
          pointCount: decodedPoints.length,
          routedMiles,
        }),
        ratio: roundedRatio,
        claimedMiles,
        routedMiles,
      }
      await ctx.runMutation(internal.curatedGeometryReconstruct.persistLeverGeometry, {
        id: route.id,
        routeId,
        provenance: 'name_routed',
        verification,
      })
      return {
        routeId,
        disposition: 'review',
        verdict: 'review',
        failedCondition: gateResult.failedCondition,
        geometryStatus: 'review',
        routedMiles,
        claimedMiles,
        ratio: roundedRatio,
        pointCount: decodedPoints.length,
        anchorCount: geocoded.length,
        anchors: geocoded,
        geometry: routeResult.encodedPolyline,
        queuedForLever2: false,
        queuedForReview: true,
        geocodeUrls,
        llmCallCount: 0,
      }
    }

    // Gate pass → persist with name_routed.
    const verification = {
      routeId,
      verdict: 'pass' as const,
      provenance: 'name_routed',
      geometry: routeResult.encodedPolyline,
      geometryStatus: 'generated' as const,
      anchorCount: geocoded.length,
      anchors: geocoded,
      pointCount: decodedPoints.length,
      degenerate: isDegenerate({
        pointCount: decodedPoints.length,
        routedMiles,
      }),
      ratio: roundedRatio,
      claimedMiles,
      routedMiles,
    }

    await ctx.runMutation(internal.curatedGeometryReconstruct.persistLeverGeometry, {
      id: route.id,
      routeId,
      provenance: 'name_routed',
      verification,
    })

    return {
      routeId,
      disposition: 'generated',
      verdict: 'pass',
      provenance: 'name_routed',
      geometryStatus: 'generated',
      routedMiles,
      claimedMiles,
      ratio: roundedRatio,
      pointCount: decodedPoints.length,
      anchorCount: geocoded.length,
      anchors: geocoded,
      geometry: routeResult.encodedPolyline,
      queuedForLever2: false,
      queuedForReview: false,
      geocodeUrls,
      llmCallCount: 0,
    }
  },
})

// ---------------------------------------------------------------------------
// REVIEW queue (status-field pattern — geometryStatus='review', no separate table)
// ---------------------------------------------------------------------------

export const listGeometryReviewQueue = query({
  args: {
    limit: v.optional(v.number()),
    routeIdPrefix: v.optional(v.string()),
  },
  handler: async (ctx, { limit, routeIdPrefix }) => {
    await requireIdentity(ctx)
    const take = Math.min(limit ?? 50, 200)

    // Prefer the by_geometry_status index when available.
    let rows = await ctx.db
      .query('curated_routes')
      .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', 'review'))
      .take(take * 3)

    if (routeIdPrefix) {
      rows = rows.filter((r) => r.routeId.startsWith(routeIdPrefix))
    }

    const reviewQueue = []
    for (const row of rows.slice(0, take)) {
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
        .first()
      reviewQueue.push({
        routeId: row.routeId,
        name: row.name,
        geometryStatus: row.geometryStatus,
        failedCondition: geom?.verification?.failedCondition ?? null,
        verdict: geom?.verification?.verdict ?? null,
        ratio: geom?.verification?.ratio ?? null,
        routedMiles: geom?.verification?.routedMiles ?? null,
        claimedMiles: geom?.verification?.claimedMiles ?? null,
      })
    }
    return { reviewQueue, length: reviewQueue.length }
  },
})

// ---------------------------------------------------------------------------
// Test seed helpers for S4-T2 fixtures (public_api seed_method)
// ---------------------------------------------------------------------------

const POLY_41MI =
  'oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@sq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@sq@k~@uq@'

const POLY_200MI =
  'oditE~o~}UoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCwyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCwyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCwyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCwyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCwyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCwyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCwyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyBoxCyyBoxCyyBoxCyyBoxCyyBoxCyyBqxCyyB'

async function upsertLeverTestRoute(
  ctx: any,
  row: {
    routeId: string
    name: string
    lengthMiles: number
    routePolyline?: string
    centroidLat?: number
    centroidLng?: number
    state?: string
    highwayNumber?: string
    geometryStatus?: 'generated' | 'unresolved' | 'failed' | 'review'
  },
) {
  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
    .first()

  const centroidLat = row.centroidLat ?? 34.95
  const centroidLng = row.centroidLng ?? -120.42
  const nowMs = Date.now()
  const base = {
    name: row.name,
    lengthMiles: row.lengthMiles,
    centroidLat,
    centroidLng,
    boundsNeLat: centroidLat + 0.3,
    boundsNeLng: centroidLng + 0.3,
    boundsSwLat: centroidLat - 0.3,
    boundsSwLng: centroidLng - 0.3,
    location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
    compositeScore: 85,
    curvatureScore: 90,
    scenicScore: 80,
    technicalScore: 85,
    trafficScore: 75,
    remotenessScore: 70,
    routePolyline: row.routePolyline,
    geometryStatus: row.geometryStatus ?? 'unresolved',
    geometryProvenance: undefined,
    riderReady: false,
    state: row.state ?? 'California',
    ...(row.highwayNumber != null ? { highwayNumber: row.highwayNumber } : {}),
    retiredAt: undefined,
    duplicateOf: undefined,
    quarantine: undefined,
  }

  if (existing) {
    // Clear any prior geometry side-table row so tests start clean.
    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
      .first()
    if (geom) await ctx.db.delete(geom._id)

    await ctx.db.patch(existing._id, base)
    await geospatial.insert(
      ctx,
      existing._id,
      { latitude: centroidLat, longitude: centroidLng },
      { state: row.state ?? 'California', primaryArchetype: 'twisties' },
      85,
    )
    return { routeId: row.routeId, id: existing._id, created: false }
  }

  const docId = await ctx.db.insert('curated_routes', {
    routeId: row.routeId,
    source: 'editorial',
    primaryArchetype: 'twisties',
    secondaryTags: ['test'],
    oneLiner: 'S4-T2 lever test route',
    summary: 'S4-T2 lever test route summary',
    badges: [],
    season: 'year_round',
    contentVersion: 1,
    seededAt: nowMs,
    rideWorthiness: {
      verdict: 'ride' as const,
      reason: 's4t2 seed',
      model: 'test',
      classifiedAt: nowMs,
    },
    ...base,
  })

  await geospatial.insert(
    ctx,
    docId,
    { latitude: centroidLat, longitude: centroidLng },
    { state: row.state ?? 'California', primaryArchetype: 'twisties' },
    85,
  )

  return { routeId: row.routeId, id: docId, created: true }
}

export const seedLever1Fixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return {
      pass: await upsertLeverTestRoute(ctx, {
        routeId: 'test:lever1-pass',
        name: 'Lever 1 Passing',
        routePolyline: POLY_41MI,
        lengthMiles: 41,
        geometryStatus: 'unresolved',
      }),
      fail: await upsertLeverTestRoute(ctx, {
        routeId: 'test:lever1-fail',
        name: 'Lever 1 Failing',
        routePolyline: POLY_200MI,
        lengthMiles: 100, // ratio ≈ 2.0 → gate fail
        geometryStatus: 'unresolved',
      }),
    }
  },
})

export const seedLever3Fixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return {
      hwy: await upsertLeverTestRoute(ctx, {
        routeId: 'test:lever3-hwy',
        name: 'Route 680 — Alameda County',
        // Claimed length near a real I-680 segment through Alameda County so the
        // gate ratio lands in-band after Google Routes (~40–50 mi south↔north).
        lengthMiles: 45,
        centroidLat: 37.7,
        centroidLng: -122.0,
        state: 'California',
        highwayNumber: '680',
        geometryStatus: 'unresolved',
      }),
      atoB: await upsertLeverTestRoute(ctx, {
        routeId: 'test:lever3-ato-b',
        name: 'San Francisco to Santa Cruz — Coastal Run',
        lengthMiles: 75,
        // Claimed length near the real SF→Santa Cruz driving distance (~74 mi)
        // so the gate ratio lands in-band on a real Google Routes result.
        centroidLat: 37.5,
        centroidLng: -122.0,
        state: 'California',
        geometryStatus: 'unresolved',
      }),
      fail: await upsertLeverTestRoute(ctx, {
        routeId: 'test:lever3-fail',
        // Parseable A-to-B that geocodes, but claimed length of 10 mi will fail the
        // ratio gate against the real multi-hour drive between the endpoints.
        name: 'San Francisco to Los Angeles — Long Route Short Name',
        lengthMiles: 10,
        centroidLat: 35.5,
        centroidLng: -119.5,
        state: 'California',
        geometryStatus: 'unresolved',
      }),
    }
  },
})

export const teardownLeverTestRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const ids = [
      'test:lever1-pass',
      'test:lever1-fail',
      'test:lever3-hwy',
      'test:lever3-ato-b',
      'test:lever3-fail',
    ]
    const removed: string[] = []
    for (const routeId of ids) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (!doc) continue
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (geom) await ctx.db.delete(geom._id)
      try {
        await geospatial.remove(ctx, doc._id)
      } catch {
        // index may not have the point
      }
      await ctx.db.delete(doc._id)
      removed.push(routeId)
    }
    return { removed }
  },
})
