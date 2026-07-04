/**
 * Unit tests for RoutingCard component
 *
 * Acceptance Criteria:
 * - AC1: pending status → shows "Preparing route…" card
 * - AC2: running status → shows phase pills; active pill matches routePlan.phase
 * - AC3: completed status → morphs into RouteAttachmentCard list
 * - AC4: failed status → shows error card with errorMessage
 * - AC5: cancelled status → shows "Cancelled" text
 *
 * Mock strategy:
 * - useQuery (convex/react) returns controlled fixture per test
 * - react-native-reanimated is stubbed to avoid native module requirements
 * - RouteAttachmentCard is stubbed to avoid deep dependency chain
 * - useSemanticTheme is stubbed with a minimal token set
 */

import { render } from '@testing-library/react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExtendedTheme } from '../../styles/types'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import type { RoutingCardProps } from './routing-card'
import { RoutingCard } from './routing-card'

// ---------------------------------------------------------------------------
// Mock: react-native-reanimated
// All animation primitives are no-ops in tests.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock: react-native AccessibilityInfo.isReduceMotionEnabled
// The base __mocks__/react-native.ts doesn't include this method.
// ---------------------------------------------------------------------------

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    AccessibilityInfo: {
      ...(actual as any).AccessibilityInfo,
      isReduceMotionEnabled: () => Promise.resolve(false),
    },
  }
})

vi.mock('react-native-reanimated', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')

  const useSharedValue = (initial: unknown) => ({ value: initial })
  const useAnimatedStyle = (fn: () => Record<string, unknown>) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
    return {}
  }
  const withRepeat = (_a: unknown) => undefined
  const withSequence = (..._args: unknown[]) => undefined
  const withTiming = (_val: unknown, _cfg?: unknown) => undefined

  const AnimatedView = (props: Record<string, unknown>) => createElement(View, props)
  AnimatedView.displayName = 'AnimatedView'

  return {
    __esModule: true,
    default: { View: AnimatedView },
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    // Animated namespace exported as default
  }
})

// ---------------------------------------------------------------------------
// Mock: semantic theme
// ---------------------------------------------------------------------------

const mockSemantic: ExtendedTheme['semantic'] = {
  color: {
    primary: {
      default: '#B87333',
      hover: '#C98544',
      pressed: '#9A6229',
      disabled: '#4A4458',
      focus: '#B87333',
    },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    warningContainer: { default: 'FFF8E7' },
    onWarningContainer: { default: '#5C3E00' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    surface: { default: '#141218' },
    surfaceVariant: { default: '#2B2930', pressed: '#3C3633' },
    background: { default: '#141218' },
    onSurface: {
      default: '#E6E0E9',
      muted: '#938F99',
      subtle: '#79747E',
      disabled: '#4A4458',
    },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#4A4458' },
    onSecondaryContainer: { default: '#E8DEF8', muted: '#938F99', subtle: '#79747E' },
    border: { default: '#49454F' },
    input: { default: '#49454F' },
    ring: { default: '#B87333' },
    locationPoiFill: { default: '#EDEDED' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8' },
    card: { default: '#1C1B1F' },
    popover: { default: '#1C1B1F' },
    accent: { default: '#FF6B35' },
    orange: { default: '#fb923c' },
    muted: { default: '#938F99' },
    divider: { default: '#49454F' },
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 5,
    },
  },
}

vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemantic }),
}))

// ---------------------------------------------------------------------------
// Mock: convex/react — useQuery controlled by vi.fn()
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// ---------------------------------------------------------------------------
// Mock: RouteAttachmentCard — lightweight stub with testID
// ---------------------------------------------------------------------------

vi.mock('./route-attachment-card', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')
  return {
    RouteAttachmentCard: (props: Record<string, unknown>) => {
      const route = props.route as { routeOptionId?: string } | undefined
      return createElement(View, { testID: props.testID ?? `route-card-${route?.routeOptionId}` })
    },
  }
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_MESSAGE: RoutingCardProps['message'] = {
  _id: 'session_messages:msg1' as any,
  createdAt: Date.now(),
  content: 'Planning your route…',
  status: 'running',
}

const BASE_ATTACHMENTS: RoutingCardProps['attachments'] = [
  {
    type: 'route_options',
    routePlanId: 'route_plans:plan1' as any,
  },
]

const MOCK_RESULT = {
  planId: 'plan1',
  options: [
    {
      routeOptionId: 'opt-1',
      label: 'Coastal Cruiser',
      rationale: 'Scenic coastal route',
      stats: { distanceMeters: 67000, durationSeconds: 5400, legsCount: 2 },
      map: {
        bounds: {
          northeast: { lat: 37.8, lng: -122.3 },
          southwest: { lat: 37.7, lng: -122.5 },
        },
        overviewGeometry: { encodedPolyline: 'mock' },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'light' as any,
        rainSummary: 'none' as any,
        temperatureSummary: 'mild' as any,
        conditionsStatus: 'ok' as const,
      },
    },
    {
      routeOptionId: 'opt-2',
      label: 'Mountain Loop',
      rationale: 'Elevated views',
      stats: { distanceMeters: 55000, durationSeconds: 4800, legsCount: 3 },
      map: {
        bounds: {
          northeast: { lat: 37.9, lng: -122.2 },
          southwest: { lat: 37.6, lng: -122.6 },
        },
        overviewGeometry: { encodedPolyline: 'mock2' },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'light' as any,
        rainSummary: 'none' as any,
        temperatureSummary: 'cool' as any,
        conditionsStatus: 'ok' as const,
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RoutingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // AC1: pending state
  // -------------------------------------------------------------------------

  describe('AC1: pending state', () => {
    it('renders the pending card when useQuery returns undefined (loading)', () => {
      mockUseQuery.mockReturnValue(undefined)

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-pending')).toBeTruthy()
    })

    it('renders the pending card when routePlan.status is "pending"', () => {
      mockUseQuery.mockReturnValue({ _id: 'plan1', status: 'pending' })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-pending')).toBeTruthy()
    })

    it('shows "Preparing route…" text in pending state', () => {
      mockUseQuery.mockReturnValue({ _id: 'plan1', status: 'pending' })

      const { getByText } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByText('Preparing route…')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // AC2: running state — phase pills
  // -------------------------------------------------------------------------

  describe('AC2: running state with phase pills', () => {
    it('renders the running card when status is "running"', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'running',
        phase: 'reading',
        statusMessage: 'Reading your preferences…',
      })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-running')).toBeTruthy()
    })

    it('renders all four phase pills', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'running',
        phase: 'finding',
      })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('phase-pill-reading')).toBeTruthy()
      expect(getByTestId('phase-pill-finding')).toBeTruthy()
      expect(getByTestId('phase-pill-weather')).toBeTruthy()
      expect(getByTestId('phase-pill-building')).toBeTruthy()
    })

    it('shows statusMessage below the pills', () => {
      const statusMessage = 'Finding scenic roads…'
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'running',
        phase: 'finding',
        statusMessage,
      })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      const msgEl = getByTestId('routing-card-status-message')
      expect(msgEl).toBeTruthy()
    })

    it('shows fallback status text when statusMessage is absent', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'running',
        phase: 'weather',
      })

      const { getByText } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByText('Planning route…')).toBeTruthy()
    })

    it('renders without crashing when phase is undefined', () => {
      mockUseQuery.mockReturnValue({ _id: 'plan1', status: 'running' })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-running')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // AC3: completed state — morphs into route cards
  // -------------------------------------------------------------------------

  describe('AC3: completed state with route cards', () => {
    it('renders the completed card when status is "completed"', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'completed',
        result: MOCK_RESULT,
      })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-completed')).toBeTruthy()
    })

    it('renders a RouteAttachmentCard for each route option', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'completed',
        result: MOCK_RESULT,
      })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-route-opt-1')).toBeTruthy()
      expect(getByTestId('routing-card-route-opt-2')).toBeTruthy()
    })

    it('deduplicates identical route variants before rendering chat cards', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'completed',
        result: {
          ...MOCK_RESULT,
          options: [
            MOCK_RESULT.options[0],
            {
              ...MOCK_RESULT.options[0],
              routeOptionId: 'opt-1-duplicate',
            },
          ],
        },
      })

      const { getByTestId, queryByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-route-opt-1')).toBeTruthy()
      expect(queryByTestId('routing-card-route-opt-1-duplicate')).toBeNull()
    })

    it('falls back to pending when status is completed but result is missing', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'completed',
        result: undefined,
      })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-pending')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // AC4: failed state
  // -------------------------------------------------------------------------

  describe('AC4: failed state', () => {
    it('renders the failed card when status is "failed"', () => {
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'failed',
        errorMessage: 'No routes found for that destination.',
      })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-failed')).toBeTruthy()
    })

    it('shows the errorMessage when provided', () => {
      const errorMessage = 'No routes found for that destination.'
      mockUseQuery.mockReturnValue({
        _id: 'plan1',
        status: 'failed',
        errorMessage,
      })

      const { getByText } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByText(errorMessage)).toBeTruthy()
    })

    it('shows fallback "Planning failed." when errorMessage is absent', () => {
      mockUseQuery.mockReturnValue({ _id: 'plan1', status: 'failed' })

      const { getByText } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByText('Planning failed.')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // AC5: cancelled state
  // -------------------------------------------------------------------------

  describe('AC5: cancelled state', () => {
    it('renders the cancelled card when status is "cancelled"', () => {
      mockUseQuery.mockReturnValue({ _id: 'plan1', status: 'cancelled' })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card-cancelled')).toBeTruthy()
    })

    it('shows "Cancelled" text', () => {
      mockUseQuery.mockReturnValue({ _id: 'plan1', status: 'cancelled' })

      const { getByText } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByText('Cancelled')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // Container / wrapper
  // -------------------------------------------------------------------------

  describe('container', () => {
    it('renders the outer routing-card testID wrapper', () => {
      mockUseQuery.mockReturnValue({ _id: 'plan1', status: 'pending' })

      const { getByTestId } = render(
        <RoutingCard message={BASE_MESSAGE} attachments={BASE_ATTACHMENTS} />,
      )
      expect(getByTestId('routing-card')).toBeTruthy()
    })

    it('does not crash when attachments array is empty', () => {
      mockUseQuery.mockReturnValue(undefined)

      expect(() => render(<RoutingCard message={BASE_MESSAGE} attachments={[]} />)).not.toThrow()
    })
  })
})
