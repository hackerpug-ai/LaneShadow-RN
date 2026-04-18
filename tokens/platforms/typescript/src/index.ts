import { useColorScheme } from 'react-native'
import rawTokens from '../../../semantic/semantic.tokens.json'
import type {
  ColorScheme,
  ColorSet,
  Theme,
  ThemeRadius,
  ThemeSpace,
  ThemeType,
  TypeScale,
  TypographyStyle,
} from './types'

// DTCG leaf helper types (every node in the JSON is { $type, $value }).
interface Leaf<T> {
  $type: string
  $value: T
}

type ColorLeaf = Leaf<string>
type NumberLeaf = Leaf<number>
type StringLeaf = Leaf<string>

interface ColorStatesRaw {
  default: ColorLeaf
  hover?: ColorLeaf
  pressed?: ColorLeaf
  disabled?: ColorLeaf
  focus?: ColorLeaf
  muted?: ColorLeaf
  subtle?: ColorLeaf
}

interface TypeStyleRaw {
  fontSize: NumberLeaf
  lineHeight: NumberLeaf
  fontWeight: StringLeaf
}

/**
 * Raw DTCG-shaped tokens as imported from the canonical JSON source. Exposed
 * for escape-hatch access; prefer `useTheme()` for typical consumers.
 */
export const tokens = rawTokens as typeof rawTokens

// ——— Unwrap helpers ———

function unwrapColorStates(group: ColorStatesRaw): ColorSet {
  return {
    default: group.default.$value,
    hover: group.hover?.$value,
    pressed: group.pressed?.$value,
    disabled: group.disabled?.$value,
    focus: group.focus?.$value,
  }
}

function unwrapColors(mode: Record<string, ColorStatesRaw>): Record<string, ColorSet> {
  const out: Record<string, ColorSet> = {}
  for (const [key, group] of Object.entries(mode)) {
    out[key] = unwrapColorStates(group)
  }
  return out
}

function unwrapDimensionMap<K extends string>(src: Record<K, NumberLeaf>): Record<K, number> {
  const out = {} as Record<K, number>
  for (const [key, leaf] of Object.entries(src) as [K, NumberLeaf][]) {
    out[key] = leaf.$value
  }
  return out
}

function unwrapTypeStyle(src: TypeStyleRaw): TypographyStyle {
  return {
    fontSize: src.fontSize.$value,
    lineHeight: src.lineHeight.$value,
    fontWeight: src.fontWeight.$value,
  }
}

function unwrapTypeScale(src: { sm: TypeStyleRaw; md: TypeStyleRaw; lg: TypeStyleRaw }): TypeScale {
  return {
    sm: unwrapTypeStyle(src.sm),
    md: unwrapTypeStyle(src.md),
    lg: unwrapTypeStyle(src.lg),
  }
}

// ——— Theme builder ———

export function buildTheme(scheme: ColorScheme): Theme {
  const raw = rawTokens as unknown as {
    semantic: {
      color: {
        light: Record<string, ColorStatesRaw>
        dark: Record<string, ColorStatesRaw>
      }
      space: Record<string, NumberLeaf>
      radius: Record<string, NumberLeaf>
      type: {
        label: { sm: TypeStyleRaw; md: TypeStyleRaw; lg: TypeStyleRaw }
        body: { sm: TypeStyleRaw; md: TypeStyleRaw; lg: TypeStyleRaw }
        title: { sm: TypeStyleRaw; md: TypeStyleRaw; lg: TypeStyleRaw }
        heading: { sm: TypeStyleRaw; md: TypeStyleRaw; lg: TypeStyleRaw }
        display: { sm: TypeStyleRaw; md: TypeStyleRaw; lg: TypeStyleRaw }
      }
    }
  }

  const mode = scheme === 'dark' ? raw.semantic.color.dark : raw.semantic.color.light
  const space = unwrapDimensionMap(raw.semantic.space) as unknown as ThemeSpace
  const radius = unwrapDimensionMap(raw.semantic.radius) as unknown as ThemeRadius

  const type: ThemeType = {
    label: unwrapTypeScale(raw.semantic.type.label),
    body: unwrapTypeScale(raw.semantic.type.body),
    title: unwrapTypeScale(raw.semantic.type.title),
    heading: unwrapTypeScale(raw.semantic.type.heading),
    display: unwrapTypeScale(raw.semantic.type.display),
  }

  return {
    scheme,
    colors: unwrapColors(mode),
    space,
    radius,
    type,
  }
}

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme
  return buildTheme(scheme)
}

export type {
  ColorScheme,
  ColorSet,
  Theme,
  ThemeRadius,
  ThemeSpace,
  ThemeType,
  TypeScale,
  TypographyStyle,
} from './types'
