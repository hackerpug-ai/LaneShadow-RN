/**
 * Download Progress Screen
 * Shows real-time progress of model download
 *
 * Features:
 * - "Awakening Your Shadow" branding
 * - Progress bar with percentage (0-100%)
 * - Estimated time remaining
 * - Updates every 5% or 5 seconds
 * - No blocking UI - continuous progress display
 */

import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Progress } from '../ui/progress'
import type { ModelDownloadProgress } from '../../lib/model/download-manager'

export interface DownloadProgressScreenProps {
  progress: ModelDownloadProgress
  testID?: string
}

export const DownloadProgressScreen: React.FC<DownloadProgressScreenProps> = ({
  progress,
  testID = 'download-progress-screen',
}) => {
  const { semantic } = useSemanticTheme()

  // Format time remaining as readable string
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`
    return `${Math.ceil(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`
  }

  // Format bytes as readable string
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <View
      style={[styles.container, { backgroundColor: semantic.color.background.default }]}
      testID={testID}
    >
      {/* Title */}
      <View style={[styles.titleContainer, { marginBottom: semantic.space.xl }]}>
        <Text
          variant="headlineMedium"
          style={[
            semantic.type.heading.lg,
            { color: semantic.color.onSurface.default, textAlign: 'center' },
          ]}
        >
          Awakening Your Shadow
        </Text>
        <Text
          variant="bodyMedium"
          style={[
            semantic.type.body.md,
            {
              color: semantic.color.onSurface.muted,
              textAlign: 'center',
              marginTop: semantic.space.sm,
            },
          ]}
        >
          Downloading your AI ride planner...
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { marginBottom: semantic.space.xl }]}>
        <Progress
          value={progress.progress}
          max={100}
          accessibilityLabel={`Download progress: ${progress.progress}%`}
        />
      </View>

      {/* Percentage Display */}
      <View style={[styles.percentageContainer, { marginBottom: semantic.space.lg }]}>
        <Text
          variant="displaySmall"
          style={[
            semantic.type.display.md,
            {
              color: semantic.color.primary.default,
              textAlign: 'center',
              fontWeight: '700',
            },
          ]}
        >
          {progress.progress}%
        </Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { gap: semantic.space.md }]}>
        {/* Time Remaining */}
        <View style={[styles.statRow]}>
          <Text
            variant="bodyMedium"
            style={[semantic.type.body.md, { color: semantic.color.onSurface.muted }]}
          >
            Time remaining:
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              semantic.type.body.md,
              { color: semantic.color.onSurface.default, fontWeight: '600' },
            ]}
          >
            {formatTimeRemaining(progress.estimatedTimeRemaining)}
          </Text>
        </View>

        {/* Downloaded Size */}
        <View style={[styles.statRow]}>
          <Text
            variant="bodyMedium"
            style={[semantic.type.body.md, { color: semantic.color.onSurface.muted }]}
          >
            Downloaded:
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              semantic.type.body.md,
              { color: semantic.color.onSurface.default, fontWeight: '600' },
            ]}
          >
            {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
          </Text>
        </View>

        {/* Network Type */}
        <View style={[styles.statRow]}>
          <Text
            variant="bodyMedium"
            style={[semantic.type.body.md, { color: semantic.color.onSurface.muted }]}
          >
            Connection:
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              semantic.type.body.md,
              {
                color:
                  progress.networkType === 'wifi'
                    ? semantic.color.success.default
                    : semantic.color.warning.default,
                fontWeight: '600',
              },
            ]}
          >
            {progress.networkType === 'wifi' ? 'WiFi' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {/* Info Text */}
      <View style={[styles.infoContainer, { marginTop: semantic.space.xl }]}>
        <Text
          variant="bodySmall"
          style={[
            semantic.type.body.sm,
            {
              color: semantic.color.onSurface.subtle,
              textAlign: 'center',
              fontStyle: 'italic',
            },
          ]}
        >
          You can leave this screen. The download will continue in the background.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    width: '100%',
    maxWidth: 400,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 400,
  },
  percentageContainer: {
    width: '100%',
    maxWidth: 400,
  },
  statsContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 16,
  },
})
