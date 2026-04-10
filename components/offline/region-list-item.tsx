/**
 * RegionListItem for offline map regions.
 *
 * Displays a card with region name, size, download date, and bounds preview.
 * Supports press-to-view and long-press for delete action.
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { Pressable } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RegionMetadata } from '../../lib/mapbox/offline-manager'

export type RegionListItemProps = {
  region: RegionMetadata
  onPress?: (name: string) => void
  onDelete?: (name: string) => void
  testID?: string
}

export const RegionListItem = ({
  region,
  onPress,
  onDelete,
  testID = 'region-list-item',
}: RegionListItemProps) => {
  const { semantic } = useSemanticTheme()

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return `Downloaded ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`
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
    <Pressable
      testID={testID}
      onPress={() => onPress?.(region.name)}
      onLongPress={() => onDelete?.(region.name)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? semantic.color.surface.pressed
            : semantic.color.card.default,
          borderColor: semantic.color.border.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${region.name}, ${formatSize(region.size)}, ${formatDate(region.downloadedAt)}`}
    >
      <View style={[styles.row, { marginBottom: semantic.space.xs }]}>
        <Text
          variant="titleMedium"
          style={{ color: semantic.color.onSurface.default, flex: 1 }}
          numberOfLines={1}
        >
          {region.name}
        </Text>
        <Text
          variant="labelMedium"
          style={{ color: semantic.color.primary.default }}
        >
          {region.state === 'complete' ? '' : region.state}
        </Text>
      </View>

      <Text
        variant="bodySmall"
        style={{ color: semantic.color.onSurface.muted }}
      >
        {formatSize(region.size)} • {formatDate(region.downloadedAt)}
      </Text>

      <Text
        variant="bodySmall"
        style={{ color: semantic.color.onSurface.subtle, marginTop: 2 }}
      >
        {formatBounds()}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
