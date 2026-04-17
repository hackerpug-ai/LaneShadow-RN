/**
 * Model Setup Hook
 *
 * Hook for managing model setup state and gatekeeper validation.
 * Integrates the ModelGatekeeper with React components.
 *
 * Features:
 * - Checks model status on mount
 * - Provides setup state and actions
 * - Handles corrupted model recovery
 * - Persists setup completion
 * - CLR-004: Download progress tracking with resume capability
 */

import * as FileSystem from 'expo-file-system/legacy'
import { useCallback, useEffect, useState } from 'react'
import { ChecksumValidator } from '../lib/ai/checksum'
import {
  GatekeeperDownloadManager,
  type ModelDownloadProgress,
} from '../lib/model/download-manager'
import { ModelGatekeeper, type ModelGatekeeperStatus } from '../lib/model/gatekeeper'
import { toast } from '../lib/toast-config'
import { useDownloadStore } from '../stores/download-store'

const MODEL_FILE_PATH = `${FileSystem.documentDirectory!}models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
const EXPECTED_CHECKSUM = '6eb923e7d26e9cea28811e1a8e852009b21242fb157b26149d3b188f3a8c8653'

export type ModelSetupStatus =
  | 'checking'
  | 'required'
  | 'downloading'
  | 'valid'
  | 'ready'
  | 'corrupted'

export interface UseModelSetupResult {
  // Current status
  status: ModelSetupStatus
  gatekeeperStatus: ModelGatekeeperStatus | null

  // Download progress (CLR-004)
  downloadProgress: ModelDownloadProgress | null
  canResumeDownload: boolean

  // Actions
  checkStatus: () => Promise<void>
  restoreModel: () => Promise<void>
  startDownload: () => Promise<void>
  cancelDownload: () => Promise<void>
  markSetupComplete: () => Promise<void>

  // Flags
  isChecking: boolean
  canProceed: boolean
}

/**
 * Hook to manage model setup state
 *
 * This hook integrates the ModelGatekeeper with React components,
 * providing a clean API for checking model status and handling recovery.
 *
 * CLR-004: Adds download progress tracking and resume capability.
 */
export const useModelSetup = (): UseModelSetupResult => {
  const [status, setStatus] = useState<ModelSetupStatus>('checking')
  const [gatekeeperStatus, setGatekeeperStatus] = useState<ModelGatekeeperStatus | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress | null>(null)
  const [canResumeDownload, setCanResumeDownload] = useState(false)

  // Create gatekeeper instance
  const createGatekeeper = useCallback((): ModelGatekeeper => {
    const checksumValidator = new ChecksumValidator()
    return new ModelGatekeeper(MODEL_FILE_PATH, EXPECTED_CHECKSUM, checksumValidator)
  }, [])

  // Create download manager
  const createDownloadManager = useCallback((): GatekeeperDownloadManager => {
    return new GatekeeperDownloadManager()
  }, [])

  // Check model status
  const checkStatus = useCallback(async () => {
    try {
      setStatus('checking')
      const gatekeeper = createGatekeeper()

      const result = await gatekeeper.checkModelStatus()
      setGatekeeperStatus(result)

      // Map gatekeeper status to hook status
      if (!result.modelExists) {
        setStatus('required')

        // CLR-004: Check if download can be resumed
        const downloadManager = createDownloadManager()
        const canResume = await downloadManager.canResume()
        setCanResumeDownload(canResume)

        if (canResume) {
          // Load existing progress
          const progress = await downloadManager.getProgress()
          setDownloadProgress(progress)
        }
      } else if (!result.modelValid) {
        setStatus('corrupted')
      } else if (result.canProceed) {
        // Model is valid — clean up stale download state
        const downloadState = useDownloadStore.getState()
        if (downloadState.state !== 'idle' && downloadState.state !== 'completed') {
          downloadState.resetDownload()
        }

        // Check if user already completed setup
        const alreadyComplete = await gatekeeper.isSetupMarkedComplete()
        setStatus(alreadyComplete ? 'ready' : 'valid')
      } else {
        setStatus('required')
      }

      gatekeeper.destroy()
    } catch (error) {
      console.error('Error checking model status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to check model status'
      toast.error(errorMessage, 'Setup Error')
      setStatus('required')
    }
  }, [createGatekeeper, createDownloadManager])

  // Restore corrupted model
  const restoreModel = useCallback(async () => {
    try {
      const gatekeeper = createGatekeeper()

      // Delete corrupted model
      await gatekeeper.deleteCorruptedModel()

      gatekeeper.destroy()

      // Start fresh download
      const downloadManager = createDownloadManager()
      await downloadManager.startDownload({
        isConnected: true,
        type: 'wifi',
      })

      setStatus('downloading')
    } catch (error) {
      console.error('Error restoring model:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore model'
      toast.error(errorMessage, 'Restore Failed')
      throw error
    }
  }, [createGatekeeper, createDownloadManager])

  // Start model download
  const startDownload = useCallback(async () => {
    try {
      const downloadManager = createDownloadManager()

      // Transition to downloading screen immediately, before the async download starts
      setStatus('downloading')

      downloadManager
        .startDownload({
          isConnected: true,
          type: 'wifi',
        })
        .then(() => {
          setStatus('valid')
        })
        .catch((error) => {
          console.error('Error during download:', error)
          const errorMessage = error instanceof Error ? error.message : 'Download failed'
          toast.error(errorMessage, 'Download Error')
          setStatus('corrupted')
        })

      // Poll Zustand store for progress updates so the UI stays current
      const pollProgress = setInterval(async () => {
        const progress = await downloadManager.getProgress()
        if (progress) {
          setDownloadProgress(progress)
          if (progress.progress >= 100 || progress.state === 'failed') {
            clearInterval(pollProgress)
          }
        }
      }, 1000)
    } catch (error) {
      console.error('Error starting download:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start download'
      toast.error(errorMessage, 'Download Error')
      setStatus('corrupted')
    }
  }, [createDownloadManager])

  // Cancel download (CLR-004)
  const cancelDownload = useCallback(async () => {
    try {
      const downloadManager = createDownloadManager()
      await downloadManager.cancelDownload()

      // Reset state
      setDownloadProgress(null)
      setCanResumeDownload(false)
      setStatus('required')
    } catch (error) {
      console.error('Error cancelling download:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel download'
      toast.error(errorMessage, 'Cancel Error')
      throw error
    }
  }, [createDownloadManager])

  // Mark setup as complete
  const markSetupComplete = useCallback(async () => {
    try {
      const gatekeeper = createGatekeeper()
      await gatekeeper.markSetupComplete()
      gatekeeper.destroy()

      setStatus('ready')
    } catch (error) {
      console.error('Error marking setup complete:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete setup'
      toast.error(errorMessage, 'Setup Error')
      throw error
    }
  }, [createGatekeeper])

  // Check status on mount
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return {
    status,
    gatekeeperStatus,
    downloadProgress,
    canResumeDownload,
    checkStatus,
    restoreModel,
    startDownload,
    cancelDownload,
    markSetupComplete,
    isChecking: status === 'checking',
    canProceed: status === 'valid' || status === 'ready',
  }
}
