/**
 * Offline Regions List Screen
 *
 * Displays all downloaded offline map regions with actions
 * (view, rename, delete), empty state, and subtle storage footer.
 */

import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { DeleteConfirmationDialog } from '../../../components/offline/delete-confirmation-dialog'
import { RegionListItem } from '../../../components/offline/region-list-item'
import { RenameRegionBottomSheet } from '../../../components/offline/rename-region-bottom-sheet'
import { EmptyState } from '../../../components/ui/empty-state'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useOfflineDownload } from '../../../hooks/useOfflineDownload'

export default function OfflineRegionsScreen() {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { regions, totalStorageUsed, deleteRegion, renameRegion, refreshRegions } =
    useOfflineDownload()

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)

  const deleteRegionMeta = regions.find((r) => r.name === deleteTarget)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const handleDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteRegion(deleteTarget)
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteRegion])

  const handleView = useCallback(
    (name: string) => {
      const region = regions.find((r) => r.name === name)
      if (region) {
        const { sw, ne } = region.bounds
        // Guard against corrupted bounds
        if (
          !Number.isFinite(sw.lat) ||
          !Number.isFinite(sw.lng) ||
          !Number.isFinite(ne.lat) ||
          !Number.isFinite(ne.lng) ||
          sw.lat >= ne.lat ||
          sw.lng >= ne.lng
        ) {
          // Navigate without bounds — region-selector will use fallback center
          router.push({
            pathname: '/(app)/offline/region-selector',
            params: { regionName: region.name },
          } as any)
          return
        }
        router.push({
          pathname: '/(app)/offline/region-selector',
          params: {
            regionName: region.name,
            swLat: String(sw.lat),
            swLng: String(sw.lng),
            neLat: String(ne.lat),
            neLng: String(ne.lng),
            zoom: '10',
          },
        } as any)
      }
    },
    [regions, router],
  )

  const handleEdit = useCallback((name: string) => {
    setRenameTarget(name)
  }, [])

  const handleRename = useCallback(
    async (newName: string) => {
      if (renameTarget) {
        await renameRegion(renameTarget, newName)
        setRenameTarget(null)
      }
    },
    [renameTarget, renameRegion],
  )

  const renderItem = useCallback(
    ({ item }: { item: (typeof regions)[number] }) => (
      <RegionListItem
        region={item}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(name) => setDeleteTarget(name)}
        testID={`region-item-${item.name}`}
      />
    ),
    [handleView, handleEdit],
  )

  if (regions.length === 0) {
    return (
      <SubpageLayout title="Offline Maps" testID="offline-regions-screen">
        <View style={[styles.container, { backgroundColor: semantic.color.background.default }]}>
          <EmptyState
            icon="map-marker-radius"
            headline="No Offline Maps Yet"
            body="Download regions to navigate without cell service"
            ctaLabel="Download Your First Region"
            onCtaPress={() => router.push('/(app)/offline/region-selector' as any)}
            testID="offline-empty-state"
          />
        </View>
      </SubpageLayout>
    )
  }

  return (
    <SubpageLayout
      title="Offline Maps"
      testID="offline-regions-screen"
      rightAction={{
        icon: 'plus',
        onPress: () => router.push('/(app)/offline/region-selector' as any),
        testID: 'add-region-button',
      }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: semantic.color.background.default,
            padding: semantic.space.lg,
          },
        ]}
      >
        <FlatList
          data={regions}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          refreshing={false}
          onRefresh={refreshRegions}
          contentContainerStyle={{ gap: semantic.space.md }}
          testID="regions-list"
        />

        {/* Subtle storage footer */}
        <View
          style={[
            styles.storageFooter,
            {
              paddingTop: semantic.space.md,
              borderTopColor: semantic.color.border.default,
            },
          ]}
        >
          <Text variant="bodySmall" style={{ color: semantic.color.onSurface.subtle }}>
            {regions.length} {regions.length === 1 ? 'region' : 'regions'} •{' '}
            {formatSize(totalStorageUsed)} stored
          </Text>
        </View>

        <DeleteConfirmationDialog
          visible={deleteTarget !== null}
          regionName={deleteRegionMeta?.name ?? ''}
          regionSize={formatSize(deleteRegionMeta?.size ?? 0)}
          onConfirm={handleDelete}
          onDismiss={() => setDeleteTarget(null)}
          testID="delete-region-dialog"
        />

        <RenameRegionBottomSheet
          visible={renameTarget !== null}
          currentName={renameTarget ?? ''}
          onConfirm={handleRename}
          onCancel={() => setRenameTarget(null)}
          testID="rename-region-sheet"
        />
      </View>
    </SubpageLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  storageFooter: {
    borderTopWidth: 1,
  },
})
