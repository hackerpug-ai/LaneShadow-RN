/**
 * DownloadProgressIndicator for offline map regions.
 *
 * Displays download progress with a progress bar, percentage text,
 * downloaded/total MB, and estimated time remaining.
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'

export type DownloadProgressIndicatorProps = {
  /** Pack name being downloaded */
  packName: string
  /** Downloaded bytes so far */
  bytesDownloaded: number
  /** Total bytes expected */
  totalBytes: number
  /** Download percentage 0-100 */
  percentage: number
  /** Estimated seconds remaining */
  eta: number | null
  /** Download state */
  state: 'idle' | 'downloading' | 'paused' | 'complete' | 'failed'
  /** Cancel handler */
  onCancel?: () => void
  testID?: string
}

export const DownloadProgressIndicator = ({
  percentage,
  bytesDownloaded,
  totalBytes,
  eta,
  state,
  onCancel,
  testID = 'download-progress',
}: DownloadProgressIndicatorProps) => {
  const { semantic } = useSemanticTheme()

  const formatMB = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? '< 1 MB' : `${mb.toFixed(0)} MB`
  }

  const formatETA = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return ''
    if (seconds < 60) return `${Math.ceil(seconds)} sec left`
    const mins = Math.ceil(seconds / 60)
    return `${mins} min left`
  }

  const statusText = () => {
    switch (state) {
      case 'complete': return 'Download complete'
      case 'failed': return 'Download failed'
      case 'paused': return 'Paused'
      default: return formatETA(eta)
    }
  }

  return (
    <View testID={testID} style={[styles.container, { gap: semantic.space.sm }]}>
      <View style={styles.row}>
        <Text
          variant="titleMedium"
          style={{ color: semantic.color.onSurface.default }}
        >
          {state === 'complete' ? 'Complete' : 'Downloading...'}
        </Text>
        <Text
          variant="labelMedium"
          style={{ color: semantic.color.primary.default }}
        >
          {percentage}%
        </Text>
      </View>

      <Progress
        value={percentage}
        accessibilityLabel={`Download progress: ${percentage}%`}
      />

      <View style={styles.row}>
        <Text
          variant="bodySmall"
          style={{ color: semantic.color.onSurface.muted }}
        >
          {formatMB(bytesDownloaded)} / {formatMB(totalBytes)}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: semantic.color.onSurface.muted }}
        >
          {statusText()}
        </Text>
      </View>

      {state === 'downloading' && onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onPress={onCancel}
          testID={`${testID}-cancel`}
        >
          Cancel Download
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
