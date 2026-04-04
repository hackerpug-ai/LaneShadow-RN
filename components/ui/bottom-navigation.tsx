/**
 * BottomNavigation Component
 *
 * Bottom tab navigation with 4 tabs (Explore, Saved, Rides, Profile)
 * Follows Material Design 3 bottom navigation patterns
 */

import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { IconSymbol } from './icon-symbol'
import type { ExtendedTheme } from '../../styles/types'

export type NavItem = {
  /** Icon name from MaterialCommunityIcons */
  icon: string
  /** Label text */
  label: string
  /** Whether the item is active */
  active?: boolean
  /** Press handler */
  onPress?: () => void
}

export type BottomNavigationProps = {
  /** Navigation items to display */
  items: NavItem[]
  /** Background color override */
  backgroundColor?: string
}

/**
 * BottomNavigation component for 4-tab navigation bar
 * Displays Explore, Saved, Rides, and Profile tabs
 */
export const BottomNavigation = ({
  items,
  backgroundColor,
}: BottomNavigationProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor || semantic.color.surface.default,
          borderTopColor: semantic.color.divider.default,
        },
      ]}
    >
      {items.map((item, index) => {
        const color = item.active
          ? semantic.color.primary.default
          : semantic.color.onSurface.subtle

        return (
          <View key={index} style={styles.navItem}>
            <IconSymbol
              name={item.icon}
              size={24}
              color={color}
            />
            <Text style={[styles.navLabel, { color }]}>{item.label}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 84,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navLabel: {
    fontSize: 10,
  },
})
