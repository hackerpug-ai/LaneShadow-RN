/**
 * SessionContextMenu Component
 *
 * A modal-based context menu for session actions (delete, etc.)
 * Triggered by long-press on session items in the drawer.
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 * Following react_rules.mdc: Named exports, simple state management
 */

import React from 'react'
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { IconSymbol, type IconName } from './icon-symbol'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type SessionContextMenuItem = {
  label: string
  icon: IconName
  onPress: () => void
  destructive?: boolean
  testID?: string
}

export type SessionContextMenuProps = {
  visible: boolean
  onDismiss: () => void
  items: SessionContextMenuItem[]
  position: { x: number; y: number }
  testID?: string
}

const MENU_WIDTH = 180
const MENU_ITEM_HEIGHT = 48

export const SessionContextMenu: React.FC<SessionContextMenuProps> = ({
  visible,
  onDismiss,
  items,
  position,
  testID,
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  // Calculate menu position to stay on screen
  const menuLeft = Math.max(
    insets.left + 8,
    Math.min(position.x - MENU_WIDTH / 2, position.x - MENU_WIDTH / 2)
  )
  const menuTop = Math.max(
    insets.top + 8,
    Math.min(position.y - MENU_ITEM_HEIGHT * items.length - 16, position.y)
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID={testID}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        testID={testID ? `${testID}-backdrop` : undefined}
      >
        <View style={styles.backdrop} />
      </Pressable>

      <View
        style={[
          styles.menu,
          {
            left: menuLeft,
            top: menuTop,
            width: MENU_WIDTH,
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
            }),
          },
        ]}
      >
        {items.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => {
              item.onPress()
              onDismiss()
            }}
            testID={item.testID}
            style={({ pressed }) => [
              styles.menuItem,
              {
                height: MENU_ITEM_HEIGHT,
                backgroundColor: pressed ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                borderBottomWidth: index < items.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <IconSymbol
              name={item.icon}
              size={20}
              color={item.destructive ? theme.colors.error : theme.colors.onSurface}
            />
            <Text
              style={[
                styles.menuItemText,
                {
                  color: item.destructive ? theme.colors.error : theme.colors.onSurface,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    flex: 1,
  },
})
