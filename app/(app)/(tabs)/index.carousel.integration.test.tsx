/**
 * RUX-001 Integration Tests: Route Summary Carousel
 *
 * Tests the RouteSummaryCarousel component that replaces the bottom
 * compact-route-card stack with a single paged route-summary card
 * flanked by carousel arrows above the chat input.
 *
 * AC-1: Single carousel card pages between distinct routes (>=2 routes).
 * AC-2: Single distinct route hides the carousel arrows.
 * AC-3: Prev arrow disabled at first route, next disabled at last; disabled press is no-op.
 * AC-4: Covered by lib/routes/dedupe-route-options.test.ts (unit test).
 *
 * Test tier: integration (renders the real RouteSummaryCarousel component
 * with its internal RouteAttachmentCard child, but with mocked theme/hooks).
 */

import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RouteSummaryCarousel } from '../../../components/map/route-summary-carousel'
import type { PlannedRouteOptionView } from '../../../shared/types/routes'

// ---------------------------------------------------------------------------
// Mock: semantic theme (provides full token set for component styling)
// ---------------------------------------------------------------------------

const mockSemantic = {
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
      subtle: '#CAC4D0',
    },
    onPrimary: {
      default: '#FFFFFF',
    },
    border: { default: '#49454F' },
  } as any,
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  } as any,
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  } as any,
  elevation: {
    1: { shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    3: { shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  } as any,
  type: {
    label: { sm: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 } },
    body: { sm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const } },
  } as any,
  control: {
    minTouchTarget: 44,
  } as any,
}

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemantic, dark: false }),
}))

// ---------------------------------------------------------------------------
// Mock: RouteDirectionsSheet (opens on compact card tap)
// ---------------------------------------------------------------------------

vi.mock('../../../components/sheets/route-directions-sheet', () => ({
  RouteDirectionsSheet: () => null,
}))

// ---------------------------------------------------------------------------
// Mock: RouteMiniMap (rendered inside RouteAttachmentCard full variant)
// ---------------------------------------------------------------------------

vi.mock('../../../components/chat/cards/route-mini-map', () => ({
  RouteMiniMap: () => null,
}))

// ---------------------------------------------------------------------------
// Mock: Badge component
// ---------------------------------------------------------------------------

vi.mock('../../../components/ui/badge', () => ({
  Badge: ({ children, testID }: any) => React.createElement('View', { testID }, children),
}))

// ---------------------------------------------------------------------------
// Test fixtures — minimal PlannedRouteOptionView objects
// ---------------------------------------------------------------------------

const createRouteOption = (
  id: string,
  label: string,
  distanceMeters: number,
  geometry: string | undefined = `geo_${id}`,
): PlannedRouteOptionView => ({
  routeOptionId: id,
  label,
  rationale: `Route ${id}`,
  stats: {
    distanceMeters,
    durationSeconds: Math.round(distanceMeters / 15), // rough
    legsCount: 1,
  },
  map: {
    bounds: { minX: -122.5, maxX: -122.0, minY: 37.7, maxY: 37.8 },
    overviewGeometry: geometry,
    legs: [
      {
        start: { lat: 37.77, lng: -122.42, label: 'Start', placeId: 'start' },
        end: { lat: 37.79, lng: -122.4, label: 'End', placeId: 'end' },
        distanceMeters,
        durationSeconds: Math.round(distanceMeters / 15),
        geometry: {
          format: 'polyline' as const,
          encoding: 'google',
          precision: 5,
          value: geometry ?? '',
        },
        legIndex: 0,
        steps: [],
      },
    ],
  },
  overlaysPreview: {
    windSummary: 'low' as const,
    rainSummary: 'none' as const,
    temperatureSummary: 'mild' as const,
    conditionsStatus: 'ok' as const,
  },
})

const routeA = createRouteOption('route-efficient', 'Efficient', 103_000, 'geo_A')
const routeB = createRouteOption('route-scenic', 'Scenic Coastal', 125_000, 'geo_B')
const routeC = createRouteOption('route-twisties', 'Twisties', 140_000, 'geo_C')

// ---------------------------------------------------------------------------
// Default props helper
// ---------------------------------------------------------------------------

const defaultProps = {
  selectedRouteId: 'route-efficient' as string | null,
  onCardPress: vi.fn(),
  onRouteChange: vi.fn(),
  hasActiveRoute: true,
  bottomOffset: 80,
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('RouteSummaryCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1: Single carousel card pages between distinct routes
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-1: pagesBetweenDistinctRoutes', () => {
    it('pagesBetweenDistinctRoutes', () => {
      // GIVEN the carousel with 2 distinct routes
      const onRouteChange = vi.fn()
      const { rerender } = render(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA, routeB]}
          selectedRouteId="route-efficient"
          onRouteChange={onRouteChange}
        />,
      )

      // THEN exactly one route-summary-card is shown
      const cards = screen.queryAllByTestId('route-summary-card')
      expect(cards).toHaveLength(1)

      // THEN the card shows the first route's label
      // (RouteAttachmentCard compact variant shows start→end, not the label directly)
      // Verify the card is present with the first route selected
      const card = screen.getByTestId('route-summary-card')
      expect(card).toBeTruthy()

      // WHEN the rider presses the next arrow
      const nextArrow = screen.getByTestId('route-carousel-next-arrow')
      expect(nextArrow).toBeTruthy()
      fireEvent.press(nextArrow)

      // THEN onRouteChange is called with the next route's ID
      expect(onRouteChange).toHaveBeenCalledWith('route-scenic')

      // Rerender with the new selectedRouteId to simulate parent state update
      rerender(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA, routeB]}
          selectedRouteId="route-scenic"
          onRouteChange={onRouteChange}
        />,
      )

      // THEN exactly one card is still shown (no stack of cards)
      const cardsAfter = screen.queryAllByTestId('route-summary-card')
      expect(cardsAfter).toHaveLength(1)

      // THEN the card is still present (not vanished)
      expect(screen.getByTestId('route-summary-card')).toBeTruthy()
    })

    it('shows exactly one card — never multiple stacked cards', () => {
      // GIVEN 3 distinct routes
      render(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA, routeB, routeC]}
          selectedRouteId="route-efficient"
        />,
      )

      // THEN only one card renders at a time
      expect(screen.queryAllByTestId('route-summary-card')).toHaveLength(1)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2: Single distinct route hides the carousel arrows
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-2: singleRouteHidesArrows', () => {
    it('singleRouteHidesArrows', () => {
      // GIVEN options that dedupe to exactly ONE distinct route
      render(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA]}
          selectedRouteId="route-efficient"
        />,
      )

      // THEN the card shows without prev/next arrows
      expect(screen.getByTestId('route-summary-card')).toBeTruthy()
      expect(screen.queryByTestId('route-carousel-prev-arrow')).toBeNull()
      expect(screen.queryByTestId('route-carousel-next-arrow')).toBeNull()
    })

    it('card renders even with one route', () => {
      // GIVEN one route
      render(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA]}
          selectedRouteId="route-efficient"
        />,
      )

      // THEN the card is visible
      expect(screen.getByTestId('route-summary-card')).toBeTruthy()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: Prev arrow disabled at first route, next disabled at last
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-3: arrowsDisabledAtEnds', () => {
    it('arrowsDisabledAtEnds', () => {
      // GIVEN >=3 distinct routes
      const onRouteChange = vi.fn()
      render(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA, routeB, routeC]}
          selectedRouteId="route-efficient"
          onRouteChange={onRouteChange}
        />,
      )

      // WHEN at the FIRST route
      const prevArrow = screen.getByTestId('route-carousel-prev-arrow')
      const nextArrow = screen.getByTestId('route-carousel-next-arrow')

      // THEN prev arrow is disabled
      expect(prevArrow.props.accessibilityState.disabled).toBe(true)

      // AND pressing the disabled prev arrow is a no-op
      fireEvent.press(prevArrow)
      expect(onRouteChange).not.toHaveBeenCalled()

      // Press next to advance to index 1
      fireEvent.press(nextArrow)
      expect(onRouteChange).toHaveBeenCalledWith('route-scenic')
      onRouteChange.mockClear()

      // Rerender at index 1 (simulate selectRoute fired)
      // NOTE: The carousel manages its own internal currentIndex via useState.
      // After pressing next, the internal index advances to 1.
      // We just need to verify the prev arrow is no longer disabled at index 1.
      expect(prevArrow.props.accessibilityState.disabled).toBe(false)

      // Press next again to get to the last route (index 2)
      fireEvent.press(nextArrow)
      expect(onRouteChange).toHaveBeenCalledWith('route-twisties')
      onRouteChange.mockClear()

      // THEN at the LAST route, the next arrow is disabled
      expect(nextArrow.props.accessibilityState.disabled).toBe(true)

      // AND pressing the disabled next arrow is a no-op on selectedRouteId
      fireEvent.press(nextArrow)
      expect(onRouteChange).not.toHaveBeenCalled()
    })

    it('prev arrow is enabled at non-first index', () => {
      // GIVEN 2 routes, starting at index 0
      const onRouteChange = vi.fn()
      render(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA, routeB]}
          selectedRouteId="route-efficient"
          onRouteChange={onRouteChange}
        />,
      )

      // At first index, prev is disabled
      const prevArrow = screen.getByTestId('route-carousel-prev-arrow')
      expect(prevArrow.props.accessibilityState.disabled).toBe(true)

      // Press next to advance
      const nextArrow = screen.getByTestId('route-carousel-next-arrow')
      fireEvent.press(nextArrow)

      // Now prev should be enabled
      expect(prevArrow.props.accessibilityState.disabled).toBe(false)
    })

    it('next arrow is enabled at non-last index', () => {
      // GIVEN 2 routes
      render(
        <RouteSummaryCarousel
          {...defaultProps}
          distinctRoutes={[routeA, routeB]}
          selectedRouteId="route-efficient"
        />,
      )

      // At first index, next is enabled
      const nextArrow = screen.getByTestId('route-carousel-next-arrow')
      expect(nextArrow.props.accessibilityState.disabled).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Carousel visibility
  // ─────────────────────────────────────────────────────────────────────────
  describe('carousel visibility', () => {
    it('hides when hasActiveRoute is false', () => {
      render(
        <RouteSummaryCarousel {...defaultProps} distinctRoutes={[routeA]} hasActiveRoute={false} />,
      )

      expect(screen.queryByTestId('route-carousel-container')).toBeNull()
      expect(screen.queryByTestId('route-summary-card')).toBeNull()
    })

    it('hides when distinctRoutes is empty', () => {
      render(<RouteSummaryCarousel {...defaultProps} distinctRoutes={[]} hasActiveRoute={true} />)

      expect(screen.queryByTestId('route-carousel-container')).toBeNull()
    })
  })
})
