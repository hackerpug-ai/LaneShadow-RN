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
 *
 * This provider:
 * - Checks model status on app launch
 * - Shows setup wizard if model is missing
 * - Shows "Setup Required" screen if model is corrupted
 * - Allows main app access only when model is valid
 * - Validates on every launch (never caches permanently)
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
 */
export const ModelGatekeeperProvider: React.FC<ModelGatekeeperProviderProps> = ({
  children,
  testID = 'model-gatekeeper-provider',
}) => {
  const {
    status,
    restoreModel,
    startDownload,
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
      <View testID={`${testID}-setup-wizard`}>
        <WelcomeScreen
          onDownloadPress={startDownload}
          testID={`${testID}-welcome`}
        />
      </View>
    )
  }

  // Show "Setup Required" screen if model is corrupted
  if (status === 'corrupted') {
    return (
      <View testID={`${testID}-setup-required`}>
        <SetupRequiredScreen
          onRestorePress={restoreModel}
          testID={`${testID}-restore-screen`}
        />
      </View>
    )
  }

  // Show download progress if downloading
  if (status === 'downloading') {
    return (
      <View testID={`${testID}-downloading`}>
        <DownloadProgressScreen
          progress={{ state: 'downloading', progress: 50, bytesDownloaded: 400 * 1024 * 1024, totalBytes: 800 * 1024 * 1024, estimatedTimeRemaining: 300, lastUpdated: Date.now(), networkType: 'wifi' }}
          testID={`${testID}-download-progress`}
        />
      </View>
    )
  }

  // Show completion screen when download is done
  if (status === 'valid') {
    return (
      <View testID={`${testID}-completion`}>
        <CompletionScreen
          onStartRiding={markSetupComplete}
          testID={`${testID}-completion-screen`}
        />
      </View>
    )
  }

  // Model is valid - render main app
  return <View testID={`${testID}-main-app`}>{children}</View>
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
}
