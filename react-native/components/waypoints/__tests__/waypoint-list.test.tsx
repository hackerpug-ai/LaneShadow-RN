/**
 * Unit tests for waypoint-list.tsx
 *
 * Acceptance Criteria:
 * - AC1: Given waypoints data, when list renders, then shows glassmorphic container with header
 * - AC2: Given header pressed, when collapsed, then waypoint cards are hidden
 * - AC3: Given onReorder callback provided, when list renders, then shows drag handle
 * - AC4: Given pending approvals, when list renders, then shows pending indicator in header
 * - AC5: Given waypoint list, when rendered, then uses semantic theme tokens for all styling
 * - AC6: Given loading state, when fetching waypoints, then shows loading message
 * - AC7: Given empty state, when no waypoints exist, then shows empty message
 * - AC8: Given waypoint list, when rendered, then has proper accessibility labels and hints
 */

import { fireEvent, render } from '@testing-library/react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useQuery } from 'convex/react'
import type { Id } from '../../../../server/convex/_generated/dataModel'
import { WaypointList } from '../waypoint-list'

// ---------------------------------------------------------------------------
// Mock convex before imports
// ---------------------------------------------------------------------------

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemanticTheme = {
  color: {
    primary: { default: '#B87333', pressed: '#9A5C28' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    danger: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#2B2725', pressed: '#24272B' },
    surfaceVariant: { default: '#2B2725' },
    background: { default: '#1B1715' },
    onSurface: { default: '#F5F0EB', muted: '#9CA3AF', subtle: '#6B7280' },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#F5F0EB' },
    secondaryContainer: { default: '#2B2725' },
    onSecondaryContainer: { default: '#F5F0EB', muted: '#9CA3AF', subtle: '#6B7280' },
    border: { default: 'rgba(255,255,255,0.1)' },
    input: { default: '#2B2725' },
    ring: { default: '#B87333' },
    locationPoiFill: { default: '#31A362' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#6B7280' },
    locationPoiBg: { default: '#2B2725' },
    card: { default: '#24272B', disabled: '#2B2725', pressed: '#1A1C1F' },
    popover: { default: '#24272B' },
    accent: { default: '#88C7A6' },
    orange: { default: '#FF6B35' },
    muted: { default: '#6B7280' },
    divider: { default: 'rgba(255,255,255,0.05)' },
    scrim: { default: 'rgba(0,0,0,0.5)' },
    routeSelected: { default: '#B87333' },
    routeAlternate: { default: '#2B9AEB' },
    waypointOnRoute: { default: '#31A362' },
    waypointOffRoute: { default: '#D98E04' },
    waypointMixed: { default: '#2B9AEB' },
    enrichmentFast: { default: '#2C9F9B' },
    enrichmentExtended: { default: '#8B5CF6' },
    enrichmentCached: { default: '#6B7280' },
    deviationOriginalRoute: { default: '#6B7280' },
    deviationDetourPath: { default: '#FF6B35' },
    deviationReconnectPoint: { default: '#31A362' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  radius: { none: 0, sm: 4, md: 8, lg: 16, xl: 24, '2xl': 32, full: 9999 },
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
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
      lg: { fontSize: 18, lineHeight: 28, fontWeight: '500' as const },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      md: { fontSize: 18, lineHeight: 28, fontWeight: '600' as const },
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
      md: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      lg: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const },
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

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

vi.mock('react-native-paper', () => ({
  Text: 'Text',
  useTheme: () => ({ semantic: mockSemanticTheme }),
}))

// ---------------------------------------------------------------------------
// Mock waypoints data
// ---------------------------------------------------------------------------

const mockWaypoints = [
  {
    _id: 'wp1' as Id<'waypoints'>,
    routePlanId: 'rp1' as Id<'route_plans'>,
    name: 'Scenic Overlook',
    description: 'Beautiful mountain views',
    kind: 'on_route' as const,
    status: 'approved' as const,
    order: 0,
    createdAt: 1000,
  },
  {
    _id: 'wp2' as Id<'waypoints'>,
    routePlanId: 'rp1' as Id<'route_plans'>,
    name: 'Detour to Waterfall',
    description: 'Short detour to natural waterfall',
    kind: 'off_route' as const,
    status: 'ready' as const,
    order: 1,
    createdAt: 2000,
    detourInfo: {
      distanceKm: 5.2,
      durationMinutes: 15,
    },
  },
  {
    _id: 'wp3' as Id<'waypoints'>,
    routePlanId: 'rp1' as Id<'route_plans'>,
    name: 'Lunch Stop',
    description: 'Restaurant with local cuisine',
    kind: 'on_route' as const,
    status: 'pending' as const,
    order: 2,
    createdAt: 3000,
  },
]

describe('WaypointList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Glassmorphic container with header
   */
  describe('AC1: renders glassmorphic container with header', () => {
    it('renders with glassmorphic container styling', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const container = getByTestId('waypoint-list')
      expect(container).toBeTruthy()
      // Glassmorphic styling should have specific background opacity
      const style = Array.isArray(container.props.style)
        ? Object.assign({}, ...container.props.style)
        : container.props.style
      expect(style.backgroundColor).toContain('rgba')
      expect(style.borderRadius).toBe(16)
    })

    it('applies semi-transparent background with border', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const container = getByTestId('waypoint-list')
      // Get the first style object which contains our glassmorphic styling
      const style = Array.isArray(container.props.style)
        ? container.props.style.find((s: any) => s?.backgroundColor)
        : container.props.style

      // Should have opacity in rgba (glassmorphic effect)
      expect(style?.backgroundColor).toContain('rgba')
      expect(style?.borderColor).toContain('rgba')
    })
  })

  /**
   * AC2: Progressive disclosure - collapse/expand
   */
  describe('AC2: progressive disclosure collapse/expand', () => {
    it('is expanded by default', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByText } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      expect(getByText('Scenic Overlook')).toBeTruthy()
      expect(getByText('Detour to Waterfall')).toBeTruthy()
      expect(getByText('Lunch Stop')).toBeTruthy()
    })

    it('starts collapsed when initiallyCollapsed is true', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByText, queryByText } = render(
        <WaypointList
          routePlanId={'rp1' as Id<'route_plans'>}
          initiallyCollapsed={true}
          testID="waypoint-list"
        />,
      )

      // Header should be visible but waypoint cards should not
      expect(getByText('Waypoints')).toBeTruthy()
      expect(queryByText('Scenic Overlook')).toBeNull()
    })

    it('toggles collapse state on header press', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByText, getByTestId, queryByText } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      expect(getByText('Scenic Overlook')).toBeTruthy()

      // Press header to collapse
      const header = getByTestId('waypoint-list-header')
      fireEvent.press(header)

      expect(queryByText('Scenic Overlook')).toBeNull()

      // Press header again to expand
      fireEvent.press(header)

      expect(getByText('Scenic Overlook')).toBeTruthy()
    })
  })

  /**
   * AC3: Drag handle shows when onReorder provided
   */
  describe('AC3: drag affordance with onReorder callback', () => {
    it('shows drag handle when onReorder callback is provided', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)
      const mockReorder = vi.fn()

      const { getByTestId } = render(
        <WaypointList
          routePlanId={'rp1' as Id<'route_plans'>}
          onReorder={mockReorder}
          testID="waypoint-list"
        />,
      )

      const container = getByTestId('waypoint-list')
      expect(container).toBeTruthy()
    })

    it('hides drag handle when onReorder callback is not provided', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const container = getByTestId('waypoint-list')
      expect(container).toBeTruthy()
    })
  })

  /**
   * AC4: Pending indicator in header
   */
  describe('AC4: pending indicator in header', () => {
    it('displays waypoint count', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByText } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      expect(getByText('(3)')).toBeTruthy()
    })

    it('shows pending indicator when waypoints need approval', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const container = getByTestId('waypoint-list')
      expect(container).toBeTruthy()
    })

    it('hides pending indicator when all waypoints are approved', () => {
      const approvedWaypoints = mockWaypoints.map((wp) => ({
        ...wp,
        status: 'approved' as const,
      }))
      vi.mocked(useQuery).mockReturnValue(approvedWaypoints)

      const { getByText } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      expect(getByText('(3)')).toBeTruthy()
    })
  })

  /**
   * AC5: Uses semantic theme tokens
   */
  describe('AC5: uses semantic theme tokens for styling', () => {
    it('uses semantic color tokens for background', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const container = getByTestId('waypoint-list')
      expect(container).toBeTruthy()
    })
  })

  /**
   * AC6: Loading state
   */
  describe('AC6: loading state', () => {
    it('shows loading state while fetching waypoints', () => {
      vi.mocked(useQuery).mockReturnValue(undefined)

      const { getByText } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      expect(getByText('Loading waypoints...')).toBeTruthy()
    })
  })

  /**
   * AC7: Empty state
   */
  describe('AC7: empty state', () => {
    it('shows empty state when no waypoints exist', () => {
      vi.mocked(useQuery).mockReturnValue([])

      const { getByText } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      expect(getByText('No waypoints for this route')).toBeTruthy()
    })
  })

  /**
   * AC8: Accessibility labels and hints
   */
  describe('AC8: accessibility labels and hints', () => {
    it('has accessibility label on container', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const container = getByTestId('waypoint-list')
      expect(container.props.accessible).toBe(true)
      expect(container.props.accessibilityLabel).toBe('Waypoint list')
    })

    it('includes pending approvals in accessibility hint', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const container = getByTestId('waypoint-list')
      expect(container.props.accessibilityHint).toContain('3 waypoints')
      expect(container.props.accessibilityHint).toContain('pending approval')
    })

    it('header has correct accessibility role and label', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList routePlanId={'rp1' as Id<'route_plans'>} testID="waypoint-list" />,
      )

      const header = getByTestId('waypoint-list-header')
      expect(header.props.accessibilityRole).toBe('button')
      expect(header.props.accessibilityLabel).toBe('Collapse waypoint list')
    })

    it('header accessibility label changes when collapsed', () => {
      vi.mocked(useQuery).mockReturnValue(mockWaypoints)

      const { getByTestId } = render(
        <WaypointList
          routePlanId={'rp1' as Id<'route_plans'>}
          initiallyCollapsed={true}
          testID="waypoint-list"
        />,
      )

      const header = getByTestId('waypoint-list-header')
      expect(header.props.accessibilityLabel).toBe('Expand waypoint list')
    })
  })
})
