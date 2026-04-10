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
 * - Shows welcome + ambient download flow if model is missing
 * - Shows "Setup Required" screen if model is corrupted
 * - Allows main app access only when model is valid
 * - CLR-004: Tracks download progress and supports resume
 */

import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useModelSetup } from '../../hooks/useModelSetup'
import { SetupRequiredScreen } from './setup-required-screen'
import { WelcomeScreen } from '../onboarding/welcome-screen'
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
 * The WelcomeScreen handles both idle and downloading states:
 * - Idle: branding + "Setup Your AI Companion" CTA
 * - Downloading: thin progress pill + feature carousel
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

  // Welcome screen handles both "required" and "downloading" states
  if (status === 'required' || status === 'downloading') {
    return (
      <View style={styles.fullScreen} testID={`${testID}-welcome-flow`}>
        <WelcomeScreen
          isDownloading={status === 'downloading'}
          downloadProgress={downloadProgress}
          onDownloadPress={startDownload}
          onCancelPress={status === 'downloading' ? cancelDownload : undefined}
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

  // Show completion screen when download is done (but setup not yet confirmed)
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

  // Model is ready - render main app
  if (status === 'ready') {
    return <View style={styles.fullScreen} testID={`${testID}-main-app`}>{children}</View>
  }

  // Fallback — render main app (should not reach here)
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
