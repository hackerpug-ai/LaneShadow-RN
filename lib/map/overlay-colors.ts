/**
 * Overlay color utilities for route polylines
 *
 * Provides color functions for different weather overlay types:
 * - Rain: blue tints (light=sky, moderate=blue, heavy=indigo/red)
 * - Wind: semantic colors (low=success, moderate=warning, high=danger)
 *
 * Colors are WCAG-compliant for visibility on dark map backgrounds.
 *
 * @see overlay-colors.test.ts for acceptance criteria
 */

import type { ExtendedTheme } from '../../styles/types'

/**
 * Rain intensity levels
 */
export type RainLevel = 'none' | 'light' | 'moderate' | 'heavy'

/**
 * Wind intensity levels
 */
export type WindLevel = 'low' | 'moderate' | 'high'

/**
 * Rain color scheme for route polylines
 *
 * Color mapping:
 * - none: Green (#22c55e) - clear riding, no rain
 * - light: Sky blue (#60a5fa) - light rain, visibility good
 * - moderate: Blue (#3b82f6) - moderate rain, use caution
 * - heavy: Red (#ef4444) - heavy rain, consider alternate route
 *
 * These colors are WCAG-compliant for visibility on dark map backgrounds.
 */
const RAIN_COLORS: Record<RainLevel, string> = {
  none: '#22c55e',      // green - clear riding
  light: '#60a5fa',     // sky blue - light rain
  moderate: '#3b82f6',  // blue - moderate rain
  heavy: '#ef4444',     // red - heavy rain, avoid
}

/**
 * Returns the color for a rain intensity level.
 *
 * @param level - Rain intensity level
 * @param semantic - Semantic theme (for default fallback color)
 * @returns Hex color string for polyline rendering
 *
 * @example
 * getRainColor('light', semantic) // Returns '#60a5fa'
 */
export const getRainColor = (level: string, semantic: ExtendedTheme['semantic']): string => {
  if (level in RAIN_COLORS) {
    return RAIN_COLORS[level as RainLevel]
  }
  // Fallback to muted gray for unknown levels
  return semantic.color.muted.default
}

/**
 * Returns the color for a wind intensity level.
 *
 * Uses semantic theme colors for wind:
 * - low: Green (success) - tailwind assist
 * - moderate: Amber (warning) - crosswind, moderate effort
 * - high: Red (danger) - headwind, extreme effort
 *
 * @param level - Wind intensity level
 * @param semantic - Semantic theme with intent colors
 * @returns Hex color string for polyline rendering
 *
 * @example
 * getWindColor('low', semantic) // Returns success green
 */
export const getWindColor = (level: string, semantic: ExtendedTheme['semantic']): string => {
  switch (level) {
    case 'low':
      return semantic.color.success.default
    case 'moderate':
      return semantic.color.warning.default
    case 'high':
      return semantic.color.danger.default
    default:
      return semantic.color.info.default
  }
}
