import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Provider as PaperProvider } from 'react-native-paper'
import { ErrorBoundary } from '../components/logging/error-boundary'
import { ThemePreferenceProvider, useThemePreference } from '../contexts/theme-preference'
import { SearchResultsProvider } from '../contexts/search-results'
import { clerkTokenCache } from '../lib/clerk-token-cache'
import { env } from '../lib/env'
import { initLogger, logger } from '../lib/logger/frontend-logger'
import { getTheme } from '../styles/theme'
import type { ExtendedTheme } from '../styles/types'

/**
 * Initialize Convex client from environment variable
 * Set EXPO_PUBLIC_CONVEX_URL in .env.local
 */
const convexClient = new ConvexReactClient(env.CONVEX_URL)

/**
 * Inner layout component that uses the theme preference
 * Must be inside ThemePreferenceProvider
 */
const RootLayoutInner = () => {
  const { isDark } = useThemePreference()
  const paperTheme: ExtendedTheme = getTheme(isDark)

  // Initialize logger on app start
  useEffect(() => {
    const sessionId = `sess_${Date.now()}`
    initLogger(sessionId)

    logger.info('system.startup', 'App initialized', { sessionId })

    return () => {
      // Flush logs on unmount
      logger.flush()
    }
  }, [])

  return (
    <ClerkProvider publishableKey={env.CLERK_PUBLISHABLE_KEY} tokenCache={clerkTokenCache}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <PaperProvider theme={paperTheme}>
          <SearchResultsProvider>
            <BottomSheetModalProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'none',
                }}
              />
            </BottomSheetModalProvider>
          </SearchResultsProvider>
        </PaperProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

/**
 * Root layout component
 * Wraps the app in ThemePreferenceProvider and other top-level providers
 */
export const RootLayout = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemePreferenceProvider>
          <RootLayoutInner />
        </ThemePreferenceProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}

export default RootLayout
