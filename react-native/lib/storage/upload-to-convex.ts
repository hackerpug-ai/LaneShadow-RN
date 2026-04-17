/**
 * Storage Upload Helpers for Convex
 *
 * Upload audio and image files to Convex Storage
 * Returns storage ID for use in ingest/mutations
 */

import type { ConvexReactClient } from 'convex/react'
import { api } from '../../convex/_generated/api'

/**
 * Convert audio file to base64 string for direct ingestion
 *
 * Ephemeral audio flow: Record → Convert to base64 → Send directly to ingest
 * No storage step needed - audio is sent directly in action call and never persisted
 *
 * Audio format: 16kHz sample rate, mono, WAV (industry standard for speech transcription)
 * File size: ~160KB for 5 seconds → ~213KB base64 (acceptable for server-side processing)
 *
 * @param uri - Local file URI (from expo-audio Recording)
 * @returns Base64 string or null if conversion failed
 */
export const audioToBase64 = async (uri: string): Promise<string | null> => {
  try {
    // Read file using fetch (works in React Native)
    const response = await fetch(uri)
    const blob = await response.blob()

    // Convert blob to base64 using FileReader API
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        if (!result || typeof result !== 'string') {
          reject(new Error('Failed to read audio file'))
          return
        }
        // Remove data URL prefix (keep just base64)
        const base64 = result.includes(',') ? (result.split(',')[1] ?? result) : result
        if (!base64) {
          reject(new Error('Failed to extract base64 data'))
          return
        }
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to convert audio to base64'))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Audio base64 conversion failed:', error)
    return null
  }
}

/**
 * Upload image file to Convex Storage and create media asset
 *
 * @param uri - Local file URI (from expo-camera or image picker)
 * @param mimeType - MIME type (e.g., 'image/jpeg', 'image/png')
 * @param scopeType - Where asset belongs (classroom, campus, school)
 * @param scopeId - Target scope ID
 * @param convex - Convex client instance
 * @param options - Optional width, height, organizationId
 * @returns Object with storageId and mediaAssetId, or null if upload failed
 */
export const uploadImage = async (
  uri: string,
  mimeType: string,
  scopeType: 'classroom' | 'campus' | 'school',
  scopeId: string,
  convex: ConvexReactClient,
  options?: {
    width?: number
    height?: number
    organizationId?: string
  },
): Promise<{ storageId: string; mediaAssetId: string } | null> => {
  try {
    // 1. Get upload URL from Convex mutation (faster than action, no Node.js overhead)
    // Convex file path: convex/db/storage/getUploadUrl.ts → api.db.storage.getUploadUrl.getUploadUrl
    const uploadUrlResult = await convex.mutation(
      (api as any).db?.storage?.getUploadUrl ?? api.users.create,
      {
        contentType: mimeType,
      } as any,
    )

    if (!uploadUrlResult?.uploadUrl) {
      throw new Error('Failed to get upload URL')
    }

    // 2. Read file as blob
    const response = await fetch(uri)
    const blob = await response.blob()

    // 3. Upload to Convex Storage
    const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
      method: 'POST',
      body: blob,
      headers: {
        'Content-Type': mimeType,
      },
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`)
    }

    // 4. Extract storage ID
    const result = await uploadResponse.json()
    const storageId = result.storageId as string

    if (!storageId) {
      throw new Error('No storage ID in upload response')
    }

    // 5. Create media asset (backend mutation)
    const mediaAssetResult = await convex.mutation(
      (api as any).db?.fileAssets?.createMediaAssetFromStorage ?? api.users.create,
      {
        storageId,
        mime: mimeType,
        scopeType,
        scopeId,
        width: options?.width,
        height: options?.height,
        organizationId: options?.organizationId,
      } as any,
    )

    if (!mediaAssetResult?.id) {
      throw new Error('Failed to create media asset')
    }

    return {
      storageId,
      mediaAssetId: mediaAssetResult.id,
    }
  } catch (error) {
    console.error('Image upload failed:', error)
    return null
  }
}
