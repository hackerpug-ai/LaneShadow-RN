/**
 * RationaleReveal
 *
 * Expandable rationale text with fade-in animation.
 * Truncated to 3 lines when collapsed, with "Read more" toggle.
 * Smooth height transition on expand/collapse.
 *
 * Accessibility:
 *   - Screen reader announces rationale content
 *   - Expand/collapse button has accessibility labels
 *   - Respects reduce-motion preference
 *
 * Reuses MarkdownText pattern for rationale rendering.
 * Tokens: onSurface.muted for text, primary.default for links
 */

import React, { useEffect, useState } from 'react'
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RationaleRevealProps {
  /** The rationale text to display */
  text: string
  /** Whether the rationale is ready to show */
  visible: boolean
  /** Maximum lines when collapsed (default 3) */
  maxCollapsedLines?: number
  /** Fade-in duration in ms (default 300) */
  fadeDuration?: number
  /** Height animation duration in ms (default 300) */
  heightDuration?: number
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FADE_DURATION_MS = 300
const DEFAULT_HEIGHT_DURATION_MS = 300
const DEFAULT_MAX_COLLAPSED_LINES = 3

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RationaleReveal = ({
  text,
  visible,
  maxCollapsedLines = DEFAULT_MAX_COLLAPSED_LINES,
  fadeDuration = DEFAULT_FADE_DURATION_MS,
  heightDuration = DEFAULT_HEIGHT_DURATION_MS,
  testID,
}: RationaleRevealProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const [expanded, setExpanded] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [textHeight, setTextHeight] = useState(0)
  const [collapsedHeight, setCollapsedHeight] = useState(0)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {})
  }, [])

  // Animated height
  const animatedHeight = useSharedValue(0)

  useEffect(() => {
    if (expanded && textHeight > 0) {
      animatedHeight.value = withTiming(textHeight, {
        duration: reduceMotion ? 0 : heightDuration,
      })
    } else if (collapsedHeight > 0) {
      animatedHeight.value = withTiming(collapsedHeight, {
        duration: reduceMotion ? 0 : heightDuration,
      })
    }
  }, [expanded, textHeight, collapsedHeight, animatedHeight, reduceMotion, heightDuration])

  const heightAnimatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value || undefined,
    overflow: 'hidden',
  }))

  const toggleExpanded = () => {
    setExpanded((prev) => !prev)
  }

  if (!visible) return null

  const enterConfig = reduceMotion ? { duration: 0 } : { duration: fadeDuration }
  const needsTruncation = textHeight > collapsedHeight && collapsedHeight > 0

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(enterConfig.duration)}
      accessibilityLabel={`Route rationale: ${text}`}
      accessibilityRole="text"
      testID={testID ?? 'rationale-reveal'}
    >
      <Animated.View style={heightAnimatedStyle}>
        <Text
          style={[
            semantic.type.body.md,
            {
              color: semantic.color.onSurface.muted ?? semantic.color.onSurface.default,
            },
          ]}
          numberOfLines={expanded ? undefined : maxCollapsedLines}
          onTextLayout={(event) => {
            // Capture the full text height and the collapsed height
            const totalHeight = event.nativeEvent.lines.reduce(
              (sum, line) => sum + line.height,
              0
            )
            setTextHeight(totalHeight)

            // Calculate collapsed height from the first N lines
            const lines = event.nativeEvent.lines
            if (lines.length > maxCollapsedLines) {
              const collapsed = lines
                .slice(0, maxCollapsedLines)
                .reduce((sum, line) => sum + line.height, 0)
              setCollapsedHeight(collapsed)
            } else {
              setCollapsedHeight(totalHeight)
            }
          }}
          testID={`${testID ?? 'rationale-reveal'}-text`}
        >
          {text}
        </Text>
      </Animated.View>

      {/* Read more / Read less toggle */}
      {needsTruncation && (
        <Pressable
          onPress={toggleExpanded}
          hitSlop={8}
          style={[
            styles.toggle,
            { marginTop: semantic.space.xs },
          ]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less rationale text' : 'Show more rationale text'}
          testID={`${testID ?? 'rationale-reveal'}-toggle`}
        >
          <Text
            style={[
              semantic.type.label.md,
              { color: semantic.color.primary.default },
            ]}
          >
            {expanded ? 'Read less' : 'Read more'}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  )
}

RationaleReveal.displayName = 'RationaleReveal'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  toggle: {
    alignSelf: 'flex-start',
    minHeight: 44, // Touch target
    justifyContent: 'center',
  },
})
