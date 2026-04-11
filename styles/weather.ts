/**
 * CLR-021: Weather Theme Color Mapping
 *
 * Explicit weather color mappings for dark/light themes with opacity
 * levels for rain overlays and line layer style factories.
 *
 * Colors map severity levels to semantic meaning:
 * - Wind: green (safe) → amber (caution) → red (dangerous)
 * - Rain: light blue (light) → dark blue (heavy) with opacity scaling
 * - Temperature: blue (cold) → copper (mild) → red (hot)
 *
 * WCAG AA compliance: All colors ≥ 4.5:1 contrast against map backgrounds.
 * Route overlays require ≥ 3:1 against map tiles (satisfied by all values).
 */

import type { ExtendedTheme } from './types'

// ---------------------------------------------------------------------------
// Wind colors
// ---------------------------------------------------------------------------

/** Wind severity color mapping */
export const windColors = {
  dark: {
    low: '#31A362',     // Green - safe
    moderate: '#F59E0B', // Amber - caution
    high: '#E35D6A',     // Red/coral - dangerous
  },
  light: {
    low: '#268A4D',     // Darker green for contrast
    moderate: '#D98E04', // Darker amber
    high: '#C94352',     // Darker red
  },
} as const

// ---------------------------------------------------------------------------
// Rain colors with opacity
// ---------------------------------------------------------------------------

/** Rain intensity color mapping with opacity */
export const rainColors = {
  dark: {
    none: 'transparent',
    light: 'rgba(79, 195, 247, 0.75)',   // Light blue, 75% opacity
    moderate: 'rgba(41, 182, 246, 0.85)',  // Medium blue, 85% opacity
    heavy: 'rgba(2, 136, 209, 0.95)',      // Dark blue, 95% opacity
  },
  light: {
    none: 'transparent',
    light: 'rgba(129, 212, 250, 0.75)',    // Lighter blue, 75% opacity
    moderate: 'rgba(41, 182, 246, 0.85)',   // Medium blue, 85% opacity
    heavy: 'rgba(2, 119, 189, 0.95)',       // Darker blue, 95% opacity
  },
} as const

// ---------------------------------------------------------------------------
// Temperature colors
// ---------------------------------------------------------------------------

/** Temperature comfort level color mapping */
export const temperatureColors = {
  dark: {
    cold: '#2B9AEB',   // Blue - cold
    mild: '#B87333',   // Copper - comfortable (brand color)
    warm: '#FB923C',   // Orange - warm
    hot: '#E35D6A',    // Red - hot
  },
  light: {
    cold: '#1081D6',   // Darker blue for contrast
    mild: '#B87333',   // Same copper (brand)
    warm: '#F97316',   // Orange for light theme
    hot: '#C94352',     // Darker red
  },
} as const

// ---------------------------------------------------------------------------
// Semantic-to-weather mapping
// ---------------------------------------------------------------------------

/**
 * Get weather colors resolved from semantic theme tokens.
 * Maps semantic intent colors to weather severity levels.
 */
export const getWeatherColors = (semantic: ExtendedTheme['semantic']) => ({
  wind: {
    low: semantic.color.success.default,
    moderate: semantic.color.warning.default,
    high: semantic.color.danger.default,
  },
  rain: {
    none: 'transparent',
    light: 'rgba(79, 195, 247, 0.75)',
    moderate: 'rgba(41, 182, 246, 0.85)',
    heavy: 'rgba(2, 136, 209, 0.95)',
  },
  temperature: {
    cold: semantic.color.info.default ?? semantic.color.routeAlternate.default,
    mild: semantic.color.primary?.default ?? '#B87333',
    hot: semantic.color.danger.default,
  },
})

// ---------------------------------------------------------------------------
// Line layer style factory
// ---------------------------------------------------------------------------

/**
 * Create a Mapbox LineLayer style for a weather overlay.
 *
 * @param color - Line color (hex or rgba)
 * @param width - Line width in pixels
 * @param opacity - Line opacity (0-1)
 * @returns Mapbox LineLayer style object
 */
export const toLineLayerStyle = (
  color: string,
  width: number = 5,
  opacity: number = 1.0,
) => ({
  lineColor: color,
  lineWidth: width,
  lineOpacity: opacity,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
})

// ---------------------------------------------------------------------------
// Wind level style factory
// ---------------------------------------------------------------------------

/**
 * Get wind overlay LineLayer style for a severity level.
 */
export const getWindLineStyle = (
  level: 'low' | 'moderate' | 'high',
  semantic: ExtendedTheme['semantic'],
  isDark: boolean,
) => {
  const hexColors = isDark ? windColors.dark : windColors.light
  const color = hexColors[level]
  return toLineLayerStyle(color, 5, level === 'high' ? 1.0 : 0.85)
}

// ---------------------------------------------------------------------------
// Rain level style factory
// ---------------------------------------------------------------------------

/**
 * Get rain overlay LineLayer style for an intensity level.
 */
export const getRainLineStyle = (
  level: 'none' | 'light' | 'moderate' | 'heavy',
  isDark: boolean,
) => {
  const colors = isDark ? rainColors.dark : rainColors.light
  const color = colors[level]
  if (level === 'none') return null
  return toLineLayerStyle(color, 6)
}

// ---------------------------------------------------------------------------
// Temperature level style factory
// ---------------------------------------------------------------------------

/**
 * Get temperature overlay LineLayer style for a comfort level.
 */
export const getTempLineStyle = (
  level: 'cold' | 'mild' | 'warm' | 'hot',
  isDark: boolean,
) => {
  const hexColors = isDark ? temperatureColors.dark : temperatureColors.light
  const color = hexColors[level]
  return toLineLayerStyle(color, 4, 0.9)
}
