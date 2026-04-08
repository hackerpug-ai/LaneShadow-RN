/**
 * Semantic theme type definitions
 * Extends React Native Paper with additive semantic layer
 *
 * Following design-notes.md requirements:
 * - Semantic naming system layered on RNP (no overrides)
 * - State-aware color system
 * - Consistent spacing, radius, typography, elevation
 */

import type { MD3Theme } from 'react-native-paper'

/**
 * State variants for interactive elements
 */
export type ColorState = 'default' | 'hover' | 'pressed' | 'disabled' | 'focus'

/**
 * Semantic color structure with state support
 */
export type SemanticColorSet = {
  default: string
  hover?: string
  pressed?: string
  disabled?: string
  focus?: string
}

/**
 * Color roles for intent-driven usage
 */
export type SemanticColors = {
  // Primary brand colors with states
  primary: SemanticColorSet
  secondary: SemanticColorSet
  tertiary: SemanticColorSet

  // Intent colors
  success: SemanticColorSet
  warning: SemanticColorSet
  danger: SemanticColorSet
  info: SemanticColorSet

  // Surface layers
  surface: SemanticColorSet
  surfaceVariant: SemanticColorSet
  background: SemanticColorSet

  // On-surface text colors
  onSurface: SemanticColorSet & {
    muted?: string
    subtle?: string
  }
  onPrimary: SemanticColorSet
  onSecondary: SemanticColorSet

  secondaryContainer: SemanticColorSet
  onSecondaryContainer: SemanticColorSet & { muted?: string; subtle?: string }

  // UI element colors
  border: SemanticColorSet
  input: SemanticColorSet
  ring: SemanticColorSet

  // Location / POI colors
  locationPoiFill: SemanticColorSet
  locationPoiRing: SemanticColorSet
  locationPoiMuted: SemanticColorSet
  locationPoiBg: SemanticColorSet

  // Component-specific
  card: SemanticColorSet
  popover: SemanticColorSet
  accent: SemanticColorSet

  // Special colors
  orange: SemanticColorSet
  muted: SemanticColorSet

  // Added for design token alignment
  divider: SemanticColorSet
  scrim: SemanticColorSet
  routeSelected: SemanticColorSet
  routeAlternate: SemanticColorSet

  // Waypoint kind colors
  waypointOnRoute?: SemanticColorSet
  waypointOffRoute?: SemanticColorSet
  waypointMixed?: SemanticColorSet

  // Enrichment phase colors
  enrichmentFast?: SemanticColorSet
  enrichmentExtended?: SemanticColorSet
  enrichmentCached?: SemanticColorSet

  // Deviation path colors
  deviationOriginalRoute?: SemanticColorSet
  deviationDetourPath?: SemanticColorSet
  deviationReconnectPoint?: SemanticColorSet
}

/**
 * Semantic spacing scale
 */
export type SemanticSpacing = {
  xs: number // 4
  sm: number // 8
  md: number // 12
  lg: number // 16
  xl: number // 24
  '2xl': number // 32
  '3xl': number // 48
  '4xl': number // 64
}

/**
 * Semantic border radius scale
 */
export type SemanticRadius = {
  none: number // 0
  sm: number // 4
  md: number // 8
  lg: number // 12
  xl: number // 16
  '2xl': number // 20
  full: number // 9999
}

/**
 * React Native font weight types
 */
export type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'

/**
 * Typography style definition
 */
export type TypographyStyle = {
  fontSize: number
  lineHeight: number
  fontWeight: FontWeight
}

/**
 * Typography variants by category and size
 */
export type SemanticTypography = {
  label: {
    sm: TypographyStyle
    md: TypographyStyle
    lg: TypographyStyle
  }
  body: {
    sm: TypographyStyle
    md: TypographyStyle
    lg: TypographyStyle
  }
  title: {
    sm: TypographyStyle
    md: TypographyStyle
    lg: TypographyStyle
  }
  heading: {
    sm: TypographyStyle
    md: TypographyStyle
    lg: TypographyStyle
  }
  display: {
    sm: TypographyStyle
    md: TypographyStyle
    lg: TypographyStyle
  }
}

/**
 * Shadow style for React Native elevation
 */
export type ShadowStyle = {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number // Android elevation
}

/**
 * Semantic elevation levels (shadow/depth)
 */
export type SemanticElevation = {
  0: ShadowStyle // No elevation
  1: ShadowStyle // Minimal elevation
  2: ShadowStyle // Low elevation
  3: ShadowStyle // Medium elevation
  4: ShadowStyle // High elevation
  5: ShadowStyle // Maximum elevation
}

/**
 * Complete semantic theme structure
 * Additive layer on top of React Native Paper's MD3Theme
 */
export type SemanticTheme = {
  color: SemanticColors
  space: SemanticSpacing
  radius: SemanticRadius
  type: SemanticTypography
  elevation: SemanticElevation
}

/**
 * Extended theme that includes both RNP and semantic layers
 */
export type ExtendedTheme = MD3Theme & {
  semantic: SemanticTheme
}
