'use node'
import type { RouteSketch } from '../../../../models/route-sketch'
import type { PlanInput } from '../../../../models/saved-routes'
import { GOOGLE_MAPS_API_KEY } from '../../../lib/env'

export type ProviderLatLng = { lat: number; lng: number }

export type ProviderPolylineGeometry = {
  format: 'polyline'
  encoding: string
  precision: number
  value: string
}

export type ProviderLeg = {
  legIndex: number
  start: ProviderLatLng
  end: ProviderLatLng
  distanceMeters: number
  durationSeconds: number
  geometry: ProviderPolylineGeometry
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

const buildGoogleRequestBody = (
  planInput: PlanInput,
  sketch: RouteSketch,
  options?: { computeAlternativeRoutes?: boolean }
) => {
  const origin = toGoogleWaypoint(planInput.start.lat, planInput.start.lng)
  const destination = toGoogleWaypoint(planInput.end.lat, planInput.end.lng)
  const intermediates = sketch.anchorPoints
    .filter((a) => a.lat !== undefined && a.lng !== undefined)
    .map((a) => toGoogleWaypoint(a.lat as number, a.lng as number))

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
        'routes.distanceMeters,routes.duration,routes.viewport,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline,routes.legs.startLocation.latLng,routes.legs.endLocation.latLng',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Google Routes request failed: ${response.status} ${text}`)
  }

  return response.json()
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
    console.info(`[routingProvider] Google returned ${routes.length} alternative routes`)
    return routes.map(parseGoogleRoute)
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
