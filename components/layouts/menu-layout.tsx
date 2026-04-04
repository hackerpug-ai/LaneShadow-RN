import { useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import type { DrawerMenuItem, DrawerMenuSection } from '../ui/menus/drawer-menu'
import { DrawerMenu } from '../ui/menus/drawer-menu'

const DRAWER_WIDTH = 280

export type MenuLayoutProps = {
  children: React.ReactNode | ((onMenuPress: () => void) => React.ReactNode)
  headerTitle?: string
  alignment?: 'left' | 'right'
  testID?: string
  menuOpen?: boolean
  onMenuOpenChange?: (open: boolean) => void
  sections?: DrawerMenuSection[]
  footerItems?: DrawerMenuItem[]
}

export const MenuLayout = ({
  children,
  headerTitle = 'Menu',
  alignment = 'left',
  testID,
  menuOpen = false,
  onMenuOpenChange,
  sections: externalSections,
  footerItems: externalFooterItems,
}: MenuLayoutProps) => {
  const router = useRouter()
  const segments = useSegments()
  const activeTab = segments[2] ?? 'index'

  const [contentOffset] = useState(new Animated.Value(0))
  const internalMenuSections: DrawerMenuSection[] = [
    {
      title: 'Navigate',
      items: [
        {
          label: 'Home',
          icon: 'home-variant',
          active: activeTab === 'index',
          onPress: () => router.push('/(app)/(tabs)'),
        },
        {
          label: 'Settings',
          icon: 'cog',
          active: activeTab === 'settings',
          onPress: () => router.push('/(app)/(tabs)/settings'),
        },
        {
          label: 'Saved',
          icon: 'bookmark-multiple',
          active: activeTab === 'saved-routes',
          onPress: () => router.push('/(app)/(tabs)/saved-routes'),
        },
      ],
    },
  ]

  const internalFooterItems: DrawerMenuItem[] = []

  const menuSections = externalSections || internalMenuSections
  const footerItems = externalFooterItems || internalFooterItems
  useEffect(() => {
    const offset = menuOpen ? DRAWER_WIDTH : 0
    const finalValue = alignment === 'left' ? offset : -offset
    Animated.timing(contentOffset, {
      toValue: finalValue,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [menuOpen, contentOffset, alignment])

  const wrappedFooterItems: DrawerMenuItem[] = footerItems.map((item) => ({
    ...item,
    onPress: () => {
      onMenuOpenChange(false)
      item.onPress()
    },
  }))

  const wrappedSections: DrawerMenuSection[] = menuSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      onPress: () => {
        onMenuOpenChange(false)
        item.onPress()
      },
    })),
  }))

  return (
    <View style={styles.container}>
      <DrawerMenu
        isOpen={menuOpen}
        onClose={() => onMenuOpenChange(false)}
        header={{ title: headerTitle, testID: `${testID}-drawer-header` }}
        sections={wrappedSections}
        footer={{ items: wrappedFooterItems }}
        alignment={alignment}
        testID={testID}
      />

      <Animated.View
        style={[
          styles.contentArea,
          {
            transform: [{ translateX: contentOffset }],
          },
        ]}
      >
        {typeof children === 'function' ? children(() => onMenuOpenChange?.(false)) : children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 30,
  },
})
