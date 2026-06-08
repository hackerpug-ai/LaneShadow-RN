/**
 * WaypointCard Component
 *
 * Individual waypoint display card with status badges, deviation costs, and approve/reject actions
 * Follows the semantic theme system and design patterns
 */

import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { Doc, Id } from '../../server/convex/_generated/dataModel'
import type { ExtendedTheme, SemanticTheme } from '../../styles/types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { type IconName, IconSymbol } from '../ui/icon-symbol'

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
  kind: 'on_route' | 'off_route',
  semantic: SemanticTheme,
): { label: string; icon: IconName; color: string } => {
  if (kind === 'on_route') {
    return {
      label: 'On Route',
      icon: 'routes',
      color: semantic.color.waypointOnRoute?.default ?? 'transparent',
    }
  }
  return {
    label: 'Off Route',
    icon: 'map-marker-path',
    color: semantic.color.waypointOffRoute?.default ?? 'transparent',
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

  const {
    label: kindLabel,
    icon: kindIcon,
    color: kindColor,
  } = getKindDisplay(waypoint.kind, semantic)
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
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
          marginBottom: semantic.space.md,
        },
        isRejected && styles.cardRejected,
      ]}
      testID={testID}
    >
      {/* Header with kind badge and drag handle */}
      <View
        style={[
          styles.cardHeader,
          {
            marginBottom: semantic.space.md,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Badge variant="outline" style={{ marginRight: semantic.space.sm }}>
            <IconSymbol name={kindIcon} size={12} color={kindColor} />
            <Text style={[styles.kindLabel, { color: kindColor, marginLeft: semantic.space.xs }]}>
              {kindLabel}
            </Text>
          </Badge>
          <Text
            style={[
              styles.orderLabel,
              { color: semantic.color.onSurface.subtle, marginLeft: semantic.space.sm },
            ]}
          >
            #{order + 1}
          </Text>
        </View>
        {canReorder && (
          <IconSymbol
            name="drag-horizontal-variant"
            size={20}
            color={semantic.color.onSurface.subtle ?? 'transparent'}
            testID={`${testID}-drag-handle`}
          />
        )}
      </View>

      {/* Waypoint name/description */}
      {waypoint.name && (
        <Text
          style={[
            styles.waypointName,
            { color: semantic.color.onSurface.default, marginBottom: semantic.space.xs },
          ]}
        >
          {waypoint.name}
        </Text>
      )}
      {waypoint.description && (
        <Text
          style={[
            styles.waypointDescription,
            { color: semantic.color.onSurface.subtle, marginBottom: semantic.space.md },
          ]}
        >
          {waypoint.description}
        </Text>
      )}

      {/* Status badge */}
      <View
        style={[
          styles.statusRow,
          {
            marginBottom:
              waypoint.kind === 'off_route' && waypoint.detourInfo ? semantic.space.md : 0,
          },
        ]}
      >
        <Badge variant={statusVariant} testID={`${testID}-status`}>
          {waypoint.status}
        </Badge>
      </View>

      {/* Deviation info for off-route waypoints */}
      {waypoint.kind === 'off_route' && waypoint.detourInfo && (
        <View
          style={[
            styles.deviationInfo,
            {
              backgroundColor: semantic.color.surface.default,
              marginBottom: semantic.space.md,
              paddingVertical: semantic.space.sm,
              paddingHorizontal: semantic.space.md,
              borderRadius: semantic.radius.md,
              gap: semantic.space.md,
            },
          ]}
        >
          <View
            style={[
              styles.deviationItem,
              {
                gap: semantic.space.xs,
              },
            ]}
          >
            <IconSymbol
              name="map-marker-distance"
              size={14}
              color={semantic.color.onSurface.subtle ?? 'transparent'}
            />
            <Text style={[styles.deviationText, { color: semantic.color.onSurface.subtle }]}>
              +{waypoint.detourInfo.distanceKm.toFixed(1)} km detour
            </Text>
          </View>
          <View
            style={[
              styles.deviationItem,
              {
                gap: semantic.space.xs,
              },
            ]}
          >
            <IconSymbol
              name="clock-outline"
              size={14}
              color={semantic.color.onSurface.subtle ?? 'transparent'}
            />
            <Text style={[styles.deviationText, { color: semantic.color.onSurface.subtle }]}>
              +{waypoint.detourInfo.durationMinutes} min
            </Text>
          </View>
        </View>
      )}

      {/* Action buttons for waypoints that need approval */}
      {/* Show buttons when there's actionable state OR when both callbacks provided (for disabled state display) */}
      {(canApprove || canReject || (onApprove && onReject)) && (
        <View
          style={[
            styles.actionButtons,
            {
              gap: semantic.space.sm,
              marginTop: semantic.space.xs,
            },
          ]}
        >
          {/* Reject button: show when onReject is provided OR when onApprove is provided (as a pair) */}
          {(onReject || onApprove) && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => onReject?.(waypoint._id)}
              disabled={!onReject || !canReject}
              style={styles.actionButton}
              testID={`${testID}-reject`}
            >
              Reject
            </Button>
          )}
          {/* Approve button: show when onApprove is provided */}
          {onApprove && (
            <Button
              variant="default"
              size="sm"
              onPress={() => onApprove(waypoint._id)}
              disabled={!canApprove}
              style={styles.actionButton}
              testID={`${testID}-approve`}
            >
              Approve
            </Button>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kindLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  waypointName: {
    fontSize: 16,
    fontWeight: '600',
  },
  waypointDescription: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
  },
  deviationInfo: {
    flexDirection: 'row',
  },
  deviationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
})
