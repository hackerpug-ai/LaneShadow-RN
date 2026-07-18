/**
 * AC-6 [PRIMARY]: Classifier uses different provider than anchor extraction (decorrelation)
 *
 * GIVEN anchor extraction uses OpenAI gpt-4.1 (models.ts MODEL_MAP.high)
 * WHEN ride-worthiness classifier is invoked
 * THEN provider stamp is z.ai-glm-5.2 (different from anchors)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real z.ai GLM-5.2 vs OpenAI gpt-4.1 anchors)
 * FLOW_REF: UC-VER-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T4/evidence')
const ROUTE_ID = 'test:ver-decorrelate-1'

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t4-cross-provider-decorrelation-test',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[], timeoutMs = 180_000): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: timeoutMs,
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
  opts: { identity?: boolean; timeoutMs?: number } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd, opts.timeoutMs ?? 180_000)
}

describe('AC-6: Cross-provider decorrelation (z.ai vs gpt-4.1 anchors)', () => {
  let classifyResult: any
  let route: any
  let modelsSource: string
  let classifierSource: string

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    modelsSource = readFileSync(
      resolve(PROJECT_ROOT, 'convex/actions/agent/lib/models.ts'),
      'utf-8',
    )
    classifierSource = readFileSync(
      resolve(PROJECT_ROOT, 'convex/actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    console.log('🌱 Seeding dedicated decorrelation route...')
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedDecorrelationRoute',
      {},
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    console.log('🤖 Classifying with real z.ai GLM-5.2...')
    const classify = runConvexFn(
      'actions/rideWorthinessClassifier:classifyRoute',
      { routeId: ROUTE_ID },
      { identity: true, timeoutMs: 180_000 },
    )
    expect(classify.ok, `classifyRoute failed: ${classify.stderr}\n${classify.stdout}`).toBe(true)
    classifyResult = JSON.parse(classify.stdout)

    const routeResult = runConvexFn(
      'curatedGeometryTestSupport:getTestRoute',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    expect(routeResult.ok).toBe(true)
    route = JSON.parse(routeResult.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-6-cross-provider-decorrelation.json'),
      JSON.stringify(
        {
          ac: 'AC-6',
          classifyResult,
          storedModel: route.rideWorthiness?.model,
          anchorHighModel: 'gpt-4.1',
        },
        null,
        2,
      ),
    )
  }, 240_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownS4T4TestRoutes',
      { routeIds: [ROUTE_ID] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: anchor extraction high tier is gpt-4.1', () => {
    // models.ts MODEL_MAP.high → openai gpt-4.1
    expect(modelsSource).toMatch(/high:\s*\{\s*provider:\s*'openai',\s*model:\s*'gpt-4\.1'/)
  })

  it('MUST_OBSERVE: classifier source stamps zai-glm-5.2 / z.ai-glm-5.2', () => {
    expect(classifierSource).toMatch(/zai-glm-5\.2/)
    expect(classifierSource).toMatch(/z\.ai-glm-5\.2/)
  })

  it('MUST_OBSERVE: stored rideWorthiness.model contains z.ai or glm-5.2', () => {
    const model = route.rideWorthiness?.model ?? ''
    expect(model).toBeTruthy()
    const looksLikeZai =
      model.includes('z.ai') || model.includes('glm-5.2') || model.includes('zai')
    expect(looksLikeZai).toBe(true)
  })

  it('MUST_OBSERVE: provider stamp differs from anchor gpt-4.1', () => {
    expect(route.rideWorthiness?.model).not.toBe('gpt-4.1')
    expect(classifyResult.model).not.toBe('gpt-4.1')
    expect(classifyResult.model).toBe('z.ai-glm-5.2')
  })

  it('MUST_NOT_OBSERVE: missing provider stamp (decorrelation unverifiable)', () => {
    expect(route.rideWorthiness?.model).toBeTruthy()
    expect(typeof route.rideWorthiness.model).toBe('string')
    expect(route.rideWorthiness.model.length).toBeGreaterThan(0)
  })
})
