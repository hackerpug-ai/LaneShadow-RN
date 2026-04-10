/**
 * Welcome Screen
 * First screen of the setup wizard — welcomes users and handles download.
 *
 * Two states:
 * 1. Idle — branding + "Setup Your AI Companion" CTA button
 * 2. Downloading — button area morphs into a thin progress pill,
 *    center content becomes an auto-advancing feature carousel
 *
 * Design: calm, not jarring. The download is ambient — a thin copper line
 * growing at the bottom while the user reads about what the assistant can do.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const insets = useSafeAreaInsets()

  // Carousel state
  const [activeSlide, setActiveSlide] = useState(0)
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animation values
  const slideOpacity = useRef(new Animated.Value(1)).current
  const buttonOpacity = useRef(new Animated.Value(1)).current
  const progressOpacity = useRef(new Animated.Value(0)).current

  // Derived progress — clamp to 0-100
  const percent = Math.max(0, Math.min(100, downloadProgress?.progress ?? 0))

  // -----------------------------------------------------------------------
  // Carousel auto-advance
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!isDownloading) {
      setActiveSlide(0)
      return
    }

    carouselTimer.current = setInterval(() => {
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
  // Button ↔ progress cross-fade
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isDownloading) {
      Animated.sequence([
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(progressOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.sequence([
        Animated.timing(progressOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isDownloading, buttonOpacity, progressOpacity])

  // -----------------------------------------------------------------------
  // Carousel dots
  // -----------------------------------------------------------------------
  const renderDots = useCallback(() => (
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
  ), [activeSlide, semantic])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const currentFeature = FEATURES[activeSlide]

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.background.default,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 40),
        },
      ]}
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

      {/* ── Content area: welcome text OR feature carousel ── */}
      <View style={styles.contentArea}>
        {/* Welcome text (fades out during download) */}
        <Animated.View
          style={[styles.contentFill, { opacity: isDownloading ? 0 : 1 }]}
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
              { color: semantic.color.onSurface.muted, textAlign: 'center', marginTop: semantic.space.md },
            ]}
          >
            Your AI-native motorcycle ride planner.{'\n'}Set up your AI Companion to get started.
          </Text>
        </Animated.View>

        {/* Feature carousel (visible during download) */}
        {isDownloading && (
          <Animated.View
            style={[styles.contentFill, styles.carouselInner, { opacity: slideOpacity }]}
            testID={`${testID}-carousel`}
          >
            <Text style={[styles.featureEmoji, { marginBottom: semantic.space.lg }]}>
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
      </View>

      {/* ── Bottom action area: button OR progress pill (cross-fade in place) ── */}
      <View style={styles.actionArea}>
        {/* CTA Button */}
        <Animated.View
          style={[styles.actionFill, { opacity: buttonOpacity }]}
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

        {/* Progress pill */}
        <Animated.View
          style={[styles.actionFill, { opacity: progressOpacity }]}
          pointerEvents={isDownloading ? 'auto' : 'none'}
          testID={`${testID}-progress-pill`}
        >
          {/* Progress track */}
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

          {/* Label row */}
          <View style={[styles.progressMeta, { marginTop: semantic.space.sm }]}>
            <Text
              variant="bodySmall"
              style={[semantic.type.body.sm, { color: semantic.color.onSurface.subtle }]}
            >
              Setting up your AI companion
            </Text>

            <Text
              variant="bodySmall"
              style={[semantic.type.body.sm, { color: semantic.color.primary.default }]}
            >
              {percent}%
            </Text>
          </View>

          {/* Cancel */}
          {onCancelPress && (
            <View style={{ marginTop: semantic.space.lg, alignItems: 'center' }}>
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
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Middle content area — fills available space, centers its children
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  contentFill: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  carouselInner: {
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
  // Bottom action area — fixed-height slot where button and progress cross-fade
  actionArea: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  actionFill: {
    width: '100%',
    alignItems: 'center',
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
})
