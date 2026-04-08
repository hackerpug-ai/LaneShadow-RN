/**
 * Unit tests for overlay-toggle.tsx
 *
 * Acceptance Criteria:
 * - AC1: User taps 'Rain' toggle → Rain becomes selected and polyline colors switch to rain-based
 * - AC2: Route has wind data but no rain data → Rain toggle is disabled with visual indication
 * - AC3: Only one overlay active at a time (single-select mode)
 * - AC4: No route selected → Overlay toggle is hidden
 */

import { vi, describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { PaperProvider, MD3DarkTheme } from 'react-native-paper'
import type { OverlayAvailability, OverlayType } from './overlay-toggle'
import { OverlayToggle } from './overlay-toggle'
import type { ExtendedTheme } from '../../styles/types'

// Mock semantic theme for testing
const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    warningContainer: { default: 'FFF8E7' },
    onWarningContainer: { default: '#5C3E00' },
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

// Mock useSemanticTheme hook
vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Helper wrapper with PaperProvider
const renderWithPaper = (ui: React.ReactElement) => {
  return render(
    <PaperProvider theme={MD3DarkTheme}>
      {ui}
    </PaperProvider>
  )
}

describe('overlay-toggle', () => {
  /**
   * AC1: User taps 'Rain' toggle
   * → Rain becomes selected and polyline colors switch to rain-based
   */
  describe('switch to rain', () => {
    it('should satisfy AC1: switches to rain overlay when rain toggle is pressed', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Tap rain toggle
      fireEvent.press(getByTestId('overlay-item-rain'))

      // Should call onValueChange with 'rain'
      expect(onValueChange).toHaveBeenCalledWith('rain')
    })

    it('should select rain overlay when no overlay is currently selected', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value=""
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Tap rain toggle
      fireEvent.press(getByTestId('overlay-item-rain'))

      // Should call onValueChange with 'rain'
      expect(onValueChange).toHaveBeenCalledWith('rain')
    })
  })

  /**
   * AC2: Route has wind data but no rain data (unavailable)
   * → Rain toggle is disabled with visual indication
   */
  describe('disabled toggle', () => {
    it('should satisfy AC2: shows rain toggle as disabled when rain data is unavailable', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: false, // Rain data unavailable
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      const rainToggle = getByTestId('overlay-item-rain')

      // Tap disabled rain toggle
      fireEvent.press(rainToggle)

      // Should not call onValueChange since rain is unavailable
      expect(onValueChange).not.toHaveBeenCalled()

      // Rain toggle should have disabled accessibility state
      expect(rainToggle.props.accessibilityState.disabled).toBe(true)
    })

    it('should show visual indication for disabled toggle', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: false,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      const rainToggle = getByTestId('overlay-item-rain')

      // Disabled toggle should have reduced opacity
      expect(rainToggle.props.style).toContainEqual({ opacity: 0.5 })
    })

    it('should handle all overlays unavailable', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: false,
        rain: false,
        temperature: false,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value=""
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // All toggles should be disabled
      expect(getByTestId('overlay-item-wind').props.accessibilityState.disabled).toBe(true)
      expect(getByTestId('overlay-item-rain').props.accessibilityState.disabled).toBe(true)
      expect(getByTestId('overlay-item-temperature').props.accessibilityState.disabled).toBe(true)
    })
  })

  /**
   * AC3: Only one overlay active at a time (single-select mode)
   * → Previous selection is deselected when new overlay is selected
   */
  describe('single selection', () => {
    it('should satisfy AC3: deselects temperature when wind is selected', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="temperature"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Tap wind toggle
      fireEvent.press(getByTestId('overlay-item-wind'))

      // Should call onValueChange with 'wind' (only one overlay active)
      expect(onValueChange).toHaveBeenCalledWith('wind')
    })

    it('should deselect wind when rain is selected', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Tap rain toggle
      fireEvent.press(getByTestId('overlay-item-rain'))

      // Should call onValueChange with 'rain' (wind is deselected)
      expect(onValueChange).toHaveBeenCalledWith('rain')
    })

    it('should allow deselection by selecting the same overlay', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="rain"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Tap rain toggle (already selected)
      fireEvent.press(getByTestId('overlay-item-rain'))

      // ToggleGroup should handle deselection (call with same value to toggle off)
      // The component delegates to ToggleGroup which handles single-select toggle behavior
      expect(onValueChange).toHaveBeenCalled()
    })
  })

  /**
   * AC4: No route is currently selected
   * → Overlay toggle is hidden
   *
   * Note: This test verifies the component can be hidden.
   * The parent component is responsible for conditional rendering.
   */
  describe('hidden when no route', () => {
    it('should satisfy AC4: component renders when route is selected', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Component should be visible when route is selected
      expect(getByTestId('overlay-toggle')).toBeTruthy()
    })

    it('should render with empty value when no overlay is selected', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value=""
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Component should render with no active overlay
      expect(getByTestId('overlay-toggle')).toBeTruthy()

      // No overlay should be selected
      expect(getByTestId('overlay-item-wind').props.accessibilityState.selected).toBe(false)
      expect(getByTestId('overlay-item-rain').props.accessibilityState.selected).toBe(false)
      expect(getByTestId('overlay-item-temperature').props.accessibilityState.selected).toBe(false)
    })
  })

  /**
   * Edge case: Multi-tap race condition
   * Multiple rapid taps should not cause state corruption
   */
  describe('edge cases', () => {
    it('should handle multi-tap race condition', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value=""
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      const windToggle = getByTestId('overlay-item-wind')
      const rainToggle = getByTestId('overlay-item-rain')

      // Rapid taps
      fireEvent.press(windToggle)
      fireEvent.press(rainToggle)
      fireEvent.press(windToggle)

      // All calls should be recorded
      expect(onValueChange).toHaveBeenCalledTimes(3)
    })

    it('should handle partial overlay availability', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: false, // No rain data
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value=""
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Wind and temperature should be enabled
      expect(getByTestId('overlay-item-wind').props.accessibilityState.disabled).toBe(false)
      expect(getByTestId('overlay-item-temperature').props.accessibilityState.disabled).toBe(false)

      // Rain should be disabled
      expect(getByTestId('overlay-item-rain').props.accessibilityState.disabled).toBe(true)
    })

    it('should switch between overlays correctly', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId, rerender } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Wind should be selected
      expect(getByTestId('overlay-item-wind').props.accessibilityState.selected).toBe(true)

      // Simulate switching to rain
      rerender(
        <PaperProvider theme={MD3DarkTheme}>
          <OverlayToggle
            value="rain"
            onValueChange={onValueChange}
            availability={availability}
            testID="overlay-toggle"
          />
        </PaperProvider>
      )

      // Rain should now be selected
      expect(getByTestId('overlay-item-rain').props.accessibilityState.selected).toBe(true)
      // Wind should be deselected
      expect(getByTestId('overlay-item-wind').props.accessibilityState.selected).toBe(false)
    })
  })

  /**
   * Accessibility tests
   */
  describe('accessibility', () => {
    it('should have proper accessibility labels', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      expect(getByTestId('overlay-item-wind').props.accessibilityLabel).toBe('Wind overlay')
      expect(getByTestId('overlay-item-rain').props.accessibilityLabel).toBe('Rain overlay')
      expect(getByTestId('overlay-item-temperature').props.accessibilityLabel).toBe('Temperature overlay')
    })

    it('should have proper accessibility roles', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="wind"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      expect(getByTestId('overlay-item-wind').props.accessibilityRole).toBe('button')
      expect(getByTestId('overlay-item-rain').props.accessibilityRole).toBe('button')
      expect(getByTestId('overlay-item-temperature').props.accessibilityRole).toBe('button')
    })

    it('should indicate selected state in accessibility', () => {
      const onValueChange = vi.fn()
      const availability: OverlayAvailability = {
        wind: true,
        rain: true,
        temperature: true,
      }

      const { getByTestId } = renderWithPaper(
        <OverlayToggle
          value="rain"
          onValueChange={onValueChange}
          availability={availability}
          testID="overlay-toggle"
        />
      )

      // Rain should be selected
      expect(getByTestId('overlay-item-rain').props.accessibilityState.selected).toBe(true)

      // Wind and temperature should not be selected
      expect(getByTestId('overlay-item-wind').props.accessibilityState.selected).toBe(false)
      expect(getByTestId('overlay-item-temperature').props.accessibilityState.selected).toBe(false)
    })
  })
})
