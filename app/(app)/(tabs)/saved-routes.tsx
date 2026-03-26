import { useCallback, useMemo } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useSavedRoutesList } from '../../../hooks/use-saved-routes'
import { SavedRouteCard } from '../../../components/ui/saved-route-card'
import { formatDate } from '../../../components/ui/saved-route-card.utils'
import { Skeleton } from '../../../components/ui/skeleton'
import type { SavedRouteListItemView } from '../../../types/routes'

// ---------------------------------------------------------------------------
// Constants & helpers (exported for tests)
// ---------------------------------------------------------------------------

export const SKELETON_COUNT = 3
export const THUMBNAIL_ROTATIONS = [-12, -8, -5, -10, -7] as const

const METERS_PER_MILE = 1609.344

export const formatDistance = (meters: number): string => {
  const miles = meters / METERS_PER_MILE
  return `${miles.toFixed(1)} mi`
}

export const formatDuration = (seconds: number): string => {
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

export const getSortedRoutes = (
  routes: SavedRouteListItemView[]
): SavedRouteListItemView[] => [...routes].sort((a, b) => b.createdAt - a.createdAt)

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SkeletonCard = () => {
  const { semantic } = useSemanticTheme()
  return (
    <View
      testID="skeleton-card"
      style={[
        styles.skeletonCard,
        {
          backgroundColor: semantic.color.card.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.md,
          marginBottom: semantic.space.md,
          gap: semantic.space.md,
        },
      ]}
    >
      <Skeleton width={96} height={96} shape="rounded" />
      <View style={styles.skeletonText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={14} style={{ marginTop: semantic.space.sm }} />
        <Skeleton width="40%" height={13} style={{ marginTop: semantic.space.sm }} />
      </View>
    </View>
  )
}

const EmptyPlaceholder = () => {
  const { semantic } = useSemanticTheme()
  return (
    <View
      testID="empty-state"
      style={[styles.emptyContainer, { paddingTop: semantic.space['4xl'] }]}
    >
      <Text
        variant="bodyLarge"
        style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
      >
        No saved routes yet. Plan a ride to get started!
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const SavedRoutesScreen = () => {
  const { semantic } = useSemanticTheme()
  const { bottom } = useSafeAreaInsets()
  const router = useRouter()
  const { data, isLoading } = useSavedRoutesList()

  const sortedRoutes = useMemo(
    () => (data?.routes ? getSortedRoutes(data.routes) : []),
    [data?.routes]
  )

  const handlePress = useCallback(
    (savedRouteId: string) => {
      router.push(`/(app)/saved-route/${savedRouteId}`)
    },
    [router]
  )

  const renderItem = useCallback(
    ({ item, index }: { item: SavedRouteListItemView; index: number }) => (
      <SavedRouteCard
        name={item.name}
        path=""
        dateSaved={formatDate(item.createdAt)}
        distance={formatDistance(item.preview.distanceMeters)}
        duration={formatDuration(item.preview.durationSeconds)}
        thumbnailRotation={THUMBNAIL_ROTATIONS[index % THUMBNAIL_ROTATIONS.length]}
        onPress={() => handlePress(item.savedRouteId)}
      />
    ),
    [handlePress]
  )

  const keyExtractor = useCallback(
    (item: SavedRouteListItemView) => item.savedRouteId,
    []
  )

  if (isLoading) {
    return (
      <View
        testID="saved-routes-loading"
        style={[
          styles.container,
          {
            backgroundColor: semantic.color.background.default,
            paddingHorizontal: semantic.space.lg,
          },
        ]}
      >
        <Text
          variant="titleLarge"
          style={[
            styles.header,
            {
              color: semantic.color.onSurface.default,
              paddingTop: semantic.space.lg,
              paddingBottom: semantic.space.md,
            },
          ]}
        >
          Saved Routes
        </Text>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    )
  }

  return (
    <View
      testID="saved-routes-screen"
      style={[styles.container, { backgroundColor: semantic.color.background.default }]}
    >
      <FlatList
        testID="saved-routes-list"
        data={sortedRoutes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingHorizontal: semantic.space.lg,
          paddingBottom: bottom + semantic.space.lg,
        }}
        ListHeaderComponent={
          <Text
            variant="titleLarge"
            style={[
              styles.header,
              {
                color: semantic.color.onSurface.default,
                paddingTop: semantic.space.lg,
                paddingBottom: semantic.space.md,
              },
            ]}
          >
            Saved Routes
          </Text>
        }
        stickyHeaderIndices={[0]}
        ListEmptyComponent={EmptyPlaceholder}
        refreshControl={
          <RefreshControl
            refreshing={false}
            tintColor={semantic.color.primary.default}
          />
        }
      />
    </View>
  )
}

export default SavedRoutesScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontWeight: '700',
  },
  skeletonCard: {
    flexDirection: 'row',
  },
  skeletonText: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
