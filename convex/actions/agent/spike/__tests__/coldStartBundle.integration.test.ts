/**
 * S2-T5 — Cold-start (≤8s cloud dev) + bundle-size delta (≤10MB) ceilings test.
 *
 * This test consumes the durable evidence artifact produced by
 * `scripts/spike/measure-mastra-spike-ceilings.ts`.
 *
 * HONESTY CONTRACT (per task STRICTLY rule):
 * - After DEPENDENCY-FIX-001 trimmed vestigial externalPackages + S2-T5-COLDSTART-FIX
 *   serialized the action return, ALL ACs run and pass: coldStartMs=2165ms,
 *   bundleDeltaBytes=2904363 (2.77MB), status='pass'.
 * - A "blocker fidelity (not an AC)" describe block verifies that when evidence
 *   is incomplete, the partial-blocked state is recorded honestly (never fakes 'pass').
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

// Granular skip conditions: each AC depends on different measured numbers.
const coldStartBlocked = evidence?.coldStartMs === null
const bundleDeltaBlocked = evidence?.bundleDeltaBytes === null
const blocked = evidence?.status === 'blocked'

// When blocked, the skip reason includes the real blocker error so the test
// output visibly shows WHY the ACs are skipped (not silently passing).
const coldStartSkipReason = coldStartBlocked
  ? `SKIP — ${evidence?.blocker?.error ?? 'cold-start measurement blocked'}`
  : 'RUN'

// ---------------------------------------------------------------------------
// AC TESTS — run and pass when evidence is present (all ACs currently GREEN).
// The test.skipIf guards ensure graceful skip if evidence is ever incomplete.
// ---------------------------------------------------------------------------
describe('S2-T5 — AC tests (all run when evidence present)', () => {
  // ---- AC-1: cold-start first invocation on cloud dev within 8s -----------
  test.skipIf(coldStartBlocked)(
    `AC-1: cold-start first invocation on cloud dev is within 8s [${coldStartSkipReason}]`,
    () => {
      expect(evidence).not.toBeNull()
      const e = evidence as Evidence
      // MUST_OBSERVE: real positive number <= 8000, tagged cloud-dev.
      expect(typeof e.coldStartMs).toBe('number')
      expect(e.coldStartMs as number).toBeGreaterThan(0)
      expect(e.coldStartMs as number).toBeLessThanOrEqual(8000)
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
      expect(e.ceilings.coldStartMs).toBe(8000)
      expect(e.ceilings.bundleDeltaBytes).toBe(10485760)
      // Both numbers present and numeric.
      expect(typeof e.coldStartMs).toBe('number')
      expect(typeof e.bundleDeltaBytes).toBe('number')
      // Computed verdict: status==='pass' iff both within ceiling.
      const within = (e.coldStartMs as number) <= 8000 && (e.bundleDeltaBytes as number) <= 10485760
      expect(e.status).toBe(within ? 'pass' : 'adjust')
    },
  )
})

// ---------------------------------------------------------------------------
// BLOCKER FIDELITY (not an AC) — verifies the evidence is honest in ALL states.
// Currently fully unblocked (coldStartMs=2165). These tests do NOT satisfy
// any AC. They ensure the script never fakes 'pass' — if coldStartMs were
// ever null, the status MUST reflect 'blocked', not 'pass'.
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
      expect((e.coldStartMs as number) <= 8000).toBe(true)
      expect((e.bundleDeltaBytes as number) <= 10485760).toBe(true)
    } else {
      // Not pass — must be a real verdict with a real reason.
      expect(['blocked', 'adjust']).toContain(e.status)
    }
  })

  test('partial-blocked state honestly records: deploy success, bundle delta real, coldStart null', () => {
    expect(evidence).not.toBeNull()
    const e = evidence as Evidence
    if (blocked && coldStartBlocked) {
      // MUST_OBSERVE: status blocked + blocker recorded when coldStart is null.
      expect(e.blocker).toBeDefined()
      expect(e.blocker?.error.length).toBeGreaterThan(0)
      // MUST_NOT_OBSERVE: status==='pass' while coldStart is null.
      expect(e.status).not.toBe('pass')
      expect(e.coldStartMs).toBeNull()
      // Ceilings still pinned so the predicate is visible to the human gate.
      expect(e.ceilings.coldStartMs).toBe(8000)
      expect(e.ceilings.bundleDeltaBytes).toBe(10485760)

      // After DEPENDENCY-FIX-001: deploy attempts exit 0 (not the old
      // ModulesTooLarge failure). Bundle delta may be real even when
      // coldStart is null — both are honest.
      const allDeploysSucceeded = e.probe?.deployAttempts?.every((a) => a.exitCode === 0)
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
