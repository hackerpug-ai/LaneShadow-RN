/**
 * WaypointCard Component
 *
 * Individual waypoint display card with status badges, deviation costs, and approve/reject actions
 * Follows the semantic theme system and design patterns
 */

import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { IconSymbol, type IconName } from '../ui/icon-symbol'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import type { Doc, Id } from '../../convex/_generated/dataModel'

export type WaypointCardProps = {
  /** Waypoint document */
  waypoint: Doc<'waypoints'>
  /** Order index for display */
  order: number
  /** Approve callback */
  onApprove?: (waypointId: Id<'waypoints'>) => void
  /** Reject callback */
  onReject?: (waypointId: Id<'waypoints'>) => void
  /** Reorder callback (only for on-route waypoints) */
  onReorder?: (waypointId: Id<'waypoints'>, newOrder: number) => void
  /** Test ID for testing */
  testID?: string
}

/**
 * Map waypoint status to badge variant
 */
const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
  switch (status) {
    case 'approved':
    case 'applied':
      return 'success'
    case 'rejected':
      return 'default'
    case 'evaluating':
      return 'info'
    case 'ready':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * Map waypoint kind to display properties
 */
const getKindDisplay = (
  kind: 'on_route' | 'off_route'
): { label: string; icon: IconName; color: string } => {
  if (kind === 'on_route') {
    return {
      label: 'On Route',
      icon: 'routes',
      color: '#31A362', // success
    }
  }
  return {
    label: 'Off Route',
    icon: 'map-marker-path',
    color: '#D98E04', // warning
  }
}

/**
 * WaypointCard component for displaying individual waypoints
 * Shows waypoint details with status, kind badges, and action buttons
 */
export const WaypointCard = ({
  waypoint,
  order,
  onApprove,
  onReject,
  onReorder,
  testID,
}: WaypointCardProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const { label: kindLabel, icon: kindIcon, color: kindColor } = getKindDisplay(waypoint.kind)
  const statusVariant = getStatusBadgeVariant(waypoint.status)
  const canReorder = waypoint.kind === 'on_route' && onReorder !== undefined
  const canApprove = waypoint.status === 'ready' || waypoint.status === 'pending'
  const canReject = waypoint.status !== 'approved' && waypoint.status !== 'applied'
  const isRejected = waypoint.status === 'rejected'

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: isRejected ? semantic.color.danger.default : semantic.color.border.default,
        },
        isRejected && styles.cardRejected,
      ]}
      testID={testID}
    >
      {/* Header with kind badge and drag handle */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Badge variant="outline" style={{ marginRight: semantic.space.sm }}>
            <IconSymbol name={kindIcon} size={12} color={kindColor} />
            <Text style={[styles.kindLabel, { color: kindColor }]}>{kindLabel}</Text>
          </Badge>
          <Text style={[styles.orderLabel, { color: semantic.color.onSurface.subtle }]}>
            #{order + 1}
          </Text>
        </View>
        {canReorder && (
          <IconSymbol
            name="drag-horizontal-variant"
            size={20}
            color={semantic.color.onSurface.subtle}
            testID={`${testID}-drag-handle`}
          />
        )}
      </View>

      {/* Waypoint name/description */}
      {waypoint.name && (
        <Text style={[styles.waypointName, { color: semantic.color.onSurface.default }]}>
          {waypoint.name}
        </Text>
      )}
      {waypoint.description && (
        <Text style={[styles.waypointDescription, { color: semantic.color.onSurface.subtle }]}>
          {waypoint.description}
        </Text>
      )}

      {/* Status badge */}
      <View style={styles.statusRow}>
        <Badge variant={statusVariant} testID={`${testID}-status`}>
          {waypoint.status}
        </Badge>
      </View>

      {/* Deviation info for off-route waypoints */}
      {waypoint.kind === 'off_route' && waypoint.detourInfo && (
        <View style={[styles.deviationInfo, { backgroundColor: semantic.color.surface.default }]}>
          <View style={styles.deviationItem}>
            <IconSymbol
              name="map-marker-distance"
              size={14}
              color={semantic.color.onSurface.subtle}
            />
            <Text style={[styles.deviationText, { color: semantic.color.onSurface.subtle }]}>
              +{waypoint.detourInfo.distanceKm.toFixed(1)} km detour
            </Text>
          </View>
          <View style={styles.deviationItem}>
            <IconSymbol name="clock-outline" size={14} color={semantic.color.onSurface.subtle} />
            <Text style={[styles.deviationText, { color: semantic.color.onSurface.subtle }]}>
              +{waypoint.detourInfo.durationMinutes} min
            </Text>
          </View>
        </View>
      )}

      {/* Action buttons for waypoints that need approval */}
      {canApprove && onApprove && (
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => onReject?.(waypoint._id)}
            disabled={!canReject}
            style={styles.actionButton}
            testID={`${testID}-reject`}
          >
            Reject
          </Button>
          <Button
            variant="default"
            size="sm"
            onPress={() => onApprove(waypoint._id)}
            style={styles.actionButton}
            testID={`${testID}-approve`}
          >
            Approve
          </Button>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderStyle: 'solid',
    borderWidth: 1,
  },
  cardRejected: {
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kindLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  waypointName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  waypointDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  deviationInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deviationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
  },
})
