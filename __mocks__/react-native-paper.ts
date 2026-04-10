import React from 'react'
import { View, Text as RNText } from 'react-native'

export const PaperProvider = ({ children }: { children: React.ReactNode; theme?: unknown }) =>
  React.createElement(View, null, children)

// Alias for consumers that do `import { Provider as PaperProvider } from 'react-native-paper'`.
export const Provider = PaperProvider

// Alias for ThemeProvider
export const ThemeProvider = PaperProvider

export const MD3DarkTheme = {
  dark: true,
  version: 3,
  colors: {},
}

export const MD3LightTheme = {
  dark: false,
  version: 3,
  colors: {},
}

// Text component - wraps RN Text, ignores variant prop
export const Text = ({
  children,
  variant: _variant,
  style,
  testID,
  ...props
}: {
  children?: React.ReactNode
  variant?: string
  style?: unknown
  testID?: string
  [key: string]: unknown
}) => React.createElement(RNText, { style, testID, ...props }, children)

// useTheme hook - returns empty theme (components should use useSemanticTheme mock instead)
export const useTheme = () => ({
  colors: {},
  semantic: {
    color: {
      primary: { default: '#B87333' },
      secondary: { default: '#1A1C1F' },
      tertiary: { default: '#2B9AEB' },
      success: { default: '#31A362' },
      warning: { default: '#D98E04' },
      danger: { default: '#E35D6A' },
      info: { default: '#2B9AEB' },
      surface: { default: '#1B1715' },
      surfaceVariant: { default: '#2B2725' },
      background: { default: '#1B1715' },
      onSurface: { default: '#F5F0EB', muted: '#9CA3AF', subtle: '#6B7280' },
      onPrimary: { default: '#FFFFFF' },
      onSecondary: { default: '#FFFFFF' },
      secondaryContainer: { default: '#2B2725' },
      onSecondaryContainer: { default: '#F5F0EB', muted: '#9CA3AF', subtle: '#6B7280' },
      border: { default: '#2B2725' },
      input: { default: '#2B2725' },
      ring: { default: '#B87333' },
      locationPoiFill: { default: '#EDEDED' },
      locationPoiRing: { default: '#B87333' },
      locationPoiMuted: { default: '#A3A3A3' },
      locationPoiBg: { default: '#F3EFE8' },
      card: { default: '#24272B' },
      popover: { default: '#24272B' },
      accent: { default: '#88C7A6' },
      orange: { default: '#FF6B35' },
      muted: { default: '#938F99' },
      divider: { default: '#CAC4D0' },
      scrim: { default: '#000000' },
      routeSelected: { default: '#FF6B35' },
      routeAlternate: { default: '#60a5fa' },
      deviationOriginalRoute: { default: '#9CA3AF' },
      deviationDetourPath: { default: '#FF6B35' },
      deviationReconnectPoint: { default: '#31A362' },
    },
    space: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      '2xl': 32,
      '3xl': 48,
      '4xl': 64,
    },
    radius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      '2xl': 20,
      full: 9999,
    },
    type: {
      label: {
        sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
        md: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
        lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
      },
      body: {
        sm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
        md: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
        lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
      },
      title: {
        sm: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
        md: { fontSize: 18, lineHeight: 28, fontWeight: '500' as const },
        lg: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
      },
      heading: {
        sm: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
        md: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
        lg: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
      },
      display: {
        sm: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
        md: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const },
        lg: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const },
      },
    },
    elevation: {
      0: { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
      1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 1 },
      2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
      3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
    },
  },
})

export const Badge = ({
  children,
  style,
  testID,
  ...props
}: {
  children?: React.ReactNode
  style?: unknown
  testID?: string
  [key: string]: unknown
}) => React.createElement(View, { style, testID, ...props }, children)
