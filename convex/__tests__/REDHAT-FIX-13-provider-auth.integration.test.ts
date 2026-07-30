/**
 * REDHAT-FIX-13 [PRIMARY integration]: Provider-costing operations must be
 * operator/founder-only, and the failRouteIds simulation control must NOT be
 * accepted on the production classifier entries.
 *
 * Red-hat review 2026-07-20T205905Z (HIGH): runSampleWaterfall, runAllWaterfall,
 * classifyRoute, and classifyCatalog all used only `requireIdentity`, so any
 * signed-in rider could trigger paid Google/LLM recovery or catalog-wide OpenRouter
 * classification, and a caller could manufacture failed/no-evidence outcomes via
 * the public failRouteIds argument.
 *
 * FIX-13: production entries now use `requireOperatorAction`; failRouteIds is
 * removed from classifyRoute/classifyCatalog validators and lives ONLY on the
 * test-only classifyRouteWithFailures / classifyCatalogWithFailures entries,
 * gated by assertTestSubjectOrThrow (the same pattern as FIX-01).
 *
 * This test proves:
 *   (1) a non-operator authenticated identity is FORBIDDEN from provider ops,
 *   (2) the production classifier validators reject failRouteIds, and
 *   (3) an operator identity is NOT forbidden (the gate lets operators through).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-01 / UC-VER-03 (provider-cost boundary)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

// A subject that is NOT a test prefix and has no users-table role → resolves to
// 'rider'. An authenticated rider must be forbidden from provider-costing ops.
const RIDER_IDENTITY = JSON.stringify({
  subject: 's4t13-rider',
  issuer: 'https://laneshadow.test',
})

// A test-prefix subject we bootstrap as operator to prove operators are allowed.
const OPERATOR_IDENTITY = JSON.stringify({
  subject: 'test:s4t13-operator',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  combined: string
}

function runConvex(fn: string, args: Record<string, unknown>, identity: string): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args), '--identity', identity]
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, combined: stdout }
  } catch (err: any) {
    const combined = `${typeof err.stdout === 'string' ? err.stdout : ''}${typeof err.stderr === 'string' ? err.stderr : ''}`
    return { ok: false, combined }
  }
}

describe('REDHAT-FIX-13: provider-costing ops are operator-only; failRouteIds is test-only', () => {
  it('AC-1: non-operator rider is FORBIDDEN from runSampleWaterfall', () => {
    const r = runConvex(
      'waterfallOrchestrator:runSampleWaterfall',
      { routeIds: [] },
      RIDER_IDENTITY,
    )
    expect(r.ok, `rider should be FORBIDDEN, but call succeeded`).toBe(false)
    expect(r.combined).toMatch(/FORBIDDEN|Operator or founder role required/i)
  })

  it('AC-2: non-operator rider is FORBIDDEN from runAllWaterfall', () => {
    const r = runConvex('couchVerdict:runAllWaterfall', { routeIds: [] }, RIDER_IDENTITY)
    expect(r.ok, `rider should be FORBIDDEN, but call succeeded`).toBe(false)
    expect(r.combined).toMatch(/FORBIDDEN|Operator or founder role required/i)
  })

  it('AC-3: non-operator rider is FORBIDDEN from classifyRoute', () => {
    const r = runConvex(
      'actions/rideWorthinessClassifier:classifyRoute',
      { routeId: 's4t13-nope' },
      RIDER_IDENTITY,
    )
    expect(r.ok, `rider should be FORBIDDEN, but call succeeded`).toBe(false)
    expect(r.combined).toMatch(/FORBIDDEN|Operator or founder role required/i)
  })

  it('AC-4: non-operator rider is FORBIDDEN from classifyCatalog', () => {
    const r = runConvex(
      'actions/rideWorthinessClassifier:classifyCatalog',
      { routeIds: ['s4t13-nope'] },
      RIDER_IDENTITY,
    )
    expect(r.ok, `rider should be FORBIDDEN, but call succeeded`).toBe(false)
    expect(r.combined).toMatch(/FORBIDDEN|Operator or founder role required/i)
  })

  it('AC-5: production classifyRoute validator REJECTS failRouteIds', () => {
    // The field is not declared on the production validator → Convex rejects
    // before the handler runs. (Any identity; auth never reached.)
    const r = runConvex(
      'actions/rideWorthinessClassifier:classifyRoute',
      { routeId: 's4t13-nope', failRouteIds: ['s4t13-nope'] },
      RIDER_IDENTITY,
    )
    expect(r.ok, `failRouteIds should be REJECTED by the validator`).toBe(false)
    expect(r.combined).toMatch(/extra field|not in the validator|ArgumentValidationError/i)
  })

  it('AC-6: production classifyCatalog validator REJECTS failRouteIds', () => {
    const r = runConvex(
      'actions/rideWorthinessClassifier:classifyCatalog',
      { routeIds: ['s4t13-nope'], failRouteIds: ['s4t13-nope'] },
      RIDER_IDENTITY,
    )
    expect(r.ok, `failRouteIds should be REJECTED by the validator`).toBe(false)
    expect(r.combined).toMatch(/extra field|not in the validator|ArgumentValidationError/i)
  })

  it('AC-7: an OPERATOR is NOT forbidden from runSampleWaterfall (auth gate passes)', () => {
    // Bootstrap the operator identity (test-prefix subject), then call the
    // waterfall with an empty routeIds array — the auth gate must let the
    // operator through (processed 0, cost 0). A FORBIDDEN here is a regression.
    const setup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t13-operator', role: 'operator' },
      OPERATOR_IDENTITY,
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.combined}`).toBe(true)

    const r = runConvex(
      'waterfallOrchestrator:runSampleWaterfall',
      { routeIds: [] },
      OPERATOR_IDENTITY,
    )
    // The operator must NOT be forbidden. (Empty batch → processed 0; ok=true.)
    expect(r.combined, `operator was unexpectedly FORBIDDEN`).not.toMatch(/FORBIDDEN/)
    expect(r.ok, `operator call should succeed (processed 0), got: ${r.combined}`).toBe(true)
  })
})
