/**
 * Model Gatekeeper Provider
 *
 * Root-level provider that enforces the gatekeeper system.
 * Prevents app usage until local AI model is downloaded, validated,
 * and verified as complete.
 *
 * AC-001: App Launch Gatekeeper Check
 * AC-004: Navigation Route Guarding
 * AC-006: Setup State Persistence
 * CLR-004: Model Download Persistence
 *
 * This provider:
 * - Checks model status on app launch
 * - Shows setup wizard if model is missing
 * - Shows "Setup Required" screen if model is corrupted
 * - Allows main app access only when model is valid
 * - Validates on every launch (never caches permanently)
 * - CLR-004: Tracks download progress and supports resume
 */

import React, { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useModelSetup } from '../../hooks/useModelSetup'
import { SetupRequiredScreen } from './setup-required-screen'
import { WelcomeScreen } from '../onboarding/welcome-screen'
import { DownloadProgressScreen } from '../onboarding/download-progress-screen'
import { CompletionScreen } from '../onboarding/completion-screen'

export interface ModelGatekeeperProviderProps {
  children: React.ReactNode
  testID?: string
}

/**
 * Model Gatekeeper Provider Component
 *
 * Wraps the app and enforces gatekeeper validation.
 * Only renders children when model is validated.
 *
 * CLR-004: Shows actual download progress from Convex persistence.
 */
export const ModelGatekeeperProvider: React.FC<ModelGatekeeperProviderProps> = ({
  children,
  testID = 'model-gatekeeper-provider',
}) => {
  const {
    status,
    downloadProgress,
    canResumeDownload,
    restoreModel,
    startDownload,
    cancelDownload,
    markSetupComplete,
    isChecking,
  } = useModelSetup()

  // Show loading indicator while checking
  if (isChecking) {
    return (
      <View
        style={styles.loadingContainer}
        testID={`${testID}-loading`}
      >
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Show setup wizard if model is missing
  if (status === 'required') {
    return (
      <View style={styles.fullScreen} testID={`${testID}-setup-wizard`}>
        <WelcomeScreen
          onDownloadPress={startDownload}
          canResume={canResumeDownload}
          testID={`${testID}-welcome`}
        />
      </View>
    )
  }

  // Show "Setup Required" screen if model is corrupted
  if (status === 'corrupted') {
    return (
      <View style={styles.fullScreen} testID={`${testID}-setup-required`}>
        <SetupRequiredScreen
          onRestorePress={restoreModel}
          testID={`${testID}-restore-screen`}
        />
      </View>
    )
  }

  // Show download progress if downloading
  if (status === 'downloading') {
    // CLR-004: Use actual download progress from Convex
    const progress = downloadProgress || {
      state: 'downloading' as const,
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 800 * 1024 * 1024,
      estimatedTimeRemaining: 0,
      lastUpdated: Date.now(),
      networkType: 'wifi' as const,
    }

    return (
      <View style={styles.fullScreen} testID={`${testID}-downloading`}>
        <DownloadProgressScreen
          progress={progress}
          onCancelPress={cancelDownload}
          testID={`${testID}-download-progress`}
        />
      </View>
    )
  }

  // Show completion screen when download is done
  if (status === 'valid') {
    return (
      <View style={styles.fullScreen} testID={`${testID}-completion`}>
        <CompletionScreen
          onStartRiding={markSetupComplete}
          testID={`${testID}-completion-screen`}
        />
      </View>
    )
  }

  // Model is valid - render main app
  return <View style={styles.fullScreen} testID={`${testID}-main-app`}>{children}</View>
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  fullScreen: {
    flex: 1,
  },
}
