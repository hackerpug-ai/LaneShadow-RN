/**
 * Warning Toast Component
 *
 * Amber-themed toast for warning notifications
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

export type WarningToastProps = {
  title: string
  description: string
  showCloseButton?: boolean
}

export const WarningToast = ({ title, description, showCloseButton = true }: WarningToastProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  return (
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
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
    >
      <View style={[styles.header, { gap: semantic.space.sm }]}>
        <View style={styles.iconRow}>
          <IconSymbol name="alert" size={20} color={semantic.color.onPrimary.default} />
          <Text variant="titleSmall" style={{ color: semantic.color.onPrimary.default, flex: 1 }}>
            {title}
          </Text>
        </View>
        {showCloseButton && (
          <Pressable
            onPress={() => {
              const { Notifier } = require('react-native-notifier')
              Notifier.hideNotification()
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconSymbol name="close-circle" size={20} color={semantic.color.onPrimary.default} />
          </Pressable>
        )}
      </View>
      <Text variant="bodySmall" style={{ color: semantic.color.onPrimary.default }}>
        {description}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
})
