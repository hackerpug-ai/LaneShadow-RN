import React from 'react'

const createComponent = (name: string) => {
  const Component = ({ children, style, testID, ...props }: Record<string, unknown>) =>
    React.createElement(name, { style, testID, ...props }, children as React.ReactNode)
  Component.displayName = name
  return Component
}

export const View = createComponent('View')
export const Text = createComponent('Text')
export const TouchableOpacity = createComponent('TouchableOpacity')
export const TouchableWithoutFeedback = createComponent('TouchableWithoutFeedback')
export const TouchableHighlight = createComponent('TouchableHighlight')
export const ScrollView = createComponent('ScrollView')
export const FlatList = createComponent('FlatList')
export const Image = createComponent('Image')
export const TextInput = createComponent('TextInput')
export const Pressable = createComponent('Pressable')
export const SafeAreaView = createComponent('SafeAreaView')
export const Modal = createComponent('Modal')
export const ActivityIndicator = createComponent('ActivityIndicator')

export const StyleSheet = {
  create: (styles: Record<string, unknown>) => styles,
  flatten: (style: unknown) => style,
  hairlineWidth: 1,
}

export const Platform = {
  OS: 'ios',
  select: (options: Record<string, unknown>) => options.ios ?? options.default,
  Version: 15,
}

export const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
  addEventListener: () => ({ remove: () => undefined }),
}

export const Animated = {
  View: createComponent('AnimatedView'),
  Text: createComponent('AnimatedText'),
  Value: class {
    constructor(_val: number) {}
    setValue(_val: number) {}
    interpolate(_config: unknown) { return this }
  },
  timing: (_value: unknown, _config: unknown) => ({
    start: (_cb?: () => void) => undefined,
  }),
  spring: (_value: unknown, _config: unknown) => ({
    start: (_cb?: () => void) => undefined,
  }),
  parallel: (_animations: unknown[]) => ({
    start: (_cb?: () => void) => undefined,
  }),
  createAnimatedComponent: (component: unknown) => component,
}

export const LayoutAnimation = {
  configureNext: () => undefined,
  Presets: {
    easeInEaseOut: {},
    spring: {},
    linear: {},
  },
}

export const AccessibilityInfo = {
  isScreenReaderEnabled: () => Promise.resolve(false),
  addEventListener: () => ({ remove: () => undefined }),
  announceForAccessibility: () => undefined,
}

export const Alert = {
  alert: () => undefined,
}

export const Keyboard = {
  dismiss: () => undefined,
  addListener: () => ({ remove: () => undefined }),
}

export const NativeModules = {
  RNMBXModule: {}, // Enable RoutePolyline rendering in test env
}

export const I18nManager = {
  isRTL: false,
}

export const NativeModules = {
  RNMBXModule: {}, // Enable RoutePolyline rendering in test env
}

export const useColorScheme = () => 'dark'

export const useWindowDimensions = () => ({ width: 375, height: 812, scale: 1, fontScale: 1 })

export default {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Alert,
  Keyboard,
  NativeModules,
  useColorScheme,
  useWindowDimensions,
}
