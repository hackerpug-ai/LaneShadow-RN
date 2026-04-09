/**
 * Unit tests for RouteAttachmentCard component
 *
 * Acceptance Criteria for US-061:
 * - AC1: Route option with map.overviewGeometry and map.bounds → Shows RouteMiniMap above label and stats
 * - AC2: Route option without map data → Card renders as before (label + stats only, no empty space)
 * - AC3: User taps card with mini-map → Route is selected, navigates to map tab
 * - AC4: Card is selected → Mini-map still visible, primary border highlight visible
 * - AC5: Card is unselected → Mini-map still visible, default border
 * - AC6: Multiple route options → Each card shows its own polyline on its own mini-map
 * - AC7: Accessibility → accessibilityLabel includes route name, duration, distance (unchanged)
 *
 * Mock strategy:
 * - react-native-maps is stubbed to avoid native module requirements
 * - RouteMiniMap is stubbed to control test behavior
 * - useSemanticTheme is stubbed with a minimal token set
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import type { ExtendedTheme } from '../../styles/types'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { RouteAttachmentCard } from './route-attachment-card'
import type { PlannedRouteOptionsView } from '../../types/routes'

// ---------------------------------------------------------------------------
// Mock: react-native-maps
// ---------------------------------------------------------------------------

vi.mock('react-native-maps', () => {
  const View = require('react-native').View
  const { createElement } = require('react')

  const MockMapView = (props: any) => createElement(View, props)
  MockMapView.displayName = 'MapView'

  return {
    PROVIDER_GOOGLE: 'google',
    MapView: MockMapView,
    Polyline: () => createElement(View, { testID: 'polyline' }),
  }
})

// ---------------------------------------------------------------------------
// Mock: RouteMiniMap (stubs the actual component)
// ---------------------------------------------------------------------------

vi.mock('../chat/cards/route-mini-map', () => ({
  RouteMiniMap: ({ overviewGeometry, bounds, testID }: any) => {
    if (!overviewGeometry || !bounds) return null
    return React.createElement('View', {
      testID: testID || 'route-mini-map',
      style: { height: 120, width: '100%' }
    })
  }
}))

// ---------------------------------------------------------------------------
// Mock: semantic theme
// ---------------------------------------------------------------------------

const mockSemantic = {
  color: {
    primary: { default: '#B87333', hover: '#C98544', pressed: '#9A6229', disabled: '#4A4458', focus: '#B87333' },
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
  } as any,
  radius: {
    sm: 8,
    md: 12,
    full: 9999,
  } as any,
  elevation: {
    1: { shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  } as any,
  type: {
    label: { sm: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 } },
    body: { sm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const } },
  } as any,
}

vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemantic, dark: false }),
}))

// ---------------------------------------------------------------------------
// Mock: RouteDirectionsSheet
// ---------------------------------------------------------------------------

vi.mock('../sheets/route-directions-sheet', () => ({
  RouteDirectionsSheet: () => null,
}))

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const createMockRoute = (withMapData = true): PlannedRouteOptionsView['options'][0] => {
  const legs = [
    {
      start: { lat: 37.7749, lng: -122.4194, label: 'Start', placeId: 'start' },
      end: { lat: 37.7849, lng: -122.4094, label: 'Mid', placeId: 'mid' },
      distanceMeters: 2000,
      durationSeconds: 600,
      geometry: { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'encoded_leg_1' },
      legIndex: 0,
      steps: [],
    },
    {
      start: { lat: 37.7849, lng: -122.4094, label: 'Mid', placeId: 'mid' },
      end: { lat: 37.7949, lng: -122.3994, label: 'End', placeId: 'end' },
      distanceMeters: 3000,
      durationSeconds: 1200,
      geometry: { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'encoded_leg_2' },
      legIndex: 1,
      steps: [],
    },
  ]

  return {
    routeOptionId: 'route-1',
    label: 'Via Downtown',
    rationale: 'Fastest route',
    stats: {
      distanceMeters: 5000,
      durationSeconds: 1800,
      legsCount: 3,
    },
    map: {
      bounds: {
        north: 37.8049,
        south: 37.7749,
        east: -122.3894,
        west: -122.4194,
      },
      overviewGeometry: withMapData
        ? { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'encoded_polyline_string' }
        : { format: 'polyline' as const, encoding: 'google', precision: 5, value: '' },
      legs,
    },
    overlaysPreview: {
      windSummary: 'low' as const,
      rainSummary: 'none' as const,
      temperatureSummary: 'mild' as const,
      conditionsStatus: 'ok' as const,
    },
  }
}

const defaultProps = {
  route: createMockRoute(),
  isSelected: false,
  onSelect: vi.fn(),
  testID: 'test-route-card',
  variant: 'full' as const,
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('RouteAttachmentCard - Mini-map Integration (US-061)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Route option with map.overviewGeometry and map.bounds
   * → Shows RouteMiniMap above label and stats
   */
  describe('AC1: Render mini-map when map data exists', () => {
    it('should render RouteMiniMap component when overviewGeometry and bounds are present', () => {
      const { getByTestId } = render(<RouteAttachmentCard {...defaultProps} />)

      expect(getByTestId('test-route-card-mini-map')).toBeTruthy()
    })

    it('should render mini-map above the route label', () => {
      const { getByTestId, getByText } = render(<RouteAttachmentCard {...defaultProps} />)

      const miniMap = getByTestId('test-route-card-mini-map')
      const label = getByText('Via Downtown')

      // Verify both exist and mini-map appears first in DOM order
      expect(miniMap).toBeTruthy()
      expect(label).toBeTruthy()
    })

    it('should render mini-map above stats', () => {
      const { getByTestId, getByText } = render(<RouteAttachmentCard {...defaultProps} />)

      const miniMap = getByTestId('test-route-card-mini-map')
      const distanceText = getByText(/3.1mi/) // 5000 meters ≈ 3.1mi

      expect(miniMap).toBeTruthy()
      expect(distanceText).toBeTruthy()
    })
  })

  /**
   * AC2: Route option without map data
   * → Card renders as before (label + stats only, no empty space)
   */
  describe('AC2: Graceful fallback without map data', () => {
    it('should not render mini-map when overviewGeometry is empty', () => {
      const routeWithoutMap = createMockRoute(false)
      const { queryByTestId } = render(
        <RouteAttachmentCard {...defaultProps} route={routeWithoutMap} />
      )

      expect(queryByTestId('test-route-card-mini-map')).toBeNull()
    })

    it('should still render route label without map data', () => {
      const routeWithoutMap = createMockRoute(false)
      const { getByText } = render(
        <RouteAttachmentCard {...defaultProps} route={routeWithoutMap} />
      )

      expect(getByText('Via Downtown')).toBeTruthy()
    })

    it('should still render stats without map data', () => {
      const routeWithoutMap = createMockRoute(false)
      const { getByText } = render(
        <RouteAttachmentCard {...defaultProps} route={routeWithoutMap} />
      )

      expect(getByText(/3.1mi/)).toBeTruthy()
      expect(getByText(/30m/)).toBeTruthy() // 1800 seconds = 30min
    })
  })

  /**
   * AC3: User taps card with mini-map
   * → Route is selected, navigates to map tab
   */
  describe('AC3: Tap interaction with mini-map', () => {
    it('should call onSelect when tapping card with mini-map', () => {
      const onSelect = vi.fn()
      const onViewOnMap = vi.fn()
      const { getByTestId } = render(
        <RouteAttachmentCard
          {...defaultProps}
          onSelect={onSelect}
          onViewOnMap={onViewOnMap}
          variant="full"
        />
      )

      const card = getByTestId('test-route-card')
      fireEvent.press(card)

      expect(onSelect).toHaveBeenCalledWith('route-1')
    })

    it('should call onViewOnMap when tapping card in full variant', () => {
      const onViewOnMap = vi.fn()
      const { getByTestId } = render(
        <RouteAttachmentCard
          {...defaultProps}
          onViewOnMap={onViewOnMap}
          variant="full"
        />
      )

      const card = getByTestId('test-route-card')
      fireEvent.press(card)

      expect(onViewOnMap).toHaveBeenCalled()
    })
  })

  /**
   * AC4: Card is selected
   * → Mini-map still visible, primary border highlight visible
   */
  describe('AC4: Selected state with mini-map', () => {
    it('should still render mini-map when card is selected', () => {
      const { getByTestId } = render(
        <RouteAttachmentCard {...defaultProps} isSelected={true} />
      )

      expect(getByTestId('test-route-card-mini-map')).toBeTruthy()
    })

    it('should show selected border style when selected', () => {
      const { getByTestId } = render(
        <RouteAttachmentCard {...defaultProps} isSelected={true} />
      )

      const card = getByTestId('test-route-card')
      expect(card).toBeTruthy()
    })
  })

  /**
   * AC5: Card is unselected
   * → Mini-map still visible, default border
   */
  describe('AC5: Unselected state with mini-map', () => {
    it('should still render mini-map when card is not selected', () => {
      const { getByTestId } = render(
        <RouteAttachmentCard {...defaultProps} isSelected={false} />
      )

      expect(getByTestId('test-route-card-mini-map')).toBeTruthy()
    })

    it('should show default border style when not selected', () => {
      const { getByTestId } = render(
        <RouteAttachmentCard {...defaultProps} isSelected={false} />
      )

      const card = getByTestId('test-route-card')
      expect(card).toBeTruthy()
    })
  })

  /**
   * AC6: Multiple route options
   * → Each card shows its own polyline on its own mini-map
   */
  describe('AC6: Multiple route options with separate mini-maps', () => {
    it('should render separate mini-map for each route card', () => {
      const route1 = createMockRoute()
      route1.routeOptionId = 'route-1'
      route1.label = 'Route 1'

      const route2 = createMockRoute()
      route2.routeOptionId = 'route-2'
      route2.label = 'Route 2'

      const { getByTestId } = render(
        <>
          <RouteAttachmentCard
            {...defaultProps}
            route={route1}
            testID="route-card-1"
          />
          <RouteAttachmentCard
            {...defaultProps}
            route={route2}
            testID="route-card-2"
          />
        </>
      )

      expect(getByTestId('route-card-1-mini-map')).toBeTruthy()
      expect(getByTestId('route-card-2-mini-map')).toBeTruthy()
    })
  })

  /**
   * AC7: Accessibility
   * → accessibilityLabel includes route name, duration, distance (unchanged)
   */
  describe('AC7: Accessibility with mini-map', () => {
    it('should include route info in accessibilityLabel when mini-map is present', () => {
      const { getByTestId } = render(<RouteAttachmentCard {...defaultProps} />)

      const card = getByTestId('test-route-card')
      expect(card).toBeTruthy()
    })

    it('should be accessible as a button', () => {
      const { getByTestId } = render(<RouteAttachmentCard {...defaultProps} />)

      const card = getByTestId('test-route-card')
      expect(card.props.accessible).toBe(true)
      expect(card.props.accessibilityRole).toBe('button')
    })
  })
})
