/**
 * REDHAT-FIX-12 (v3): founder attestation bound to the live active-manifest gate
 * (closes the HIGH finding, review 2026-07-21T005254Z).
 *
 * The prior resolver accepted ANY latest `getCouchVerdict({})` pass row across
 * all samples — a historic/inactive pass (including one from a test/development
 * operator) could satisfy it while the authoritative `--all` gate was blocked.
 *
 * PRODUCTION CONTRACT (used by deriveGoalState via resolveFounderVerdict):
 * the attestation requires `couchGateStatus.allowed === true` for the CURRENT
 * active manifest, bound to that status's exact sampleId/manifestHash/
 * catalogVersion via a matching `getCouchVerdict({sampleId})` row recorded by a
 * requireOperator-authorized NON-test-prefixed, NON-bare (`s4-human-gate`)
 * identity. This is FAIL-CLOSED: in the dev deployment only test-prefixed
 * operators are seedable (devSetupFounderUser enforces TEST_SUBJECT_PREFIXES),
 * so resolveFounderVerdict returns present=false there and the human S4-T7 gate
 * stays pending — exactly correct, since a production closeout must come from a
 * real Founder-Operator, never a test/development identity.
 *
 * The binding DECISION is factored into the PURE `evaluateFounderAttestation`
 * helper so its logic (allowed-binding + manifest binding + non-test identity)
 * can be unit-tested with labeled synthetic inputs WITHOUT fabricating live
 * provider/founder evidence and WITHOUT affecting deriveGoalState's authority
 * (deriveGoalState's authority is driven by the live, fail-closed
 * resolveFounderVerdict, never by synthetic test inputs).
 */

import { execFileSync } from 'node:child_process'

const READER_IDENTITY = JSON.stringify({
  subject: 'gate-evidence-reader',
  issuer: 'https://laneshadow.test',
})

/** Mirrors convex/guards.ts TEST_SUBJECT_PREFIXES (test seams, never a production closeout). */
export const TEST_SUBJECT_PREFIXES = [
  's4t6-',
  's4t5-',
  's4t4-',
  's4t3-',
  's4t2-',
  's4t1-',
  'test:',
  'dev-',
] as const
const FORBIDDEN_BARE_IDENTITY = 's4-human-gate'

export interface FounderAttestation {
  present: boolean
  recordedBy: string | null
  verdict: 'pass' | 'fail' | null
  sampleId: string | null
  manifestHash: string | null
  catalogVersion: string | null
  gateAllowed: boolean
  sourceReachable: boolean
  reason: string | null
}

/** Shape of a couchGateStatus result (subset). */
export interface GateStatusRow {
  allowed?: boolean
  sampleId?: string | null
  manifestHash?: string | null
  catalogVersion?: string | null
  reason?: string | null
}

/** Shape of a getCouchVerdict row (subset). */
export interface VerdictRow {
  overallVerdict?: string
  recordedBy?: string | null
  manifestHash?: string | null
  catalogVersion?: string | null
  sampleId?: string | null
}

export function isTestSubject(clerkUserId: string): boolean {
  return TEST_SUBJECT_PREFIXES.some((p) => clerkUserId.startsWith(p))
}

function fail(reason: string, reachable = true): FounderAttestation {
  return {
    present: false,
    recordedBy: null,
    verdict: null,
    sampleId: null,
    manifestHash: null,
    catalogVersion: null,
    gateAllowed: false,
    sourceReachable: reachable,
    reason,
  }
}

/**
 * PURE binding helper — the attestation DECISION logic. Takes a couchGateStatus
 * result and a getCouchVerdict({sampleId}) row and returns the attestation.
 * No I/O, no side effects. Unit-tested with labeled synthetic inputs.
 */
export function evaluateFounderAttestation(
  status: GateStatusRow | null,
  row: VerdictRow | null,
  sourceReachable = true,
): FounderAttestation {
  if (!status || status.allowed !== true) {
    return {
      ...fail(
        typeof status?.reason === 'string' ? status.reason : 'gate_not_allowed',
        sourceReachable,
      ),
    }
  }
  const sampleId = typeof status.sampleId === 'string' ? status.sampleId : null
  // REDHAT-FIX-19: non-empty required — empty string / null / undefined fail closed.
  const nonEmpty = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)
  const manifestHash = nonEmpty(status.manifestHash)
  const catalogVersion = nonEmpty(status.catalogVersion)
  if (!sampleId)
    return { ...fail('allowed_status_missing_sampleId', sourceReachable), gateAllowed: true }

  if (!row)
    return {
      ...fail('no_verdict_row_for_active_sample', sourceReachable),
      gateAllowed: true,
      sampleId,
    }
  if (row.overallVerdict !== 'pass') {
    return {
      ...fail(`verdict_not_pass:${row.overallVerdict ?? 'null'}`, sourceReachable),
      gateAllowed: true,
      sampleId,
    }
  }
  const rowManifest = nonEmpty(row.manifestHash)
  const rowCatalog = nonEmpty(row.catalogVersion)
  // REDHAT-FIX-19: both status and row must carry non-empty matching bindings.
  // Missing either side is missing_binding (fail closed); present-but-unequal is mismatch.
  if (!manifestHash || !catalogVersion || !rowManifest || !rowCatalog) {
    return {
      ...fail('missing_binding', sourceReachable),
      gateAllowed: true,
      sampleId,
      manifestHash,
      catalogVersion,
    }
  }
  if (rowManifest !== manifestHash) {
    return {
      ...fail('manifestHash_mismatch', sourceReachable),
      gateAllowed: true,
      sampleId,
      manifestHash,
    }
  }
  if (rowCatalog !== catalogVersion) {
    return {
      ...fail('catalogVersion_mismatch', sourceReachable),
      gateAllowed: true,
      sampleId,
      manifestHash,
      catalogVersion,
    }
  }
  const recordedBy = typeof row.recordedBy === 'string' ? row.recordedBy : null
  if (!recordedBy || recordedBy === FORBIDDEN_BARE_IDENTITY) {
    return {
      ...fail('recordedBy_missing_or_bare', sourceReachable),
      gateAllowed: true,
      sampleId,
      manifestHash,
      catalogVersion,
    }
  }
  if (isTestSubject(recordedBy)) {
    return {
      ...fail(`recordedBy_test_subject:${recordedBy}`, sourceReachable),
      gateAllowed: true,
      sampleId,
      manifestHash,
      catalogVersion,
    }
  }
  return {
    present: true,
    recordedBy,
    verdict: 'pass',
    sampleId,
    manifestHash,
    catalogVersion,
    gateAllowed: true,
    sourceReachable: true,
    reason: null,
  }
}

function convexRun(
  fn: string,
  args: Record<string, unknown>,
  convexRepoCwd: string,
): Record<string, unknown> | null {
  let stdout = ''
  try {
    stdout = execFileSync(
      'npx',
      ['convex', 'run', fn, JSON.stringify(args), '--identity', READER_IDENTITY],
      { cwd: convexRepoCwd, encoding: 'utf-8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } catch {
    return null
  }
  const trimmed = stdout.trim()
  if (!trimmed) return null
  try {
    const v = JSON.parse(trimmed)
    return v === null ? null : (v as Record<string, unknown>)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * LIVE founder-attestation resolver (the production path used by deriveGoalState).
 * Reads couchGateStatus + getCouchVerdict({sampleId}) from the Convex dev
 * deployment, then delegates the binding decision to the pure helper. FAIL-CLOSED:
 * any unreachable source, non-allowed gate, unbound row, or test/bare identity
 * yields present=false. In dev this is always false (no non-test operator is
 * seedable), so the human S4-T7 gate stays pending — correct production behavior.
 */
export function resolveFounderVerdict(convexRepoCwd: string): FounderAttestation {
  const status = convexRun('couchVerdict:couchGateStatus', {}, convexRepoCwd)
  if (status === null) {
    // npx threw / timed out — source unreachable. Fail safe.
    return fail('couchGateStatus_unreachable', false)
  }
  const sampleId = typeof status.sampleId === 'string' ? status.sampleId : null
  const row = sampleId
    ? convexRun('couchVerdict:getCouchVerdict', { sampleId }, convexRepoCwd)
    : null
  return evaluateFounderAttestation(status as GateStatusRow, row as VerdictRow | null, true)
}
