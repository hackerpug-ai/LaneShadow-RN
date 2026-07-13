/**
 * S2-T5 — Cold-start (≤8s cloud dev) + bundle-size delta (≤10MB) ceilings test.
 *
 * This test consumes the durable evidence artifact produced by
 * `scripts/spike/measure-mastra-spike-ceilings.ts` — a BLOCKED PROBE that
 * attempts `npx convex dev --once` (cloud dev only, no prod deploy) and
 * records the real blocker when the deploy fails.
 *
 * HONESTY CONTRACT (per task STRICTLY rule):
 * - The cloud-dev deploy is BLOCKED by an upstream sprint configuration/
 *   dependency footprint from S2-T1/S2-T4: the @mastra/core + ai@7 +
 *   @mastra/observability + @ai-sdk/* externalPackages push the zipped
 *   module size to 62.79 MiB, exceeding Convex's 42.92 MiB ceiling.
 * - AC-1/AC-2/AC-3 are SKIPPED (not faked green) via `test.skipIf(blocked)`,
 *   with the real blocker as the skip reason. They do NOT pass.
 * - A separate "blocker fidelity (not an AC)" describe block verifies the
 *   blocker is recorded honestly — status is NEVER 'pass' while numbers are
 *   null. These fidelity tests do NOT satisfy any AC.
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
const blocked = evidence?.status === 'blocked'

// When blocked, the skip reason includes the real blocker error so the test
// output visibly shows WHY the ACs are skipped (not silently passing).
const skipReason = blocked
  ? `SKIP — ${evidence?.blocker?.error ?? 'cloud-dev deploy blocked'}`
  : 'RUN'

// ---------------------------------------------------------------------------
// AC TESTS — these SKIP (not pass) when the cloud-dev deploy is blocked.
// They only run their assertions when the deploy succeeds and real numbers
// are recorded. When blocked, vitest reports them as skipped.
// ---------------------------------------------------------------------------
describe('S2-T5 — AC tests (SKIP when cloud-dev deploy is blocked)', () => {
  // ---- AC-1: cold-start first invocation on cloud dev within 8s -----------
  test.skipIf(blocked)(
    `AC-1: cold-start first invocation on cloud dev is within 8s [${skipReason}]`,
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
  test.skipIf(blocked)(
    `AC-2: bundle delta from @mastra/core is within 10MB [${skipReason}]`,
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
  test.skipIf(blocked)(
    `AC-3: ceilings evidence artifact records both numbers and a computed verdict [${skipReason}]`,
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
// BLOCKER FIDELITY (not an AC) — verifies the blocker is recorded honestly.
// These tests do NOT satisfy any AC. They ensure the script never fakes 'pass'
// while the deploy is blocked and that the real blocker is captured.
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

  test('blocked deploy records a real, non-faked blocker with exit code + error', () => {
    expect(evidence).not.toBeNull()
    const e = evidence as Evidence
    if (blocked) {
      // MUST_OBSERVE when blocked: a real blocker is recorded, numbers are null
      // (never hand-written), and the deploy attempt really failed.
      expect(e.blocker).toBeDefined()
      expect(e.blocker?.error.length).toBeGreaterThan(0)
      expect(e.blocker?.exitCode).not.toBe(0)
      expect(e.coldStartMs).toBeNull()
      expect(e.bundleDeltaBytes).toBeNull()
      // MUST_NOT_OBSERVE: status==='pass' while blocked.
      expect(e.status).not.toBe('pass')
      // Ceilings still pinned so the predicate is visible to the human gate.
      expect(e.ceilings.coldStartMs).toBe(8000)
      expect(e.ceilings.bundleDeltaBytes).toBe(10485760)
      // A real failed deploy attempt is recorded.
      const failed = e.probe?.deployAttempts?.some((a) => a.exitCode !== 0)
      expect(failed).toBe(true)
      // Root cause must reference the upstream sprint footprint (not 'pre-existing').
      expect(e.blocker?.rootCause.toLowerCase()).toContain('upstream sprint')
    } else {
      // When unblocked, no blocker should be claimed.
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
