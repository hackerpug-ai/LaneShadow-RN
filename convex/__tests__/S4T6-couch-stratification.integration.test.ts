/**
 * AC-1 [PRIMARY]: Couch-sample assembler stratifies ~25 routes across
 * scraped_promoted / ai_reconstructed / name_routed.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real couch-sample assembler)
 * FLOW_REF: UC-VER-05
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t6-couch-stratification',
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

describe('AC-1: Couch-sample assembler stratifies ~25 across 3 provenances', () => {
  let sample: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn('couchSampleAssembler:seedCouchFixtures', {}, { identity: true })
    expect(seed.ok, `seedCouchFixtures failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    expect(assemble.ok, `assembleCouchSample failed: ${assemble.stderr}\n${assemble.stdout}`).toBe(
      true,
    )
    sample = JSON.parse(assemble.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-couch-stratified-sample.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
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

  // TC-1 CASE 1 — couch-stratified-sample
  it('MUST_OBSERVE: total routes >= 20 and <= 30 (~25)', () => {
    expect(sample.routes?.length).toBeGreaterThanOrEqual(20)
    expect(sample.routes?.length).toBeLessThanOrEqual(30)
  })

  it('MUST_OBSERVE: scraped_promoted count >= 5', () => {
    const n = (sample.routes ?? []).filter((r: any) => r.provenance === 'scraped_promoted').length
    expect(n).toBeGreaterThanOrEqual(5)
  })

  it('MUST_OBSERVE: ai_reconstructed count >= 5', () => {
    const n = (sample.routes ?? []).filter((r: any) => r.provenance === 'ai_reconstructed').length
    expect(n).toBeGreaterThanOrEqual(5)
  })

  it('MUST_OBSERVE: name_routed count >= 5', () => {
    const n = (sample.routes ?? []).filter((r: any) => r.provenance === 'name_routed').length
    expect(n).toBeGreaterThanOrEqual(5)
  })

  it('MUST_NOT_OBSERVE: any provenance type count == 0', () => {
    const counts = {
      scraped_promoted: 0,
      ai_reconstructed: 0,
      name_routed: 0,
    }
    for (const r of sample.routes ?? []) {
      if (r.provenance in counts) {
        counts[r.provenance as keyof typeof counts] += 1
      }
    }
    expect(counts.scraped_promoted).toBeGreaterThan(0)
    expect(counts.ai_reconstructed).toBeGreaterThan(0)
    expect(counts.name_routed).toBeGreaterThan(0)
  })
})
