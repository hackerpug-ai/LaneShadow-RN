/**
 * ThinkingCard
 *
 * Surfaces the agent's thinking process (thinkingSteps stream) inline in the
 * chat transcript as a subtle, collapsible chip. While streaming, shows the
 * latest step summary with a pulsing dot. When complete, shows duration with
 * a chevron — tapping opens a bottom sheet with the full thinking timeline.
 *
 * Visual states:
 *   collapsed  → single-row chip: "Thought for 3s", chevron down
 *   streaming  → latest step summary + pulsing primary dot
 *   complete   → same as collapsed with final duration
 *   failed     → "Thought briefly", not expandable if no steps
 *   sheet      → bottom sheet with full timeline, icons, timestamps
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 */

import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import type { Id } from '../../../convex/_generated/dataModel'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import type { ThinkingStep } from '../../../shared/models/session-messages'
import { BottomSheetWrapper } from '../../sheets/bottom-sheet-wrapper'
import type { IconName } from '../../ui/icon-symbol'
import { IconSymbol } from '../../ui/icon-symbol'
import type { CardAttachment } from '../card-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThinkingCardProps = {
  message: {
    _id: Id<'session_messages'>
    createdAt: number
    content: string
    status?: 'streaming' | 'running' | 'complete' | 'failed'
    thinkingSteps?: ThinkingStep[]
  }
  /** Unused — accepted for CardRegistry conformance. Thinking rows never
   *  carry attachments in session_messages. */
  attachments?: CardAttachment[]
}

// ---------------------------------------------------------------------------
// Duration helpers (reused from ReasoningCard)
// ---------------------------------------------------------------------------

function formatDurationLabel(
  status: ThinkingCardProps['message']['status'],
  startedAt: number,
  completedAt: number | null,
): string {
  if (status === 'streaming' || status === 'running') {
    return 'Thinking…'
  }
  if (status === 'failed') {
    return 'Thought briefly'
  }
  if (completedAt === null) {
    return 'Thought briefly'
  }
  const elapsedMs = Math.max(0, completedAt - startedAt)
  if (elapsedMs < 1000) {
    return 'Thought briefly'
  }
  const seconds = Math.round(elapsedMs / 1000)
  return `Thought for ${seconds}s`
}

function formatDurationForA11y(
  status: ThinkingCardProps['message']['status'],
  startedAt: number,
  completedAt: number | null,
): string {
  if (status === 'failed') return 'briefly'
  if (completedAt === null) return 'briefly'
  const elapsedMs = Math.max(0, completedAt - startedAt)
  if (elapsedMs < 1000) return 'briefly'
  const seconds = Math.round(elapsedMs / 1000)
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`
}

// ---------------------------------------------------------------------------
// Pulsing dot (streaming indicator) - duplicated from ReasoningCard
// ---------------------------------------------------------------------------

interface PulsingDotProps {
  reduceMotion: boolean
  color: string
}

const PulsingDot = ({ reduceMotion, color }: PulsingDotProps) => {
  const opacity = useSharedValue(reduceMotion ? 0.7 : 0.4)

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.7
      return
    }
    opacity.value = withRepeat(
      withSequence(withTiming(1.0, { duration: 600 }), withTiming(0.4, { duration: 600 })),
      -1,
      false,
    )
  }, [reduceMotion, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[styles.pulsingDot, { backgroundColor: color }, animatedStyle]}
      testID="thinking-card-pulsing-dot"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  )
}

// ---------------------------------------------------------------------------
// Step row component (for timeline)
// ---------------------------------------------------------------------------

interface StepRowProps {
  step: ThinkingStep
  isFirst: boolean
  isLast: boolean
  baseTimestamp: number
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

const StepRow = ({ step, isFirst, isLast, baseTimestamp, semantic }: StepRowProps) => {
  // Icon mapping per spec
  const getIconName = (): IconName => {
    switch (step.type) {
      case 'thinking':
        return 'lightbulb-on-outline'
      case 'tool_start':
        return 'magnify'
      case 'tool_finish':
        return 'check-circle-outline'
      default:
        return 'circle-outline'
    }
  }

  const getIconColor = (): string => {
    switch (step.type) {
      case 'thinking':
        return semantic.color.onSurface.muted ?? semantic.color.onSurface.default
      case 'tool_start':
        return semantic.color.primary.default
      case 'tool_finish':
        return semantic.color.success.default
      default:
        return semantic.color.onSurface.muted ?? semantic.color.onSurface.default
    }
  }

  // Relative timestamp
  const elapsedMs = step.timestamp - baseTimestamp
  const timestampLabel =
    elapsedMs < 1000 ? `${Math.round(elapsedMs)}ms` : `${Math.round(elapsedMs / 1000)}s`

  const iconColor = getIconColor()
  const mutedColor = semantic.color.onSurface.muted ?? semantic.color.onSurface.default
  const dividerColor = `${mutedColor}33`

  // Accessibility label
  const accessibilityLabel = `${step.type === 'thinking' ? 'Thought' : step.type === 'tool_start' ? 'Tool start' : 'Tool finish'}: ${step.summary}${step.toolName ? `, using ${step.toolName}` : ''}`

  return (
    <View
      style={[styles.stepRow, { gap: semantic.space.md }]}
      testID={`thinking-step-${step.timestamp}`}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Icon column */}
      <View style={styles.iconColumn}>
        <IconSymbol name={getIconName()} size={20} color={iconColor} />
        {/* Timeline connector - only show if not last step */}
        {!isLast ? (
          <View style={[styles.timelineConnector, { backgroundColor: dividerColor }]} />
        ) : null}
      </View>

      {/* Content column */}
      <View style={[styles.contentColumn, { gap: semantic.space.xs }]}>
        {/* Summary line - bold tool name if present */}
        <Text
          style={[semantic.type.body.md, { color: semantic.color.onSurface.default }]}
          numberOfLines={2}
        >
          {step.toolName && step.type === 'tool_start' ? (
            <>
              <Text style={{ fontWeight: '600' }}>{step.toolName}</Text>
              {' — '}
              {step.summary}
            </>
          ) : (
            step.summary
          )}
        </Text>

        {/* Detail line (optional) */}
        {step.detail ? (
          <Text style={[semantic.type.body.sm, { color: mutedColor }]} numberOfLines={3}>
            {step.detail}
          </Text>
        ) : null}

        {/* Timestamp */}
        <Text style={[semantic.type.label.sm, { color: mutedColor }]}>{timestampLabel}</Text>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// ThinkingCard
// ---------------------------------------------------------------------------

export const ThinkingCard = ({ message }: ThinkingCardProps) => {
  const { semantic } = useSemanticTheme()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Capture completion timestamp locally on first observation of terminal status
  const [completedAt, setCompletedAt] = useState<number | null>(null)
  const completedAtRef = useRef<number | null>(null)
  const prevIsStreamingRef = useRef<boolean | null>(null)

  const status = message.status
  const isStreaming = status === 'streaming' || status === 'running'
  const isFailed = status === 'failed'
  const steps = message.thinkingSteps ?? []
  const hasSteps = steps.length > 0
  const canExpand = hasSteps && !isStreaming

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {
        // API unavailable — leave animations enabled
      })
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    // Only capture completedAt on a LIVE streaming → complete transition
    if (prevIsStreamingRef.current === true && !isStreaming && completedAtRef.current === null) {
      const now = Date.now()
      completedAtRef.current = now
      setCompletedAt(now)
    }
    prevIsStreamingRef.current = isStreaming
  }, [isStreaming])

  // Chip summary logic per spec
  const getChipSummary = (): string => {
    if (isStreaming) {
      const lastStep = steps[steps.length - 1]
      return lastStep?.summary ?? 'Thinking...'
    }
    return formatDurationLabel(status, message.createdAt, completedAt)
  }

  const chipSummary = getChipSummary()
  const truncatedSummary =
    chipSummary.length > 120 ? `${chipSummary.slice(0, 117)}...` : chipSummary

  const handleToggle = () => {
    if (!canExpand) return
    setSheetOpen(true)
  }

  // Accessibility
  const a11yDuration = formatDurationForA11y(status, message.createdAt, completedAt)
  const accessibilityLabel = isStreaming
    ? `Agent is thinking: ${chipSummary}`
    : canExpand
      ? `Agent thought for ${a11yDuration}. Double tap to see full thinking process.`
      : `Agent thought for ${a11yDuration}`

  const accessibilityHint = canExpand ? 'Double tap to expand' : undefined

  // Color computations
  const mutedColor = semantic.color.onSurface.muted ?? semantic.color.onSurface.default
  const surfaceColor = semantic.color.surfaceVariant.default
  const streamingOverlay = `${semantic.color.primary.default}14`
  const rippleColor = `${mutedColor}14`

  // Live region is polite ONLY while streaming
  const liveRegion: 'polite' | 'none' = isStreaming ? 'polite' : 'none'

  // Base timestamp for relative times (first step or message createdAt)
  const baseTimestamp = steps.length > 0 ? steps[0].timestamp : message.createdAt

  return (
    <>
      <View style={styles.container} testID="thinking-card">
        <Pressable
          onPress={handleToggle}
          disabled={!canExpand}
          android_ripple={{ color: rippleColor }}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: surfaceColor,
              borderRadius: semantic.radius.md,
              paddingHorizontal: semantic.space.md,
              paddingVertical: semantic.space.sm,
              opacity: pressed && canExpand ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ expanded: sheetOpen, busy: isStreaming }}
          accessibilityLiveRegion={liveRegion}
          testID={
            isStreaming
              ? 'thinking-card-streaming'
              : isFailed
                ? 'thinking-card-error'
                : 'thinking-card-collapsed'
          }
        >
          {/* Streaming tint overlay */}
          {isStreaming ? (
            <View
              pointerEvents="none"
              style={[
                styles.streamingOverlay,
                {
                  backgroundColor: streamingOverlay,
                  borderRadius: semantic.radius.md,
                },
              ]}
            />
          ) : null}

          {/* Header row: glyph | summary | pulsing dot? | chevron */}
          <View style={[styles.headerRow, { gap: semantic.space.sm }]}>
            <IconSymbol
              name="lightbulb-on-outline"
              size={16}
              color={mutedColor}
              testID="thinking-card-glyph"
            />
            <Text
              style={[semantic.type.label.md, { color: mutedColor, flex: 1 }]}
              testID="thinking-card-label"
              numberOfLines={1}
            >
              {truncatedSummary}
            </Text>
            {isStreaming ? (
              <PulsingDot reduceMotion={reduceMotion} color={semantic.color.primary.default} />
            ) : null}
            {canExpand ? (
              <IconSymbol
                name="chevron-down"
                size={16}
                color={mutedColor}
                testID="thinking-card-chevron"
              />
            ) : null}
          </View>
        </Pressable>
      </View>

      {/* Bottom Sheet */}
      <BottomSheetWrapper
        isVisible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        preset="full"
        testID="thinking-card-sheet"
      >
        {/* Sheet Header */}
        <View style={[styles.sheetHeader, { gap: semantic.space.sm }]}>
          <View style={[styles.sheetTitleRow, { gap: semantic.space.sm }]}>
            <IconSymbol
              name="lightbulb-on-outline"
              size={20}
              color={semantic.color.onSurface.default}
            />
            <Text style={[semantic.type.heading.lg, { color: semantic.color.onSurface.default }]}>
              Agent Thinking
            </Text>
          </View>

          {/* Duration badge */}
          <View
            style={[
              styles.durationBadge,
              {
                backgroundColor: semantic.color.surfaceVariant.default,
                borderRadius: semantic.radius.sm,
                paddingHorizontal: semantic.space.sm,
                paddingVertical: semantic.space.xs,
              },
            ]}
          >
            <Text style={[semantic.type.label.md, { color: mutedColor }]}>
              {formatDurationLabel(status, message.createdAt, completedAt)}
            </Text>
          </View>
        </View>

        {/* Steps Timeline */}
        <ScrollView
          style={styles.timelineContainer}
          contentContainerStyle={[styles.timelineContent, { gap: semantic.space.lg }]}
          testID="thinking-card-timeline"
        >
          {steps.map((step, index) => (
            <StepRow
              key={step.timestamp}
              step={step}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
              baseTimestamp={baseTimestamp}
              semantic={semantic}
            />
          ))}

          {/* Empty state */}
          {steps.length === 0 ? (
            <Text style={[semantic.type.body.md, { color: mutedColor, textAlign: 'center' }]}>
              No thinking steps recorded
            </Text>
          ) : null}
        </ScrollView>
      </BottomSheetWrapper>
    </>
  )
}

ThinkingCard.displayName = 'ThinkingCard'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    minWidth: '90%',
  },
  card: {
    minHeight: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  streamingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sheetHeader: {
    alignItems: 'center',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    alignSelf: 'center',
  },
  timelineContainer: {
    flex: 1,
  },
  timelineContent: {
    paddingTop: 12, // semantic.space.md
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconColumn: {
    alignItems: 'center',
    width: 24,
  },
  timelineConnector: {
    width: 1,
    flex: 1,
    marginTop: 4, // semantic.space.xs
    minHeight: 20,
  },
  contentColumn: {
    flex: 1,
  },
})
