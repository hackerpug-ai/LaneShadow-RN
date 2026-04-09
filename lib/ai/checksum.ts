import * as Crypto from 'expo-crypto'
import * as FileSystem from 'expo-file-system'
import type { ChecksumResult } from './types'

// Re-export ChecksumResult for convenience
export type { ChecksumResult } from './types'

/**
 * SHA-256 checksum validation utilities
 *
 * Validates model file integrity before loading to prevent corrupted models
 * from causing runtime errors or incorrect inference results.
 */
export class ChecksumValidator {
  /**
   * Validate file checksum against expected value
   *
   * @param filePath - Path to model file
   * @param expectedChecksum - Expected SHA-256 hash
   * @returns Checksum validation result
   */
  async validate(filePath: string, expectedChecksum: string): Promise<ChecksumResult> {
    try {
      const actualChecksum = await this.computeSHA256(filePath)

      return {
        valid: actualChecksum === expectedChecksum,
        actualChecksum,
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Compute SHA-256 hash of file
   *
   * @param filePath - Path to file
   * @returns SHA-256 hash (hex string)
   */
  private async computeSHA256(filePath: string): Promise<string> {
    try {
      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: 'base64' as any,
      })

      // Compute SHA-256 hash using expo-crypto
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fileContent,
        {
          encoding: Crypto.CryptoEncoding.BASE64,
        }
      )

      // Convert base64 to hex
      return this.base64ToHex(digest)
    } catch (error) {
      throw new Error(`Failed to compute checksum: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert base64 string to hex
   */
  private base64ToHex(base64: string): string {
    const bytes = Buffer.from(base64, 'base64')
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
