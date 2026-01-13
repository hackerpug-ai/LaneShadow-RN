/**
 * Theme configuration for React Native Template
 * Uses React Native Paper (Material Design 3) with additive semantic layer
 * Supports automatic light/dark mode based on device settings
 *
 * Following design-notes.md requirements:
 * - Semantic naming system layered on RNP (no overrides)
 * - State-aware color system (default, hover, pressed, disabled, focus)
 * - Components use theme.semantic.* only
 *
 * Following coding standards: composition over inheritance, type-safe exports
 */

import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper'
import type { ExtendedTheme, SemanticTheme } from './types'

/**
 * Brand colors for Lane Shadow (copper + dark industrial palette)
 */
const BRAND_COLORS = {
  primary: '#B87333', // Copper
  secondary: '#1A1C1F', // Secondary surface hue for MD3 secondary
  tertiary: '#2B9AEB', // Keep blue accent for informational elements
  error: '#E35D6A', // Status error
  success: '#31A362', // Status success (kept from prior palette)
  warning: '#D98E04', // Status warning
  info: '#2B9AEB',
  orange: '#FF6B35', // Legacy accent; keep available for UI flourishes
} as const

/**
 * Semantic spacing system based on 4pt grid
 * All spacing values are multiples of 4
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const

/**
 * Semantic border radius system
 * Aligned with HTML mock Tailwind config
 */
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8, // 0.5rem - default in mocks
  lg: 16, // 1rem - lg in mocks
  xl: 24, // 1.5rem - xl in mocks
  '2xl': 32,
  full: 9999,
} as const

/**
 * Minimum touch target size for accessibility (WCAG AA)
 */
export const MIN_TOUCH_TARGET = 44

/**
 * Helper to create color set with states
 */
const createColorSet = (
  base: string,
  hover?: string,
  pressed?: string,
  disabled?: string,
  focus?: string
) => ({
  default: base,
  ...(hover && { hover }),
  ...(pressed && { pressed }),
  ...(disabled && { disabled }),
  ...(focus && { focus }),
})

/**
 * Light theme semantic layer
 * Updated with warm, nurturing color palette
 */
const lightSemanticTheme: SemanticTheme = {
  color: {
    // Brand colors (copper) with light-mode states
    primary: createColorSet('#B87333', '#C58545', '#8C5A2B', '#E3C3A5'),
    secondary: createColorSet('#1A1C1F', '#24272B', '#0E0F11', '#D4CFCA'),
    tertiary: createColorSet('#2B9AEB', '#5DB3F0', '#1081D6', '#B8DCF5'),

    // Intent colors
    success: createColorSet('#31A362', '#4FBD7F', '#268A4D', '#A0DDB8'),
    warning: createColorSet('#D98E04', '#E6A42C', '#A86D00', '#F5D182'),
    danger: createColorSet('#E35D6A', '#EA7A88', '#C94352', '#F5B9C1'),
    info: createColorSet('#2B9AEB', '#5DB3F0', '#1081D6', '#B8DCF5'),

    // Surface layers (light)
    // Calibrated to pair with dark surface #2B2725; use warm off-white for parity
    surface: createColorSet('#F7F3EF', '#EFE8E2', '#E5DCD5', '#FFFFFF'),
    surfaceVariant: createColorSet('#EBE3DD', '#E2D8CF', '#D7CCC2', '#F7F1EB'),
    background: createColorSet('#F5F0EB', '#EEE8E2', '#E3DAD2', '#F5F0EB'),

    // On-surface text
    onSurface: {
      default: '#1E1E1E',
      hover: '#2A2A2A',
      pressed: '#141414',
      disabled: '#9CA3AF',
      muted: '#49454F',
      subtle: '#6B7280',
    },
    onPrimary: createColorSet('#0E0F11', '#0E0F11', '#0E0F11', '#3A2B1F'),
    onSecondary: createColorSet('#FFFFFF', '#EDEDED', '#DADADA', '#B3B3B3'),
    secondaryContainer: createColorSet('#FFFFFF', '#F5F3F0', '#EAE4DD', '#FFFFFF'),
    onSecondaryContainer: {
      default: '#1E1E1E',
      hover: '#2A2A2A',
      pressed: '#141414',
      disabled: '#8C7A6B',
      muted: '#5C4A3B',
      subtle: '#7C6A5B',
    },

    // UI element colors
    border: createColorSet('#D9D0C7', '#CEC3B9', '#C2B6AC', '#EFEAE4'),
    input: createColorSet('#FFFFFF', '#F5F3F0', '#EAE4DD', '#F7F3EE'),
    ring: createColorSet('#B87333', '#C58545', '#8C5A2B', '#E3C3A5'),

    // Component-specific
    card: createColorSet('#FFFFFF', '#F5F3F0', '#EAE4DD', '#FFFFFF'),
    popover: createColorSet('#FFFFFF', '#F5F3F0', '#EAE4DD', '#FFFFFF'),
    accent: createColorSet('#88C7A6', '#9DD4B7', '#73BA95', '#CAEAD9'),

    // Special colors
    orange: createColorSet('#FF6B35', '#FF8555', '#E6572E', '#FFB8A0'),
    muted: createColorSet('#F2EFED', '#EBE7E4', '#DCD7D3', '#F9F8F7'),
    divider: createColorSet('rgba(0,0,0,0.08)'),
    scrim: createColorSet('rgba(0,0,0,0.55)'),
    routeSelected: createColorSet('#B87333', '#C58545', '#8C5A2B'),
    routeAlternate: createColorSet('rgba(0,0,0,0.45)'),
  },

  space: SPACING,
  radius: BORDER_RADIUS,

  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' },
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' },
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' },
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' },
    },
  },

  elevation: {
    0: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 5,
    },
  },
}

/**
 * Dark theme semantic layer
 * Updated with warm, nurturing color palette adjusted for dark mode
 */
const darkSemanticTheme: SemanticTheme = {
  color: {
    // Brand colors (copper) with dark-mode states
    primary: createColorSet('#B87333', '#C58545', '#8C5A2B', '#6A3F1F'),
    secondary: createColorSet('#1A1C1F', '#24272B', '#0E0F11', '#4F5F72'),
    tertiary: createColorSet('#2B9AEB', '#5DB3F0', '#1081D6', '#1C6AA6'),

    // Intent colors
    success: createColorSet('#31A362', '#4FBD7F', '#268A4D', '#1B5F35'),
    warning: createColorSet('#D98E04', '#E6A42C', '#A86D00', '#A96419'),
    danger: createColorSet('#E35D6A', '#EA7A88', '#C94352', '#801B1B'),
    info: createColorSet('#2B9AEB', '#5DB3F0', '#1081D6', '#1C6AA6'),

    // Surface layers (dark)
    // Nav/tab surfaces should sit on #2B2725 by default
    surface: createColorSet('#2B2725', '#332F2B', '#221E1C', '#3A3431'),
    surfaceVariant: createColorSet('#34302D', '#3C3633', '#272321', '#3D3734'),
    background: createColorSet('#1B1715', '#231E1B', '#14110F', '#1B1715'),

    // On-surface text
    onSurface: {
      default: 'rgba(255,255,255,0.92)',
      hover: 'rgba(255,255,255,0.96)',
      pressed: 'rgba(255,255,255,0.86)',
      disabled: '#6B7280',
      muted: 'rgba(255,255,255,0.72)',
      subtle: 'rgba(255,255,255,0.55)',
    },
    onPrimary: createColorSet('#0E0F11', '#0E0F11', '#0E0F11', '#2A1F15'),
    onSecondary: createColorSet('#F8F7F6', '#FFFFFF', '#E3E3E3', '#6B7D8F'),
    secondaryContainer: createColorSet('#24272B', '#2D3136', '#1A1C1F', '#1A1C1F'),
    onSecondaryContainer: {
      default: '#E3E3E3',
      hover: '#EBEBEB',
      pressed: '#DADADA',
      disabled: '#B3A095',
      muted: '#D3BBA5',
      subtle: '#C3AB95',
    },

    // UI element colors
    border: createColorSet('#3A3431', '#443E3A', '#2F2A27', 'rgba(255,255,255,0.06)'),
    input: createColorSet('#24272B', '#2D3136', '#1A1C1F', '#1A1C1F'),
    ring: createColorSet('#B87333', '#C58545', '#8C5A2B', '#6A3F1F'),

    // Component-specific
    card: createColorSet('#24272B', '#2D3136', '#1A1C1F', '#1A1C1F'),
    popover: createColorSet('#24272B', '#2D3136', '#1A1C1F', '#1A1C1F'),
    accent: createColorSet('#407C5D', '#4D8F6B', '#346950', '#24473A'),

    // Special colors
    orange: createColorSet('#FF6B35', '#FF8555', '#E6572E', '#B8451F'),
    muted: createColorSet('#1A1C1F', '#24272B', '#0E0F11', '#1A1C1F'),
    divider: createColorSet('rgba(255,255,255,0.08)'),
    scrim: createColorSet('rgba(0,0,0,0.55)'),
    routeSelected: createColorSet('#B87333', '#C58545', '#8C5A2B'),
    routeAlternate: createColorSet('rgba(255,255,255,0.45)'),
  },

  space: SPACING,
  radius: BORDER_RADIUS,

  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' },
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' },
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' },
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' },
    },
  },

  elevation: {
    0: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 5,
    },
  },
}

/**
 * Light theme configuration
 * Extends React Native Paper's Material Design 3 light theme
 * Adds semantic layer without overriding RNP defaults
 */
export const lightTheme: ExtendedTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BRAND_COLORS.primary, // Copper
    secondary: '#1A1C1F', // Secondary surface hue
    tertiary: BRAND_COLORS.tertiary,
    error: BRAND_COLORS.error,
  },
  semantic: lightSemanticTheme,
}

/**
 * Dark theme configuration
 * Extends React Native Paper's Material Design 3 dark theme
 * Adds semantic layer without overriding RNP defaults
 */
export const darkTheme: ExtendedTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: BRAND_COLORS.primary,
    secondary: '#1A1C1F',
    tertiary: BRAND_COLORS.tertiary,
    error: BRAND_COLORS.error,
  },
  semantic: darkSemanticTheme,
}

/**
 * Helper to get theme based on color scheme
 * Returns ExtendedTheme with semantic layer
 */
export const getTheme = (isDark: boolean): ExtendedTheme => {
  return isDark ? darkTheme : lightTheme
}
