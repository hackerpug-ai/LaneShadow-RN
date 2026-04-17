/**
 * Unit tests for weather-strip.tsx
 *
 * Acceptance Criteria:
 * - AC1: Route has heavy rain but mild wind and temperature → Heavy rain badge is highlighted as primary concern
 * - AC2: Route has multiple concerning conditions (high wind AND heavy rain) → Shows single worst (rain > wind priority) with indicator for other warnings
 * - AC3: User taps the weather strip → Expands to show all three condition badges
 * - AC4: All conditions are favorable (low wind, no rain, mild temp) → Shows 'Good conditions' summary in green
 */

import { fireEvent, render } from '@testing-library/react-native'
import { MD3DarkTheme, PaperProvider } from 'react-native-paper'
import { describe, expect, it, vi } from 'vitest'
import type { RouteOverlays } from '../../models/saved-routes'
import type { ExtendedTheme } from '../../styles/types'
import { WeatherStrip } from './weather-strip'

// Mock semantic theme for testing
const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    warningContainer: { default: 'FFF8E7' },
    onWarningContainer: { default: '#5C3E00' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
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
    locationPoiFill: { default: '#EDEDED' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8' },
    card: { default: '#FFFFFF' },
    popover: { default: '#FFFFFF' },
    accent: { default: '#FF6B35' },
    orange: { default: '#fb923c' },
    muted: { default: '#938F99' },
    divider: { default: '#CAC4D0' },
    scrim: { default: '#000000' },
    routeSelected: { default: '#FF6B35' },
    routeAlternate: { default: '#60a5fa' },
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
    0: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 5,
    },
  },
}

// Mock useSemanticTheme hook
vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Helper to create mock overlays
const createMockOverlays = (conditions: {
  rain?: 'none' | 'light' | 'moderate' | 'heavy'
  wind?: 'low' | 'moderate' | 'high'
  temperature?: 'cold' | 'mild' | 'warm' | 'hot'
}): RouteOverlays => ({
  rain: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [
      { level: 'none', label: 'No rain' },
      { level: 'light', label: 'Light rain' },
      { level: 'moderate', label: 'Moderate rain' },
      { level: 'heavy', label: 'Heavy rain' },
      { level: 'unavailable', label: 'Unavailable' },
    ],
    byLeg: [
      {
        legIndex: 0,
        segments: [{ startMeters: 0, endMeters: 1000, level: conditions.rain ?? 'none' }],
      },
    ],
  },
  wind: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [
      { level: 'low', label: 'Low wind' },
      { level: 'moderate', label: 'Moderate wind' },
      { level: 'high', label: 'High wind' },
      { level: 'unavailable', label: 'Unavailable' },
    ],
    byLeg: [
      {
        legIndex: 0,
        segments: [{ startMeters: 0, endMeters: 1000, level: conditions.wind ?? 'low' }],
      },
    ],
  },
  temperature: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [
      { level: 'cold', label: 'Cold', range: { min: -Infinity, max: 10, unit: '°C' } },
      { level: 'mild', label: 'Mild', range: { min: 10, max: 25, unit: '°C' } },
      { level: 'warm', label: 'Warm', range: { min: 25, max: 32, unit: '°C' } },
      { level: 'hot', label: 'Hot', range: { min: 32, max: Infinity, unit: '°C' } },
      { level: 'unavailable', label: 'Unavailable' },
    ],
    byLeg: [
      {
        legIndex: 0,
        segments: [
          {
            startMeters: 0,
            endMeters: 1000,
            level: conditions.temperature ?? 'mild',
            temperatureCelsius:
              conditions.temperature === 'hot'
                ? 35
                : conditions.temperature === 'warm'
                  ? 25
                  : conditions.temperature === 'cold'
                    ? 0
                    : 15,
          },
        ],
      },
    ],
  },
})

// Helper wrapper with PaperProvider
const renderWithPaper = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>)
}

describe('weather-strip', () => {
  /**
   * AC1: Route has heavy rain but mild wind and temperature
   * → Heavy rain badge is highlighted as primary concern
   */
  describe('worst condition rain', () => {
    it('should satisfy AC1: highlights heavy rain badge when rain is worst condition', () => {
      const overlays = createMockOverlays({
        rain: 'heavy',
        wind: 'low',
        temperature: 'mild',
      })

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      // Rain badge should be present for worst condition
      expect(queryByTestId('weather-strip-rain-badge')).toBeTruthy()
      // Wind and temp badges should not be shown in compact mode (rain is worst)
      expect(queryByTestId('weather-strip-wind-badge')).toBeNull()
      expect(queryByTestId('weather-strip-temp-badge')).toBeNull()
    })
  })

  /**
   * AC2: Route has multiple concerning conditions (high wind AND heavy rain)
   * → Shows single worst (rain > wind priority) with indicator for other warnings
   */
  describe('multiple warnings', () => {
    it('should satisfy AC2: shows single worst condition with additional warnings indicator', () => {
      const overlays = createMockOverlays({
        rain: 'heavy',
        wind: 'high',
        temperature: 'mild',
      })

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      // Rain badge should be present (rain has priority over wind when both are severe)
      expect(queryByTestId('weather-strip-rain-badge')).toBeTruthy()
      // Additional warnings indicator should be present (+1 for wind)
      expect(queryByTestId('weather-strip-additional-warnings')).toBeTruthy()
      // Wind badge should not be shown in compact mode
      expect(queryByTestId('weather-strip-wind-badge')).toBeNull()
    })

    it('should show wind as worst when wind is high but rain is none', () => {
      const overlays = createMockOverlays({
        rain: 'none',
        wind: 'high',
        temperature: 'cold',
      })

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      // Wind badge should be present
      expect(queryByTestId('weather-strip-wind-badge')).toBeTruthy()
      // Additional warnings indicator should be present (+1 for temperature)
      expect(queryByTestId('weather-strip-additional-warnings')).toBeTruthy()
    })
  })

  /**
   * AC3: User taps the weather strip
   * → Expands to show all three condition badges
   */
  describe('expand strip', () => {
    it('should satisfy AC3: expands to show all badges when tapped', () => {
      const overlays = createMockOverlays({
        rain: 'heavy',
        wind: 'high',
        temperature: 'hot',
      })

      const { queryByTestId, getByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      // Initially, only worst condition (rain) is shown with additional warnings indicator
      expect(queryByTestId('weather-strip-rain-badge')).toBeTruthy()
      expect(queryByTestId('weather-strip-additional-warnings')).toBeTruthy()

      // Tap to expand
      fireEvent.press(getByTestId('weather-strip'))

      // After expansion, all badges should be visible
      expect(queryByTestId('weather-strip-rain-badge')).toBeTruthy()
      expect(queryByTestId('weather-strip-wind-badge')).toBeTruthy()
      expect(queryByTestId('weather-strip-temp-badge')).toBeTruthy()
    })

    it('should collapse back to compact mode when tapped again', () => {
      const overlays = createMockOverlays({
        rain: 'none',
        wind: 'high',
        temperature: 'cold',
      })

      const { queryByTestId, getByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      // Tap to expand
      fireEvent.press(getByTestId('weather-strip'))
      expect(queryByTestId('weather-strip-wind-badge')).toBeTruthy()

      // Tap to collapse
      fireEvent.press(getByTestId('weather-strip'))
      // In compact mode, only worst condition (wind) should be shown
      expect(queryByTestId('weather-strip-wind-badge')).toBeTruthy()
      // Additional warnings indicator should be present
      expect(queryByTestId('weather-strip-additional-warnings')).toBeTruthy()
    })
  })

  /**
   * AC4: All conditions are favorable (low wind, no rain, mild temp)
   * → Shows 'Good conditions' summary in green
   */
  describe('good conditions', () => {
    it('should satisfy AC4: shows good conditions badge when all weather is favorable', () => {
      const overlays = createMockOverlays({
        rain: 'none',
        wind: 'low',
        temperature: 'mild',
      })

      const { queryByTestId, getByText } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      // Good conditions badge should be present
      expect(queryByTestId('weather-strip-good-conditions')).toBeTruthy()
      expect(getByText('Good conditions')).toBeTruthy()
      // No individual badges should be shown
      expect(queryByTestId('weather-strip-rain-badge')).toBeNull()
      expect(queryByTestId('weather-strip-wind-badge')).toBeNull()
      expect(queryByTestId('weather-strip-temp-badge')).toBeNull()
    })
  })

  describe('temperature as worst condition', () => {
    it('should show hot temperature badge when temperature is worst condition', () => {
      const overlays = createMockOverlays({
        rain: 'none',
        wind: 'low',
        temperature: 'hot',
      })

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      expect(queryByTestId('weather-strip-temp-badge')).toBeTruthy()
    })

    it('should show cold temperature badge when cold is worst condition', () => {
      const overlays = createMockOverlays({
        rain: 'none',
        wind: 'low',
        temperature: 'cold',
      })

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      expect(queryByTestId('weather-strip-temp-badge')).toBeTruthy()
    })
  })

  describe('priority order', () => {
    it('should prioritize rain over wind when severity is equal', () => {
      // Rain: moderate (severity 4), Wind: high (severity 4)
      // Rain should win due to priority tie-breaker
      const overlays = createMockOverlays({
        rain: 'moderate',
        wind: 'high',
        temperature: 'mild',
      })

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      expect(queryByTestId('weather-strip-rain-badge')).toBeTruthy()
      expect(queryByTestId('weather-strip-wind-badge')).toBeNull()
    })

    it('should prioritize wind over temperature when severity is equal', () => {
      // Wind: moderate (severity 3), Temp: warm (severity 3)
      // Wind should win due to priority tie-breaker
      const overlays = createMockOverlays({
        rain: 'none',
        wind: 'moderate',
        temperature: 'warm',
      })

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      expect(queryByTestId('weather-strip-wind-badge')).toBeTruthy()
      expect(queryByTestId('weather-strip-temp-badge')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle empty overlays gracefully', () => {
      const overlays: RouteOverlays = {
        rain: {
          generatedAt: Date.now(),
          modelVersion: 'test-v1',
          legend: [],
          byLeg: [],
        },
        wind: {
          generatedAt: Date.now(),
          modelVersion: 'test-v1',
          legend: [],
          byLeg: [],
        },
        temperature: {
          generatedAt: Date.now(),
          modelVersion: 'test-v1',
          legend: [],
          byLeg: [],
        },
      }

      const { queryByTestId } = renderWithPaper(
        <WeatherStrip overlays={overlays} testID="weather-strip" />,
      )

      // Should show good conditions since no bad weather is detected
      expect(queryByTestId('weather-strip-good-conditions')).toBeTruthy()
    })
  })
})
