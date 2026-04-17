/**
 * Mock for react-native-gesture-handler
 */
import React from 'react'

const createComponent = (name: string) => {
  const Component = ({ children, style, testID, ...props }: Record<string, unknown>) =>
    React.createElement(name, { style, testID, ...props }, children as React.ReactNode)
  Component.displayName = name
  return Component
}

export const GestureDetector = createComponent('GestureDetector')
export const LongPressGestureHandler = createComponent('LongPressGestureHandler')
export const Gesture = {
  Tap: () => ({}),
  Pan: () => ({}),
  Pinch: () => ({}),
  Rotation: () => ({}),
  Fling: () => ({}),
  LongPress: () => ({}),
  Native: () => ({}),
  Root: () => ({}),
}
export const Directions = {
  UP: 1,
  DOWN: 2,
  LEFT: 4,
  RIGHT: 8,
}
export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
}

export const Button = {
  LEFT: 0,
  RIGHT: 1,
  MIDDLE: 2,
}

export const HandlerState = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
}

export default {
  GestureDetector,
  Gesture,
  Directions,
  State,
  Button,
  HandlerState,
}
