/**
 * Unit tests for route-leg-timeline.tsx
 *
 * Acceptance Criteria:
 * - AC1: Route with 3 legs → timeline shows start/end labels, each leg has distance,
 *         duration, weather badges
 * - AC2: Route with 1 leg → single leg entry, no extra separators
 * - AC3: Leg has no label → falls back to 'Waypoint N' (uses leg index)
 * - AC4: Empty legs array → timeline section hidden, no crash
 */

import { vi, describe, it, expect } from 'vitest'
import { render } from '@testing-library/react-native'
import { PaperProvider, MD3DarkTheme } from 'react-native-paper'
import { RouteLegTimeline } from './route-leg-timeline'
import type { RouteLegTimelineProps } from './route-leg-timeline'
import type { ExtendedTheme } from '../../styles/types'
import type { RouteLeg, PlanInput, RouteOverlays } from '../../models/saved-routes'

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    surface: { default: '#FEF7FF' },
    surfaceVariant: { default: '#E7E0EC' },
    background: { default: '#FEF7FF' },
    onSurface: {
      default: '#1D1B20',
      muted: '#49454F',
      subtle: '#79747E',
      disabled: '#9CA3AF',
    },
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
    0: { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 5 },
  },
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

vi.mock('expo-linear-gradient', () => {
  const { View } = require('react-native')
  return {
    LinearGradient: (props: Record<string, unknown>) => {
      const { colors: _colors, start: _start, end: _end, ...rest } = props
      return <View testID="linear-gradient" {...rest} />
    },
  }
})

// Mock WindBadge and RainBadge - they have their own test coverage
// and wind-badge uses @expo/vector-icons which requires extra babel transform
vi.mock('../planning/wind-badge', () => {
  const { View, Text } = require('react-native')
  return {
    WindBadge: ({ windLevel, testID }: { windLevel: string; testID?: string }) => (
      <View testID={testID}>
        <Text>{windLevel}</Text>
      </View>
    ),
  }
})

vi.mock('./rain-badge', () => {
  const { View, Text } = require('react-native')
  return {
    RainBadge: ({ rainSummary, testID }: { rainSummary: string; testID?: string }) => (
      <View testID={testID}>
        <Text>{rainSummary}</Text>
      </View>
    ),
  }
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeLeg = (legIndex: number, overrides: Partial<RouteLeg> = {}): RouteLeg => ({
  legIndex,
  start: { lat: 34.0 + legIndex * 0.1, lng: -118.0 - legIndex * 0.1, label: `Stop ${legIndex}` },
  end: { lat: 34.1 + legIndex * 0.1, lng: -118.1 - legIndex * 0.1, label: `Stop ${legIndex + 1}` },
  distanceMeters: 10000 * (legIndex + 1),
  durationSeconds: 600 * (legIndex + 1),
  geometry: { format: 'polyline', encoding: 'google', precision: 5, value: 'abc' },
  ...overrides,
})

const planInput: PlanInput = {
  start: { lat: 34.0, lng: -118.0, label: 'Home' },
  end: { lat: 34.3, lng: -118.3, label: 'Destination' },
  departureTime: 1700000000000,
  preferences: { scenicBias: 'default' },
}

const overlays: RouteOverlays = {
  rain: {
    generatedAt: 1700000000000,
    modelVersion: '1.0',
    legend: [],
    byLeg: [
      { legIndex: 0, segments: [{ startMeters: 0, endMeters: 5000, level: 'light' }] },
      { legIndex: 1, segments: [{ startMeters: 0, endMeters: 5000, level: 'moderate' }] },
      { legIndex: 2, segments: [{ startMeters: 0, endMeters: 5000, level: 'none' }] },
    ],
  },
  wind: {
    generatedAt: 1700000000000,
    modelVersion: '1.0',
    legend: [],
    byLeg: [
      { legIndex: 0, segments: [{ startMeters: 0, endMeters: 5000, level: 'low' }] },
      { legIndex: 1, segments: [{ startMeters: 0, endMeters: 5000, level: 'high' }] },
      { legIndex: 2, segments: [{ startMeters: 0, endMeters: 5000, level: 'moderate' }] },
    ],
  },
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

const renderWithPaper = (ui: React.ReactElement) => {
  return render(
    <PaperProvider theme={MD3DarkTheme}>
      {ui}
    </PaperProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RouteLegTimeline', () => {
  /**
   * AC1: Route with 3 legs
   * → timeline shows start/end labels, each leg has distance, duration, weather badges
   */
  describe('AC1: 3-leg route renders all leg content', () => {
    const legs = [makeLeg(0), makeLeg(1), makeLeg(2)]

    it('renders the timeline container', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('timeline')).toBeTruthy()
    })

    it('renders all 3 leg items', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-item-0')).toBeTruthy()
      expect(getByTestId('leg-item-1')).toBeTruthy()
      expect(getByTestId('leg-item-2')).toBeTruthy()
    })

    it('renders distance for each leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-distance-0')).toBeTruthy()
      expect(getByTestId('leg-distance-1')).toBeTruthy()
      expect(getByTestId('leg-distance-2')).toBeTruthy()
    })

    it('renders duration for each leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-duration-0')).toBeTruthy()
      expect(getByTestId('leg-duration-1')).toBeTruthy()
      expect(getByTestId('leg-duration-2')).toBeTruthy()
    })

    it('renders wind badge for each leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-wind-badge-0')).toBeTruthy()
      expect(getByTestId('leg-wind-badge-1')).toBeTruthy()
      expect(getByTestId('leg-wind-badge-2')).toBeTruthy()
    })

    it('renders rain badge for each leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-rain-badge-0')).toBeTruthy()
      expect(getByTestId('leg-rain-badge-1')).toBeTruthy()
      expect(getByTestId('leg-rain-badge-2')).toBeTruthy()
    })

    it('shows planInput start label as first leg start label', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      const startLabel = getByTestId('leg-start-label-0')
      expect(startLabel.props.children).toBe('Home')
    })

    it('shows planInput end label below last leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      const endLabel = getByTestId('leg-end-label-2')
      expect(endLabel.props.children).toBe('Destination')
    })

    it('renders gradient connectors (LinearGradient) for each leg', () => {
      const { getAllByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      const connectors = getAllByTestId(/^leg-connector-/)
      expect(connectors).toHaveLength(3)
    })

    it('renders start dot for first leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-start-dot-0')).toBeTruthy()
    })

    it('renders end dot on last leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-end-dot-2')).toBeTruthy()
    })
  })

  /**
   * AC2: Route with 1 leg (direct route)
   * → single leg entry shown with start and end labels, no extra separators
   */
  describe('AC2: 1-leg route renders correctly', () => {
    const legs = [makeLeg(0)]

    it('renders the timeline', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('timeline')).toBeTruthy()
    })

    it('renders exactly one leg item', () => {
      const { getByTestId, queryByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-item-0')).toBeTruthy()
      expect(queryByTestId('leg-item-1')).toBeNull()
    })

    it('shows start label from planInput', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      const startLabel = getByTestId('leg-start-label-0')
      expect(startLabel.props.children).toBe('Home')
    })

    it('shows end label from planInput on single leg', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      const endLabel = getByTestId('leg-end-label-0')
      expect(endLabel.props.children).toBe('Destination')
    })

    it('renders end dot on the only leg (isLast)', () => {
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(getByTestId('leg-end-dot-0')).toBeTruthy()
    })

    it('does NOT render waypoint dot (no intermediate stop)', () => {
      const { queryByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} overlays={overlays} testID="timeline" />
      )
      expect(queryByTestId('leg-waypoint-dot-0')).toBeNull()
    })
  })

  /**
   * AC3: A leg has no label → falls back to 'Waypoint N' (uses leg index)
   */
  describe('AC3: fallback label for legs with no label', () => {
    it('uses "Waypoint 1" when planInput.start has no label and it is the first leg', () => {
      const noLabelPlanInput: PlanInput = {
        ...planInput,
        start: { lat: 34.0, lng: -118.0 }, // no label
      }
      const legs = [makeLeg(0)]

      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={noLabelPlanInput} testID="timeline" />
      )
      const startLabel = getByTestId('leg-start-label-0')
      expect(startLabel.props.children).toBe('Waypoint 1')
    })

    it('uses leg start label or Waypoint N for intermediate legs', () => {
      const legs = [
        makeLeg(0, { start: { lat: 34.0, lng: -118.0 }, end: { lat: 34.1, lng: -118.1 } }),
        makeLeg(1, { start: { lat: 34.1, lng: -118.1 }, end: { lat: 34.2, lng: -118.2 } }),
      ]

      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} testID="timeline" />
      )
      // Second leg has no label on start → falls back to Waypoint 2
      const secondLegStart = getByTestId('leg-start-label-1')
      expect(secondLegStart.props.children).toBe('Waypoint 2')
    })
  })

  /**
   * AC4: Empty legs array → timeline section hidden, no crash
   */
  describe('AC4: empty legs → renders nothing', () => {
    it('returns null for empty legs array (no crash)', () => {
      const { queryByTestId } = renderWithPaper(
        <RouteLegTimeline legs={[]} planInput={planInput} testID="timeline" />
      )
      expect(queryByTestId('timeline')).toBeNull()
    })

    it('does not throw when legs is empty', () => {
      expect(() =>
        renderWithPaper(
          <RouteLegTimeline legs={[]} planInput={planInput} testID="timeline" />
        )
      ).not.toThrow()
    })
  })

  /**
   * Additional: no overlays → weather badges still render (with unavailable state)
   */
  describe('no overlays provided', () => {
    it('renders without overlays (graceful fallback)', () => {
      const legs = [makeLeg(0)]
      const { getByTestId } = renderWithPaper(
        <RouteLegTimeline legs={legs} planInput={planInput} testID="timeline" />
      )
      expect(getByTestId('timeline')).toBeTruthy()
      expect(getByTestId('leg-wind-badge-0')).toBeTruthy()
      expect(getByTestId('leg-rain-badge-0')).toBeTruthy()
    })
  })
})
