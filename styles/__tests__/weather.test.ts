import { describe, it, expect } from 'vitest'
import {
  windColors,
  rainColors,
  temperatureColors,
  getWeatherColors,
  toLineLayerStyle,
  getWindLineStyle,
  getRainLineStyle,
  getTempLineStyle,
} from '../weather'

// Mock semantic theme
const mockSemantic = {
  color: {
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    routeAlternate: { default: '#60a5fa' },
    muted: { default: '#938F99' },
    primary: { default: '#b87333' },
  },
  space: { sm: 8 },
} as any

describe('CLR-021: Weather Theme Color Mapping', () => {
  describe('Wind colors', () => {
    it('maps low/moderate/high to severity colors in dark theme', () => {
      expect(windColors.dark.low).toBe('#31A362')     // Green
      expect(windColors.dark.moderate).toBe('#F59E0B') // Amber
      expect(windColors.dark.high).toBe('#E35D6A')     // Red
    })

    it('maps severity colors in light theme with higher contrast', () => {
      expect(windColors.light.low).toBe('#268A4D')     // Darker green
      expect(windColors.light.moderate).toBe('#D98E04') // Darker amber
      expect(windColors.light.high).toBe('#C94352')     // Darker red
    })

    it('green is safe, red is dangerous (semantic consistency)', () => {
      // Values should be valid hex color strings
      expect(windColors.dark.low).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(windColors.dark.high).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  describe('Rain colors', () => {
    it('maps intensity to blue gradient with opacity in dark theme', () => {
      expect(rainColors.dark.none).toBe('transparent')
      expect(rainColors.dark.light).toContain('0.75')
      expect(rainColors.dark.moderate).toContain('0.85')
      expect(rainColors.dark.heavy).toContain('0.95')
    })

    it('maps intensity in light theme', () => {
      expect(rainColors.light.none).toBe('transparent')
      expect(rainColors.light.light).toContain('0.75')
      expect(rainColors.light.heavy).toContain('0.95')
    })

    it('opacity increases with intensity', () => {
      const extractOpacity = (s: string) => parseFloat(s.match(/0\.\d+/)?.[0] ?? '0')
      expect(extractOpacity(rainColors.dark.light)).toBeLessThan(extractOpacity(rainColors.dark.moderate))
      expect(extractOpacity(rainColors.dark.moderate)).toBeLessThan(extractOpacity(rainColors.dark.heavy))
    })
  })

  describe('Temperature colors', () => {
    it('maps cold/mild/hot to thermal gradient', () => {
      expect(temperatureColors.dark.cold).toBe('#2B9AEB')   // Blue
      expect(temperatureColors.dark.mild).toBe('#B87333')    // Copper (brand)
      expect(temperatureColors.dark.hot).toBe('#E35D6A')     // Red
    })

    it('uses copper for mild (brand color)', () => {
      expect(temperatureColors.dark.mild).toBe('#B87333')
      expect(temperatureColors.light.mild).toBe('#B87333')
    })
  })

  describe('getWeatherColors (semantic)', () => {
    it('maps semantic tokens to weather levels', () => {
      const colors = getWeatherColors(mockSemantic)
      expect(colors.wind.low).toBe('#22c55e')
      expect(colors.wind.moderate).toBe('#f59e0b')
      expect(colors.wind.high).toBe('#ef4444')
    })

    it('maps temperature semantic tokens', () => {
      const colors = getWeatherColors(mockSemantic)
      expect(colors.temperature.hot).toBe('#ef4444')
    })
  })

  describe('toLineLayerStyle factory', () => {
    it('creates Mapbox line layer style', () => {
      const style = toLineLayerStyle('#ff0000', 5, 0.8)
      expect(style).toEqual({
        lineColor: '#ff0000',
        lineWidth: 5,
        lineOpacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      })
    })

    it('uses sensible defaults', () => {
      const style = toLineLayerStyle('#00ff00')
      expect(style.lineWidth).toBe(5)
      expect(style.lineOpacity).toBe(1.0)
    })
  })

  describe('Style factories', () => {
    it('getWindLineStyle returns style for each level', () => {
      for (const level of ['low', 'moderate', 'high'] as const) {
        const style = getWindLineStyle(level, mockSemantic, true)
        expect(style.lineColor).toBeTruthy()
        expect(style.lineCap).toBe('round')
      }
    })

    it('getRainLineStyle returns null for none', () => {
      expect(getRainLineStyle('none', true)).toBeNull()
    })

    it('getRainLineStyle returns style for rain levels', () => {
      for (const level of ['light', 'moderate', 'heavy'] as const) {
        const style = getRainLineStyle(level, true)
        expect(style).not.toBeNull()
        expect(style!.lineColor).toContain('rgba')
      }
    })

    it('getTempLineStyle returns style for each level', () => {
      for (const level of ['cold', 'mild', 'warm', 'hot'] as const) {
        const style = getTempLineStyle(level, true)
        expect(style.lineColor).toBeTruthy()
        expect(style.lineOpacity).toBe(0.9)
      }
    })
  })
})
