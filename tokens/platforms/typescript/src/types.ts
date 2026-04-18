import type { tokens } from './generated/tokens'

export type Tokens = typeof tokens
export type ColorScheme = 'light' | 'dark'
export type ThemeColors = Tokens['semantic']['color']['light']
export type ThemeSpace = Tokens['semantic']['space']
export type ThemeRadius = Tokens['semantic']['radius']
export type ThemeType = Tokens['semantic']['type']

export interface Theme {
  scheme: ColorScheme
  colors: ThemeColors
  space: ThemeSpace
  radius: ThemeRadius
  type: ThemeType
}
