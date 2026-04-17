/**
 * Discovery Sort Toggle Component
 *
 * Segmented control for toggling between "Best" and "Nearest" sort modes.
 * Glassmorphic design with semi-transparent background.
 *
 * Following styles/RULES.md:
 * - All styling via useSemanticTheme()
 * - Glassmorphic pattern (semi-transparent + blur)
 * - Elevation ≤ 3 on map overlays
 */

import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

export type SortMode = 'best' | 'nearest'

export type DiscoverySortToggleProps = {
  mode: SortMode
  onModeChange: (mode: SortMode) => void
  testID?: string
}

/**
 * Discovery Sort Toggle
 *
 * Glassmorphic segmented control for switching between Best and Nearest sort modes.
 * Compact design positioned near filter bar.
 */
export const DiscoverySortToggle = ({
  mode,
  onModeChange,
  testID = 'discovery-sort-toggle',
}: DiscoverySortToggleProps): ReactNode => {
  const { semantic } = useSemanticTheme()

  const containerStyle = {
    backgroundColor: `${semantic.color.surface.default}CC`, // 80% opacity
    borderWidth: 1,
    borderColor: `${semantic.color.border.default}33`, // 20% opacity
    borderRadius: semantic.radius.md,
    padding: semantic.space.xs,
  }

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value) => onModeChange(value as SortMode)}
        variant="outline"
        size="sm"
        style={styles.toggleGroup}
      >
        <ToggleGroupItem value="best" accessibilityLabel="Sort by best score">
          Best
        </ToggleGroupItem>
        <ToggleGroupItem value="nearest" accessibilityLabel="Sort by nearest distance">
          Nearest
        </ToggleGroupItem>
      </ToggleGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
