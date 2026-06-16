/**
 * Discovery Loading Overlay Component
 *
 * Skeleton overlay for initial route discovery loading state.
 * Features 300ms debounce to prevent flash on fast loads.
 * Semi-transparent glassmorphic design (map visible behind).
 *
 * Specs from DESIGN-007 AC-001:
 * - Skeleton appears after 300ms debounce
 * - Semi-transparent (map visible behind)
 * - Skeleton placeholders mimic expected content shape
 * - Disappears immediately when data loads
 *
 * Following styles/RULES.md:
 * - All styling via useSemanticTheme()
 * - Glassmorphic pattern (semi-transparent + blur)
 * - Elevation ≤ 3 on map overlays
 * - Reuses existing Skeleton component
 */

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Skeleton, SkeletonAvatar } from '../ui/skeleton'

export type DiscoveryLoadingOverlayProps = {
  /** Whether loading state is active */
  visible: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * Discovery Loading Overlay
 *
 * Glassmorphic skeleton overlay with 300ms debounce.
 * Shows skeleton placeholders for filter bar and route pins.
 */
export function DiscoveryLoadingOverlay({
  visible,
  testID = 'discovery-loading-overlay',
}: DiscoveryLoadingOverlayProps): ReactNode {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const [debouncedVisible, setDebouncedVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      // 300ms debounce to prevent flash on fast loads
      const timer = setTimeout(() => setDebouncedVisible(true), 300)
      return () => clearTimeout(timer)
    } else {
      // Immediately hide when data loads
      setDebouncedVisible(false)
    }
  }, [visible])

  if (!debouncedVisible) {
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
      {/* Skeleton for filter bar area */}
      <View
        style={[
          styles.filterBarSkeleton,
          {
            paddingHorizontal: semantic.space.lg,
            paddingBottom: semantic.space.md,
            borderBottomColor: `${semantic.color.border.default}1A`, // 10% opacity
          },
        ]}
      >
        {/* Skeleton chips for archetypes */}
        <View style={styles.chipRow}>
          <Skeleton width={80} height={32} shape="rounded" />
          <Skeleton
            width={100}
            height={32}
            shape="rounded"
            style={{ marginLeft: semantic.space.sm }}
          />
          <Skeleton
            width={90}
            height={32}
            shape="rounded"
            style={{ marginLeft: semantic.space.sm }}
          />
        </View>
      </View>

      {/* Skeleton for route pins area */}
      <View style={[styles.pinSkeletons, { paddingHorizontal: semantic.space.lg }]}>
        {/* Simulate map pins in a scattered pattern */}
        <View style={styles.pinRow}>
          <View style={styles.pinContainer}>
            <SkeletonAvatar size="default" />
            <Skeleton width={50} height={12} style={{ marginTop: semantic.space.xs }} />
          </View>
          <View style={[styles.pinContainer, { marginLeft: semantic.space.xl * 2 }]}>
            <SkeletonAvatar size="default" />
            <Skeleton width={60} height={12} style={{ marginTop: semantic.space.xs }} />
          </View>
        </View>
        <View style={[styles.pinRow, { marginTop: semantic.space.xl * 2 }]}>
          <View style={styles.pinContainer}>
            <SkeletonAvatar size="default" />
            <Skeleton width={45} height={12} style={{ marginTop: semantic.space.xs }} />
          </View>
          <View style={[styles.pinContainer, { marginLeft: semantic.space.xl * 3 }]}>
            <SkeletonAvatar size="default" />
            <Skeleton width={55} height={12} style={{ marginTop: semantic.space.xs }} />
          </View>
        </View>
        <View style={[styles.pinRow, { marginTop: semantic.space.xl * 2 }]}>
          <View style={[styles.pinContainer, { marginLeft: semantic.space.lg }]}>
            <SkeletonAvatar size="default" />
            <Skeleton width={48} height={12} style={{ marginTop: semantic.space.xs }} />
          </View>
        </View>
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
  filterBarSkeleton: {
    borderBottomWidth: 1,
    // Border color applied inline with semantic token
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinSkeletons: {
    flex: 1,
    justifyContent: 'center',
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinContainer: {
    alignItems: 'center',
  },
})
