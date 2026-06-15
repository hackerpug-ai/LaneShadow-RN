/**
 * ReasoningCard
 *
 * Surfaces the ride-planning agent's internal thinking (thinking_delta stream)
 * inline in the chat transcript as a subtle, muted, collapsible "thought
 * bubble". Reasoning is secondary content — the user's conversation and the
 * agent's answers remain the primary focus.
 *
 * Visual states (per .spec/design/reasoning-card/README.md):
 *   collapsed  → single-row chip: "Thought for 3s", chevron down
 *   streaming  → "Thinking…" with pulsing primary dot
 *   expanded   → header + divider + body reasoning text
 *   completed  → same as collapsed with final duration
 *   error      → "Thought briefly", not expandable if body empty
 *
 * Tonally quieter than RoutingCard.RunningCard — no phase pills, no elevation.
 * Visual language borrowed from RoutingCard.PendingCard (components/chat/routing-card.tsx).
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 */

import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import type { Id } from '../../../server/convex/_generated/dataModel'
import { IconSymbol } from '../../ui/icon-symbol'
import type { CardAttachment } from '../card-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props contract (per design spec section 10). ReasoningCard is pure
 * presentational over this row — the parent transcript already subscribes
 * to `session_messages` and passes the message in.
 *
 * Note: the card-registry passes a narrower shape via CardProps, so we
 * accept that shape and derive stream timestamps from `createdAt` + a
 * locally-captured completion time ref. This keeps the registry contract
 * stable while satisfying the spec's duration-label requirement.
 */
export type ReasoningCardProps = {
  message: {
    _id: Id<'session_messages'>
    createdAt: number
    content: string
    status?: 'streaming' | 'running' | 'complete' | 'failed'
  }
  /** Unused — accepted for CardRegistry conformance. Reasoning rows never
   *  carry attachments in session_messages. */
  attachments?: CardAttachment[]
}

// ---------------------------------------------------------------------------
// Duration helper
// ---------------------------------------------------------------------------

function formatDurationLabel(
  status: ReasoningCardProps['message']['status'],
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
    // Complete but we never captured a live completion timestamp (e.g.
    // message already complete on first render — historical transcript).
    // Fall through to spec default rather than inflate with createdAt.
    return 'Thought briefly'
  }
  const elapsedMs = Math.max(0, completedAt - startedAt)
  if (elapsedMs < 1000) {
    return 'Thought briefly'
  }
  const seconds = Math.round(elapsedMs / 1000)
  return `Thought for ${seconds}s`
}

/**
 * Non-abbreviated duration formatter for screen-reader labels. VoiceOver
 * reads "3s" as "three ess", so the accessibility label needs full words
 * (per design spec §8.3: "Agent reasoning, thought for 3 seconds").
 */
function formatDurationForA11y(
  status: ReasoningCardProps['message']['status'],
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
      testID="reasoning-card-pulsing-dot"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  )
}

// ---------------------------------------------------------------------------
// ReasoningCard
// ---------------------------------------------------------------------------

export const ReasoningCard = ({ message }: ReasoningCardProps) => {
  const { semantic } = useSemanticTheme()

  const [expanded, setExpanded] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Capture completion timestamp locally on first observation of a terminal
  // status. We use a ref + state together so the duration label re-renders
  // when the status transitions streaming → complete.
  const [completedAt, setCompletedAt] = useState<number | null>(null)
  const completedAtRef = useRef<number | null>(null)
  // Track the previous streaming state so we can distinguish a live
  // streaming→complete transition from a message that was already complete
  // on first render (historical transcript). Only live transitions should
  // capture completedAt; otherwise we'd inflate the duration using createdAt
  // minus "now" (potentially minutes or hours later).
  const prevIsStreamingRef = useRef<boolean | null>(null)

  const status = message.status
  const isStreaming = status === 'streaming' || status === 'running'
  const isFailed = status === 'failed'
  const hasBody = message.content.trim().length > 0
  const canExpand = hasBody // Error state with empty body is not expandable

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {
        // API unavailable — leave animations enabled
      })
    // Subscribe to live reduce-motion toggles so users who flip the iOS
    // setting mid-session see the animation behaviour update immediately.
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    // Only capture completedAt on a LIVE streaming → complete transition.
    // On first render, prevIsStreamingRef.current is null, so historical
    // already-complete messages correctly skip this assignment and fall
    // through to the "Thought briefly" default.
    if (prevIsStreamingRef.current === true && !isStreaming && completedAtRef.current === null) {
      const now = Date.now()
      completedAtRef.current = now
      setCompletedAt(now)
    }
    prevIsStreamingRef.current = isStreaming
  }, [isStreaming])

  const handleToggle = () => {
    if (!canExpand) return
    setExpanded((prev) => !prev)
  }

  const durationLabel = formatDurationLabel(status, message.createdAt, completedAt)

  // Accessibility label per design spec §8.3. Uses full words so VoiceOver
  // reads "3 seconds" (not "three ess") and "briefly" for historical or
  // sub-second durations.
  const a11yDuration = formatDurationForA11y(status, message.createdAt, completedAt)
  const accessibilityLabel = isStreaming
    ? 'Agent is thinking'
    : `Agent reasoning, thought for ${a11yDuration}`
  const accessibilityHint = !canExpand
    ? undefined
    : expanded
      ? 'Double tap to collapse'
      : isStreaming
        ? 'Double tap to expand reasoning'
        : 'Double tap to expand'

  // Color computations
  const mutedColor = semantic.color.onSurface.muted ?? semantic.color.onSurface.default
  const surfaceColor = semantic.color.surfaceVariant.default
  // Streaming adds a subtle primary tint overlay (8% alpha) — the '14' hex
  // suffix pattern follows RoutingCard.FailedCard (lines 285-290).
  const streamingOverlay = `${semantic.color.primary.default}14`
  const rippleColor = `${mutedColor}14`
  const dividerColor = `${mutedColor}33` // 20% alpha fallback for outline.subtle

  // Live region is polite ONLY while streaming, to announce "Agent is
  // thinking" on entry without re-announcing on every delta/toggle.
  const liveRegion: 'polite' | 'none' = isStreaming ? 'polite' : 'none'

  return (
    <View style={styles.container} testID="reasoning-card">
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
        accessibilityState={{ expanded, busy: isStreaming }}
        accessibilityLiveRegion={liveRegion}
        testID={
          isStreaming
            ? 'reasoning-card-streaming'
            : isFailed
              ? 'reasoning-card-error'
              : expanded
                ? 'reasoning-card-expanded'
                : 'reasoning-card-collapsed'
        }
      >
        {/* Streaming tint overlay — absolutely positioned so it doesn't
            affect layout, only visual tone */}
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
          <IconSymbol
            name="lightbulb-on-outline"
            size={16}
            color={mutedColor}
            testID="reasoning-card-glyph"
          />
          <Text
            style={[semantic.type.label.md, { color: mutedColor, flex: 1 }]}
            testID="reasoning-card-label"
            numberOfLines={1}
          >
            {durationLabel}
          </Text>
          {isStreaming ? (
            <PulsingDot reduceMotion={reduceMotion} color={semantic.color.primary.default} />
          ) : null}
          {canExpand ? (
            <IconSymbol
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={mutedColor}
              testID="reasoning-card-chevron"
            />
          ) : null}
        </View>

        {/* Body (expanded only) */}
        {expanded && hasBody ? (
          <View
            style={[
              styles.bodyContainer,
              {
                paddingTop: semantic.space.sm,
                marginTop: semantic.space.sm,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: dividerColor,
              },
            ]}
            testID="reasoning-card-body"
          >
            <Text style={[semantic.type.body.sm, { color: mutedColor }]}>{message.content}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}

ReasoningCard.displayName = 'ReasoningCard'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    minWidth: '90%',
  },
  card: {
    // Touch target compliance: 44pt minimum height enforced via padding
    // (paddingVertical: space.sm = 8pt × 2 = 16pt + content ~20pt ≈ 36pt).
    // Ensure minHeight explicitly to hit 44pt even if text wraps short.
    minHeight: 44,
    justifyContent: 'center',
    overflow: 'hidden', // clip the streaming overlay to the rounded corners
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
  bodyContainer: {
    // paddingTop, marginTop, borderTop provided inline via semantic tokens
  },
})
