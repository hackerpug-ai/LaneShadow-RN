/**
 * AppHeader Component
 * Reusable app header with flexible content slots
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 * Following react_rules.mdc: Named exports, composition pattern
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Avatar } from './avatar'
import { IconSymbol } from './icon-symbol'

export type AppHeaderProps = {
  title?: string
  leftContent?: ReactNode
  rightContent?: ReactNode
  onLeftPress?: () => void
  onRightPress?: () => void
  leftIcon?: string
  rightIcon?: string
  rightAvatar?: {
    imageUri?: string
    initials?: string
  }
  testID?: string
}

export const AppHeader = ({
  title,
  leftContent,
  rightContent,
  onLeftPress,
  onRightPress,
  leftIcon,
  rightIcon,
  rightAvatar,
  testID,
}: AppHeaderProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      testID={testID}
      style={[
        styles.header,
        {
          backgroundColor: semantic.color.background.default + 'CC', // 80% opacity for blur effect
          borderBottomWidth: 1,
          borderBottomColor: semantic.color.primary.default + '33', // 20% opacity
          padding: semantic.space.lg,
        },
      ]}
    >
      {/* Left Content */}
      <View style={styles.leftSection}>
        {leftContent ? (
          leftContent
        ) : leftIcon && onLeftPress ? (
          <Pressable
            onPress={onLeftPress}
            testID={testID ? `${testID}-left-button` : undefined}
            style={({ pressed }) => [
              styles.iconButton,
              {
                padding: semantic.space.sm,
                borderRadius: semantic.radius.full,
                backgroundColor: pressed ? semantic.color.surface.pressed : 'transparent',
              },
            ]}
          >
            <IconSymbol name={leftIcon as any} size={24} color={semantic.color.onSurface.default} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Center Title */}
      {title && (
        <Text
          testID={testID ? `${testID}-title` : undefined}
          style={[
            semantic.type.heading.md,
            {
              color: semantic.color.onSurface.default,
              flex: 1,
              textAlign: 'center',
            },
          ]}
        >
          {title}
        </Text>
      )}

      {/* Right Content */}
      <View style={styles.rightSection}>
        {rightContent ? (
          rightContent
        ) : rightAvatar ? (
          <Pressable onPress={onRightPress} testID={testID ? `${testID}-right-avatar` : undefined}>
            <Avatar
              size="default"
              source={rightAvatar.imageUri ? { uri: rightAvatar.imageUri } : undefined}
              initials={rightAvatar.initials}
            />
          </Pressable>
        ) : rightIcon && onRightPress ? (
          <Pressable
            onPress={onRightPress}
            testID={testID ? `${testID}-right-button` : undefined}
            style={({ pressed }) => [
              styles.iconButton,
              {
                padding: semantic.space.sm,
                borderRadius: semantic.radius.full,
                backgroundColor: pressed ? semantic.color.surface.pressed : 'transparent',
              },
            ]}
          >
            <IconSymbol
              name={rightIcon as any}
              size={24}
              color={semantic.color.onSurface.default}
            />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  leftSection: {
    minWidth: 44,
    justifyContent: 'center',
  },
  rightSection: {
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
})
