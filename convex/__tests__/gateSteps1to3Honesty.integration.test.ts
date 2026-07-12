/**
 * REDHAT-FIX-003 — Gate steps 1–3 honesty (H3 re-read theatre).
 *
 * AC-2: distinct cmd_sha and command classes for steps 1–3 in gate-plan.json
 * AC-4: synthetic re-read-only package must fail honesty check
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: gate-plan.json + scripts/gate-steps-1-3-honesty.mjs
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  cmdSha,
  commandClass,
  evaluateGateSteps1to3Honesty,
} from '../../scripts/gate-steps-1-3-honesty.mjs'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const GATE_PLAN_PATH = resolve(
  PROJECT_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json',
)

const POC_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'
const RE_READ_CMD = `npx convex run curatedGeometryReconstruct:getVerificationForRoute '{"routeId":"${POC_ROUTE_ID}"}'`

function loadGatePlan(): { steps: Array<{ n: number; literal_cmd?: string | null }> } {
  return JSON.parse(readFileSync(GATE_PLAN_PATH, 'utf-8'))
}

describe('gate steps 1–3 honesty (REDHAT-FIX-003)', () => {
  it('distinct cmd_sha and command classes under honest gate-plan', () => {
    const plan = loadGatePlan()
    const step1 = plan.steps.find((s) => s.n === 1)
    const step2 = plan.steps.find((s) => s.n === 2)
    const step3 = plan.steps.find((s) => s.n === 3)

    expect(step1?.literal_cmd).toBeTruthy()
    expect(step2?.literal_cmd).toBeTruthy()
    expect(step3?.literal_cmd).toBeTruthy()

    const hash1 = cmdSha(step1!.literal_cmd!)
    const hash2 = cmdSha(step2!.literal_cmd!)
    const hash3 = cmdSha(step3!.literal_cmd!)

    expect(hash1).not.toBeNull()
    expect(hash2).not.toBeNull()
    expect(hash3).not.toBeNull()
    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hash3)
    expect(hash2).not.toBe(hash3)

    expect(commandClass(step1!.literal_cmd)).toBe('reconstructForRoute')

    const evaluation = evaluateGateSteps1to3Honesty(plan)
    expect(evaluation.verdict).toBe('pass')
    expect(evaluation.reasons).toEqual([])
  })

  it('re-read theatre package fails honesty check citing reconstruct or shared cmd_sha', () => {
    const reReadTheatrePackage = {
      steps: [
        { n: 1, literal_cmd: RE_READ_CMD },
        { n: 2, literal_cmd: RE_READ_CMD },
        { n: 3, literal_cmd: RE_READ_CMD },
      ],
    }

    const evaluation = evaluateGateSteps1to3Honesty(reReadTheatrePackage)
    expect(evaluation.verdict).toBe('fail')
    const joined = evaluation.reasons.join(' ').toLowerCase()
    expect(
      joined.includes('re-read') ||
        joined.includes('reconstructforroute') ||
        joined.includes('shared cmd_sha'),
    ).toBe(true)
  })
})
