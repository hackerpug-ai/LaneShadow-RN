/**
 * Region Selector Screen
 *
 * Full-screen map with draggable region selection overlay.
 * User selects a geographic area for offline download, sees
 * real-time size estimate, and confirms via a bottom sheet.
 */

import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MapboxMapView } from '../../../components/map'
import { RegionNameBottomSheet } from '../../../components/offline/region-name-bottom-sheet'
import { DownloadProgressIndicator } from '../../../components/offline/download-progress-indicator'
import { Button } from '../../../components/ui/button'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useThemePreference } from '../../../contexts/theme-preference'
import { useOfflineDownload } from '../../../hooks/useOfflineDownload'
import { StorageUtils } from '../../../lib/mapbox/storage-utils'
import { WiFiValidator } from '../../../lib/mapbox/wifi-validator'
import type { DownloadProgress } from '../../../lib/mapbox/offline-manager'

/** Default region centered on Denver, CO area */
const DEFAULT_BOUNDS = {
  sw: { lat: 39.5, lng: -105.2 },
  ne: { lat: 39.9, lng: -104.7 },
}

const MIN_ZOOM = 10
const MAX_ZOOM = 14

type Corner = 'sw' | 'ne' | 'nw' | 'se'

interface SelectionBounds {
  sw: { lat: number; lng: number }
  ne: { lat: number; lng: number }
}

export default function RegionSelectorScreen() {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
  const insets = useSafeAreaInsets()
  const { downloadRegion, progress } = useOfflineDownload()

  const [bounds, setBounds] = useState<SelectionBounds>(DEFAULT_BOUNDS)
  const [showNameSheet, setShowNameSheet] = useState(false)
  const [isWiFi, setIsWiFi] = useState(true)

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

  const handleDragCorner = useCallback(
    (corner: Corner, latDelta: number, lngDelta: number) => {
      setBounds((prev) => {
        const step = 0.02
        const delta = { lat: latDelta * step, lng: lngDelta * step }

        switch (corner) {
          case 'ne':
            return {
              sw: prev.sw,
              ne: {
                lat: Math.min(prev.ne.lat + delta.lat, prev.sw.lat + 10),
                lng: Math.min(prev.ne.lng + delta.lng, prev.sw.lng + 10),
              },
            }
          case 'sw':
            return {
              sw: {
                lat: Math.max(prev.sw.lat + delta.lat, prev.ne.lat - 10),
                lng: Math.max(prev.sw.lng + delta.lng, prev.ne.lng - 10),
              },
              ne: prev.ne,
            }
          case 'nw':
            return {
              sw: {
                ...prev.sw,
                lat: Math.max(prev.sw.lat + delta.lat, prev.ne.lat - 10),
              },
              ne: {
                ...prev.ne,
                lng: Math.min(prev.ne.lng + delta.lng, prev.sw.lng + 10),
              },
            }
          case 'se':
            return {
              sw: {
                ...prev.sw,
                lng: Math.max(prev.sw.lng + delta.lng, prev.ne.lng - 10),
              },
              ne: {
                ...prev.ne,
                lat: Math.min(prev.ne.lat + delta.lat, prev.sw.lat + 10),
              },
            }
        }
      })
    },
    [],
  )

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

  const corners = useMemo(
    () => [
      { key: 'nw' as Corner, lat: bounds.ne.lat, lng: bounds.sw.lng },
      { key: 'ne' as Corner, lat: bounds.ne.lat, lng: bounds.ne.lng },
      { key: 'sw' as Corner, lat: bounds.sw.lat, lng: bounds.sw.lng },
      { key: 'se' as Corner, lat: bounds.sw.lat, lng: bounds.ne.lng },
    ],
    [bounds],
  )

  return (
    <View style={styles.container} testID="region-selector-screen">
      <MapboxMapView
        theme={isDark ? 'dark' : 'light'}
        camera={{
          center: [
            (bounds.sw.lng + bounds.ne.lng) / 2,
            (bounds.sw.lat + bounds.ne.lat) / 2,
          ],
          zoom: 10,
        }}
        style={StyleSheet.absoluteFill}
      >
        {/* Selection overlay rendered as map children - handled by absolute positioned views below */}
      </MapboxMapView>

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

      {/* Selection box overlay */}
      <View style={styles.selectionContainer} pointerEvents="box-none">
        {/* Selection fill */}
        <View
          style={[
            styles.selectionBox,
            {
              borderColor: semantic.color.primary.default,
              backgroundColor: `${semantic.color.primary.default}33`,
            },
          ]}
        />

        {/* Corner handles */}
        {corners.map((corner) => (
          <CornerHandle
            key={corner.key}
            corner={corner.key}
            position={corner}
            allBounds={bounds}
            color={semantic.color.primary.default}
            onDrag={handleDragCorner}
          />
        ))}
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

/**
 * Draggable corner handle for the region selection box.
 * Uses pan gesture to adjust bounds.
 */
function CornerHandle({
  corner,
  position,
  allBounds,
  color,
  onDrag,
}: {
  corner: Corner
  position: { lat: number; lng: number }
  allBounds: SelectionBounds
  color: string
  onDrag: (corner: Corner, latDelta: number, lngDelta: number) => void
}) {
  const HANDLE_SIZE = 24

  // Map corner to screen position (approximate)
  const getStyle = () => {
    const { sw, ne } = allBounds
    const latRange = ne.lat - sw.lat
    const lngRange = ne.lng - sw.lng

    // Normalize position within bounds (0-1)
    const yNorm = 1 - (position.lat - sw.lat) / latRange
    const xNorm = (position.lng - sw.lng) / lngRange

    return {
      left: `${xNorm * 100}%` as const,
      top: `${yNorm * 100}%` as const,
    }
  }

  return (
    <Pressable
      testID={`corner-${corner}`}
      onPressIn={() => {
        // In a real implementation, this would start a pan gesture
        // For now, provide tap-to-expand behavior
        onDrag(corner, corner.includes('n') ? 1 : -1, corner.includes('e') ? 1 : -1)
      }}
      style={[
        styles.cornerHandle,
        {
          backgroundColor: color,
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          borderRadius: HANDLE_SIZE / 2,
          marginLeft: -HANDLE_SIZE / 2,
          marginTop: -HANDLE_SIZE / 2,
        },
        getStyle(),
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Drag ${corner} corner`}
      hitSlop={12}
    />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  selectionContainer: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    bottom: '35%',
  },
  selectionBox: {
    flex: 1,
    borderWidth: 2,
  },
  cornerHandle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'white',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  sizeRow: {
    alignItems: 'center',
  },
})
