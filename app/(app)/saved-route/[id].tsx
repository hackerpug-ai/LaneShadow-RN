/**
 * Route Detail Screen
 *
 * Full-screen view of a saved route with map, stats, weather badges,
 * and route highlights. Accessed via navigation from saved routes list.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

import { MapHeaderOverlay } from '../../../components/map/map-header-overlay'
import {
  OverlayToggle,
  type OverlayType,
  type OverlayAvailability,
} from '../../../components/map/overlay-toggle'
import { MapViewWrapper } from '../../../components/map/map-view'
import { buildRoutePolylines } from '../../../components/map/route-polyline'
import { WindBadge } from '../../../components/planning/wind-badge'
import { RainBadge } from '../../../components/ui/rain-badge'
import { RouteLegTimeline } from '../../../components/ui/route-leg-timeline'
import { StatRow } from '../../../components/ui/stat-row'
import { TemperatureBadge } from '../../../components/ui/temperature-badge'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useSavedRouteDetail } from '../../../hooks/use-saved-routes'
import {
  getWorstRainLevel,
  getWorstTemperatureLevel,
  getMaxTemperatureFahrenheit,
} from '../../../models/saved-routes'
import type { RouteOverlays } from '../../../models/saved-routes'

import { deriveWindSummary, formatDistance, formatDuration, formatSavedDate } from './utils'

const Z_INDEX_OVERLAY_TOGGLE = 25

const SavedRouteDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { data, isLoading } = useSavedRouteDetail(id ?? null)

  const [selectedOverlay, setSelectedOverlay] = useState<OverlayType | ''>('')

  const overlayAvailability: OverlayAvailability = useMemo(() => {
    if (!data) return { wind: false, rain: false, temperature: false }
    const overlays = data.routeSnapshot.overlays
    return {
      wind: !!overlays.wind,
      rain: !!overlays.rain,
      temperature: !!overlays.temperature,
    }
  }, [data])

  const hasAnyOverlay = overlayAvailability.wind || overlayAvailability.rain || overlayAvailability.temperature

  const polylines = useMemo(() => {
    if (!data) return []
    return buildRoutePolylines({
      route: {
        overviewGeometry: data.routeSnapshot.overviewGeometry,
        legs: data.routeSnapshot.legs,
        overlays: data.routeSnapshot.overlays,
      },
      variant: 'selected',
      showLegs: true,
      showWindOverlay: selectedOverlay === 'wind',
      showRainOverlay: selectedOverlay === 'rain',
      showTemperatureOverlay: selectedOverlay === 'temperature',
      semantic,
    })
  }, [data, semantic, selectedOverlay])

  if (isLoading) {
    return (
      <SafeAreaView
        testID="route-detail-loading"
        style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      >
        <ActivityIndicator
          size="large"
          color={semantic.color.primary.default}
          style={styles.loader}
        />
      </SafeAreaView>
    )
  }

  if (!data) {
    return (
      <SafeAreaView
        testID="route-detail-not-found"
        style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      >
        <MapHeaderOverlay
          title="Route Detail"
          leftAction={{
            icon: 'arrow-left',
            onPress: () => router.back(),
            testID: 'route-detail-back',
          }}
          testID="route-detail-header"
        />
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="map-marker-question"
            size={48}
            color={semantic.color.onSurface.subtle}
          />
          <Text
            variant="bodyLarge"
            style={[
              styles.notFoundText,
              {
                color: semantic.color.onSurface.default,
                marginTop: semantic.space.md,
                marginBottom: semantic.space.xs,
              },
            ]}
            testID="route-not-found-message"
          >
            Route not found
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: semantic.color.onSurface.subtle }}
          >
            This route may have been deleted.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const overlays: RouteOverlays = data.routeSnapshot.overlays
  const windSummary = deriveWindSummary(overlays.wind)
  const rainSummary = getWorstRainLevel(overlays.rain)
  const tempSummary = getWorstTemperatureLevel(overlays.temperature)
  const maxTempF = getMaxTemperatureFahrenheit(overlays.temperature)
  const totalDistance = data.routeSnapshot.legs.reduce((s, l) => s + l.distanceMeters, 0)
  const totalDuration = data.routeSnapshot.legs.reduce((s, l) => s + l.durationSeconds, 0)
  const legsCount = data.routeSnapshot.legs.length
  const annotations = data.routeSnapshot.annotations

  return (
    <SafeAreaView
      testID="route-detail-screen"
      style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      edges={['top']}
    >
      <View style={styles.root}>
        {/* Map section */}
        <View style={styles.mapSection} accessibilityLabel={`Route map for ${data.name}`}>
          <MapViewWrapper polylines={polylines} />
          <MapHeaderOverlay
            title={data.name}
            leftAction={{
              icon: 'arrow-left',
              onPress: () => router.back(),
              testID: 'route-detail-back',
            }}
            testID="route-detail-header"
          />

          {/* Overlay toggle - only shown when overlay data exists (AC4) */}
          {hasAnyOverlay && (
            <View
              style={[
                styles.overlayToggle,
                {
                  top: semantic.space.xl,
                  right: semantic.space.lg,
                },
              ]}
            >
              <OverlayToggle
                value={selectedOverlay}
                onValueChange={setSelectedOverlay}
                availability={overlayAvailability}
                testID="overlay-toggle"
              />
            </View>
          )}
        </View>

        {/* Info section */}
        <ScrollView
          style={styles.infoSection}
          contentContainerStyle={{
            paddingHorizontal: semantic.space.lg,
            paddingTop: semantic.space.md,
            paddingBottom: semantic.space.xl,
          }}
          showsVerticalScrollIndicator={false}
          testID="route-detail-scroll"
        >
          {/* Saved date caption */}
          <Text
            variant="bodySmall"
            style={{ color: semantic.color.onSurface.subtle, marginBottom: semantic.space.md }}
            testID="route-detail-saved-date"
          >
            Saved {formatSavedDate(data.snapshotMeta.savedAt)}
          </Text>

          {/* Stats section */}
          <SectionHeader label="Statistics" semantic={semantic} />
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: semantic.color.surfaceVariant.default,
                borderRadius: semantic.radius.lg,
                padding: semantic.space.lg,
                gap: semantic.space.md,
              },
            ]}
          >
            <StatRow icon="map-marker-distance" value={formatDistance(totalDistance)} />
            <StatRow icon="clock-outline" value={formatDuration(totalDuration)} />
            <StatRow icon="vector-polyline" value={`${legsCount} legs`} />
          </View>

          {/* Weather section */}
          <SectionHeader label="Weather Conditions" semantic={semantic} />
          <View
            style={[styles.weatherRow, { gap: semantic.space.sm }]}
            testID="route-detail-weather"
          >
            <WindBadge windLevel={windSummary} testID="route-detail-wind-badge" />
            <RainBadge rainSummary={rainSummary} testID="route-detail-rain-badge" />
            <TemperatureBadge
              temperatureSummary={tempSummary}
              temperatureValue={maxTempF}
              testID="route-detail-temp-badge"
            />
          </View>

          {/* Highlights section */}
          {annotations.length > 0 && (
            <>
              <SectionHeader label="Highlights" semantic={semantic} />
              <View style={{ gap: semantic.space.xs }}>
                {annotations.map((a) => (
                  <View key={a.id} style={[styles.bulletRow, { gap: semantic.space.sm }]}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: semantic.color.onSurface.subtle }}
                    >
                      {'\u2022'}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={[styles.bulletText, { color: semantic.color.onSurface.default }]}
                    >
                      {a.label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Route Legs timeline section */}
          {data.routeSnapshot.legs.length > 0 && (
            <>
              <SectionHeader label="Route Legs" semantic={semantic} />
              <RouteLegTimeline
                legs={data.routeSnapshot.legs}
                planInput={data.planInput}
                overlays={overlays}
                testID="route-leg-timeline"
              />
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default SavedRouteDetailScreen

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type SectionHeaderProps = {
  label: string
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

const SectionHeader = ({ label, semantic }: SectionHeaderProps) => (
  <Text
    variant="labelMedium"
    style={{
      color: semantic.color.onSurface.subtle,
      textTransform: 'uppercase',
      marginTop: semantic.space.lg,
      marginBottom: semantic.space.sm,
    }}
  >
    {label}
  </Text>
)

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  mapSection: {
    flex: 0.5,
  },
  overlayToggle: {
    position: 'absolute',
    zIndex: Z_INDEX_OVERLAY_TOGGLE,
  },
  infoSection: {
    flex: 0.5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {},
  statsCard: {},
  weatherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
  },
})
