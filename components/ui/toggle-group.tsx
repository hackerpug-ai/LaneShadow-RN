/**
 * Toggle Group Component
 * Group of toggle buttons with semantic theme styling
 *
 * Specs from README 7.12:
 * - Layout: flex gap-1
 * - Context provides variants/sizes to children
 * - Support single and multiple selection modes
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { createContext, useContext } from 'react'
import type { ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import type { ToggleSize, ToggleVariant } from './toggle'

/**
 * Toggle Group selection type
 */
export type ToggleGroupType = 'single' | 'multiple'

/**
 * Toggle Group context
 */
type ToggleGroupContextValue = {
  type: ToggleGroupType
  value: string | string[]
  onValueChange: (value: string) => void
  variant?: ToggleVariant
  size?: ToggleSize
  disabled?: boolean
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null)

/**
 * Hook to access Toggle Group context
 */
export const useToggleGroup = (): ToggleGroupContextValue | null => {
  return useContext(ToggleGroupContext)
}

/**
 * Toggle Group component props
 */
export type ToggleGroupProps = {
  type?: ToggleGroupType
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  variant?: ToggleVariant
  size?: ToggleSize
  disabled?: boolean
  children?: React.ReactNode
  style?: ViewStyle
}

/**
 * Toggle Group component using semantic theme
 * Container for related toggle buttons
 */
export const ToggleGroup = ({
  type = 'single',
  value = type === 'single' ? '' : [],
  onValueChange,
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
  style,
}: ToggleGroupProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const handleValueChange = (itemValue: string) => {
    if (disabled) return

    if (type === 'single') {
      onValueChange?.(itemValue === value ? '' : itemValue)
    } else {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(itemValue)
        ? currentValues.filter((v) => v !== itemValue)
        : [...currentValues, itemValue]
      onValueChange?.(newValues)
    }
  }

  return (
    <ToggleGroupContext.Provider
      value={{
        type,
        value,
        onValueChange: handleValueChange,
        variant,
        size,
        disabled,
      }}
    >
      <View
        style={[
          styles.container,
          {
            gap: semantic.space.xs,
          },
          style,
        ]}
      >
        {children}
      </View>
    </ToggleGroupContext.Provider>
  )
}

/**
 * Toggle Group Item component props
 */
export type ToggleGroupItemProps = {
  value: string
  children?: React.ReactNode
  icon?: React.ReactNode
  style?: ViewStyle
  accessibilityLabel?: string
}

/**
 * Toggle Group Item component
 * Individual toggle within a group
 */
export const ToggleGroupItem = ({
  value,
  children,
  icon,
  style,
  accessibilityLabel,
}: ToggleGroupItemProps): React.ReactNode => {
  const context = useToggleGroup()
  const { semantic } = useSemanticTheme()

  if (!context) {
    throw new Error('ToggleGroupItem must be used within a ToggleGroup')
  }

  const { type, value: groupValue, onValueChange, variant, size, disabled } = context

  const isPressed =
    type === 'single'
      ? groupValue === value
      : Array.isArray(groupValue) && groupValue.includes(value)

  const handlePress = () => {
    onValueChange(value)
  }

  // Get height based on size
  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        return 36
      case 'lg':
        return 44
      default:
        return 40
    }
  }

  // Get background color based on variant and state
  const getBackgroundColor = (pressed: boolean): string => {
    if (variant === 'outline') {
      if (isPressed) {
        return semantic.color.accent.default
      }
      return 'transparent'
    }

    if (isPressed) {
      return semantic.color.accent.default
    }

    return pressed ? semantic.color.muted.pressed || semantic.color.muted.default : 'transparent'
  }

  // Get text color based on state
  const getTextColor = (pressed: boolean): string => {
    if (disabled) {
      return semantic.color.onSurface.disabled || semantic.color.onSurface.default
    }

    if (isPressed) {
      return semantic.color.onSurface.default
    }

    return pressed
      ? semantic.color.onSurface.default
      : semantic.color.onSurface.muted || semantic.color.onSurface.default
  }

  // Get border style for outline variant
  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: semantic.color.border.default,
      }
    }
    return {}
  }

  return (
    <View
      style={[
        styles.item,
        {
          height: getHeight(),
          paddingHorizontal: semantic.space.md,
          backgroundColor: getBackgroundColor(false),
          borderRadius: semantic.radius.md,
          opacity: disabled ? 0.5 : 1,
        },
        getBorderStyle(),
        style,
      ]}
      onTouchEnd={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: isPressed }}
    >
      {icon && (
        <View style={[styles.iconContainer, { marginRight: semantic.space.sm }]}>{icon}</View>
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
