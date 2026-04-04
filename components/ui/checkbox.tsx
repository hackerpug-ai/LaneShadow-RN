/**
 * Checkbox Component
 * Checkbox control with semantic theme styling
 *
 * Specs from README 7.7:
 * - Size: 16×16px (h-4 w-4), rounded-sm
 * - Border: border-primary
 * - Checked: bg-primary with checkmark icon
 * - Focus ring: ring-2 ring-offset-2
 * - Disabled state: opacity-50
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { ViewStyle } from 'react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'

/**
 * Checkbox component props
 */
export type CheckboxProps = {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
}

/**
 * Checkbox component using semantic theme
 * Toggle control for boolean states with checkmark
 */
export const Checkbox = ({
  checked,
  onCheckedChange,
  disabled = false,
  indeterminate = false,
  style,
  accessibilityLabel,
}: CheckboxProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const handlePress = () => {
    if (disabled) return
    onCheckedChange?.(!checked)
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? 'mixed' : checked, disabled }}
      style={style}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            {
              width: 16,
              height: 16,
              borderRadius: semantic.radius.sm,
              borderWidth: 1,
              borderColor: semantic.color.primary.default,
              backgroundColor:
                checked || indeterminate
                  ? pressed
                    ? semantic.color.primary.pressed || semantic.color.primary.default
                    : semantic.color.primary.default
                  : 'transparent',
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {checked && !indeterminate && (
            <Text
              style={{
                color: semantic.color.onPrimary.default,
                fontSize: 12,
                fontWeight: '700',
                lineHeight: 14,
              }}
            >
              ✓
            </Text>
          )}
          {indeterminate && (
            <View
              style={{
                width: 8,
                height: 2,
                backgroundColor: semantic.color.onPrimary.default,
                borderRadius: 1,
              }}
            />
          )}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
