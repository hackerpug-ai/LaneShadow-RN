/**
 * Base View Layout
 *
 * Base layout component with safe area handling only
 * Provides consistent safe area padding for all views
 * Following theme_rules.mdc - StyleSheet for static, inline for theme
 */

import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type BaseViewLayoutProps = {
  children: React.ReactNode
}

export const BaseViewLayout = ({ children }: BaseViewLayoutProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.background.default,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
