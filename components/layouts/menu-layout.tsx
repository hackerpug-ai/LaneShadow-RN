/**
 * Menu Layout Component
 * Wraps content with slide-out drawer menu and animation
 *
 * Following theme_rules.mdc and react_rules.mdc
 */

import type { DrawerMenuItem, DrawerMenuSection } from '../ui/drawer-menu'
import { DrawerMenu } from '../ui/drawer-menu'
import { useEffect, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

const DRAWER_WIDTH = 280

export type MenuLayoutProps = {
  children: (toggleMenu: () => void) => React.ReactNode
  sections: DrawerMenuSection[]
  footerItems: DrawerMenuItem[]
  headerTitle?: string
  testID?: string
}

export const MenuLayout = ({
  children,
  sections,
  footerItems,
  headerTitle = 'Menu',
  testID,
}: MenuLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [contentOffset] = useState(new Animated.Value(0))

  // Animate content shift when menu opens
  useEffect(() => {
    Animated.timing(contentOffset, {
      toValue: menuOpen ? DRAWER_WIDTH : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [menuOpen, contentOffset])

  // Wrap footer items to auto-close menu after action
  const wrappedFooterItems: DrawerMenuItem[] = footerItems.map((item) => ({
    ...item,
    onPress: () => {
      setMenuOpen(false)
      item.onPress()
    },
  }))

  // Wrap section items to auto-close menu after action
  const wrappedSections: DrawerMenuSection[] = sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      onPress: () => {
        setMenuOpen(false)
        item.onPress()
      },
    })),
  }))

  const toggleMenu = () => setMenuOpen(!menuOpen)

  return (
    <View style={styles.container}>
      {/* Drawer Menu */}
      <DrawerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        header={{ title: headerTitle, testID: `${testID}-drawer-header` }}
        sections={wrappedSections}
        footer={{ items: wrappedFooterItems }}
        testID={testID}
      />

      {/* Main Content Area - shifts right when menu opens */}
      <Animated.View
        style={[
          styles.contentArea,
          {
            transform: [{ translateX: contentOffset }],
          },
        ]}
      >
        {children(toggleMenu)}
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
})
