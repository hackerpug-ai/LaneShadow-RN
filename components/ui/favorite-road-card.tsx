/**
 * FavoriteRoadCard Component
 *
 * Card component that displays a favorite road with name and mini map preview.
 * Follows the design system card patterns.
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { Bounds } from '../../models/favorite-roads'
import { RouteThumbnail } from './route-thumbnail'
import { IconSymbol } from './icon-symbol'

export type FavoriteRoadCardProps = {
  /** Unique identifier for the favorite road */
  favoriteRoadId: string
  /** Display name for the favorite road */
  name: string
  /** Geographic bounds for mini map positioning */
  bounds: Bounds
  /** Callback when card is pressed (not delete button) */
  onPress?: () => void
  /** Callback when delete button is pressed */
  onDelete?: () => void
  /** Test ID for testing */
  testID?: string
}

/**
 * FavoriteRoadCard component for favorite roads list
 * Displays road with mini map preview, name, and delete button
 */
export const FavoriteRoadCard = ({
  favoriteRoadId,
  name,
  bounds,
  onPress,
  onDelete,
  testID = 'favorite-road-card',
}: FavoriteRoadCardProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <Pressable
      onPress={() => onPress?.()}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`View ${name}`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: semantic.color.border.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.content, { gap: semantic.space.md }]}>
        {/* Mini map preview */}
        <RouteThumbnail
          width={80}
          height={80}
          bounds={bounds}
          testID={`${testID}-thumbnail`}
        />

        {/* Road name */}
        <View style={styles.textContainer}>
          <Text
            numberOfLines={2}
            style={[
              semantic.type.title.md,
              { color: semantic.color.onSurface.default },
            ]}
          >
            {name}
          </Text>
        </View>

        {/* Delete button */}
        <View style={styles.deleteButtonContainer}>
          <Pressable
            onPress={(e) => {
              e?.stopPropagation()
              onDelete?.()
            }}
            testID={`${testID}-delete`}
            accessibilityRole="button"
            accessibilityLabel="Delete favorite"
            style={({ pressed }) => [
              styles.deleteButtonContent,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <IconSymbol name="trash-can-outline" size={20} color={semantic.color.danger.default} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  deleteButtonContainer: {
    // Prevent card press when delete is pressed
    zIndex: 1,
  },
  deleteButtonContent: {
    padding: 8,
    borderRadius: 8,
    margin: -8, // Offset padding to maintain layout
  },
})
