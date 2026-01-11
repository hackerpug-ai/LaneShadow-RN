import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { Stack } from 'expo-router'
import React from 'react'
import { Provider as PaperProvider } from 'react-native-paper'
import { useColorScheme } from '../hooks/use-color-scheme'
import { clerkTokenCache } from '../lib/clerk-token-cache'
import { env } from '../lib/env'
import { getTheme } from '../styles/theme'
import type { ExtendedTheme } from '../styles/types'

/**
 * Initialize Convex client from environment variable
 * Set EXPO_PUBLIC_CONVEX_URL in .env.local
 */
const convexClient = new ConvexReactClient(env.CONVEX_URL)

/**
 * Root layout component
 * Sets up Convex and Paper providers, initializes navigation
 */
export const RootLayout = () => {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const paperTheme: ExtendedTheme = getTheme(isDark)

  return (
    <ClerkProvider publishableKey={env.CLERK_PUBLISHABLE_KEY} tokenCache={clerkTokenCache}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <PaperProvider theme={paperTheme}>
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </BottomSheetModalProvider>
        </PaperProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

export default RootLayout
