/**
 * S2-T5 — Cold-start (Founder-adjusted ≤10s cloud dev) + bundle-size delta (≤10MB) ceilings test.
 *
 * This test consumes the durable evidence artifact produced by
 * `scripts/spike/measure-mastra-spike-ceilings.ts`.
 *
 * HONESTY CONTRACT (per task STRICTLY rule):
 * - The original §5b default was 8s. S2-T7's Founder decision adjusted the
 *   operational ceiling to 10s; the latest fresh coldStartMs=9373ms is within
 *   that adjusted ceiling, while bundleDeltaBytes remains within 10MB.
 * - The "blocker fidelity (not an AC)" describe block is a synthetic/conditional
 *   branch check: if evidence is incomplete, it verifies that the partial-blocked
 *   state is recorded honestly (never fakes 'pass'). It is not current deployment
 *   evidence and does not replace the adjustment artifact above.
 *
 * Run: `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts`
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const EVIDENCE_PATH = resolve(
  process.cwd(),
  '.spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/evidence/s2-t5-ceilings.json',
)

type Evidence = {
  taskId: string
  deployment: string
  status: 'pass' | 'adjust' | 'blocked'
  ceilings: { coldStartMs: number; bundleDeltaBytes: number }
  originalCeilings: { coldStartMs: number; bundleDeltaBytes: number }
  founderDecision?: {
    decision?: string
    originalPinnedCeilings?: { coldStartMs?: number; bundleDeltaBytes?: number }
    adjustedCeilings?: { coldStartMs?: number; bundleDeltaBytes?: number }
  }
  coldStartMs: number | null
  bundleDeltaBytes: number | null
  baselineBytes: number | null
  postInstallBytes: number | null
  blocker?: {
    classification: string
    command: string
    exitCode: number
    error: string
    endpoint?: string
    rootCause: string
    unblockCondition: string
  }
  predicateNote: string
  probe?: {
    deployAttempts: Array<{ command: string; exitCode: number; note: string }>
  }
}

function loadEvidence(): Evidence | null {
  if (!existsSync(EVIDENCE_PATH)) return null
  const raw = readFileSync(EVIDENCE_PATH, 'utf8').trim()
  if (raw.length === 0) return null
  return JSON.parse(raw) as Evidence
}

const evidence = loadEvidence()

// Granular conditional guards: each AC depends on a different measured number.
// The current cloud-dev artifact has a measured cold-start adjustment; skip
// branches remain synthetic fallback coverage for a future incomplete measurement.
const coldStartBlocked = evidence?.coldStartMs === null
const bundleDeltaBlocked = evidence?.bundleDeltaBytes === null
const blocked = evidence?.status === 'blocked'

// When blocked, the skip reason includes the real blocker error so the test
// output visibly shows WHY the ACs are skipped (not silently passing).
const coldStartSkipReason = coldStartBlocked
  ? `SKIP — ${evidence?.blocker?.error ?? 'cold-start measurement blocked'}`
  : 'RUN'

// ---------------------------------------------------------------------------
// AC TESTS — run when evidence is present; a failing ceiling remains a real
// failed assertion rather than a synthetic pass.
// The test.skipIf guards ensure graceful skip if evidence is ever incomplete.
// ---------------------------------------------------------------------------
describe('S2-T5 — AC tests (all run when evidence present)', () => {
  // ---- AC-1: cold-start first invocation on cloud dev within adjusted 10s -
  test.skipIf(coldStartBlocked)(
    `AC-1: cold-start first invocation on cloud dev is within adjusted 10s [${coldStartSkipReason}]`,
    () => {
      expect(evidence).not.toBeNull()
      const e = evidence as Evidence
      // MUST_OBSERVE: real positive number <= adjusted 10000, tagged cloud-dev.
      expect(typeof e.coldStartMs).toBe('number')
      expect(e.coldStartMs as number).toBeGreaterThan(0)
      expect(e.coldStartMs as number).toBeLessThanOrEqual(10000)
      expect(e.deployment).toBe('cloud-dev')
    },
  )

  // ---- AC-2: bundle delta from @mastra/core within 10MB -------------------
  test.skipIf(bundleDeltaBlocked)(
    `AC-2: bundle delta from @mastra/core is within 10MB [${bundleDeltaBlocked ? 'SKIP' : 'RUN'}]`,
    () => {
      expect(evidence).not.toBeNull()
      const e = evidence as Evidence
      // MUST_OBSERVE: real positive delta <= 10485760, == post - baseline,
      // measured from the deploy artifact.
      expect(typeof e.bundleDeltaBytes).toBe('number')
      expect(e.bundleDeltaBytes as number).toBeGreaterThan(0)
      expect(e.bundleDeltaBytes as number).toBeLessThanOrEqual(10485760)
      expect(e.baselineBytes).not.toBeNull()
      expect(e.postInstallBytes).not.toBeNull()
      expect(e.bundleDeltaBytes).toBe((e.postInstallBytes as number) - (e.baselineBytes as number))
    },
  )

  // ---- AC-3: ceilings evidence records numbers + computed verdict ---------
  test.skipIf(coldStartBlocked || bundleDeltaBlocked)(
    `AC-3: ceilings evidence artifact records both numbers and a computed verdict [${coldStartBlocked || bundleDeltaBlocked ? 'SKIP — incomplete measurements' : 'RUN'}]`,
    () => {
      expect(evidence).not.toBeNull()
      const e = evidence as Evidence
      // Pinned ceilings are always recorded.
      expect(e.ceilings.coldStartMs).toBe(10000)
      expect(e.ceilings.bundleDeltaBytes).toBe(10485760)
      // Founder audit metadata must survive any subsequent measurement rewrite.
      expect(e.originalCeilings.coldStartMs).toBe(8000)
      expect(e.originalCeilings.bundleDeltaBytes).toBe(10485760)
      expect(e.founderDecision?.decision).toBe('accept_adjustment')
      expect(e.founderDecision?.originalPinnedCeilings?.coldStartMs).toBe(8000)
      expect(e.founderDecision?.adjustedCeilings?.coldStartMs).toBe(10000)
      // Both numbers present and numeric.
      expect(typeof e.coldStartMs).toBe('number')
      expect(typeof e.bundleDeltaBytes).toBe('number')
      // Computed verdict: status==='pass' iff both within ceiling.
      const within =
        (e.coldStartMs as number) <= 10000 &&
        (e.bundleDeltaBytes as number) > 0 &&
        (e.bundleDeltaBytes as number) <= 10485760
      expect(e.status).toBe(within ? 'pass' : 'adjust')
    },
  )
})

// ---------------------------------------------------------------------------
// BLOCKER FIDELITY (not an AC) — synthetic/conditional checks that verify the
// evidence is honest in ALL states. The current cold-start measurement is an
// adjustment (9373ms > original 8000ms, but <= Founder-adjusted 10000ms).
// These tests do NOT satisfy any AC or provide current deployment evidence.
// They ensure the script never fakes 'pass' — if coldStartMs were ever null,
// the status MUST reflect 'blocked', not 'pass'.
// ---------------------------------------------------------------------------
describe('blocker fidelity (not an AC)', () => {
  test('evidence artifact is present and non-empty', () => {
    // Precondition: the evidence file must exist and have content.
    expect(evidence, `evidence not found at ${EVIDENCE_PATH}`).not.toBeNull()
    expect(JSON.stringify(evidence).length).toBeGreaterThan(0)
  })

  test('recorded verdict never fakes pass: status reflects real numbers', () => {
    expect(evidence).not.toBeNull()
    const e = evidence as Evidence
    // If we claim pass, both real numbers MUST be present and within ceiling.
    if (e.status === 'pass') {
      expect(typeof e.coldStartMs).toBe('number')
      expect(typeof e.bundleDeltaBytes).toBe('number')
      expect((e.coldStartMs as number) <= 10000).toBe(true)
      expect((e.bundleDeltaBytes as number) > 0).toBe(true)
      expect((e.bundleDeltaBytes as number) <= 10485760).toBe(true)
    } else {
      // Not pass — must be a real verdict with a real reason.
      expect(['blocked', 'adjust']).toContain(e.status)
    }
  })

  test('partial-blocked state honestly records: deploy success, bundle delta real, coldStart null', () => {
    expect(evidence).not.toBeNull()
    const e = evidence as Evidence
    const allDeploysSucceeded = e.probe?.deployAttempts?.every((a) => a.exitCode === 0)
    if (blocked && coldStartBlocked && allDeploysSucceeded) {
      // MUST_OBSERVE: status blocked + blocker recorded when coldStart is null.
      expect(e.blocker).toBeDefined()
      expect(e.blocker?.error.length).toBeGreaterThan(0)
      // MUST_NOT_OBSERVE: status==='pass' while coldStart is null.
      expect(e.status).not.toBe('pass')
      expect(e.coldStartMs).toBeNull()
      // Ceilings still pinned so the predicate is visible to the human gate.
      expect(e.ceilings.coldStartMs).toBe(10000)
      expect(e.ceilings.bundleDeltaBytes).toBe(10485760)

      // After DEPENDENCY-FIX-001: deploy attempts exit 0 (not the old
      // ModulesTooLarge failure). Bundle delta may be real even when
      // coldStart is null — both are honest.
      expect(allDeploysSucceeded).toBe(true)

      // Bundle delta is real and within ceiling (partial measurement success).
      if (e.bundleDeltaBytes !== null) {
        expect(e.bundleDeltaBytes).toBeGreaterThan(0)
        expect(e.bundleDeltaBytes as number).toBeLessThanOrEqual(10485760)
        expect(e.baselineBytes).not.toBeNull()
        expect(e.postInstallBytes).not.toBeNull()
        expect(e.bundleDeltaBytes).toBe(
          (e.postInstallBytes as number) - (e.baselineBytes as number),
        )
      }
    } else if (blocked) {
      // Any blocked measurement (including a failed baseline restore after a
      // real cold-start) must retain a real blocker instead of being treated
      // as a completed pass.
      expect(e.status).toBe('blocked')
      expect(e.blocker).toBeDefined()
      expect(e.blocker?.error.length).toBeGreaterThan(0)
    } else {
      // When fully unblocked, no blocker should be claimed.
      expect(e.status).not.toBe('blocked')
    }
  })

  test('no production deploy attempt is recorded (prod is out of scope)', () => {
    expect(evidence).not.toBeNull()
    const e = evidence as Evidence
    // The only deploy attempt should be `npx convex dev --once` (cloud dev).
    // No production deploy command should appear in the evidence.
    const hasProdDeploy = e.probe?.deployAttempts?.some(
      (a) => a.command.includes('deploy') && !a.command.includes('dev'),
    )
    expect(hasProdDeploy).toBe(false)
  })
})
