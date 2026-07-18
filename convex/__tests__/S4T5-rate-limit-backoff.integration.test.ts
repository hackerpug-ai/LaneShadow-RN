/**
 * AC-4: Rate-limit + exponential backoff handles Google API errors.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real backoff helper via action)
 * FLOW_REF: T-REC-019
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-rate-limit-backoff',
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

describe('AC-4: Rate-limit exponential backoff', () => {
  let successResult: any
  let exhaustedResult: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    // 4 failures then success → backoff [1,2,4,8], maxRetries 5
    const ok = runConvexFn(
      'waterfallOrchestrator:exerciseRateLimitBackoff',
      { failCount: 4, maxRetries: 5, skipSleep: true },
      { identity: true },
    )
    expect(ok.ok, `exerciseRateLimitBackoff failed: ${ok.stderr}\n${ok.stdout}`).toBe(true)
    successResult = JSON.parse(ok.stdout)

    // 10 failures with maxRetries 5 → exhausted, no infinite retry
    const fail = runConvexFn(
      'waterfallOrchestrator:exerciseRateLimitBackoff',
      { failCount: 10, maxRetries: 5, skipSleep: true },
      { identity: true },
    )
    expect(fail.ok, `exerciseRateLimitBackoff exhausted failed: ${fail.stderr}`).toBe(true)
    exhaustedResult = JSON.parse(fail.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-rate-limit-backoff.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          successResult,
          exhaustedResult,
        },
        null,
        2,
      ),
    )
  }, 60_000)

  it('TC-4 MUST_OBSERVE: backoffDelays == [1,2,4,8] seconds (exponential), max retries == 5', () => {
    expect(successResult.maxRetries).toBe(5)
    expect(successResult.schedule).toEqual([1, 2, 4, 8])
    expect(successResult.backoffDelays).toEqual([1, 2, 4, 8])
    expect(successResult.success).toBe(true)
    expect(successResult.attempts).toBe(5)
  })

  it('MUST_NOT_OBSERVE: no backoff, infinite retries', () => {
    expect(successResult.backoffDelays.length).toBeGreaterThan(0)
    expect(exhaustedResult.success).toBe(false)
    expect(exhaustedResult.attempts).toBe(5)
    expect(exhaustedResult.attempts).toBeLessThanOrEqual(5)
  })
})
