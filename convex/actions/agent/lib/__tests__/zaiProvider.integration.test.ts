import { describe, expect, it } from 'vitest'
import { Z_AI_API_KEY } from '../../../../lib/env'
import {
  createZaiProvider,
  parseZaiFallback,
  zaiStructuredComplete,
  zaiStructuredProofSchema,
} from '../zaiProvider'

// Same real curated-route descriptions proven in S1-T1's anchorExtraction
// fixture set (convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts).
const twistOfTepusquetDescription =
  'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia Road becomes Foxen Canyon Road. Foxen Canyon Road becomes Santa Maria Mesa Road. Santa Maria Mesa Road merges into Tepusquet Canyon Road. Head North on Tepusquet Canyon Road. Follow this all the way up the mountain and back down until you reach highway 166. Follow 166 West until you reach highway 101 again.'

const oldHwy40Description =
  'I-80 to Cisco Grove exit, about 50 miles East of Auburn. Get off, go across the overpass, and turn right on Old Hwy 40. 35 mph, please.Continue to Donner Lake. Make sure to stop at Rainbow Lodge, and Donner Lake vista point, just past historic Rainbow Bridge. Great twisties. Go back the same way, if you like, or continue onto another segment.'

// Captured verbatim from a real z.ai GLM-5.2 completion made during this
// task's own RED-phase implementation, using the real Twist of Tepusquet
// description via buildZaiProofPrompt() and the real createZaiProvider()
// (see .tmp/S2-T6/probe/capture-raw-completion-output.txt for the raw run).
// seed_method: recorded_external — NOT fabricated by the planner.
const CAPTURED_ZAI_RAW_COMPLETION =
  '{"summary": "This route is a scenic loop starting and ending at Highway 101 in Santa Maria, taking riders on a winding mountainous journey through Foxen and Tepusquet Canyons.", "confidence": "high"}'

const hasZaiKey = Boolean(Z_AI_API_KEY)

describe('zaiProvider', () => {
  describe('AC-1: returns a non-empty parsed structured object from a real z.ai GLM-5.2 completion', () => {
    if (!hasZaiKey) {
      it.skip('SKIP: Z_AI_API_KEY is absent — integration test requires real z.ai API', () => {})
      return
    }

    it('returns a non-empty parsed structured object from a real z.ai GLM-5.2 completion', async () => {
      const result = await zaiStructuredComplete(twistOfTepusquetDescription)

      expect(result.ok).toBe(true)
      if (!result.ok) {
        throw new Error(`expected ok result, got failure: ${result.reason}`)
      }
      expect(result.object.summary.length).toBeGreaterThanOrEqual(1)
      expect(['high', 'medium', 'low']).toContain(result.object.confidence)

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-1 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-1',
          ok: result.ok,
          path: result.path,
          summary: result.object.summary,
          confidence: result.object.confidence,
        }),
      )
    }, 120_000)
  })

  describe('AC-2: generalizes to a second real z.ai GLM-5.2 completion and records which path resolved it', () => {
    if (!hasZaiKey) {
      it.skip('SKIP: Z_AI_API_KEY is absent — integration test requires real z.ai API', () => {})
      return
    }

    it('generalizes to a second real z.ai GLM-5.2 completion and records which path resolved it', async () => {
      const result = await zaiStructuredComplete(oldHwy40Description)

      expect(result.ok).toBe(true)
      if (!result.ok) {
        throw new Error(`expected ok result, got failure: ${result.reason}`)
      }
      expect(result.object.summary.length).toBeGreaterThanOrEqual(1)
      expect(['structured', 'text-fallback']).toContain(result.path)

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-2 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-2',
          ok: result.ok,
          path: result.path,
          summary: result.object.summary,
          confidence: result.object.confidence,
        }),
      )
    }, 120_000)
  })

  describe('AC-3: parseZaiFallback extracts and validates a captured real completion, and returns a typed error for malformed text', () => {
    it('parseZaiFallback extracts and validates a captured real completion, and returns a typed error for malformed text', () => {
      // CASE 1 — captured_zai_raw_completion (real, recorded_external)
      const capturedResult = parseZaiFallback(CAPTURED_ZAI_RAW_COMPLETION, zaiStructuredProofSchema)
      expect(capturedResult.ok).toBe(true)
      if (!capturedResult.ok) {
        throw new Error('expected the captured real completion to parse successfully')
      }
      expect(capturedResult.object.summary.length).toBeGreaterThanOrEqual(1)

      // CASE 2 — malformed_proof_completion_texts: non-JSON prose
      const proseResult = parseZaiFallback('not json at all, just prose', zaiStructuredProofSchema)
      expect(proseResult.ok).toBe(false)
      if (proseResult.ok) {
        throw new Error('expected prose input to fail parsing')
      }
      expect(proseResult.reason).toBe('structured_and_fallback_both_failed')

      // CASE 3 — malformed_proof_completion_texts: empty string
      const emptyResult = parseZaiFallback('', zaiStructuredProofSchema)
      expect(emptyResult.ok).toBe(false)
      if (emptyResult.ok) {
        throw new Error('expected empty input to fail parsing')
      }
      expect(emptyResult.reason).toBe('structured_and_fallback_both_failed')

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-3 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-3',
          capturedOk: capturedResult.ok,
          capturedSummaryLength: capturedResult.object.summary.length,
          proseOk: proseResult.ok,
          proseReason: proseResult.ok ? null : proseResult.reason,
          emptyOk: emptyResult.ok,
          emptyReason: emptyResult.ok ? null : emptyResult.reason,
        }),
      )
    })

    it('returns a typed error (not a throw) for truncated/unterminated JSON', () => {
      const truncatedResult = parseZaiFallback(
        '{"summary": "unterminated',
        zaiStructuredProofSchema,
      )
      expect(truncatedResult.ok).toBe(false)
      if (truncatedResult.ok) {
        throw new Error('expected truncated JSON to fail parsing')
      }
      expect(truncatedResult.reason).toBe('structured_and_fallback_both_failed')
    })
  })

  describe('AC-4: createZaiProvider is configured with the z.ai baseURL and reads the apiKey from env.ts', () => {
    it('createZaiProvider is configured with the z.ai baseURL and reads the apiKey from env.ts', () => {
      const { baseURL, apiKey } = createZaiProvider()

      expect(baseURL).toBe('https://api.z.ai/api/coding/paas/v4')
      expect(apiKey).toBe(Z_AI_API_KEY)
      expect(typeof apiKey).toBe('string')
      expect((apiKey ?? '').length).toBeGreaterThan(0)

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation — never
      // log the raw key value, only structural facts about it.
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-4 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-4',
          baseURL,
          apiKeyMatchesEnvExport: apiKey === Z_AI_API_KEY,
          apiKeyIsNonEmptyString: typeof apiKey === 'string' && apiKey.length > 0,
        }),
      )
    })
  })
})
