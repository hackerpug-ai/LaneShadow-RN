/**
 * AC-5: Lever 3 deterministic parser extracts A-to-B and road-name structures without LLM
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real deterministic parser, no LLM)
 * FLOW_REF: UC-REC-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { parseRouteEndpoints, parseRouteName } from '../lib/endpointParser'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t2-parser-test',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
  }
}

function runConvexFn(
  fn: string,
  args: Record<string, unknown> = {},
  opts: { identity?: boolean } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd)
}

describe('AC-5: Lever 3 deterministic parser (no LLM)', () => {
  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
  })

  // TC-7
  describe('TC-7: parser does not call LLM', () => {
    it('CASE from-to: endpoints are [San Francisco, Santa Cruz]', () => {
      const local = parseRouteName('from San Francisco to Santa Cruz')
      expect(local?.kind).toBe('ato_b')
      if (local?.kind === 'ato_b') {
        expect(local.endpoints).toEqual(['San Francisco', 'Santa Cruz'])
        expect(local.usedLlm).toBe(false)
      }

      // Also via live Convex query surface
      const remote = runConvexFn(
        'curatedGeometryReconstruct:parseRouteNameStructure',
        { name: 'from San Francisco to Santa Cruz' },
        { identity: true },
      )
      expect(remote.ok, `parse failed: ${remote.stderr}\n${remote.stdout}`).toBe(true)
      const data = JSON.parse(remote.stdout)
      expect(data.kind).toBe('ato_b')
      expect(data.endpoints).toEqual(['San Francisco', 'Santa Cruz'])
      expect(data.llmCallCount).toBe(0)
      expect(data.usedLlm).toBe(false)

      writeFileSync(
        resolve(EVIDENCE_DIR, 'ac5-parser-from-to.json'),
        JSON.stringify({ local, remote: data }, null, 2),
      )
    })

    it('CASE highway: highwayNumber=680, region=Alameda County', () => {
      const local = parseRouteName('Route 680 — Alameda County')
      expect(local?.kind).toBe('highway')
      if (local?.kind === 'highway') {
        expect(local.highwayNumber).toBe('680')
        expect(local.region).toBe('Alameda County')
        expect(local.usedLlm).toBe(false)
      }

      const remote = runConvexFn(
        'curatedGeometryReconstruct:parseRouteNameStructure',
        { name: 'Route 680 — Alameda County' },
        { identity: true },
      )
      expect(remote.ok, `parse failed: ${remote.stderr}\n${remote.stdout}`).toBe(true)
      const data = JSON.parse(remote.stdout)
      expect(data.kind).toBe('highway')
      expect(data.highwayNumber).toBe('680')
      expect(data.region).toBe('Alameda County')
      expect(data.llmCallCount).toBe(0)

      writeFileSync(
        resolve(EVIDENCE_DIR, 'ac5-parser-highway.json'),
        JSON.stringify({ local, remote: data }, null, 2),
      )
    })

    it('A-to-B with trailing description keeps endpoints', () => {
      const local = parseRouteName('San Francisco to Santa Cruz — Coastal Run')
      expect(local?.kind).toBe('ato_b')
      if (local?.kind === 'ato_b') {
        expect(local.endpoints[0]).toBe('San Francisco')
        expect(local.endpoints[1]).toBe('Santa Cruz')
      }
    })

    it('parseRouteEndpoints back-compat returns tuple', () => {
      expect(parseRouteEndpoints('Naples to Key West')).toEqual(['Naples', 'Key West'])
      expect(parseRouteEndpoints('Cherohala Skyway')).toBeNull()
    })
  })
})
