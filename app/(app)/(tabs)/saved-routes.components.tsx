import { useCallback, useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { Swipeable } from 'react-native-gesture-handler'
import { IconSymbol } from '../../../components/ui/icon-symbol'

import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { Skeleton } from '../../../components/ui/skeleton'
import { RouteSearchBar } from '../../../components/ui/route-search-bar'
import { DateRangePicker } from '../../../components/ui/date-range-picker'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import type { DateRangePickerProps } from '../../../components/ui/date-range-picker'

// ---------------------------------------------------------------------------
// SkeletonCard – loading placeholder for a single saved-route row
// ---------------------------------------------------------------------------

export const SkeletonCard = () => {
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

// ---------------------------------------------------------------------------
// EmptyPlaceholder – shown when the user has no saved routes
// ---------------------------------------------------------------------------

export const EmptyPlaceholder = () => {
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
// LoadingState – skeleton screen shown during initial data load
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 3

export const LoadingState = () => {
  const { semantic } = useSemanticTheme()
  return (
    <SubpageLayout title="Saved Routes" testID="saved-routes-loading">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </SubpageLayout>
  )
}

// ---------------------------------------------------------------------------
// FilterHeader – search bar + date chips + clear button + result count
// ---------------------------------------------------------------------------

type FilterHeaderProps = {
  onSearch: (query: string) => void
  onDateRangeChange: DateRangePickerProps['onDateRangeChange']
  filtersActive: boolean
  onClearFilters: () => void
  resultCount: number
  datePickerKey: number
}

export const FilterHeader = ({
  onSearch,
  onDateRangeChange,
  filtersActive,
  onClearFilters,
  resultCount,
  datePickerKey,
}: FilterHeaderProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      testID="filter-header"
      style={[
        styles.filterHeader,
        {
          backgroundColor: semantic.color.background.default,
          gap: semantic.space.sm,
          paddingTop: semantic.space.md,
          paddingBottom: semantic.space.md,
        },
      ]}
    >
      <RouteSearchBar onSearch={onSearch} testID="route-search-bar" />
      <DateRangePicker
        key={datePickerKey}
        onDateRangeChange={onDateRangeChange}
        testID="date-range-picker"
      />
      {filtersActive && (
        <View style={[styles.filterMeta, { gap: semantic.space.sm }]}>
          <Pressable onPress={onClearFilters} testID="clear-filters-button">
            <Text
              style={[
                semantic.type.label.sm,
                { color: semantic.color.primary.default },
              ]}
            >
              Clear all filters
            </Text>
          </Pressable>
          <Text
            testID="result-count"
            style={[
              semantic.type.body.sm,
              { color: semantic.color.onSurface.muted },
            ]}
          >
            {resultCount} {resultCount === 1 ? 'route' : 'routes'} found
          </Text>
        </View>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// FilteredEmptyState – shown when filters match nothing
// ---------------------------------------------------------------------------

export const FilteredEmptyState = () => {
  const { semantic } = useSemanticTheme()
  return (
    <View
      testID="filtered-empty-state"
      style={[styles.emptyContainer, { paddingTop: semantic.space['4xl'] }]}
    >
      <Text
        variant="bodyLarge"
        style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
      >
        No routes match your filters
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// SwipeableRouteCard – wraps children with left-swipe delete gesture
// ---------------------------------------------------------------------------

type SwipeableRouteCardProps = {
  children: React.ReactNode
  onDelete: () => void
  onSwipeOpen?: (ref: Swipeable) => void
}

export const SwipeableRouteCard = ({
  children,
  onDelete,
  onSwipeOpen,
}: SwipeableRouteCardProps) => {
  const { semantic } = useSemanticTheme()
  const swipeableRef = useRef<Swipeable>(null)

  const renderRightActions = useCallback(
    () => (
      <Pressable
        onPress={() => {
          swipeableRef.current?.close()
          onDelete()
        }}
        testID="swipe-delete-action"
        style={[
          styles.swipeDeleteAction,
          {
            backgroundColor: semantic.color.danger.default,
            borderRadius: semantic.radius.lg,
            width: semantic.space['4xl'] + semantic.space['4xl'],
          },
        ]}
      >
        <IconSymbol
          name="trash-can-outline"
          size={24}
          color={semantic.color.onSecondary.default}
        />
      </Pressable>
    ),
    [onDelete, semantic]
  )

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          swipeableRef.current?.close()
          onDelete()
        }
      }}
      onSwipeableWillOpen={() => {
        if (swipeableRef.current) onSwipeOpen?.(swipeableRef.current)
      }}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
  filterHeader: {
    width: '100%',
  },
  filterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swipeDeleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
