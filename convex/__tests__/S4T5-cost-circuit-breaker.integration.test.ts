/**
 * AC-3: Cost circuit-breaker enforces --max-cost and stops batch when exceeded.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real cost tracking)
 * FLOW_REF: T-REC-019
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-cost-circuit-breaker',
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:s4t5-cost'
const ROUTE_COUNT = 15
const MAX_COST = 0.5
const COST_PER = 0.07

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

describe('AC-3: Cost circuit-breaker enforces max-cost', () => {
  let result: any
  let routeIds: string[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn(
      'waterfallOrchestrator:seedCostBurnRoutes',
      { count: ROUTE_COUNT, prefix: PREFIX },
      { identity: true },
    )
    expect(seed.ok, `seedCostBurnRoutes failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    routeIds = JSON.parse(seed.stdout).seeded as string[]

    const run = runConvexFn(
      'waterfallOrchestrator:runSampleWaterfall',
      {
        routeIds,
        maxCost: MAX_COST,
        costPerReconstruct: COST_PER,
        // Deterministic L2 pass so each route burns exactly COST_PER
        lever2FixedGeometry: {
          routedMiles: 41,
          pointCount: 80,
          anchorCount: 2,
          claimedMiles: 41,
        },
      },
      { identity: true },
    )
    expect(run.ok, `runSampleWaterfall failed: ${run.stderr}\n${run.stdout}`).toBe(true)
    result = JSON.parse(run.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-cost-circuit-breaker.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          maxCost: MAX_COST,
          costPer: COST_PER,
          routeCount: ROUTE_COUNT,
          result,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'waterfallOrchestrator:teardownWaterfallFixtures',
      { prefixes: [PREFIX] },
      { identity: true },
    )
  })

  it('TC-3 MUST_OBSERVE: batchStopReason == cost_exceeded, cost <= max, processed <= 7', () => {
    expect(result.batchStopReason).toBe('cost_exceeded')
    expect(result.totalCostUsd).toBeLessThanOrEqual(MAX_COST)
    expect(result.processed).toBeLessThanOrEqual(7)
    expect(result.processed).toBeGreaterThan(0)
    expect(result.costExceededMessage).toMatch(/cost_exceeded/i)
  })

  it('MUST_NOT_OBSERVE: batch ran to completion', () => {
    expect(result.batchStopReason).not.toBe('completed')
    expect(result.processed).toBeLessThan(ROUTE_COUNT)
  })
})
