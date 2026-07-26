/**
 * REDHAT-FIX-07 AC-2 / TC-2: Minority provenances buried after 500 majority rows.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix07-minority-buried-after-500
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-07/evidence')

const CLERK_USER = 's4t5-redhatfix07-minority'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'motorcycleroads:redhatfix07-minority-'
const SCRAPED_PREFIX = `${PREFIX}scraped-`
const AI_PREFIX = `${PREFIX}ai-`
const NR_PREFIX = `${PREFIX}nr-`

const SCRAPED_N = 500
const AI_N = 15
const NR_N = 12

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
  for (let i = 0; i < 30; i++) {
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
      },
      { identity: true },
    )
    expect(r.ok, `seed failed at ${seeded}: ${r.stderr}\n${r.stdout}`).toBe(true)
    seeded += parseJson(r.stdout)?.count ?? batch
  }
}

describe('REDHAT-FIX-07 AC-2: minority provenances not false-zeroed past 500', () => {
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

    // Majority first (would saturate take(500)), then minority buried after.
    seedPool(SCRAPED_PREFIX, SCRAPED_N, 'scraped_promoted')
    seedPool(AI_PREFIX, AI_N, 'ai_reconstructed')
    seedPool(NR_PREFIX, NR_N, 'name_routed')

    const q = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(q.ok, `coverageReport failed: ${q.stderr}\n${q.stdout}`).toBe(true)
    report = parseJson(q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-minority-not-zero.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          seeded: { scraped: SCRAPED_N, ai: AI_N, nr: NR_N },
          report,
        },
        null,
        2,
      ),
    )
  }, 600_000)

  afterAll(() => {
    purgePrefix(PREFIX)
  }, 300_000)

  it('TC-2: ai_reconstructed=15 and name_routed=12 (never 0) with scraped>=500', () => {
    expect(report?.source).toBe('live')
    expect(report?.livePathSilentTake500).toBe(false)
    expect(report?.exhaustive).toBe(true)

    const scraped = leverByProvenance(report, 'scraped_promoted')
    const ai = leverByProvenance(report, 'ai_reconstructed')
    const nr = leverByProvenance(report, 'name_routed')

    expect(scraped?.candidateCount).toBeGreaterThanOrEqual(SCRAPED_N)
    expect(ai?.candidateCount).toBe(AI_N)
    expect(nr?.candidateCount).toBe(NR_N)
    expect(ai?.candidateCount).not.toBe(0)
    expect(nr?.candidateCount).not.toBe(0)

    expect(report.provenanceCounts?.ai_reconstructed).toBe(AI_N)
    expect(report.provenanceCounts?.name_routed).toBe(NR_N)
  })
})
