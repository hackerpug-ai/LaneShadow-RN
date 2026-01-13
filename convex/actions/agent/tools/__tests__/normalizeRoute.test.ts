import type { PlanInput } from '../../../../../models/saved-routes'
import type { ProviderRouteResponse } from '../../providers/routingProvider'
import { normalizeRoute } from '../normalizeRoute'

describe('normalizeRoute', () => {
  const planInput: PlanInput = {
    start: { lat: 37.0, lng: -122.0, label: 'Start', placeId: 'start-place' },
    end: { lat: 37.5, lng: -122.5, label: 'End', placeId: 'end-place' },
    departureTime: Date.now(),
    preferences: { scenicBias: 'default' },
  }

  const providerRoute: ProviderRouteResponse = {
    provider: 'mock-routing',
    bounds: { north: 38, south: 36, east: -121, west: -123 },
    overviewGeometry: {
      format: 'polyline',
      encoding: 'mock_polyline',
      precision: 5,
      value: 'encoded_overview',
    },
    legs: [
      {
        legIndex: 0,
        start: { lat: 37.0, lng: -122.0 },
        end: { lat: 37.5, lng: -122.5 },
        distanceMeters: 10_000,
        durationSeconds: 1200,
        geometry: {
          format: 'polyline',
          encoding: 'mock_polyline',
          precision: 5,
          value: 'encoded_leg',
        },
      },
    ],
  }

  it('produces a RouteSnapshot aligned to the validator shape', async () => {
    const snapshot = await normalizeRoute({ providerRoute, planInput })

    expect(snapshot.provider).toBe(providerRoute.provider)
    expect(snapshot.bounds).toEqual(providerRoute.bounds)
    expect(snapshot.origin.lat).toBe(planInput.start.lat)
    expect(snapshot.destination.lng).toBe(planInput.end.lng)
    expect(snapshot.waypoints).toEqual([])
    expect(snapshot.overviewGeometry).toEqual(providerRoute.overviewGeometry)

    expect(snapshot.legs).toHaveLength(1)
    expect(snapshot.legs[0].legIndex).toBe(0)
    expect(snapshot.legs[0].distanceMeters).toBe(providerRoute.legs[0].distanceMeters)
    expect(snapshot.legs[0].geometry.value).toBe(providerRoute.legs[0].geometry.value)

    expect(snapshot.annotations).toEqual([])
    expect(snapshot.overlays).toEqual({})
  })
})
