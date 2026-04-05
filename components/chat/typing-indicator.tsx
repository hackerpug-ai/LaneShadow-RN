/**
 * TypingIndicator
 *
 * Three animated dots shown inline in the chat transcript when an assistant
 * text message has `status === 'streaming'`. Each dot scales in a staggered
 * cycle to create a "typing…" feel.
 *
 * Visual spec:
 *   sm variant: dot diameter 4px, gap 3px (default – fits inline with body text)
 *   md variant: dot diameter 6px, gap 4px
 *   Each dot: scale 0.6 → 1.0 → 0.6, 900 ms loop, staggered 150 ms per dot
 *
 * Accessibility:
 *   - Respects reduce-motion: renders 3 static dots at scale 1.0
 *   - accessibilityRole="progressbar"
 *   - accessibilityLabel="Assistant is typing"
 *
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 * Following ZUSTAND-RULES.md: n/a (no store usage).
 */

import React, { useEffect } from 'react'
import { View, StyleSheet, AccessibilityInfo } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TypingIndicatorProps = {
  /** Size variant - defaults to 'sm' to fit inline with body text */
  size?: 'sm' | 'md'
  /** Optional color override; defaults to semantic.color.onSurface.subtle */
  color?: string
}

// ---------------------------------------------------------------------------
// Size constants
// ---------------------------------------------------------------------------

const SIZE_CONFIG = {
  sm: { diameter: 4, gap: 3 },
  md: { diameter: 6, gap: 4 },
} as const

// Animation constants
const ANIMATION_DURATION_MS = 300 // half-period of one scale cycle
const LOOP_DELAY_MS = 300 // pause at bottom of cycle before repeating
const STAGGER_MS = 150
const SCALE_MIN = 0.6
const SCALE_MAX = 1.0

// ---------------------------------------------------------------------------
// Dot
// ---------------------------------------------------------------------------

interface DotProps {
  diameter: number
  color: string
  delayMs: number
  reduceMotion: boolean
  testID?: string
}

const Dot = ({ diameter, color, delayMs, reduceMotion, testID }: DotProps) => {
  const scale = useSharedValue(SCALE_MAX)

  useEffect(() => {
    if (reduceMotion) {
      scale.value = SCALE_MAX
      return
    }

    // Stagger: delay start of each dot's animation cycle
    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(SCALE_MIN, { duration: ANIMATION_DURATION_MS }),
          withTiming(SCALE_MAX, { duration: ANIMATION_DURATION_MS }),
          // Pause at max scale so the full cycle is ~900 ms per dot
          withTiming(SCALE_MAX, { duration: LOOP_DELAY_MS })
        ),
        -1,
        false
      )
    )
  }, [reduceMotion, scale, delayMs])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  )
}

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------

export const TypingIndicator = ({ size = 'sm', color }: TypingIndicatorProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const resolvedColor = color ?? semantic.color.onSurface.subtle ?? semantic.color.onSurface.default

  const { diameter, gap } = SIZE_CONFIG[size]

  // Reduce-motion state: initialise to false, update asynchronously.
  const [reduceMotion, setReduceMotion] = React.useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {
        // If the API is unavailable, leave false (animations enabled).
      })
  }, [])

  return (
    <View
      style={[styles.container, { gap }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Assistant is typing"
      testID="typing-indicator"
    >
      <Dot
        diameter={diameter}
        color={resolvedColor}
        delayMs={0}
        reduceMotion={reduceMotion}
        testID="typing-indicator-dot-0"
      />
      <Dot
        diameter={diameter}
        color={resolvedColor}
        delayMs={STAGGER_MS}
        reduceMotion={reduceMotion}
        testID="typing-indicator-dot-1"
      />
      <Dot
        diameter={diameter}
        color={resolvedColor}
        delayMs={STAGGER_MS * 2}
        reduceMotion={reduceMotion}
        testID="typing-indicator-dot-2"
      />
    </View>
  )
}

TypingIndicator.displayName = 'TypingIndicator'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
