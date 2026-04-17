import { Text } from 'react-native-paper'

import { useSemanticTheme } from '../hooks/use-semantic-theme'

type ThemedTextProps = {
  children: React.ReactNode
  type?: 'default' | 'defaultSemiBold'
}

/**
 * Lightweight themed text wrapper to satisfy type-checking.
 * Uses Paper Text to follow typography rules.
 */
export const ThemedText = ({ children, type = 'default' }: ThemedTextProps) => {
  const { semantic } = useSemanticTheme()
  const variant = type === 'defaultSemiBold' ? 'titleSmall' : 'bodyMedium'
  const color = semantic.color.onSurface.default

  return (
    <Text variant={variant} style={{ color }}>
      {children}
    </Text>
  )
}
