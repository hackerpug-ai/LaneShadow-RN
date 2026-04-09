/**
 * SavedRouteCard Component
 *
 * Card component that displays a saved route with name, path, distance, duration, and date.
 * Follows the design system card patterns.
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { RouteThumbnail } from './route-thumbnail'
import { formatDate } from './saved-route-card.utils'
import type { SavedRouteCardProps } from './saved-route-card.types'

/**
 * SavedRouteCard component for saved routes list
 * Displays route with mini map preview, name, path, stats, and date
 */
export const SavedRouteCard = ({
  name,
  path,
  dateSaved,
  distance,
  duration,
  bounds,
  thumbnailRotation = 0,
  onPress,
}: SavedRouteCardProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${name}`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: semantic.color.border.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.md,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.content, { gap: semantic.space.md }]}>
        {/* Mini map preview */}
        <View style={styles.thumbnailContainer}>
          <RouteThumbnail
            width={60}
            height={60}
            bounds={bounds}
            rotation={thumbnailRotation}
          />
        </View>

        {/* Route info */}
        <View style={styles.textContainer}>
          {/* Route name */}
          <Text
            numberOfLines={2}
            style={[
              semantic.type.title.sm,
              { color: semantic.color.onSurface.default },
            ]}
          >
            {name}
          </Text>

          {/* Route path */}
          <Text
            numberOfLines={1}
            style={[
              semantic.type.body.sm,
              { color: semantic.color.onSurface.subtle },
            ]}
          >
            {path}
          </Text>

          {/* Stats row */}
          <View
            style={[styles.statsRow, { gap: semantic.space.sm }]}
          >
            {/* Distance */}
            {distance && (
              <Text
                style={[
                  semantic.type.body.sm,
                  { color: semantic.color.onSurface.muted },
                ]}
              >
                {distance}
              </Text>
            )}

            {/* Duration */}
            {duration && (
              <Text
                style={[
                  semantic.type.body.sm,
                  { color: semantic.color.onSurface.muted },
                ]}
              >
                {duration}
              </Text>
            )}

            {/* Date saved */}
            {dateSaved && (
              <Text
                style={[
                  semantic.type.body.sm,
                  { color: semantic.color.onSurface.muted },
                ]}
              >
                {dateSaved}
              </Text>
            )}
          </View>
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
  thumbnailContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
