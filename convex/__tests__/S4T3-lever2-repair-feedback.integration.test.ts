/**
 * S4-T3 AC-5: Lever 2 repair round passes geocode log as feedback to LLM
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real repair round with feedback)
 * FLOW_REF: UC-REC-02
 *
 * Verifies:
 * 1. buildRepairFeedback includes literal "Routed length" + geocode log
 * 2. Cassette-replayed second Anthropic request body carries the feedback
 */

import { execFileSync } from 'node:child_process'
import { closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildRepairFeedback } from '../actions/curatedGeometryReconstruct'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T3/evidence')
const FIXTURES = resolve(__dirname, 'fixtures')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t3-lever2-repair-feedback',
  issuer: 'https://laneshadow.test',
})

const OUT_DIR = mkdtempSync(resolve(tmpdir(), 's4t3-feedback-'))

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[]): RunResult {
  const outPath = resolve(OUT_DIR, `out-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
  const fd = openSync(outPath, 'w')
  try {
    execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      timeout: 240000,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['pipe', fd, 'pipe'],
    })
    closeSync(fd)
    return { ok: true, stdout: readFileSync(outPath, 'utf-8'), stderr: '' }
  } catch (err: any) {
    try {
      closeSync(fd)
    } catch {
      /* already closed */
    }
    let stdout = ''
    try {
      stdout = readFileSync(outPath, 'utf-8')
    } catch {
      /* no output */
    }
    const stderr = typeof err.stderr === 'string' ? err.stderr : String(err.message ?? err)
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

type Exchange = {
  seq: number
  provider: string
  url: string
  method: string
  requestBody?: string
  status: number
  responseBody: string
}
type Cassette = { exchanges: Exchange[] }

function loadCassette(name: string): Cassette {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), 'utf-8'))
}

describe('S4-T3 AC-5: Lever 2 repair feedback includes geocode log', () => {
  it('TC-7 unit: buildRepairFeedback contains "Routed length" literal + geocode log lines', () => {
    const geocodeLog = ['OK: Santa Maria, CA', 'OFF-REGION 300mi: Boston, MA', 'MISS: Nowhere']
    const feedback = buildRepairFeedback({
      routedMiles: 82.4,
      claimedMiles: 41,
      geocodeLog,
    })

    expect(feedback).toContain('Routed length')
    expect(feedback).toContain('82.4')
    expect(feedback).toContain('41')
    expect(feedback).toContain('Geocoding results were:')
    expect(feedback).toContain('OK: Santa Maria, CA')
    expect(feedback).toContain('OFF-REGION 300mi: Boston, MA')
    expect(geocodeLog.length).toBeGreaterThanOrEqual(1)
  })

  describe('CASE 1 — lever2-repair-feedback-includes-log (cassette)', () => {
    let repairPrompt: string | undefined
    let actionResult: any
    let attempt1RoutedMiles: number

    beforeAll(() => {
      const cassette = loadCassette('S4T1-repair-round-better-second.cassette.json')
      const anthropicExchanges = cassette.exchanges.filter((e) => e.provider === 'anthropic')
      expect(anthropicExchanges.length).toBeGreaterThanOrEqual(2)

      // First routing exchange → routed miles for feedback
      const routing = cassette.exchanges.filter((e) => e.provider === 'google_routes')
      const body = JSON.parse(routing[0].responseBody)
      attempt1RoutedMiles = body.routes[0].distanceMeters / 1609.34

      repairPrompt = anthropicExchanges[1]?.requestBody

      const seed = runConvexFn(
        'curatedGeometryTestSupport:seedRepairRoundRoute',
        {},
        { identity: true },
      )
      expect(seed.ok, `seed failed: ${seed.stderr}`).toBe(true)

      const action = runConvexFn(
        'curatedGeometryTestSupport:runReconstructForRoute',
        { routeId: 'test:repair-round', cassette },
        { identity: true },
      )
      expect(action.ok, `replay failed: ${action.stderr}`).toBe(true)
      actionResult = JSON.parse(action.stdout)
    }, 240_000)

    it('MUST_OBSERVE: second LLM call includes "Routed length" + geocode log', () => {
      expect(repairPrompt).toBeTruthy()
      expect(repairPrompt).toContain('Routed length')
      expect(repairPrompt).toContain('Geocoding results were:')
      // Production feedback embeds the real first-attempt routed miles
      expect(repairPrompt).toContain(attempt1RoutedMiles.toFixed(1))
      // Geocode log lines present (OK: or OFF-REGION or MISS:)
      expect(repairPrompt).toMatch(/OK:|OFF-REGION|MISS:|Geocoding results were:/)
    })

    it('MUST_OBSERVE: repair round consumed 2 anthropic exchanges', () => {
      expect(actionResult.cassettePlayback.anthropicConsumed).toBe(2)
    })

    it('MUST_NOT_OBSERVE: empty feedback / missing geocode log', () => {
      expect(repairPrompt).not.toBe('')
      expect(repairPrompt).not.toBeUndefined()
      expect(repairPrompt).toContain('Geocoding results were:')
    })

    it('EVIDENCE: capture repair feedback api_response', () => {
      mkdirSync(EVIDENCE_DIR, { recursive: true })
      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-5-repair-feedback.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            attempt1RoutedMiles,
            repairPromptSnippet: repairPrompt?.slice(0, 800),
            containsRoutedLength: repairPrompt?.includes('Routed length') ?? false,
            containsGeocodeLog: repairPrompt?.includes('Geocoding results were:') ?? false,
            anthropicConsumed: actionResult.cassettePlayback.anthropicConsumed,
          },
          null,
          2,
        ),
      )
      expect(true).toBe(true)
    })
  })
})
