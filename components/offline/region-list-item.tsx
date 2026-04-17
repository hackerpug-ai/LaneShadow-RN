/**
 * RegionListItem for offline map regions.
 *
 * Card with region name, size, and date. Explicit action row
 * with view/edit/delete buttons — no hidden long-press gestures.
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RegionMetadata } from '../../stores/offline-store'
import { IconSymbol } from '../ui/icon-symbol'

export type RegionListItemProps = {
  region: RegionMetadata
  onView?: (name: string) => void
  onEdit?: (name: string) => void
  onDelete?: (name: string) => void
  testID?: string
}

export const RegionListItem = ({
  region,
  onView,
  onEdit,
  onDelete,
  testID = 'region-list-item',
}: RegionListItemProps) => {
  const { semantic } = useSemanticTheme()

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatBounds = () => {
    const lat = ((region.bounds.ne.lat + region.bounds.sw.lat) / 2).toFixed(2)
    const lng = ((region.bounds.ne.lng + region.bounds.sw.lng) / 2).toFixed(2)
    return `${lat}, ${lng} area`
  }

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: semantic.color.border.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
        },
      ]}
      accessibilityLabel={`${region.name}, ${formatSize(region.size)}, Downloaded ${formatDate(region.downloadedAt)}`}
    >
      {/* Region info */}
      <View style={styles.infoArea}>
        <View style={[styles.row, { marginBottom: semantic.space.xs }]}>
          <Text
            variant="titleMedium"
            style={{ color: semantic.color.onSurface.default, flex: 1 }}
            numberOfLines={1}
          >
            {region.name}
          </Text>
          <Text variant="labelMedium" style={{ color: semantic.color.primary.default }}>
            {formatSize(region.size)}
          </Text>
        </View>

        <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
          {formatDate(region.downloadedAt)} • {formatBounds()}
        </Text>
      </View>

      {/* Action row — evenly distributed */}
      <View
        style={[
          styles.actionRow,
          {
            marginTop: semantic.space.md,
            paddingTop: semantic.space.md,
            borderTopWidth: 1,
            borderTopColor: semantic.color.border.default,
          },
        ]}
      >
        <Pressable
          onPress={() => onView?.(region.name)}
          testID={`${testID}-view`}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? semantic.color.surfaceVariant.pressed : 'transparent',
              borderRadius: semantic.radius.md,
              paddingVertical: semantic.space.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View ${region.name} on map`}
        >
          <IconSymbol name="map-outline" size={16} color={semantic.color.onSurface.default} />
          <Text variant="labelSmall" style={{ color: semantic.color.onSurface.default }}>
            View
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onEdit?.(region.name)}
          testID={`${testID}-edit`}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? semantic.color.surfaceVariant.pressed : 'transparent',
              borderRadius: semantic.radius.md,
              paddingVertical: semantic.space.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Rename ${region.name}`}
        >
          <IconSymbol name="pencil-outline" size={16} color={semantic.color.onSurface.default} />
          <Text variant="labelSmall" style={{ color: semantic.color.onSurface.default }}>
            Rename
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onDelete?.(region.name)}
          testID={`${testID}-delete`}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? `${semantic.color.danger.default}1A` : 'transparent',
              borderRadius: semantic.radius.md,
              paddingVertical: semantic.space.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${region.name}`}
        >
          <IconSymbol name="trash-can-outline" size={16} color={semantic.color.danger.default} />
          <Text variant="labelSmall" style={{ color: semantic.color.danger.default }}>
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  infoArea: {
    // Tappable info section
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
})
