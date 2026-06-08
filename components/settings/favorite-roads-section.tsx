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

import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { api } from '../../server/convex/_generated/api'
import type { Id } from '../../server/convex/_generated/dataModel'
import type { SavedRoutesListView } from '../../server/types/routes'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { DeleteFavoriteDialog } from '../ui/delete-favorite-dialog'
import { EmptyState } from '../ui/empty-state'
import { IconSymbol } from '../ui/icon-symbol'
import { SavedRouteCard } from '../ui/saved-route-card'
import { formatDate } from '../ui/saved-route-card.utils'
import { SectionHeader } from '../ui/section-header'

/**
 * Wrapper component that adds delete button to SavedRouteCard
 */
const SavedRouteCardWithDelete: React.FC<{
  item: SavedRoutesListView['routes'][number]
  onDelete: (id: string) => void
}> = ({ item, onDelete }) => {
  const { semantic } = useSemanticTheme()

  return (
    <View style={styles.cardRow}>
      <View style={styles.cardWrapper}>
        <SavedRouteCard
          name={item.name}
          path={
            item.startLabel && item.endLabel
              ? `${item.startLabel} → ${item.endLabel}`
              : item.startLabel || item.endLabel || 'Unknown route'
          }
          dateSaved={formatDate(item.createdAt)}
          distance={`${(item.preview.distanceMeters / 1609.344).toFixed(1)} mi`}
          duration={(() => {
            const minutes = Math.round(item.preview.durationSeconds / 60)
            if (minutes < 60) return `${minutes} min`
            return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
          })()}
          thumbnailRotation={0}
          onPress={() => {
            /* TODO: Navigate to route detail */
          }}
        />
      </View>
      <Pressable
        onPress={() => onDelete(item.savedRouteId)}
        accessibilityRole="button"
        accessibilityLabel="Delete saved route"
        style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <IconSymbol name="trash-can-outline" size={20} color={semantic.color.danger.default} />
      </Pressable>
    </View>
  )
}

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
    } catch (_error) {
      // Error handling could be improved with toast/snackbar in future iteration
    }
  }

  const handleDismissDelete = () => {
    setDeleteTarget(null)
  }

  // Get the name of the route being deleted for the dialog
  const routeToDelete = savedRoutesData?.routes.find(
    (r: (typeof savedRoutesData.routes)[0]) => r.savedRouteId === deleteTarget,
  )

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
        renderItem={({ item }) => <SavedRouteCardWithDelete item={item} onDelete={handleDelete} />}
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
})
