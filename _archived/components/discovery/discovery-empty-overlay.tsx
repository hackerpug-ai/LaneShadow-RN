/**
 * Discovery Empty Overlay Component
 *
 * Glassmorphic empty state overlay for zero route results.
 * Displays context-aware message with suggestion to adjust filters.
 * Semi-transparent design (map visible behind).
 *
 * Specs from DESIGN-007 AC-002:
 * - Glassmorphic empty state overlay
 * - Shows message like "No routes in this area" or "No routes match your filters"
 * - Suggestion to adjust filters or zoom out
 * - Semi-transparent (map visible behind)
 *
 * Following styles/RULES.md:
 * - All styling via useSemanticTheme()
 * - Glassmorphic pattern (semi-transparent + blur)
 * - Elevation ≤ 3 on map overlays
 * - Reuses existing EmptyState component
 */

import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { EmptyState } from '../ui/empty-state'

export type DiscoveryEmptyOverlayProps = {
  /** Whether empty state should be shown */
  visible: boolean
  /** Context-aware empty state message */
  message?: string
  /** Suggestion subtitle (default: "Try adjusting your filters or zooming out") */
  suggestion?: string
  /** Optional CTA button label */
  ctaLabel?: string
  /** Optional CTA button press handler */
  onCtaPress?: () => void
  /** Test ID for testing */
  testID?: string
}

/**
 * Discovery Empty Overlay
 *
 * Glassmorphic empty state wrapper with context-aware messaging.
 * Reuses existing EmptyState component with semi-transparent background.
 */
export function DiscoveryEmptyOverlay({
  visible,
  message = 'No routes in this area',
  suggestion = 'Try adjusting your filters or zooming out',
  ctaLabel,
  onCtaPress,
  testID = 'discovery-empty-overlay',
}: DiscoveryEmptyOverlayProps): ReactNode {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  if (!visible) {
    return null
  }

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: insets.top,
          backgroundColor: `${semantic.color.surface.default}CC`, // 80% opacity
        },
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        <EmptyState
          icon="map-marker-path"
          headline={message}
          body={suggestion}
          ctaLabel={ctaLabel}
          onCtaPress={onCtaPress}
          testID={`${testID}-state`}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Semi-transparent background applied inline
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
})
