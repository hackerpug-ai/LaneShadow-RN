/**
 * Semantic theme hook for React Native
 * Provides typed access to semantic theme layer
 *
 * Usage in components:
 * ```tsx
 * import { useSemanticTheme } from './hooks/use-semantic-theme'
 *
 * const MyComponent = () => {
 *   const { semantic } = useSemanticTheme()
 *
 *   return (
 *     <View style={{
 *       padding: semantic.space.md,
 *       backgroundColor: semantic.color.surface.default,
 *       borderRadius: semantic.radius.lg
 *     }}>
 *       <Text style={{
 *         ...semantic.type.body.md,
 *         color: semantic.color.onSurface.default
 *       }}>
 *         Hello World
 *       </Text>
 *     </View>
 *   )
 * }
 * ```
 */

import { useTheme as useRNPTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../styles/types'

/**
 * Hook to access semantic theme
 * Returns ExtendedTheme with both RNP and semantic layers
 */
export const useSemanticTheme = (): ExtendedTheme => {
  return useRNPTheme<ExtendedTheme>()
}

/**
 * Re-export for convenience
 * Components should use this instead of RNP's useTheme directly
 */
export { useSemanticTheme as useTheme }
