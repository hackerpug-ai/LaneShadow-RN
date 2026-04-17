/**
 * Generic Header Component
 *
 * Reusable header with menu toggle for teacher and parent roles
 * Following theme_rules.mdc - StyleSheet for static, inline for theme
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

export type HeaderProps = {
  title: string
  onMenuPress: () => void
  testID?: string
}

export const Header = ({ title, onMenuPress, testID }: HeaderProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: semantic.color.background.default,
          borderBottomColor: semantic.color.border.default,
          paddingHorizontal: semantic.space.lg,
          paddingVertical: semantic.space.sm,
        },
      ]}
    >
      <Pressable
        onPress={onMenuPress}
        testID={testID ? `${testID}-menu-button` : 'menu-button'}
        style={({ pressed }) => [
          styles.menuButton,
          {
            backgroundColor: pressed ? semantic.color.surface.pressed : 'transparent',
            borderRadius: semantic.radius.full,
            padding: semantic.space.sm,
          },
        ]}
      >
        <IconSymbol name="menu" size={24} color={semantic.color.onSurface.default} />
      </Pressable>
      <View style={styles.titleContainer}>
        <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
          {title}
        </Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    borderBottomWidth: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 44,
  },
})
