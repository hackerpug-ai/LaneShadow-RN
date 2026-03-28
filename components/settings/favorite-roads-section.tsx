/**
 * FavoriteRoadsSection Component
 *
 * Settings section that displays all user's favorite roads with delete functionality.
 * Follows the design system section patterns and uses semantic theme.
 *
 * Acceptance Criteria:
 * - AC1: Section visible with header
 * - AC2: Shows FavoriteRoadCard for each favorite
 * - AC3: Shows empty state when no favorites
 * - AC4: Delete removes card and updates list
 */

import type { Id } from '../../convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { EmptyState } from '../ui/empty-state'
import { FavoriteRoadCard } from '../ui/favorite-road-card'
import { SectionHeader } from '../ui/section-header'

/**
 * FavoriteRoadsSection component for settings screen
 *
 * Displays list of favorite roads with delete functionality.
 * Shows loading skeleton while fetching, empty state when no favorites,
 * and list of FavoriteRoadCard components when favorites exist.
 */
export const FavoriteRoadsSection: React.FC = () => {
  const { semantic } = useSemanticTheme()

  // TODO: The Convex API needs to be regenerated to include favoriteRoads
  // For now, using string references to work around the generated API issue
  // Once regenerated, this should be: api.db.favoriteRoads.list
  const favorites = useQuery('db.favoriteRoads:list' as any)
  const removeFavorite = useMutation('db.favoriteRoads:remove' as any)

  const handleDelete = async (favoriteId: string) => {
    try {
      await removeFavorite({
        favoriteRoadId: favoriteId as Id<'favorite_roads'>,
      })
    } catch (error) {
      console.error('Failed to delete favorite:', error)
      // Error handling could be improved with toast/snackbar in future iteration
    }
  }

  // Loading state - show skeleton
  if (favorites === undefined) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Favorite Roads" />
        <View style={[styles.skeleton, { backgroundColor: semantic.color.surfaceVariant.default }]} />
        <View style={[styles.skeleton, { backgroundColor: semantic.color.surfaceVariant.default }]} />
        <View style={[styles.skeleton, { backgroundColor: semantic.color.surfaceVariant.default }]} />
      </View>
    )
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <View style={[styles.section, { marginBottom: semantic.space.lg }]}>
        <SectionHeader title="Favorite Roads" />
        <EmptyState
          icon="heart-outline"
          headline="No favorite roads yet"
          body="Long-press a route segment to save it as a favorite"
          testID="empty-state"
        />
      </View>
    )
  }

  // List of favorites
  return (
    <View style={[styles.section, { marginBottom: semantic.space.lg }]}>
      <SectionHeader title="Favorite Roads" />
      {favorites.map((favorite) => (
        <View key={favorite._id} style={[styles.cardWrapper, { marginBottom: semantic.space.md }]}>
          <FavoriteRoadCard
            favorite={favorite}
            onDelete={() => handleDelete(favorite._id)}
            testID={`favorite-road-card-${favorite._id}`}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  skeleton: {
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardWrapper: {
    width: '100%',
  },
})
