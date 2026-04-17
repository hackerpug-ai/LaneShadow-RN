'use node'
import type {
  RouteSketch,
  RouteSketchAnchorPoint,
  RouteSketchSegment,
} from '../../../../models/route-sketch'
import type { PlanInput } from '../../../../models/saved-routes'
import { GOOGLE_MAPS_API_KEY } from '../../../lib/env'
import { haversineKm } from '../lib/geo'
import { createGeocodingProvider } from './geocodingProvider'

export type ProviderLatLng = { lat: number; lng: number }

export type ProviderPolylineGeometry = {
  format: 'polyline'
  encoding: string
  precision: number
  value: string
}

export type ProviderStep = {
  stepIndex: number
  distanceMeters: number
  durationSeconds: number
  instruction: string
  startLocation: ProviderLatLng
  endLocation: ProviderLatLng
}

export type ProviderLeg = {
  legIndex: number
  start: ProviderLatLng
  end: ProviderLatLng
  distanceMeters: number
  durationSeconds: number
  geometry: ProviderPolylineGeometry
  steps?: ProviderStep[]
}

export type ProviderRouteResponse = {
  provider: string
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  overviewGeometry: ProviderPolylineGeometry
  legs: ProviderLeg[]
}

export type RoutingProvider = {
  routeFromSketch: (input: {
    planInput: PlanInput
    sketch: RouteSketch
  }) => Promise<ProviderRouteResponse>
  routeWithAlternatives: (input: {
    planInput: PlanInput
    sketch: RouteSketch
  }) => Promise<ProviderRouteResponse[]>
  routeSegment: (input: {
    segment: RouteSketchSegment
    anchorPoints: RouteSketchAnchorPoint[]
    locationBias?: { lat: number; lng: number }
  }) => Promise<ProviderRouteResponse>
  routeDetour: (input: {
    origin: ProviderLatLng
    destination: ProviderLatLng
    waypoint: ProviderLatLng
  }) => Promise<ProviderRouteResponse>
}

const parseGoogleDurationSeconds = (duration: unknown): number => {
  // Google Routes API returns duration as a string like "123s"
  if (typeof duration !== 'string') return 0
  const match = duration.match(/^(\d+)s$/)
  return match ? Number(match[1]) : 0
}

const toGoogleWaypoint = (lat: number, lng: number) => ({
  location: {
    latLng: { latitude: lat, longitude: lng },
  },
})

const parseGoogleRoute = (route: any): ProviderRouteResponse => {
  const encodedOverview: string | undefined = route?.polyline?.encodedPolyline
  if (!encodedOverview) {
    throw new Error('Google Routes response missing overview polyline')
  }

  const viewport = route?.viewport
  const lo = viewport?.low
  const hi = viewport?.high
  if (!lo?.latitude || !lo?.longitude || !hi?.latitude || !hi?.longitude) {
    throw new Error('Google Routes response missing viewport')
  }

  const legsRaw: any[] = Array.isArray(route?.legs) ? route.legs : []
  if (!legsRaw.length) {
    throw new Error('Google Routes response missing legs')
  }

  const legs: ProviderLeg[] = legsRaw.map((leg: any, idx: number) => {
    const startLatLng = leg?.startLocation?.latLng
    const endLatLng = leg?.endLocation?.latLng
    const legPolyline: string | undefined = leg?.polyline?.encodedPolyline
    if (!startLatLng || !endLatLng || !legPolyline) {
      throw new Error('Google Routes response leg missing start/end/polyline')
    }

    // Parse steps for turn-by-turn directions
    const stepsRaw: any[] = Array.isArray(leg?.steps) ? leg.steps : []
    const steps: ProviderStep[] = stepsRaw.map((step: any, stepIdx: number) => {
      const stepStartLatLng = step?.startLocation?.latLng
      const stepEndLatLng = step?.endLocation?.latLng
      const instruction = step?.navigationInstruction?.instructions ?? ''

      return {
        stepIndex: stepIdx,
        distanceMeters: Number(step?.distanceMeters ?? 0),
        durationSeconds: parseGoogleDurationSeconds(step?.staticDuration ?? step?.duration),
        instruction,
        startLocation: {
          lat: stepStartLatLng?.latitude ?? startLatLng.latitude,
          lng: stepStartLatLng?.longitude ?? startLatLng.longitude,
        },
        endLocation: {
          lat: stepEndLatLng?.latitude ?? endLatLng.latitude,
          lng: stepEndLatLng?.longitude ?? endLatLng.longitude,
        },
      }
    })

    return {
      legIndex: idx,
      start: { lat: startLatLng.latitude, lng: startLatLng.longitude },
      end: { lat: endLatLng.latitude, lng: endLatLng.longitude },
      distanceMeters: Number(leg?.distanceMeters ?? 0),
      durationSeconds: parseGoogleDurationSeconds(leg?.duration),
      geometry: {
        format: 'polyline',
        encoding: 'google_encoded_polyline',
        precision: 5,
        value: legPolyline,
      },
      steps: steps.length > 0 ? steps : undefined,
    }
  })

  return {
    provider: 'google',
    bounds: {
      north: Math.max(lo.latitude, hi.latitude),
      south: Math.min(lo.latitude, hi.latitude),
      east: Math.max(lo.longitude, hi.longitude),
      west: Math.min(lo.longitude, hi.longitude),
    },
    overviewGeometry: {
      format: 'polyline',
      encoding: 'google_encoded_polyline',
      precision: 5,
      value: encodedOverview,
    },
    legs,
  }
}

const MAX_VIA_WAYPOINTS_PER_SEGMENT = 3

export type ResolvedWaypoint = { lat: number; lng: number }

/**
 * Resolve segment viaNames to anchorPoint coordinates.
 * - Case-insensitive, whitespace-trimmed name matching.
 * - Max 3 intermediates per segment; excess names are skipped with a warning.
 * - Unresolvable names are skipped with a warning.
 */
export const resolveViaWaypoints = (
  viaNames: string[],
  anchorPoints: RouteSketch['anchorPoints'],
): ResolvedWaypoint[] => {
  if (viaNames.length === 0) return []

  if (viaNames.length > MAX_VIA_WAYPOINTS_PER_SEGMENT) {
    const _excess = viaNames.slice(MAX_VIA_WAYPOINTS_PER_SEGMENT)
  }

  const capped = viaNames.slice(0, MAX_VIA_WAYPOINTS_PER_SEGMENT)

  return capped.reduce<ResolvedWaypoint[]>((acc, name) => {
    const normalised = name.trim().toLowerCase()
    const anchor = anchorPoints.find(
      (a) =>
        a.name.trim().toLowerCase() === normalised && a.lat !== undefined && a.lng !== undefined,
    )
    if (!anchor) {
      return acc
    }
    acc.push({ lat: anchor.lat as number, lng: anchor.lng as number })
    return acc
  }, [])
}

/**
 * Collect all viaNames from sketch segments in order, resolve them to
 * anchorPoint coordinates, and return as Google waypoints.
 */
const resolveSketchIntermediates = (sketch: RouteSketch) => {
  const allViaNames = sketch.segments.flatMap((s) => s.viaNames ?? [])
  const resolved = resolveViaWaypoints(allViaNames, sketch.anchorPoints)
  return resolved.map((w) => toGoogleWaypoint(w.lat, w.lng))
}

const buildGoogleRequestBody = (
  planInput: PlanInput,
  sketch: RouteSketch,
  options?: { computeAlternativeRoutes?: boolean },
) => {
  const origin = toGoogleWaypoint(planInput.start.lat, planInput.start.lng)
  const destination = toGoogleWaypoint(planInput.end.lat, planInput.end.lng)
  const intermediates = resolveSketchIntermediates(sketch)

  const routeModifiers: Record<string, boolean> = {}
  if (planInput.preferences?.avoidHighways) routeModifiers.avoidHighways = true
  if (planInput.preferences?.avoidTolls) routeModifiers.avoidTolls = true

  return {
    origin,
    destination,
    intermediates,
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_UNAWARE',
    polylineQuality: 'OVERVIEW',
    polylineEncoding: 'ENCODED_POLYLINE',
    ...(Object.keys(routeModifiers).length > 0 ? { routeModifiers } : {}),
    // Alternative routes only work without intermediates
    ...(options?.computeAlternativeRoutes && intermediates.length === 0
      ? { computeAlternativeRoutes: true }
      : {}),
  }
}

const fetchGoogleRoutes = async (apiKey: string, body: any): Promise<any> => {
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'routes.distanceMeters,routes.duration,routes.viewport,routes.polyline.encodedPolyline,' +
        'routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline,' +
        'routes.legs.startLocation.latLng,routes.legs.endLocation.latLng,' +
        'routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.startLocation.latLng,routes.legs.steps.endLocation.latLng',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Google Routes request failed: ${response.status} ${text}`)
  }

  return response.json()
}

const findAnchorPoint = (
  anchorPoints: RouteSketchAnchorPoint[],
  name: string,
): RouteSketchAnchorPoint | undefined => {
  const normalized = name.trim().toLowerCase()
  return anchorPoints.find((a) => a.name.trim().toLowerCase() === normalized)
}

const createGoogleProvider = (apiKey: string): RoutingProvider => ({
  routeFromSketch: async ({ planInput, sketch }): Promise<ProviderRouteResponse> => {
    const body = buildGoogleRequestBody(planInput, sketch)
    const data: any = await fetchGoogleRoutes(apiKey, body)
    const route = data?.routes?.[0]
    if (!route) {
      throw new Error('Google Routes response missing routes[0]')
    }
    return parseGoogleRoute(route)
  },

  routeWithAlternatives: async ({ planInput, sketch }): Promise<ProviderRouteResponse[]> => {
    const body = buildGoogleRequestBody(planInput, sketch, { computeAlternativeRoutes: true })
    const data: any = await fetchGoogleRoutes(apiKey, body)
    const routes: any[] = data?.routes ?? []
    if (!routes.length) {
      throw new Error('Google Routes response missing routes')
    }

    return routes.map(parseGoogleRoute)
  },

  routeSegment: async ({ segment, anchorPoints, locationBias }): Promise<ProviderRouteResponse> => {
    // Resolve from/to coordinates: check anchors first, fall back to geocoding
    // locationBias anchors geocode results near the rider's area (prevents
    // "Highway 35" resolving to Texas instead of San Mateo County)
    const resolveCoords = async (name: string): Promise<{ lat: number; lng: number }> => {
      const anchor = findAnchorPoint(anchorPoints, name)
      if (anchor?.lat !== undefined && anchor?.lng !== undefined) {
        return { lat: anchor.lat, lng: anchor.lng }
      }

      const geocoder = createGeocodingProvider()
      const results = await geocoder.geocode(name, locationBias)
      if (results.length === 0) {
        throw new Error(
          `Could not geocode "${name}". Try being more specific: include city/state (e.g., "${name}, CA"), ` +
            `use nearby landmarks, or provide coordinates directly.`,
        )
      }
      const coords = { lat: results[0].lat, lng: results[0].lng }

      // Distance fence: reject results that are too far from location bias
      // Increased to 500km to accommodate regional routes (SF to Tahoe, etc.)
      if (locationBias) {
        const distKm = haversineKm(coords, locationBias)
        if (distKm > 500) {
          throw new Error(
            `Geocoded "${name}" to ${results[0].label} which is ${Math.round(distKm)}km away — likely wrong location`,
          )
        }
      }

      return coords
    }

    const [from, to] = await Promise.all([
      resolveCoords(segment.fromName),
      resolveCoords(segment.toName),
    ])

    // Build intermediates from viaNames if present
    const intermediates: { location: { latLng: { latitude: number; longitude: number } } }[] = []
    if (segment.viaNames && segment.viaNames.length > 0) {
      for (const via of segment.viaNames) {
        try {
          const coords = await resolveCoords(via)
          intermediates.push({
            location: { latLng: { latitude: coords.lat, longitude: coords.lng } },
          })
        } catch {}
      }
    }

    const body = {
      origin: toGoogleWaypoint(from.lat, from.lng),
      destination: toGoogleWaypoint(to.lat, to.lng),
      intermediates,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      polylineQuality: 'OVERVIEW',
      polylineEncoding: 'ENCODED_POLYLINE',
    }

    const data: any = await fetchGoogleRoutes(apiKey, body)
    const route = data?.routes?.[0]
    if (!route) {
      throw new Error('Google Routes response missing routes[0]')
    }
    return parseGoogleRoute(route)
  },
  routeDetour: async ({ origin, destination, waypoint }): Promise<ProviderRouteResponse> => {
    const body = {
      origin: toGoogleWaypoint(origin.lat, origin.lng),
      destination: toGoogleWaypoint(destination.lat, destination.lng),
      intermediates: [toGoogleWaypoint(waypoint.lat, waypoint.lng)],
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      polylineQuality: 'OVERVIEW',
      polylineEncoding: 'ENCODED_POLYLINE',
    }

    const data: any = await fetchGoogleRoutes(apiKey, body)
    const route = data?.routes?.[0]
    if (!route) {
      throw new Error('Google Routes response missing routes[0]')
    }
    return parseGoogleRoute(route)
  },
})

export const createRoutingProvider = (): RoutingProvider => {
  // Sprint 3 scope: Google only. If we add providers later, do so behind this factory
  // without exposing configuration knobs at call sites.
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
  }
  return createGoogleProvider(GOOGLE_MAPS_API_KEY)
}
