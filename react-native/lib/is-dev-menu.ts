/**
 * Dev Menu Mode Detection
 *
 * Used to enable dev/testing menu in the UI:
 * - Floating button overlay for model management
 * - Quick access to clear model, reset setup state, etc.
 *
 * Enable by:
 * - CLI: EXPO_PUBLIC_DEV_MENU=1 pnpm start
 * - Web (local): http://localhost:8081?devMenu=1
 * - Web (Vercel): https://your-app.vercel.app?devMenu=1
 *
 * Automatically enabled in __DEV__ mode.
 */

/**
 * Check if dev menu is enabled
 * Enabled when EXPO_PUBLIC_DEV_MENU=1 OR __DEV__ is true
 */
export const isDevMenuEnabled = process.env.EXPO_PUBLIC_DEV_MENU === '1' || __DEV__

/**
 * Hook to check if dev menu should be enabled
 * Checks environment variable
 *
 * Usage in components:
 * const isEnabled = useDevMenuEnabled()
 */
export const useDevMenuEnabled = (): boolean => {
  return isDevMenuEnabled
}
