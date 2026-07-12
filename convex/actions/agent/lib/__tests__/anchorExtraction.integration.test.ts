import { describe, expect, it } from 'vitest'
import { ANTHROPIC_API_KEY } from '../../../../lib/env'
import {
  type AnchorExtractionRouteInput,
  buildAnchorExtractionPrompt,
  emitAnchorsSchema,
  extractAnchors,
} from '../anchorExtraction'

const twistOfTepusquet: AnchorExtractionRouteInput = {
  routeId: 'motorcycleroads:twist-of-tepusquet-loop',
  name: 'Twist of Tepusquet Loop',
  state: 'California',
  lengthMiles: 41.0,
  centroidLat: 34.961664375,
  centroidLng: -120.311833025,
  oneLiner: '',
  summary:
    'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia Road becomes Foxen Canyon Road. Foxen Canyon Road becomes Santa Maria Mesa Road. Santa Maria Mesa Road merges into Tepusquet Canyon Road. Head North on Tepusquet Canyon Road. Follow this all the way up the mountain and back down until you reach highway 166. Follow 166 West until you reach highway 101 again.',
}

const oldHwy40: AnchorExtractionRouteInput = {
  routeId: 'motorcycleroads:old-hwy-40-cisco-grove-to-donner-lake',
  name: 'Old Hwy 40 Cisco Grove to Donner Lake',
  state: 'California',
  lengthMiles: 16.0,
  centroidLat: 39.31606666,
  centroidLng: -120.41914458,
  oneLiner: '',
  summary:
    'I-80 to Cisco Grove exit, about 50 miles East of Auburn. Get off, go across the overpass, and turn right on Old Hwy 40. 35 mph, please.Continue to Donner Lake. Make sure to stop at Rainbow Lodge, and Donner Lake vista point, just past historic Rainbow Bridge. Great twisties. Go back the same way, if you like, or continue onto another segment.',
}

const hasAnthropicKey = Boolean(ANTHROPIC_API_KEY)

describe('anchorExtraction', () => {
  describe('AC-1: extracts ordered anchors from the real Twist of Tepusquet Loop description', () => {
    if (!hasAnthropicKey) {
      it.skip('SKIP: ANTHROPIC_API_KEY is absent — integration test requires real Anthropic API', () => {})
      return
    }

    it('returns >=5 ordered non-empty anchors validated against emitAnchorsSchema', async () => {
      const result = await extractAnchors(twistOfTepusquet)

      expect(result.anchors.length).toBeGreaterThanOrEqual(5)
      expect(result.anchors[0]?.query.length).toBeGreaterThan(0)
      expect(['high', 'medium', 'low']).toContain(result.confidence)
      for (const anchor of result.anchors) {
        expect(anchor.query.length).toBeGreaterThan(0)
      }

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-1 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-1',
          anchorsLength: result.anchors.length,
          firstQuery: result.anchors[0]?.query,
          confidence: result.confidence,
        }),
      )
    }, 120_000)
  })

  describe('AC-2: generalizes to the real Old Hwy 40 point-to-point description', () => {
    if (!hasAnthropicKey) {
      it.skip('SKIP: ANTHROPIC_API_KEY is absent — integration test requires real Anthropic API', () => {})
      return
    }

    it('returns >=3 ordered non-empty anchors validated against emitAnchorsSchema', async () => {
      const result = await extractAnchors(oldHwy40)

      expect(result.anchors.length).toBeGreaterThanOrEqual(3)
      expect(['high', 'medium', 'low']).toContain(result.confidence)
      for (const anchor of result.anchors) {
        expect(anchor.query.length).toBeGreaterThan(0)
      }

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-2 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-2',
          anchorsLength: result.anchors.length,
          queries: result.anchors.map((a) => a.query),
          confidence: result.confidence,
        }),
      )
    }, 120_000)
  })

  describe('AC-3: prompt assembly is deterministic and includes the real description text', () => {
    it('returns byte-identical prompts containing the route summary verbatim', () => {
      const promptA = buildAnchorExtractionPrompt(twistOfTepusquet)
      const promptB = buildAnchorExtractionPrompt(twistOfTepusquet)

      expect(promptA).toBe(promptB)
      expect(promptA).toContain('Foxen Canyon Road')
      expect(promptA).toContain('Twist of Tepusquet Loop')
      expect(promptA.length).toBeGreaterThan(0)

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-3 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-3',
          promptLength: promptA.length,
          containsFoxenCanyon: promptA.includes('Foxen Canyon Road'),
          containsRouteName: promptA.includes('Twist of Tepusquet Loop'),
        }),
      )
    })
  })

  describe('AC-4: emitAnchorsSchema rejects malformed model responses', () => {
    it('rejects an empty anchors array', () => {
      const result = emitAnchorsSchema.safeParse({ anchors: [], confidence: 'high' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(1)
        expect(result.error.issues.some((issue) => issue.path.includes('anchors'))).toBe(true)
      }

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-4 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-4-case-1',
          success: result.success,
          issueCount: result.success ? 0 : result.error.issues.length,
          anchorsIssue: result.success
            ? false
            : result.error.issues.some((issue) => issue.path.includes('anchors')),
        }),
      )
    })

    it('rejects a response missing the confidence field', () => {
      const result = emitAnchorsSchema.safeParse({
        anchors: [{ query: 'US-101 & Betteravia Rd' }],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('confidence'))).toBe(true)
      }

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-4 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-4-case-2',
          success: result.success,
          confidenceIssue: result.success
            ? false
            : result.error.issues.some((issue) => issue.path.includes('confidence')),
        }),
      )
    })
  })
})
