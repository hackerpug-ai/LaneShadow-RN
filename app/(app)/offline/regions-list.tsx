/**
 * Offline Regions List Screen
 *
 * Displays all downloaded offline map regions with storage usage,
 * empty state, and navigation to download new regions.
 */

import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { RegionListItem } from '../../../components/offline/region-list-item'
import { DeleteConfirmationDialog } from '../../../components/offline/delete-confirmation-dialog'
import { EmptyState } from '../../../components/ui/empty-state'
import { Button } from '../../../components/ui/button'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useOfflineDownload } from '../../../hooks/useOfflineDownload'

export default function OfflineRegionsScreen() {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const {
    regions,
    totalStorageUsed,
    deleteRegion,
    refreshRegions,
  } = useOfflineDownload()

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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

  const renderItem = useCallback(
    ({ item }: { item: (typeof regions)[number] }) => (
      <RegionListItem
        region={item}
        onDelete={(name) => setDeleteTarget(name)}
        testID={`region-item-${item.name}`}
      />
    ),
    [],
  )

  if (regions.length === 0) {
    return (
      <SubpageLayout
        title="Offline Maps"
        testID="offline-regions-screen"
      >
        <View
          style={[
            styles.container,
            { backgroundColor: semantic.color.background.default },
          ]}
        >
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
        {/* Storage usage indicator */}
        <View
          style={[
            styles.storageBar,
            {
              backgroundColor: semantic.color.card.default,
              borderColor: semantic.color.border.default,
              borderRadius: semantic.radius.md,
              padding: semantic.space.md,
              marginBottom: semantic.space.md,
            },
          ]}
        >
          <Text
            variant="labelMedium"
            style={{ color: semantic.color.onSurface.muted }}
          >
            Total Storage Used
          </Text>
          <Text
            variant="titleMedium"
            style={{ color: semantic.color.onSurface.default }}
          >
            {formatSize(totalStorageUsed)}
          </Text>
        </View>

        <FlatList
          data={regions}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          refreshing={false}
          onRefresh={refreshRegions}
          contentContainerStyle={{ gap: semantic.space.md }}
          testID="regions-list"
        />

        <DeleteConfirmationDialog
          visible={deleteTarget !== null}
          regionName={deleteRegionMeta?.name ?? ''}
          regionSize={formatSize(deleteRegionMeta?.size ?? 0)}
          onConfirm={handleDelete}
          onDismiss={() => setDeleteTarget(null)}
          testID="delete-region-dialog"
        />
      </View>
    </SubpageLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  storageBar: {
    borderWidth: 1,
  },
})
