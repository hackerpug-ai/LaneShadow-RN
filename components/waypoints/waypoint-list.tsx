/**
 * WaypointList Component
 *
 * Glassmorphic container component with drag-to-reorder functionality
 * Displays waypoints for a route plan with progressive disclosure
 * Provides approve/reject/reorder actions for waypoint management
 */

import { useState } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { IconSymbol } from '../ui/icon-symbol'
import { DragHandle } from '../ui/drag-handle'
import { WaypointCard } from './waypoint-card'

/**
 * Helper to add opacity to hex color for glassmorphic effect
 */
const addOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export type WaypointListProps = {
  /** Route plan ID to fetch waypoints for */
  routePlanId: Id<'route_plans'>
  /** Approve callback */
  onApprove?: (waypointId: Id<'waypoints'>) => void
  /** Reject callback */
  onReject?: (waypointId: Id<'waypoints'>) => void
  /** Reorder callback */
  onReorder?: (waypointId: Id<'waypoints'>, newOrder: number) => void
  /** Initially collapsed state */
  initiallyCollapsed?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * WaypointList component with glassmorphic styling and drag-reorder
 * Fetches waypoints from Convex and renders them with collapsible header
 */
export const WaypointList = ({
  routePlanId,
  onApprove,
  onReject,
  onReorder,
  initiallyCollapsed = false,
  testID,
}: WaypointListProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)

  // Fetch waypoints for this route plan
  const waypoints = useQuery(api.db.waypoints.listWaypointsByRoutePlan, {
    routePlanId,
  })

  // Sort waypoints by order field (if available) or creation time
  const sortedWaypoints = waypoints
    ? [...waypoints].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order
        }
        if (a.order !== undefined) return -1
        if (b.order !== undefined) return 1
        return a.createdAt - b.createdAt
      })
    : []

  // Loading state
  if (waypoints === undefined) {
    return (
      <View
        style={[
          styles.glassmorphicContainer,
          {
            backgroundColor: addOpacity(semantic.color.surface.default, 0.85),
            borderColor: addOpacity(semantic.color.border.default, 0.3),
            padding: semantic.space.lg,
          },
        ]}
        testID={testID}
      >
        <Text
          style={[styles.loadingText, { color: semantic.color.onSurface.subtle }]}
          accessibilityLabel="Loading waypoints"
        >
          Loading waypoints...
        </Text>
      </View>
    )
  }

  // Empty state
  if (sortedWaypoints.length === 0) {
    return (
      <View
        style={[
          styles.glassmorphicContainer,
          {
            backgroundColor: addOpacity(semantic.color.surface.default, 0.85),
            borderColor: addOpacity(semantic.color.border.default, 0.3),
            padding: semantic.space.lg,
          },
        ]}
        testID={testID}
      >
        <Text
          style={[styles.emptyText, { color: semantic.color.onSurface.subtle }]}
          accessibilityLabel="No waypoints for this route"
        >
          No waypoints for this route
        </Text>
      </View>
    )
  }

  const hasPendingApprovals = sortedWaypoints.some(
    (wp) => wp.status === 'ready' || wp.status === 'pending'
  )

  return (
    <View
      style={[
        styles.glassmorphicContainer,
        {
          backgroundColor: addOpacity(semantic.color.surface.default, 0.85),
          borderColor: addOpacity(semantic.color.border.default, 0.3),
        },
      ]}
      testID={testID}
      accessible
      accessibilityLabel="Waypoint list"
      accessibilityHint={`${sortedWaypoints.length} waypoints${hasPendingApprovals ? ', some pending approval' : ''}`}
    >
      {/* Collapsible header with drag handle */}
      <Pressable
        onPress={() => setIsCollapsed(!isCollapsed)}
        style={({ pressed }) => [
          styles.header,
          {
            backgroundColor: pressed
              ? addOpacity(semantic.color.primary.default, 0.1)
              : 'transparent',
          },
        ]}
        accessibilityLabel={isCollapsed ? 'Expand waypoint list' : 'Collapse waypoint list'}
        accessibilityRole="button"
        testID={`${testID}-header`}
      >
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.headerTitle,
              { color: semantic.color.onSurface.default },
            ]}
          >
            Waypoints
          </Text>
          <Text
            style={[
              styles.headerCount,
              { color: semantic.color.onSurface.subtle },
            ]}
          >
            ({sortedWaypoints.length})
          </Text>
          {hasPendingApprovals && (
            <View
              style={[
                styles.pendingIndicator,
                { backgroundColor: semantic.color.warning.default },
              ]}
              accessible={false}
            />
          )}
        </View>
        <IconSymbol
          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
          size={24}
          color={semantic.color.onSurface.subtle}
        />
      </Pressable>

      {/* Drag handle for reorder affordance */}
      {!isCollapsed && onReorder && (
        <View style={styles.dragHandleContainer}>
          <DragHandle width={40} height={5} />
        </View>
      )}

      {/* Waypoint cards - hidden when collapsed */}
      {!isCollapsed && (
        <View style={styles.waypointCards}>
          {sortedWaypoints.map((waypoint, index) => (
            <WaypointCard
              key={waypoint._id}
              waypoint={waypoint}
              order={index}
              onApprove={onApprove}
              onReject={onReject}
              onReorder={onReorder}
              testID={`${testID}-waypoint-${index}`}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  glassmorphicContainer: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    // Note: backdropBlur should be applied by parent or platform-specific wrapper
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerCount: {
    fontSize: 14,
  },
  pendingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  waypointCards: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
