/**
 * Welcome Screen
 * First screen of the setup wizard — welcomes users and handles download.
 *
 * Two states:
 * 1. Idle — branding + "Setup Your AI Companion" CTA button
 * 2. Downloading — button morphs into a thin progress pill,
 *    center content becomes an auto-advancing feature carousel
 *
 * Design: calm, not jarring. The download is ambient — a thin copper line
 * growing at the bottom while the user reads about what the assistant can do.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'
import { LaneShadowLogo } from '../auth/lane-shadow-logo'
import type { ModelDownloadProgress } from '../../lib/model/download-manager'

// ---------------------------------------------------------------------------
// Feature carousel data
// ---------------------------------------------------------------------------

interface FeatureSlide {
  emoji: string
  title: string
  body: string
}

const FEATURES: FeatureSlide[] = [
  {
    emoji: '🗺️',
    title: 'Describe the ride you want',
    body: 'Say "scenic two-hour loop through the hills" and your Shadow builds the route — no maps to pinch and drag.',
  },
  {
    emoji: '🌤️',
    title: 'Weather-aware planning',
    body: 'Your Shadow checks wind, rain, and temperature for every route so you ride in the best conditions.',
  },
  {
    emoji: '⚡',
    title: 'Works offline',
    body: 'Your AI companion lives on your device. Plan rides anywhere — no cell signal needed.',
  },
  {
    emoji: '🛣️',
    title: 'Discover new roads',
    body: 'Tell your Shadow the vibe — twisty, coastal, straight-and-fast — and it surfaces roads you never knew existed.',
  },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WelcomeScreenProps {
  /** True while model is downloading */
  isDownloading: boolean
  /** Download progress (null until download starts) */
  downloadProgress: ModelDownloadProgress | null
  /** Fired when user taps the CTA button */
  onDownloadPress: () => void
  /** Fired when user taps cancel during download */
  onCancelPress?: () => void
  testID?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isDownloading,
  downloadProgress,
  onDownloadPress,
  onCancelPress,
  testID = 'welcome-screen',
}) => {
  const { semantic } = useSemanticTheme()

  // Carousel state
  const [activeSlide, setActiveSlide] = useState(0)
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animation values
  const slideOpacity = useRef(new Animated.Value(1)).current
  const buttonFade = useRef(new Animated.Value(1)).current
  const progressFade = useRef(new Animated.Value(0)).current

  // Derived progress
  const percent = downloadProgress?.progress ?? 0

  // -----------------------------------------------------------------------
  // Carousel auto-advance
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!isDownloading) {
      setActiveSlide(0)
      return
    }

    carouselTimer.current = setInterval(() => {
      // Fade out → swap → fade in
      Animated.timing(slideOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setActiveSlide((prev) => (prev + 1) % FEATURES.length)
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start()
      })
    }, 4500)

    return () => {
      if (carouselTimer.current) clearInterval(carouselTimer.current)
    }
  }, [isDownloading, slideOpacity])

  // -----------------------------------------------------------------------
  // Button → progress morph
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isDownloading) {
      Animated.parallel([
        Animated.timing(buttonFade, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(progressFade, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(progressFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isDownloading, buttonFade, progressFade])

  // -----------------------------------------------------------------------
  // Carousel dots
  // -----------------------------------------------------------------------
  const renderDots = useCallback(() => {
    return (
      <View style={[styles.dotsContainer, { gap: semantic.space.sm }]}>
        {FEATURES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === activeSlide
                    ? semantic.color.primary.default
                    : semantic.color.onSurface.subtle,
                borderRadius: semantic.radius.full,
              },
            ]}
          />
        ))}
      </View>
    )
  }, [activeSlide, semantic])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const currentFeature = FEATURES[activeSlide]

  return (
    <View
      style={[styles.container, { backgroundColor: semantic.color.background.default }]}
      testID={testID}
    >
      {/* ── Brand Logo ── */}
      <View
        style={[
          styles.logoContainer,
          {
            backgroundColor: semantic.color.primary.default,
            borderRadius: semantic.radius.xl,
            ...semantic.elevation[3],
          },
        ]}
      >
        <LaneShadowLogo size={64} />
      </View>

      {/* ── Welcome Text (visible when idle) ── */}
      <Animated.View
        style={[
          styles.textContainer,
          { gap: semantic.space.md, opacity: isDownloading ? 0 : 1 },
        ]}
        pointerEvents={isDownloading ? 'none' : 'auto'}
      >
        <Text
          variant="headlineLarge"
          style={[
            semantic.type.display.md,
            { color: semantic.color.onSurface.default, textAlign: 'center' },
          ]}
        >
          Welcome to LaneShadow
        </Text>

        <Text
          variant="bodyLarge"
          style={[
            semantic.type.body.md,
            { color: semantic.color.onSurface.muted, textAlign: 'center' },
          ]}
        >
          Your AI-native motorcycle ride planner.{'\n'}Set up your AI Companion to get started.
        </Text>
      </Animated.View>

      {/* ── Feature Carousel (visible when downloading) ── */}
      {isDownloading && (
        <Animated.View
          style={[styles.carouselContainer, { opacity: slideOpacity }]}
          testID={`${testID}-carousel`}
        >
          <Text
            style={[
              styles.featureEmoji,
              { marginBottom: semantic.space.lg },
            ]}
          >
            {currentFeature.emoji}
          </Text>

          <Text
            variant="headlineSmall"
            style={[
              semantic.type.heading.lg,
              {
                color: semantic.color.onSurface.default,
                textAlign: 'center',
                marginBottom: semantic.space.sm,
              },
            ]}
          >
            {currentFeature.title}
          </Text>

          <Text
            variant="bodyLarge"
            style={[
              semantic.type.body.md,
              {
                color: semantic.color.onSurface.muted,
                textAlign: 'center',
                lineHeight: 24,
              },
            ]}
          >
            {currentFeature.body}
          </Text>

          {renderDots()}
        </Animated.View>
      )}

      {/* ── CTA Button (idle state) ── */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { opacity: buttonFade },
          isDownloading && styles.hidden,
        ]}
        pointerEvents={isDownloading ? 'none' : 'auto'}
      >
        <Button
          variant="default"
          size="2xl"
          onPress={onDownloadPress}
          testID={`${testID}-download-button`}
          style={{ width: '100%' }}
        >
          Setup Your AI Companion
        </Button>

        <Text
          variant="bodySmall"
          style={[
            semantic.type.body.sm,
            {
              color: semantic.color.onSurface.subtle,
              textAlign: 'center',
              marginTop: semantic.space.md,
            },
          ]}
        >
          WiFi connection required (~400MB setup)
        </Text>
      </Animated.View>

      {/* ── Thin Progress Pill (downloading state) ── */}
      <Animated.View
        style={[
          styles.progressPillContainer,
          { opacity: progressFade },
          !isDownloading && styles.hidden,
        ]}
        pointerEvents={isDownloading ? 'auto' : 'none'}
        testID={`${testID}-progress-pill`}
      >
        {/* Thin progress track */}
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: semantic.color.secondary.default,
              borderRadius: semantic.radius.full,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${percent}%`,
                backgroundColor: semantic.color.primary.default,
                borderRadius: semantic.radius.full,
              },
            ]}
          />
        </View>

        {/* Subtle label row */}
        <View style={[styles.progressMeta, { marginTop: semantic.space.sm }]}>
          <Text
            variant="bodySmall"
            style={[
              semantic.type.body.sm,
              { color: semantic.color.onSurface.subtle },
            ]}
          >
            Setting up your AI companion
          </Text>

          <Text
            variant="bodySmall"
            style={[
              semantic.type.body.sm,
              { color: semantic.color.primary.default },
            ]}
          >
            {percent}%
          </Text>
        </View>

        {/* Cancel link */}
        {onCancelPress && (
          <View style={{ marginTop: semantic.space.lg }}>
            <Button
              variant="ghost"
              size="sm"
              onPress={onCancelPress}
              testID={`${testID}-cancel-button`}
            >
              Cancel
            </Button>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  textContainer: {
    marginBottom: 48,
    paddingHorizontal: 16,
    maxWidth: 400,
    width: '100%',
  },
  carouselContainer: {
    marginBottom: 48,
    paddingHorizontal: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 24,
  },
  progressPillContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressMeta: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
})
