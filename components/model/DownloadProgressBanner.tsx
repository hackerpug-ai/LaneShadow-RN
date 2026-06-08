/**
 * Download Progress Banner
 *
 * A compact, dismissible banner for showing download progress
 * when navigating away from the main download screen.
 *
 * Design: Slim horizontal bar with animated progress line
 */

import type React from 'react'
import { useEffect, useState } from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { IconButton, Text } from 'react-native-paper'

interface DownloadProgressBannerProps {
  progress: number // 0-100
  downloadedBytes: number
  totalBytes: number
  isVisible: boolean
  onDismiss?: () => void
  onPress?: () => void
}

/**
 * Compact download progress banner
 */
export const DownloadProgressBanner: React.FC<DownloadProgressBannerProps> = ({
  progress,
  downloadedBytes,
  totalBytes,
  isVisible,
  onDismiss,
  onPress,
}) => {
  const [slideAnim] = useState(new Animated.Value(-100))
  const [progressAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isVisible, slideAnim])

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false, // width animation not supported for native driver
    }).start()
  }, [progress, progressAnim])

  if (!isVisible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.touchable} onPress={onPress} activeOpacity={0.7}>
        {/* Progress bar background */}
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Setting up your AI Companion...</Text>
            <Text style={styles.subtitle}>
              {Math.round(progress)}% complete · Keep WiFi connected
            </Text>
          </View>

          {onDismiss && (
            <IconButton
              icon="close"
              size={16}
              iconColor="#9CA3AF"
              onPress={onDismiss}
              style={styles.dismissButton}
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
    zIndex: 1000,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  touchable: {
    width: '100%',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  dismissButton: {
    margin: 0,
    marginLeft: 8,
  },
})
