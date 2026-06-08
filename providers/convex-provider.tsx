/**
 * Convex Provider for React Native
 *
 * Pure token-based auth flow with no SDK dependency
 * Initializes Convex client and sets up optional auth token fetcher
 */

import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'
import { env } from '../server/lib/env'

// Create Convex client instance (shared across the app)
export const convexClient = new ConvexReactClient(env.CONVEX_URL, {
  unsavedChangesWarning: false,
})

type ConvexProviderProps = {
  children: ReactNode
}

/**
 * ConvexProvider component wraps the app with Convex client
 * Required for useQuery/useMutation/useAction hooks
 */
export const ConvexProvider = ({ children }: ConvexProviderProps) => {
  return <BaseConvexProvider client={convexClient}>{children}</BaseConvexProvider>
}
