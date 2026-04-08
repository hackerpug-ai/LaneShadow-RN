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
import { FlatList, View, StyleSheet } from 'react-native'
import { useState } from 'react'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { DeleteFavoriteDialog } from '../ui/delete-favorite-dialog'
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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const favorites = useQuery(api.db.favoriteRoads.list)
  const removeFavorite = useMutation(api.db.favoriteRoads.remove)

  const handleDelete = (favoriteId: string) => {
    setDeleteTarget(favoriteId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      await removeFavorite({
        favoriteRoadId: deleteTarget as Id<'favorite_roads'>,
      })
      setDeleteTarget(null)
    } catch (error) {
      console.error('Failed to delete favorite:', error)
      // Error handling could be improved with toast/snackbar in future iteration
    }
  }

  const handleDismissDelete = () => {
    setDeleteTarget(null)
  }

  // Get the name of the favorite being deleted for the dialog
  const favoriteToDelete = favorites?.find((f) => f._id === deleteTarget)

  // Loading state - show skeleton
  if (favorites === undefined) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Favorite Roads" />
        <View
          style={[
            styles.skeleton,
            {
              backgroundColor: semantic.color.surfaceVariant.default,
              borderRadius: semantic.radius.lg,
              marginBottom: semantic.space.md,
            },
          ]}
        />
        <View
          style={[
            styles.skeleton,
            {
              backgroundColor: semantic.color.surfaceVariant.default,
              borderRadius: semantic.radius.lg,
              marginBottom: semantic.space.md,
            },
          ]}
        />
        <View
          style={[
            styles.skeleton,
            {
              backgroundColor: semantic.color.surfaceVariant.default,
              borderRadius: semantic.radius.lg,
              marginBottom: semantic.space.md,
            },
          ]}
        />
        <DeleteFavoriteDialog
          visible={false}
          favoriteName=""
          onConfirm={() => {}}
          onDismiss={() => {}}
        />
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
          body="Save a road segment to see it here"
          testID="empty-state"
        />
        <DeleteFavoriteDialog
          visible={false}
          favoriteName=""
          onConfirm={() => {}}
          onDismiss={() => {}}
        />
      </View>
    )
  }

  // List of favorites
  return (
    <View style={[styles.section, { marginBottom: semantic.space.lg }]}>
      <SectionHeader title="Favorite Roads" />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <FavoriteRoadCard
            favoriteRoadId={item._id}
            name={item.name}
            bounds={item.bounds ?? { north: 0, south: 0, east: 0, west: 0 }}
            onDelete={() => handleDelete(item._id)}
            testID={`favorite-road-card-${item._id}`}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: semantic.space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            headline="No favorite roads yet"
            body="Save a road segment to see it here"
            testID="empty-state"
          />
        }
        scrollEnabled={false}
      />
      <DeleteFavoriteDialog
        visible={deleteTarget !== null}
        favoriteName={favoriteToDelete?.name ?? ''}
        onConfirm={handleConfirmDelete}
        onDismiss={handleDismissDelete}
        testID="delete-favorite-dialog"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  skeleton: {
    height: 80,
  },
})
