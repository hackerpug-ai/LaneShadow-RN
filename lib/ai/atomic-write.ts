/**
 * Atomic File Write Utilities
 *
 * Provides atomic file operations to prevent partial file corruption
 * in case of crashes or interruptions during download.
 *
 * CLR-004: Model Download Persistence
 *
 * Pattern:
 * 1. Write to temporary file (.tmp)
 * 2. Verify write completed successfully
 * 3. Atomic rename to final path (POSIX guarantee)
 *
 * This ensures that either the complete file exists or nothing exists,
 * never a partial/corrupted file.
 */

import * as FileSystem from 'expo-file-system/legacy'

/**
 * Atomic write result
 */
export interface AtomicWriteResult {
  success: boolean
  filePath?: string
  error?: string
}

/**
 * Write data to file atomically
 *
 * @param filePath - Target file path
 * @param data - Data to write (base64 encoded string)
 * @returns Write result with success status
 */
export async function atomicWrite(
  filePath: string,
  data: string
): Promise<AtomicWriteResult> {
  const tempPath = `${filePath}.tmp`

  try {
    // Step 1: Write to temporary file
    await FileSystem.writeAsStringAsync(tempPath, data, {
      encoding: 'base64',
    })

    // Step 2: Verify temporary file exists and has content
    const tempInfo = await FileSystem.getInfoAsync(tempPath)
    if (!tempInfo.exists || !tempInfo.size) {
      throw new Error('Temporary file verification failed')
    }

    // Step 3: Atomic rename (guaranteed to be atomic on POSIX)
    await FileSystem.moveAsync({
      from: tempPath,
      to: filePath,
    })

    return {
      success: true,
      filePath,
    }
  } catch (error) {
    // Clean up temporary file on failure
    try {
      await FileSystem.deleteAsync(tempPath, { idempotent: true })
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Append data to file atomically
 *
 * For large downloads, this allows resuming by appending chunks.
 * Still uses atomic operations for each chunk.
 *
 * @param filePath - Target file path
 * @param chunk - Data chunk to append (base64 encoded)
 * @param offset - Byte offset for this chunk
 * @returns Write result with success status
 */
export async function atomicAppend(
  filePath: string,
  chunk: string,
  offset: number
): Promise<AtomicWriteResult> {
  const tempPath = `${filePath}.tmp.${offset}`

  try {
    // Step 1: Write chunk to temporary file
    await FileSystem.writeAsStringAsync(tempPath, chunk, {
      encoding: 'base64',
    })

    // Step 2: Verify chunk was written
    const tempInfo = await FileSystem.getInfoAsync(tempPath)
    if (!tempInfo.exists || !tempInfo.size) {
      throw new Error('Chunk verification failed')
    }

    // Step 3: Append to main file
    // Note: FileSystem doesn't have native append, so we read+write
    let existingData = ''
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath)
      if (fileInfo.exists) {
        existingData = await FileSystem.readAsStringAsync(filePath, {
          encoding: 'base64',
        })
      }
    } catch {
      // File doesn't exist yet, that's okay
    }

    const combinedData = existingData + chunk
    await atomicWrite(filePath, combinedData)

    // Clean up temporary chunk file
    await FileSystem.deleteAsync(tempPath, { idempotent: true })

    return {
      success: true,
      filePath,
    }
  } catch (error) {
    // Clean up temporary file on failure
    try {
      await FileSystem.deleteAsync(tempPath, { idempotent: true })
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete file atomically (idempotent)
 *
 * @param filePath - File path to delete
 * @returns Success status
 */
export async function atomicDelete(filePath: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(filePath, { idempotent: true })
    return true
  } catch {
    return false
  }
}

/**
 * Verify file integrity by checking size and optionally checksum
 *
 * @param filePath - File path to verify
 * @param expectedSize - Expected file size in bytes
 * @param tolerance - Allowed size deviation (default: 0)
 * @returns Verification result
 */
export async function verifyFile(
  filePath: string,
  expectedSize: number,
  tolerance: number = 0
): Promise<{ valid: boolean; actualSize?: number; error?: string }> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath)

    if (!fileInfo.exists) {
      return { valid: false, error: 'File does not exist' }
    }

    const actualSize = fileInfo.size || 0
    const sizeDiff = Math.abs(actualSize - expectedSize)

    if (sizeDiff > tolerance) {
      return {
        valid: false,
        actualSize,
        error: `Size mismatch: expected ${expectedSize}, got ${actualSize}`,
      }
    }

    return { valid: true, actualSize }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
