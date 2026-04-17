/**
 * Chip Component
 * Custom chip component with semantic theme styling
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { type IconName, IconSymbol } from '../ui/icon-symbol'

export type ChipProps = {
  label: string
  icon?: IconName
  selected?: boolean
  onPress?: () => void
  testID?: string
}

export const Chip = ({ label, icon, selected = false, onPress, testID }: ChipProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? `${semantic.color.primary.default}20` // ~12% opacity
            : pressed
              ? semantic.color.muted.default
              : 'transparent',
          borderRadius: semantic.radius.full,
          borderWidth: 1,
          borderColor: selected
            ? `${semantic.color.primary.default}60` // ~40% opacity
            : semantic.color.border.default,
          paddingHorizontal: semantic.space.md,
          paddingVertical: 6,
        },
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <IconSymbol
            name={icon}
            size={16}
            color={
              (selected ? semantic.color.primary.default : semantic.color.onSurface.muted) ??
              'transparent'
            }
          />
        )}
        <Text
          style={[
            semantic.type.label.sm,
            {
              color: selected ? semantic.color.primary.default : semantic.color.onSurface.default,
              fontSize: 13,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
})
