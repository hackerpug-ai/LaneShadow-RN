/**
 * Unit tests for agent-message-overlay.tsx
 *
 * Acceptance Criteria:
 * - AC1: Overlay is not rendered when visible=false
 * - AC2: Overlay calls onDismiss after autoDismissDelay (default 5000ms)
 * - AC3: Pinning prevents the auto-dismiss timer from firing
 * - AC4: Unpinning restarts the dismiss timer from that moment
 * - AC5: Setting autoDismiss=false disables the timer entirely
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import type { ExtendedTheme } from '../../../styles/types'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { AgentMessageOverlay } from '../agent-message-overlay'

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
    ring: { default: '#6750A4' },
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
    0: { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 5 },
  },
}

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

vi.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')
  return {
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      createElement(View, { testID: props.testID, name: props.name }),
  }
})

// Mock IconSymbol used inside agent-message-overlay
vi.mock('../../icon-symbol', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')
  return {
    IconSymbol: (props: Record<string, unknown>) =>
      createElement(View, { testID: props.testID, name: props.name }),
  }
})

// Mock RouteAttachmentCard to avoid deep dependency chain in unit tests
vi.mock('../../route-attachment-card', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')
  return {
    RouteAttachmentCard: (props: Record<string, unknown>) =>
      createElement(View, { testID: `route-card-${props.id}` }),
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderOverlay(overrides: Partial<React.ComponentProps<typeof AgentMessageOverlay>> = {}) {
  const onDismiss = vi.fn()
  const onMinimize = vi.fn()
  const result = render(
    <AgentMessageOverlay
      message="Test message"
      visible={true}
      onDismiss={onDismiss}
      onMinimize={onMinimize}
      {...overrides}
    />
  )
  return { ...result, onDismiss, onMinimize }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AgentMessageOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * AC1: Not rendered when visible=false
   */
  describe('AC1: hidden when visible=false', () => {
    it('returns null when visible is false', () => {
      const { queryByText } = renderOverlay({ visible: false })
      expect(queryByText('Test message')).toBeNull()
    })

    it('renders content when visible is true', () => {
      const { getByText } = renderOverlay({ visible: true })
      expect(getByText('Test message')).toBeTruthy()
    })
  })

  /**
   * AC2: Calls onDismiss after default 5000ms delay
   */
  describe('AC2: auto-dismisses after 5 seconds by default', () => {
    it('does not call onDismiss before 5000ms have elapsed', () => {
      const { onDismiss } = renderOverlay()
      act(() => { vi.advanceTimersByTime(4999) })
      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('calls onDismiss exactly once after 5000ms', () => {
      const { onDismiss } = renderOverlay()
      act(() => { vi.advanceTimersByTime(5000) })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('respects a custom autoDismissDelay', () => {
      const { onDismiss } = renderOverlay({ autoDismissDelay: 3000 })
      act(() => { vi.advanceTimersByTime(2999) })
      expect(onDismiss).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(1) })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * AC3: Pinning prevents auto-dismiss
   */
  describe('AC3: pinning prevents the dismiss timer from firing', () => {
    it('does not call onDismiss after 5s when the overlay is pinned', () => {
      const { getByLabelText, onDismiss } = renderOverlay()
      // Pin the overlay before the timer fires
      act(() => { fireEvent.press(getByLabelText('Pin')) })
      act(() => { vi.advanceTimersByTime(10000) })
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })

  /**
   * AC4: Unpinning restarts the dismiss timer
   */
  describe('AC4: unpinning restarts the dismiss timer', () => {
    it('fires onDismiss 5s after unpinning', () => {
      const { getByLabelText, onDismiss } = renderOverlay()

      // Pin — timer is suppressed
      act(() => { fireEvent.press(getByLabelText('Pin')) })
      act(() => { vi.advanceTimersByTime(6000) })
      expect(onDismiss).not.toHaveBeenCalled()

      // Unpin — a fresh 5s timer should start
      act(() => { fireEvent.press(getByLabelText('Unpin')) })
      act(() => { vi.advanceTimersByTime(4999) })
      expect(onDismiss).not.toHaveBeenCalled()

      act(() => { vi.advanceTimersByTime(1) })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * AC5: autoDismiss=false disables the timer
   */
  describe('AC5: autoDismiss=false disables the timer', () => {
    it('never calls onDismiss when autoDismiss is false', () => {
      const { onDismiss } = renderOverlay({ autoDismiss: false })
      act(() => { vi.advanceTimersByTime(60000) })
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })
})
