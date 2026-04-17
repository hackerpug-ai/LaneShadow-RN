import AsyncStorage from '@react-native-async-storage/async-storage'
import { view } from './storybook.requires'

/**
 * Storybook Native entry point
 * CRITICAL: Pass AsyncStorage explicitly to fix storage errors
 */
const StorybookUI = view.getStorybookUI({
  storage: AsyncStorage,
})

export default StorybookUI
