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
 * Brand colors for Hummingbird
 * Warm, nurturing palette with sunset orange primary
 * All colors in hex format for React Native compatibility
 * Values extracted from HTML mocks in /specs/mocks/
 */
const BRAND_COLORS = {
  primary: '#EE7C2B', // Warm sunset orange (from HTML mocks)
  secondary: '#C7DEEE', // Soft sky blue
  tertiary: '#2B9AEB', // Blue accent
  error: '#E85757', // Coral red (destructive)
  success: '#31A362', // Green
  warning: '#F5A247', // Amber/orange
  info: '#2B9AEB', // Blue
  orange: '#FF6B35', // Orange - brand accent
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
    // Primary brand colors with interactive states - Warm sunset orange (from mocks)
    primary: createColorSet(
      '#EE7C2B', // default - warm orange (exact from mocks)
      '#F29A5B', // hover (lighter)
      '#D96A1F', // pressed (darker)
      '#F9C9A8', // disabled
      '#EE7C2B' // focus (same as default)
    ),
    secondary: createColorSet(
      '#C7DEEE', // default - soft sky blue
      '#B8D6EA', // hover
      '#A9CEE6', // pressed
      '#E3F0F7' // disabled
    ),
    tertiary: createColorSet(
      '#2B9AEB', // default - blue accent
      '#5DB3F0', // hover
      '#1081D6', // pressed
      '#B8DCF5' // disabled
    ),

    // Intent colors
    success: createColorSet(
      '#31A362', // default - green
      '#4FBD7F', // hover
      '#268A4D', // pressed
      '#A0DDB8' // disabled
    ),
    warning: createColorSet(
      '#F5A247', // default - amber/orange
      '#F8BC6C', // hover
      '#E88C26', // pressed
      '#FDD9AE' // disabled
    ),
    danger: createColorSet(
      '#E85757', // default - coral red
      '#EE7F7F', // hover
      '#D63131', // pressed
      '#F6BEBE' // disabled
    ),
    info: createColorSet(
      '#2B9AEB', // default - blue
      '#5DB3F0', // hover
      '#1081D6', // pressed
      '#B8DCF5' // disabled
    ),

    // Surface layers
    surface: createColorSet(
      '#FFFFFF', // default - pure white
      '#FCFCFC', // hover - off-white
      '#F8EDE5', // pressed - light warm
      '#FCFCFC' // disabled
    ),
    surfaceVariant: createColorSet(
      '#F2EFED', // default - light warm gray
      '#EBE7E4', // hover
      '#DCD7D3', // pressed
      '#F9F8F7' // disabled
    ),
    background: createColorSet(
      '#F8F7F6', // default - light warm gray (exact from mocks)
      '#F5F4F3', // hover
      '#F2F1F0', // pressed
      '#F8F7F6' // disabled
    ),

    // On-surface text colors (from mocks)
    onSurface: {
      default: '#1E1E1E', // foreground - very dark gray (exact from mocks)
      hover: '#2A2A2A', // slightly lighter
      pressed: '#141414', // darker
      disabled: '#9CA3AF', // gray-400
      muted: '#49454F', // medium gray (exact from mocks)
      subtle: '#6B7280', // gray-500
    },
    onPrimary: createColorSet(
      '#FFFFFF', // default - white on primary
      '#FFFFFF', // hover
      '#F2F2F2', // pressed
      '#FFFFFF' // disabled
    ),
    onSecondary: createColorSet(
      '#1D4D6B', // default - dark blue text
      '#153C54', // hover
      '#2A5E7E', // pressed
      '#5E8FAD' // disabled
    ),
    secondaryContainer: createColorSet(
      '#FFDBBF', // default - warm peach (from HTML mock)
      '#FFCCA6', // hover
      '#FFBD8D', // pressed
      '#FFE8D8' // disabled
    ),
    onSecondaryContainer: {
      default: '#2C1600', // dark brown text (from HTML mock)
      hover: '#3A1E00', // slightly lighter
      pressed: '#1E0E00', // darker
      disabled: '#8C7A6B', // muted
      muted: '#5C4A3B', // medium
      subtle: '#7C6A5B', // subtle
    },

    // UI element colors
    border: createColorSet(
      '#E5DED9', // default - light warm border
      '#D6CBC3', // hover
      '#C7B8AD', // pressed
      '#F2EFED' // disabled
    ),
    input: createColorSet(
      '#F2EFED', // default - light warm input bg
      '#EBE7E4', // hover
      '#DCD7D3', // pressed
      '#F7F5F4' // disabled
    ),
    ring: createColorSet(
      '#EE7C2B', // default - primary color (from mocks)
      '#F29A5B', // hover
      '#D96A1F', // pressed
      '#F9C9A8' // disabled
    ),

    // Component-specific
    card: createColorSet(
      '#FFFFFF', // default - pure white
      '#FCFCFC', // hover
      '#F8EDE5', // pressed
      '#FFFFFF' // disabled
    ),
    popover: createColorSet(
      '#FFFFFF', // default - pure white
      '#FCFCFC', // hover
      '#F8EDE5', // pressed
      '#FFFFFF' // disabled
    ),
    accent: createColorSet(
      '#88C7A6', // default - gentle green
      '#9DD4B7', // hover
      '#73BA95', // pressed
      '#CAEAD9' // disabled
    ),

    // Special colors
    orange: createColorSet(
      '#FF6B35', // default - keep existing warm orange
      '#FF8555', // hover
      '#E6572E', // pressed
      '#FFB8A0' // disabled
    ),
    muted: createColorSet(
      '#F2EFED', // default - very light warm gray
      '#EBE7E4', // hover
      '#DCD7D3', // pressed
      '#F9F8F7' // disabled
    ),
  },

  space: SPACING,
  radius: BORDER_RADIUS,

  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' }, // Buttons/labels
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' }, // Medium labels
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' }, // Large labels
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' }, // Small text
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' }, // Regular text
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' }, // Large body
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' }, // Small titles
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' }, // Card titles
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' }, // Page titles
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' }, // Small sections
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' }, // Section titles
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' }, // Large sections
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' }, // Hero text
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' }, // Large hero
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' }, // Massive hero
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
      shadowOpacity: 0.05, // Light shadows from mocks
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, // shadow-[0_2px_4px_rgba(0,0,0,0.05)] from mocks
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
      shadowOpacity: 0.15, // shadow-lg from mocks
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
    // Primary brand colors with interactive states - From mocks
    primary: createColorSet(
      '#EE7C2B', // default - warm orange (same as light mode per mocks)
      '#F29A5B', // hover (lighter)
      '#D96A1F', // pressed (darker)
      '#F9C9A8', // disabled
      '#EE7C2B' // focus
    ),
    secondary: createColorSet(
      '#293847', // default - dark blue-gray
      '#354556', // hover
      '#1E2B38', // pressed
      '#4F5F72' // disabled
    ),
    tertiary: createColorSet(
      '#2B9AEB', // default - blue accent
      '#5DB3F0', // hover
      '#1081D6', // pressed
      '#1C6AA6' // disabled
    ),

    // Intent colors (adjusted for dark mode)
    success: createColorSet(
      '#31A362', // default - green
      '#4FBD7F', // hover
      '#268A4D', // pressed
      '#1B5F35' // disabled
    ),
    warning: createColorSet(
      '#F5A247', // default - amber/orange
      '#F8BC6C', // hover
      '#E88C26', // pressed
      '#A96419' // disabled
    ),
    danger: createColorSet(
      '#E14747', // default - darker red for dark mode
      '#EB7070', // hover
      '#C92929', // pressed
      '#801B1B' // disabled
    ),
    info: createColorSet(
      '#2B9AEB', // default - blue
      '#5DB3F0', // hover
      '#1081D6', // pressed
      '#1C6AA6' // disabled
    ),

    // Surface layers (based on mock patterns)
    surface: createColorSet(
      '#2D2218', // default - dark card (slightly lighter than background)
      '#362A1F', // hover
      '#3F3126', // pressed
      '#24190F' // disabled
    ),
    surfaceVariant: createColorSet(
      '#362A1F', // default - dark muted
      '#3F3126', // hover
      '#48392D', // pressed
      '#2D2218' // disabled
    ),
    background: createColorSet(
      '#221810', // default - dark warm brown (exact from mocks)
      '#2A1F15', // hover
      '#1A120B', // pressed
      '#221810' // disabled
    ),

    // On-surface text colors (from mocks)
    onSurface: {
      default: '#E3E3E3', // light gray text (exact from mocks)
      hover: '#EBEBEB', // lighter
      pressed: '#DADADA', // darker
      disabled: '#6B7280', // gray-500
      muted: '#CAC4D0', // light gray (exact from mocks)
      subtle: '#9CA3AF', // gray-400
    },
    onPrimary: createColorSet(
      '#FFFFFF', // default - white text on primary (from mocks)
      '#FFFFFF', // hover
      '#F2F2F2', // pressed
      '#E5E5E5' // disabled
    ),
    onSecondary: createColorSet(
      '#F8EDE5', // default - light text
      '#FCF5F0', // hover
      '#F3E2D6', // pressed
      '#6B7D8F' // disabled
    ),
    secondaryContainer: createColorSet(
      '#6F4A2C', // default - warm brown (from HTML mock)
      '#805638', // hover
      '#5E3E20', // pressed
      '#4A3216' // disabled
    ),
    onSecondaryContainer: {
      default: '#FFDBBF', // warm peach text (from HTML mock)
      hover: '#FFE8D8', // lighter
      pressed: '#FFCCA6', // slightly darker
      disabled: '#B3A095', // muted
      muted: '#D3BBA5', // medium
      subtle: '#C3AB95', // subtle
    },

    // UI element colors (adjusted for warm dark background)
    border: createColorSet(
      '#3D3228', // default - dark warm border
      '#4A3D31', // hover
      '#57493A', // pressed
      '#302519' // disabled
    ),
    input: createColorSet(
      '#362A1F', // default - dark warm input
      '#3F3126', // hover
      '#48392D', // pressed
      '#2D2218' // disabled
    ),
    ring: createColorSet(
      '#EE7C2B', // default - primary color (from mocks)
      '#F29A5B', // hover
      '#D96A1F', // pressed
      '#F9C9A8' // disabled
    ),

    // Component-specific
    card: createColorSet(
      '#2D2218', // default - dark card (matches surface)
      '#362A1F', // hover
      '#3F3126', // pressed
      '#24190F' // disabled
    ),
    popover: createColorSet(
      '#2D2218', // default - dark card
      '#362A1F', // hover
      '#3F3126', // pressed
      '#24190F' // disabled
    ),
    accent: createColorSet(
      '#407C5D', // default - darker green for dark mode
      '#4D8F6B', // hover
      '#346950', // pressed
      '#24473A' // disabled
    ),

    // Special colors - keep warm orange consistent
    orange: createColorSet(
      '#FF6B35', // default - keep existing
      '#FF8555', // hover
      '#E6572E', // pressed
      '#B8451F' // disabled - darker for dark mode
    ),
    muted: createColorSet(
      '#362A1F', // default - dark muted
      '#3F3126', // hover
      '#48392D', // pressed
      '#2D2218' // disabled
    ),
  },

  space: SPACING,
  radius: BORDER_RADIUS,

  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' }, // Buttons/labels
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' }, // Medium labels
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' }, // Large labels
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' }, // Small text
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' }, // Regular text
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' }, // Large body
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' }, // Small titles
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' }, // Card titles
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' }, // Page titles
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' }, // Small sections
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' }, // Section titles
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' }, // Large sections
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' }, // Hero text
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' }, // Large hero
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' }, // Massive hero
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
      shadowOpacity: 0.2, // Heavier shadows for dark mode (from mocks)
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2, // shadow-[0_2px_4px_rgba(0,0,0,0.2)] from mocks
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
      shadowOpacity: 0.35, // Stronger shadow-lg for dark mode
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
    primary: BRAND_COLORS.primary, // Warm sunset orange
    secondary: BRAND_COLORS.secondary, // Soft sky blue
    tertiary: BRAND_COLORS.tertiary, // Blue accent
    error: BRAND_COLORS.error, // Coral red
    // Keep all other MD3 defaults
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
    primary: '#EE7C2B', // Warm orange (from mocks)
    secondary: '#293847', // Dark blue-gray
    tertiary: '#2B9AEB', // Blue accent
    error: '#E14747', // Darker red for dark mode
    // Keep all other MD3 defaults
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
