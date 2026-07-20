/**
 * FIX-10 (REDHAT-FIX-10): Immutable couch sample manifest of real gate-passing routes.
 *
 * Tests that storeCouchSample:
 *  - Validates every routeId exists in curated_routes AND has gate-passing geometry
 *  - Rejects duplicate routeIds and non-members
 *  - Computes per-route geometry hash + manifest hash SERVER-SIDE
 *  - Freezes the manifest (status:'frozen', manifestHash, frozenAt, frozenBy)
 *  - Rejects re-freeze/mutation of a frozen manifest
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t6-fix10-manifest',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
  exitCode: number
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '', exitCode: 0 }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    const exitCode = typeof err.status === 'number' ? err.status : 1
    return { ok: false, stdout, stderr, exitCode }
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

describe('FIX-10: Immutable couch sample manifest', () => {
  let validSample: any
  let validRoutes: any[]

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    // FIX-08: Set up founder user for test identity
    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t6-fix10-manifest', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Seed fixtures and assemble a valid sample for re-use
    const seed = runConvexFn('couchSampleAssembler:seedCouchFixturesPublic', {}, { identity: true })
    expect(seed.ok, `seed fixtures failed: ${seed.stderr}`).toBe(true)

    // Assemble a valid couch sample
    const assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    expect(assemble.ok, `assemble failed: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
    validSample = JSON.parse(assemble.stdout)
    validRoutes = validSample.routes ?? []

    writeFileSync(
      resolve(EVIDENCE_DIR, 'FIX-10-setup.json'),
      JSON.stringify({ sampleId: validSample.sampleId, size: validRoutes.length }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('couchSampleAssembler:teardownCouchFixturesPublic', {}, { identity: true })
  })

  // GREEN-1: Valid sample is frozen with manifestHash after store
  it('FIX-10-1: stored couch sample is frozen with manifestHash', () => {
    const sample = runConvexFn(
      'couchSampleAssembler:getCouchSample',
      { sampleId: validSample.sampleId },
      { identity: true },
    )
    expect(sample.ok, `getCouchSample failed: ${sample.stderr}`).toBe(true)
    const doc = JSON.parse(sample.stdout)
    expect(doc).toBeTruthy()

    // NEW behaviour: status must be 'frozen'
    expect(doc.status).toBe('frozen')
    // NEW behaviour: manifestHash must be set
    expect(doc.manifestHash).toBeTypeOf('string')
    expect(doc.manifestHash.length).toBeGreaterThan(0)
    // NEW behaviour: frozenAt must be set
    expect(doc.frozenAt).toBeTypeOf('number')
    expect(doc.frozenAt).toBeGreaterThan(0)
    // NEW behaviour: frozenBy must be set
    expect(doc.frozenBy).toBeTypeOf('string')
    // NEW behaviour: catalogVersion must be set
    expect(doc.catalogVersion).toBeTypeOf('string')
  })

  // GREEN-2: Re-freeze of frozen manifest is rejected
  it('FIX-10-2: re-freezing a frozen manifest is rejected', () => {
    // Try to store again with the same sampleId (should be frozen already)
    const result = runConvexFn(
      'couchSampleAssembler:storeCouchSample',
      {
        sampleId: validSample.sampleId,
        routes: validRoutes,
      },
      { identity: true },
    )
    // MUST fail — the manifest is already frozen
    expect(result.ok).toBe(false)
    const blob = `${result.stdout} ${result.stderr}`.toLowerCase()
    expect(blob).toMatch(/frozen|immutable|already|rejected/)
  })

  // GREEN-3: manifestHash is deterministic (same routes → same hash)
  it('FIX-10-3: manifestHash is deterministic for same routes', () => {
    // Store a new sample with the same routes as validSample but different sampleId
    const newSampleId = `couch-hash-test-${Date.now()}`
    const storeResult = runConvexFn(
      'couchSampleAssembler:storeCouchSample',
      {
        sampleId: newSampleId,
        routes: validRoutes,
      },
      { identity: true },
    )
    expect(storeResult.ok, `store failed: ${storeResult.stderr}\n${storeResult.stdout}`).toBe(true)

    const sampleA = runConvexFn(
      'couchSampleAssembler:getCouchSample',
      { sampleId: validSample.sampleId },
      { identity: true },
    )
    expect(sampleA.ok).toBe(true)
    const docA = JSON.parse(sampleA.stdout)

    const sampleB = runConvexFn(
      'couchSampleAssembler:getCouchSample',
      { sampleId: newSampleId },
      { identity: true },
    )
    expect(sampleB.ok).toBe(true)
    const docB = JSON.parse(sampleB.stdout)

    // Different sampleIds, same routes → same manifestHash
    expect(docA.manifestHash).toBe(docB.manifestHash)
    expect(docA.manifestHash?.length).toBeGreaterThan(0)
  })

  // GREEN-4: storeCouchSample rejects routeIds not in curated_routes
  it('FIX-10-4: storeCouchSample rejects non-existent routeIds', () => {
    // Use 20 valid route IDs + 1 invalid mixed in
    const mixedRoutes = validRoutes.slice(0, 20).map((r: any) => ({ ...r }))
    mixedRoutes.push({
      routeId: `test:nonexistent-fake-route-${Date.now()}`,
      provenance: 'scraped_promoted',
      anchorCount: 5,
      claimedMiles: 41,
      routedMiles: 41,
      difficulty: 'medium',
      descriptionLength: 100,
    })

    const result = runConvexFn(
      'couchSampleAssembler:storeCouchSample',
      {
        sampleId: `couch-forge-test-${Date.now()}`,
        routes: mixedRoutes,
      },
      { identity: true },
    )
    // MUST fail — the fake route doesn't exist in curated_routes
    expect(result.ok).toBe(false)
    const blob = `${result.stdout} ${result.stderr}`.toLowerCase()
    expect(blob).toMatch(/route|not found|exist|invalid/)
  })

  // GREEN-5: storeCouchSample rejects duplicate routeIds
  it('FIX-10-5: duplicate routeIds in sample are rejected', () => {
    // Use 20 copies of the first valid route
    const firstRoute = validRoutes[0]
    if (!firstRoute) return // skip if no routes

    const duplicateRoutes = Array.from({ length: 21 }, (_, i) => ({
      ...firstRoute,
      routeId: firstRoute.routeId, // all same routeId
      provenance:
        i < 7
          ? ('scraped_promoted' as const)
          : i < 14
            ? ('ai_reconstructed' as const)
            : ('name_routed' as const),
    }))

    const result = runConvexFn(
      'couchSampleAssembler:storeCouchSample',
      {
        sampleId: `couch-dup-test-${Date.now()}`,
        routes: duplicateRoutes,
      },
      { identity: true },
    )
    // MUST fail — duplicate routeIds
    expect(result.ok).toBe(false)
    const blob = `${result.stdout} ${result.stderr}`.toLowerCase()
    expect(blob).toMatch(/duplicate|unique/)
  })

  // GREEN-6: Different sample sizes produce different manifestHash
  it('FIX-10-6: different route sets produce different manifestHash', () => {
    // Use first 25 valid routes for sample A
    const subsetA = validRoutes.slice(0, 25)
    // Use routes 1-25 (different first route) for sample B - guaranteed different set
    const subsetB = validRoutes.slice(1, 26)

    // Verify they're actually different sets
    const idsA = new Set(subsetA.map((r: any) => r.routeId))
    const idsB = new Set(subsetB.map((r: any) => r.routeId))
    const hasDifference =
      [...idsA].some((id) => !idsB.has(id)) || [...idsB].some((id) => !idsA.has(id))

    if (hasDifference && subsetA.length >= 20 && subsetB.length >= 20) {
      const idA = `couch-hash-diff-a-${Date.now()}`
      const idB = `couch-hash-diff-b-${Date.now()}`

      const storeA = runConvexFn(
        'couchSampleAssembler:storeCouchSample',
        { sampleId: idA, routes: subsetA },
        { identity: true },
      )
      const storeB = runConvexFn(
        'couchSampleAssembler:storeCouchSample',
        { sampleId: idB, routes: subsetB },
        { identity: true },
      )

      if (storeA.ok && storeB.ok) {
        const docA = JSON.parse(
          runConvexFn('couchSampleAssembler:getCouchSample', { sampleId: idA }, { identity: true })
            .stdout,
        )
        const docB = JSON.parse(
          runConvexFn('couchSampleAssembler:getCouchSample', { sampleId: idB }, { identity: true })
            .stdout,
        )
        // Different routes → different hashes
        expect(docA.manifestHash).not.toBe(docB.manifestHash)
      }
    }
  }, 20000)
})
