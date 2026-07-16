import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import type { Swipeable } from 'react-native-gesture-handler'
import { Notifier } from 'react-native-notifier'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { DeleteRouteDialog } from '../../../components/ui/delete-route-dialog'
import { EmptyState } from '../../../components/ui/empty-state'
import { SavedRouteCard } from '../../../components/ui/saved-route-card'
import { formatDate } from '../../../components/ui/saved-route-card.utils'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  useSavedRoutesList,
  useSoftDeleteRoute,
  useUndoDeleteRoute,
} from '../../../hooks/use-saved-routes'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { showSuccessNotification } from '../../../lib/notifier-helpers'
import type { SavedRouteListItemView } from '../../../shared/types/routes'
import {
  CuratedSavedRouteCard,
  type CuratedSavedRouteItemView,
  FilteredEmptyState,
  FilterHeader,
  isCuratedSavedItem,
  LoadingState,
  SwipeableRouteCard,
} from './saved-routes.components'

export const SKELETON_COUNT = 3
export const THUMBNAIL_ROTATIONS = [-12, -8, -5, -10, -7] as const

export const formatDistance = (meters: number): string => `${(meters / 1609.344).toFixed(1)} mi`

export const formatDuration = (seconds: number): string => {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export const getSortedRoutes = (routes: SavedRouteListItemView[]): SavedRouteListItemView[] =>
  [...routes].sort((a, b) => b.createdAt - a.createdAt)

const UNDO_TOAST_DURATION = 5000

const SavedRoutesScreen = () => {
  const { semantic } = useSemanticTheme()
  const { bottom } = useSafeAreaInsets()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [afterDate, setAfterDate] = useState<number | undefined>()
  const [beforeDate, setBeforeDate] = useState<number | undefined>()
  const [datePickerKey, setDatePickerKey] = useState(0)

  // Swipe-to-delete state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const softDelete = useSoftDeleteRoute()
  const undoDelete = useUndoDeleteRoute()
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didUndoRef = useRef(false)
  const openSwipeableRef = useRef<Swipeable | null>(null)

  const filtersActive =
    searchQuery.length > 0 || afterDate !== undefined || beforeDate !== undefined

  const { data, isLoading } = useSavedRoutesList({
    searchQuery: searchQuery || undefined,
    afterDate,
    beforeDate,
  })

  const sortedRoutes = useMemo(
    () => (data?.routes ? getSortedRoutes(data.routes) : []),
    [data?.routes],
  )

  const handleSearch = useCallback((query: string) => setSearchQuery(query), [])
  const handleDateRangeChange = useCallback(
    (range: { afterDate?: number; beforeDate?: number }) => {
      setAfterDate(range.afterDate)
      setBeforeDate(range.beforeDate)
    },
    [],
  )
  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setAfterDate(undefined)
    setBeforeDate(undefined)
    setDatePickerKey((k) => k + 1)
  }, [])

  const handlePress = useCallback(
    (savedRouteId: string) => router.push(`/(app)/saved-route/${savedRouteId}`),
    [router],
  )

  const handleSwipeDelete = useCallback((item: SavedRouteListItemView) => {
    setDeleteTarget({ id: item.savedRouteId, name: item.name })
    setDeleteDialogVisible(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    didUndoRef.current = false
    setDeleteDialogVisible(false)

    const result = await softDelete.run({
      savedRouteId: deleteTarget.id as Id<'saved_routes'>,
    })
    if (result === null) return

    const deletedId = deleteTarget.id

    Notifier.showNotification({
      title: 'Route deleted',
      description: 'Tap to undo.',
      duration: UNDO_TOAST_DURATION,
      onPress: async () => {
        didUndoRef.current = true
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current)
          undoTimerRef.current = null
        }
        Notifier.hideNotification()
        await undoDelete.run({
          savedRouteId: deletedId as Id<'saved_routes'>,
        })
        showSuccessNotification('Route restored')
      },
    })

    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null
    }, UNDO_TOAST_DURATION)

    setDeleteTarget(null)
  }, [deleteTarget, softDelete, undoDelete])

  const handleDeleteDismiss = useCallback(() => {
    setDeleteDialogVisible(false)
    setDeleteTarget(null)
  }, [])

  const handleSwipeOpen = useCallback((swipeable: Swipeable) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== swipeable) {
      openSwipeableRef.current.close()
    }
    openSwipeableRef.current = swipeable
  }, [])

  const renderItem = useCallback(
    ({ item, index }: { item: SavedRouteListItemView; index: number }) => {
      // SAVE-001: tolerate curated rows (curatedRouteRef present, no legs/preview).
      // Branch BEFORE touching planned-only fields (item.preview.distanceMeters,
      // item.routeIndex) so a curated row renders a lean preview instead of crashing.
      if (isCuratedSavedItem(item)) {
        const curated = item as unknown as CuratedSavedRouteItemView
        return (
          <SwipeableRouteCard
            onDelete={() => handleSwipeDelete(item)}
            onSwipeOpen={handleSwipeOpen}
          >
            <CuratedSavedRouteCard
              name={curated.name}
              centroidLabel={curated.centroidLabel}
              compositeScore={curated.compositeScore}
              archetype={curated.archetype}
              dateSaved={curated.createdAt ? formatDate(curated.createdAt) : undefined}
              onPress={() => handlePress(curated.savedRouteId)}
            />
          </SwipeableRouteCard>
        )
      }
      // `preview` is only present on rows the server classified as planned. A row
      // that is neither planned nor curated (e.g. a legacy/partial row whose
      // routeIndex is missing, so isCuratedSavedItem returns false) reaches here
      // with no preview — reading through it threw and took down the entire list,
      // not just the offending card. SavedRouteCard's stats are optional, so omit
      // them and still render an openable card.
      const preview = item.preview

      return (
        <SwipeableRouteCard onDelete={() => handleSwipeDelete(item)} onSwipeOpen={handleSwipeOpen}>
          <SavedRouteCard
            name={item.name}
            path={
              item.startLabel && item.endLabel
                ? `${item.startLabel} → ${item.endLabel}`
                : item.startLabel || item.endLabel || ''
            }
            dateSaved={formatDate(item.createdAt)}
            distance={preview ? formatDistance(preview.distanceMeters) : undefined}
            duration={preview ? formatDuration(preview.durationSeconds) : undefined}
            bounds={preview?.bounds}
            thumbnailRotation={THUMBNAIL_ROTATIONS[index % THUMBNAIL_ROTATIONS.length]}
            onPress={() => handlePress(item.savedRouteId)}
          />
        </SwipeableRouteCard>
      )
    },
    [handlePress, handleSwipeDelete, handleSwipeOpen],
  )

  const keyExtractor = useCallback((item: SavedRouteListItemView) => item.savedRouteId, [])

  if (isLoading) return <LoadingState />

  return (
    <SubpageLayout title="Saved Routes" testID="saved-routes-screen">
      <FlatList
        testID="saved-routes-list"
        data={sortedRoutes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
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
      <DeleteRouteDialog
        visible={deleteDialogVisible}
        routeName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onDismiss={handleDeleteDismiss}
        testID="swipe-delete-route-dialog"
      />
    </SubpageLayout>
  )
}

export default SavedRoutesScreen
