import { afterEach, describe, expect, it, vi } from 'vitest'
import { encodePolyline } from '../../lib/geo'
import type { ProviderPolylineGeometry } from '../routingProvider'
import { calculateDeviation, findNearestPointOnPolyline } from '../waypointService'

vi.mock('../../../../lib/env', () => ({ GOOGLE_MAPS_API_KEY: 'test-api-key' }))
describe('waypointService - findNearestPointOnPolyline', () => {
  const straightLinePolyline = (): ProviderPolylineGeometry => ({
    format: 'polyline',
    encoding: 'google_encoded_polyline',
    precision: 5,
    value: encodePolyline([
      { lat: 37.0, lng: -122.0 },
      { lat: 37.1, lng: -122.0 },
      { lat: 37.2, lng: -122.0 },
      { lat: 37.3, lng: -122.0 },
    ]),
  })
  it('AC-1: finds nearest point on polyline to waypoint', () => {
    const waypoint = { lat: 37.15, lng: -121.9, name: 'Off-route waypoint' }
    const result = findNearestPointOnPolyline(waypoint, straightLinePolyline())
    expect(result.point).toBeDefined()
    expect(result.point.lng).toBeCloseTo(-122.0, 1)
    expect(result.distanceMeters).toBeGreaterThan(0)
    expect(result.distanceMeters).toBeLessThan(20_000)
  })
  it('AC-1: returns zero distance when waypoint is exactly on the polyline', () => {
    const waypoint = { lat: 37.2, lng: -122.0, name: 'On-route waypoint' }
    const result = findNearestPointOnPolyline(waypoint, straightLinePolyline())
    expect(result.distanceMeters).toBeLessThan(10)
    expect(result.point.lat).toBeCloseTo(37.2, 1)
    expect(result.point.lng).toBeCloseTo(-122.0, 1)
  })
  it('AC-1: handles waypoint far from polyline', () => {
    const waypoint = { lat: 38.0, lng: -121.0, name: 'Far waypoint' }
    const result = findNearestPointOnPolyline(waypoint, straightLinePolyline())
    expect(result.distanceMeters).toBeGreaterThan(100_000)
    expect(result.point).toBeDefined()
  })
  it('AC-1: handles empty polyline', () => {
    const emptyPolyline: ProviderPolylineGeometry = {
      format: 'polyline',
      encoding: 'google_encoded_polyline',
      precision: 5,
      value: '',
    }
    const waypoint = { lat: 37.0, lng: -122.0, name: 'Test waypoint' }
    expect(() => findNearestPointOnPolyline(waypoint, emptyPolyline)).toThrow()
  })
  it('AC-1: handles single-point polyline', () => {
    const singlePointPolyline: ProviderPolylineGeometry = {
      format: 'polyline',
      encoding: 'google_encoded_polyline',
      precision: 5,
      value: encodePolyline([{ lat: 37.0, lng: -122.0 }]),
    }
    const waypoint = { lat: 37.01, lng: -121.99, name: 'Test waypoint' }
    const result = findNearestPointOnPolyline(waypoint, singlePointPolyline)
    expect(result.point).toEqual({ lat: 37.0, lng: -122.0 })
    expect(result.distanceMeters).toBeGreaterThan(0)
  })
})
describe('waypointService - calculateDeviation', () => {
  const straightLinePolyline = (): ProviderPolylineGeometry => ({
    format: 'polyline',
    encoding: 'google_encoded_polyline',
    precision: 5,
    value: encodePolyline([
      { lat: 37.0, lng: -122.0 },
      { lat: 37.1, lng: -122.0 },
      { lat: 37.2, lng: -122.0 },
      { lat: 37.3, lng: -122.0 },
    ]),
  })
  const makeGoogleDetourFetch = () => {
    const json = {
      routes: [
        {
          viewport: {
            low: { latitude: 37.0, longitude: -122.0 },
            high: { latitude: 37.3, longitude: -121.9 },
          },
          polyline: { encodedPolyline: 'DETOUR_POLYLINE' },
          legs: [
            {
              distanceMeters: 15_000,
              duration: '900s',
              polyline: { encodedPolyline: 'LEG0_POLYLINE' },
              startLocation: { latLng: { latitude: 37.2, longitude: -122.0 } },
              endLocation: { latLng: { latitude: 37.2, longitude: -121.9 } },
            },
            {
              distanceMeters: 15_000,
              duration: '900s',
              polyline: { encodedPolyline: 'LEG1_POLYLINE' },
              startLocation: { latLng: { latitude: 37.2, longitude: -121.9 } },
              endLocation: { latLng: { latitude: 37.2, longitude: -122.0 } },
            },
          ],
        },
      ],
    }
    return vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => json,
      text: async () => JSON.stringify(json),
    }))
  }
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('AC-2: classifies waypoint as on_route when within 500m', async () => {
    const waypoint = { lat: 37.2, lng: -122.001, name: 'Nearby waypoint' }
    const result = await calculateDeviation({ waypoint, routeGeometry: straightLinePolyline() })
    expect(result.kind).toBe('on_route')
  })
  it('AC-2: classifies waypoint as off_route when beyond 500m', async () => {
    ;(globalThis as any).fetch = makeGoogleDetourFetch()
    const waypoint = { lat: 37.2, lng: -121.9, name: 'Far waypoint' }
    const result = await calculateDeviation({ waypoint, routeGeometry: straightLinePolyline() })
    expect(result.kind).toBe('off_route')
  })
  it('AC-3: for off_route, finds optimal reconnection point', async () => {
    ;(globalThis as any).fetch = makeGoogleDetourFetch()
    const waypoint = { lat: 37.2, lng: -121.9, name: 'Far waypoint' }
    const result = await calculateDeviation({ waypoint, routeGeometry: straightLinePolyline() })
    expect(result.kind).toBe('off_route')
    if (result.kind === 'off_route') {
      expect(result.detourInfo).toBeDefined()
      expect(result.detourInfo.reconnectPoint.lng).toBeCloseTo(-122.0, 1)
    }
  })
  it('AC-4: for off_route, calculates deviation costs via Google Routes API', async () => {
    const fetchMock = makeGoogleDetourFetch()
    ;(globalThis as any).fetch = fetchMock
    const waypoint = { lat: 37.2, lng: -121.9, name: 'Far waypoint' }
    const result = await calculateDeviation({ waypoint, routeGeometry: straightLinePolyline() })
    expect(result.kind).toBe('off_route')
    if (result.kind === 'off_route') {
      expect(result.detourInfo.distanceAddedMeters).toBe(30_000)
      expect(result.detourInfo.timeAddedSeconds).toBe(1800)
    }
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('AC-5: returns complete deviation info for off_route waypoints', async () => {
    ;(globalThis as any).fetch = makeGoogleDetourFetch()
    const waypoint = { lat: 37.2, lng: -121.9, name: 'Far waypoint' }
    const result = await calculateDeviation({ waypoint, routeGeometry: straightLinePolyline() })
    expect(result.kind).toBe('off_route')
    if (result.kind === 'off_route') {
      expect(result.detourInfo).toMatchObject({
        distanceAddedMeters: expect.any(Number),
        timeAddedSeconds: expect.any(Number),
        reconnectPoint: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number),
        }),
        nearestPointOnRoute: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number),
        }),
      })
    }
  })
})
