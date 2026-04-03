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
  legs: Array<ProviderLeg>
}

export type RoutingProvider = {
  routeFromSketch: (input: {
    planInput: PlanInput
    sketch: RouteSketch
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

const createGoogleProvider = (apiKey: string): RoutingProvider => ({
  routeFromSketch: async ({ planInput, sketch }): Promise<ProviderRouteResponse> => {
    const origin = toGoogleWaypoint(planInput.start.lat, planInput.start.lng)
    const destination = toGoogleWaypoint(planInput.end.lat, planInput.end.lng)

    const intermediates = sketch.anchorPoints
      .filter((a) => a.lat !== undefined && a.lng !== undefined)
      .map((a) => toGoogleWaypoint(a.lat as number, a.lng as number))

    // Build routeModifiers from preferences
    const routeModifiers: Record<string, boolean> = {}
    if (planInput.preferences?.avoidHighways) routeModifiers.avoidHighways = true
    if (planInput.preferences?.avoidTolls) routeModifiers.avoidTolls = true

    // Beta: motorcycle routing. Falls back to DRIVE if rejected.
    const fetchRoute = async (travelMode: 'TWO_WHEELER' | 'DRIVE'): Promise<any> => {
      const body = {
        origin,
        destination,
        intermediates,
        travelMode,
        polylineQuality: 'OVERVIEW',
        polylineEncoding: 'ENCODED_POLYLINE',
        // routingPreference only valid for DRIVE mode per Google Routes API
        ...(travelMode === 'DRIVE' ? { routingPreference: 'TRAFFIC_UNAWARE' } : {}),
        ...(Object.keys(routeModifiers).length > 0 ? { routeModifiers } : {}),
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
        if (travelMode === 'TWO_WHEELER') {
          console.warn(`[routingProvider] TWO_WHEELER rejected (${response.status}), falling back to DRIVE`)
          return fetchRoute('DRIVE')
        }
        const text = await response.text().catch(() => '')
        throw new Error(`Google Routes request failed: ${response.status} ${text}`)
      }

      return response.json()
    }

    const data: any = await fetchRoute('TWO_WHEELER')
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

export const createRoutingProvider = (): RoutingProvider => {
  // Sprint 3 scope: Google only. If we add providers later, do so behind this factory
  // without exposing configuration knobs at call sites.
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
  }
  return createGoogleProvider(GOOGLE_MAPS_API_KEY)
}
