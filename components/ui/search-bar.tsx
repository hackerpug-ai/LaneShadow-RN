/**
 * SearchBar Component
 *
 * Simple search input with icon
 * Follows the design system search patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type SearchBarProps = {
  /** Placeholder text */
  placeholder: string
  /** Current input value */
  value?: string
  /** Press handler (for expanding search) */
  onPress?: () => void
}

/**
 * SearchBar component for search input
 * Displays a search bar with icon and placeholder
 */
export const SearchBar = ({
  placeholder,
  value,
  onPress,
}: SearchBarProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.card.default,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={semantic.color.onSurface.subtle}
      />
      <Text
        style={[
          styles.placeholder,
          { color: semantic.color.onSurface.subtle },
        ]}
        onPress={onPress}
      >
        {value || placeholder}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  placeholder: {
    fontSize: 15,
    flex: 1,
  },
})
