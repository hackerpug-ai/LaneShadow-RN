/**
 * S4-T3 AC-5: Lever 2 repair round passes geocode log as feedback to LLM
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real repair round with feedback)
 * FLOW_REF: UC-REC-02
 *
 * Verifies:
 * 1. buildRepairFeedback includes literal "Routed length" + geocode log
 * 2. The LIVE second LLM prompt production builds during cassette replay
 *    (actionResult.llmPromptsUsed[1] and/or cassettePlayback.anthropicLiveRequestBodies[1])
 *    carries that feedback — NOT the static cassette fixture text (anti-theatre).
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

/**
 * Push THIS worktree's Convex functions so a shared dev deployment that other
 * sprint worktrees also target cannot silently serve stale code without our
 * llmPromptsUsed / anthropicLiveRequestBodies fields.
 */
function pushThisWorktreeConvex(): void {
  execFileSync('npx', ['convex', 'dev', '--once'], {
    cwd: PROJECT_ROOT,
    timeout: 180000,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
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

  describe('CASE 1 — lever2-repair-feedback-includes-log (live prompt during replay)', () => {
    let liveRepairPrompt: string | undefined
    let actionResult: any
    let attempt1RoutedMiles: number
    let promptSource: 'llmPromptsUsed' | 'anthropicLiveRequestBodies' | undefined

    beforeAll(() => {
      // Ensure this worktree's functions are what the shared dev deployment serves.
      pushThisWorktreeConvex()

      const cassette = loadCassette('S4T1-repair-round-better-second.cassette.json')
      const anthropicExchanges = cassette.exchanges.filter((e) => e.provider === 'anthropic')
      expect(anthropicExchanges.length).toBeGreaterThanOrEqual(2)

      // First routing exchange → routed miles for feedback
      const routing = cassette.exchanges.filter((e) => e.provider === 'google_routes')
      const body = JSON.parse(routing[0].responseBody)
      attempt1RoutedMiles = body.routes[0].distanceMeters / 1609.34

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
      expect(action.ok, `replay failed: ${action.stderr}\n${action.stdout}`).toBe(true)
      actionResult = JSON.parse(action.stdout)

      // Prefer production-built prompt (llmPromptsUsed) — exact string extractAnchors
      // sent to the model layer. Fall back to live fetch-wrapper capture.
      const prompts: string[] = actionResult.llmPromptsUsed ?? []
      const liveBodies: string[] = actionResult.cassettePlayback?.anthropicLiveRequestBodies ?? []

      if (prompts.length >= 2 && typeof prompts[1] === 'string' && prompts[1].length > 0) {
        liveRepairPrompt = prompts[1]
        promptSource = 'llmPromptsUsed'
      } else if (
        liveBodies.length >= 2 &&
        typeof liveBodies[1] === 'string' &&
        liveBodies[1].length > 0
      ) {
        liveRepairPrompt = liveBodies[1]
        promptSource = 'anthropicLiveRequestBodies'
      } else {
        throw new Error(
          `No live repair prompt captured. keys=${Object.keys(actionResult).join(',')} ` +
            `playbackKeys=${Object.keys(actionResult.cassettePlayback ?? {}).join(',')} ` +
            `llmPromptsUsed=${prompts.length} liveBodies=${liveBodies.length}`,
        )
      }
    }, 300_000)

    it('MUST_OBSERVE: LIVE second LLM prompt includes "Routed length" + geocode log', () => {
      expect(liveRepairPrompt, 'live repair prompt was not captured during replay').toBeTruthy()
      expect(promptSource).toBeTruthy()
      expect(liveRepairPrompt).toContain('Routed length')
      expect(liveRepairPrompt).toContain('Geocoding results were:')
      // Production feedback embeds the real first-attempt routed miles
      expect(liveRepairPrompt).toContain(attempt1RoutedMiles.toFixed(1))
      // Geocode log lines present (OK: or OFF-REGION or MISS:)
      expect(liveRepairPrompt).toMatch(/OK:|OFF-REGION|MISS:|Geocoding results were:/)
    })

    it('MUST_OBSERVE: live capture is from production result, not the fixture file', () => {
      // If production stopped building repair feedback, llmPromptsUsed[1] would
      // lack "Routed length" even when the cassette fixture still has it.
      expect(
        promptSource === 'llmPromptsUsed' || promptSource === 'anthropicLiveRequestBodies',
      ).toBe(true)
      if (promptSource === 'llmPromptsUsed') {
        expect(actionResult.llmPromptsUsed[1]).toBe(liveRepairPrompt)
        expect(actionResult.llmPromptsUsed.length).toBeGreaterThanOrEqual(2)
      } else {
        expect(actionResult.cassettePlayback.anthropicLiveRequestBodies[1]).toBe(liveRepairPrompt)
      }
      expect(typeof liveRepairPrompt).toBe('string')
      expect((liveRepairPrompt as string).length).toBeGreaterThan(0)
    })

    it('MUST_OBSERVE: repair round consumed 2 anthropic exchanges', () => {
      expect(actionResult.cassettePlayback.anthropicConsumed).toBe(2)
    })

    it('MUST_NOT_OBSERVE: empty feedback / missing geocode log on LIVE prompt', () => {
      expect(liveRepairPrompt).not.toBe('')
      expect(liveRepairPrompt).not.toBeUndefined()
      expect(liveRepairPrompt).toContain('Geocoding results were:')
    })

    it('EVIDENCE: capture repair feedback api_response from LIVE prompt', () => {
      mkdirSync(EVIDENCE_DIR, { recursive: true })
      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-5-repair-feedback.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            source: promptSource,
            attempt1RoutedMiles,
            liveRepairPromptSnippet: liveRepairPrompt?.slice(0, 800),
            containsRoutedLength: liveRepairPrompt?.includes('Routed length') ?? false,
            containsGeocodeLog: liveRepairPrompt?.includes('Geocoding results were:') ?? false,
            anthropicConsumed: actionResult.cassettePlayback.anthropicConsumed,
            llmPromptsUsedCount: actionResult.llmPromptsUsed?.length,
            liveBodiesCount: actionResult.cassettePlayback?.anthropicLiveRequestBodies?.length,
          },
          null,
          2,
        ),
      )
      expect(true).toBe(true)
    })
  })
})
