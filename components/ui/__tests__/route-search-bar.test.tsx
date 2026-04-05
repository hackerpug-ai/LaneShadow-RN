/**
 * Unit tests for route-search-bar.tsx
 *
 * Acceptance Criteria:
 * - AC1: Renders text input with magnifying glass icon and "Search routes..." placeholder
 * - AC2: After 300ms of no typing, onSearch fires with the typed value
 * - AC3: Rapid typing within 300ms results in a single onSearch call after 300ms
 * - AC4: Clear button resets input and fires onSearch("") immediately (no debounce)
 * - AC5: All visual properties use semantic theme tokens
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import type { ExtendedTheme } from '../../../styles/types'

// @expo/vector-icons is globally stubbed via __mocks__/expo-vector-icons.ts
// (wired in vitest.config.ts + vitest.env.js). No per-test override needed.

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { RouteSearchBar } from '../route-search-bar'

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RouteSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * AC1: Renders input with magnifying glass icon and placeholder
   */
  describe('AC1: renders with icon and placeholder', () => {
    it('renders the container with default testID', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      expect(getByTestId('route-search-bar')).toBeTruthy()
    })

    it('renders with a custom testID when provided', () => {
      const { getByTestId } = render(
        <RouteSearchBar onSearch={vi.fn()} testID="custom-search-bar" />
      )
      expect(getByTestId('custom-search-bar')).toBeTruthy()
    })

    it('renders the text input', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      expect(getByTestId('route-search-bar-input')).toBeTruthy()
    })

    it('input has the correct placeholder text', () => {
      const { getByPlaceholderText } = render(<RouteSearchBar onSearch={vi.fn()} />)
      expect(getByPlaceholderText('Search routes...')).toBeTruthy()
    })

    it('renders the search icon', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      expect(getByTestId('route-search-bar-icon')).toBeTruthy()
    })

    it('clear button is hidden when input is empty', () => {
      const { queryByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      expect(queryByTestId('route-search-bar-clear')).toBeNull()
    })
  })

  /**
   * AC2: After 300ms of no typing, onSearch fires with the typed value
   */
  describe('AC2: fires onSearch after 300ms debounce', () => {
    it('does not call onSearch before 300ms', () => {
      const onSearch = vi.fn()
      const { getByTestId } = render(<RouteSearchBar onSearch={onSearch} />)
      fireEvent.changeText(getByTestId('route-search-bar-input'), 'morn')
      vi.advanceTimersByTime(299)
      expect(onSearch).not.toHaveBeenCalled()
    })

    it('calls onSearch with the typed value after 300ms', () => {
      const onSearch = vi.fn()
      const { getByTestId } = render(<RouteSearchBar onSearch={onSearch} />)
      fireEvent.changeText(getByTestId('route-search-bar-input'), 'morn')
      vi.advanceTimersByTime(300)
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('morn')
    })
  })

  /**
   * AC3: Rapid typing within 300ms results in a single onSearch call
   */
  describe('AC3: debounces rapid typing to a single call', () => {
    it('fires onSearch only once when multiple keystrokes happen within 300ms', () => {
      const onSearch = vi.fn()
      const { getByTestId } = render(<RouteSearchBar onSearch={onSearch} />)
      const input = getByTestId('route-search-bar-input')

      fireEvent.changeText(input, 'm')
      vi.advanceTimersByTime(50)
      fireEvent.changeText(input, 'mo')
      vi.advanceTimersByTime(50)
      fireEvent.changeText(input, 'mor')
      vi.advanceTimersByTime(50)
      fireEvent.changeText(input, 'morn')
      vi.advanceTimersByTime(50)
      fireEvent.changeText(input, 'morni')
      vi.advanceTimersByTime(50)
      fireEvent.changeText(input, 'mornin')
      vi.advanceTimersByTime(50)
      fireEvent.changeText(input, 'morning')

      // Still within debounce window - no calls yet
      expect(onSearch).not.toHaveBeenCalled()

      // Advance past the debounce delay
      vi.advanceTimersByTime(300)

      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('morning')
    })
  })

  /**
   * AC4: Clear button resets input and fires onSearch("") immediately
   */
  describe('AC4: clear button resets and fires onSearch immediately', () => {
    it('shows the clear button after text is entered', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      fireEvent.changeText(getByTestId('route-search-bar-input'), 'test')
      expect(getByTestId('route-search-bar-clear')).toBeTruthy()
    })

    it('calls onSearch("") immediately when clear is pressed (no debounce)', () => {
      const onSearch = vi.fn()
      const { getByTestId } = render(<RouteSearchBar onSearch={onSearch} />)

      fireEvent.changeText(getByTestId('route-search-bar-input'), 'test')
      // Clear any pending debounce timers
      vi.clearAllTimers()
      onSearch.mockClear()

      act(() => {
        fireEvent.press(getByTestId('route-search-bar-clear'))
      })

      // onSearch("") fires immediately without needing to advance timers
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('')
    })

    it('hides clear button after pressing it', () => {
      const { getByTestId, queryByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      fireEvent.changeText(getByTestId('route-search-bar-input'), 'test')
      fireEvent.press(getByTestId('route-search-bar-clear'))
      expect(queryByTestId('route-search-bar-clear')).toBeNull()
    })

    it('cancels the pending debounce when clear is pressed', () => {
      const onSearch = vi.fn()
      const { getByTestId } = render(<RouteSearchBar onSearch={onSearch} />)

      fireEvent.changeText(getByTestId('route-search-bar-input'), 'test')
      // Press clear before the 300ms debounce fires
      fireEvent.press(getByTestId('route-search-bar-clear'))
      onSearch.mockClear()

      // Advance timers — the old debounce should not fire
      vi.advanceTimersByTime(300)
      expect(onSearch).not.toHaveBeenCalled()
    })
  })

  /**
   * AC5: All visual properties use semantic theme tokens
   */
  describe('AC5: uses semantic theme tokens for visual properties', () => {
    it('container background uses semantic.color.surfaceVariant.default', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      const container = getByTestId('route-search-bar')
      const flatStyle = Array.isArray(container.props.style)
        ? Object.assign({}, ...container.props.style.flat().filter(Boolean))
        : container.props.style
      expect(flatStyle.backgroundColor).toBe(mockSemanticTheme.color.surfaceVariant.default)
    })

    it('container borderRadius uses semantic.radius.lg', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      const container = getByTestId('route-search-bar')
      const flatStyle = Array.isArray(container.props.style)
        ? Object.assign({}, ...container.props.style.flat().filter(Boolean))
        : container.props.style
      expect(flatStyle.borderRadius).toBe(mockSemanticTheme.radius.lg)
    })

    it('text input color uses semantic.color.onSurface.default', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      const input = getByTestId('route-search-bar-input')
      const flatStyle = Array.isArray(input.props.style)
        ? Object.assign({}, ...input.props.style.flat().filter(Boolean))
        : input.props.style
      expect(flatStyle.color).toBe(mockSemanticTheme.color.onSurface.default)
    })

    it('placeholder color uses semantic.color.onSurface.subtle', () => {
      const { getByTestId } = render(<RouteSearchBar onSearch={vi.fn()} />)
      const input = getByTestId('route-search-bar-input')
      expect(input.props.placeholderTextColor).toBe(mockSemanticTheme.color.onSurface.subtle)
    })
  })
})
