/**
 * Favorites Info Sheet Component
 *
 * Shows informational message when favorite roads couldn't be included in route
 * Not an error - routes are still generated successfully
 * Helps users understand why favorites weren't used
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components
 * - Provides helpful guidance (not scary error language)
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomActionSheet } from '../ui/bottom-action-sheet'
import { Button } from '../ui/button'
import { IconSymbol } from '../ui/icon-symbol'

/**
 * Add opacity to a hex color
 */
const addOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export type FavoritesInfoSheetProps = {
  visible: boolean
  onClose: () => void
  unavailableFavorites: string[]
  testID?: string
}

/**
 * Info sheet that displays when favorite roads are too far from planned route
 */
export const FavoritesInfoSheet = ({
  visible,
  onClose,
  unavailableFavorites,
  testID = 'favorites-info-sheet',
}: FavoritesInfoSheetProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <BottomActionSheet
      visible={visible}
      onDismiss={onClose}
      snapPoints={['60%']}
      testID={testID}
    >
      <View
        style={[
          styles.container,
          {
            padding: semantic.space.lg,
            gap: semantic.space.md,
          },
        ]}
      >
        {/* Info icon */}
        <View
          style={[
            styles.iconContainer,
            {
              alignSelf: 'center',
              padding: semantic.space.md,
              borderRadius: semantic.radius.full,
              backgroundColor: addOpacity(semantic.color.primary.default, 0.15),
            },
          ]}
        >
          <IconSymbol name="information" size={32} color={semantic.color.primary.default} />
        </View>

        {/* Title */}
        <Text
          variant="titleMedium"
          style={[styles.title, { color: semantic.color.onSurface.default }]}
        >
          Favorites Not Included
        </Text>

        {/* Message */}
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: semantic.color.onSurface.muted }]}
        >
          These favorite roads are too far from your planned route:
        </Text>

        {/* Favorites list */}
        <View
          style={[
            styles.list,
            {
              backgroundColor: addOpacity(semantic.color.surface.default, 0.5),
              borderRadius: semantic.radius.md,
              padding: semantic.space.md,
              gap: semantic.space.sm,
            },
          ]}
        >
          {unavailableFavorites.map((name) => (
            <View key={name} style={styles.listItem}>
              <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
                • {name}
              </Text>
            </View>
          ))}
        </View>

        {/* Guidance */}
        <Text
          variant="bodySmall"
          style={[styles.guidance, { color: semantic.color.onSurface.muted }]}
        >
          Try planning a route nearer to these favorites, or add them to a different route.
        </Text>

        {/* Close button */}
        <Button
          variant="default"
          size="lg"
          onPress={onClose}
          testID={`${testID}-close-button`}
        >
          Got it
        </Button>
      </View>
    </BottomActionSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    lineHeight: 22,
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
  },
  guidance: {
    lineHeight: 20,
    marginTop: 4,
  },
})
