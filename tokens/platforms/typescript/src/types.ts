// Public types for the LaneShadow theme. Mirror of the Swift / Kotlin shapes.
// ColorSet and TypographyStyle now come from native-theme-primitives so all
// consumers across platforms agree on the primitive shapes.

export type {
  ColorSet,
  ElevationStyle,
  TypographyStyle,
} from 'native-theme-primitives'

import type { ColorSet, TypographyStyle } from 'native-theme-primitives'

export type ColorScheme = 'light' | 'dark'

export interface TypeScale {
  sm: TypographyStyle
  md: TypographyStyle
  lg: TypographyStyle
}

export interface ThemeType {
  label: TypeScale
  body: TypeScale
  title: TypeScale
  heading: TypeScale
  display: TypeScale
}

export interface ThemeSpace {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
  '3xl': number
  '4xl': number
}

export interface ThemeRadius {
  none: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
  full: number
}

export interface Theme {
  scheme: ColorScheme
  // Keyed by semantic color group (primary, secondary, surface, waypointOnRoute, …).
  colors: Record<string, ColorSet>
  space: ThemeSpace
  radius: ThemeRadius
  type: ThemeType
}
