/**
 * ProgressiveEnhancementToast
 *
 * Floating glassmorphic toast showing enrichment progress.
 * Non-blocking overlay that floats above the map.
 * Shows current stage, progress bar, and dismiss button.
 * Auto-dismisses 3s after completion (handled by EnrichmentProgressProvider).
 *
 * Accessibility:
 *   - Screen reader announces stage changes
 *   - Dismiss button has accessibility label
 *   - 44px touch target for dismiss button
 *
 * Reuses glassmorphic overlay pattern from styles/RULES.md section 10
 */

import type React from 'react'
import { useEffect, useState } from 'react'
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressiveEnhancementToastProps {
  /** Whether the toast is visible */
  visible: boolean
  /** Current stage description text */
  stage: string
  /** Progress percentage 0-100 */
  progress: number
  /** Whether enrichment is complete */
  isComplete?: boolean
  /** Whether enrichment has failed */
  isFailed?: boolean
  /** Dismiss handler */
  onDismiss: () => void
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTER_DURATION_MS = 300
const EXIT_DURATION_MS = 300
const PROGRESS_BAR_ANIMATION_MS = 300

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProgressiveEnhancementToast = ({
  visible,
  stage,
  progress,
  isComplete = false,
  isFailed = false,
  onDismiss,
  testID,
}: ProgressiveEnhancementToastProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Track reduce-motion preference
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {})
  }, [])

  // Announce stage changes to screen readers
  useEffect(() => {
    if (visible && stage) {
      AccessibilityInfo.announceForAccessibility(stage)
    }
  }, [visible, stage])

  // Animated progress bar width
  const progressWidth = useSharedValue(0)

  useEffect(() => {
    progressWidth.value = withTiming(Math.max(0, Math.min(100, progress)), {
      duration: PROGRESS_BAR_ANIMATION_MS,
    })
  }, [progress, progressWidth])

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progressWidth.value / 100 }],
  }))

  if (!visible) return null

  const enterConfig = reduceMotion ? { duration: 0 } : { duration: ENTER_DURATION_MS }
  const exitConfig = reduceMotion ? { duration: 0 } : { duration: EXIT_DURATION_MS }

  // Determine status color
  const statusColor = isFailed
    ? semantic.color.danger.default
    : isComplete
      ? (semantic.color.enrichmentExtended?.default ?? semantic.color.success.default)
      : (semantic.color.enrichmentFast?.default ?? semantic.color.primary.default)

  return (
    <Animated.View
      entering={FadeInDown.duration(enterConfig.duration)}
      exiting={FadeOutUp.duration(exitConfig.duration)}
      style={[
        styles.toast,
        {
          backgroundColor: semantic.color.card.default + 'CC', // 80% opacity
          borderColor: semantic.color.primary.default + '4D', // 30% opacity
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
          ...semantic.elevation[3],
        },
      ]}
      accessibilityLabel={`Enhancement progress: ${stage}, ${Math.round(progress)}% complete`}
      accessibilityRole="alert"
      testID={testID ?? 'enhancement-toast'}
    >
      {/* Header row: stage text + dismiss button */}
      <View style={styles.header}>
        <View style={styles.stageRow}>
          {/* Status dot */}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text
            style={[semantic.type.label.md, { color: semantic.color.onSurface.default }]}
            testID={`${testID ?? 'enhancement-toast'}-stage`}
          >
            {stage}
          </Text>
        </View>

        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          style={({ pressed }) => [styles.dismissButton, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Dismiss enhancement toast"
          accessibilityRole="button"
          testID={`${testID ?? 'enhancement-toast'}-dismiss`}
        >
          <IconSymbol
            name="close"
            size={20}
            color={semantic.color.onSurface.muted ?? semantic.color.onSurface.default}
          />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View
        style={[
          styles.progressBar,
          {
            backgroundColor: semantic.color.surfaceVariant.default,
            borderRadius: semantic.radius.sm,
            marginTop: semantic.space.md,
          },
        ]}
        testID={`${testID ?? 'enhancement-toast'}-progress-bar`}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: statusColor,
              borderRadius: semantic.radius.sm,
            },
            progressAnimatedStyle,
          ]}
        />
      </View>

      {/* Percentage text */}
      <Text
        style={[
          semantic.type.label.sm,
          {
            color: semantic.color.onSurface.muted ?? semantic.color.onSurface.default,
            marginTop: semantic.space.xs,
          },
        ]}
        testID={`${testID ?? 'enhancement-toast'}-percentage`}
      >
        {Math.round(progress)}%
      </Text>
    </Animated.View>
  )
}

ProgressiveEnhancementToast.displayName = 'ProgressiveEnhancementToast'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    maxWidth: 400,
    borderWidth: 1,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dismissButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
  },
})
