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
 */

import { useCallback, useEffect, useState } from 'react'
import * as FileSystem from 'expo-file-system'
import { ChecksumValidator } from '../lib/ai/checksum'
import { ModelGatekeeper, type ModelGatekeeperStatus } from '../lib/model/gatekeeper'
import { GatekeeperDownloadManager } from '../lib/model/download-manager'

const MODEL_FILE_PATH = `/models/qwen3.5-0.8b.mlmodel`
const EXPECTED_CHECKSUM = '616263313233646566343536' // Placeholder checksum from CLR-002

export type ModelSetupStatus = 'checking' | 'required' | 'downloading' | 'valid' | 'corrupted'

export interface UseModelSetupResult {
  // Current status
  status: ModelSetupStatus
  gatekeeperStatus: ModelGatekeeperStatus | null

  // Actions
  checkStatus: () => Promise<void>
  restoreModel: () => Promise<void>
  startDownload: () => Promise<void>
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
 */
export const useModelSetup = (): UseModelSetupResult => {
  const [status, setStatus] = useState<ModelSetupStatus>('checking')
  const [gatekeeperStatus, setGatekeeperStatus] = useState<ModelGatekeeperStatus | null>(null)

  // Create gatekeeper instance
  const createGatekeeper = useCallback((): ModelGatekeeper => {
    const checksumValidator = new ChecksumValidator()
    return new ModelGatekeeper(MODEL_FILE_PATH, EXPECTED_CHECKSUM, checksumValidator)
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
      } else if (!result.modelValid) {
        setStatus('corrupted')
      } else if (result.canProceed) {
        setStatus('valid')
      } else {
        setStatus('required')
      }

      gatekeeper.destroy()
    } catch (error) {
      console.error('Error checking model status:', error)
      setStatus('required')
    }
  }, [createGatekeeper])

  // Restore corrupted model
  const restoreModel = useCallback(async () => {
    try {
      const gatekeeper = createGatekeeper()

      // Delete corrupted model
      await gatekeeper.deleteCorruptedModel()

      gatekeeper.destroy()

      // Start download
      const downloadManager = new GatekeeperDownloadManager()
      await downloadManager.startDownload()

      setStatus('downloading')
    } catch (error) {
      console.error('Error restoring model:', error)
      throw error
    }
  }, [createGatekeeper])

  // Start model download
  const startDownload = useCallback(async () => {
    try {
      const downloadManager = new GatekeeperDownloadManager()
      await downloadManager.startDownload()

      setStatus('downloading')
    } catch (error) {
      console.error('Error starting download:', error)
      throw error
    }
  }, [])

  // Mark setup as complete
  const markSetupComplete = useCallback(async () => {
    try {
      const gatekeeper = createGatekeeper()
      await gatekeeper.markSetupComplete()
      gatekeeper.destroy()

      setStatus('valid')
    } catch (error) {
      console.error('Error marking setup complete:', error)
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
    checkStatus,
    restoreModel,
    startDownload,
    markSetupComplete,
    isChecking: status === 'checking',
    canProceed: status === 'valid',
  }
}
