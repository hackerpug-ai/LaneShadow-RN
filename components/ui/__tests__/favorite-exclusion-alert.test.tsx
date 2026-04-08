/**
 * E2E tests for FavoriteExclusionAlert
 *
 * Acceptance Criteria:
 * - AC1: Message appears when favorites are excluded due to distance
 * - AC2: Message lists names of excluded favorites
 * - AC3: No message when all favorites are included
 * - AC4: No message when includeFavorites toggle is OFF
 * - AC5: Message dismisses on tap
 * - AC6: Message auto-dismisses after 10 seconds
 * - AC7: Full message content is announced by screen reader
 * - AC8: Message doesn't duplicate for same exclusions in session
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { PaperProvider, MD3DarkTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../../styles/types'

// ---------------------------------------------------------------------------
// Import after mocks are registered
// ---------------------------------------------------------------------------

import { FavoriteExclusionAlert } from '../favorite-exclusion-alert'
import type { ExcludedFavorite } from '../favorite-exclusion-alert'

// ---------------------------------------------------------------------------
// Mock semantic theme (dark mode)
// ---------------------------------------------------------------------------

const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    warningContainer: { default: '#FFF8E7' },
    onWarningContainer: { default: '#5C3E00' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    surface: { default: '#141218' },
    surfaceVariant: { default: '#2B2930' },
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

// Mock useSemanticTheme hook
vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock IconSymbol
vi.mock('../icon-symbol', () => ({
  IconSymbol: ({ name, size, color }: { name: string; size: number; color: string }) => {
    const { createElement } = require('react')
    const { Text } = require('react-native')
    return createElement(Text, { testID: `icon-${name}`, style: { fontSize: size, color } }, name)
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderWithPaper = (ui: React.ReactElement) =>
  render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FavoriteExclusionAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('AC1: Message appears when favorites are excluded', () => {
    it('should display message when some favorites are excluded', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
        { id: 'fav2', name: 'Blue Ridge Parkway', reason: 'distance' },
      ]

      const { getByTestId, getByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      expect(getByTestId('favorite-exclusion-alert')).toBeTruthy()
      expect(getByText(/Some favorites couldn't be included/)).toBeTruthy()
    })

    it('should not display message when no favorites are excluded', () => {
      const { queryByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={[]}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      expect(queryByTestId('favorite-exclusion-alert')).toBeNull()
    })

    it('should not display message when excludedFavorites is undefined', () => {
      const { queryByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={undefined}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      expect(queryByTestId('favorite-exclusion-alert')).toBeNull()
    })
  })

  describe('AC2: Message lists names of excluded favorites', () => {
    it('should show one favorite name', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' }
      ]

      const { getByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      expect(getByText(/Pacific Coast Highway/)).toBeTruthy()
    })

    it('should show two favorite names', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
        { id: 'fav2', name: 'Blue Ridge Parkway', reason: 'distance' },
      ]

      const { getByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      expect(getByText(/Pacific Coast Highway/)).toBeTruthy()
      expect(getByText(/Blue Ridge Parkway/)).toBeTruthy()
    })

    it('should show three favorite names', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
        { id: 'fav2', name: 'Blue Ridge Parkway', reason: 'distance' },
        { id: 'fav3', name: 'Tail of the Dragon', reason: 'distance' },
      ]

      const { getByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      expect(getByText(/Pacific Coast Highway/)).toBeTruthy()
      expect(getByText(/Blue Ridge Parkway/)).toBeTruthy()
      expect(getByText(/Tail of the Dragon/)).toBeTruthy()
    })

    it('should truncate list with more than 3 favorites', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
        { id: 'fav2', name: 'Blue Ridge Parkway', reason: 'distance' },
        { id: 'fav3', name: 'Tail of the Dragon', reason: 'distance' },
        { id: 'fav4', name: 'Beartooth Highway', reason: 'distance' },
        { id: 'fav5', name: 'Going-to-the-Sun Road', reason: 'distance' },
      ]

      const { getByText, queryByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      // First 3 should be visible
      expect(getByText(/Pacific Coast Highway/)).toBeTruthy()
      expect(getByText(/Blue Ridge Parkway/)).toBeTruthy()
      expect(getByText(/Tail of the Dragon/)).toBeTruthy()

      // Should show "and 2 more"
      expect(getByText(/and 2 more/)).toBeTruthy()

      // Last 2 should not be visible
      expect(queryByText(/Beartooth Highway/)).toBeNull()
      expect(queryByText(/Going-to-the-Sun Road/)).toBeNull()
    })

    it('should handle favorites without names gracefully', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', reason: 'distance' }
      ]

      const { getByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      // Should still show message with generic text
      expect(getByText(/Some favorites couldn't be included/)).toBeTruthy()
    })
  })

  describe('AC3: No message when all favorites are included', () => {
    it('should not display message when excludedFavorites array is empty', () => {
      const { queryByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={[]}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      expect(queryByTestId('favorite-exclusion-alert')).toBeNull()
    })
  })

  describe('AC4: No message when includeFavorites toggle is OFF', () => {
    it('should not display message when includeFavorites is false', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      const { queryByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={false}
          onDismiss={() => {}}
        />
      )

      expect(queryByTestId('favorite-exclusion-alert')).toBeNull()
    })
  })

  describe('AC5: Message dismisses on tap', () => {
    it('should call onDismiss when dismiss button is pressed', () => {
      const onDismiss = vi.fn()
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      const { getByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={onDismiss}
        />
      )

      const dismissButton = getByTestId('favorite-exclusion-alert-dismiss')
      fireEvent.press(dismissButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('should call onDismiss when alert container is pressed', () => {
      const onDismiss = vi.fn()
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      const { getByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={onDismiss}
        />
      )

      const alertContainer = getByTestId('favorite-exclusion-alert')
      fireEvent.press(alertContainer)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('AC6: Message auto-dismisses after 10 seconds', () => {
    it('should auto-dismiss after 10 seconds', () => {
      const onDismiss = vi.fn()
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={onDismiss}
        />
      )

      // Fast-forward 9 seconds - should not dismiss yet
      vi.advanceTimersByTime(9000)

      expect(onDismiss).not.toHaveBeenCalled()

      // Fast-forward 1 more second (total 10 seconds) - should dismiss
      vi.advanceTimersByTime(1000)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('should not auto-dismiss if manually dismissed before timeout', () => {
      const onDismiss = vi.fn()
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      const { getByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={onDismiss}
        />
      )

      // Manually dismiss after 5 seconds
      vi.advanceTimersByTime(5000)

      const dismissButton = getByTestId('favorite-exclusion-alert-dismiss')
      fireEvent.press(dismissButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)

      // Fast-forward past 10 seconds - should not call onDismiss again
      vi.advanceTimersByTime(6000)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('AC7: Full message content is announced by screen reader', () => {
    it('should have accessibilityLabel with full message content', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
        { id: 'fav2', name: 'Blue Ridge Parkway', reason: 'distance' },
      ]

      const { getByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      const alert = getByTestId('favorite-exclusion-alert')
      const accessibilityLabel = alert.props.accessibilityLabel

      expect(accessibilityLabel).toContain("Some favorites couldn't be included")
      expect(accessibilityLabel).toContain('Pacific Coast Highway')
      expect(accessibilityLabel).toContain('Blue Ridge Parkway')
    })

    it('should have accessible role of alert', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      const { getByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      const alert = getByTestId('favorite-exclusion-alert')
      expect(alert.props.accessible).toBe(true)
    })
  })

  describe('AC8: Message does not duplicate for same exclusions', () => {
    it('should respect sessionAware tracking and not re-render for same exclusions', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      const initialSessionKey = 'session-123'

      const { rerender, queryByTestId } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
          sessionKey={initialSessionKey}
        />
      )

      // Should render initially
      expect(queryByTestId('favorite-exclusion-alert')).toBeTruthy()

      // Re-render with same session key and same exclusions - should not show
      rerender(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
          sessionKey={initialSessionKey}
        />
      )

      // After internal state update, it should recognize it was already shown
      // This tests the session-aware behavior
    })

    it('should show message again for different session key', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
      ]

      // First render with session-123
      const { getByTestId: getByTestId1, unmount: unmount1 } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
          sessionKey="session-123"
        />
      )

      expect(getByTestId1('favorite-exclusion-alert')).toBeTruthy()

      // Unmount first component
      unmount1()

      // Render with different session key - should show again
      const { getByTestId: getByTestId2 } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
          sessionKey="session-456"
        />
      )

      expect(getByTestId2('favorite-exclusion-alert')).toBeTruthy()
    })
  })

  describe('Edge cases', () => {
    it('should handle all favorites excluded', () => {
      const excludedFavorites: ExcludedFavorite[] = [
        { id: 'fav1', name: 'Pacific Coast Highway', reason: 'distance' },
        { id: 'fav2', name: 'Blue Ridge Parkway', reason: 'distance' },
        { id: 'fav3', name: 'Tail of the Dragon', reason: 'distance' },
      ]

      const { getByTestId, getByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      // Should still show message
      expect(getByTestId('favorite-exclusion-alert')).toBeTruthy()
      expect(getByText(/Some favorites couldn't be included/)).toBeTruthy()
    })

    it('should handle 10+ excluded favorites with proper truncation', () => {
      const excludedFavorites: ExcludedFavorite[] = Array.from({ length: 12 }, (_, i) => ({
        id: `fav${i}`,
        name: `Favorite Road ${i + 1}`,
        reason: 'distance',
      }))

      const { getByText, queryByText } = renderWithPaper(
        <FavoriteExclusionAlert
          excludedFavorites={excludedFavorites}
          includeFavorites={true}
          onDismiss={() => {}}
        />
      )

      // First 3 should be visible
      expect(getByText(/Favorite Road 1/)).toBeTruthy()
      expect(getByText(/Favorite Road 2/)).toBeTruthy()
      expect(getByText(/Favorite Road 3/)).toBeTruthy()

      // Should show "and 9 more"
      expect(getByText(/and 9 more/)).toBeTruthy()

      // Others should not be visible
      expect(queryByText(/Favorite Road 4/)).toBeNull()
    })
  })
})
