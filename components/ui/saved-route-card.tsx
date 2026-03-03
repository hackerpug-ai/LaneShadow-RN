/**
 * SavedRouteCard Component
 *
 * Saved route card with thumbnail, name, path, and stats
 * Follows the design system card patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { RouteThumbnail } from './route-thumbnail'

export type SavedRouteCardProps = {
  /** Route name */
  name: string
  /** Route path (origin → destination) */
  path: string
  /** Duration stat */
  duration?: string
  /** Distance stat */
  distance?: string
  /** Optional press handler */
  onPress?: () => void
  /** Thumbnail rotation */
  thumbnailRotation?: number
}

/**
 * SavedRouteCard component for saved routes list
 * Displays route with thumbnail, name, path, and stats
 */
export const SavedRouteCard = ({
  name,
  path,
  duration = '',
  distance = '',
  onPress,
  thumbnailRotation = -10,
}: SavedRouteCardProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: 'rgba(255, 255, 255, 0.05)',
        },
      ]}
    >
      <RouteThumbnail rotation={thumbnailRotation} />

      <View style={styles.details}>
        <Text
          style={[styles.routeName, { color: semantic.color.onSurface.default }]}
        >
          {name}
        </Text>
        <Text
          style={[styles.routePath, { color: semantic.color.onSurface.default }]}
        >
          {path}
        </Text>

        {(duration || distance) && (
          <View style={styles.stats}>
            {duration && (
              <View style={styles.stat}>
                <MaterialCommunityIcons
                  name="schedule"
                  size={16}
                  color={semantic.color.onSurface.subtle}
                />
                <Text
                  style={[styles.statValue, { color: semantic.color.onSurface.subtle }]}
                >
                  {duration}
                </Text>
              </View>
            )}
            {distance && (
              <View style={styles.stat}>
                <MaterialCommunityIcons
                  name="straighten"
                  size={16}
                  color={semantic.color.onSurface.subtle}
                />
                <Text
                  style={[styles.statValue, { color: semantic.color.onSurface.subtle }]}
                >
                  {distance}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.chevron}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={semantic.color.onSurface.subtle}
          onPress={onPress}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  details: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routePath: {
    fontSize: 14,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
