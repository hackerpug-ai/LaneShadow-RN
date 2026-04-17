/**
 * Custom entry point for LaneShadow
 * Switches between Storybook and the main app based on environment variable
 */
import { registerRootComponent } from 'expo'

const STORYBOOK_ENABLED = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true'

if (STORYBOOK_ENABLED) {
  // Load Storybook
  const StorybookUI = require('./.rnstorybook').default
  registerRootComponent(StorybookUI)
} else {
  // Load the Expo Router app
  require('expo-router/entry')
}
