/**
 * WaypointList Component
 *
 * Container component that fetches and displays waypoints for a route plan
 * Provides approve/reject/reorder actions for waypoint management
 */

import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { WaypointCard } from './waypoint-card'

export type WaypointListProps = {
  /** Route plan ID to fetch waypoints for */
  routePlanId: Id<'route_plans'>
  /** Approve callback */
  onApprove?: (waypointId: Id<'waypoints'>) => void
  /** Reject callback */
  onReject?: (waypointId: Id<'waypoints'>) => void
  /** Reorder callback */
  onReorder?: (waypointId: Id<'waypoints'>, newOrder: number) => void
  /** Test ID for testing */
  testID?: string
}

/**
 * WaypointList component for displaying and managing waypoints
 * Fetches waypoints from Convex and renders them as cards
 */
export const WaypointList = ({
  routePlanId,
  onApprove,
  onReject,
  onReorder,
  testID,
}: WaypointListProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

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
      <View style={[styles.container, { padding: semantic.space.lg }]} testID={testID}>
        <Text style={[styles.loadingText, { color: semantic.color.onSurface.subtle }]}>
          Loading waypoints...
        </Text>
      </View>
    )
  }

  // Empty state
  if (sortedWaypoints.length === 0) {
    return (
      <View style={[styles.container, { padding: semantic.space.lg }]} testID={testID}>
        <Text style={[styles.emptyText, { color: semantic.color.onSurface.subtle }]}>
          No waypoints for this route
        </Text>
      </View>
    )
  }

  // Render waypoints
  return (
    <View style={styles.container} testID={testID}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
