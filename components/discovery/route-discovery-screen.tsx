/**
 * Route Discovery Screen Component
 *
 * Full-bleed map with glassmorphic overlay controls for route discovery.
 * Wired to live Convex data via useCuratedDiscovery hook.
 */

import { type ReactNode, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useCuratedDiscovery, type DiscoveryArchetype } from '../../hooks/use-curated-discovery'
import { MenuLayout } from '../layouts/menu-layout'
import { MapboxMapView, type MapboxCamera } from '../map/mapbox-map-view'
import { DiscoveryFilterBar, type RouteArchetype } from './discovery-filter-bar'
import { DiscoverySortToggle, type SortMode } from './discovery-sort-toggle'
import { DiscoveryLoadingOverlay } from './discovery-loading-overlay'
import { DiscoveryEmptyOverlay } from './discovery-empty-overlay'
import { RoutePin } from './route-pin'

const UI_ARCHETYPES: RouteArchetype[] = [
  'twisties',
  'scenic',
  'technical',
  'cruising',
  'sport',
  'adventure',
]



export const RouteDiscoveryScreen = (): ReactNode => {
  const { semantic, dark } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  const [selectedArchetypes, setSelectedArchetypes] = useState<RouteArchetype[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('best')

  const archetypesParam = useMemo(() => {
    const filtered = selectedArchetypes.filter((a): a is DiscoveryArchetype => a !== 'all')
    return filtered.length > 0 ? filtered : undefined
  }, [selectedArchetypes])

  const { routes, isLoading, isEmpty } = useCuratedDiscovery({
    archetypes: archetypesParam,
    sort: sortMode,
  })

  const archetypeCounts = useMemo((): Record<RouteArchetype, number> => {
    const base: Record<string, number> = { all: 0 }
    for (const a of UI_ARCHETYPES) base[a] = 0

    if (routes) {
      for (const r of routes) {
        base.all++
        if (base[r.archetype] !== undefined) base[r.archetype]++
      }
    }

    const result: Record<RouteArchetype, number> = {} as Record<RouteArchetype, number>
    for (const a of UI_ARCHETYPES) {
      result[a] = base[a] ?? 0
    }
    result.all = base.all ?? 0
    return result
  }, [routes])

  const cameraPosition: MapboxCamera = useMemo(() => {
    return {
      center: [-105.0, 39.7],
      zoom: 8,
    }
  }, [])

  const handleRoutePress = (routeId: string) => {
    // Navigation to detail handled in DISC-001 / future task
  }

  return (
    <MenuLayout
      headerTitle="Route Discovery"
      testID="route-discovery-screen"
      menuOpen={false}
      onMenuOpenChange={() => {}}
    >
      <MapboxMapView
        theme={dark ? 'dark' : 'light'}
        camera={cameraPosition}
        style={styles.map as any}
      >
        {/* Live route pins */}
        {routes?.map((route, index) => (
          <RoutePin
            key={route.id}
            routeId={route.id}
            archetype={route.archetype as any}
            coordinate={{ latitude: route.lat, longitude: route.lng }}
            rank={sortMode === 'best' && index < 10 ? index + 1 : undefined}
            distance={
              sortMode === 'nearest' && route.distanceMi != null
                ? `${route.distanceMi.toFixed(1)} mi`
                : undefined
            }
            onPress={handleRoutePress}
            testID={`route-pin-${route.id}`}
          />
        ))}

        {/* Filter Bar */}
        <View style={styles.filterBarContainer as any}>
          <DiscoveryFilterBar
            selectedArchetypes={selectedArchetypes}
            onArchetypeChange={setSelectedArchetypes}
            counts={archetypeCounts}
            testID="discovery-filter-bar"
          />
        </View>

        {/* Sort Toggle */}
        <View
          style={
            [
              styles.sortToggleContainer,
              {
                top: insets.top + 70,
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

        {/* Loading Overlay */}
        <DiscoveryLoadingOverlay visible={isLoading} />

        {/* Empty Overlay */}
        <DiscoveryEmptyOverlay visible={isEmpty} />
      </MapboxMapView>
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
})
