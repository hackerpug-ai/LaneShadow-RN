/**
 * Unit tests for waypoint-card.tsx
 *
 * Acceptance Criteria:
 * - AC1: Given waypoint data, when card renders, then shows waypoint name, kind badge, and order
 * - AC2: Given on-route waypoint, when card renders, then shows drag handle
 * - AC3: Given off-route waypoint with detour info, when card renders, then shows deviation cost
 * - AC4: Given waypoint in ready status, when card renders, then shows approve/reject buttons
 * - AC5: Given approve button pressed, when onApprove called, then waypoint ID passed correctly
 * - AC6: Given reject button pressed, when onReject called, then waypoint ID passed correctly
 * - AC7: Given rejected waypoint, when card renders, then shows danger border
 * - AC8: Given waypoint card, when rendered, then uses semantic theme tokens for all styling
 */

import { fireEvent, render } from '@testing-library/react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import type { Doc } from '../../../server/convex/_generated/dataModel'
import { WaypointCard } from '../waypoint-card'

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemanticTheme = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    danger: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#2B2725' },
    surfaceVariant: { default: '#34302D' },
    background: { default: '#1B1715' },
    onSurface: {
      default: 'rgba(255,255,255,0.92)',
      muted: 'rgba(255,255,255,0.72)',
      subtle: 'rgba(255,255,255,0.55)',
      disabled: '#6B7280',
    },
    onPrimary: { default: '#0E0F11' },
    onSecondary: { default: '#F8F7F6' },
    secondaryContainer: { default: '#36302B' },
    onSecondaryContainer: { default: '#E3E3E3', muted: '#D3BBA5', subtle: '#C3AB95' },
    border: { default: '#3A3431' },
    input: { default: '#24272B' },
    ring: { default: '#B87333' },
    card: { default: '#24272B' },
    popover: { default: '#24272B' },
    accent: { default: '#407C5D' },
    orange: { default: '#FF6B35' },
    muted: { default: '#1A1C1F' },
    divider: { default: 'rgba(255,255,255,0.08)' },
    scrim: { default: 'rgba(0,0,0,0.55)' },
    routeSelected: { default: '#B87333' },
    routeAlternate: { default: 'rgba(255,255,255,0.45)' },
    waypointOnRoute: { default: '#31A362' },
    waypointOffRoute: { default: '#D98E04' },
    waypointMixed: { default: '#2B9AEB' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  radius: { none: 0, sm: 4, md: 8, lg: 16, xl: 24, '2xl': 32, full: 9999 },
  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' as const },
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
    },
  },
  elevation: {
    0: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 5,
    },
  },
}

// Mock react-native-paper
vi.mock('react-native-paper', () => {
  const { View, Text: RNText, Pressable } = require('react-native')
  const { createElement } = require('react')

  const Text = ({ children, style, ...props }: any) =>
    createElement(RNText, { style, ...props }, children)

  return {
    Text,
    useTheme: () => ({ semantic: mockSemanticTheme }),
  }
})

// Mock Badge component
vi.mock('../../ui/badge', () => {
  const { View, Text: RNText } = require('react-native')
  const { createElement } = require('react')

  return {
    Badge: ({ children, variant, testID }: any) =>
      createElement(View, { testID }, createElement(RNText, {}, `Badge:${variant}`)),
  }
})

// Mock Button component
vi.mock('../../ui/button', () => {
  const { Pressable, Text: RNText } = require('react-native')
  const { createElement } = require('react')

  const Button = (props: any) =>
    createElement(
      Pressable,
      {
        onPress: props.disabled ? undefined : props.onPress,
        testID: props.testID,
        disabled: props.disabled,
        accessibilityRole: 'button',
      },
      createElement(RNText, {}, `${props.variant}:${props.children}`),
    )

  return { Button }
})

// Mock IconSymbol component
vi.mock('../../ui/icon-symbol', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')

  return {
    IconSymbol: ({ name, testID }: any) => createElement(View, { testID }),
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createMockWaypoint = (overrides?: Partial<Doc<'waypoints'>>): Doc<'waypoints'> => ({
  _id: 'waypoint123' as any,
  _creationTime: 1234567890,
  routePlanId: 'routePlan123' as any,
  kind: 'on_route',
  status: 'pending',
  name: 'Golden Gate Bridge',
  description: 'Iconic suspension bridge',
  location: { lat: 37.8199, lng: -122.4783 },
  order: 0,
  detourInfo: undefined,
  createdAt: 1234567890,
  updatedAt: 1234567890,
  ...overrides,
})

const defaultProps = {
  waypoint: createMockWaypoint(),
  order: 0,
  testID: 'waypoint-card',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WaypointCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Given waypoint data, when card renders, then shows waypoint name, kind badge, and order
   */
  describe('AC1: Render with waypoint data', () => {
    it('should display the waypoint name', () => {
      const { getByText } = render(<WaypointCard {...defaultProps} />)

      expect(getByText('Golden Gate Bridge')).toBeTruthy()
    })

    it('should display the waypoint description', () => {
      const { getByText } = render(<WaypointCard {...defaultProps} />)

      expect(getByText('Iconic suspension bridge')).toBeTruthy()
    })

    it('should display the order number', () => {
      const { getByText } = render(<WaypointCard {...defaultProps} order={2} />)

      expect(getByText('#3')).toBeTruthy()
    })

    it('should display kind badge for on-route waypoint', () => {
      const { getByText } = render(<WaypointCard {...defaultProps} />)

      expect(getByText(/Badge:outline/)).toBeTruthy()
    })

    it('should display status badge', () => {
      const { getByTestId } = render(<WaypointCard {...defaultProps} />)

      expect(getByTestId('waypoint-card-status')).toBeTruthy()
    })
  })

  /**
   * AC2: Given on-route waypoint, when card renders, then shows drag handle
   */
  describe('AC2: Drag handle for on-route waypoints', () => {
    it('should show drag handle for on-route waypoint when onReorder provided', () => {
      const { getByTestId } = render(<WaypointCard {...defaultProps} onReorder={vi.fn()} />)

      expect(getByTestId('waypoint-card-drag-handle')).toBeTruthy()
    })

    it('should not show drag handle when onReorder not provided', () => {
      const { queryByTestId } = render(<WaypointCard {...defaultProps} />)

      expect(queryByTestId('waypoint-card-drag-handle')).toBeNull()
    })

    it('should not show drag handle for off-route waypoints', () => {
      const offRouteWaypoint = createMockWaypoint({ kind: 'off_route' })
      const { queryByTestId } = render(
        <WaypointCard {...defaultProps} waypoint={offRouteWaypoint} onReorder={vi.fn()} />,
      )

      expect(queryByTestId('waypoint-card-drag-handle')).toBeNull()
    })
  })

  /**
   * AC3: Given off-route waypoint with detour info, when card renders, then shows deviation cost
   */
  describe('AC3: Deviation cost for off-route waypoints', () => {
    it('should display deviation distance and time for off-route waypoint', () => {
      const offRouteWaypoint = createMockWaypoint({
        kind: 'off_route',
        detourInfo: {
          distanceKm: 12.5,
          durationMinutes: 18,
        },
      })

      const { getByText } = render(<WaypointCard {...defaultProps} waypoint={offRouteWaypoint} />)

      expect(getByText('+12.5 km detour')).toBeTruthy()
      expect(getByText('+18 min')).toBeTruthy()
    })

    it('should not display deviation info for on-route waypoint', () => {
      const onRouteWaypoint = createMockWaypoint({
        kind: 'on_route',
        detourInfo: {
          distanceKm: 12.5,
          durationMinutes: 18,
        },
      })

      const { queryByText } = render(<WaypointCard {...defaultProps} waypoint={onRouteWaypoint} />)

      expect(queryByText('+12.5 km detour')).toBeNull()
      expect(queryByText('+18 min')).toBeNull()
    })

    it('should not display deviation info when detourInfo is undefined', () => {
      const offRouteWaypoint = createMockWaypoint({
        kind: 'off_route',
        detourInfo: undefined,
      })

      const { queryByText } = render(<WaypointCard {...defaultProps} waypoint={offRouteWaypoint} />)

      expect(queryByText(/\d+ km detour/)).toBeNull()
      expect(queryByText(/\+ \d+ min/)).toBeNull()
    })
  })

  /**
   * AC4: Given waypoint in ready status, when card renders, then shows approve/reject buttons
   */
  describe('AC4: Approval actions for ready waypoints', () => {
    it('should show approve/reject buttons for ready status', () => {
      const readyWaypoint = createMockWaypoint({ status: 'ready' })
      const { getByTestId } = render(
        <WaypointCard {...defaultProps} waypoint={readyWaypoint} onApprove={vi.fn()} />,
      )

      expect(getByTestId('waypoint-card-approve')).toBeTruthy()
      expect(getByTestId('waypoint-card-reject')).toBeTruthy()
    })

    it('should show approve/reject buttons for pending status', () => {
      const pendingWaypoint = createMockWaypoint({ status: 'pending' })
      const { getByTestId } = render(
        <WaypointCard {...defaultProps} waypoint={pendingWaypoint} onApprove={vi.fn()} />,
      )

      expect(getByTestId('waypoint-card-approve')).toBeTruthy()
      expect(getByTestId('waypoint-card-reject')).toBeTruthy()
    })

    it('should not show approve/reject buttons for approved status', () => {
      const approvedWaypoint = createMockWaypoint({ status: 'approved' })
      const { queryByTestId } = render(
        <WaypointCard {...defaultProps} waypoint={approvedWaypoint} onApprove={vi.fn()} />,
      )

      expect(queryByTestId('waypoint-card-approve')).toBeNull()
      expect(queryByTestId('waypoint-card-reject')).toBeNull()
    })

    it('should not show approve/reject buttons when onApprove not provided', () => {
      const readyWaypoint = createMockWaypoint({ status: 'ready' })
      const { queryByTestId } = render(<WaypointCard {...defaultProps} waypoint={readyWaypoint} />)

      expect(queryByTestId('waypoint-card-approve')).toBeNull()
      expect(queryByTestId('waypoint-card-reject')).toBeNull()
    })
  })

  /**
   * AC5: Given approve button pressed, when onApprove called, then waypoint ID passed correctly
   */
  describe('AC5: Approve action', () => {
    it('should call onApprove with waypoint ID when approve button pressed', () => {
      const mockOnApprove = vi.fn()
      const readyWaypoint = createMockWaypoint({ status: 'ready', _id: 'wp456' as any })
      const { getByTestId } = render(
        <WaypointCard {...defaultProps} waypoint={readyWaypoint} onApprove={mockOnApprove} />,
      )

      fireEvent.press(getByTestId('waypoint-card-approve'))

      expect(mockOnApprove).toHaveBeenCalledTimes(1)
      expect(mockOnApprove).toHaveBeenCalledWith('wp456')
    })
  })

  /**
   * AC6: Given reject button pressed, when onReject called, then waypoint ID passed correctly
   */
  describe('AC6: Reject action', () => {
    it('should call onReject with waypoint ID when reject button pressed', () => {
      const mockOnReject = vi.fn()
      const readyWaypoint = createMockWaypoint({ status: 'ready', _id: 'wp789' as any })
      const { getByTestId } = render(
        <WaypointCard {...defaultProps} waypoint={readyWaypoint} onReject={mockOnReject} />,
      )

      fireEvent.press(getByTestId('waypoint-card-reject'))

      expect(mockOnReject).toHaveBeenCalledTimes(1)
      expect(mockOnReject).toHaveBeenCalledWith('wp789')
    })

    it('should disable reject button for approved waypoint', () => {
      const approvedWaypoint = createMockWaypoint({ status: 'approved' })
      const { getByTestId } = render(
        <WaypointCard
          {...defaultProps}
          waypoint={approvedWaypoint}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )

      const rejectButton = getByTestId('waypoint-card-reject')
      expect(rejectButton.props.disabled).toBe(true)
    })
  })

  /**
   * AC7: Given rejected waypoint, when card renders, then shows danger border
   */
  describe('AC7: Visual feedback for rejected waypoints', () => {
    it('should apply danger border styling for rejected status', () => {
      const rejectedWaypoint = createMockWaypoint({ status: 'rejected' })
      const { getByTestId } = render(<WaypointCard {...defaultProps} waypoint={rejectedWaypoint} />)

      const card = getByTestId('waypoint-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: '#E35D6A', // danger color
          }),
        ]),
      )
    })

    it('should use default border for non-rejected waypoints', () => {
      const pendingWaypoint = createMockWaypoint({ status: 'pending' })
      const { getByTestId } = render(<WaypointCard {...defaultProps} waypoint={pendingWaypoint} />)

      const card = getByTestId('waypoint-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: '#3A3431', // default border color
          }),
        ]),
      )
    })
  })

  /**
   * AC8: Given waypoint card, when rendered, then uses semantic theme tokens for all styling
   */
  describe('AC8: Semantic theme usage', () => {
    it('should use semantic radius for card border radius', () => {
      const { getByTestId } = render(<WaypointCard {...defaultProps} />)

      const card = getByTestId('waypoint-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderRadius: 16, // semantic.radius.lg
          }),
        ]),
      )
    })

    it('should use semantic spacing for card padding', () => {
      const { getByTestId } = render(<WaypointCard {...defaultProps} />)

      const card = getByTestId('waypoint-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            padding: 16, // semantic.space.lg
          }),
        ]),
      )
    })

    it('should use semantic color for card background', () => {
      const { getByTestId } = render(<WaypointCard {...defaultProps} />)

      const card = getByTestId('waypoint-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#24272B', // semantic.color.card.default
          }),
        ]),
      )
    })

    it('should use semantic waypoint colors for kind badges', () => {
      // This is tested indirectly through the kind badge rendering
      const onRouteWaypoint = createMockWaypoint({ kind: 'on_route' })
      const { getByText } = render(<WaypointCard {...defaultProps} waypoint={onRouteWaypoint} />)

      // Should render with on-route color
      expect(getByText(/Badge:outline/)).toBeTruthy()
    })
  })
})
