import { StyleSheet, View, type ViewStyle } from 'react-native'

import { useSemanticTheme } from '../hooks/use-semantic-theme'

type ThemedViewProps = {
  children?: React.ReactNode
  style?: ViewStyle
}

/**
 * Lightweight themed view wrapper for consistent background + border tokens.
 */
export const ThemedView = ({ children, style }: ThemedViewProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: semantic.color.surface.default,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'column',
  },
})
