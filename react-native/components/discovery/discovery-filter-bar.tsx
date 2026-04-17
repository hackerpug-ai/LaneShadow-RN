/**
 * Discovery Filter Bar Component
 *
 * Horizontal scrollable archetype filter chips for route discovery.
 * Glassmorphic design with semi-transparent background.
 *
 * Following styles/RULES.md:
 * - All styling via useSemanticTheme()
 * - Glassmorphic pattern (semi-transparent + blur)
 * - Elevation ≤ 3 on map overlays
 */

import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Chip } from '../ui/chip'

export type RouteArchetype =
  | 'all'
  | 'twisties'
  | 'scenic'
  | 'technical'
  | 'cruising'
  | 'sport'
  | 'adventure'

export type DiscoveryFilterBarProps = {
  selectedArchetypes: RouteArchetype[]
  onArchetypeChange: (archetypes: RouteArchetype[]) => void
  counts: Record<RouteArchetype, number>
  testID?: string
}

const ARCHETYPE_LABELS: Record<RouteArchetype, string> = {
  all: 'All',
  twisties: 'Twisties',
  scenic: 'Scenic',
  technical: 'Technical',
  cruising: 'Cruising',
  sport: 'Sport',
  adventure: 'Adventure',
}

const ARCHETYPE_ICONS: Record<RouteArchetype, string | undefined> = {
  all: 'check-all',
  twisties: 'road-variant',
  scenic: 'landscape',
  technical: 'wrench',
  cruising: 'motorbike',
  sport: 'fire',
  adventure: 'compass',
}

/**
 * Format count for display (e.g., 12, 99+, 1.2k)
 */
const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  if (count > 99) {
    return '99+'
  }
  return count.toString()
}

/**
 * Discovery Filter Bar
 *
 * Glassmorphic horizontal scrollable filter bar for archetype selection.
 * Shows count badges for each archetype.
 */
export const DiscoveryFilterBar = ({
  selectedArchetypes,
  onArchetypeChange,
  counts,
  testID = 'discovery-filter-bar',
}: DiscoveryFilterBarProps): ReactNode => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  const handleChipPress = (archetype: RouteArchetype) => {
    if (archetype === 'all') {
      // "All" clears the filter
      onArchetypeChange([])
      return
    }

    // Toggle the archetype
    const isSelected = selectedArchetypes.includes(archetype)
    if (isSelected) {
      // If deselecting and this was the only one, show all
      onArchetypeChange(
        selectedArchetypes.length === 1 ? [] : selectedArchetypes.filter((a) => a !== archetype),
      )
    } else {
      // Add to selection
      onArchetypeChange([...selectedArchetypes, archetype])
    }
  }

  const isAllSelected = selectedArchetypes.length === 0

  const containerStyle = {
    paddingTop: insets.top + semantic.space.md,
    paddingBottom: semantic.space.md,
    paddingHorizontal: semantic.space.lg,
    backgroundColor: `${semantic.color.surface.default}CC`, // 80% opacity
    borderBottomWidth: 1,
    borderBottomColor: `${semantic.color.border.default}33`, // 20% opacity
  }

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        testID={`${testID}-scroll`}
      >
        {/* "All" chip */}
        <Chip
          label={`${ARCHETYPE_LABELS.all} (${formatCount(counts.all)})`}
          icon={ARCHETYPE_ICONS.all as any}
          selected={isAllSelected}
          onPress={() => handleChipPress('all')}
          testID={`${testID}-chip-all`}
        />

        {/* Archetype chips */}
        {(
          ['twisties', 'scenic', 'technical', 'cruising', 'sport', 'adventure'] as RouteArchetype[]
        ).map((archetype, index) => (
          <View key={archetype} style={index > 0 ? { marginLeft: semantic.space.sm } : undefined}>
            <Chip
              label={`${ARCHETYPE_LABELS[archetype]} (${formatCount(counts[archetype])})`}
              icon={ARCHETYPE_ICONS[archetype] as any}
              selected={selectedArchetypes.includes(archetype)}
              onPress={() => handleChipPress(archetype)}
              testID={`${testID}-chip-${archetype}`}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // Glassmorphic effect handled inline with dynamic colors
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
