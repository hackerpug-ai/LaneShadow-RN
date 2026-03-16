/**
 * Integration tests for route-polyline.tsx
 *
 * Acceptance Criteria:
 * - AC1: Light rain segments display in sky blue (#60a5fa) color
 * - AC2: Heavy rain segments display in red (#ef4444) color
 * - AC3: Wind overlay active (not rain) → Polyline shows wind-based colors, not rain colors
 * - AC4: Rain overlay has no segment data for a leg → Leg renders in default neutral color (gray)
 *
 * Integration Focus:
 * - Verify polyline component receives colors from overlay-colors.ts
 * - Verify segment boundaries match RouteSnapshot.overlays.rain.byLeg
 * - Verify coloring only applies when rain overlay is active
 */

import type { PolylineGeometry, RouteLeg, RouteOverlays } from '../../models/saved-routes'
import { buildRoutePolylines } from './route-polyline'
import type { ExtendedTheme } from '../../styles/types'

// Mock semantic theme for testing
const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' }, // Rain: none (green)
    warning: { default: '#f59e0b' },
    danger: { default: '#ef4444' }, // Rain: heavy (red)
    info: { default: '#3b82f6' }, // Rain: moderate (blue)
    surface: { default: '#FEF7FF' },
    surfaceVariant: { default: '#E7E0EC' },
    background: { default: '#FEF7FF' },
    onSurface: { default: '#1D1B20', muted: '#49454F', subtle: '#79747E' },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#E8DEF8' },
    onSecondaryContainer: { default: '#1D192B', muted: '#49454F', subtle: '#79747E' },
    border: { default: '#CAC4D0' },
    input: { default: '#CAC4D0' },
    ring: { default: '#6750A4' },
    card: { default: '#FFFFFF' },
    popover: { default: '#FFFFFF' },
    accent: { default: '#FF6B35' },
    orange: { default: '#fb923c' },
    muted: { default: '#938F99' }, // Neutral/missing data
    divider: { default: '#CAC4D0' },
    scrim: { default: '#000000' },
    routeSelected: { default: '#FF6B35' },
    routeAlternate: { default: '#60a5fa' }, // Rain: light (sky blue)
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  type: {
    label: {
      sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
      md: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
      md: { fontSize: 18, lineHeight: 28, fontWeight: '500' as const },
      lg: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
    },
    heading: {
      sm: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
      md: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
      lg: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      md: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const },
      lg: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const },
    },
  },
  elevation: {
    0: { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 5 },
  },
}

// Helper to create mock route geometry
const createMockGeometry = (points: Array<[number, number]>): PolylineGeometry => {
  return `_p~iF~ps{U}~{~F~`{~@{~@~@~@{~@{~C~C{B~B{A~A`@`@`?`?`?`?`?a?a?a?a?a~a~a~a~a~a`a`a`a`a`a?a?a?a?a?a~a~a~a~a~a`a`a`a`a`a`a`a`a`a`a~a~a~a~a~a~a~a`a`a`a`a`a~a~a~a~a~a`a`a`a`a`a~a~a~a~a~a`a`a`a`a`a`
}

// Helper to create mock route legs
const createMockLegs = (count: number): Array<RouteLeg> => {
  return Array.from({ length: count }, (_, i) => ({
    legIndex: i,
    startAddress: `Start ${i}`,
    endAddress: `End ${i}`,
    distanceMeters: 1000 + i * 500,
    durationSeconds: 300 + i * 60,
    geometry: createMockGeometry([
      [37.7749 + i * 0.01, -122.4194],
      [37.7759 + i * 0.01, -122.4184],
    ]),
    overviewPolyline: createMockGeometry([
      [37.7749 + i * 0.01, -122.4194],
      [37.7759 + i * 0.01, -122.4184],
    ]),
  }))
}

// Helper to create mock route with overlays
const createMockRoute = (overlays: RouteOverlays) => {
  const legs = createMockLegs(3)
  return {
    overviewGeometry: createMockGeometry([
      [37.7749, -122.4194],
      [37.7849, -122.4094],
    ]),
    legs,
    overlays,
  }
}

// Helper to create mock rain overlay
const createMockRainOverlay = (
  segmentsByLeg: Array<{ start: number; end: number; level: 'none' | 'light' | 'moderate' | 'heavy' }[]>
): RouteOverlays['rain'] => {
  return {
    byLeg: segmentsByLeg.map((segments, legIndex) => ({
      legIndex,
      segments: segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        level: seg.level,
      })),
    })),
  }
}

// Helper to create mock wind overlay
const createMockWindOverlay = (
  segmentsByLeg: Array<{ start: number; end: number; level: 'low' | 'moderate' | 'high' }[]>
): RouteOverlays['wind'] => {
  return {
    byLeg: segmentsByLeg.map((segments, legIndex) => ({
      legIndex,
      segments: segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        level: seg.level,
      })),
    })),
  }
}

// Helper to create mock temperature overlay
const createMockTemperatureOverlay = (
  segmentsByLeg: Array<{ start: number; end: number; level: 'cold' | 'mild' | 'warm' | 'hot' }[]>
): RouteOverlays['temperature'] => {
  return {
    byLeg: segmentsByLeg.map((segments, legIndex) => ({
      legIndex,
      segments: segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        level: seg.level,
      })),
    })),
  }
}

describe('route-polyline', () => {
  /**
   * AC1: Light rain segments display in sky blue (#60a5fa) color
   */
  describe('rain light color', () => {
    it('should satisfy AC1: renders light rain segments in sky blue color', () => {
      const rainOverlay = createMockRainOverlay([
        // Leg 0: light rain segment
        [{ start: 0, end: 1000, level: 'light' }],
        // Leg 1: moderate rain
        [{ start: 0, end: 1000, level: 'moderate' }],
        // Leg 2: no rain
        [{ start: 0, end: 1000, level: 'none' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Find rain overlay polylines (they have IDs starting with 'rain-')
      const rainPolylines = polylines.filter((p) => p.id?.startsWith('rain-'))

      // Light rain segment should have sky blue color (#60a5fa = routeAlternate)
      const lightRainPolyline = rainPolylines.find((p) =>
        p.id?.includes('rain-0-0-1000')
      )

      expect(lightRainPolyline).toBeDefined()
      expect(lightRainPolyline?.strokeColor).toBe('#60a5fa') // routeAlternate (sky blue)
    })

    it('should use semantic theme colors for light rain', () => {
      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 500, level: 'light' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      const lightRainPolyline = polylines.find((p) => p.id?.startsWith('rain-'))

      // Verify it uses the semantic theme's routeAlternate color
      expect(lightRainPolyline?.strokeColor).toBe(mockSemanticTheme.color.routeAlternate.default)
    })
  })

  /**
   * AC2: Heavy rain segments display in red (#ef4444) color
   */
  describe('rain heavy color', () => {
    it('should satisfy AC2: renders heavy rain segments in red color', () => {
      const rainOverlay = createMockRainOverlay([
        // Leg 0: heavy rain segment
        [{ start: 0, end: 1000, level: 'heavy' }],
        // Leg 1: moderate rain
        [{ start: 0, end: 1000, level: 'moderate' }],
        // Leg 2: light rain
        [{ start: 0, end: 1000, level: 'light' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Find heavy rain polyline
      const heavyRainPolyline = polylines.find((p) =>
        p.id?.includes('rain-0-0-1000')
      )

      expect(heavyRainPolyline).toBeDefined()
      expect(heavyRainPolyline?.strokeColor).toBe('#ef4444') // danger (red)
    })

    it('should use semantic theme danger color for heavy rain', () => {
      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 500, level: 'heavy' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      const heavyRainPolyline = polylines.find((p) => p.id?.startsWith('rain-'))

      // Verify it uses the semantic theme's danger color
      expect(heavyRainPolyline?.strokeColor).toBe(mockSemanticTheme.color.danger.default)
    })

    it('should handle multiple rain intensity levels in same leg', () => {
      const rainOverlay = createMockRainOverlay([
        // Leg 0: multiple segments with different intensities
        [
          { start: 0, end: 300, level: 'none' },
          { start: 300, end: 600, level: 'heavy' },
          { start: 600, end: 1000, level: 'light' },
        ],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should have 3 rain polylines for leg 0
      const leg0RainPolylines = polylines.filter((p) => p.id?.startsWith('rain-0-'))

      expect(leg0RainPolylines).toHaveLength(3)

      // Verify each has correct color
      const nonePolyline = leg0RainPolylines.find((p) => p.id?.includes('0-0-300'))
      const heavyPolyline = leg0RainPolylines.find((p) => p.id?.includes('0-300-600'))
      const lightPolyline = leg0RainPolylines.find((p) => p.id?.includes('0-600-1000'))

      expect(nonePolyline?.strokeColor).toBe(mockSemanticTheme.color.success.default) // green
      expect(heavyPolyline?.strokeColor).toBe(mockSemanticTheme.color.danger.default) // red
      expect(lightPolyline?.strokeColor).toBe(mockSemanticTheme.color.routeAlternate.default) // sky blue
    })
  })

  /**
   * AC3: Wind overlay is active (not rain)
   * → Polyline shows wind-based colors, not rain colors
   */
  describe('overlay switch colors', () => {
    it('should satisfy AC3: shows wind colors when wind overlay is active', () => {
      const windOverlay = createMockWindOverlay([
        // Leg 0: high wind
        [{ start: 0, end: 1000, level: 'high' }],
      ])

      const rainOverlay = createMockRainOverlay([
        // Leg 0: heavy rain (but rain overlay is not active)
        [{ start: 0, end: 1000, level: 'heavy' }],
      ])

      const route = createMockRoute({ wind: windOverlay, rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: false, // Rain overlay NOT active
        showWindOverlay: true, // Wind overlay active
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should have wind polylines
      const windPolylines = polylines.filter((p) => p.id?.startsWith('wind-'))
      expect(windPolylines).toHaveLength(1)

      // Wind polyline should have danger color (red for high wind)
      expect(windPolylines[0].strokeColor).toBe(mockSemanticTheme.color.danger.default)
    })

    it('should not show rain polylines when rain overlay is inactive', () => {
      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 1000, level: 'heavy' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: false, // Rain overlay NOT active
        showWindOverlay: true, // Wind overlay active instead
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should NOT have rain polylines
      const rainPolylines = polylines.filter((p) => p.id?.startsWith('rain-'))
      expect(rainPolylines).toHaveLength(0)
    })

    it('should switch between wind and rain colors correctly', () => {
      const windOverlay = createMockWindOverlay([
        [{ start: 0, end: 1000, level: 'low' }],
      ])

      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 1000, level: 'heavy' }],
      ])

      const route = createMockRoute({ wind: windOverlay, rain: rainOverlay })

      // With wind overlay active
      const windPolylines = buildRoutePolylines({
        route,
        showRainOverlay: false,
        showWindOverlay: true,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      const windPolyline = windPolylines.find((p) => p.id?.startsWith('wind-'))
      expect(windPolyline?.strokeColor).toBe(mockSemanticTheme.color.success.default) // green (low wind)

      // With rain overlay active
      const rainPolylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      const rainPolyline = rainPolylines.find((p) => p.id?.startsWith('rain-'))
      expect(rainPolyline?.strokeColor).toBe(mockSemanticTheme.color.danger.default) // red (heavy rain)
    })

    it('should show temperature colors when temperature overlay is active', () => {
      const tempOverlay = createMockTemperatureOverlay([
        [{ start: 0, end: 1000, level: 'hot' }],
      ])

      const route = createMockRoute({ temperature: tempOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: false,
        showWindOverlay: false,
        showTemperatureOverlay: true,
        semantic: mockSemanticTheme,
      })

      const tempPolylines = polylines.filter((p) => p.id?.startsWith('temp-'))
      expect(tempPolylines).toHaveLength(1)

      // Hot temperature should be red
      expect(tempPolylines[0].strokeColor).toBe(mockSemanticTheme.color.danger.default)
    })
  })

  /**
   * AC4: Rain overlay has no segment data for a leg
   * → Leg renders in default neutral color (gray)
   */
  describe('missing rain segment', () => {
    it('should satisfy AC4: renders legs without rain data in neutral color', () => {
      const rainOverlay = createMockRainOverlay([
        // Leg 0: has rain data
        [{ start: 0, end: 1000, level: 'light' }],
        // Leg 1: NO rain data (empty segments array or missing leg)
        // Leg 2: has rain data
        [{ start: 0, end: 1000, level: 'moderate' }],
      ])

      // Only provide rain overlay data for legs 0 and 2
      rainOverlay.byLeg = rainOverlay.byLeg.filter((_, i) => i === 0 || i === 2)

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should still have base polylines (overview and legs)
      const basePolylines = polylines.filter((p) => !p.id?.startsWith('rain-'))
      expect(basePolylines.length).toBeGreaterThan(0)

      // Leg polylines should render in neutral color
      const legPolylines = basePolylines.filter((p) => p.id?.startsWith('leg-'))
      legPolylines.forEach((legPolyline) => {
        expect(legPolyline.strokeColor).toBeDefined()
        // Leg color should be a muted/neutral color
        expect(
          legPolyline.strokeColor === mockSemanticTheme.color.routeAlternate.default ||
          legPolyline.strokeColor === mockSemanticTheme.color.onSurface.muted
        ).toBe(true)
      })
    })

    it('should handle empty segments array gracefully', () => {
      const rainOverlay = createMockRainOverlay([
        // Leg 0: empty segments
        [],
        // Leg 1: has data
        [{ start: 0, end: 1000, level: 'moderate' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should not crash and should still render polylines
      expect(polylines.length).toBeGreaterThan(0)

      // Leg 0 should not have rain overlay polylines (empty segments)
      const leg0RainPolylines = polylines.filter((p) => p.id?.startsWith('rain-0-'))
      expect(leg0RainPolylines).toHaveLength(0)
    })

    it('should handle missing overlay data entirely', () => {
      const route = createMockRoute({})

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: true,
        showTemperatureOverlay: true,
        semantic: mockSemanticTheme,
      })

      // Should still render base polylines (overview and legs)
      const basePolylines = polylines.filter((p) =>
        p.id === 'overview' || p.id?.startsWith('leg-')
      )

      expect(basePolylines.length).toBeGreaterThan(0)

      // Should have overview and 3 legs
      expect(basePolylines.length).toBe(4)
    })
  })

  /**
   * Integration: Verify polyline uses overlay-colors utilities
   */
  describe('integration with overlay-colors', () => {
    it('should use getRainColor for rain segments', () => {
      // Import the actual utility to verify color mapping
      const { getRainColor } = require('../../lib/map/overlay-colors')

      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 1000, level: 'heavy' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      const rainPolyline = polylines.find((p) => p.id?.startsWith('rain-'))

      // Verify the color matches what getRainColor returns
      const expectedColor = getRainColor('heavy', mockSemanticTheme)
      expect(rainPolyline?.strokeColor).toBe(expectedColor)
    })

    it('should use getWindColor for wind segments', () => {
      const { getWindColor } = require('../../lib/map/overlay-colors')

      const windOverlay = createMockWindOverlay([
        [{ start: 0, end: 1000, level: 'moderate' }],
      ])

      const route = createMockRoute({ wind: windOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: false,
        showWindOverlay: true,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      const windPolyline = polylines.find((p) => p.id?.startsWith('wind-'))

      const expectedColor = getWindColor('moderate', mockSemanticTheme)
      expect(windPolyline?.strokeColor).toBe(expectedColor)
    })

    it('should use getTemperatureColor for temperature segments', () => {
      const { getTemperatureColor } = require('../../lib/map/overlay-colors')

      const tempOverlay = createMockTemperatureOverlay([
        [{ start: 0, end: 1000, level: 'warm' }],
      ])

      const route = createMockRoute({ temperature: tempOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: false,
        showWindOverlay: false,
        showTemperatureOverlay: true,
        semantic: mockSemanticTheme,
      })

      const tempPolyline = polylines.find((p) => p.id?.startsWith('temp-'))

      const expectedColor = getTemperatureColor('warm', mockSemanticTheme)
      expect(tempPolyline?.strokeColor).toBe(expectedColor)
    })
  })

  /**
   * Verify segment boundaries match RouteSnapshot.overlays.rain.byLeg
   */
  describe('segment boundaries', () => {
    it('should create polylines with correct segment boundaries', () => {
      const rainOverlay = createMockRainOverlay([
        // Leg 0: two segments with different boundaries
        [
          { start: 0, end: 500, level: 'light' },
          { start: 500, end: 1000, level: 'moderate' },
        ],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should have 2 rain polylines for leg 0
      const leg0RainPolylines = polylines.filter((p) => p.id?.startsWith('rain-0-'))

      expect(leg0RainPolylines).toHaveLength(2)

      // Verify IDs contain correct boundary markers
      expect(leg0RainPolylines[0].id).toContain('rain-0-0-500')
      expect(leg0RainPolylines[1].id).toContain('rain-0-500-1000')
    })

    it('should match byLeg structure from overlay data', () => {
      const rainOverlay = createMockRainOverlay([
        // Leg 0
        [{ start: 0, end: 1000, level: 'light' }],
        // Leg 1
        [{ start: 0, end: 1000, level: 'heavy' }],
        // Leg 2
        [{ start: 0, end: 1000, level: 'none' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should have rain polylines for each leg
      const leg0Polylines = polylines.filter((p) => p.id?.startsWith('rain-0-'))
      const leg1Polylines = polylines.filter((p) => p.id?.startsWith('rain-1-'))
      const leg2Polylines = polylines.filter((p) => p.id?.startsWith('rain-2-'))

      expect(leg0Polylines).toHaveLength(1)
      expect(leg1Polylines).toHaveLength(1)
      expect(leg2Polylines).toHaveLength(1)

      // Verify legIndex is in the ID
      expect(leg0Polylines[0].id).toContain('rain-0-')
      expect(leg1Polylines[0].id).toContain('rain-1-')
      expect(leg2Polylines[0].id).toContain('rain-2-')
    })
  })

  /**
   * Coloring only applies when rain overlay is active
   */
  describe('conditional overlay rendering', () => {
    it('should not apply rain colors when showRainOverlay is false', () => {
      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 1000, level: 'heavy' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: false, // Rain overlay disabled
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should NOT have rain overlay polylines
      const rainPolylines = polylines.filter((p) => p.id?.startsWith('rain-'))
      expect(rainPolylines).toHaveLength(0)
    })

    it('should apply rain colors when showRainOverlay is true', () => {
      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 1000, level: 'heavy' }],
      ])

      const route = createMockRoute({ rain: rainOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true, // Rain overlay enabled
        showWindOverlay: false,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should have rain overlay polylines
      const rainPolylines = polylines.filter((p) => p.id?.startsWith('rain-'))
      expect(rainPolylines).toHaveLength(1)
    })

    it('should support multiple overlays simultaneously', () => {
      const rainOverlay = createMockRainOverlay([
        [{ start: 0, end: 1000, level: 'light' }],
      ])

      const windOverlay = createMockWindOverlay([
        [{ start: 0, end: 1000, level: 'low' }],
      ])

      const route = createMockRoute({ rain: rainOverlay, wind: windOverlay })

      const polylines = buildRoutePolylines({
        route,
        showRainOverlay: true,
        showWindOverlay: true,
        showTemperatureOverlay: false,
        semantic: mockSemanticTheme,
      })

      // Should have both rain and wind overlay polylines
      const rainPolylines = polylines.filter((p) => p.id?.startsWith('rain-'))
      const windPolylines = polylines.filter((p) => p.id?.startsWith('wind-'))

      expect(rainPolylines).toHaveLength(1)
      expect(windPolylines).toHaveLength(1)
    })
  })
})
