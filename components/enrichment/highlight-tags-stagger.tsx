/**
 * HighlightTagsStagger
 *
 * Staggered fade-in animation for highlight tags.
 * Each tag fades in with a configurable delay (default 100ms).
 * Tags use a chip/pill style with optional emoji icons.
 * Wraps to multiple lines using flex-wrap.
 *
 * Accessibility:
 *   - Each tag has accessibility label
 *   - Respects reduce-motion preference (instant reveal)
 *
 * Reuses Chip pattern from components/ui/chip.tsx
 * Tokens: primary.default with 10%/30% opacity backgrounds/borders
 */

import React, { useEffect, useState } from 'react'
import { AccessibilityInfo, StyleSheet, View } from 'react-native'
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

export interface HighlightTag {
  /** Display text for the tag */
  label: string
  /** Optional emoji or icon character */
  icon?: string
}

export interface HighlightTagsStaggerProps {
  /** Array of highlight tags to display */
  highlights: HighlightTag[]
  /** Whether the tags are ready to show */
  visible: boolean
  /** Stagger delay between each tag in ms (default 100) */
  staggerDelay?: number
  /** Fade-in duration per tag in ms (default 300) */
  fadeDuration?: number
  /** Scale pop animation duration in ms (default 300) */
  scaleDuration?: number
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_STAGGER_DELAY_MS = 100
const DEFAULT_FADE_DURATION_MS = 300
const DEFAULT_SCALE_DURATION_MS = 300

// ---------------------------------------------------------------------------
// Sub-component: Single tag with entrance animation
// ---------------------------------------------------------------------------

interface TagItemProps {
  tag: HighlightTag
  delay: number
  fadeDuration: number
  scaleDuration: number
  reduceMotion: boolean
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
  testID: string
}

const TagItem = ({
  tag,
  delay,
  fadeDuration,
  scaleDuration,
  reduceMotion,
  semantic,
  testID,
}: TagItemProps): React.ReactNode => {
  // Scale animation: 0.95 -> 1.0 (subtle pop)
  const scale = useSharedValue(reduceMotion ? 1 : 0.95)

  useEffect(() => {
    if (!reduceMotion) {
      const timer = setTimeout(() => {
        scale.value = withTiming(1, { duration: scaleDuration })
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [delay, reduceMotion, scaleDuration, scale])

  const scaleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const enterConfig = reduceMotion
    ? { duration: 0 }
    : { duration: fadeDuration }

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(enterConfig.duration).delay(delay)}
      style={[
        scaleAnimatedStyle,
        styles.tag,
        {
          backgroundColor: semantic.color.primary.default + '1A', // 10% opacity
          borderColor: semantic.color.primary.default + '4D', // 30% opacity
          borderRadius: semantic.radius.full,
          paddingHorizontal: semantic.space.md,
          paddingVertical: semantic.space.xs,
        },
      ]}
      accessibilityLabel={tag.label}
      accessibilityRole="text"
      testID={testID}
    >
      {tag.icon && (
        <Text style={styles.tagIcon}>
          {tag.icon}
        </Text>
      )}
      <Text
        style={[
          semantic.type.label.md,
          { color: semantic.color.primary.default },
        ]}
      >
        {tag.label}
      </Text>
    </Animated.View>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const HighlightTagsStagger = ({
  highlights,
  visible,
  staggerDelay = DEFAULT_STAGGER_DELAY_MS,
  fadeDuration = DEFAULT_FADE_DURATION_MS,
  scaleDuration = DEFAULT_SCALE_DURATION_MS,
  testID,
}: HighlightTagsStaggerProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {})
  }, [])

  if (!visible || highlights.length === 0) return null

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${highlights.length} route highlights`}
      testID={testID ?? 'highlight-tags'}
    >
      {highlights.map((tag, index) => (
        <TagItem
          key={`${tag.label}-${index}`}
          tag={tag}
          delay={index * staggerDelay}
          fadeDuration={fadeDuration}
          scaleDuration={scaleDuration}
          reduceMotion={reduceMotion}
          semantic={semantic}
          testID={`${testID ?? 'highlight-tags'}-${index}`}
        />
      ))}
    </View>
  )
}

HighlightTagsStagger.displayName = 'HighlightTagsStagger'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  tagIcon: {
    fontSize: 14,
  },
})
