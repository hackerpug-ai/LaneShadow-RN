/**
 * Route Discovery Screen Component
 *
 * Full-bleed map with glassmorphic overlay controls for route discovery.
 * Wired to live Convex data via useCuratedDiscovery hook.
 */

import { useQuery } from 'convex/react'
import { type ReactNode, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type DiscoveryArchetype, useCuratedDiscovery } from '../../hooks/use-curated-discovery'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { api } from '../../server/convex/_generated/api'
import { MenuLayout } from '../layouts/menu-layout'
import { MapHeaderOverlay } from '../map/map-header-overlay'
import { type MapboxCamera, MapboxMapView } from '../map/mapbox-map-view'
import { DiscoveryEmptyOverlay } from './discovery-empty-overlay'
import { DiscoveryFilterBar, type RouteArchetype } from './discovery-filter-bar'
import { DiscoveryLoadingOverlay } from './discovery-loading-overlay'
import { DiscoverySortToggle, type SortMode } from './discovery-sort-toggle'
import { RoutePin } from './route-pin'
import { StateFilterSheet } from './state-filter-sheet'

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

  const [menuOpen, setMenuOpen] = useState(false)
  const [stateSheetVisible, setStateSheetVisible] = useState(false)
  const [selectedStateCodes, setSelectedStateCodes] = useState<string[]>([])
  const [selectedArchetypes, setSelectedArchetypes] = useState<RouteArchetype[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('best')
  const stateOptions = useQuery(api.curatedRoutes.listCuratedRouteStates, {}) ?? []

  const selectedState = useMemo(
    () => stateOptions.find((state) => selectedStateCodes.includes(state.code)),
    [stateOptions, selectedStateCodes],
  )

  const archetypesParam = useMemo(() => {
    const filtered = selectedArchetypes.filter((a): a is DiscoveryArchetype => a !== 'all')
    return filtered.length > 0 ? filtered : undefined
  }, [selectedArchetypes])

  const { routes, isLoading, isEmpty } = useCuratedDiscovery({
    archetypes: archetypesParam,
    sort: sortMode,
    state: selectedState?.name,
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
    if (routes && routes.length > 0) {
      const lats = routes.map((route) => route.lat).filter(Number.isFinite)
      const lngs = routes.map((route) => route.lng).filter(Number.isFinite)

      if (lats.length > 0 && lngs.length > 0) {
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        const latSpan = maxLat - minLat
        const lngSpan = maxLng - minLng
        const span = Math.max(latSpan, lngSpan)

        return {
          center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
          zoom: selectedState ? (span > 8 ? 4.8 : span > 4 ? 5.6 : 6.4) : 3.2,
        }
      }
    }

    return {
      center: [-96.0, 39.0],
      zoom: selectedState ? 5.4 : 3.2,
    }
  }, [routes, selectedState])

  const handleRoutePress = (_routeId: string) => {
    // Curated-route detail navigation is not registered in this app yet.
  }

  const handleStateSelectionChange = (codes: string[]) => {
    const latest = codes[codes.length - 1]
    setSelectedStateCodes(latest ? [latest] : [])
    if (latest) {
      setStateSheetVisible(false)
    }
  }

  return (
    <MenuLayout
      headerTitle="Lane Shadow"
      testID="route-discovery-screen"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
    >
      <View style={styles.container}>
        <MapboxMapView theme={dark ? 'dark' : 'light'} camera={cameraPosition} style={styles.map}>
          {routes?.map((route, index) => (
            <RoutePin
              key={route.id}
              routeId={route.id}
              archetype={route.archetype}
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
        </MapboxMapView>

        <DiscoveryLoadingOverlay visible={isLoading} />
        <DiscoveryEmptyOverlay visible={!isLoading && isEmpty} />

        <View pointerEvents="box-none" style={styles.headerOverlay}>
          <MapHeaderOverlay
            title={selectedState?.name ?? 'Discovery'}
            leftAction={{
              icon: 'menu',
              onPress: () => setMenuOpen(true),
              testID: 'map-header-menu',
              accessibilityLabel: 'Open menu',
            }}
            rightAction={{
              icon: selectedState ? 'map-marker-check' : 'map-search',
              onPress: () => setStateSheetVisible(true),
              testID: 'map-header-state-filter',
              accessibilityLabel: 'Filter by state',
            }}
            testID="discovery-map-header"
          />
        </View>

        <View
          pointerEvents="box-none"
          style={[
            styles.filterBarContainer,
            {
              top: insets.top + 86,
            },
          ]}
        >
          <DiscoveryFilterBar
            selectedArchetypes={selectedArchetypes}
            onArchetypeChange={setSelectedArchetypes}
            counts={archetypeCounts}
            includeSafeArea={false}
            testID="discovery-filter-bar"
          />
        </View>

        <View
          pointerEvents="box-none"
          style={[
            styles.sortToggleContainer,
            {
              top: insets.top + 148,
              right: semantic.space.lg,
            },
          ]}
        >
          <DiscoverySortToggle
            mode={sortMode}
            onModeChange={setSortMode}
            testID="discovery-sort-toggle"
          />
        </View>

        <StateFilterSheet
          visible={stateSheetVisible}
          states={stateOptions}
          selected={selectedStateCodes}
          onSelectionChange={handleStateSelectionChange}
          onDismiss={() => setStateSheetVisible(false)}
          testID="state-filter-sheet"
        />
      </View>
    </MenuLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 30,
  },
  filterBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 24,
  },
  sortToggleContainer: {
    position: 'absolute',
    zIndex: 25,
  },
})
