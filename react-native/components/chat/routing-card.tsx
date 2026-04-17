/**
 * RoutingCard
 *
 * Renders a long-running route-planning operation's live state inline in the
 * chat transcript. Subscribes to the route_plans Convex table reactively and
 * transitions through 5 visual states as the agent plans.
 *
 * Visual states:
 *   pending    → subtle card, "Preparing route…"
 *   running    → SIGNATURE STATE: four phase pills that tick through with a pulse
 *   completed  → morphs into RouteAttachmentCard list
 *   failed     → red-tinted error card
 *   cancelled  → muted "Cancelled" text
 *
 * Layout: left-aligned, matches AgentMessage idiom from chat-transcript.tsx.
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 */

import { useQuery } from 'convex/react'
import React, { useEffect } from 'react'
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { api } from '../../../server/convex/_generated/api'
import type { Id } from '../../../server/convex/_generated/dataModel'
import {
  ROUTE_PLAN_PHASE,
  type RoutePlanPhase,
  type RoutePlanStatus,
} from '../../../server/models/route-plans'
import type { PlannedRouteOptionsView } from '../../../server/types/routes'
import { useSelectedRoute } from '../../contexts/selected-route'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { RouteAttachmentCard } from './route-attachment-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoutingCardProps = {
  message: {
    _id: Id<'session_messages'>
    createdAt: number
    status?: 'streaming' | 'running' | 'complete' | 'failed'
    content: string
  }
  attachments: { type: 'route_options'; routePlanId: Id<'route_plans'> }[]
}

/**
 * Shape returned by api.db.routePlans.getPlanById
 */
type RoutePlanDoc = {
  _id: Id<'route_plans'>
  status: RoutePlanStatus
  phase?: RoutePlanPhase
  statusMessage?: string
  errorMessage?: string
  result?: PlannedRouteOptionsView
}

// ---------------------------------------------------------------------------
// Phase pill definitions
// ---------------------------------------------------------------------------

const PHASES: { key: RoutePlanPhase; label: string }[] = [
  { key: ROUTE_PLAN_PHASE.READING, label: 'Reading' },
  { key: ROUTE_PLAN_PHASE.FINDING, label: 'Finding' },
  { key: ROUTE_PLAN_PHASE.WEATHER, label: 'Weather' },
  { key: ROUTE_PLAN_PHASE.BUILDING, label: 'Building' },
]

// ---------------------------------------------------------------------------
// PhasePill
// ---------------------------------------------------------------------------

interface PhasePillProps {
  label: string
  isActive: boolean
  reduceMotion: boolean
  testID?: string
}

const PhasePill = ({ label, isActive, reduceMotion, testID }: PhasePillProps) => {
  const { semantic } = useSemanticTheme()

  const scale = useSharedValue(1)

  useEffect(() => {
    if (isActive && !reduceMotion) {
      scale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 600 }), withTiming(1.0, { duration: 600 })),
        -1,
        false,
      )
    } else {
      scale.value = withTiming(1.0, { duration: 200 })
    }
  }, [isActive, reduceMotion, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          backgroundColor: isActive
            ? semantic.color.primary.default
            : semantic.color.surfaceVariant.default,
          borderRadius: semantic.radius.full,
          paddingHorizontal: semantic.space.sm,
          paddingVertical: semantic.space.xs,
        },
        animatedStyle,
      ]}
      testID={testID ?? `phase-pill-${label.toLowerCase()}`}
    >
      <Text
        style={[
          semantic.type.label.sm,
          {
            color: isActive ? semantic.color.onPrimary.default : semantic.color.onSurface.muted,
          },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  )
}

// ---------------------------------------------------------------------------
// State-specific inner renderers
// ---------------------------------------------------------------------------

interface PendingCardProps {
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

const PendingCard = ({ semantic }: PendingCardProps) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: semantic.color.surfaceVariant.default,
        borderRadius: semantic.radius.md,
        padding: semantic.space.md,
      },
    ]}
    testID="routing-card-pending"
    accessibilityLiveRegion="polite"
    accessibilityLabel="Preparing route…"
  >
    <Text style={[semantic.type.body.sm, { color: semantic.color.onSurface.muted }]}>
      Preparing route…
    </Text>
  </View>
)

interface RunningCardProps {
  routePlan: RoutePlanDoc
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
  reduceMotion: boolean
}

const RunningCard = ({ routePlan, semantic, reduceMotion }: RunningCardProps) => {
  const activePhase = routePlan.phase ?? null
  const statusText = routePlan.statusMessage ?? 'Planning route…'

  const accessibilityLabel = activePhase ? `Phase: ${activePhase}. ${statusText}` : statusText

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          borderRadius: semantic.radius.md,
          padding: semantic.space.md,
          gap: semantic.space.sm,
        },
      ]}
      testID="routing-card-running"
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Phase pill row */}
      <View style={styles.pillRow}>
        {PHASES.map(({ key, label }) => (
          <PhasePill
            key={key}
            label={label}
            isActive={activePhase === key}
            reduceMotion={reduceMotion}
            testID={`phase-pill-${key}`}
          />
        ))}
      </View>

      {/* Status message below pills */}
      <Text
        style={[semantic.type.body.sm, { color: semantic.color.onSurface.muted }]}
        testID="routing-card-status-message"
      >
        {statusText}
      </Text>
    </View>
  )
}

interface CompletedCardProps {
  result: PlannedRouteOptionsView
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
  routePlanId: Id<'route_plans'>
  onViewOnMap?: () => void
}

const CompletedCard = ({ result, semantic, routePlanId, onViewOnMap }: CompletedCardProps) => {
  const {
    selectedRouteId,
    setSelectedRouteId,
    setDisplayedRoutePlanId,
    requestFitToRouteWithReset,
  } = useSelectedRoute()

  // When no route is selected, default to the first route option
  const defaultSelectedRouteId = selectedRouteId ?? result.options[0]?.routeOptionId ?? null

  return (
    <View
      style={[styles.card, { gap: semantic.space.sm }]}
      testID="routing-card-completed"
      accessibilityLiveRegion="polite"
      accessibilityLabel="Route options ready"
    >
      {result.options.map((option) => (
        <RouteAttachmentCard
          key={option.routeOptionId}
          route={option}
          isSelected={option.routeOptionId === defaultSelectedRouteId}
          onSelect={() => {
            setSelectedRouteId(option.routeOptionId)
            setDisplayedRoutePlanId(routePlanId)
            requestFitToRouteWithReset()
          }}
          onViewOnMap={() => {
            onViewOnMap?.()
          }}
          variant="full"
          testID={`routing-card-route-${option.routeOptionId}`}
        />
      ))}
    </View>
  )
}

interface FailedCardProps {
  routePlan: RoutePlanDoc
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

const FailedCard = ({ routePlan, semantic }: FailedCardProps) => {
  const message = routePlan.errorMessage ?? 'Planning failed.'
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `${semantic.color.danger.default}1A`, // ~10% opacity tint
          borderRadius: semantic.radius.md,
          padding: semantic.space.md,
          borderWidth: 1,
          borderColor: `${semantic.color.danger.default}4D`, // ~30% opacity
        },
      ]}
      testID="routing-card-failed"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Route planning failed: ${message}`}
    >
      <Text style={[semantic.type.body.sm, { color: semantic.color.danger.default }]}>
        {message}
      </Text>
    </View>
  )
}

interface CancelledCardProps {
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

const CancelledCard = ({ semantic }: CancelledCardProps) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: semantic.color.surfaceVariant.default,
        borderRadius: semantic.radius.md,
        padding: semantic.space.md,
      },
    ]}
    testID="routing-card-cancelled"
    accessibilityLiveRegion="polite"
    accessibilityLabel="Route planning cancelled"
  >
    <Text style={[semantic.type.body.sm, { color: semantic.color.onSurface.subtle }]}>
      Cancelled
    </Text>
  </View>
)

// ---------------------------------------------------------------------------
// RoutingCard
// ---------------------------------------------------------------------------

export const RoutingCard = ({
  message: _message,
  attachments,
  onViewOnMap,
}: RoutingCardProps & { onViewOnMap?: () => void }) => {
  const { semantic } = useSemanticTheme()

  // Reduce-motion state: initialise to false, update asynchronously.
  const [reduceMotion, setReduceMotion] = React.useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {
        // If API unavailable, leave false (animations enabled)
      })
  }, [])

  const routePlanId = attachments[0]?.routePlanId

  // Reactive Convex query — passes 'skip' sentinel when there is no planId so
  // the query is dormant. Pattern copied from hooks/use-chat-planning.ts:114-117.
  const routePlan = useQuery(
    api.db.routePlans.getPlanById,
    routePlanId ? { routePlanId } : ('skip' as any),
  ) as RoutePlanDoc | null | undefined

  // While loading or if no planId, show pending state
  const status: RoutePlanStatus = routePlan?.status ?? 'pending'

  const renderInner = () => {
    switch (status) {
      case 'pending':
        return <PendingCard semantic={semantic} />

      case 'running':
        return (
          <RunningCard routePlan={routePlan!} semantic={semantic} reduceMotion={reduceMotion} />
        )

      case 'completed': {
        const result = routePlan?.result
        if (!result) {
          return <PendingCard semantic={semantic} />
        }
        return (
          <CompletedCard
            result={result}
            semantic={semantic}
            routePlanId={routePlanId!}
            onViewOnMap={onViewOnMap}
          />
        )
      }

      case 'failed':
        return <FailedCard routePlan={routePlan!} semantic={semantic} />

      case 'cancelled':
        return <CancelledCard semantic={semantic} />

      default:
        return <PendingCard semantic={semantic} />
    }
  }

  // Key by status so React fully unmounts the old tree (e.g. RunningCard
  // with active Reanimated animations) before mounting the new one. Without
  // this, Fabric's view recycler tries to recycle animated native views that
  // are still "mounted" from Reanimated's perspective, causing the
  // "Attempt to recycle a mounted view" crash.
  return (
    <View key={status} style={[styles.container, { maxWidth: '100%' }]} testID="routing-card">
      {renderInner()}
    </View>
  )
}

RoutingCard.displayName = 'RoutingCard'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    minWidth: '90%',
  },
  card: {
    // borderRadius, padding, backgroundColor provided inline via semantic tokens
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    // borderRadius, padding provided inline via semantic tokens
  },
})
