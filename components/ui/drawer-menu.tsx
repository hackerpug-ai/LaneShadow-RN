/**
 * DrawerMenu Component
 * Reusable slide-out drawer menu that pushes content to the right
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 * Following react_rules.mdc: Named exports, simple state management
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useEffect, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconSymbol, type IconName } from './icon-symbol'

const DRAWER_WIDTH = 280

export type DrawerMenuItem = {
  label: string
  icon: IconName
  onPress: () => void
  active?: boolean
  testID?: string
}

export type DrawerMenuSection = {
  title?: string
  items: DrawerMenuItem[]
}

export type DrawerMenuProps = {
  isOpen: boolean
  onClose: () => void
  header?: {
    title: string
    testID?: string
  }
  sections: DrawerMenuSection[]
  footer?: {
    items: DrawerMenuItem[]
  }
  testID?: string
}

export const DrawerMenu = ({
  isOpen,
  onClose,
  header,
  sections,
  footer,
  testID,
}: DrawerMenuProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const [translateX] = useState(new Animated.Value(-DRAWER_WIDTH))

  // Animate drawer open/close
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isOpen, translateX])

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
      )}

      {/* Drawer */}
      <Animated.View
        testID={testID}
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: semantic.color.background.default,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Header */}
        {header && (
          <View
            style={[
              styles.header,
              {
                paddingVertical: semantic.space.xs,
                paddingHorizontal: semantic.space.md,
                borderBottomWidth: 1,
                borderBottomColor: semantic.color.border.default,
              },
            ]}
          >
            <Text
              testID={header.testID}
              style={[semantic.type.heading.md, { color: semantic.color.onSurface.default }]}
            >
              {header.title}
            </Text>
          </View>
        )}

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollContent}>
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={[styles.section, { padding: semantic.space.lg }]}>
              {section.title && (
                <Text
                  style={[
                    semantic.type.label.sm,
                    {
                      color: semantic.color.onSurface.muted,
                      marginBottom: semantic.space.sm,
                    },
                  ]}
                >
                  {section.title}
                </Text>
              )}
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  onPress={item.onPress}
                  testID={item.testID}
                  style={({ pressed }) => [
                    styles.menuItem,
                    {
                      padding: semantic.space.md,
                      borderRadius: semantic.radius.lg,
                      marginBottom: semantic.space.xs,
                      backgroundColor: item.active
                        ? semantic.color.primary.default + '1A'
                        : pressed
                          ? semantic.color.surface.pressed
                          : 'transparent',
                    },
                  ]}
                >
                  <IconSymbol
                    name={item.icon}
                    size={24}
                    color={
                      item.active
                        ? semantic.color.primary.default
                        : semantic.color.onSurface.default
                    }
                  />
                  <Text
                    style={[
                      semantic.type.body.md,
                      {
                        color: item.active
                          ? semantic.color.primary.default
                          : semantic.color.onSurface.default,
                        fontWeight: item.active ? '500' : '400',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        {footer && (
          <View
            style={[
              styles.footer,
              {
                paddingVertical: semantic.space.sm,
                paddingHorizontal: semantic.space.md,
                borderTopWidth: 1,
                borderTopColor: semantic.color.border.default,
              },
            ]}
          >
            {footer.items.map((item, index) => (
              <Pressable
                key={index}
                onPress={item.onPress}
                testID={item.testID}
                style={({ pressed }) => [
                  styles.footerItem,
                  {
                    paddingVertical: semantic.space.xs,
                    paddingHorizontal: semantic.space.md,
                    gap: semantic.space.lg,
                    borderRadius: semantic.radius.lg,
                    marginBottom: index < footer.items.length - 1 ? semantic.space.sm : 0,
                    backgroundColor: pressed ? semantic.color.surface.pressed : 'transparent',
                  },
                ]}
              >
                <IconSymbol name={item.icon} size={24} color={semantic.color.onSurface.default} />
                <Text style={[semantic.type.body.md, { color: semantic.color.onSurface.default }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
  },
  header: {
    // Dynamic styles inline
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    // Dynamic padding inline
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footer: {
    // Dynamic styles inline
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
