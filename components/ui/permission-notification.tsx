/**
 * Permission Notification Component
 *
 * Custom notification for permission requests
 * Automatically uses semantic theme via hook (no props needed)
 * Following theme_rules.mdc - Paper Text components
 */

import { IconSymbol } from '../ui/icon-symbol'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Pressable, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type PermissionNotificationProps = {
  title: string
  description: string
  actionLabel?: string
  onActionPress?: () => void | Promise<void>
  preventDismissOnTap?: boolean
}

export const PermissionNotification = ({
  title,
  description,
  actionLabel,
  onActionPress,
  preventDismissOnTap = false,
}: PermissionNotificationProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.warning.default,
          borderRadius: semantic.radius.lg,
          marginTop: insets.top + semantic.space.sm,
          marginHorizontal: semantic.space.md,
          padding: semantic.space.md,
          gap: semantic.space.xs,
        },
      ]}
    >
      <View style={[styles.header, { gap: semantic.space.sm }]}>
        <IconSymbol name="alert-circle" size={20} color={semantic.color.onPrimary.default} />
        <Text variant="titleSmall" style={{ color: semantic.color.onPrimary.default, flex: 1 }}>
          {title}
        </Text>
      </View>
      <Text variant="bodySmall" style={{ color: semantic.color.onPrimary.default }}>
        {description}
      </Text>
      {actionLabel && onActionPress && (
        <View pointerEvents="box-none">
          <Pressable
            onPress={(e) => {
              console.log('Permission notification action pressed')
              // Stop event propagation to prevent notification dismissal
              e?.stopPropagation?.()
              onActionPress()
            }}
            onPressIn={(e) => {
              // Also stop propagation on press in
              e?.stopPropagation?.()
            }}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed
                  ? semantic.color.onPrimary.default + '30'
                  : semantic.color.onPrimary.default + '20',
                borderRadius: semantic.radius.md,
                padding: semantic.space.sm,
                marginTop: semantic.space.xs,
              },
            ]}
          >
            <Text
              variant="labelMedium"
              style={{
                color: semantic.color.onPrimary.default,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )

  // Only prevent dismissal if explicitly requested
  if (preventDismissOnTap) {
    return (
      <TouchableWithoutFeedback
        onPress={() => {
          console.log('Notification body tapped - preventing dismissal')
          // Do nothing to prevent dismissal
        }}
      >
        {content}
      </TouchableWithoutFeedback>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
