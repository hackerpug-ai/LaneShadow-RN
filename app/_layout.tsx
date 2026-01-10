import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { Stack } from 'expo-router'
import React, { useMemo } from 'react'
import { Provider as PaperProvider } from 'react-native-paper'

/**
 * Initialize Convex client from environment variable
 * Set EXPO_PUBLIC_CONVEX_URL in .env.local
 */
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error('EXPO_PUBLIC_CONVEX_URL environment variable is not set')
}
const convexClient = new ConvexReactClient(convexUrl)

/**
 * Root layout component
 * Sets up Convex and Paper providers, initializes navigation
 */
export const RootLayout = () => {
  // Placeholder theme - extend with semantic theme as needed
  const paperTheme = useMemo(() => ({}), [])

  return (
    <ConvexProvider client={convexClient}>
      <PaperProvider theme={paperTheme}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </BottomSheetModalProvider>
      </PaperProvider>
    </ConvexProvider>
  )
}

export default RootLayout
