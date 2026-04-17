/**
 * StateListItem Component
 *
 * Individual state row for the StateFilter bottom sheet.
 * Displays state name, route count, and selection state.
 *
 * Following styles/RULES.md:
 * - useSemanticTheme() for all styling
 * - Pressable for interactive states
 * - Copper accent for selected state
 * - Minimum 44px touch target
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

export type StateListItemProps = {
  /** State data */
  state: {
    code: string
    name: string
    routeCount: number
  }
  /** Whether this state is selected */
  isSelected: boolean
  /** Press handler */
  onPress: () => void
  /** Test ID for testing */
  testID?: string
}

/**
 * StateListItem component
 *
 * Displays a state row with:
 * - State name
 * - Route count
 * - Selection indicator (checkmark when selected)
 * - Pressable with visual feedback
 */
export const StateListItem = ({ state, isSelected, onPress, testID }: StateListItemProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? semantic.color.surfaceVariant.pressed
            : isSelected
              ? semantic.color.primary.default + '1A' // 10% opacity per copper opacity pattern
              : semantic.color.surface.default,
          borderColor: isSelected ? semantic.color.primary.default : semantic.color.border.default,
          minHeight: 48, // WCAG AA minimum touch target
        },
      ]}
    >
      <View style={styles.content}>
        {/* State name and count */}
        <View style={styles.textContainer}>
          <Text
            variant="bodyLarge"
            style={{
              color: isSelected ? semantic.color.primary.default : semantic.color.onSurface.default,
              fontWeight: isSelected ? '600' : '400',
            }}
          >
            {state.name}
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: semantic.color.onSurface.muted,
              marginTop: 2,
            }}
          >
            {state.routeCount} {state.routeCount === 1 ? 'route' : 'routes'}
          </Text>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <IconSymbol
              name="check"
              size={20}
              color={semantic.color.primary.default}
              testID={`${testID}-checkmark`}
            />
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
})
