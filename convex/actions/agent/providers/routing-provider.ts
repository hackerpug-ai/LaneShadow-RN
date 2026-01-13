import type { RouteSketch } from '../../../../models/route-sketch'
import type { PlanInput } from '../../../../models/saved-routes'
import {
  GOOGLE_MAPS_API_KEY,
  ROUTING_PROVIDER_API_KEY,
  ROUTING_PROVIDER_NAME,
} from '../../../lib/env'

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
  legs: Array<ProviderLeg>
}

export type RoutingProvider = {
  routeFromSketch: (input: {
    planInput: PlanInput
    sketch: RouteSketch
  }) => Promise<ProviderRouteResponse>
}

export type RoutingProviderConfig = {
  providerName?: string
  apiKey?: string
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

const createGoogleProvider = (apiKey: string): RoutingProvider => ({
  routeFromSketch: async ({ planInput, sketch }): Promise<ProviderRouteResponse> => {
    const origin = toGoogleWaypoint(planInput.start.lat, planInput.start.lng)
    const destination = toGoogleWaypoint(planInput.end.lat, planInput.end.lng)

    const intermediates = sketch.anchorPoints
      .filter((a) => a.lat !== undefined && a.lng !== undefined)
      .map((a) => toGoogleWaypoint(a.lat as number, a.lng as number))

    const body = {
      origin,
      destination,
      intermediates,
      travelMode: 'DRIVE',
      polylineQuality: 'OVERVIEW',
      polylineEncoding: 'ENCODED_POLYLINE',
      // Keep results deterministic-ish (no traffic). Google only allows routingPreference for DRIVE.
      routingPreference: 'TRAFFIC_UNAWARE',
    }

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Keep payload small but include everything we need to normalize into our provider-agnostic shape.
        'X-Goog-FieldMask':
          'routes.distanceMeters,routes.duration,routes.viewport,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline,routes.legs.startLocation.latLng,routes.legs.endLocation.latLng',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Google Routes request failed: ${response.status} ${text}`)
    }

    const data: any = await response.json()
    const route = data?.routes?.[0]
    if (!route) {
      throw new Error('Google Routes response missing routes[0]')
    }

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

    const legsRaw: Array<any> = Array.isArray(route?.legs) ? route.legs : []
    if (!legsRaw.length) {
      throw new Error('Google Routes response missing legs')
    }

    const legs: Array<ProviderLeg> = legsRaw.map((leg: any, idx: number) => {
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
  },
})

const clampBounds = (points: Array<ProviderLatLng>) => {
  const north = Math.max(...points.map((p) => p.lat))
  const south = Math.min(...points.map((p) => p.lat))
  const east = Math.max(...points.map((p) => p.lng))
  const west = Math.min(...points.map((p) => p.lng))
  return { north, south, east, west }
}

const createMockGeometry = (
  start: ProviderLatLng,
  end: ProviderLatLng
): ProviderPolylineGeometry => {
  // Deterministic, placeholder polyline (not geospatially accurate, but stable)
  return {
    format: 'polyline',
    encoding: 'mock_polyline',
    precision: 5,
    value: `${start.lat.toFixed(3)},${start.lng.toFixed(3)};${end.lat.toFixed(3)},${end.lng.toFixed(3)}`,
  }
}

const createMockProvider = (providerName: string): RoutingProvider => ({
  routeFromSketch: async ({ planInput }): Promise<ProviderRouteResponse> => {
    const start = { lat: planInput.start.lat, lng: planInput.start.lng }
    const end = { lat: planInput.end.lat, lng: planInput.end.lng }
    const geometry = createMockGeometry(start, end)

    const leg: ProviderLeg = {
      legIndex: 0,
      start,
      end,
      distanceMeters: 50_000,
      durationSeconds: 3_600,
      geometry,
    }

    return {
      provider: providerName,
      bounds: clampBounds([start, end]),
      overviewGeometry: geometry,
      legs: [leg],
    }
  },
})

export const createRoutingProvider = (config?: RoutingProviderConfig): RoutingProvider => {
  const name = config?.providerName ?? ROUTING_PROVIDER_NAME ?? 'mock-routing'
  const apiKey = config?.apiKey ?? ROUTING_PROVIDER_API_KEY

  if (name === 'google') {
    const googleKey = apiKey ?? GOOGLE_MAPS_API_KEY
    if (!googleKey) {
      throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
    }
    return createGoogleProvider(googleKey)
  }

  // Default: deterministic mock provider. Add other providers here later.
  return createMockProvider(name)
}
