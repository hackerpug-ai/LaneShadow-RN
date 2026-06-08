/**
 * EnrichmentStatusIndicator
 *
 * Progressive enrichment status indicator for route options.
 * Shows enrichment phase transitions: pending → fast → extended → completed
 *
 * States:
 * - pending: Queued for enrichment
 * - running-fast: Fast enrichment in progress (basic metadata)
 * - running-extended: Extended enrichment in progress (deep analysis)
 * - completed: All enrichment complete
 * - failed: Enrichment failed
 * - cancelled: Enrichment was cancelled
 *
 * Variants:
 * - inline: Compact inline indicator for route cards
 * - standalone: Full-width standalone component
 * - minimal: Minimal badge-only indicator
 */

import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Badge } from '../ui/badge'
import { IconSymbol } from '../ui/icon-symbol'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnrichmentStatus =
  | 'pending'
  | 'running-fast'
  | 'running-extended'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type EnrichmentPhase = 'fast' | 'extended'

export type EnrichmentVariant = 'inline' | 'standalone' | 'minimal'

export interface EnrichmentStatusIndicatorProps {
  /** Current enrichment status */
  status: EnrichmentStatus
  /** Current enrichment phase (for running states) */
  phase?: EnrichmentPhase
  /** Display variant */
  variant?: EnrichmentVariant
  /** Error message (for failed state) */
  error?: string
  /** Tap handler for retry/expand actions */
  onPress?: () => void
  /** Test ID for testing */
  testID?: string
  /** Hide label text (minimal only) */
  hideLabel?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get status label for display
 */
function getStatusLabel(status: EnrichmentStatus, phase?: EnrichmentPhase): string {
  switch (status) {
    case 'pending':
      return 'Enriching...'
    case 'running-fast':
      return 'Quick analysis...'
    case 'running-extended':
      return 'Deep analysis...'
    case 'completed':
      return 'Enriched'
    case 'failed':
      return 'Enrichment failed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Enriching...'
  }
}

/**
 * Get accessibility label for screen readers
 */
function getAccessibilityLabel(status: EnrichmentStatus, phase?: EnrichmentPhase): string {
  const statusLabel = getStatusLabel(status, phase)
  const phaseLabel = phase === 'fast' ? 'quick analysis' : 'deep analysis'

  if (status === 'running-fast' || status === 'running-extended') {
    return `Enrichment in progress: ${phaseLabel}`
  }
  return statusLabel
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EnrichmentStatusIndicator = ({
  status,
  phase = 'fast',
  variant = 'inline',
  error,
  onPress,
  testID,
  hideLabel = false,
}: EnrichmentStatusIndicatorProps): React.ReactNode => {
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
      case 'running-extended':
        return semantic.color.info.default
      default:
        return semantic.color.primary.default
    }
  })()

  const backgroundColor: string = (() => {
    switch (status) {
      case 'completed':
        return `${semantic.color.success.default}15`
      case 'failed':
        return `${semantic.color.danger.default}15`
      case 'cancelled':
        return semantic.color.surfaceVariant.pressed ?? semantic.color.surfaceVariant.default
      case 'running-extended':
        return `${semantic.color.info.default}15`
      default:
        return `${semantic.color.primary.default}15`
    }
  })()

  // -------------------------------------------------------------------------
  // Pulsing animation for running states
  // -------------------------------------------------------------------------
  const pulseOpacity = useSharedValue(1)

  useEffect(() => {
    const isRunning =
      status === 'pending' || status === 'running-fast' || status === 'running-extended'

    if (isRunning) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        false,
      )
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 })
    }
  }, [status, pulseOpacity])

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  // -------------------------------------------------------------------------
  // Status icon
  // -------------------------------------------------------------------------
  const renderIcon = (): React.ReactNode => {
    const isRunning =
      status === 'pending' || status === 'running-fast' || status === 'running-extended'

    if (isRunning) {
      return (
        <ActivityIndicator
          size={variant === 'minimal' ? 'small' : 16}
          color={accentColor}
          animating
          testID={`${testID}-spinner`}
        />
      )
    }

    switch (status) {
      case 'completed':
        return (
          <IconSymbol
            name="check-circle"
            size={variant === 'minimal' ? 14 : 16}
            color={accentColor}
          />
        )
      case 'failed':
        return (
          <IconSymbol
            name="alert-circle"
            size={variant === 'minimal' ? 14 : 16}
            color={accentColor}
          />
        )
      case 'cancelled':
        return (
          <IconSymbol
            name="close-circle"
            size={variant === 'minimal' ? 14 : 16}
            color={accentColor}
          />
        )
      default:
        return null
    }
  }

  // -------------------------------------------------------------------------
  // Phase badge (for running states)
  // -------------------------------------------------------------------------
  const renderPhaseBadge = (): React.ReactNode => {
    const isRunning = status === 'running-fast' || status === 'running-extended'

    if (!isRunning || variant === 'minimal') return null

    return (
      <Badge variant="outline" opacity={0.6} style={{ marginLeft: semantic.space.xs }}>
        {phase === 'fast' ? 'Fast' : 'Extended'}
      </Badge>
    )
  }

  // -------------------------------------------------------------------------
  // Minimal variant - badge only
  // -------------------------------------------------------------------------
  if (variant === 'minimal') {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[
          styles.minimalContainer,
          {
            backgroundColor,
            borderColor: accentColor,
          },
        ]}
        testID={testID}
      >
        <View style={styles.minimalContent}>
          {renderIcon()}
          {!hideLabel && (
            <Text
              style={[
                semantic.type.label.sm,
                { color: accentColor, marginLeft: semantic.space.xs },
              ]}
              testID={`${testID}-label`}
            >
              {getStatusLabel(status, phase)}
            </Text>
          )}
        </View>
      </Animated.View>
    )
  }

  // -------------------------------------------------------------------------
  // Inline variant - compact row
  // -------------------------------------------------------------------------
  if (variant === 'inline') {
    const Container = onPress ? Pressable : View
    const isInteractive = status === 'failed'

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        testID={testID}
      >
        <Container
          onPress={isInteractive ? onPress : undefined}
          disabled={!isInteractive}
          style={[styles.inlineContainer]}
          accessibilityRole={isInteractive ? 'button' : 'text'}
          accessibilityLabel={getAccessibilityLabel(status, phase)}
          accessibilityState={{ disabled: !isInteractive }}
        >
          <Animated.View
            style={[
              styles.inlineInner,
              {
                backgroundColor,
                borderColor: `${accentColor}40`,
              },
              status === 'pending' || status === 'running-fast' || status === 'running-extended'
                ? pulseAnimatedStyle
                : undefined,
            ]}
          >
            <View style={styles.inlineLeft}>
              {renderIcon()}
              <Text
                style={[
                  semantic.type.label.sm,
                  { color: accentColor, marginLeft: semantic.space.xs },
                ]}
                testID={`${testID}-label`}
              >
                {getStatusLabel(status, phase)}
              </Text>
              {renderPhaseBadge()}
            </View>
            {isInteractive && <IconSymbol name="refresh" size={14} color={accentColor} />}
          </Animated.View>
        </Container>
        {status === 'failed' && error && (
          <Text
            style={[
              semantic.type.label.sm,
              { color: semantic.color.danger.default, marginTop: semantic.space.xs },
            ]}
            testID={`${testID}-error`}
          >
            {error}
          </Text>
        )}
      </Animated.View>
    )
  }

  // -------------------------------------------------------------------------
  // Standalone variant - full width with details
  // -------------------------------------------------------------------------
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.standaloneContainer,
        {
          backgroundColor,
          borderColor: `${accentColor}40`,
          borderRadius: semantic.radius.md,
          padding: semantic.space.md,
          ...semantic.elevation[1],
        },
      ]}
      testID={testID}
    >
      <View style={styles.standaloneHeader}>
        <View style={styles.standaloneLeft}>
          {renderIcon()}
          <Text
            style={[
              semantic.type.label.sm,
              { color: accentColor, marginLeft: semantic.space.sm, fontWeight: '600' },
            ]}
            testID={`${testID}-label`}
          >
            {getStatusLabel(status, phase)}
          </Text>
          {renderPhaseBadge()}
        </View>

        {onPress && (status === 'failed' || status === 'cancelled') && (
          <Pressable
            onPress={onPress}
            hitSlop={8}
            style={[styles.retryButton, { marginLeft: semantic.space.sm }]}
            accessibilityRole="button"
            accessibilityLabel="Retry enrichment"
          >
            <IconSymbol name="refresh" size={16} color={accentColor} />
          </Pressable>
        )}
      </View>

      {/* Progress details for running states */}
      {(status === 'running-fast' || status === 'running-extended') && (
        <View style={[styles.standaloneDetails, { marginTop: semantic.space.sm }]}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: `${accentColor}30`,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: accentColor,
                  width: status === 'running-fast' ? '60%' : '85%',
                },
                pulseAnimatedStyle,
              ]}
            />
          </View>
          <Text
            style={[
              semantic.type.label.sm,
              { color: semantic.color.onSurface.muted, marginTop: semantic.space.xs },
            ]}
          >
            {phase === 'fast' ? 'Gathering basic route metadata...' : 'Performing deep analysis...'}
          </Text>
        </View>
      )}

      {/* Error message */}
      {status === 'failed' && error && (
        <Text
          style={[
            semantic.type.label.sm,
            { color: semantic.color.danger.default, marginTop: semantic.space.xs },
          ]}
          testID={`${testID}-error`}
        >
          {error}
        </Text>
      )}
    </Animated.View>
  )
}

EnrichmentStatusIndicator.displayName = 'EnrichmentStatusIndicator'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  minimalContainer: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  minimalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineContainer: {
    alignSelf: 'flex-start',
  },
  inlineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  inlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  standaloneContainer: {
    borderWidth: 1,
    gap: 8,
  },
  standaloneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  standaloneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  standaloneDetails: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
