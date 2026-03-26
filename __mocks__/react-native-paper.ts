import React from 'react'
import { View } from 'react-native'

export const PaperProvider = ({ children }: { children: React.ReactNode; theme?: unknown }) =>
  React.createElement(View, null, children)

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
