/**
 * OAuth Flow Hook
 *
 * Manages OAuth authentication state for Google, Apple, etc.
 * Platform-aware: uses expo-web-browser on mobile, standard redirect on web
 */

import { useSSO } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useEffect } from 'react'
import { Platform } from 'react-native'

// Required for Clerk OAuth to work properly with Expo WebBrowser (mobile only)
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession()
}

/**
 * Warm up browser for better UX on Android
 * Recommended by Expo for authentication flows
 * Web platform: no-op (already in browser)
 */
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return

    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

type UseOAuthFlowOptions = {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const OAUTH_FLOW_PROVIDERS = {
  google: 'oauth_google',
  apple: 'oauth_apple',
} as const

export type OAuthFlowProvider = (typeof OAUTH_FLOW_PROVIDERS)[keyof typeof OAUTH_FLOW_PROVIDERS]

/**
 * Hook to manage OAuth flow with a specific provider
 *
 * Returns a function to start the OAuth flow using Clerk + WebBrowser
 * Handles session creation and error states
 */
export const useOAuthFlow = (strategy: OAuthFlowProvider, options?: UseOAuthFlowOptions) => {
  const { startSSOFlow } = useSSO()

  const startFlow = async () => {
    try {
      // Platform-specific redirect URLs
      // Mobile: Use deep link scheme (ournanny://oauth-callback)
      // Web: Use HTTP callback URL (window.location.origin + /oauth-callback)
      const redirectUrl =
        Platform.OS === 'web'
          ? `${window.location.origin}/oauth-callback`
          : Linking.createURL('oauth-callback')

      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
        redirectUrl: redirectUrl,
        authSessionOptions: {
          showInRecents: true,
        },
      })

      if (createdSessionId) {
        // Session created successfully
        await setActive!({ session: createdSessionId })
        options?.onSuccess?.()
      } else {
        // For MVP, we'll treat this as an error
        // In production, handle these flows properly
        options?.onError?.(new Error('OAuth requires additional steps'))
      }
    } catch (err) {
      options?.onError?.(err as Error)
    }
  }

  return {
    startFlow,
  }
}
