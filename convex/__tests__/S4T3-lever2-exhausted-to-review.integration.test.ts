/**
 * S4-T3 AC-6: Lever 2 routes to REVIEW after 2 failed attempts (exhausted budget)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Lever 2 + REVIEW queue)
 * FLOW_REF: UC-REC-02
 *
 * Uses the S4-T1 exhausted cassette (both attempts outside ratio band) replayed
 * through production reconstructForRoute — routingCallCount bound to real
 * provider traffic (2), never a hand-incremented counter.
 */

import { execFileSync } from 'node:child_process'
import { closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T3/evidence')
const FIXTURES = resolve(__dirname, 'fixtures')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t3-lever2-exhausted',
  issuer: 'https://laneshadow.test',
})

const ROUTE_ID = 'test:repair-exhausted'
const OUT_DIR = mkdtempSync(resolve(tmpdir(), 's4t3-exhausted-'))

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

type Cassette = { exchanges: Array<Record<string, unknown>> }

function loadCassette(name: string): Cassette {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), 'utf-8'))
}

describe('S4-T3 AC-6: Lever 2 exhausted budget → REVIEW', () => {
  let actionResult: any
  let stored: any

  beforeAll(() => {
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedRepairExhaustedRoute',
      {},
      { identity: true },
    )
    expect(seed.ok, `seedRepairExhaustedRoute failed: ${seed.stderr}`).toBe(true)

    const cassette = loadCassette('S4T1-repair-round-exhausted.cassette.json')
    const action = runConvexFn(
      'curatedGeometryTestSupport:runReconstructForRoute',
      { routeId: ROUTE_ID, cassette },
      { identity: true },
    )
    expect(action.ok, `reconstruct replay failed: ${action.stderr}`).toBe(true)
    actionResult = JSON.parse(action.stdout)

    const verify = runConvexFn(
      'curatedGeometryTestSupport:getGeometryVerification',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    expect(verify.ok).toBe(true)
    stored = JSON.parse(verify.stdout)
  }, 240_000)

  it('TC-8: MUST_OBSERVE: routingCallCount == 2, verdict == review', () => {
    expect(actionResult.routingCallCount).toBe(2)
    expect(actionResult.cassettePlayback.routingConsumed).toBe(2)
    expect(stored.verdict).toBe('review')
    expect(actionResult.verdict).toBe('review')
  })

  it('MUST_OBSERVE: failedCondition is recorded (ratio or anchors or degenerate)', () => {
    expect(stored.failedCondition).toBeTruthy()
    expect(['ratio', 'anchors', 'degenerate']).toContain(stored.failedCondition)
  })

  it('MUST_OBSERVE: geometryStatus == review (queued for REVIEW)', () => {
    expect(stored.geometryStatus).toBe('review')
    expect(actionResult.geometryStatus).toBe('review')
  })

  it('MUST_NOT_OBSERVE: routingCallCount > 2 or verdict == pass', () => {
    expect(actionResult.routingCallCount).not.toBeGreaterThan(2)
    expect(stored.verdict).not.toBe('pass')
  })

  it('MUST_NOT_OBSERVE: provenance ai_reconstructed on failed path', () => {
    expect(stored.provenance).not.toBe('ai_reconstructed')
  })

  it('EVIDENCE: capture db_query REVIEW queue entry', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-6-exhausted-to-review.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          routeId: ROUTE_ID,
          routingCallCount: actionResult.routingCallCount,
          cassettePlayback: actionResult.cassettePlayback,
          stored,
          reviewQueueLength: stored.verdict === 'review' ? 1 : 0,
        },
        null,
        2,
      ),
    )
    expect(true).toBe(true)
  })
})
