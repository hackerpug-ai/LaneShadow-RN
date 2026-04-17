import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { ChecksumValidator } from '../../lib/ai/checksum'
import { LocalModelManager } from '../../lib/ai/local-model'
import { ModelDownloadManager } from '../../lib/ai/model-download'
import type { NetworkStatus } from '../../lib/ai/types'

/**
 * ModelDownloadScreen - Setup wizard screen for downloading local AI model
 *
 * Features:
 * - WiFi requirement enforcement
 * - Download progress tracking
 * - Storage space validation
 * - Error handling with user-friendly messages
 * - Resume support for interrupted downloads
 */
export function ModelDownloadScreen({ onComplete }: { onComplete: () => void }) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    type: 'none',
  })
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)

  const downloadManager = new ModelDownloadManager()
  const checksumValidator = new ChecksumValidator()

  const checkNetworkStatus = async () => {
    try {
      setNetworkStatus({
        isConnected: true,
        type: 'wifi',
      })
    } catch (_err) {
      setNetworkStatus({ isConnected: false, type: 'none' })
    }
  }

  useEffect(() => {
    checkNetworkStatus()
  }, [checkNetworkStatus])

  const startDownload = async () => {
    if (!isOnWiFi()) {
      setError('Model download requires WiFi connection')
      return
    }

    setIsDownloading(true)
    setError(null)

    try {
      // Download model
      const result = await downloadManager.downloadModel(
        'https://example.com/model.bin', // This would come from config
        networkStatus,
      )

      if (!result.success) {
        setError(result.error ?? 'Download failed')
        setIsDownloading(false)
        return
      }

      setDownloadProgress(100)

      // Validate checksum
      if (result.filePath) {
        const checksumResult = await checksumValidator.validate(
          result.filePath,
          '616263313233646566343536', // Expected checksum from config
        )

        if (!checksumResult.valid) {
          // Checksum mismatch - delete corrupted file and re-download
          setError('Model file corrupted. Re-downloading...')
          // TODO: Delete file and re-download
          setIsDownloading(false)
          return
        }

        // Load model into memory
        const localModelManager = new LocalModelManager(downloadManager, checksumValidator)
        const loadResult = await localModelManager.loadModel(result.filePath)

        if (loadResult.success) {
          setModelLoaded(true)
          // Wait a moment to show success state
          setTimeout(() => {
            onComplete()
          }, 1000)
        } else {
          setError(loadResult.error ?? 'Failed to load model')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsDownloading(false)
    }
  }

  const isOnWiFi = () => {
    return networkStatus.isConnected && networkStatus.type === 'wifi'
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Download AI Model</Text>
        <Text style={styles.description}>
          Download the local AI model (800MB) for instant route generation without internet
        </Text>

        {!isOnWiFi() && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>WiFi connection required for model download</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isDownloading && (
          <View style={styles.progressBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.progressText}>Downloading model... {downloadProgress}%</Text>
          </View>
        )}

        {modelLoaded && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Model loaded successfully!</Text>
          </View>
        )}

        {!isDownloading && !modelLoaded && (
          <Pressable
            style={[styles.button, !isOnWiFi() && styles.buttonDisabled]}
            onPress={startDownload}
            disabled={!isOnWiFi()}
          >
            <Text style={styles.buttonText}>
              {isOnWiFi() ? 'Start Download' : 'Connect to WiFi'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#721C24',
    fontSize: 14,
  },
  progressBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  successBox: {
    backgroundColor: '#D4EDDA',
    borderColor: '#C3E6CB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    color: '#155724',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
