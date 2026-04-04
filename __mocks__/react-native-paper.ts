import React from 'react'
import { View, Text as RNText } from 'react-native'

export const PaperProvider = ({ children }: { children: React.ReactNode; theme?: unknown }) =>
  React.createElement(View, null, children)

// Alias for consumers that do `import { Provider as PaperProvider } from 'react-native-paper'`.
export const Provider = PaperProvider

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
