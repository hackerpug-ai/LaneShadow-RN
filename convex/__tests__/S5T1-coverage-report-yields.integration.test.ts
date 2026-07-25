/**
 * AC-2: coverageReport compares realized yields to PRD assumptions (not targets).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04 AC-7
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t1-yields',
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:s5t1-lever'
const EXTRA_PREFIXES = ['test:s5t1-not-a-ride', 'test:s5t1-shadow-dup']

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
    return {
      ok: false,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : '',
    }
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

describe('AC-2: coverageReport realized yields vs PRD assumptions', () => {
  let report: any
  let seedResult: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t1-yields', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn('curatedGeometry:seedS5T1MixedProvenanceBatch', {}, { identity: true })
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    seedResult = JSON.parse(seed.stdout)

    const rep = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIds: seedResult.seeded as string[] },
      { identity: true },
    )
    expect(rep.ok, `coverageReport failed: ${rep.stderr}\n${rep.stdout}`).toBe(true)
    report = JSON.parse(rep.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-coverage-report-yields.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), seedResult, report }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { prefixes: [PREFIX, ...EXTRA_PREFIXES, 'test:s5t1-'] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: each lever has candidates, passCount, realizedRate, and PRD assumption labels', () => {
    expect(Array.isArray(report.levers)).toBe(true)
    expect(report.levers.length).toBeGreaterThanOrEqual(3)

    const byKey = (name: string) =>
      report.levers.find(
        (l: any) =>
          l.lever === name ||
          l.leverName === name ||
          l.provenance === name ||
          String(l.leverNumber) === name,
      )

    const lever1 =
      byKey('promote') ||
      byKey('scraped_promoted') ||
      report.levers.find((l: any) => l.leverNumber === 1)
    const lever2 =
      byKey('reconstruct') ||
      byKey('ai_reconstructed') ||
      report.levers.find((l: any) => l.leverNumber === 2)
    const lever3 =
      byKey('reroute') ||
      byKey('name_routed') ||
      byKey('rescue') ||
      report.levers.find((l: any) => l.leverNumber === 3)

    expect(lever1).toBeTruthy()
    expect(lever2).toBeTruthy()
    expect(lever3).toBeTruthy()

    for (const lever of [lever1, lever2, lever3]) {
      expect(lever.candidateCount).toBeGreaterThanOrEqual(1)
      expect(typeof lever.passCount).toBe('number')
      expect(lever.passCount).toBeGreaterThanOrEqual(0)
      expect(typeof lever.realizedRate).toBe('number')
    }

    expect(lever1.assumptionLabel).toBe('unproven')
    expect(String(lever2.assumptionLabel)).toMatch(/~67%/)
    expect(String(lever3.assumptionLabel)).toMatch(/~40-55%/)

    // Assumptions are labeled, not committed targets
    expect(lever2.assumptionIsTarget).not.toBe(true)
    expect(lever2.committedTarget).toBeUndefined()
  })

  it('MUST_OBSERVE: riderReadyCount equals gated rows (not raw generated count)', () => {
    expect(typeof report.riderReadyCount).toBe('number')
    // Seeded: 3 PASS ready + not_a_ride + shadow must NOT count
    expect(report.riderReadyCount).toBe(seedResult.expectedRiderReadyCount)
    expect(report.riderReadyCount).toBeLessThan(seedResult.generatedCount)
  })

  it('MUST_NOT_OBSERVE: not_a_ride or shadow counted as riderReady; lever1 missing unproven label', () => {
    const lever1 = report.levers.find((l: any) => l.leverNumber === 1 || l.lever === 'promote')
    expect(lever1?.assumptionLabel).toBe('unproven')
    expect(report.negativeControl?.notARideRiderReady).not.toBe(true)
    expect(report.negativeControl?.shadowRiderReady).not.toBe(true)
    // explicit: seeded non-ready routes excluded
    expect(report.riderReadyCount).toBe(3)
  })
})
