import { describe, it, expect } from 'vitest'
import {
  calculateLOD,
  simplifyDouglasPeucker,
  batchWeatherPolylines,
} from '../weather-optimization'
import { createWindOverlay, createRainOverlay, createTemperatureOverlay } from '../../../test-helpers/overlays'
import type { RouteLeg, PolylineGeometry, RouteOverlays, RouteStop } from '../../../models/saved-routes'
import type { ExtendedTheme } from '../../../styles/types'

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemantic = {
  color: {
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    routeAlternate: { default: '#60a5fa' },
    muted: { default: '#938F99' },
    tertiary: { default: '#8b5cf6' },
    onSurface: { muted: '#6b7280' },
    routeSelected: { default: '#b87333' },
    orange: { default: '#fb923c' },
    primary: { default: '#b87333' },
  },
  space: { sm: 8 },
} as unknown as ExtendedTheme['semantic']

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const makeGeometry = (value: string): PolylineGeometry => ({
  format: 'polyline' as const,
  encoding: 'polyline' as const,
  precision: 5,
  value,
})

const mockStop: RouteStop = { lat: 37.77, lng: -122.41 }

const mockLegs: RouteLeg[] = [
  {
    legIndex: 0,
    start: mockStop,
    end: mockStop,
    geometry: makeGeometry('_p~iF~ps|U_ulLnnqC_mqNvxq`@'),
    distanceMeters: 10000,
    durationSeconds: 600,
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CLR-022: Batch Rendering Optimization', () => {
  describe('AC-001: Polyline batching by weather type', () => {
    it('creates at most 3 layers (one per weather type)', () => {
      const overlays: RouteOverlays = {
        wind: createWindOverlay(['low']),
        rain: createRainOverlay(['light']),
        temperature: createTemperatureOverlay(['cold']),
      }

      const layers = batchWeatherPolylines(mockLegs, overlays, mockSemantic)

      expect(layers.length).toBeLessThanOrEqual(3)
      expect(layers.length).toBe(3)
    })

    it('groups all wind segments into a single layer', () => {
      const overlays: RouteOverlays = {
        wind: createWindOverlay(['low', 'moderate', 'high']),
      }

      const layers = batchWeatherPolylines(mockLegs, overlays, mockSemantic)

      const windLayer = layers.find((l) => l.type === 'wind')
      expect(windLayer).toBeDefined()
      expect(windLayer!.shape.features.length).toBe(3) // 3 segments in one layer
    })

    it('returns empty array when no overlays have data', () => {
      const overlays: RouteOverlays = {}
      const layers = batchWeatherPolylines(mockLegs, overlays, mockSemantic)
      expect(layers).toHaveLength(0)
    })

    it('respects visibleLayers filter', () => {
      const overlays: RouteOverlays = {
        wind: createWindOverlay(['low']),
        rain: createRainOverlay(['light']),
      }

      const layers = batchWeatherPolylines(mockLegs, overlays, mockSemantic, {
        visibleLayers: { wind: true, rain: false },
      })

      expect(layers).toHaveLength(1)
      expect(layers[0].type).toBe('wind')
    })
  })

  describe('AC-002: Level of Detail (LOD)', () => {
    it('returns 0 tolerance at high zoom (no simplification)', () => {
      expect(calculateLOD(18)).toBe(0)
      expect(calculateLOD(16)).toBe(0)
    })

    it('returns moderate tolerance at city zoom', () => {
      expect(calculateLOD(13)).toBe(0.0001)
      expect(calculateLOD(14)).toBe(0.0001)
    })

    it('returns higher tolerance at country zoom', () => {
      expect(calculateLOD(10)).toBe(0.001)
      expect(calculateLOD(11)).toBe(0.001)
    })

    it('returns highest tolerance at world zoom', () => {
      expect(calculateLOD(5)).toBe(0.005)
      expect(calculateLOD(0)).toBe(0.005)
    })
  })

  describe('AC-003: Douglas-Peucker simplification', () => {
    it('returns original points when tolerance is 0', () => {
      const points: [number, number][] = [[0, 0], [1, 1], [2, 0]]
      const result = simplifyDouglasPeucker(points, 0)
      expect(result).toEqual(points)
    })

    it('returns original points when only 2 points', () => {
      const points: [number, number][] = [[0, 0], [1, 1]]
      const result = simplifyDouglasPeucker(points, 0.1)
      expect(result).toEqual(points)
    })

    it('simplifies collinear points to start and end', () => {
      const points: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0]]
      const result = simplifyDouglasPeucker(points, 0.1)
      expect(result).toEqual([[0, 0], [3, 0]])
    })

    it('preserves points that deviate beyond tolerance', () => {
      // Triangle: middle point deviates significantly
      const points: [number, number][] = [[0, 0], [1, 10], [2, 0]]
      const result = simplifyDouglasPeucker(points, 0.1)
      expect(result).toEqual([[0, 0], [1, 10], [2, 0]])
    })

    it('reduces point count for a large route', () => {
      // Generate 100 points along a mostly straight line with small deviations
      const points: [number, number][] = Array.from({ length: 100 }, (_, i) => [
        i * 0.01,
        Math.sin(i * 0.1) * 0.0001, // Very small deviations
      ])
      const result = simplifyDouglasPeucker(points, 0.001)
      expect(result.length).toBeLessThan(points.length)
      expect(result.length).toBeGreaterThanOrEqual(2)
    })

    it('preserves route recognizability', () => {
      // Right angle route (L-shape) should be preserved
      const points: [number, number][] = [
        [0, 0], [1, 0], [2, 0], [2, 1], [2, 2],
      ]
      const result = simplifyDouglasPeucker(points, 0.001)
      // Should keep the corner point
      expect(result.length).toBeGreaterThanOrEqual(3)
      expect(result[0]).toEqual([0, 0])
      expect(result[result.length - 1]).toEqual([2, 2])
    })
  })

  describe('AC-005: Performance', () => {
    it('simplifies 500 points in under 50ms', () => {
      const points: [number, number][] = Array.from({ length: 500 }, (_, i) => [
        -122 + i * 0.001,
        37 + Math.sin(i * 0.05) * 0.01,
      ])

      const start = performance.now()
      simplifyDouglasPeucker(points, 0.001)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(50)
    })

    it('batches weather data quickly', () => {
      const overlays: RouteOverlays = {
        wind: createWindOverlay(['low', 'moderate', 'high']),
        rain: createRainOverlay(['light', 'moderate', 'heavy']),
        temperature: createTemperatureOverlay(['cold', 'mild', 'hot']),
      }

      const start = performance.now()
      batchWeatherPolylines(mockLegs, overlays, mockSemantic)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(100)
    })
  })
})
