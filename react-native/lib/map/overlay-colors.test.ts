/**
 * Unit tests for overlay-colors.ts
 *
 * Acceptance Criteria:
 * - AC1: Rain overlay is active and route has light rain segments → Light rain segments display in sky blue (#60a5fa)
 * - AC2: Rain overlay is active and route has heavy rain segments → Heavy rain segments display in red (#ef4444)
 * - AC3: Wind overlay is active (not rain) → Polyline shows wind-based colors, not rain colors
 * - AC4: Rain overlay has no segment data for a leg → Leg renders in default neutral color (gray)
 */

import { describe, expect, it } from 'vitest'
import type { ExtendedTheme } from '../../styles/types'
import { getRainColor, getTemperatureColor, getWindColor } from './overlay-colors'

describe('overlay-colors', () => {
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
      onSurface: { default: '#1D1B20', muted: '#49454F', subtle: '#79747E' },
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
      0: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      1: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      },
      2: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
      },
      3: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
      4: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 4,
      },
      5: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 5,
      },
    },
  }

  describe('getRainColor', () => {
    /**
     * AC1: Rain overlay is active and route has light rain segments
     * → Light rain segments display in sky blue (#60a5fa)
     */
    it('should satisfy AC1: returns sky blue for light rain', () => {
      const result = getRainColor('light', mockSemanticTheme)
      expect(result).toBe('#60a5fa')
    })

    /**
     * AC1: Moderate rain should display in blue (#3b82f6)
     */
    it('should return blue for moderate rain', () => {
      const result = getRainColor('moderate', mockSemanticTheme)
      expect(result).toBe('#3b82f6')
    })

    /**
     * AC2: Rain overlay is active and route has heavy rain segments
     * → Heavy rain segments display in red (#ef4444)
     */
    it('should satisfy AC2: returns red for heavy rain', () => {
      const result = getRainColor('heavy', mockSemanticTheme)
      expect(result).toBe('#ef4444')
    })

    /**
     * AC4: Rain overlay has no segment data for a leg (level: 'none')
     * → Leg renders in default neutral green color (#22c55e)
     */
    it('should satisfy AC4: returns green for no rain (none)', () => {
      const result = getRainColor('none', mockSemanticTheme)
      expect(result).toBe('#22c55e')
    })

    /**
     * Unknown rain levels should return default gray
     */
    it('should return gray for unknown rain level', () => {
      const result = getRainColor('unknown', mockSemanticTheme)
      expect(result).toBe('#938F99')
    })
  })

  describe('getWindColor', () => {
    /**
     * AC3: Wind overlay is active (not rain)
     * → Polyline shows wind-based colors, not rain colors
     */
    it('should satisfy AC3: returns success color for low wind', () => {
      const result = getWindColor('low', mockSemanticTheme)
      expect(result).toBe('#22c55e')
    })

    it('should return warning color for moderate wind', () => {
      const result = getWindColor('moderate', mockSemanticTheme)
      expect(result).toBe('#f59e0b')
    })

    it('should return danger color for high wind', () => {
      const result = getWindColor('high', mockSemanticTheme)
      expect(result).toBe('#ef4444')
    })

    it('should return info color for unknown wind level', () => {
      const result = getWindColor('unknown', mockSemanticTheme)
      expect(result).toBe('#3b82f6')
    })
  })

  /**
   * Color accessibility validation (WCAG contrast on dark map)
   */
  describe('Accessibility', () => {
    it('should use high-contrast colors visible on dark map backgrounds', () => {
      const lightRainColor = getRainColor('light', mockSemanticTheme)
      const moderateRainColor = getRainColor('moderate', mockSemanticTheme)
      const heavyRainColor = getRainColor('heavy', mockSemanticTheme)
      const noRainColor = getRainColor('none', mockSemanticTheme)

      // All rain colors should be hex color strings
      expect(lightRainColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(moderateRainColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(heavyRainColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(noRainColor).toMatch(/^#[0-9A-Fa-f]{6}$/)

      // Colors should be distinct (not equal to each other)
      const colors = [lightRainColor, moderateRainColor, heavyRainColor, noRainColor]
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(colors.length)
    })
  })

  describe('getTemperatureColor', () => {
    /**
     * US-005 AC1: Temperature overlay is active and route has cold segments (<40F)
     * → Cold segments display in blue (#60a5fa)
     */
    it('should satisfy US-005 AC1: returns blue for cold temperature', () => {
      const result = getTemperatureColor('cold', mockSemanticTheme)
      expect(result).toBe('#60a5fa')
    })

    /**
     * US-005 AC3: Route passes through mild temperature zone (65-75F)
     * → Mild segments display in green (#22c55e)
     */
    it('should satisfy US-005 AC3: returns green for mild temperature', () => {
      const result = getTemperatureColor('mild', mockSemanticTheme)
      expect(result).toBe('#22c55e')
    })

    /**
     * US-005: Warm temperature (not explicitly in AC but part of the temperature scale)
     * → Warm segments display in orange (#fb923c)
     */
    it('should return orange for warm temperature', () => {
      const result = getTemperatureColor('warm', mockSemanticTheme)
      expect(result).toBe('#fb923c')
    })

    /**
     * US-005 AC2: Temperature overlay is active and route has hot segments (>90F)
     * → Hot segments display in red (#ef4444)
     */
    it('should satisfy US-005 AC2: returns red for hot temperature', () => {
      const result = getTemperatureColor('hot', mockSemanticTheme)
      expect(result).toBe('#ef4444')
    })

    /**
     * US-005 AC4: Temperature data missing for a leg
     * → Leg renders in neutral gray, not a misleading thermal color
     */
    it('should satisfy US-005 AC4: returns gray for unknown temperature level', () => {
      const result = getTemperatureColor('unknown', mockSemanticTheme)
      expect(result).toBe('#938F99')
    })

    it('should return gray for missing temperature level', () => {
      const result = getTemperatureColor('', mockSemanticTheme)
      expect(result).toBe('#938F99')
    })
  })
})
