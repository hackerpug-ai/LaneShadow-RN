/**
 * Region Selector Screen
 *
 * Full-screen map with a fixed camera-style viewport overlay.
 * The user pans/zooms the map to position the area they want
 * inside the viewport frame. The frame acts as a viewfinder —
 * only the map content visible through it will be downloaded.
 *
 * When opened with `regionName`/`regionBounds`/`regionZoom` params,
 * the camera snaps to that region's exact capture and the download
 * button stays disabled until the user moves or zooms the map.
 * The old region is only purged when the new download is confirmed.
 */

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MapboxMapView, type MapboxMapViewHandle, MapControls } from '../../../components/map'
import { DownloadProgressIndicator } from '../../../components/offline/download-progress-indicator'
import { RegionNameBottomSheet } from '../../../components/offline/region-name-bottom-sheet'
import { Button } from '../../../components/ui/button'
import { useThemePreference } from '../../../contexts/theme-preference'
import { useCurrentLocation } from '../../../hooks/use-current-location'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useOfflineDownload } from '../../../hooks/useOfflineDownload'
import { StorageUtils } from '../../../lib/mapbox/storage-utils'
import { WiFiValidator } from '../../../lib/mapbox/wifi-validator'

/** Fallback if location permission denied — Denver, CO area */
const FALLBACK_CENTER = { lat: 39.7, lng: -104.95 }
const BOUNDS_SPAN = 0.2 // ~0.2 degrees each direction from center

const MIN_ZOOM = 10
const MAX_ZOOM = 14

interface SelectionBounds {
  sw: { lat: number; lng: number }
  ne: { lat: number; lng: number }
}

function makeBounds(centerLat: number, centerLng: number): SelectionBounds {
  return {
    sw: { lat: centerLat - BOUNDS_SPAN, lng: centerLng - BOUNDS_SPAN },
    ne: { lat: centerLat + BOUNDS_SPAN, lng: centerLng + BOUNDS_SPAN },
  }
}

/** Length of each corner bracket arm in pixels */
const CORNER_ARM = 24
/** Thickness of the corner bracket lines */
const CORNER_THICKNESS = 3

export default function RegionSelectorScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    regionName?: string
    swLat?: string
    swLng?: string
    neLat?: string
    neLng?: string
    zoom?: string
  }>()
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
  const insets = useSafeAreaInsets()
  const { downloadRegion, deleteRegion, progress } = useOfflineDownload()
  const { location: currentLocation } = useCurrentLocation()
  const mapRef = useRef<MapboxMapViewHandle | null>(null)

  const zoom = useCallback((delta: number) => mapRef.current?.zoomBy(delta), [])
  const recenter = useCallback(() => mapRef.current?.recenterToUser(), [])

  // Parse existing region params (if editing/re-viewing)
  const existingBounds: SelectionBounds | null = useMemo(() => {
    if (params.swLat && params.swLng && params.neLat && params.neLng) {
      const sw = { lat: parseFloat(params.swLat), lng: parseFloat(params.swLng) }
      const ne = { lat: parseFloat(params.neLat), lng: parseFloat(params.neLng) }
      // Guard against NaN from invalid URL params
      if (
        !isFinite(sw.lat) ||
        !isFinite(sw.lng) ||
        !isFinite(ne.lat) ||
        !isFinite(ne.lng) ||
        sw.lat >= ne.lat ||
        sw.lng >= ne.lng
      ) {
        return null
      }
      return { sw, ne }
    }
    return null
  }, [params.swLat, params.swLng, params.neLat, params.neLng])

  const existingZoom = params.zoom ? parseFloat(params.zoom) : null
  const existingName = params.regionName ?? null

  const [bounds, setBounds] = useState<SelectionBounds>(
    () =>
      existingBounds ??
      makeBounds(
        currentLocation?.lat ?? FALLBACK_CENTER.lat,
        currentLocation?.lng ?? FALLBACK_CENTER.lng,
      ),
  )
  const [showNameSheet, setShowNameSheet] = useState(false)
  const [isWiFi, setIsWiFi] = useState(true)
  const [hasMoved, setHasMoved] = useState(false)

  const initialCameraZoom = existingZoom ?? 10

  // Update bounds when user location resolves (only if no existing region)
  useEffect(() => {
    if (existingBounds || !currentLocation) return
    setBounds(makeBounds(currentLocation.lat, currentLocation.lng))
  }, [existingBounds, currentLocation])

  // When camera moves from the initial position, enable download
  const handleCameraMove = useCallback(() => {
    if (!hasMoved) setHasMoved(true)
  }, [hasMoved])

  const sizeEstimate = useMemo(
    () =>
      StorageUtils.estimateRegionSize(
        [
          [bounds.sw.lng, bounds.sw.lat],
          [bounds.ne.lng, bounds.ne.lat],
        ],
        MIN_ZOOM,
        MAX_ZOOM,
      ),
    [bounds],
  )

  const formatMB = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? '< 1 MB' : `${mb.toFixed(0)} MB`
  }

  const canDownload = !existingBounds || hasMoved

  const handleDownloadPress = useCallback(async () => {
    const wifi = await WiFiValidator.isWiFi()
    setIsWiFi(wifi)
    setShowNameSheet(true)
  }, [])

  const handleConfirmDownload = useCallback(
    async (name: string) => {
      setShowNameSheet(false)
      // Purge old region only at the point of confirming new download
      if (existingName) {
        await deleteRegion(existingName)
      }
      await downloadRegion({
        name,
        bounds,
        styleURL: 'mapbox://styles/mapbox/streets-v12',
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      })
    },
    [downloadRegion, deleteRegion, bounds, existingName],
  )

  const isDownloading = progress?.state === 'downloading'

  const primaryColor = semantic.color.primary.default
  const scrimColor = `${semantic.color.background.default}88`

  const cameraCenter: [number, number] = [
    (bounds.sw.lng + bounds.ne.lng) / 2,
    (bounds.sw.lat + bounds.ne.lat) / 2,
  ]

  // Guard against NaN — fall back to Denver area if bounds are corrupted
  const safeCameraCenter: [number, number] =
    isFinite(cameraCenter[0]) && isFinite(cameraCenter[1])
      ? cameraCenter
      : [FALLBACK_CENTER.lng, FALLBACK_CENTER.lat]

  return (
    <View style={styles.container} testID="region-selector-screen">
      <MapboxMapView
        ref={mapRef}
        theme={isDark ? 'dark' : 'light'}
        camera={{
          center: safeCameraCenter,
          zoom: initialCameraZoom,
        }}
        onCameraMove={handleCameraMove}
        style={StyleSheet.absoluteFill}
      />

      {/* Map controls — zoom and recenter, same position as home screen */}
      <View style={styles.controls} pointerEvents="box-none">
        <MapControls
          mode="map"
          onZoomIn={() => {
            zoom(1)
            setHasMoved(true)
          }}
          onZoomOut={() => {
            zoom(-1)
            setHasMoved(true)
          }}
          onRecenter={recenter}
        />
      </View>

      {/* Header overlay */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: `${semantic.color.background.default}CC` },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          testID="region-selector-back"
          accessibilityLabel="Go back"
        >
          <Text variant="labelLarge" style={{ color: semantic.color.primary.default }}>
            Cancel
          </Text>
        </Pressable>
        <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
          Select Region
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/*
        Camera-style viewport overlay.
        The four scrim rectangles dim the area OUTSIDE the selection window.
        Inside the window, only thin edge lines and L-shaped corner brackets
        mark the capture area — no fill, no draggable handles.
        The user pans the map under the frame.
      */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top scrim */}
        <View
          pointerEvents="none"
          style={[styles.scrim, { height: '20%', backgroundColor: scrimColor }]}
        />

        {/* Middle row: left scrim | viewport | right scrim */}
        <View pointerEvents="none" style={styles.middleRow}>
          <View
            pointerEvents="none"
            style={[styles.scrim, { width: '10%', backgroundColor: scrimColor }]}
          />

          {/* The viewport window — clear, with edge lines and corners */}
          <View
            pointerEvents="none"
            style={styles.viewport}
            testID="region-selector-viewport"
            accessibilityLabel="Selected region area. Pan the map to choose what to download."
            accessibilityRole="image"
          >
            {/* Thin continuous edge border */}
            <View style={[styles.viewportBorder, { borderColor: `${primaryColor}66` }]} />

            {/* Corner brackets — solid copper L-shapes */}
            {/* Top-left */}
            <View style={[styles.cornerPosition, { left: -1, top: -1 }]}>
              <View
                style={[
                  styles.cornerBracket,
                  {
                    borderColor: primaryColor,
                    borderTopWidth: CORNER_THICKNESS,
                    borderLeftWidth: CORNER_THICKNESS,
                    width: CORNER_ARM,
                    height: CORNER_ARM,
                  },
                ]}
              />
            </View>
            {/* Top-right */}
            <View style={[styles.cornerPosition, { right: -1, top: -1 }]}>
              <View
                style={[
                  styles.cornerBracket,
                  {
                    borderColor: primaryColor,
                    borderTopWidth: CORNER_THICKNESS,
                    borderRightWidth: CORNER_THICKNESS,
                    width: CORNER_ARM,
                    height: CORNER_ARM,
                  },
                ]}
              />
            </View>
            {/* Bottom-left */}
            <View style={[styles.cornerPosition, { left: -1, bottom: -1 }]}>
              <View
                style={[
                  styles.cornerBracket,
                  {
                    borderColor: primaryColor,
                    borderBottomWidth: CORNER_THICKNESS,
                    borderLeftWidth: CORNER_THICKNESS,
                    width: CORNER_ARM,
                    height: CORNER_ARM,
                  },
                ]}
              />
            </View>
            {/* Bottom-right */}
            <View style={[styles.cornerPosition, { right: -1, bottom: -1 }]}>
              <View
                style={[
                  styles.cornerBracket,
                  {
                    borderColor: primaryColor,
                    borderBottomWidth: CORNER_THICKNESS,
                    borderRightWidth: CORNER_THICKNESS,
                    width: CORNER_ARM,
                    height: CORNER_ARM,
                  },
                ]}
              />
            </View>
          </View>

          <View
            pointerEvents="none"
            style={[styles.scrim, { flex: 1, backgroundColor: scrimColor }]}
          />
        </View>

        {/* Bottom scrim */}
        <View
          pointerEvents="none"
          style={[styles.scrim, { flex: 1, backgroundColor: scrimColor }]}
        />
      </View>

      {/* Bottom overlay */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: `${semantic.color.background.default}CC`,
          },
        ]}
      >
        {progress?.state === 'complete' ? (
          <View style={[styles.sizeRow, { gap: semantic.space.sm }]}>
            <Text variant="headlineSmall" style={{ color: semantic.color.success.default }}>
              Region Ready
            </Text>
            <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
              Offline map downloaded successfully.
            </Text>
            <Button
              variant="default"
              size="lg"
              onPress={() => router.push('/(app)/offline/regions-list' as any)}
              testID="view-offline-maps-button"
              style={{ width: '100%' }}
            >
              View Offline Maps
            </Button>
          </View>
        ) : isDownloading || progress?.state === 'failed' ? (
          progress && (
            <DownloadProgressIndicator
              packName={progress.packName}
              bytesDownloaded={progress.bytesDownloaded}
              totalBytes={progress.totalBytes}
              percentage={progress.percentage}
              eta={progress.eta}
              state={progress.state}
              testID="region-selector-progress"
            />
          )
        ) : (
          <>
            <View style={styles.sizeRow}>
              <Text variant="headlineSmall" style={{ color: semantic.color.onSurface.default }}>
                {formatMB(sizeEstimate)}
              </Text>
              <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
                estimated download
              </Text>
            </View>
            {canDownload ? (
              <Button
                variant="default"
                size="lg"
                onPress={handleDownloadPress}
                testID="download-region-button"
                style={{ width: '100%' }}
              >
                Download Region
              </Button>
            ) : (
              <View
                style={[
                  styles.hintBox,
                  {
                    backgroundColor: `${semantic.color.primary.default}15`,
                    borderRadius: semantic.radius.md,
                    padding: semantic.space.md,
                  },
                ]}
              >
                <Text
                  variant="bodySmall"
                  style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
                >
                  Pan or zoom the map to select a new area
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <RegionNameBottomSheet
        visible={showNameSheet}
        sizeEstimate={sizeEstimate}
        isWiFi={isWiFi}
        onConfirm={handleConfirmDownload}
        onCancel={() => setShowNameSheet(false)}
        testID="region-name-sheet"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scrim: {
    flexDirection: 'row',
  },
  middleRow: {
    height: '55%',
    flexDirection: 'row',
  },
  viewport: {
    width: '80%',
    position: 'relative',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  viewportBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  cornerPosition: {
    position: 'absolute',
    zIndex: 2,
  },
  cornerBracket: {
    backgroundColor: 'transparent',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  controls: {
    position: 'absolute',
    zIndex: 30,
    top: '50%',
    right: 8,
    alignItems: 'center',
  },
  sizeRow: {
    alignItems: 'center',
  },
  hintBox: {},
})
