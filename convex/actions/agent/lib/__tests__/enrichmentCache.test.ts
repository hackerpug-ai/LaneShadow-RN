import { beforeAll, describe, expect, it } from 'vitest'
import type { PlanInput } from '../../../../../shared/models/saved-routes'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildPlanInput = (overrides?: Partial<PlanInput>): PlanInput => ({
  start: { lat: 37.7749, lng: -122.4194 },
  end: { lat: 34.0522, lng: -118.2437 },
  departureTime: 1_700_000_000_000,
  preferences: {
    scenicBias: 'high',
    avoidHighways: true,
  },
  ...overrides,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateContentFingerprint', () => {
  // Import once at the top
  let generateContentFingerprint: (planInput: PlanInput) => string

  beforeAll(async () => {
    const module = await import('../enrichmentCache.js')
    generateContentFingerprint = module.generateContentFingerprint
  })

  describe('AC-1: generates fingerprint from route plan input', () => {
    it('generates a fingerprint string from plan input', () => {
      const planInput = buildPlanInput()
      const fingerprint = generateContentFingerprint(planInput)

      expect(fingerprint).toBeDefined()
      expect(typeof fingerprint).toBe('string')
      expect(fingerprint.length).toBeGreaterThan(0)
    })
  })

  describe('AC-2: fingerprints are consistent for identical route requests', () => {
    it('produces identical fingerprints for the same input', () => {
      const planInput = buildPlanInput()
      const fingerprint1 = generateContentFingerprint(planInput)
      const fingerprint2 = generateContentFingerprint(planInput)

      expect(fingerprint1).toBe(fingerprint2)
    })

    it('produces identical fingerprints for equivalent inputs', () => {
      const baseInput = buildPlanInput()
      const equivalentInput = buildPlanInput()

      const fingerprint1 = generateContentFingerprint(baseInput)
      const fingerprint2 = generateContentFingerprint(equivalentInput)

      expect(fingerprint1).toBe(fingerprint2)
    })
  })

  describe('AC-3: fingerprint includes start/end locations, departure time (bucketed), preferences', () => {
    it('produces different fingerprints for different start locations', () => {
      const planInput1 = buildPlanInput({
        start: { lat: 37.7749, lng: -122.4194 },
      })
      const planInput2 = buildPlanInput({
        start: { lat: 37.775, lng: -122.4194 }, // Slightly different lat
      })

      const fingerprint1 = generateContentFingerprint(planInput1)
      const fingerprint2 = generateContentFingerprint(planInput2)

      expect(fingerprint1).not.toBe(fingerprint2)
    })

    it('produces different fingerprints for different end locations', () => {
      const planInput1 = buildPlanInput({
        end: { lat: 34.0522, lng: -118.2437 },
      })
      const planInput2 = buildPlanInput({
        end: { lat: 34.0523, lng: -118.2437 }, // Slightly different lat
      })

      const fingerprint1 = generateContentFingerprint(planInput1)
      const fingerprint2 = generateContentFingerprint(planInput2)

      expect(fingerprint1).not.toBe(fingerprint2)
    })

    it('produces different fingerprints for different preferences', () => {
      const planInput1 = buildPlanInput({
        preferences: { scenicBias: 'high', avoidHighways: true },
      })
      const planInput2 = buildPlanInput({
        preferences: { scenicBias: 'default', avoidHighways: true },
      })

      const fingerprint1 = generateContentFingerprint(planInput1)
      const fingerprint2 = generateContentFingerprint(planInput2)

      expect(fingerprint1).not.toBe(fingerprint2)
    })

    it('produces identical fingerprints for departure times in the same 5-minute bucket', () => {
      // Use a time that's aligned to 5-minute buckets
      const baseTime = 1_700_000_000_000 - (1_700_000_000_000 % 300000)

      // Create base input once
      const baseInput: PlanInput = {
        start: { lat: 37.7749, lng: -122.4194 },
        end: { lat: 34.0522, lng: -118.2437 },
        departureTime: baseTime,
        preferences: {
          scenicBias: 'high',
          avoidHighways: true,
        },
      }

      // Create variations with different departure times within same bucket
      const planInput1 = { ...baseInput, departureTime: baseTime }
      const planInput2 = { ...baseInput, departureTime: baseTime + 60000 } // +1 minute
      const planInput3 = { ...baseInput, departureTime: baseTime + 180000 } // +3 minutes

      const fingerprint1 = generateContentFingerprint(planInput1)
      const fingerprint2 = generateContentFingerprint(planInput2)
      const fingerprint3 = generateContentFingerprint(planInput3)

      expect(fingerprint1).toBe(fingerprint2)
      expect(fingerprint2).toBe(fingerprint3)
    })

    it('produces different fingerprints for departure times in different 5-minute buckets', () => {
      const baseTime = 1_700_000_000_000

      const planInput1 = buildPlanInput({ departureTime: baseTime })
      const planInput2 = buildPlanInput({ departureTime: baseTime + 300000 }) // +5 minutes

      const fingerprint1 = generateContentFingerprint(planInput1)
      const fingerprint2 = generateContentFingerprint(planInput2)

      expect(fingerprint1).not.toBe(fingerprint2)
    })
  })

  describe('AC-4: MD5 hash used for fingerprint generation', () => {
    it('produces a 32-character hexadecimal string', () => {
      const planInput = buildPlanInput()
      const fingerprint = generateContentFingerprint(planInput)

      expect(fingerprint).toMatch(/^[a-f0-9]{32}$/)
    })

    it('produces consistent MD5 hash for known input', () => {
      // Test with a known input to verify MD5 implementation
      const planInput = buildPlanInput({
        start: { lat: 1, lng: 2 },
        end: { lat: 3, lng: 4 },
        departureTime: 0,
        preferences: { scenicBias: 'high' },
      })

      const fingerprint1 = generateContentFingerprint(planInput)
      const fingerprint2 = generateContentFingerprint(planInput)

      // MD5 should be deterministic
      expect(fingerprint1).toBe(fingerprint2)
      expect(fingerprint1).toMatch(/^[a-f0-9]{32}$/)
    })
  })
})
