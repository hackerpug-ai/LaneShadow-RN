/**
 * S2-T5 — Cold-start (≤8s cloud dev) + bundle-size delta (≤10MB) ceilings test.
 *
 * This test asserts the RECORDED numbers in the durable evidence artifact
 * against the pinned ceilings. It is an integration-tier test that consumes
 * the real recorded evidence produced by
 * `scripts/spike/measure-mastra-spike-ceilings.ts` (which attempts a real
 * `npx convex dev --once` to the cloud-dev deployment).
 *
 * HONESTY CONTRACT (per task STRICTLY rule):
 * - When the cloud-dev deploy SUCCEEDS, the evidence records real
 *   coldStartMs / bundleDeltaBytes numbers and AC-1/AC-2/AC-3 run their real
 *   assertions against the ceilings.
 * - When the cloud-dev deploy is BLOCKED (e.g. ModulesTooLarge — a real,
 *   pre-existing Convex infra defect), the evidence records status:"blocked"
 *   with null numbers and the real error. AC-1/AC-2/AC-3 are SKIPPED (not
 *   faked green) via `test.skipIf(blocked)`, and faithfulness tests verify the
 *   blocker is recorded honestly — status is NEVER 'pass' while numbers are
 *   null. This is the mandated "SKIP-with-reason (never fake success)" path.
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

// NOTE: when blocked, AC-1/AC-2/AC-3 are skipped via `test.skipIf(blocked)` —
// never faked green. The dedicated "blocked deploy records a real, non-faked
// blocker" test below asserts the blocker is recorded honestly.

describe('S2-T5 — cold-start + bundle-delta ceilings (recorded evidence)', () => {
  test('evidence artifact is present and non-empty', () => {
    // AC-3 negative control: the evidence file must not be absent/empty.
    expect(evidence, `evidence not found at ${EVIDENCE_PATH}`).not.toBeNull()
    expect(JSON.stringify(evidence).length).toBeGreaterThan(0)
  })

  // ---- AC-1: cold-start first invocation on cloud dev within 8s -----------
  test.skipIf(blocked)('cold-start first invocation on cloud dev is within 8s', () => {
    expect(evidence).not.toBeNull()
    const e = evidence as Evidence
    // MUST_OBSERVE: real positive number <= 8000, tagged cloud-dev.
    expect(typeof e.coldStartMs).toBe('number')
    expect(e.coldStartMs as number).toBeGreaterThan(0)
    expect(e.coldStartMs as number).toBeLessThanOrEqual(8000)
    expect(e.deployment).toBe('cloud-dev')
  })

  // ---- AC-2: bundle delta from @mastra/core within 10MB -------------------
  test.skipIf(blocked)('bundle delta from @mastra/core is within 10MB', () => {
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
  })

  // ---- AC-3: ceilings evidence records numbers + computed verdict ---------
  test.skipIf(blocked)(
    'ceilings evidence artifact records both numbers and a computed verdict',
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

  // ---- Faithfulness: never fake 'pass' while blocked ----------------------
  test('recorded verdict never fakes pass: status reflects real numbers', () => {
    expect(evidence).not.toBeNull()
    const e = evidence as Evidence
    // AC-3 negative control: status MUST NOT be 'pass' while a ceiling is
    // exceeded OR while the deploy was blocked (numbers null).
    if (e.status === 'pass') {
      // If we claim pass, both real numbers MUST be present and within ceiling.
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
      // (never hand-written), and at least one deploy attempt really failed.
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
    } else {
      // When unblocked, no blocker should be claimed.
      expect(e.status).not.toBe('blocked')
    }
  })
})
