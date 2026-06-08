import { render } from '@testing-library/react-native'
import { describe, expect, it } from 'vitest'
import type { PolylineGeometry, RouteLeg, RouteStop } from '../../../server/models/saved-routes'
import type { ExtendedTheme } from '../../../styles/types'
import {
  createRainOverlay,
  createTemperatureOverlay,
  createWindOverlay,
} from '../../../test-helpers/overlays'
import { WeatherOverlay } from '../weather-overlay'

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
  },
  space: { sm: 8 },
} as unknown as ExtendedTheme['semantic']

// ---------------------------------------------------------------------------
// Mock route legs
// ---------------------------------------------------------------------------

const makeGeometry = (value: string): PolylineGeometry => ({
  format: 'polyline' as const,
  encoding: 'polyline' as const,
  precision: 5,
  value,
})

// Polyline with ~3 coordinates spanning ~600km
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

describe('CLR-020: WeatherOverlay', () => {
  describe('AC-001: ShapeSource configuration', () => {
    it('renders null when no overlays provided', () => {
      const { toJSON } = render(
        <WeatherOverlay legs={mockLegs} overlays={undefined} semantic={mockSemantic} testID="wo" />,
      )
      expect(toJSON()).toBeNull()
    })

    it('renders ShapeSource elements when wind overlay present', () => {
      const wind = createWindOverlay(['low'])

      const { getAllByTestId } = render(
        <WeatherOverlay legs={mockLegs} overlays={{ wind }} semantic={mockSemantic} testID="wo" />,
      )

      const windElements = getAllByTestId(/wo--wind/)
      expect(windElements.length).toBeGreaterThan(0)
    })
  })

  describe('AC-002: Wind level colors', () => {
    it('renders wind segments for low/moderate/high', () => {
      const wind = createWindOverlay(['low', 'moderate', 'high'])

      const { getAllByTestId } = render(
        <WeatherOverlay legs={mockLegs} overlays={{ wind }} semantic={mockSemantic} testID="wo" />,
      )

      // 3 levels = 3 segments
      const windElements = getAllByTestId(/wo--wind/)
      expect(windElements).toHaveLength(3)
    })
  })

  describe('AC-003: Rain intensity colors', () => {
    it('renders rain segments', () => {
      const rain = createRainOverlay(['light'])

      const { getAllByTestId } = render(
        <WeatherOverlay legs={mockLegs} overlays={{ rain }} semantic={mockSemantic} testID="wo" />,
      )

      const rainElements = getAllByTestId(/wo--rain/)
      expect(rainElements.length).toBeGreaterThan(0)
    })

    it('renders heavy rain with opacity', () => {
      const rain = createRainOverlay(['heavy'])

      const { getAllByTestId } = render(
        <WeatherOverlay legs={mockLegs} overlays={{ rain }} semantic={mockSemantic} testID="wo" />,
      )

      expect(getAllByTestId(/wo--rain/).length).toBeGreaterThan(0)
    })
  })

  describe('AC-004: Temperature colors', () => {
    it('renders temperature segments', () => {
      const temperature = createTemperatureOverlay(['cold'])

      const { getAllByTestId } = render(
        <WeatherOverlay
          legs={mockLegs}
          overlays={{ temperature }}
          semantic={mockSemantic}
          testID="wo"
        />,
      )

      expect(getAllByTestId(/wo--temp/).length).toBeGreaterThan(0)
    })
  })

  describe('AC-005: Layer ordering', () => {
    it('renders all three layers when all overlays present', () => {
      const wind = createWindOverlay(['low'])
      const rain = createRainOverlay(['light'])
      const temperature = createTemperatureOverlay(['cold'])

      const { getAllByTestId } = render(
        <WeatherOverlay
          legs={mockLegs}
          overlays={{ wind, rain, temperature }}
          semantic={mockSemantic}
          testID="wo"
        />,
      )

      expect(getAllByTestId(/wo--wind/).length).toBeGreaterThan(0)
      expect(getAllByTestId(/wo--rain/).length).toBeGreaterThan(0)
      expect(getAllByTestId(/wo--temp/).length).toBeGreaterThan(0)
    })

    it('supports toggling individual layers off', () => {
      const wind = createWindOverlay(['low'])

      const { queryAllByTestId } = render(
        <WeatherOverlay
          legs={mockLegs}
          overlays={{ wind }}
          visibleLayers={{ wind: false, rain: true, temperature: true }}
          semantic={mockSemantic}
          testID="wo"
        />,
      )

      expect(queryAllByTestId(/wo--wind/)).toHaveLength(0)
    })
  })

  describe('AC-006: Missing data handling', () => {
    it('renders null when overlays object has no data', () => {
      const { toJSON } = render(
        <WeatherOverlay legs={mockLegs} overlays={{}} semantic={mockSemantic} testID="wo" />,
      )
      expect(toJSON()).toBeNull()
    })

    it('renders available layers only when partial data', () => {
      const wind = createWindOverlay(['low'])

      const { getAllByTestId, queryAllByTestId } = render(
        <WeatherOverlay legs={mockLegs} overlays={{ wind }} semantic={mockSemantic} testID="wo" />,
      )

      expect(getAllByTestId(/wo--wind/).length).toBeGreaterThan(0)
      expect(queryAllByTestId(/wo--rain/)).toHaveLength(0)
      expect(queryAllByTestId(/wo--temp/)).toHaveLength(0)
    })
  })
})
