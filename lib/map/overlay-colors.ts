/**
 * Overlay color utilities for route polylines
 *
 * Provides color functions for different weather overlay types:
 * - Rain: blue tints (light=sky, moderate=blue, heavy=indigo/red)
 * - Wind: semantic colors (low=success, moderate=warning, high=danger)
 * - Temperature: thermal colors (cold=blue, mild=green, warm=orange, hot=red)
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
 * Temperature intensity levels
 */
export type TemperatureLevel = 'cold' | 'mild' | 'warm' | 'hot'

/**
 * Rain color scheme for route polylines
 *
 * Color mapping using semantic theme colors:
 * - none: Green (success) - clear riding, no rain
 * - light: Sky blue (routeAlternate) - light rain, visibility good
 * - moderate: Blue (info) - moderate rain, use caution
 * - heavy: Red (danger) - heavy rain, consider alternate route
 *
 * These colors are WCAG-compliant for visibility on dark map backgrounds.
 */

/**
 * Returns the color for a rain intensity level.
 *
 * Uses semantic theme colors for rain:
 * - none: Green (success) - clear riding
 * - light: Sky blue (routeAlternate) - light rain
 * - moderate: Blue (info) - moderate rain
 * - heavy: Red (danger) - heavy rain, avoid
 *
 * @param level - Rain intensity level
 * @param semantic - Semantic theme with intent colors
 * @returns Hex color string for polyline rendering
 *
 * @example
 * getRainColor('light', semantic) // Returns routeAlternate sky blue
 */
export const getRainColor = (level: string, semantic: ExtendedTheme['semantic']): string => {
  switch (level) {
    case 'none':
      return semantic.color.success.default
    case 'light':
      return semantic.color.routeAlternate.default
    case 'moderate':
      return semantic.color.info.default
    case 'heavy':
      return semantic.color.danger.default
    default:
      return semantic.color.muted.default
  }
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

/**
 * Returns the color for a temperature level.
 *
 * Uses semantic theme colors for temperature:
 * - cold: Blue (routeAlternate) - below 40°F, cold conditions
 * - mild: Green (success) - 65-75°F, comfortable riding
 * - warm: Orange (orange) - 75-85°F, warm but tolerable
 * - hot: Red (danger) - above 90°F, extreme heat, avoid
 *
 * @param level - Temperature level
 * @param semantic - Semantic theme with intent colors
 * @returns Hex color string for polyline rendering
 *
 * @example
 * getTemperatureColor('cold', semantic) // Returns routeAlternate blue
 */
export const getTemperatureColor = (level: string, semantic: ExtendedTheme['semantic']): string => {
  switch (level) {
    case 'cold':
      return semantic.color.routeAlternate.default
    case 'mild':
      return semantic.color.success.default
    case 'warm':
      return semantic.color.orange.default
    case 'hot':
      return semantic.color.danger.default
    default:
      return semantic.color.muted.default
  }
}
