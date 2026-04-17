'use node'

import type { PlanInput } from '../../../../models/saved-routes'
import * as crypto from 'node:crypto'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * AC-1: Generates a content fingerprint from route plan input data.
 *
 * AC-4: Uses MD5 hash for fingerprint generation.
 *
 * @param planInput - Route planning input (start, end, departure time, preferences)
 * @returns MD5 hash string representing the content fingerprint
 */
export const generateContentFingerprint = (planInput: PlanInput): string => {
  // AC-3: Build fingerprint key from start/end locations, departure time (bucketed), and preferences
  const key = {
    start: {
      lat: planInput.start.lat,
      lng: planInput.start.lng,
    },
    end: {
      lat: planInput.end.lat,
      lng: planInput.end.lng,
    },
    // AC-3: Bucket departure time into 5-minute windows (300000ms = 5 min)
    departureTime: Math.floor(planInput.departureTime / 300000),
    preferences: planInput.preferences,
  }

  // AC-4: Use MD5 hash for fingerprint generation
  return crypto.createHash('md5').update(JSON.stringify(key)).digest('hex')
}
