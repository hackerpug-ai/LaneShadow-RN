/**
 * PlanningCard
 *
 * Surfaces the ride-planning orchestrator's work (tool calls, agent dispatches)
 * inline in the chat transcript as a compact status row. Shows a rolling status
 * line while planning is in progress, then collapses to a simple completion
 * indicator when done.
 *
 * Visual states:
 *   streaming  → pulsing dot + single-line status text
 *   complete   → checkmark + "Planned for Xs" (static, not interactive)
 *   failed     → X icon + "Planning failed" (static)
 *
 * Follows the same visual language as ReasoningCard:
 * - Same container/padding (semantic.space.sm / semantic.space.md)
 * - Same streaming tint overlay
 * - Route/map pin icon instead of lightbulb
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 */

import { useEffect, useState } from 'react'
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import type { Id } from '../../../../server/convex/_generated/dataModel'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { IconSymbol } from '../../ui/icon-symbol'
import type { CardAttachment } from '../card-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanningCardProps = {
  message: {
    _id: Id<'session_messages'>
    createdAt: number
    content: string
    status?: 'streaming' | 'running' | 'complete' | 'failed'
  }
  /** Accepted for CardRegistry conformance. Planning rows do not carry route
   *  attachments — those are on the subsequent routing_card. */
  attachments?: CardAttachment[]
  /** Unused by PlanningCard — accepted for CardRegistry conformance. */
  onViewOnMap?: () => void
}

// ---------------------------------------------------------------------------
// Content parsing
// ---------------------------------------------------------------------------

type PlanningContent = {
  statusLine: string
  totalDurationMs: number
}

function parsePlanningContent(raw: string): PlanningContent {
  try {
    const parsed = JSON.parse(raw)
    return {
      statusLine: typeof parsed.statusLine === 'string' ? parsed.statusLine : '',
      totalDurationMs: typeof parsed.totalDurationMs === 'number' ? parsed.totalDurationMs : 0,
    }
  } catch {
    return { statusLine: '', totalDurationMs: 0 }
  }
}

// ---------------------------------------------------------------------------
// Duration helper
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  if (ms < 1000) return 'less than a second'
  const seconds = Math.round(ms / 1000)
  return `${seconds}s`
}

// ---------------------------------------------------------------------------
// Pulsing dot (streaming indicator)
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
      testID="planning-card-pulsing-dot"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  )
}

// ---------------------------------------------------------------------------
// PlanningCard
// ---------------------------------------------------------------------------

export const PlanningCard = ({ message }: PlanningCardProps) => {
  const { semantic } = useSemanticTheme()

  const [reduceMotion, setReduceMotion] = useState(false)

  const status = message.status
  const isStreaming = status === 'streaming' || status === 'running'
  const isComplete = status === 'complete'
  const isFailed = status === 'failed'

  const content = parsePlanningContent(message.content)

  // ---------------------------------------------------------------------------
  // Accessibility: reduce-motion support
  // ---------------------------------------------------------------------------

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {
        // API unavailable — leave animations enabled
      })
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => sub.remove()
  }, [])

  // ---------------------------------------------------------------------------
  // Label computation
  // ---------------------------------------------------------------------------

  let label: string
  if (isStreaming) {
    label = content.statusLine.trim().length > 0 ? content.statusLine : 'Planning…'
  } else if (isComplete) {
    const duration = formatDuration(content.totalDurationMs)
    label = `Planned for ${duration}`
  } else {
    // failed or unknown
    label = 'Planning failed'
  }

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  const accessibilityLabel = isStreaming
    ? `Planning: ${label}`
    : isComplete
      ? label
      : 'Planning failed'

  const liveRegion: 'polite' | 'none' = isStreaming ? 'polite' : 'none'

  // ---------------------------------------------------------------------------
  // Colors
  // ---------------------------------------------------------------------------

  const mutedColor = semantic.color.onSurface.muted ?? semantic.color.onSurface.default
  const surfaceColor = semantic.color.surfaceVariant.default
  const streamingOverlay = `${semantic.color.primary.default}14`

  // Icon selection
  const glyphName = isComplete
    ? 'check-circle-outline'
    : isFailed
      ? 'close-circle-outline'
      : 'map-marker-path'

  return (
    <View style={styles.container} testID="planning-card">
      <View
        style={[
          styles.card,
          {
            backgroundColor: surfaceColor,
            borderRadius: semantic.radius.md,
            paddingHorizontal: semantic.space.md,
            paddingVertical: semantic.space.sm,
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ busy: isStreaming }}
        accessibilityLiveRegion={liveRegion}
        testID={
          isStreaming
            ? 'planning-card-streaming'
            : isFailed
              ? 'planning-card-error'
              : 'planning-card-complete'
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

        {/* Header row: glyph | label | pulsing dot? | chevron */}
        <View style={[styles.headerRow, { gap: semantic.space.sm }]}>
          <IconSymbol name={glyphName} size={16} color={mutedColor} testID="planning-card-glyph" />
          <Text
            style={[semantic.type.label.md, { color: mutedColor, flex: 1 }]}
            testID="planning-card-label"
            numberOfLines={1}
          >
            {label}
          </Text>
          {isStreaming ? (
            <PulsingDot reduceMotion={reduceMotion} color={semantic.color.primary.default} />
          ) : null}
        </View>
      </View>
    </View>
  )
}

PlanningCard.displayName = 'PlanningCard'

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
})
