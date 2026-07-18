/**
 * AC-2: Couch-sample includes range of reconstruction difficulty
 * (easy anchor-rich + hard sparse-description cases).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real difficulty stratification)
 * FLOW_REF: UC-VER-05
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t6-couch-difficulty',
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
      timeout: 300000,
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

describe('AC-2: Couch-sample includes difficulty range (easy + hard)', () => {
  let sample: any
  let anchorCounts: number[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn('couchSampleAssembler:seedCouchFixtures', {}, { identity: true })
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    expect(assemble.ok, `assemble failed: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
    sample = JSON.parse(assemble.stdout)
    anchorCounts = (sample.routes ?? []).map((r: any) => r.anchorCount as number)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-couch-difficulty-spread.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          anchorCounts,
          min: Math.min(...anchorCounts),
          max: Math.max(...anchorCounts),
          spread: Math.max(...anchorCounts) - Math.min(...anchorCounts),
          sample,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('couchSampleAssembler:teardownCouchFixtures', {}, { identity: true })
  })

  // TC-2 CASE 1 — couch-difficulty-spread
  it('MUST_OBSERVE: min anchor count >= 2', () => {
    expect(Math.min(...anchorCounts)).toBeGreaterThanOrEqual(2)
  })

  it('MUST_OBSERVE: max anchor count >= 7 (easy anchor-rich present)', () => {
    expect(Math.max(...anchorCounts)).toBeGreaterThanOrEqual(7)
  })

  it('MUST_OBSERVE: spread >= 5', () => {
    const spread = Math.max(...anchorCounts) - Math.min(...anchorCounts)
    expect(spread).toBeGreaterThanOrEqual(5)
  })

  it('MUST_NOT_OBSERVE: all routes have same anchor count', () => {
    const unique = new Set(anchorCounts)
    expect(unique.size).toBeGreaterThan(1)
  })
})
