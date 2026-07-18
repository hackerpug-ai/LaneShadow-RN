/**
 * S4-T3 AC-1 [PRIMARY]: Lever 2 extracts ordered intersection anchors via LLM structured outputs
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Mastra model layer + structured-output provider)
 * FLOW_REF: UC-REC-02
 *
 * Negative control: would fail if anchor extraction is stubbed, LLM returns empty array,
 * or structured outputs / order field are not enforced.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  type AnchorExtractionRouteInput,
  emitAnchorsSchema,
  extractAnchors,
  keepEndpointsOnlyWhenSparse,
} from '../actions/agent/lib/anchorExtraction'
import { getAgentLanguageModel, getAgentModelInfo } from '../actions/agent/lib/models'
import { ANTHROPIC_API_KEY, OPENAI_API_KEY } from '../lib/env'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T3/evidence')

const TEPUSQUET: AnchorExtractionRouteInput = {
  routeId: 'motorcycleroads:twist-of-tepusquet-loop',
  name: 'Twist of Tepusquet Loop',
  state: 'California',
  lengthMiles: 41,
  centroidLat: 34.95,
  centroidLng: -120.42,
  summary:
    'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia Road becomes Foxen Canyon Road. Foxen Canyon Road becomes Santa Maria Mesa Road. Santa Maria Mesa Road merges into Tepusquet Canyon Road. Head North on Tepusquet Canyon Road. Follow this all the way up the mountain and back down until you reach highway 166. Follow 166 West until you reach highway 101 again.',
}

const MINIMAL: AnchorExtractionRouteInput = {
  routeId: 'test:lever2-minimal',
  name: 'Minimal Description',
  state: 'California',
  lengthMiles: 50,
  centroidLat: 37.5,
  centroidLng: -122.0,
  summary: 'Take Highway 1 from San Francisco to Santa Cruz',
}

const hasProviderKey = Boolean(ANTHROPIC_API_KEY || OPENAI_API_KEY)

describe('S4-T3 AC-1: Lever 2 ordered intersection anchors via model-layer structured outputs', () => {
  it('MUST_OBSERVE: model layer exposes getAgentLanguageModel(high) for structured extraction', () => {
    const info = getAgentModelInfo('high')
    expect(info.provider).toBeTruthy()
    expect(info.model).toBeTruthy()
    // Language model factory must exist and return a model object (not a stub string).
    const languageModel = getAgentLanguageModel('high')
    expect(languageModel).toBeTruthy()
    expect(typeof languageModel).toBe('object')
  })

  it('MUST_OBSERVE: emitAnchorsSchema requires ordered anchors (order field)', () => {
    // Missing order must fail schema validation (structured outputs enforce order).
    const withoutOrder = emitAnchorsSchema.safeParse({
      anchors: [{ query: 'Santa Maria, CA', why: 'start' }],
      confidence: 'high',
      roadChain: [],
    })
    expect(withoutOrder.success).toBe(false)

    const withOrder = emitAnchorsSchema.safeParse({
      anchors: [{ query: 'Santa Maria, CA', why: 'start', order: 0 }],
      confidence: 'high',
      roadChain: [],
    })
    expect(withOrder.success).toBe(true)
    if (withOrder.success) {
      expect(withOrder.data.anchors[0].order).toBe(0)
    }
    // Empty anchors must never pass structured-output validation
    const empty = emitAnchorsSchema.safeParse({
      anchors: [],
      confidence: 'high',
      roadChain: [],
    })
    expect(empty.success).toBe(false)
  })

  it('MUST_OBSERVE: sparse start→end description post-normalizes to exactly 2 endpoints', () => {
    const invented = [
      { query: 'San Francisco, CA', why: 'start', order: 0 },
      { query: 'Pacifica, CA', why: 'invented', order: 1 },
      { query: 'Half Moon Bay, CA', why: 'invented', order: 2 },
      { query: 'Santa Cruz, CA', why: 'end', order: 3 },
    ]
    const sparse = keepEndpointsOnlyWhenSparse(
      'Take Highway 1 from San Francisco to Santa Cruz',
      invented,
    )
    expect(sparse).toHaveLength(2)
    expect(sparse[0].query).toMatch(/San Francisco/)
    expect(sparse[1].query).toMatch(/Santa Cruz/)

    // Rich turn-by-turn descriptions keep the full ordered list.
    const rich = keepEndpointsOnlyWhenSparse(
      'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia becomes Foxen Canyon.',
      invented,
    )
    expect(rich).toHaveLength(4)
  })

  describe('CASE 1 — lever2-anchor-extraction-tepusquet', () => {
    if (!hasProviderKey) {
      it.skip('SKIP: no LLM provider key for real structured-output extraction', () => {})
      return
    }

    it('TC-1: extracts >=3 ordered anchors; first contains Santa Maria; order ascending from 0', async () => {
      const result = await extractAnchors(TEPUSQUET)

      expect(result.anchors.length).toBeGreaterThanOrEqual(3)
      expect(result.anchors[0].order).toBe(0)
      // Sorted ascending by order
      for (let i = 1; i < result.anchors.length; i++) {
        expect(result.anchors[i].order).toBeGreaterThan(result.anchors[i - 1].order)
      }
      const firstQuery = result.anchors[0].query
      expect(firstQuery.toLowerCase()).toMatch(/santa maria/)

      mkdirSync(EVIDENCE_DIR, { recursive: true })
      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-1-tepusquet-anchors.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            routeId: TEPUSQUET.routeId,
            anchorsLength: result.anchors.length,
            anchors: result.anchors,
            confidence: result.confidence,
            modelInfo: getAgentModelInfo('high'),
          },
          null,
          2,
        ),
      )
    }, 180_000)
  })

  describe('CASE 2 — lever2-anchor-extraction-minimal', () => {
    if (!hasProviderKey) {
      it.skip('SKIP: no LLM provider key for real structured-output extraction', () => {})
      return
    }

    it('TC-1b: extracts exactly 2 anchors for minimal 2-endpoint description', async () => {
      const result = await extractAnchors(MINIMAL)

      // Contract CASE 2: anchors.length == 2 for the minimal two-endpoint fixture.
      // Product post-normalizes sparse start→end descriptions to keep endpoints only.
      expect(result.anchors.length).toBe(2)
      expect(result.anchors[0].order).toBe(0)
      expect(result.anchors[1].order).toBe(1)
      const queries = result.anchors.map((a) => a.query.toLowerCase()).join(' | ')
      expect(queries).toMatch(/san francisco|sf\b/)
      expect(queries).toMatch(/santa cruz/)

      mkdirSync(EVIDENCE_DIR, { recursive: true })
      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-1-minimal-anchors.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            routeId: MINIMAL.routeId,
            anchorsLength: result.anchors.length,
            anchors: result.anchors,
            contractMustObserve: 'anchors.length == 2',
          },
          null,
          2,
        ),
      )
    }, 180_000)
  })
})
