/**
 * Mock for expo-haptics
 * Provides stub implementations for haptic feedback
 */

export const ImpactFeedbackStyle = {
  Light: 0,
  Medium: 1,
  Heavy: 2,
}

export const NotificationFeedbackType = {
  Success: 0,
  Warning: 1,
  Error: 2,
}

export const impactAsync = () => Promise.resolve()
export const notificationAsync = () => Promise.resolve()
export const selectionAsync = () => Promise.resolve()

export default {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  selectionAsync,
}
