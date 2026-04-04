/**
 * PlanningStatusTab
 * Compact floating HUD element that shows route planning progress above the map search bar.
 *
 * Rugged, utilitarian aesthetic — reads like a motorcycle instrument panel gauge,
 * not a material design card. High contrast, instantly scannable.
 *
 * States: pending | running | completed | failed | cancelled
 */

import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'
import Animated, {
  FadeOutDown,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanningStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type PlanningStatusTabProps = {
  status: PlanningStatus
  startLabel?: string
  endLabel?: string
  /** Backend progress message e.g. "Checking weather..." */
  statusMessage?: string
  /** Tap when completed — opens results */
  onTapComplete: () => void
  /** Tap when failed — retries planning */
  onTapRetry: () => void
  /** Dismiss button on terminal states */
  onDismiss: () => void
  testID?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the status label shown at the bottom of the center column.
 */
function getStatusText(
  status: PlanningStatus,
  statusMessage: string | undefined
): string {
  switch (status) {
    case 'pending':
      return 'Queued...'
    case 'running':
      return statusMessage ?? 'Planning route...'
    case 'completed':
      return 'Route ready — tap to view'
    case 'failed':
      return 'Planning failed — tap to retry'
    case 'cancelled':
      return 'Cancelled'
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PlanningStatusTab = ({
  status,
  startLabel,
  endLabel,
  statusMessage,
  onTapComplete,
  onTapRetry,
  onDismiss,
  testID,
}: PlanningStatusTabProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // -------------------------------------------------------------------------
  // Derived colors
  // -------------------------------------------------------------------------
  const accentColor: string = (() => {
    switch (status) {
      case 'completed':
        return semantic.color.success.default
      case 'failed':
        return semantic.color.danger.default
      case 'cancelled':
        return semantic.color.onSurface.muted ?? semantic.color.muted.default
      default:
        return semantic.color.primary.default
    }
  })()

  const statusTextColor: string = (() => {
    switch (status) {
      case 'completed':
        return semantic.color.success.default
      case 'failed':
        return semantic.color.danger.default
      case 'cancelled':
        return semantic.color.onSurface.muted ?? semantic.color.muted.default
      default:
        return semantic.color.onSurface.muted ?? semantic.color.muted.default
    }
  })()

  // -------------------------------------------------------------------------
  // Pulsing accent bar for pending state
  // -------------------------------------------------------------------------
  const pulseOpacity = useSharedValue(1)

  useEffect(() => {
    if (status === 'pending') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      )
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 })
    }
  }, [status, pulseOpacity])

  const accentBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  // -------------------------------------------------------------------------
  // Tap handler — only active on actionable terminal states
  // -------------------------------------------------------------------------
  const isTerminal = status === 'completed' || status === 'failed' || status === 'cancelled'

  const handleMainPress = () => {
    if (status === 'completed') onTapComplete()
    if (status === 'failed') onTapRetry()
  }

  // -------------------------------------------------------------------------
  // Right-side status indicator
  // -------------------------------------------------------------------------
  const renderRightIndicator = (): React.ReactNode => {
    switch (status) {
      case 'pending':
      case 'running':
        return (
          <ActivityIndicator
            size={20}
            color={semantic.color.primary.default}
            animating
            testID={`${testID}-spinner`}
          />
        )
      case 'completed':
        return (
          <IconSymbol
            name="check-circle"
            size={22}
            color={semantic.color.success.default}
          />
        )
      case 'failed':
        return (
          <IconSymbol
            name="alert-circle"
            size={22}
            color={semantic.color.danger.default}
          />
        )
      case 'cancelled':
        return null
    }
  }

  // -------------------------------------------------------------------------
  // Route label — "{start} → {end}" or a fallback
  // -------------------------------------------------------------------------
  const routeLabel =
    startLabel && endLabel
      ? `${startLabel} → ${endLabel}`
      : startLabel ?? endLabel ?? 'Planning route'

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18).stiffness(200)}
      exiting={FadeOutDown.duration(200)}
      testID={testID}
      style={[
        styles.wrapper,
        {
          marginHorizontal: semantic.space.md,
          borderRadius: semantic.radius.md,
          backgroundColor: semantic.color.surface.default,
          // Elevation — sits visually above the map
          ...semantic.elevation[3],
        },
      ]}
    >
      <Pressable
        onPress={isTerminal ? handleMainPress : undefined}
        disabled={status === 'pending' || status === 'running' || status === 'cancelled'}
        style={styles.pressable}
        testID={`${testID}-pressable`}
        accessibilityRole={isTerminal ? 'button' : 'progressbar'}
        accessibilityLabel={getStatusText(status, statusMessage)}
      >
        {/* Left accent bar */}
        <Animated.View
          style={[
            styles.accentBar,
            { backgroundColor: accentColor },
            status === 'pending' ? accentBarAnimatedStyle : undefined,
          ]}
          testID={`${testID}-accent-bar`}
        />

        {/* Icon area */}
        <View
          style={[styles.iconArea, { marginLeft: semantic.space.sm }]}
          testID={`${testID}-icon-area`}
        >
          <IconSymbol
            name="motorbike"
            size={20}
            color={accentColor}
          />
        </View>

        {/* Center column */}
        <View
          style={[styles.centerColumn, { marginHorizontal: semantic.space.sm }]}
          testID={`${testID}-center`}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              semantic.type.label.sm,
              styles.routeLabel,
              { color: semantic.color.onSurface.default },
            ]}
            testID={`${testID}-route-label`}
          >
            {routeLabel}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              semantic.type.label.sm,
              { color: statusTextColor },
            ]}
            testID={`${testID}-status-text`}
          >
            {getStatusText(status, statusMessage)}
          </Text>
        </View>

        {/* Right area: spinner / icon + optional dismiss */}
        <View
          style={[styles.rightArea, { marginRight: semantic.space.sm }]}
          testID={`${testID}-right-area`}
        >
          {renderRightIndicator()}

          {isTerminal && (
            <Pressable
              onPress={onDismiss}
              hitSlop={8}
              style={[styles.dismissButton, { marginLeft: semantic.space.sm }]}
              testID={`${testID}-dismiss`}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            >
              <IconSymbol
                name="close"
                size={18}
                color={semantic.color.onSurface.muted ?? semantic.color.onSurface.default}
              />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

PlanningStatusTab.displayName = 'PlanningStatusTab'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    // Height is controlled by the inner row (~64px target)
    overflow: 'hidden',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    // Full height of the row via alignSelf stretch
  },
  iconArea: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
  },
  routeLabel: {
    fontWeight: '700',
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
