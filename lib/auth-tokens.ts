/**
 * Auth Token Storage Utilities
 *
 * Centralized token management for WorkOS OAuth
 * Tokens stored securely via asyncStorage (expo-secure-store / localStorage)
 */

import { asyncStorage } from '../hooks/use-async-storage'

/**
 * Get stored access token for Convex auth
 * Used by ConvexProvider to automatically include JWT in requests
 */
export const getStoredAccessToken = async (): Promise<string | undefined> => {
  const token = await asyncStorage.getItem('workos_access_token')
  if (token) {
  } else {
  }
  return token ?? undefined
}

/**
 * Store access token securely
 */
export const storeAccessToken = async (token: string): Promise<void> => {
  await asyncStorage.setItem('workos_access_token', token)
}

/**
 * Store refresh token securely
 */
export const storeRefreshToken = async (token: string): Promise<void> => {
  await asyncStorage.setItem('workos_refresh_token', token)
}

/**
 * Get stored refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return await asyncStorage.getItem('workos_refresh_token')
}

/**
 * Store token expiry time (Unix timestamp in seconds)
 */
export const storeTokenExpiry = async (expiresAt: number): Promise<void> => {
  await asyncStorage.setItem('workos_token_expiry', expiresAt.toString())
}

/**
 * Get stored token expiry time (Unix timestamp in seconds)
 */
export const getTokenExpiry = async (): Promise<number | null> => {
  const expiry = await asyncStorage.getItem('workos_token_expiry')
  return expiry ? parseInt(expiry, 10) : null
}

/**
 * Store code verifier for PKCE flow
 */
export const storeCodeVerifier = async (verifier: string): Promise<void> => {
  await asyncStorage.setItem('workos_code_verifier', verifier)
}

/**
 * Get stored code verifier
 */
export const getCodeVerifier = async (): Promise<string | null> => {
  return await asyncStorage.getItem('workos_code_verifier')
}

/**
 * Store active organization ID
 */
export const storeActiveOrganizationId = async (orgId: string): Promise<void> => {
  await asyncStorage.setItem('active_organization_id', orgId)
}

/**
 * Get stored active organization ID
 */
export const getActiveOrganizationId = async (): Promise<string | null> => {
  return await asyncStorage.getItem('active_organization_id')
}

/**
 * Clear active organization ID
 */
export const clearActiveOrganizationId = async (): Promise<void> => {
  await asyncStorage.removeItem('active_organization_id')
}

/**
 * Clear all auth tokens and session data
 */
export const clearAllTokens = async (): Promise<void> => {
  await asyncStorage.clearAll()
}
