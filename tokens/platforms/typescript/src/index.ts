import { useColorScheme } from 'react-native'
import { tokens } from './generated/tokens'
import type { ColorScheme, Theme } from './types'

export type {
  ColorScheme,
  Theme,
  ThemeColors,
  ThemeRadius,
  ThemeSpace,
  ThemeType,
  Tokens,
} from './types'
export { tokens }

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? (tokens.semantic.color.dark as never) : tokens.semantic.color.light,
    space: tokens.semantic.space,
    radius: tokens.semantic.radius,
    type: tokens.semantic.type,
  }
}

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme
  return buildTheme(scheme)
}
