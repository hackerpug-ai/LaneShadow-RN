/**
 * SavedRoutesSection Component
 *
 * Settings section that displays all user's saved routes with delete functionality.
 * Follows the design system section patterns and uses semantic theme.
 *
 * Acceptance Criteria:
 * - AC1: Section visible with header
 * - AC2: Shows SavedRouteCard for each saved route
 * - AC3: Shows empty state when no saved routes
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
import type { SavedRoutesListView } from '../../types/routes'

/**
 * SavedRoutesSection component for settings screen
 *
 * Displays list of saved routes with delete functionality.
 * Shows loading skeleton while fetching, empty state when no saved routes,
 * and list of SavedRouteCard components when saved routes exist.
 */
export const SavedRoutesSection: React.FC = () => {
  const { semantic } = useSemanticTheme()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Use the saved_routes query instead of favorite_roads
  const savedRoutesData = useQuery(api.db.savedRoutes.getSavedRoutesList, {
    limit: 50,
  })

  console.log('[SavedRoutesSection] Render state:', {
    savedRoutesData,
    routesCount: savedRoutesData?.routes.length ?? 0,
    isUndefined: savedRoutesData === undefined,
  })

  const softDeleteRoute = useMutation(api.db.savedRoutes.softDeleteRoute)

  const handleDelete = (savedRouteId: string) => {
    setDeleteTarget(savedRouteId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      await softDeleteRoute({
        savedRouteId: deleteTarget as Id<'saved_routes'>,
      })
      setDeleteTarget(null)
    } catch (error) {
      console.error('Failed to delete saved route:', error)
      // Error handling could be improved with toast/snackbar in future iteration
    }
  }

  const handleDismissDelete = () => {
    setDeleteTarget(null)
  }

  // Get the name of the route being deleted for the dialog
  const routeToDelete = savedRoutesData?.routes.find((r) => r.savedRouteId === deleteTarget)

  // Loading state - show skeleton
  if (savedRoutesData === undefined) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Saved Routes" />
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
  if (!savedRoutesData || savedRoutesData.routes.length === 0) {
    return (
      <View style={[styles.section, { marginBottom: semantic.space.lg }]}>
        <SectionHeader title="Saved Routes" />
        <EmptyState
          icon="heart-outline"
          headline="No saved routes yet"
          body="Plan a route and save it to see it here"
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

  // List of saved routes
  return (
    <View style={[styles.section, { marginBottom: semantic.space.lg }]}>
      <SectionHeader title="Saved Routes" />
      <FlatList
        data={savedRoutesData.routes}
        keyExtractor={(item) => item.savedRouteId}
        renderItem={({ item }) => (
          <FavoriteRoadCard
            favoriteRoadId={item.savedRouteId as Id<'favorite_roads'>} // TODO: Create SavedRouteCard component
            name={item.name}
            bounds={item.preview.bounds ?? { north: 0, south: 0, east: 0, west: 0 }}
            onDelete={() => handleDelete(item.savedRouteId)}
            testID={`saved-route-card-${item.savedRouteId}`}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: semantic.space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            headline="No saved routes yet"
            body="Plan a route and save it to see it here"
            testID="empty-state"
          />
        }
        scrollEnabled={false}
      />
      <DeleteFavoriteDialog
        visible={deleteTarget !== null}
        favoriteName={routeToDelete?.name ?? ''}
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
