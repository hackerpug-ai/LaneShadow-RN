import { useCallback, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useSavedRoutesList } from '../../../hooks/use-saved-routes'
import { SavedRouteCard } from '../../../components/ui/saved-route-card'
import { formatDate } from '../../../components/ui/saved-route-card.utils'
import { LoadingState, FilterHeader, FilteredEmptyState } from './saved-routes.components'
import { EmptyState } from '../../../components/ui/empty-state'
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

  const [searchQuery, setSearchQuery] = useState('')
  const [afterDate, setAfterDate] = useState<number | undefined>()
  const [beforeDate, setBeforeDate] = useState<number | undefined>()
  const [datePickerKey, setDatePickerKey] = useState(0)

  const filtersActive = searchQuery.length > 0 || afterDate !== undefined || beforeDate !== undefined

  const { data, isLoading } = useSavedRoutesList({
    searchQuery: searchQuery || undefined,
    afterDate,
    beforeDate,
  })

  const sortedRoutes = useMemo(
    () => (data?.routes ? getSortedRoutes(data.routes) : []),
    [data?.routes]
  )

  const handleSearch = useCallback((query: string) => setSearchQuery(query), [])
  const handleDateRangeChange = useCallback(
    (range: { afterDate?: number; beforeDate?: number }) => {
      setAfterDate(range.afterDate)
      setBeforeDate(range.beforeDate)
    },
    []
  )
  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setAfterDate(undefined)
    setBeforeDate(undefined)
    setDatePickerKey((k) => k + 1)
  }, [])

  const handlePress = useCallback(
    (savedRouteId: string) => router.push(`/(app)/saved-route/${savedRouteId}`),
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

  if (isLoading) return <LoadingState />

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
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        contentContainerStyle={{
          paddingHorizontal: semantic.space.lg,
          paddingBottom: bottom + semantic.space.lg,
        }}
        ListHeaderComponent={
          <FilterHeader
            onSearch={handleSearch}
            onDateRangeChange={handleDateRangeChange}
            filtersActive={filtersActive}
            onClearFilters={handleClearFilters}
            resultCount={sortedRoutes.length}
            datePickerKey={datePickerKey}
          />
        }
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          filtersActive ? (
            <FilteredEmptyState />
          ) : (
            <EmptyState
              icon="map-marker-path"
              headline="No saved routes yet"
              body="Plan a route and save it to see it here."
              ctaLabel="Plan your first route"
              onCtaPress={() => router.push('/(app)/(tabs)')}
              testID="saved-routes-empty-state"
            />
          )
        }
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
