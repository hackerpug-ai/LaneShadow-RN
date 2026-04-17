import type { Preview } from '@storybook/react'
import React from 'react'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Provider as PaperProvider } from 'react-native-paper'
import { darkTheme, lightTheme } from '../styles/theme'

/**
 * Storybook preview configuration
 * Wraps all stories in Paper theme provider
 */
const preview: Preview = {
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={darkTheme}>
          <View style={{ flex: 1, backgroundColor: darkTheme.semantic.color.background.default }}>
            <Story />
          </View>
        </PaperProvider>
      </GestureHandlerRootView>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
}

export default preview
