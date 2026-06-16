import { describe, expect, it } from 'vitest'
import type { RouteSketch } from '../../../../../models/route-sketch'
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

  describe('presentation labels from sketch', () => {
    it('uses sketch fromLabel/toLabel when available for intermediate legs', async () => {
      const multiLegProviderRoute: ProviderRouteResponse = {
        ...providerRoute,
        legs: [
          {
            legIndex: 0,
            start: { lat: 37.0, lng: -122.0 },
            end: { lat: 37.2, lng: -122.2 },
            distanceMeters: 5_000,
            durationSeconds: 600,
            geometry: {
              format: 'polyline',
              encoding: 'mock_polyline',
              precision: 5,
              value: 'leg1',
            },
          },
          {
            legIndex: 1,
            start: { lat: 37.2, lng: -122.2 },
            end: { lat: 37.5, lng: -122.5 },
            distanceMeters: 5_000,
            durationSeconds: 600,
            geometry: {
              format: 'polyline',
              encoding: 'mock_polyline',
              precision: 5,
              value: 'leg2',
            },
          },
        ],
      }

      const sketch: RouteSketch = {
        label: 'Test Route',
        rationale: 'Test',
        segments: [
          {
            roadName: 'Highway 1',
            fromName: 'San Francisco',
            toName: 'Half Moon Bay',
            fromLabel: 'Downtown San Francisco',
            toLabel: 'Half Moon Bay Coast',
          },
          {
            roadName: 'Highway 1',
            fromName: 'Half Moon Bay',
            toName: 'Santa Cruz',
            fromLabel: 'Half Moon Bay Coast',
            toLabel: 'Santa Cruz Beach',
          },
        ],
        anchorPoints: [],
      }

      const snapshot = await normalizeRoute({
        providerRoute: multiLegProviderRoute,
        planInput,
        sketch,
      })

      // First leg start uses planInput.start.label (origin takes precedence)
      expect(snapshot.legs[0].start.label).toBe('Start')
      // First leg end uses sketch toLabel
      expect(snapshot.legs[0].end.label).toBe('Half Moon Bay Coast')
      // Second leg start uses sketch fromLabel
      expect(snapshot.legs[1].start.label).toBe('Half Moon Bay Coast')
      // Last leg end uses planInput.end.label (destination takes precedence)
      expect(snapshot.legs[1].end.label).toBe('End')
    })

    it('falls back to fromName/toName when presentation labels are not provided', async () => {
      const multiLegProviderRoute: ProviderRouteResponse = {
        ...providerRoute,
        legs: [
          {
            legIndex: 0,
            start: { lat: 37.0, lng: -122.0 },
            end: { lat: 37.2, lng: -122.2 },
            distanceMeters: 5_000,
            durationSeconds: 600,
            geometry: {
              format: 'polyline',
              encoding: 'mock_polyline',
              precision: 5,
              value: 'leg1',
            },
          },
          {
            legIndex: 1,
            start: { lat: 37.2, lng: -122.2 },
            end: { lat: 37.5, lng: -122.5 },
            distanceMeters: 5_000,
            durationSeconds: 600,
            geometry: {
              format: 'polyline',
              encoding: 'mock_polyline',
              precision: 5,
              value: 'leg2',
            },
          },
        ],
      }

      const sketch: RouteSketch = {
        label: 'Test Route',
        rationale: 'Test',
        segments: [
          {
            roadName: 'Highway 1',
            fromName: 'San Francisco',
            toName: 'Half Moon Bay',
          },
          {
            roadName: 'Highway 1',
            fromName: 'Half Moon Bay',
            toName: 'Santa Cruz',
          },
        ],
        anchorPoints: [],
      }

      const snapshot = await normalizeRoute({
        providerRoute: multiLegProviderRoute,
        planInput,
        sketch,
      })

      // First leg start uses planInput.start.label (origin takes precedence)
      expect(snapshot.legs[0].start.label).toBe('Start')
      // First leg end falls back to toName
      expect(snapshot.legs[0].end.label).toBe('Half Moon Bay')
      // Second leg start falls back to fromName
      expect(snapshot.legs[1].start.label).toBe('Half Moon Bay')
      // Last leg end uses planInput.end.label (destination takes precedence)
      expect(snapshot.legs[1].end.label).toBe('End')
    })

    it('prioritizes planInput labels for first leg start and last leg end', async () => {
      const sketch: RouteSketch = {
        label: 'Test Route',
        rationale: 'Test',
        segments: [
          {
            roadName: 'Highway 1',
            fromName: 'San Francisco',
            toName: 'Santa Cruz',
            fromLabel: 'Downtown San Francisco',
            toLabel: 'Santa Cruz Beach',
          },
        ],
        anchorPoints: [],
      }

      const snapshot = await normalizeRoute({ providerRoute, planInput, sketch })

      // First leg start should use planInput.start.label (origin takes precedence)
      expect(snapshot.legs[0].start.label).toBe('Start')
      // Last leg end should use planInput.end.label (destination takes precedence)
      expect(snapshot.legs[0].end.label).toBe('End')
    })
  })
})
