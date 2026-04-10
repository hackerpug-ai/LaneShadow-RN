/**
 * Download Progress Indicator
 *
 * A distinctive, animated progress indicator for model downloads.
 * Features a radial design with pulsing effects and detailed stats.
 *
 * Design Concept: "Neural Pulse" - A glowing, breathing progress ring
 * that evokes AI awakening. The ring pulses with download activity,
 * surrounded by orbital particles that accelerate as progress increases.
 */

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Text } from 'react-native-paper'
import { formatBytes, formatETA } from './formatters'

interface DownloadProgressIndicatorProps {
  progress: number // 0-100
  downloadedBytes: number
  totalBytes: number
  estimatedTimeRemaining?: number
  state: 'downloading' | 'completed' | 'failed' | 'paused'
  error?: string
}

/**
 * Download progress indicator with neural pulse aesthetic
 */
export const DownloadProgressIndicator: React.FC<DownloadProgressIndicatorProps> = ({
  progress,
  downloadedBytes,
  totalBytes,
  estimatedTimeRemaining,
  state,
  error,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1))
  const [rotationAnim] = useState(new Animated.Value(0))
  const [particleAnims] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ])

  const isDownloading = state === 'downloading'
  const isCompleted = state === 'completed'
  const isFailed = state === 'failed'

  // Pulsing animation for the main ring
  useEffect(() => {
    if (!isDownloading) return

    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])

    const loop = Animated.loop(pulse)
    loop.start()

    return () => loop.stop()
  }, [isDownloading, pulseAnim])

  // Continuous rotation for outer ring
  useEffect(() => {
    if (!isDownloading) return

    const rotate = Animated.timing(rotationAnim, {
      toValue: 360,
      duration: 20000 - progress * 150, // Speed up as progress increases
      useNativeDriver: true,
    })

    const loop = Animated.loop(rotate)
    loop.start()

    return () => loop.stop()
  }, [isDownloading, progress, rotationAnim])

  // Particle orbital animations
  useEffect(() => {
    if (!isDownloading) return

    const animations = particleAnims.map((anim, index) => {
      const delay = index * 333
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500 - progress * 10,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    })

    const loops = animations.map((anim) => Animated.loop(anim))
    loops.forEach((loop) => loop.start())

    return () => loops.forEach((loop) => loop.stop())
  }, [isDownloading, progress, particleAnims])

  const getProgressColor = () => {
    if (isFailed) return ['#EF4444', '#DC2626'] // Red
    if (isCompleted) return ['#10B981', '#059669'] // Green
    return ['#F59E0B', '#D97706'] // Amber/Orange for downloading
  }

  const colors = getProgressColor()

  return (
    <View style={styles.container}>
      {/* Neural Pulse Ring */}
      <View style={styles.ringContainer}>
        {/* Outer rotating ring */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              borderColor: isFailed ? '#EF4444' : isCompleted ? '#10B981' : '#F59E0B',
            },
          ]}
        />

        {/* Pulsing middle ring */}
        <Animated.View
          style={[
            styles.middleRing,
            {
              transform: [{ scale: pulseAnim }],
              borderColor: isFailed ? '#EF4444' : isCompleted ? '#10B981' : '#F59E0B',
            },
          ]}
        />

        {/* Progress arc */}
        <View style={[styles.progressRing, { backgroundColor: colors[0] }]}>
          <View style={styles.progressRingInner}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  transform: [{ rotate: `${progress * 3.6}deg` }],
                },
              ]}
            >
              <View style={[styles.progressFillSegment, { backgroundColor: colors[0] }]} />
            </Animated.View>
          </View>
        </View>

        {/* Orbital particles */}
        {isDownloading &&
          particleAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  transform: [
                    {
                      rotate: `${index * 120}deg`,
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [60, 80],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.particleDot,
                  { backgroundColor: colors[0] },
                ]}
              />
            </Animated.View>
          ))}

        {/* Center content */}
        <View style={styles.centerContent}>
          {isFailed ? (
            <>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>FAILED</Text>
            </>
          ) : isCompleted ? (
            <>
              <Text style={styles.completeIcon}>✨</Text>
              <Text style={styles.statusText}>AWAKE</Text>
            </>
          ) : (
            <>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              <Text style={styles.subText}>
                {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Stats panel */}
      <View style={styles.statsPanel}>
        {isDownloading && estimatedTimeRemaining !== undefined && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Time remaining</Text>
            <Text style={styles.statValue}>{formatETA(estimatedTimeRemaining)}</Text>
          </View>
        )}

        {isDownloading && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>
              Downloading model · {formatBytes(downloadedBytes)} of {formatBytes(totalBytes)}
            </Text>
          </View>
        )}

        {isFailed && error && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorPanelText}>Setup failed: {error}</Text>
          </View>
        )}
      </View>

      {/* Status indicator */}
      <View style={styles.statusBar}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isFailed
                ? '#EF4444'
                : isCompleted
                  ? '#10B981'
                  : '#F59E0B',
            },
          ]}
        />
        <Text style={styles.statusText}>
          {isFailed
            ? 'Setup failed'
            : isCompleted
              ? 'Your AI Companion is ready'
              : 'Setting up your AI Companion...'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 24,
  },
  ringContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  middleRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    opacity: 0.3,
  },
  progressRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  progressRingInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  progressFill: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  progressFillSegment: {
    position: 'absolute',
    top: 0,
    left: 79,
    width: 2,
    height: 80,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: 'System',
    letterSpacing: -1,
  },
  subText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    letterSpacing: 1,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  completeIcon: {
    fontSize: 32,
  },
  statsPanel: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: '#F3F4F6',
    fontWeight: '600',
  },
  errorPanel: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorPanelText: {
    fontSize: 12,
    color: '#FCA5A5',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
