/**
 * Route Discovery Screen Component
 *
 * Primary screen for route discovery experience (UC-DISC-01 through UC-DISC-04).
 * Full-bleed map with glassmorphic overlay controls for filtering and sorting.
 *
 * Following styles/RULES.md:
 * - All styling via useSemanticTheme()
 * - Map is always primary and visible
 * - Glassmorphic overlays (semi-transparent + blur)
 * - Elevation ≤ 3 on map overlays
 *
 * Following .spec/prds/curation/tasks/epic-3-local-discovery-hooks/DESIGN-001.md:
 * - AC-001: Map centered on user location with pins
 * - AC-002: Pan/zoom refreshes visible pins
 * - AC-003: Archetype filter works
 * - AC-004: Sort toggle updates badges
 * - AC-005: Pin clustering at low zoom
 * - AC-006: Empty state when no routes
 */

import { type ReactNode, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { MenuLayout } from '../layouts/menu-layout'
import { MapViewWrapper } from '../map/map-view'
import { DiscoveryFilterBar, type RouteArchetype } from './discovery-filter-bar'
import { DiscoverySortToggle, type SortMode } from './discovery-sort-toggle'

/**
 * Mock route pin data for design validation
 * Will be replaced by real data from Convex in CUR-012
 */
const MOCK_ROUTES = [
  {
    id: '1',
    name: 'Mount Evans Scenic Byway',
    lat: 39.645,
    lng: -105.575,
    archetype: 'scenic' as RouteArchetype,
    score: 92,
    distance: 28.5,
  },
  {
    id: '2',
    name: 'Peak to Peak Highway',
    lat: 39.825,
    lng: -105.525,
    archetype: 'scenic' as RouteArchetype,
    score: 88,
    distance: 42.3,
  },
  {
    id: '3',
    name: 'Coal Creek Canyon',
    lat: 39.885,
    lng: -105.355,
    archetype: 'twisties' as RouteArchetype,
    score: 85,
    distance: 18.7,
  },
  {
    id: '4',
    name: 'Golden Gate Canyon',
    lat: 39.885,
    lng: -105.485,
    archetype: 'technical' as RouteArchetype,
    score: 81,
    distance: 22.1,
  },
  {
    id: '5',
    name: 'Trail Ridge Road',
    lat: 40.425,
    lng: -105.785,
    archetype: 'scenic' as RouteArchetype,
    score: 95,
    distance: 65.8,
  },
  {
    id: '6',
    name: 'Lefthand Canyon',
    lat: 40.075,
    lng: -105.305,
    archetype: 'twisties' as RouteArchetype,
    score: 79,
    distance: 15.2,
  },
  {
    id: '7',
    name: 'Deer Creek Canyon',
    lat: 39.475,
    lng: -105.155,
    archetype: 'cruising' as RouteArchetype,
    score: 72,
    distance: 12.4,
  },
  {
    id: '8',
    name: 'Mount Falcon Road',
    lat: 39.635,
    lng: -105.215,
    archetype: 'adventure' as RouteArchetype,
    score: 76,
    distance: 19.8,
  },
]

/**
 * Calculate archetype counts from filtered routes
 */
const calculateArchetypeCounts = (
  routes: typeof MOCK_ROUTES,
  _selectedArchetypes: RouteArchetype[],
): Record<RouteArchetype, number> => {
  return {
    all: routes.length,
    twisties: routes.filter((r) => r.archetype === 'twisties').length,
    scenic: routes.filter((r) => r.archetype === 'scenic').length,
    technical: routes.filter((r) => r.archetype === 'technical').length,
    cruising: routes.filter((r) => r.archetype === 'cruising').length,
    sport: routes.filter((r) => r.archetype === 'sport').length,
    adventure: routes.filter((r) => r.archetype === 'adventure').length,
  }
}

/**
 * Route Discovery Screen
 *
 * Full-bleed map with glassmorphic overlay controls for route discovery.
 * Uses mock data for design validation — business logic will be wired in CUR-012.
 */
export const RouteDiscoveryScreen = (): ReactNode => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  // Local state for UI controls (no Zustand, no Convex in this design task)
  const [selectedArchetypes, setSelectedArchetypes] = useState<RouteArchetype[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('best')

  // Filter routes based on selected archetypes
  const filteredRoutes = useMemo(() => {
    if (selectedArchetypes.length === 0) return MOCK_ROUTES
    return MOCK_ROUTES.filter((route) => selectedArchetypes.includes(route.archetype))
  }, [selectedArchetypes])

  // Calculate archetype counts
  const archetypeCounts = useMemo(
    () => calculateArchetypeCounts(MOCK_ROUTES, selectedArchetypes),
    [selectedArchetypes],
  )

  // Sort routes based on sort mode
  const sortedRoutes = useMemo(() => {
    const sorted = [...filteredRoutes]
    if (sortMode === 'best') {
      sorted.sort((a, b) => b.score - a.score)
    } else {
      sorted.sort((a, b) => a.distance - b.distance)
    }
    return sorted
  }, [filteredRoutes, sortMode])

  // Convert routes to map markers
  const markers = useMemo(() => {
    return sortedRoutes.map((route) => ({
      id: route.id,
      title: route.name,
      coordinates: {
        latitude: route.lat,
        longitude: route.lng,
      },
    }))
  }, [sortedRoutes])

  return (
    <MenuLayout
      headerTitle="Route Discovery"
      testID="route-discovery-screen"
      menuOpen={false}
      onMenuOpenChange={() => {}}
    >
      <MapViewWrapper
        style={styles.map as any}
        cameraPosition={{
          coordinates: { latitude: 39.7, longitude: -105.0 }, // Denver
          zoom: 10,
        }}
        markers={markers}
      >
        {/* Filter Bar - positioned at top below status bar */}
        <View style={styles.filterBarContainer as any}>
          <DiscoveryFilterBar
            selectedArchetypes={selectedArchetypes}
            onArchetypeChange={setSelectedArchetypes}
            counts={archetypeCounts}
            testID="discovery-filter-bar"
          />
        </View>

        {/* Sort Toggle - positioned below filter bar */}
        <View
          style={
            [
              styles.sortToggleContainer,
              {
                top: insets.top + 70, // Position below filter bar
                right: semantic.space.lg,
              },
            ] as any
          }
        >
          <DiscoverySortToggle
            mode={sortMode}
            onModeChange={setSortMode}
            testID="discovery-sort-toggle"
          />
        </View>

        {/* Empty State Overlay - shown when no routes match filter */}
        {filteredRoutes.length === 0 && (
          <View
            style={
              [
                styles.emptyState,
                {
                  backgroundColor: `${semantic.color.surface.default}CC`, // 80% opacity
                },
              ] as any
            }
            testID="empty-state"
          >
            <Text
              variant="headlineMedium"
              style={{ color: semantic.color.onSurface.default, marginBottom: semantic.space.sm }}
            >
              No routes in this area
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
            >
              Try adjusting your filters or zoom out to see more routes.
            </Text>
          </View>
        )}

        {/* Pin Cluster Badges (mock implementation for design validation) */}
        {/* In production, this would use Mapbox's built-in clustering */}
        {sortMode === 'best' &&
          sortedRoutes.slice(0, 10).map((route, index) => (
            <View
              key={`rank-${route.id}`}
              style={
                [
                  styles.rankBadge,
                  {
                    backgroundColor: semantic.color.primary.default,
                    top: 100 + index * 20, // Mock positioning for design validation
                    left: semantic.space.lg,
                  },
                ] as any
              }
              testID={`rank-badge-${index + 1}`}
            >
              <Text variant="labelSmall" style={{ color: semantic.color.onPrimary.default }}>
                {index + 1}
              </Text>
            </View>
          ))}
      </MapViewWrapper>
    </MenuLayout>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  filterBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  sortToggleContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 5,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 5,
  },
})
