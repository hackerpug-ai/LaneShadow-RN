/**
 * REDHAT-FIX-09: Durable founder acceptance gate evidence integrity.
 *
 * Verifies committed Sprint 05 gate artifacts for a fresh runFullBatch runId:
 * - real entrypoints only (no fictional symbols in operational evidence)
 * - founder identity + legitimate escalation_required → resolve path
 * - step-7 row-level candidates + step-8 unretire before/after
 * - written_at_commit resolves gate-results via git show (when committed)
 *
 * UNIT_TEST_JUSTIFIED: pure file/git oracle checks over committed evidence
 * produced by real Convex public_api seeds (no I/O mocks).
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const SPRINT = join(
  ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement',
)
const GATE_RESULTS = join(SPRINT, 'gate-results.json')
const GOAL_STATE = join(SPRINT, 'sprint-goal-state.json')
const LOGS = join(SPRINT, 'gate-logs')
const EVIDENCE = join(SPRINT, 'evidence/REDHAT-FIX-09')
const TMP_S5T4 = join(ROOT, '.tmp/S5-T4')

const REJECTED_RUN_ID = 's5-full-batch-redhatfix07-20260725T075100Z'
// Build pattern without embedding banned identifiers as contiguous source tokens.
const FICTIONAL = new RegExp(
  ['runFull', 'BatchAll'].join('') + '|' + ['coverageReport', 'LivePublic'].join(''),
)

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
}

function scanOperationalForFictional(): string[] {
  const hits: string[] = []
  const roots = [
    join(ROOT, 'convex'),
    join(ROOT, 'scripts'),
    LOGS,
    GATE_RESULTS,
    GOAL_STATE,
    EVIDENCE,
  ]
  const walk = (p: string) => {
    if (!existsSync(p)) return
    const st = statSync(p)
    if (st.isFile()) {
      if (!/\.(ts|tsx|js|mjs|json|log|md|txt)$/.test(p)) return
      // Task expansion drafts / FIX task prose may quote the ban; skip those.
      if (/REDHAT-FIX-\d{2}-.+\.md$/.test(p) || /S5-T\d-.+\.md$/.test(p)) return
      // This test file constructs the banned pattern intentionally.
      if (p.endsWith('REDHATFIX09-durable-founder-gate.integration.test.ts')) return
      const text = readFileSync(p, 'utf-8')
      if (FICTIONAL.test(text)) hits.push(p)
      return
    }
    if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        if (name === 'node_modules' || name === '_generated') continue
        walk(join(p, name))
      }
    }
  }
  for (const r of roots) walk(r)
  return hits
}

describe('REDHAT-FIX-09 durable founder acceptance gate evidence', () => {
  it('AC-1/AC-3: gate-results uses fresh runId (not rejected) and 8 step logs', () => {
    expect(existsSync(GATE_RESULTS)).toBe(true)
    const gr = readJson(GATE_RESULTS)
    const runId = String(gr.run_id ?? '')
    expect(runId).toMatch(/^s5-full-batch-redhatfix09-/)
    expect(runId).not.toBe(REJECTED_RUN_ID)
    expect(gr.verdict).toBe('pass')
    expect(gr.steps_passed).toBe(8)
    for (let n = 1; n <= 8; n++) {
      const log = join(LOGS, `step-${n}.log`)
      expect(existsSync(log), `missing ${log}`).toBe(true)
      expect(statSync(log).size).toBeGreaterThan(0)
    }
  })

  it('AC-1: step-1 uses waterfallOrchestrator:runFullBatch with runFullBatch provenance', () => {
    const s1 = readJson(join(LOGS, 'step-1.log'))
    expect(s1.function).toBe('waterfallOrchestrator:runFullBatch')
    expect(String(s1.function)).not.toMatch(FICTIONAL)
    const prov = s1.reportProvenance as { producedBy?: string }
    expect(prov?.producedBy).toBe('runFullBatch')
    expect(String(s1.runId)).toMatch(/^s5-full-batch-redhatfix09-/)
    expect(s1.isDone).toBe(true)
  })

  it('AC-1: step-1 is cost-bearing (processed>=1 and totalCostUSD>0) — rejects skip-all theatre', () => {
    const s1 = readJson(join(LOGS, 'step-1.log'))
    const processed = Number(s1.processed ?? 0)
    const totalCostUSD = Number(s1.totalCostUSD ?? 0)
    const cumulativeCostUSD = Number(s1.cumulativeCostUSD ?? 0)
    const pageTotals = (s1.pageTotals as Array<Record<string, unknown>>) ?? []
    const pageCost = pageTotals.reduce((sum, p) => sum + Number(p.totalCostUsd ?? 0), 0)
    // Real lever work must have run — processed=0 + cost=0 is FIX-01 degenerate theatre.
    expect(processed).toBeGreaterThanOrEqual(1)
    expect(totalCostUSD > 0 || cumulativeCostUSD > 0 || pageCost > 0).toBe(true)
    expect(processed === 0 && totalCostUSD === 0).toBe(false)
    const mo = s1.must_observe as Record<string, unknown> | undefined
    if (mo) {
      expect(mo.totalCostUSD_gt_0).toBe(true)
      expect(mo.processed_gte_1).toBe(true)
      expect(mo.not_skip_all_theatre).toBe(true)
    }
  })

  it('AC-1: step-2 persisted coverageReport has source=persisted + provenance', () => {
    const s2 = readJson(join(LOGS, 'step-2.log'))
    const persisted = s2.persisted as Record<string, unknown>
    expect(persisted?.source).toBe('persisted')
    const rp = persisted?.reportProvenance as { producedBy?: string }
    expect(rp?.producedBy).toBe('runFullBatch')
    expect(Number(persisted?.totalCostUSD ?? 0)).toBeGreaterThan(0)
    const mo = s2.must_observe as Record<string, unknown>
    expect(mo?.persisted_source).toBe(true)
    expect(mo?.producedBy_runFullBatch).toBe(true)
  })

  it('AC-2: step-3 records real founder identity and escalation→resolve path', () => {
    const s3 = readJson(join(LOGS, 'step-3.log'))
    const req = s3.requestBatchAcceptance as Record<string, unknown>
    const resolve = s3.resolveBatchEscalation as Record<string, unknown>
    const get = s3.getBatchAcceptance as Record<string, unknown>
    expect(req.decision).toBe('escalation_required')
    expect(resolve.decision).toBe('accepted')
    expect(get.decision).toBe('accepted')
    const op = String(get.operatorIdentity ?? '')
    expect(op.length).toBeGreaterThan(3)
    expect(op).not.toMatch(/^s4t5-/)
    expect(op).not.toBe('s4t5-redhatfix07-operator')
    expect(String(get.decisionTimestamp)).toMatch(/^20\d{2}-\d{2}-\d{2}T/)
    expect(get.retirementUnlockedAt == null).toBe(false)
    expect(String(get.retirementUnlockedAt).length).toBeGreaterThan(5)
  })

  it('AC-2: step-4 negative control shows escalation_required not silent accept', () => {
    const s3 = readFileSync(join(LOGS, 'step-3.log'), 'utf-8')
    const s4 = readFileSync(join(LOGS, 'step-4.log'), 'utf-8')
    expect(s3).not.toEqual(s4)
    const step4 = JSON.parse(s4) as Record<string, unknown>
    expect(step4.requestDecision).toBe('escalation_required')
    expect(step4.observed).toBe(true)
  })

  it('AC-5: step-7 has row-level candidates with reasons; step-8 unretire transcript', () => {
    const s7 = readJson(join(LOGS, 'step-7.log'))
    const cands = (s7.candidates as unknown[]) ?? []
    expect(Number(s7.step7_candidate_row_count)).toBeGreaterThanOrEqual(1)
    expect(cands.length).toBeGreaterThanOrEqual(1)
    expect(Number(s7.step7_reason_count)).toBeGreaterThanOrEqual(1)
    const first = cands[0] as Record<string, unknown>
    expect(String(first.routeId).length).toBeGreaterThan(3)
    expect(Array.isArray(first.leverFailureReasons)).toBe(true)

    const s8 = readJson(join(LOGS, 'step-8.log'))
    const transcript = s8.transcript as Record<string, unknown>
    expect(transcript.reversible).toBe(true)
    expect(transcript.autoRetire).toBe(false)
    const before = transcript.before as Record<string, unknown>
    const mid = transcript.mid as Record<string, unknown>
    const after = transcript.after as Record<string, unknown>
    expect(before.retiredAt).toBeNull()
    expect(mid.retiredAt == null).toBe(false)
    expect(after.retiredAt).toBeNull()
    expect(Number(s8.step8_unretire_transcript_count)).toBeGreaterThanOrEqual(1)
  })

  it('AC-5: operational evidence has zero fictional symbol references', () => {
    const hits = scanOperationalForFictional()
    expect(hits).toEqual([])
  })

  it('AC-4: durable evidence + .tmp/S5-T4 artifacts match runId when present', () => {
    const gr = readJson(GATE_RESULTS)
    const runId = String(gr.run_id)
    expect(existsSync(EVIDENCE)).toBe(true)
    const durableCoverage = join(EVIDENCE, 'coverage-report-accepted.json')
    const durableTop50 = join(EVIDENCE, 'top50-manifest.json')
    const durablePacket = join(EVIDENCE, 'founder-gate-packet.json')
    expect(existsSync(durableCoverage)).toBe(true)
    expect(existsSync(durableTop50)).toBe(true)
    expect(existsSync(durablePacket)).toBe(true)
    expect(readFileSync(durableCoverage, 'utf-8')).toContain(runId)
    expect(readFileSync(durablePacket, 'utf-8')).toContain(runId)

    // .tmp is gitignored; when present must match
    if (existsSync(TMP_S5T4)) {
      for (const name of [
        'coverage-report-accepted.json',
        'top50-manifest.json',
        'founder-gate-packet.json',
      ]) {
        const p = join(TMP_S5T4, name)
        expect(existsSync(p), p).toBe(true)
        expect(statSync(p).size).toBeGreaterThan(0)
        expect(readFileSync(p, 'utf-8')).toContain(runId)
      }
    }
  })

  it('AC-3: sprint-goal-state batch decision=accepted; written_at_commit resolves (post-commit)', () => {
    const goal = readJson(GOAL_STATE)
    // Batch-level decision must be accepted; whole-sprint met/trunk is honest until land.
    expect(goal.decision).toBe('accepted')
    const batchDecision = goal.batch_decision as Record<string, unknown> | undefined
    if (batchDecision) {
      expect(batchDecision.decision).toBe('accepted')
      expect(Number(batchDecision.processed ?? 0)).toBeGreaterThanOrEqual(1)
      expect(Number(batchDecision.totalCostUSD ?? 0)).toBeGreaterThan(0)
    }
    const runId = String(goal.runId ?? '')
    expect(runId).toMatch(/^s5-full-batch-redhatfix09-/)
    expect(runId).not.toBe(REJECTED_RUN_ID)

    const sha = String(goal.written_at_commit ?? '')
    if (sha && sha !== 'PENDING_COMMIT' && /^[0-9a-f]{40}$/.test(sha)) {
      const out = execFileSync(
        'git',
        [
          'show',
          `${sha}:.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json`,
        ],
        { encoding: 'utf-8', cwd: ROOT },
      )
      expect(out).toContain(runId)
      expect(out).toContain('"verdict": "pass"')
      // Theatre guard on committed evidence (0.21 etc. are valid; 0 is not)
      expect(out).toMatch(/"processed":\s*[1-9]\d*/)
      const costMatch = out.match(/"totalCostUSD":\s*([0-9.]+)/)
      expect(costMatch).toBeTruthy()
      expect(Number(costMatch?.[1] ?? 0)).toBeGreaterThan(0)
    }
  })
})
