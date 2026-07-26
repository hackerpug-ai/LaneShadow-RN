/**
 * REDHAT-FIX-07 AC-1 / TC-1: Exhaustive lever candidateCount when N>500.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix07-oversized-generated-bucket
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-07/evidence')

const CLERK_USER = 's4t5-redhatfix07-over500'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'motorcycleroads:redhatfix07-gen-scraped-'
const SEEDED = 520

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
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
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

function parseJson(stdout: string): any {
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

function leverByProvenance(report: any, provenance: string) {
  const levers = Array.isArray(report?.levers) ? report.levers : []
  return levers.find((l: any) => l.provenance === provenance) ?? null
}

function purgePrefix(prefix: string) {
  for (let i = 0; i < 20; i++) {
    const r = runConvexFn(
      'curatedGeometry:purgeRoutesByPrefix',
      { prefix, limit: 100 },
      { identity: true },
    )
    if (!r.ok) break
    const body = parseJson(r.stdout)
    if (!body?.more && (body?.count ?? 0) === 0) break
    if (!body?.more) break
  }
}

function seedPool(prefix: string, count: number, provenance: string) {
  let seeded = 0
  while (seeded < count) {
    const batch = Math.min(100, count - seeded)
    const r = runConvexFn(
      'curatedGeometry:seedRedhatFix07CoveragePool',
      {
        prefix,
        startIndex: seeded + 1,
        count: batch,
        geometryStatus: 'generated',
        geometryProvenance: provenance,
        riderReady: false,
      },
      { identity: true },
    )
    expect(r.ok, `seed batch failed at ${seeded}: ${r.stderr}\n${r.stdout}`).toBe(true)
    const body = parseJson(r.stdout)
    seeded += body?.count ?? batch
  }
  return seeded
}

describe('REDHAT-FIX-07 AC-1: exhaustive lever candidateCount when N>500', () => {
  let report: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    purgePrefix(PREFIX)
    const seeded = seedPool(PREFIX, SEEDED, 'scraped_promoted')
    expect(seeded).toBe(SEEDED)

    const q = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(q.ok, `coverageReport failed: ${q.stderr}\n${q.stdout}`).toBe(true)
    report = parseJson(q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-exhaustive-over-500.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), seeded: SEEDED, report }, null, 2),
    )
  }, 600_000)

  afterAll(() => {
    purgePrefix(PREFIX)
  }, 300_000)

  it('TC-1: Live coverageReport returns scraped_promoted candidateCount == 520 when 520 generated rows seeded', () => {
    expect(report).toBeTruthy()
    expect(report.source).toBe('live')
    expect(report.completeness).toBe('scan_not_batch')
    expect(report.livePathSilentTake500).toBe(false)
    expect(report.exhaustive).toBe(true)

    const scraped = leverByProvenance(report, 'scraped_promoted')
    expect(scraped, 'scraped_promoted lever missing').toBeTruthy()
    expect(scraped.candidateCount).toBe(SEEDED)
    expect(scraped.candidateCount).not.toBe(500)
    expect(scraped.candidateCount).not.toBe(0)

    expect(report.terminalStates?.generated ?? 0).toBeGreaterThanOrEqual(SEEDED)
    expect(Array.isArray(report.levers) && report.levers.length > 0).toBe(true)
  })
})
