/**
 * PrimaryButton Component
 *
 * Primary action button with copper styling and glow effect
 * Follows the design system button patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type PrimaryButtonProps = {
  /** Button text */
  children: string
  /** Press handler */
  onPress?: () => void
  /** Optional icon name */
  icon?: string
  /** Loading state */
  loading?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Button height */
  height?: number
}

/**
 * PrimaryButton component with copper styling and glow
 * Main action button for primary actions in the app
 */
export const PrimaryButton = ({
  children,
  onPress,
  icon,
  loading = false,
  disabled = false,
  height = 56,
}: PrimaryButtonProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const backgroundColor = disabled
    ? semantic.color.primary.disabled
    : semantic.color.primary.default

  const glowColor = disabled
    ? 'transparent'
    : 'rgba(184, 115, 50, 0.4)'

  return (
    <View
      style={[
        styles.button,
        {
          height,
          backgroundColor,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: disabled ? 0 : 0.4,
          shadowRadius: 16,
          elevation: disabled ? 0 : 4,
        },
      ]}
    >
      {loading ? (
        <Text style={[styles.text, { color: semantic.color.onPrimary.default }]}>
          Loading...
        </Text>
      ) : (
        <View style={styles.content}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={semantic.color.onPrimary.default}
            />
          )}
          <Text style={[styles.text, { color: semantic.color.onPrimary.default }]}>
            {children}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
})
