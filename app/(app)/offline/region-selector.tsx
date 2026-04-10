/**
 * Region Selector Screen
 *
 * Full-screen map with a fixed camera-style viewport overlay.
 * The user pans/zooms the map to position the area they want
 * inside the viewport frame. The frame acts as a viewfinder —
 * only the map content visible through it will be downloaded.
 */

import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { MapboxMapView, MapboxMapViewHandle, MapControls } from '../../../components/map'
import { RegionNameBottomSheet } from '../../../components/offline/region-name-bottom-sheet'
import { DownloadProgressIndicator } from '../../../components/offline/download-progress-indicator'
import { Button } from '../../../components/ui/button'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useThemePreference } from '../../../contexts/theme-preference'
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
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
  const insets = useSafeAreaInsets()
  const { downloadRegion, progress } = useOfflineDownload()
  const mapRef = useRef<MapboxMapViewHandle | null>(null)

  const zoom = useCallback((delta: number) => mapRef.current?.zoomBy(delta), [])
  const recenter = useCallback(() => mapRef.current?.recenterToUser(), [])

  const [bounds, setBounds] = useState<SelectionBounds>(() =>
    makeBounds(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng),
  )
  const [showNameSheet, setShowNameSheet] = useState(false)
  const [isWiFi, setIsWiFi] = useState(true)

  // Center on user's current location on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') return

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
        if (!mounted) return

        const { latitude, longitude } = pos.coords
        setBounds(makeBounds(latitude, longitude))
      } catch {
        // Keep fallback bounds
      }
    })()
    return () => { mounted = false }
  }, [])

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

  const handleDownloadPress = useCallback(async () => {
    const wifi = await WiFiValidator.isWiFi()
    setIsWiFi(wifi)
    setShowNameSheet(true)
  }, [])

  const handleConfirmDownload = useCallback(
    async (name: string) => {
      setShowNameSheet(false)
      await downloadRegion({
        name,
        bounds,
        styleURL: 'mapbox://styles/mapbox/streets-v12',
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      })
    },
    [downloadRegion, bounds],
  )

  const isDownloading = progress?.state === 'downloading'

  const primaryColor = semantic.color.primary.default
  const scrimColor = `${semantic.color.background.default}88`

  return (
    <View style={styles.container} testID="region-selector-screen">
      <MapboxMapView
        ref={mapRef}
        theme={isDark ? 'dark' : 'light'}
        camera={{
          center: [
            (bounds.sw.lng + bounds.ne.lng) / 2,
            (bounds.sw.lat + bounds.ne.lat) / 2,
          ],
          zoom: 10,
        }}
        style={StyleSheet.absoluteFill}
      />

      {/* Map controls — zoom and recenter, same position as home screen */}
      <View style={styles.controls} pointerEvents="box-none">
        <MapControls
          mode="map"
          onZoomIn={() => zoom(1)}
          onZoomOut={() => zoom(-1)}
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
          <Text
            variant="labelLarge"
            style={{ color: semantic.color.primary.default }}
          >
            Cancel
          </Text>
        </Pressable>
        <Text
          variant="titleMedium"
          style={{ color: semantic.color.onSurface.default }}
        >
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
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Top scrim */}
        <View style={[styles.scrim, { height: '20%', backgroundColor: scrimColor }]} />

        {/* Middle row: left scrim | viewport | right scrim */}
        <View style={styles.middleRow}>
          <View style={[styles.scrim, { width: '10%', backgroundColor: scrimColor }]} />

          {/* The viewport window — clear, with edge lines and corners */}
          <View
            style={styles.viewport}
            testID="region-selector-viewport"
            accessibilityLabel="Selected region area. Pan the map to choose what to download."
            accessibilityRole="image"
          >
            {/* Thin continuous edge border */}
            <View
              style={[
                styles.viewportBorder,
                { borderColor: `${primaryColor}66` },
              ]}
            />

            {/* Corner brackets — solid copper L-shapes */}
            {/* Top-left */}
            <View style={[styles.cornerPosition, { left: -1, top: -1 }]}>
              <View style={[styles.cornerBracket, { borderColor: primaryColor, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, width: CORNER_ARM, height: CORNER_ARM }]} />
            </View>
            {/* Top-right */}
            <View style={[styles.cornerPosition, { right: -1, top: -1 }]}>
              <View style={[styles.cornerBracket, { borderColor: primaryColor, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, width: CORNER_ARM, height: CORNER_ARM }]} />
            </View>
            {/* Bottom-left */}
            <View style={[styles.cornerPosition, { left: -1, bottom: -1 }]}>
              <View style={[styles.cornerBracket, { borderColor: primaryColor, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, width: CORNER_ARM, height: CORNER_ARM }]} />
            </View>
            {/* Bottom-right */}
            <View style={[styles.cornerPosition, { right: -1, bottom: -1 }]}>
              <View style={[styles.cornerBracket, { borderColor: primaryColor, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, width: CORNER_ARM, height: CORNER_ARM }]} />
            </View>
          </View>

          <View style={[styles.scrim, { flex: 1, backgroundColor: scrimColor }]} />
        </View>

        {/* Bottom scrim */}
        <View style={[styles.scrim, { flex: 1, backgroundColor: scrimColor }]} />
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
        {isDownloading || progress?.state === 'complete' || progress?.state === 'failed' ? (
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
              <Text
                variant="headlineSmall"
                style={{ color: semantic.color.onSurface.default }}
              >
                {formatMB(sizeEstimate)}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: semantic.color.onSurface.muted }}
              >
                estimated download
              </Text>
            </View>
            <Button
              variant="default"
              size="lg"
              onPress={handleDownloadPress}
              testID="download-region-button"
              style={{ width: '100%' }}
            >
              Download Region
            </Button>
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
  /**
   * Scrim rectangles that dim the area outside the viewport.
   * Each is a non-interactive overlay (pointerEvents handled by parent).
   */
  scrim: {
    flexDirection: 'row',
  },
  /**
   * Middle row sits between the top and bottom scrim bands.
   * Contains: left-scrim | viewport | right-scrim
   */
  middleRow: {
    height: '55%',
    flexDirection: 'row',
  },
  /**
   * The clear viewport window. Map shows through unobstructed.
   * Thin edge border + corner brackets are the only chrome.
   */
  viewport: {
    width: '80%',
    position: 'relative',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  /**
   * Thin semi-transparent border around the viewport.
   * Subtler than the corner brackets — gives a sense of the full frame.
   */
  viewportBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  /**
   * Absolute-positioned wrapper for each corner bracket.
   * Positioned via inline style (left/right/top/bottom) to the
   * four corners of the viewport. Offset by -1px so the bracket
   * sits flush with the thin viewport border.
   */
  cornerPosition: {
    position: 'absolute',
    zIndex: 2,
  },
  /**
   * L-shaped corner bracket. Only two sides have borders,
   * creating the camera viewfinder aesthetic.
   * Width/height set inline per-corner; borders set inline.
   */
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
})
