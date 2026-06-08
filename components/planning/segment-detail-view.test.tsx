/**
 * Unit tests for segment-detail-view.tsx
 *
 * Acceptance Criteria:
 * - AC1: Route has 5 legs with varying weather conditions → User taps 'View segment details' → Expandable section shows all 5 legs with weather indicators
 * - AC2: Leg 3 has heavy rain condition → Segment detail view is expanded → Leg 3 row shows warning highlight and rain badge
 * - AC3: Segment detail view is expanded → User taps collapse button → View collapses smoothly with animation
 * - AC4: Route has only 1 leg → Segment detail view renders → Shows single segment without collapse controls (always expanded)
 */

import { fireEvent, render } from '@testing-library/react-native'
import { MD3DarkTheme, PaperProvider } from 'react-native-paper'
import { describe, expect, it, vi } from 'vitest'
import type { RouteLeg, RouteOverlays } from '../../server/models/saved-routes'
import type { ExtendedTheme } from '../../styles/types'
import { SegmentDetailView } from './segment-detail-view'

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

// Helper to create mock legs
const createLegs = (count: number): RouteLeg[] =>
  Array.from({ length: count }, (_, i) => ({
    legIndex: i,
    start: { lat: 37.7749 + i * 0.01, lng: -122.4194 + i * 0.01 },
    end: { lat: 37.7749 + (i + 1) * 0.01, lng: -122.4194 + (i + 1) * 0.01 },
    distanceMeters: 5000 + i * 1000,
    durationSeconds: 300 + i * 60,
    geometry: {
      format: 'polyline' as const,
      encoding: 'utf8',
      precision: 5,
      value: `encoded${i}`,
    },
  }))

// Helper to create mock overlays
const createOverlays = (
  legs: RouteLeg[],
  conditions: { rain?: string; wind?: string; temperature?: string }[],
): RouteOverlays => ({
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
    byLeg: legs.map((leg, i) => ({
      legIndex: leg.legIndex,
      segments: [
        {
          startMeters: 0,
          endMeters: leg.distanceMeters,
          level: conditions[i]?.rain ?? 'none',
          probability: conditions[i]?.rain !== 'none' ? 80 : undefined,
        },
      ],
    })),
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
    byLeg: legs.map((leg, i) => ({
      legIndex: leg.legIndex,
      segments: [
        {
          startMeters: 0,
          endMeters: leg.distanceMeters,
          level: conditions[i]?.wind ?? 'low',
        },
      ],
    })),
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
    byLeg: legs.map((leg, i) => ({
      legIndex: leg.legIndex,
      segments: [
        {
          startMeters: 0,
          endMeters: leg.distanceMeters,
          level: conditions[i]?.temperature ?? 'mild',
          temperatureCelsius: 20,
        },
      ],
    })),
  },
})

// Helper wrapper with PaperProvider
const renderWithPaper = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>)
}

describe('segment-detail-view', () => {
  /**
   * AC1: Route has 5 legs with varying weather conditions
   * → User taps 'View segment details' → Expandable section shows all 5 legs with weather indicators
   */
  describe('expand segments', () => {
    it('should satisfy AC1: expand and show all 5 legs with weather indicators', () => {
      const legs = createLegs(5)
      const overlays = createOverlays(legs, [
        { rain: 'none', wind: 'low', temperature: 'mild' },
        { rain: 'light', wind: 'low', temperature: 'mild' },
        { rain: 'moderate', wind: 'moderate', temperature: 'warm' },
        { rain: 'heavy', wind: 'high', temperature: 'hot' },
        { rain: 'none', wind: 'low', temperature: 'mild' },
      ])

      const { queryByTestId, getByText } = renderWithPaper(
        <SegmentDetailView legs={legs} overlays={overlays} testID="segment-detail-view" />,
      )

      // Initially collapsed: header present, segments not visible
      expect(getByText('View segment details')).toBeTruthy()
      expect(queryByTestId('segment-row-0')).toBeNull()
      expect(queryByTestId('segment-row-1')).toBeNull()

      // Tap header to expand
      fireEvent.press(getByText('View segment details'))

      // All segments should be visible
      expect(queryByTestId('segment-row-0')).toBeTruthy()
      expect(queryByTestId('segment-row-1')).toBeTruthy()
      expect(queryByTestId('segment-row-2')).toBeTruthy()
      expect(queryByTestId('segment-row-3')).toBeTruthy()
      expect(queryByTestId('segment-row-4')).toBeTruthy()

      // Weather badges should be present for legs with conditions
      expect(queryByTestId('segment-row-0-rain-badge')).toBeNull()
      expect(queryByTestId('segment-row-1-rain-badge')).toBeTruthy()
      expect(queryByTestId('segment-row-2-rain-badge')).toBeTruthy()
      expect(queryByTestId('segment-row-3-rain-badge')).toBeTruthy()
      expect(queryByTestId('segment-row-3-wind-badge')).toBeTruthy()
      expect(queryByTestId('segment-row-3-temp-badge')).toBeTruthy()
    })
  })

  /**
   * AC2: Leg 3 has heavy rain condition
   * → Segment detail view is expanded → Leg 3 row shows warning highlight and rain badge
   */
  describe('warning highlight', () => {
    it('should satisfy AC2: show warning highlight and rain badge for heavy rain leg', () => {
      const legs = createLegs(3)
      const overlays = createOverlays(legs, [
        { rain: 'none', wind: 'low', temperature: 'mild' },
        { rain: 'heavy', wind: 'moderate', temperature: 'warm' },
        { rain: 'none', wind: 'low', temperature: 'mild' },
      ])

      const { queryByTestId, getByText } = renderWithPaper(
        <SegmentDetailView legs={legs} overlays={overlays} testID="segment-detail-view" />,
      )

      // Expand view
      fireEvent.press(getByText('View segment details'))

      // Leg 1 (index 0) should have no warning
      expect(queryByTestId('segment-row-0-warning')).toBeNull()
      // Leg 2 (index 1) should have warning indicator
      expect(queryByTestId('segment-row-1-warning')).toBeTruthy()
      // Leg 3 (index 2) should have no warning
      expect(queryByTestId('segment-row-2-warning')).toBeNull()

      // Leg 2 should have rain badge
      expect(queryByTestId('segment-row-1-rain-badge')).toBeTruthy()
    })
  })

  /**
   * AC3: Segment detail view is expanded
   * → User taps collapse button → View collapses smoothly with animation
   * Note: Animation testing is limited; we test visibility toggling.
   */
  describe('collapse animation', () => {
    it('should satisfy AC3: collapse when header tapped again', () => {
      const legs = createLegs(3)
      const overlays = createOverlays(legs, [
        { rain: 'none', wind: 'low', temperature: 'mild' },
        { rain: 'moderate', wind: 'low', temperature: 'mild' },
        { rain: 'none', wind: 'low', temperature: 'mild' },
      ])

      const { queryByTestId, getByText } = renderWithPaper(
        <SegmentDetailView legs={legs} overlays={overlays} testID="segment-detail-view" />,
      )

      // Initially collapsed
      expect(queryByTestId('segment-row-0')).toBeNull()

      // Tap to expand
      fireEvent.press(getByText('View segment details'))
      expect(queryByTestId('segment-row-0')).toBeTruthy()

      // Tap to collapse
      fireEvent.press(getByText('View segment details'))
      expect(queryByTestId('segment-row-0')).toBeNull()
    })
  })

  /**
   * AC4: Route has only 1 leg
   * → Segment detail view renders → Shows single segment without collapse controls (always expanded)
   */
  describe('single segment', () => {
    it('should satisfy AC4: show single segment without collapse controls', () => {
      const legs = createLegs(1)
      const overlays = createOverlays(legs, [
        { rain: 'moderate', wind: 'low', temperature: 'warm' },
      ])

      const { queryByTestId, queryByText } = renderWithPaper(
        <SegmentDetailView legs={legs} overlays={overlays} testID="segment-detail-view" />,
      )

      // No header text "View segment details"
      expect(queryByText('View segment details')).toBeNull()
      // Segment row should be directly visible
      expect(queryByTestId('segment-row-0')).toBeTruthy()
      // Should have rain badge
      expect(queryByTestId('segment-row-0-rain-badge')).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle empty legs array gracefully', () => {
      const overlays = createOverlays([], [])
      const { queryByTestId } = renderWithPaper(
        <SegmentDetailView legs={[]} overlays={overlays} testID="segment-detail-view" />,
      )
      // Should render without crashing
      expect(queryByTestId('segment-detail-view')).toBeTruthy()
    })

    it('should handle missing overlays gracefully', () => {
      const legs = createLegs(2)
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
      const { queryByTestId, getByText } = renderWithPaper(
        <SegmentDetailView legs={legs} overlays={overlays} testID="segment-detail-view" />,
      )
      fireEvent.press(getByText('View segment details'))
      // Segments should render without weather badges
      expect(queryByTestId('segment-row-0')).toBeTruthy()
      expect(queryByTestId('segment-row-0-rain-badge')).toBeNull()
    })
  })
})
