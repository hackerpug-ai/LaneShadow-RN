import { useCallback, useMemo } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useSavedRoutesList } from '../../../hooks/use-saved-routes'
import { SavedRouteCard } from '../../../components/ui/saved-route-card'
import { formatDate } from '../../../components/ui/saved-route-card.utils'
import { SkeletonCard, EmptyPlaceholder } from './saved-routes.components'
import type { SavedRouteListItemView } from '../../../types/routes'

export const SKELETON_COUNT = 3
export const THUMBNAIL_ROTATIONS = [-12, -8, -5, -10, -7] as const

export const formatDistance = (meters: number): string =>
  `${(meters / 1609.344).toFixed(1)} mi`

export const formatDuration = (seconds: number): string => {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export const getSortedRoutes = (
  routes: SavedRouteListItemView[]
): SavedRouteListItemView[] => [...routes].sort((a, b) => b.createdAt - a.createdAt)

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

  const headerStyle = [
    semantic.type.title.lg,
    {
      color: semantic.color.onSurface.default,
      paddingTop: semantic.space.lg,
      paddingBottom: semantic.space.md,
    },
  ]

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
        <Text variant="titleLarge" style={headerStyle}>
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
          <Text variant="titleLarge" style={headerStyle}>
            Saved Routes
          </Text>
        }
        stickyHeaderIndices={[0]}
        ListEmptyComponent={EmptyPlaceholder}
        refreshControl={
          <RefreshControl refreshing={false} tintColor={semantic.color.primary.default} />
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
})
