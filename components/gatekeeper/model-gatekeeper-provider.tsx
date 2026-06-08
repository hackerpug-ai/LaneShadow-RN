/**
 * Model Gatekeeper Provider
 *
 * Root-level provider that enforces the gatekeeper system.
 * Prevents app usage until local AI model is downloaded, validated,
 * and verified as complete.
 *
 * This provider:
 * - Waits for settings store hydration before rendering
 * - Skips onboarding entirely if user has already completed it
 * - Shows welcome + ambient download flow if model is missing
 * - Shows "Setup Required" screen if model is corrupted
 * - Allows main app access only when model is valid
 */

import type React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useModelSetup } from '../../hooks/useModelSetup'
import { useDownloadStore } from '../../stores/download-store'
import { useSettingsStore } from '../../stores/settings-store'
import { CompletionScreen } from '../onboarding/completion-screen'
import { WelcomeScreen } from '../onboarding/welcome-screen'
import { SetupRequiredScreen } from './setup-required-screen'

export interface ModelGatekeeperProviderProps {
  children: React.ReactNode
  testID?: string
}

export const ModelGatekeeperProvider: React.FC<ModelGatekeeperProviderProps> = ({
  children,
  testID = 'model-gatekeeper-provider',
}) => {
  const {
    status,
    downloadProgress,
    restoreModel,
    startDownload,
    cancelDownload,
    markSetupComplete,
    isChecking,
  } = useModelSetup()

  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding)
  const settingsHydrated = useSettingsStore((s) => s._hydrated)
  const setHasCompletedOnboarding = useSettingsStore((s) => s.setHasCompletedOnboarding)

  // Wait for both stores to hydrate before rendering anything
  const downloadHydrated = useDownloadStore((s) => s._hydrated)
  const isReady = settingsHydrated && downloadHydrated

  // If stores haven't hydrated yet, show loading
  if (!isReady) {
    return (
      <View style={styles.loadingContainer} testID={`${testID}-hydrating`}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // If user already completed onboarding, skip gatekeeper entirely
  if (hasCompletedOnboarding) {
    return (
      <View style={styles.fullScreen} testID={`${testID}-main-app`}>
        {children}
      </View>
    )
  }

  // Show loading indicator while checking model status
  if (isChecking) {
    return (
      <View style={styles.loadingContainer} testID={`${testID}-loading`}>
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
        <SetupRequiredScreen onRestorePress={restoreModel} testID={`${testID}-restore-screen`} />
      </View>
    )
  }

  // Show completion screen when download is done (but setup not yet confirmed)
  if (status === 'valid') {
    const handleStartRiding = async () => {
      await markSetupComplete()
      setHasCompletedOnboarding(true)
    }

    return (
      <View style={styles.fullScreen} testID={`${testID}-completion`}>
        <CompletionScreen
          onStartRiding={handleStartRiding}
          testID={`${testID}-completion-screen`}
        />
      </View>
    )
  }

  // Model is ready - render main app
  return (
    <View style={styles.fullScreen} testID={`${testID}-main-app`}>
      {children}
    </View>
  )
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
