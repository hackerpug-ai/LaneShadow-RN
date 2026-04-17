/**
 * CreativeLabelFadeIn
 *
 * Fade-in animation for creative route labels.
 * Staggered reveal for multi-line labels with a highlight pulse on first appearance.
 * Smooth transition from skeleton state to final label.
 *
 * Accessibility:
 *   - Screen reader announces label text
 *   - Respects reduce-motion preference (instant reveal)
 *
 * Typography: semantic.type.display.md (45/52/400) for the creative label
 * Animation: 300ms fade-in, 100ms stagger between lines, 500ms highlight pulse
 */

import type React from 'react'
import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { Text } from 'react-native-paper'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreativeLabelFadeInProps {
  /** The creative label text to display */
  label: string
  /** Whether the label is ready (loaded from enrichment) */
  visible: boolean
  /** Optional subtitle or secondary line */
  subtitle?: string
  /** Stagger delay in ms (default 100) */
  staggerDelay?: number
  /** Fade duration in ms (default 300) */
  fadeDuration?: number
  /** Highlight pulse duration in ms (default 500) */
  highlightDuration?: number
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FADE_DURATION_MS = 300
const DEFAULT_STAGGER_DELAY_MS = 100
const DEFAULT_HIGHLIGHT_DURATION_MS = 500

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CreativeLabelFadeIn = ({
  label,
  visible,
  subtitle,
  staggerDelay = DEFAULT_STAGGER_DELAY_MS,
  fadeDuration = DEFAULT_FADE_DURATION_MS,
  highlightDuration = DEFAULT_HIGHLIGHT_DURATION_MS,
  testID,
}: CreativeLabelFadeInProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Track reduce-motion preference
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {})
  }, [])

  // Highlight scale animation: 1.0 -> 1.02 -> 1.0
  const scale = useSharedValue(1)

  useEffect(() => {
    if (visible && !reduceMotion) {
      scale.value = withSequence(
        withTiming(1.02, { duration: highlightDuration / 2 }),
        withTiming(1.0, { duration: highlightDuration / 2 }),
      )
    }
  }, [visible, reduceMotion, highlightDuration, scale])

  const highlightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  if (!visible) return null

  const enterConfig = reduceMotion ? { duration: 0 } : { duration: fadeDuration }

  return (
    <Animated.View
      style={highlightAnimatedStyle}
      accessibilityLabel={`Route name: ${label}`}
      accessibilityRole="header"
      testID={testID ?? 'creative-label'}
    >
      {/* Main label line */}
      <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(enterConfig.duration)}>
        <Text
          style={[
            semantic.type.display.md,
            {
              color: semantic.color.onSurface.default,
            },
          ]}
          testID={`${testID ?? 'creative-label'}-text`}
        >
          {label}
        </Text>
      </Animated.View>

      {/* Optional subtitle with stagger delay */}
      {subtitle && (
        <Animated.View
          entering={
            reduceMotion ? undefined : FadeIn.duration(enterConfig.duration).delay(staggerDelay)
          }
        >
          <Text
            style={[
              semantic.type.body.md,
              {
                color: semantic.color.onSurface.muted ?? semantic.color.onSurface.default,
                marginTop: semantic.space.xs,
              },
            ]}
            testID={`${testID ?? 'creative-label'}-subtitle`}
          >
            {subtitle}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )
}

CreativeLabelFadeIn.displayName = 'CreativeLabelFadeIn'

// Styles are applied inline via semantic tokens for dynamic theming
