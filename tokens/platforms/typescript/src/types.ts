// Public types for the LaneShadow theme. Mirror of the Swift / Kotlin shapes.

export type ColorScheme = 'light' | 'dark'

export interface ColorSet {
  default: string
  hover?: string
  pressed?: string
  disabled?: string
  focus?: string
}

export interface TypographyStyle {
  fontSize: number
  lineHeight: number
  fontWeight: string
}

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
