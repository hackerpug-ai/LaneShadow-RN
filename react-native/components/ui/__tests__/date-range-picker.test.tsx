/**
 * Unit tests for date-range-picker.tsx
 *
 * Acceptance Criteria:
 * - AC1: Renders "All time", "Last week", "Last month", "Last 3 months" chips;
 *         "All time" is selected by default
 * - AC2: Tapping "Last week" selects it and fires onDateRangeChange with
 *         { afterDate: ~7 days ago ms, beforeDate: undefined }
 * - AC3: Tapping "All time" after a preset is selected fires
 *         { afterDate: undefined, beforeDate: undefined }
 * - AC4: Tapping the same preset again deselects it back to "All time"
 */

import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { DateRangePicker } from '../date-range-picker'

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemanticTheme = {
  color: {
    primary: { default: '#6750A4' },
    onPrimary: { default: '#FFFFFF' },
    surfaceVariant: { default: '#2B2930' },
    onSurface: { default: '#E6E0E9', muted: '#938F99', subtle: '#79747E' },
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

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DateRangePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Renders all chips with "All time" selected by default
   */
  describe('AC1: renders all preset chips', () => {
    it('renders "All time" chip', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      expect(getByTestId('date-range-picker-chip-all')).toBeTruthy()
    })

    it('renders "Last week" chip', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      expect(getByTestId('date-range-picker-chip-week')).toBeTruthy()
    })

    it('renders "Last month" chip', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      expect(getByTestId('date-range-picker-chip-month')).toBeTruthy()
    })

    it('renders "Last 3 months" chip', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      expect(getByTestId('date-range-picker-chip-3months')).toBeTruthy()
    })

    it('renders with custom testID', () => {
      const { getByTestId } = render(
        <DateRangePicker onDateRangeChange={vi.fn()} testID="my-picker" />,
      )
      expect(getByTestId('my-picker')).toBeTruthy()
    })

    it('"All time" chip is initially active (primary background color)', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      const allChip = getByTestId('date-range-picker-chip-all')
      const style = Array.isArray(allChip.props.style)
        ? Object.assign({}, ...allChip.props.style.flat().filter(Boolean))
        : allChip.props.style
      expect(style.backgroundColor).toBe(mockSemanticTheme.color.primary.default)
    })
  })

  /**
   * AC2: Tapping "Last week" fires onDateRangeChange with afterDate ~7 days ago
   */
  describe('AC2: tapping "Last week" emits correct date range', () => {
    it('calls onDateRangeChange with afterDate when "Last week" is tapped', () => {
      const onDateRangeChange = vi.fn()
      const before = Date.now()
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={onDateRangeChange} />)
      fireEvent.press(getByTestId('date-range-picker-chip-week'))
      const after = Date.now()

      expect(onDateRangeChange).toHaveBeenCalledTimes(1)
      const [range] = onDateRangeChange.mock.calls[0]
      expect(range.beforeDate).toBeUndefined()
      expect(range.afterDate).toBeGreaterThanOrEqual(before - 7 * MS_PER_DAY)
      expect(range.afterDate).toBeLessThanOrEqual(after - 7 * MS_PER_DAY)
    })

    it('"Last week" chip becomes active after being tapped', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      fireEvent.press(getByTestId('date-range-picker-chip-week'))
      const weekChip = getByTestId('date-range-picker-chip-week')
      const style = Array.isArray(weekChip.props.style)
        ? Object.assign({}, ...weekChip.props.style.flat().filter(Boolean))
        : weekChip.props.style
      expect(style.backgroundColor).toBe(mockSemanticTheme.color.primary.default)
    })
  })

  /**
   * AC3: Tapping "All time" after a preset selected clears the filter
   */
  describe('AC3: tapping "All time" clears the filter', () => {
    it('fires { afterDate: undefined, beforeDate: undefined } when "All time" is tapped after a preset', () => {
      const onDateRangeChange = vi.fn()
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={onDateRangeChange} />)
      fireEvent.press(getByTestId('date-range-picker-chip-week'))
      fireEvent.press(getByTestId('date-range-picker-chip-all'))

      expect(onDateRangeChange).toHaveBeenCalledTimes(2)
      const [lastRange] = onDateRangeChange.mock.calls[1]
      expect(lastRange).toEqual({ afterDate: undefined, beforeDate: undefined })
    })

    it('"All time" chip is active after being tapped', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      fireEvent.press(getByTestId('date-range-picker-chip-week'))
      fireEvent.press(getByTestId('date-range-picker-chip-all'))

      const allChip = getByTestId('date-range-picker-chip-all')
      const style = Array.isArray(allChip.props.style)
        ? Object.assign({}, ...allChip.props.style.flat().filter(Boolean))
        : allChip.props.style
      expect(style.backgroundColor).toBe(mockSemanticTheme.color.primary.default)
    })
  })

  /**
   * AC4: Tapping same preset again deselects it back to "All time"
   */
  describe('AC4: tapping same preset twice deselects back to "All time"', () => {
    it('fires { afterDate: undefined, beforeDate: undefined } when selected preset is tapped again', () => {
      const onDateRangeChange = vi.fn()
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={onDateRangeChange} />)
      fireEvent.press(getByTestId('date-range-picker-chip-month'))
      fireEvent.press(getByTestId('date-range-picker-chip-month'))

      expect(onDateRangeChange).toHaveBeenCalledTimes(2)
      const [deselectedRange] = onDateRangeChange.mock.calls[1]
      expect(deselectedRange).toEqual({ afterDate: undefined, beforeDate: undefined })
    })

    it('"All time" chip becomes active again after deselect', () => {
      const { getByTestId } = render(<DateRangePicker onDateRangeChange={vi.fn()} />)
      fireEvent.press(getByTestId('date-range-picker-chip-month'))
      fireEvent.press(getByTestId('date-range-picker-chip-month'))

      const allChip = getByTestId('date-range-picker-chip-all')
      const style = Array.isArray(allChip.props.style)
        ? Object.assign({}, ...allChip.props.style.flat().filter(Boolean))
        : allChip.props.style
      expect(style.backgroundColor).toBe(mockSemanticTheme.color.primary.default)
    })
  })
})
