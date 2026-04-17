/**
 * Model Setup Screen
 *
 * Example screen showing how to use the download progress components
 * with the useModelSetup hook.
 */

import React, { useEffect } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Portal, Text } from 'react-native-paper'
import { DownloadProgressBanner, ModelManagerSection } from '../components/model'
import { useModelSetup } from '../hooks/useModelSetup'
import { toast } from '../lib/toast-system'
import { useDownloadStore } from '../stores/download-store'

/**
 * Model setup screen example
 */
export const ModelSetupScreen: React.FC = () => {
  const { status, downloadProgress, startDownload, cancelDownload, isChecking, canProceed } =
    useModelSetup()

  const [showBanner, setShowBanner] = React.useState(false)

  // Show banner when downloading
  React.useEffect(() => {
    setShowBanner(status === 'downloading')
  }, [status])

  // Show error toast when setup fails
  useEffect(() => {
    if (status === 'corrupted' && downloadProgress?.state === 'failed') {
      toast.error(
        downloadProgress?.state === 'failed'
          ? 'Setup failed. Please check your connection and try again.'
          : 'Setup failed',
      )
    }
  }, [status, downloadProgress])

  const handleStartDownload = async () => {
    try {
      await startDownload()
    } catch (error) {
      console.error('Failed to start setup:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start setup. Please check your connection and try again.',
      )
    }
  }

  const handleCancelDownload = async () => {
    try {
      await cancelDownload()
    } catch (error) {
      console.error('Failed to cancel setup:', error)
    }
  }

  if (isChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.checkingText}>Checking your AI Companion...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Model is valid and ready
  if (canProceed) {
    // Get model metadata from download store
    const modelMetadata = useDownloadStore.getState().modelMetadata

    return (
      <SafeAreaView style={styles.container}>
        <ModelManagerSection
          modelMetadata={modelMetadata}
          isModelValid={true}
          onUpdateAvailable={() => {
            /* TODO: Implement update check */
          }}
          onDeleteModel={() => {
            /* TODO: Implement delete */
          }}
          onValidateModel={() => {
            /* TODO: Implement validate */
          }}
        />
      </SafeAreaView>
    )
  }

  // Need to download or show progress
  return (
    <SafeAreaView style={styles.container}>
      <Portal>
        <DownloadProgressBanner
          progress={downloadProgress?.progress || 0}
          downloadedBytes={downloadProgress?.bytesDownloaded || 0}
          totalBytes={downloadProgress?.totalBytes || 0}
          isVisible={showBanner}
          onDismiss={() => setShowBanner(false)}
          onPress={() => {
            /* Navigate to full screen */
          }}
        />
      </Portal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your AI Companion</Text>
          <Text style={styles.subtitle}>Your local AI ride planner needs to set up its model.</Text>
        </View>

        {status === 'downloading' && downloadProgress ? (
          <View style={styles.setupContainer}>
            {/* Setup progress indicator */}
            <View style={styles.setupProgress}>
              <View style={styles.progressRing}>
                <Text style={styles.progressPercent}>{Math.round(downloadProgress.progress)}%</Text>
              </View>
              <Text style={styles.setupTitle}>Setting up your AI Companion...</Text>
              <Text style={styles.setupSubtitle}>
                This may take a few minutes. Please keep your WiFi connection active.
              </Text>

              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[styles.progressBarFill, { width: `${downloadProgress.progress}%` }]}
                  />
                </View>
              </View>

              {/* Details */}
              <View style={styles.setupDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Setting up model</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(
                      (downloadProgress.bytesDownloaded / downloadProgress.totalBytes) * 100,
                    )}
                    %
                  </Text>
                </View>

                {downloadProgress.estimatedTimeRemaining && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time remaining</Text>
                    <Text style={styles.detailValue}>
                      {Math.ceil(downloadProgress.estimatedTimeRemaining / 60)} minutes
                    </Text>
                  </View>
                )}
              </View>

              <Button
                mode="text"
                onPress={handleCancelDownload}
                textColor="#EF4444"
                style={styles.cancelButton}
              >
                Cancel Setup
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.promptContainer}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What you&apos;re getting:</Text>
              <Text style={styles.infoText}>• 400MB AI model</Text>
              <Text style={styles.infoText}>• Runs entirely on device</Text>
              <Text style={styles.infoText}>• No data sent to cloud</Text>
              <Text style={styles.infoText}>• WiFi required</Text>
            </View>

            <Button
              mode="contained"
              onPress={handleStartDownload}
              style={styles.downloadButton}
              contentStyle={styles.downloadButtonContent}
              disabled={status === 'downloading'}
              icon="cloud-download"
            >
              {status === 'downloading' ? 'Setting up...' : 'Setup AI Companion'}
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    padding: 24,
    gap: 32,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkingText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F3F4F6',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  setupContainer: {
    alignItems: 'center',
  },
  setupProgress: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F59E0B',
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F3F4F6',
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressBarContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  setupDetails: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  promptContainer: {
    gap: 24,
    alignItems: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  downloadButton: {
    backgroundColor: '#F59E0B',
  },
  downloadButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButton: {
    marginTop: 8,
  },
})
